import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEV_LOGIN_COOKIE, devUserFromEmail } from "@/lib/auth/dev-login";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const devUser = devUserFromEmail(request.cookies.get(DEV_LOGIN_COOKIE)?.value);
  const user = devUser ?? (await supabase.auth.getUser()).data.user;

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname === "/plan" || pathname.startsWith("/plan/") || pathname.startsWith("/trips");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/trips";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};