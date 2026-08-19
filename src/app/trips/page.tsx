import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/lib/auth/sync-user";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "My trips — PocketTripAI",
};

const styleLabel: Record<string, string> = {
  budget: "Budget",
  standard: "Standard",
  comfort: "Comfort",
  luxury: "Luxury",
};

function formatRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${startDate.toLocaleDateString(undefined, options)} – ${endDate.toLocaleDateString(undefined, options)}`;
}

export default async function TripsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const appUser = await syncUser(user);

  const myTrips = await db.query.trips.findMany({
    where: (t, { eq }) => eq(t.userId, appUser.id),
    orderBy: [desc(trips.createdAt)],
    with: {
      plans: true,
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your saved AI itineraries.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/plan" />}>Plan a new trip</Button>
      </div>

      {myTrips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No trips yet</CardTitle>
            <CardDescription>
              Plan your first trip and it will show up here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/plan" />}>Plan a trip</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myTrips.map((trip) => {
            const plan = trip.plans[0];
            return (
              <Card key={trip.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle>{trip.destination}</CardTitle>
                    <Badge variant="outline">
                      {styleLabel[trip.travelStyle]}
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatRange(trip.startDate, trip.endDate)} ·{" "}
                    {trip.partySize}{" "}
                    {trip.partySize === 1 ? "traveler" : "travelers"}
                    {trip.budgetAmount
                      ? ` · ${trip.budgetAmount} ${trip.currency} budget`
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {plan && plan.status === "completed"
                      ? plan.totalCost
                        ? `Est. ${plan.totalCost} ${trip.currency} total`
                        : "Itinerary ready"
                      : "Plan in progress"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`/trips/${trip.id}`} />}
                  >
                    View itinerary
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}