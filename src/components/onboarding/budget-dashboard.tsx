"use client";

import { BadgeCheck, BarChart3, CalendarDays, Layers, Wallet } from "lucide-react";
import type { ComputeBudgetResult } from "@/lib/budget/engine";
import { itineraryTotalCost, type BudgetFitResult } from "@/lib/trip/budget-fit";
import type { Itinerary } from "@/lib/trip/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categoryColor: Record<string, string> = {
  attraction: "bg-forest/10 text-forest dark:bg-sage/10 dark:text-sage",
  food: "bg-terracotta/10 text-terracotta",
  transport: "bg-olive/15 text-olive dark:bg-olive/20 dark:text-olive",
  free: "bg-sage/20 text-forest dark:bg-sage/15 dark:text-sage",
};

const categoryBar: Record<string, string> = {
  attraction: "bg-forest",
  food: "bg-terracotta",
  transport: "bg-olive",
  free: "bg-sage",
};

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

function money(value: number, currency: string) {
  return `${numberFormat.format(value)} ${currency}`;
}

export function BudgetDashboard({
  itinerary,
  budget,
  fit,
  hardBudgetPerPerson,
}: {
  itinerary: Itinerary;
  budget: ComputeBudgetResult;
  fit?: BudgetFitResult | null;
  hardBudgetPerPerson?: number | null;
}) {
  const currency: string = budget.ok ? budget.currency : "USD";
  const activitiesSpend = itineraryTotalCost(itinerary);

  const perDay = itinerary.daysPlan.map((day) => ({
    dayNumber: day.dayNumber,
    cost: day.activities.reduce((sum, act) => sum + act.cost, 0),
  }));
  const maxDayCost = Math.max(1, ...perDay.map((d) => d.cost));

  const byCategory = new Map<string, number>();
  for (const day of itinerary.daysPlan) {
    for (const act of day.activities) {
      byCategory.set(act.category, (byCategory.get(act.category) ?? 0) + act.cost);
    }
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const catTotal = categories.reduce((sum, [, v]) => sum + v, 0);

  const enforced = fit?.enforced ?? false;
  const remaining = enforced && hardBudgetPerPerson != null
    ? Math.max(0, hardBudgetPerPerson - activitiesSpend)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Est. total / person
            </div>
            <p className="mt-1 text-xl font-semibold">
              {budget.ok ? money(budget.perPersonTotal, currency) : money(fit?.totalBudget ?? activitiesSpend, currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {budget.ok ? `${budget.days} days incl. buffer` : "estimate"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              Activities spend
            </div>
            <p className="mt-1 text-xl font-semibold">
              {money(activitiesSpend, currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {enforced && hardBudgetPerPerson != null
                ? `${money(Math.max(0, activitiesSpend - hardBudgetPerPerson), currency)} over hard budget`
                : "itemized activities only"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {enforced && fit?.fits ? (
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              Hard budget
            </div>
            <p className="mt-1 text-xl font-semibold">
              {enforced && hardBudgetPerPerson != null
                ? money(hardBudgetPerPerson, currency)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {enforced && remaining != null
                ? `${money(remaining, currency)} unallocated`
                : enforced && !fit?.fits
                  ? "plan exceeds budget"
                  : "per person"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Daily activity spend
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {perDay.map((day) => (
            <div key={day.dayNumber} className="flex items-center gap-3 text-sm">
              <span className="w-8 shrink-0 text-muted-foreground">Day {day.dayNumber}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-forest to-sage dark:from-sage dark:to-ochre"
                  style={{ width: `${Math.round((day.cost / maxDayCost) * 100)}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right font-medium">
                {money(day.cost, currency)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary" />
            Spend by category
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {categories.map(([category, value]) => (
              <div
                key={category}
                className={categoryBar[category] ?? "bg-muted-foreground"}
                style={{ width: `${catTotal > 0 ? Math.round((value / catTotal) * 100) : 0}%` }}
                title={`${category}: ${money(value, currency)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(([category, value]) => (
              <span
                key={category}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${categoryColor[category] ?? "bg-muted text-muted-foreground"}`}
              >
                <span className={`h-2 w-2 rounded-full ${categoryBar[category] ?? "bg-muted-foreground"}`} />
                {category} · {money(value, currency)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}