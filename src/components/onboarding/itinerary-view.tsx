"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  BedDouble,
  MapPin,
  Pencil,
  Plane,
  Plus,
  Sparkles,
  Trash2,
  Utensils,
  Wallet,
} from "lucide-react";
import type {
  Itinerary,
  ItineraryActivity,
} from "@/lib/trip/schema";
import type { ComputeBudgetResult } from "@/lib/budget/engine";
import { checkBudgetFit, type BudgetFitResult } from "@/lib/trip/budget-fit";
import { BudgetDashboard } from "./budget-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categoryColor: Record<string, string> = {
  attraction: "bg-forest/10 text-forest dark:bg-sage/10 dark:text-sage",
  food: "bg-terracotta/10 text-terracotta",
  transport: "bg-olive/15 text-olive dark:bg-olive/20 dark:text-olive",
  free: "bg-sage/20 text-forest dark:bg-sage/15 dark:text-sage",
};

const categories = ["attraction", "food", "transport", "free"] as const;

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

function money(value: number, currency: string) {
  return `${numberFormat.format(value)} ${currency}`;
}

function nextDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function ItineraryView({
  itinerary,
  budget,
  editable = false,
  onEdit,
  fit,
  hardBudgetPerPerson,
}: {
  itinerary: Itinerary;
  budget: ComputeBudgetResult;
  editable?: boolean;
  onEdit?: (next: Itinerary) => void;
  fit?: BudgetFitResult | null;
  hardBudgetPerPerson?: number | null;
}) {
  const currency: string = budget.ok ? budget.currency : "USD";
  const totalCost = itinerary.daysPlan.reduce(
    (sum, day) =>
      sum +
      day.activities.reduce((acc, act) => acc + act.cost, 0),
    0
  );
  const budgetTotal = budget.ok ? budget.total : undefined;
  const bufferAmount = budget.ok ? budget.buffer : undefined;

  const liveFit =
    hardBudgetPerPerson != null
      ? checkBudgetFit(itinerary, {
          budgetType: "fixed",
          budgetAmount: String(hardBudgetPerPerson * itinerary.partySize),
          partySize: itinerary.partySize,
        })
      : fit ?? null;

  const [editTarget, setEditTarget] = useState<{
    day: number;
    act: number;
  } | null>(null);
  const [draft, setDraft] = useState<ItineraryActivity | null>(null);
  const [addTarget, setAddTarget] = useState<number | null>(null);
  const [addDraft, setAddDraft] = useState<ItineraryActivity | null>(null);

  const mutate = (fn: (draftItinerary: Itinerary) => void) => {
    if (!onEdit) return;
    const next = structuredClone(itinerary);
    fn(next);
    next.daysPlan = next.daysPlan.map((day, i) => ({
      ...day,
      dayNumber: i + 1,
    }));
    next.days = next.daysPlan.length;
    onEdit(next);
  };

  const moveDay = (index: number, dir: -1 | 1) => {
    mutate((next) => {
      const target = index + dir;
      if (target < 0 || target >= next.daysPlan.length) return;
      [next.daysPlan[index], next.daysPlan[target]] = [
        next.daysPlan[target],
        next.daysPlan[index],
      ];
    });
  };

  const deleteDay = (index: number) => {
    if (itinerary.daysPlan.length <= 1) return;
    mutate((next) => {
      next.daysPlan.splice(index, 1);
    });
  };

  const addDay = () => {
    mutate((next) => {
      const last = next.daysPlan[next.daysPlan.length - 1];
      next.daysPlan.push({
        dayNumber: next.daysPlan.length + 1,
        date: nextDate(last.date),
        summary: "",
        lodging: "",
        meals: [],
        activities: [],
      });
    });
  };

  const moveActivity = (day: number, act: number, dir: -1 | 1) => {
    mutate((next) => {
      const activities = next.daysPlan[day].activities;
      const target = act + dir;
      if (target < 0 || target >= activities.length) return;
      [activities[act], activities[target]] = [
        activities[target],
        activities[act],
      ];
    });
  };

  const deleteActivity = (day: number, act: number) => {
    mutate((next) => {
      next.daysPlan[day].activities.splice(act, 1);
    });
  };

  const updateActivity = (day: number, act: number, patch: ItineraryActivity) => {
    mutate((next) => {
      next.daysPlan[day].activities[act] = patch;
    });
  };

  const addActivity = (day: number, activity: ItineraryActivity) => {
    mutate((next) => {
      next.daysPlan[day].activities.push(activity);
    });
  };

  const openEdit = (day: number, act: number) => {
    setDraft(structuredClone(itinerary.daysPlan[day].activities[act]));
    setEditTarget({ day, act });
  };

  const openAdd = (day: number) => {
    setAddDraft({
      time: "9:00 AM",
      title: "",
      description: "",
      cost: 0,
      category: "attraction",
    });
    setAddTarget(day);
  };

  const inputClass =
    "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary";

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
                {liveFit?.fits ? (
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

      <BudgetDashboard
        itinerary={itinerary}
        budget={budget}
        fit={liveFit}
        hardBudgetPerPerson={hardBudgetPerPerson}
      />

      <div className="flex flex-col gap-6">
        {itinerary.daysPlan.map((day, dayIndex) => {
          const dayCost = day.activities.reduce(
            (sum, act) => sum + act.cost,
            0
          );
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {money(dayCost, currency)} activities
                    </Badge>
                    {editable && (
                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={dayIndex === 0}
                          onClick={() => moveDay(dayIndex, -1)}
                          aria-label={`Move day ${day.dayNumber} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={dayIndex === itinerary.daysPlan.length - 1}
                          onClick={() => moveDay(dayIndex, 1)}
                          aria-label={`Move day ${day.dayNumber} down`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          disabled={itinerary.daysPlan.length <= 1}
                          onClick={() => deleteDay(dayIndex)}
                          aria-label={`Delete day ${day.dayNumber}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
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
                  {day.activities.map((activity, actIndex) => {
                    const isEditing =
                      editTarget?.day === dayIndex &&
                      editTarget?.act === actIndex;
                    if (isEditing && draft) {
                      return (
                        <div
                          key={`${activity.time}-${actIndex}`}
                          className="rounded-xl border p-3"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                              Title
                              <input
                                className={inputClass}
                                value={draft.title}
                                onChange={(e) =>
                                  setDraft({ ...draft, title: e.target.value })
                                }
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                              Time
                              <input
                                className={inputClass}
                                value={draft.time}
                                onChange={(e) =>
                                  setDraft({ ...draft, time: e.target.value })
                                }
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2">
                              Description
                              <textarea
                                className={`${inputClass} min-h-16 resize-y`}
                                value={draft.description}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                              Cost ({currency})
                              <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={draft.cost}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    cost: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                              Category
                              <select
                                className={inputClass}
                                value={draft.category}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    category: e.target.value as ItineraryActivity["category"],
                                  })
                                }
                              >
                                {categories.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditTarget(null);
                                setDraft(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                updateActivity(dayIndex, actIndex, draft);
                                setEditTarget(null);
                                setDraft(null);
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${activity.time}-${actIndex}`}
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
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className="text-sm font-semibold">
                            {activity.cost === 0 ? (
                              <span className="text-emerald-500">Free</span>
                            ) : (
                              money(activity.cost, currency)
                            )}
                          </span>
                          {editable && (
                            <div className="flex items-center gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={actIndex === 0}
                                onClick={() =>
                                  moveActivity(dayIndex, actIndex, -1)
                                }
                                aria-label="Move activity up"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={
                                  actIndex === day.activities.length - 1
                                }
                                onClick={() =>
                                  moveActivity(dayIndex, actIndex, 1)
                                }
                                aria-label="Move activity down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEdit(dayIndex, actIndex)}
                                aria-label="Edit activity"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() =>
                                  deleteActivity(dayIndex, actIndex)
                                }
                                aria-label="Delete activity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {editable && addTarget === dayIndex && addDraft && (
                    <div className="rounded-xl border border-dashed p-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          Title
                          <input
                            className={inputClass}
                            value={addDraft.title}
                            onChange={(e) =>
                              setAddDraft({ ...addDraft, title: e.target.value })
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          Time
                          <input
                            className={inputClass}
                            value={addDraft.time}
                            onChange={(e) =>
                              setAddDraft({ ...addDraft, time: e.target.value })
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2">
                          Description
                          <textarea
                            className={`${inputClass} min-h-16 resize-y`}
                            value={addDraft.description}
                            onChange={(e) =>
                              setAddDraft({
                                ...addDraft,
                                description: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          Cost ({currency})
                          <input
                            type="number"
                            min={0}
                            className={inputClass}
                            value={addDraft.cost}
                            onChange={(e) =>
                              setAddDraft({
                                ...addDraft,
                                cost: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          Category
                          <select
                            className={inputClass}
                            value={addDraft.category}
                            onChange={(e) =>
                              setAddDraft({
                                ...addDraft,
                                category: e.target.value as ItineraryActivity["category"],
                              })
                            }
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAddTarget(null);
                            setAddDraft(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!addDraft.title.trim()}
                          onClick={() => {
                            addActivity(dayIndex, addDraft);
                            setAddTarget(null);
                            setAddDraft(null);
                          }}
                        >
                          Add activity
                        </Button>
                      </div>
                    </div>
                  )}

                  {editable && addTarget !== dayIndex && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 self-start"
                      onClick={() => openAdd(dayIndex)}
                    >
                      <Plus className="h-4 w-4" />
                      Add activity
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editable && (
        <Button
          type="button"
          variant="outline"
          className="gap-2 self-center"
          onClick={addDay}
        >
          <Plus className="h-4 w-4" />
          Add day
        </Button>
      )}

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