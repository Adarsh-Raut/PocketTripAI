import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionTier } from "@/lib/auth/usage";
import { TripForm } from "@/components/onboarding/trip-form";

export const metadata: Metadata = {
  title: "Plan your trip — PocketTripAI",
  description:
    "Tell us where you want to go, how long you'll stay, and what you can spend. We'll build your itinerary.",
};

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPro = user ? (await getSubscriptionTier(user.id)) === "pro" : false;

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Let&apos;s plan your trip
        </h1>
        <p className="mt-3 text-muted-foreground">
          A few quick questions — then our AI builds a day-by-day plan that fits
          your budget.
        </p>
      </div>
      <TripForm isPro={isPro} />
    </main>
  );
}