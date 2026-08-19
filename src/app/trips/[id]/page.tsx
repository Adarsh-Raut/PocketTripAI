import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { computeBudget } from "@/lib/budget/engine";
import { SavedItinerary } from "@/components/onboarding/saved-itinerary";
import { Button } from "@/components/ui/button";
import type { Itinerary } from "@/lib/trip/schema";

export const metadata: Metadata = {
  title: "Trip itinerary — PocketTripAI",
};

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, id))
    .limit(1);

  if (!trip || trip.userId !== user.id) {
    notFound();
  }

  const plan = await db.query.plans.findFirst({
    where: (p, { eq }) => eq(p.tripId, trip.id),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });

  if (!plan?.itinerary || plan.status !== "completed") {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold">{trip.destination}</h1>
        <p className="mt-2 text-muted-foreground">
          This itinerary isn&apos;t ready yet.
        </p>
      </main>
    );
  }

  const days = Math.round(
    (new Date(trip.endDate).getTime() -
      new Date(trip.startDate).getTime()) /
      86_400_000
  ) + 1;

  const budget = computeBudget({
    destination: trip.destination,
    days,
    partySize: trip.partySize,
    travelStyle: trip.travelStyle,
    currency: trip.budgetType === "fixed" ? trip.currency : undefined,
  });

  const hardBudgetPerPerson =
    trip.budgetType === "fixed" && trip.budgetAmount
      ? Number(trip.budgetAmount) / trip.partySize
      : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {trip.destination}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {trip.startDate} → {trip.endDate} ·{" "}
            {trip.partySize} {trip.partySize === 1 ? "traveler" : "travelers"}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/trips">Back to my trips</Link>}
        />
      </div>
      <SavedItinerary
        tripId={trip.id}
        initialItinerary={plan.itinerary as Itinerary}
        budget={budget}
        hardBudgetPerPerson={hardBudgetPerPerson}
      />
    </main>
  );
}