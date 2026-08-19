import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { User } from "@supabase/supabase-js";

export async function syncUser(authUser: User) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email: authUser.email ?? "",
      name: (authUser.user_metadata?.name as string) ?? null,
    })
    .onConflictDoNothing()
    .returning();

  return created ?? existing;
}