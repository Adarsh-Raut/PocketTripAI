import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { generateItinerary } from "@/lib/trip/generate";
import { tripFormSchema, type TripFormValues } from "@/lib/trip/schema";
import { itineraryTotalCost } from "@/lib/trip/budget-fit";
import { refundPlanUsage } from "@/lib/auth/usage";

// Generation runs inside `after()` on the request that created the plan, so it
// works on serverless hosts (Vercel) as well as a long-running Node server.
// The route that schedules it must export `maxDuration` >= GENERATION_TIMEOUT_MS.
export const GENERATION_TIMEOUT_MS = 5 * 60 * 1000;
const STALE_GENERATING_MS = GENERATION_TIMEOUT_MS + 60 * 1000;
const STALE_QUEUED_MS = 2 * 60 * 1000;

/**
 * Marks a plan failed and refunds the reserved free-plan slot. The status
 * guard makes it safe to call from several places: only the call that actually
 * flips the row refunds, so a slot can never be refunded twice.
 */
export async function failPlan(
  planId: string,
  userId: string,
  message: string
): Promise<boolean> {
  const [failed] = await db
    .update(plans)
    .set({ status: "failed", stage: null, errorMessage: message })
    .where(
      and(eq(plans.id, planId), inArray(plans.status, ["queued", "generating"]))
    )
    .returning({ id: plans.id });
  if (!failed) return false;
  await refundPlanUsage(userId);
  return true;
}

/** Claims the given queued plan and generates its itinerary. */
export async function processPlan(planId: string): Promise<void> {
  const queued = await db.query.plans.findFirst({
    where: (p, { eq: eqOp }) => eqOp(p.id, planId),
    with: { trip: true },
  });
  if (!queued?.trip) return;

  const [claimed] = await db
    .update(plans)
    .set({ status: "generating", startedAt: new Date(), stage: "generating" })
    .where(and(eq(plans.id, planId), eq(plans.status, "queued")))
    .returning();
  if (!claimed) return;

  const userId = queued.trip.userId;
  const parsed = tripFormSchema.safeParse(claimed.input);
  if (!parsed.success) {
    await failPlan(planId, userId, "Invalid stored trip input");
    return;
  }

  const stageWrites: Promise<unknown>[] = [];
  try {
    const result = await generateItinerary(parsed.data as TripFormValues, {
      onStage: (stage) => {
        stageWrites.push(
          db.update(plans).set({ stage }).where(eq(plans.id, planId)).catch(() => {})
        );
      },
    });
    // Let in-flight stage updates land first so they can't overwrite "completed".
    await Promise.all(stageWrites);

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
      .where(and(eq(plans.id, planId), eq(plans.status, "generating")));
  } catch (error) {
    await Promise.all(stageWrites);
    const message =
      error instanceof Error ? error.message : "Itinerary generation failed";
    await failPlan(planId, userId, message);
  }
}

/**
 * If the function that was generating this plan died (timeout, redeploy) the
 * row would stay "generating" forever. Called while the client polls, this
 * fails and refunds such plans. Returns the error message if it did.
 */
export async function failIfStale(plan: {
  id: string;
  status: string;
  createdAt: Date;
  startedAt: Date | null;
}, userId: string): Promise<string | null> {
  const now = Date.now();
  let message: string | null = null;
  if (
    plan.status === "generating" &&
    plan.startedAt &&
    now - plan.startedAt.getTime() > STALE_GENERATING_MS
  ) {
    message = "Generation took too long. Please try again.";
  } else if (
    plan.status === "queued" &&
    now - plan.createdAt.getTime() > STALE_QUEUED_MS
  ) {
    message = "Generation didn't start. Please try again.";
  }
  if (!message) return null;
  await failPlan(plan.id, userId, message);
  return message;
}
