import { NextResponse } from "next/server";
import { tripFormSchema } from "@/lib/trip/schema";
import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/lib/auth/sync-user";
import { checkPlanUsage, incrementPlanUsage } from "@/lib/auth/usage";
import { db } from "@/db";
import { plans, preferenceSnapshots, trips } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = tripFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid trip parameters",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to create a trip" },
      { status: 401 }
    );
  }

  const appUser = await syncUser(user);

  const usage = await checkPlanUsage(appUser.id);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `You've reached the free limit of ${usage.limit} plans per month. Upgrade to create more.`,
        code: "plan_limit_reached",
        usage,
      },
      { status: 429 }
    );
  }

  try {
    const [trip] = await db
      .insert(trips)
      .values({
        userId: appUser.id,
        destination: parsed.data.destination,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        partySize: parsed.data.partySize,
        travelStyle: parsed.data.travelStyle,
        budgetType: parsed.data.budgetType,
        budgetAmount:
          parsed.data.budgetType === "fixed" ? parsed.data.budgetAmount : null,
        currency: parsed.data.currency,
      })
      .returning();

    await db.insert(preferenceSnapshots).values({
      tripId: trip.id,
      interests: parsed.data.interests,
      pace: parsed.data.pace,
    });

    const [plan] = await db
      .insert(plans)
      .values({
        tripId: trip.id,
        status: "queued",
        stage: "queued",
        input: parsed.data as unknown,
      })
      .returning();

    await incrementPlanUsage(appUser.id);
    const usageAfter = await checkPlanUsage(appUser.id);

    return NextResponse.json({
      ok: true,
      tripId: trip.id,
      planId: plan.id,
      status: "queued",
      saved: true,
      usage: usageAfter,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start generation";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}