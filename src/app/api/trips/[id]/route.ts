import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { plans, trips } from "@/db/schema";
import { itinerarySchema } from "@/lib/trip/schema";
import { itineraryTotalCost } from "@/lib/trip/budget-fit";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = itinerarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid itinerary", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to save changes" },
      { status: 401 }
    );
  }

  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, id))
    .limit(1);

  if (!trip || trip.userId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Trip not found" },
      { status: 404 }
    );
  }

  const plan = await db.query.plans.findFirst({
    where: (p, { eq: eqOp }) => eqOp(p.tripId, trip.id),
    orderBy: (p, { desc: descOp }) => [descOp(p.createdAt)],
  });

  if (!plan) {
    return NextResponse.json(
      { ok: false, error: "No plan found for this trip" },
      { status: 404 }
    );
  }

  const itinerary = parsed.data;
  await db
    .update(plans)
    .set({
      itinerary: itinerary as unknown,
      totalCost: itineraryTotalCost(itinerary).toString(),
    })
    .where(eq(plans.id, plan.id));

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}