import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  DEV_LOGIN_COOKIE,
  DEV_LOGIN_ENABLED,
  devUserFromEmail,
} from "@/lib/auth/dev-login";

export async function createClient() {
  const cookieStore = await cookies();

  if (DEV_LOGIN_ENABLED) {
    const devUser = devUserFromEmail(cookieStore.get(DEV_LOGIN_COOKIE)?.value);
    if (devUser) {
      // Minimal stand-in for the parts of supabase.auth the app uses.
      return {
        auth: {
          getUser: async () => ({ data: { user: devUser }, error: null }),
          signOut: async () => {
            cookieStore.delete(DEV_LOGIN_COOKIE);
            return { error: null };
          },
          exchangeCodeForSession: async () => ({ error: null }),
        },
      } as unknown as ReturnType<typeof createServerClient>;
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; middleware refreshes sessions.
          }
        },
      },
    }
  );
}