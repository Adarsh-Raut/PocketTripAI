import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { ArrowRight, CalendarDays, Compass, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/lib/auth/sync-user";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My trips — PocketTripAI",
};

const styleLabel: Record<string, string> = {
  budget: "Budget",
  standard: "Standard",
  comfort: "Comfort",
  luxury: "Luxury",
};

const styleChip: Record<string, string> = {
  budget: "bg-forest/10 text-forest dark:text-sage",
  standard: "bg-olive/15 text-olive dark:text-olive",
  comfort: "bg-ochre/10 text-ochre",
  luxury: "bg-terracotta/10 text-terracotta",
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

function planBadge(status: string | undefined) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest dark:bg-sage/10 dark:text-sage">
          <span className="size-1.5 rounded-full bg-current" />
          Itinerary ready
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-medium text-terracotta">
          <span className="size-1.5 rounded-full bg-current" />
          Generation failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ochre/10 px-2.5 py-1 text-xs font-medium text-ochre">
          <span className="size-1.5 animate-pulse rounded-full bg-current" />
          Generating…
        </span>
      );
  }
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your saved AI itineraries.
          </p>
        </div>
        <Button
          className="rounded-full"
          nativeButton={false}
          render={<Link href="/plan" />}
        >
          Plan a new trip
        </Button>
      </div>

      {myTrips.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-20 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-forest/10 text-forest dark:bg-sage/10 dark:text-sage">
            <Compass className="size-7" />
          </span>
          <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight">
            No trips yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Tell us where you&apos;re headed and what you can spend — your first
            AI itinerary will show up here in minutes.
          </p>
          <Button
            className="mt-6 rounded-full"
            nativeButton={false}
            render={<Link href="/plan" />}
          >
            Plan your first trip
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myTrips.map((trip) => {
            const plan = trip.plans[0];
            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forest to-forest-dark font-heading text-lg font-semibold text-cream">
                      {trip.destination.charAt(0).toUpperCase()}
                    </span>
                    <h2 className="font-heading text-xl font-semibold tracking-tight">
                      {trip.destination}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${styleChip[trip.travelStyle]}`}
                  >
                    {styleLabel[trip.travelStyle]}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-3.5" />
                    {formatRange(trip.startDate, trip.endDate)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="size-3.5" />
                    {trip.partySize}{" "}
                    {trip.partySize === 1 ? "traveler" : "travelers"}
                    {trip.budgetAmount
                      ? ` · ${trip.budgetAmount} ${trip.currency} budget`
                      : ""}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                  {planBadge(plan?.status)}
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-forest transition-transform group-hover:translate-x-0.5 dark:text-sage">
                    {plan && plan.status === "completed"
                      ? "View plan"
                      : "Open trip"}
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}