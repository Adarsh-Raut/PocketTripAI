import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const FREE_PLAN_LIMIT = 2;

export async function getSubscriptionTier(userId: string): Promise<"free" | "pro"> {
  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.subscriptionTier === "pro" ? "pro" : "free";
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function checkPlanUsage(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      planCounter: users.planCounter,
      planMonth: users.planMonth,
      subscriptionTier: users.subscriptionTier,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.subscriptionTier !== "free") {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, limit: 0 };
  }

  const month = currentMonth();
  const count = user.planMonth === month ? user.planCounter : 0;
  return {
    allowed: count < FREE_PLAN_LIMIT,
    remaining: Math.max(0, FREE_PLAN_LIMIT - count),
    limit: FREE_PLAN_LIMIT,
  };
}

export async function incrementPlanUsage(userId: string) {
  const month = currentMonth();
  await db
    .insert(users)
    .values({
      id: userId,
      email: "",
      planCounter: 1,
      planMonth: month,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        planCounter: sql`CASE WHEN ${users.planMonth} = ${month} THEN ${users.planCounter} + 1 ELSE 1 END`,
        planMonth: month,
      },
    });
}

export async function refundPlanUsage(userId: string) {
  const month = currentMonth();
  await db
    .update(users)
    .set({
      planCounter: sql`CASE
        WHEN ${users.planMonth} = ${month} THEN GREATEST(${users.planCounter} - 1, 0)
        ELSE ${users.planCounter}
      END`,
    })
    .where(eq(users.id, userId));
}