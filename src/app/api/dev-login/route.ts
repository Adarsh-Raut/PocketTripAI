import { NextResponse } from "next/server";
import { DEV_LOGIN_COOKIE, DEV_LOGIN_ENABLED } from "@/lib/auth/dev-login";

export const dynamic = "force-dynamic";

// GET /api/dev-login?email=demo@example.com&next=/trips — local development only.
export async function GET(request: Request) {
  if (!DEV_LOGIN_ENABLED) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  const { searchParams, origin } = new URL(request.url);
  const email = searchParams.get("email") ?? "demo@example.com";
  const next = searchParams.get("next") ?? "/trips";
  const res = NextResponse.redirect(
    new URL(next.startsWith("/") ? next : "/trips", origin)
  );
  res.cookies.set(DEV_LOGIN_COOKIE, email, { path: "/", httpOnly: true, sameSite: "lax" });
  return res;
}
