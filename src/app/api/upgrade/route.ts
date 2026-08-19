import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/lib/auth/sync-user";
import { db } from "@/db";
import { users } from "@/db/schema";
import { checkPlanUsage } from "@/lib/auth/usage";

export const dynamic = "force-dynamic";

const DEV_UPGRADE_ENABLED =
  process.env.NODE_ENV !== "production" || process.env.UPGRADE_BYPASS === "true";

export async function POST() {
  if (!DEV_UPGRADE_ENABLED) {
    return NextResponse.json(
      { ok: false, error: "Payments are not configured yet" },
      { status: 501 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to upgrade" },
      { status: 401 }
    );
  }

  const appUser = await syncUser(user);
  await db
    .update(users)
    .set({ subscriptionTier: "pro" })
    .where(eq(users.id, appUser.id));

  const usage = await checkPlanUsage(appUser.id);

  return NextResponse.json({
    ok: true,
    tier: "pro",
    usage,
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to manage your plan" },
      { status: 401 }
    );
  }

  const appUser = await syncUser(user);
  await db
    .update(users)
    .set({ subscriptionTier: "free" })
    .where(eq(users.id, appUser.id));

  const usage = await checkPlanUsage(appUser.id);

  return NextResponse.json({ ok: true, tier: "free", usage });
}