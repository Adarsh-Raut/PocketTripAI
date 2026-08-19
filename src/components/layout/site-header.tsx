import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export async function SiteHeader() {
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  } catch {
    email = null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-sm font-semibold">
          PocketTripAI
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/plan"
            className="px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Plan a trip
          </Link>
          <Link
            href="/pricing"
            className="px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          {email ? (
            <>
              <Link
                href="/trips"
                className="px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                My trips
              </Link>
              <span className="hidden px-3 text-sm text-muted-foreground sm:inline">
                {email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button nativeButton={false} render={<Link href="/signup" />}>
                Sign up
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}