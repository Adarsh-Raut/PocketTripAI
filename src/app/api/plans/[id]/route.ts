import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { plans, trips } from "@/db/schema";
import { computeBudget } from "@/lib/budget/engine";
import { calcDays } from "@/lib/trip/generate";
import { checkBudgetFit } from "@/lib/trip/budget-fit";
import { checkPlanUsage } from "@/lib/auth/usage";
import type { Itinerary } from "@/lib/trip/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to check your plan" },
      { status: 401 }
    );
  }

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, id))
    .limit(1);

  if (!plan) {
    return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
  }

  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, plan.tripId))
    .limit(1);

  if (!trip || trip.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
  }

  const base = {
    ok: true,
    status: plan.status,
    stage: plan.stage,
  };

  if (plan.status !== "completed") {
    if (plan.status === "failed") {
      return NextResponse.json({
        ...base,
        error: plan.errorMessage ?? "Generation failed",
      });
    }
    return NextResponse.json(base);
  }

  const itinerary = plan.itinerary as Itinerary;
  const days = calcDays(trip.startDate, trip.endDate);
  const budget = computeBudget({
    destination: trip.destination,
    days,
    partySize: trip.partySize,
    travelStyle: trip.travelStyle,
    currency: trip.budgetType === "fixed" ? trip.currency : undefined,
    availableBudget:
      trip.budgetType === "fixed" && trip.budgetAmount
        ? Number(trip.budgetAmount)
        : undefined,
  });
  const budgetFit = checkBudgetFit(itinerary, {
    budgetType: trip.budgetType,
    budgetAmount: trip.budgetAmount ?? undefined,
    partySize: trip.partySize,
  });
  const usage = await checkPlanUsage(user.id);

  return NextResponse.json({
    ...base,
    usage,
    result: {
      itinerary,
      budget,
      budgetFit,
      saved: true,
    },
  });
}