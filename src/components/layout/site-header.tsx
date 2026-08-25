import { createClient } from "@/lib/supabase/server";
import { getSubscriptionTier } from "@/lib/auth/usage";
import { Logo } from "@/components/layout/logo";
import { HeaderNav } from "@/components/layout/header-nav";

export async function SiteHeader() {
  let email: string | null = null;
  let isPro = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
    if (user) {
      isPro = (await getSubscriptionTier(user.id)) === "pro";
    }
  } catch {
    email = null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <HeaderNav email={email} isPro={isPro} />
      </div>
    </header>
  );
}