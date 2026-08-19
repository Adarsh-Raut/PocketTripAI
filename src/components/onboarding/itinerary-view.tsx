"use client";

import {
  BadgeCheck,
  BedDouble,
  MapPin,
  Plane,
  Sparkles,
  Utensils,
  Wallet,
} from "lucide-react";
import type { Itinerary } from "@/lib/trip/schema";
import type { ComputeBudgetResult } from "@/lib/budget/engine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categoryColor: Record<string, string> = {
  attraction: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  food: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  transport: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  free: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

function money(value: number, currency: string) {
  return `${numberFormat.format(value)} ${currency}`;
}

export function ItineraryView({
  itinerary,
  budget,
}: {
  itinerary: Itinerary;
  budget: ComputeBudgetResult;
}) {
  const currency: string = budget.ok ? budget.currency : "USD";
  const totalCost = itinerary.daysPlan.reduce(
    (sum, day) =>
      sum +
      day.activities.reduce((acc, act) => acc + act.cost, 0),
    0
  );
  const fitsBudget = budget.ok ? budget.fitsBudget : undefined;
  const budgetTotal = budget.ok ? budget.total : undefined;
  const bufferAmount = budget.ok ? budget.buffer : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-3xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {itinerary.destination}
            </h2>
            <p className="text-sm text-muted-foreground">
              {itinerary.days} days · {itinerary.partySize}{" "}
              traveler{itinerary.partySize > 1 ? "s" : ""} ·{" "}
              {itinerary.travelStyle}
            </p>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground">{itinerary.summary}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Daily budget
              </div>
              <p className="mt-1 text-xl font-semibold">
                {money(itinerary.dailyBudgetPerPerson, currency)}
              </p>
              <p className="text-xs text-muted-foreground">per person / day</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Plane className="h-4 w-4" />
                Est. activities spend
              </div>
              <p className="mt-1 text-xl font-semibold">
                {money(totalCost, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                activities only (excl. lodging)
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {fitsBudget ? (
                  <BadgeCheck className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Estimated total
              </div>
              <p className="mt-1 text-xl font-semibold">
                {budgetTotal ? money(budgetTotal, currency) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                incl. {bufferAmount ? money(bufferAmount, currency) : ""}{" "}
                buffer
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {itinerary.daysPlan.map((day) => {
          const dayCost = day.activities.reduce((sum, act) => sum + act.cost, 0);
          return (
            <Card key={day.dayNumber} className="overflow-hidden rounded-3xl">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {day.dayNumber}
                    </span>
                    Day {day.dayNumber} — {day.date}
                  </CardTitle>
                  <Badge variant="outline">
                    {money(dayCost, currency)} activities
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {day.summary}
                </p>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BedDouble className="h-4 w-4" />
                    <span className="font-medium text-foreground">Stay:</span>
                    {day.lodging}
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Utensils className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">
                        Meals:
                      </span>{" "}
                      {day.meals.join(" · ")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {day.activities.map((activity, index) => (
                    <div
                      key={`${activity.time}-${index}`}
                      className="flex gap-3 rounded-xl border p-3"
                    >
                      <div className="flex w-12 shrink-0 justify-center pt-0.5">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {activity.time}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{activity.title}</span>
                          <Badge
                            className={
                              categoryColor[activity.category] ??
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {activity.category}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-semibold">
                          {activity.cost === 0 ? (
                            <span className="text-emerald-500">Free</span>
                          ) : (
                            money(activity.cost, currency)
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {itinerary.notes.length > 0 && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Tips & notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
              {itinerary.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}