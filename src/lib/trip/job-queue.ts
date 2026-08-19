import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { generateItinerary } from "@/lib/trip/generate";
import { tripFormSchema, type TripFormValues } from "@/lib/trip/schema";
import { itineraryTotalCost } from "@/lib/trip/budget-fit";
import { refundPlanUsage } from "@/lib/auth/usage";

const STALE_GENERATING_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;
const RECOVER_INTERVAL_MS = 60_000;

export async function processNextJob(): Promise<void> {
  const queued = await db.query.plans.findFirst({
    where: (p, { eq: eqOp }) => eqOp(p.status, "queued"),
    orderBy: (p, { asc }) => [asc(p.createdAt)],
    with: { trip: true },
  });
  if (!queued?.trip) return;

  const [claimed] = await db
    .update(plans)
    .set({
      status: "generating",
      startedAt: new Date(),
      stage: "generating",
    })
    .where(and(eq(plans.id, queued.id), eq(plans.status, "queued")))
    .returning();

  if (!claimed) return;

  const parsed = tripFormSchema.safeParse(claimed.input);
  if (!parsed.success) {
    await db
      .update(plans)
      .set({ status: "failed", errorMessage: "Invalid stored trip input" })
      .where(eq(plans.id, claimed.id));
    await refundPlanUsage(queued.trip.userId);
    return;
  }

  try {
    const result = await generateItinerary(parsed.data as TripFormValues, {
      onStage: (stage) => {
        void db
          .update(plans)
          .set({ stage })
          .where(eq(plans.id, claimed.id));
      },
    });

    const totalCost = result.budget.ok
      ? result.budget.total.toString()
      : itineraryTotalCost(result.itinerary).toString();

    await db
      .update(plans)
      .set({
        status: "completed",
        stage: null,
        totalCost,
        itinerary: result.itinerary as unknown,
        errorMessage: null,
      })
      .where(eq(plans.id, claimed.id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Itinerary generation failed";
    await db
      .update(plans)
      .set({ status: "failed", stage: null, errorMessage: message })
      .where(eq(plans.id, claimed.id));
    await refundPlanUsage(queued.trip.userId);
  }
}

export async function recoverStalePlans(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_GENERATING_MS);
  await db
    .update(plans)
    .set({
      status: "failed",
      stage: null,
      errorMessage: "Generation interrupted by a server restart",
    })
    .where(and(eq(plans.status, "generating"), lt(plans.startedAt, cutoff)));
}

let workerStarted = false;

export function startWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  void recoverStalePlans();
  setInterval(() => {
    void processNextJob().catch(() => {});
  }, POLL_INTERVAL_MS);
  setInterval(() => {
    void recoverStalePlans().catch(() => {});
  }, RECOVER_INTERVAL_MS);
}