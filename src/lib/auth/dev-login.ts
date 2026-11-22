import { createHash } from "node:crypto";
import type { User } from "@supabase/supabase-js";

// Local-only login that bypasses Supabase. Never active in production builds
// (NODE_ENV) and needs DEV_LOGIN=1 in .env.local.
export const DEV_LOGIN_ENABLED =
  process.env.NODE_ENV === "development" && process.env.DEV_LOGIN === "1";

export const DEV_LOGIN_COOKIE = "dev-login-email";

/** Stable UUID per email so the same dev user maps to the same DB row. */
function uuidFromEmail(email: string): string {
  const h = createHash("sha1").update(`pockettripai:${email}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function devUserFromEmail(email: string | undefined): User | null {
  if (!DEV_LOGIN_ENABLED || !email) return null;
  return {
    id: uuidFromEmail(email),
    email,
    app_metadata: {},
    user_metadata: { name: email.split("@")[0] },
    aud: "authenticated",
    created_at: new Date(0).toISOString(),
  } as User;
}
