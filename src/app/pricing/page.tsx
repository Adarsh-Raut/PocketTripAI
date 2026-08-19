import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/lib/auth/sync-user";
import { checkPlanUsage } from "@/lib/auth/usage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UpgradeButton } from "@/components/pricing/upgrade-button";

export const metadata: Metadata = {
  title: "Pricing — PocketTripAI",
};

const freeFeatures = [
  "2 AI plans per month",
  "Unlimited itinerary editing",
  "Budget dashboard & fit checks",
  "Markdown export",
];

const proFeatures = [
  "Unlimited AI plans",
  "Priority generation",
  "PDF export (coming soon)",
  "Everything in Free",
];

export default async function PricingPage() {
  let user = null;
  let tier: string | null = null;
  let remaining: number | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      const appUser = await syncUser(authUser);
      user = authUser;
      tier = appUser.subscriptionTier;
      const usage = await checkPlanUsage(appUser.id);
      remaining = Number.isFinite(usage.remaining)
        ? usage.remaining
        : null;
    }
  } catch {
    user = null;
  }

  const isPro = tier === "pro";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-14">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple, honest pricing
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Try PocketTripAI free. Upgrade when you need unlimited AI plans and
          priority generation.
        </p>
      </div>

      {user && (
        <div className="mt-8 flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
          <span className="text-muted-foreground">Your plan:</span>
          <Badge variant={isPro ? "default" : "outline"}>
            {isPro ? "Pro" : "Free"}
          </Badge>
          {!isPro && remaining !== null && (
            <span className="text-muted-foreground">
              · {remaining} free plan{remaining === 1 ? "" : "s"} left this
              month
            </span>
          )}
        </div>
      )}

      <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Free
              {user && !isPro && <Badge variant="outline">Current</Badge>}
            </CardTitle>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">₹0</span>
              <span className="text-sm text-muted-foreground">/ forever</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {user ? (
                <p className="text-center text-xs text-muted-foreground">
                  {isPro
                    ? "You're on Pro — enjoy unlimited plans"
                    : "You're on the Free plan"}
                </p>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/signup" />}
                >
                  Sign up free
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative rounded-3xl border-primary/40 shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="gap-1">
              <Sparkles className="h-3 w-3" />
              Most popular
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Pro
              <Zap className="h-4 w-4 text-primary" />
            </CardTitle>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">₹299</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {isPro ? (
                <Button disabled className="w-full">
                  You&apos;re on Pro
                </Button>
              ) : user ? (
                <UpgradeButton />
              ) : (
                <Button
                  className="w-full gap-2"
                  nativeButton={false}
                  render={<Link href="/login?next=/pricing" />}
                >
                  Sign in to upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-10 max-w-md text-center text-xs text-muted-foreground">
        Payments are being set up — upgrading right now activates a preview
        Pro plan for free. No charges yet.
      </p>
    </main>
  );
}