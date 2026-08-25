"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Compass,
  Loader2,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { ItineraryView } from "@/components/onboarding/itinerary-view";
import { ExportButtons } from "@/components/onboarding/export-buttons";
import type { ComputeBudgetResult } from "@/lib/budget/engine";
import {
  tripFormSchema,
  stepFields,
  travelStyles,
  travelStyleLabels,
  interestLabels,
  interests,
  paceLabels,
  paces,
  budgetTypes,
  currencies,
  type Itinerary,
  type TripFormValues,
} from "@/lib/trip/schema";

const steps = [
  {
    title: "Where & when",
    subtitle: "Where are you heading, and for how long?",
    icon: MapPin,
  },
  {
    title: "Budget",
    subtitle: "How do you like to travel, and what can you spend?",
    icon: Wallet,
  },
  {
    title: "Trip details",
    subtitle: "Who's coming and how fast do you want to move?",
    icon: Compass,
  },
  {
    title: "Interests",
    subtitle: "What should your plan be built around?",
    icon: Sparkles,
  },
];

function toFieldErrors(error?: { message?: string }) {
  return error ? [error] : undefined;
}

function currencyOf(budget: ComputeBudgetResult): string {
  return budget.ok ? budget.currency : "USD";
}

function stageMessage(stage: string): string {
  switch (stage) {
    case "revising":
      return "Revising your plan to fit your budget…";
    case "generating":
      return "Building your day-by-day itinerary…";
    default:
      return "Starting your trip…";
  }
}

export function TripForm({ isPro = false }: { isPro?: boolean }) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    itinerary: Itinerary;
    budget: ComputeBudgetResult;
    saved: boolean;
    remaining: number | null;
    hardBudgetPerPerson: number | null;
    budgetFit: {
      enforced: boolean;
      fits: boolean;
      overage: number;
    } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [editedItinerary, setEditedItinerary] = useState<Itinerary | null>(
    null
  );
  const [job, setJob] = useState<{
    planId: string;
    hardBudgetPerPerson: number | null;
  } | null>(null);
  const [progressStage, setProgressStage] = useState("queued");

  useEffect(() => {
    if (!job) return;
    let cancelled = false;
    let finished = false;
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      if (finished) return;
      if (Date.now() - startedAt > 300_000) {
        finished = true;
        clearInterval(timer);
        setGenerating(false);
        setJob(null);
        setError(
          "Generation is taking longer than expected. Please try again."
        );
        return;
      }
      try {
        const response = await fetch(`/api/plans/${job.planId}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (cancelled || finished) return;
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Failed to check plan status");
        }
        if (data.status === "completed") {
          finished = true;
          clearInterval(timer);
          setGenerating(false);
          setJob(null);
          toast.success("Your itinerary is ready!");
          setResult({
            itinerary: data.result.itinerary,
            budget: data.result.budget,
            saved: data.result.saved === true,
            remaining:
              data.usage && Number.isFinite(data.usage.remaining)
                ? data.usage.remaining
                : null,
            hardBudgetPerPerson: job.hardBudgetPerPerson,
            budgetFit: data.result.budgetFit ?? null,
          });
        } else if (data.status === "failed") {
          finished = true;
          clearInterval(timer);
          setGenerating(false);
          setJob(null);
          const message = data.error ?? "Generation failed. Please try again.";
          setError(message);
          toast.error(message);
        } else {
          setProgressStage(data.stage ?? data.status);
        }
      } catch {
        // transient network/poll error — keep polling
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [job]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      destination: "",
      startDate: "",
      endDate: "",
      travelStyle: "standard",
      budgetType: "fixed",
      budgetAmount: "",
      currency: "USD",
      partySize: 1,
      pace: "balanced",
      interests: [],
    },
  });

  const { register, handleSubmit, trigger, getValues, setValue } = form;

  const watchBudgetType = useWatch({ control: form.control, name: "budgetType" });
  const watchInterests = useWatch({ control: form.control, name: "interests" });
  const watchTravelStyle = useWatch({ control: form.control, name: "travelStyle" });
  const watchPace = useWatch({ control: form.control, name: "pace" });
  const watchStartDate = useWatch({ control: form.control, name: "startDate" });

  const isLastStep = step === steps.length - 1;

  async function handleNext() {
    const fields = stepFields[step];
    const ok = await trigger(fields);
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(values: TripFormValues) {
    setGenerating(true);
    setError(null);
    setLimitReached(false);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (data.code === "plan_limit_reached") setLimitReached(true);
        throw new Error(data.error ?? "Failed to start generation");
      }
      setProgressStage("queued");
      setJob({
        planId: data.planId,
        hardBudgetPerPerson:
          values.budgetType === "fixed"
            ? Number(values.budgetAmount) / Math.max(values.partySize, 1)
            : null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setGenerating(false);
    }
  }

  function resetAll() {
    setResult(null);
    setError(null);
    setGenerating(false);
    setEditedItinerary(null);
    setJob(null);
    setLimitReached(false);
    setStep(0);
    form.reset();
  }

  if (generating) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-3xl border bg-card p-12 text-center shadow-sm">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <motion.div
            className="absolute -inset-2 rounded-full border-2 border-primary/20"
            animate={{ scale: [1, 1.15, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </div>
        <h2 className="mt-8 text-2xl font-semibold tracking-tight">
          Planning your trip…
        </h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          {stageMessage(progressStage)}
        </p>
        <div className="mt-6 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-primary/10">
          <motion.div
            className="h-full w-1/2 rounded-full bg-primary"
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This usually takes 30–90 seconds. You can leave this page and check
          your trips later.
        </p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        {result.budgetFit && result.budgetFit.enforced && (
          result.budgetFit.fits ? (
            <div className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3">
              <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Fits your {currencyOf(result.budget)} budget
              </p>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                This plan runs ~{Math.round(result.budgetFit.overage)}{" "}
                {currencyOf(result.budget)} over your budget — slightly above
                your target.
              </p>
            </div>
          )
        )}
        <ItineraryView
          itinerary={editedItinerary ?? result.itinerary}
          budget={result.budget}
          editable
          onEdit={setEditedItinerary}
          hardBudgetPerPerson={result.hardBudgetPerPerson}
        />
        <ExportButtons
          itinerary={editedItinerary ?? result.itinerary}
          budget={result.budget}
          isPro={isPro}
          meta={{
            destination: getValues("destination"),
            startDate: getValues("startDate"),
            endDate: getValues("endDate"),
            partySize: getValues("partySize"),
          }}
        />
        <div className="mx-auto flex flex-col items-center gap-2 print:hidden">
          {result.saved && result.remaining !== null && (
            <p className="text-sm text-muted-foreground">
              {result.remaining === 0 ? (
                <Link href="/pricing" className="underline underline-offset-2 hover:text-foreground">
                  You&apos;ve used all your free plans — upgrade for unlimited.
                </Link>
              ) : (
                `${result.remaining} free plan${result.remaining === 1 ? "" : "s"} left this month.`
              )}
            </p>
          )}
          <Button variant="outline" onClick={resetAll}>
            Plan another trip
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-3xl border bg-card p-10 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <Sparkles className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">
          Couldn&apos;t generate your plan
        </h2>
        <p className="mt-3 max-w-md text-muted-foreground">{error}</p>
        <div className="mt-8 flex gap-3">
          {limitReached ? (
            <Button
              className="gap-2"
              nativeButton={false}
              render={<Link href="/pricing" />}
            >
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Button>
          ) : (
            <Button onClick={() => onSubmit(getValues())}>Try again</Button>
          )}
          <Button variant="outline" onClick={resetAll}>
            Start over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {steps.length}
        </p>
        <Progress value={((step + 1) / steps.length) * 100} className="h-2 w-48" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-3xl border bg-card p-8 shadow-sm sm:p-10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="mb-8">
              {(() => {
                const Icon = steps[step].icon;
                return (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                );
              })()}
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                {steps[step].title}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {steps[step].subtitle}
              </p>
            </div>

            {step === 0 && (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="destination">Destination</FieldLabel>
                  <Input
                    id="destination"
                    placeholder="e.g. Paris, France"
                    autoComplete="off"
                    {...register("destination")}
                  />
                  <FieldError errors={toFieldErrors(form.formState.errors.destination)} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="startDate">Start date</FieldLabel>
                  <Input
                    id="startDate"
                    type="date"
                    min={today}
                    {...register("startDate")}
                  />
                  <FieldError errors={toFieldErrors(form.formState.errors.startDate)} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="endDate">End date</FieldLabel>
                  <Input
                    id="endDate"
                    type="date"
                    min={watchStartDate || today}
                    {...register("endDate")}
                  />
                  <FieldError errors={toFieldErrors(form.formState.errors.endDate)} />
                </Field>
              </FieldGroup>
            )}

            {step === 1 && (
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Travel style</FieldLegend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {travelStyles.map((style) => (
                      <label
                        key={style}
                        className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
                          watchTravelStyle === style
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          value={style}
                          checked={watchTravelStyle === style}
                          onChange={() => setValue("travelStyle", style)}
                        />
                        <span className="font-medium">
                          {travelStyleLabels[style].label}
                        </span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          {travelStyleLabels[style].description}
                        </span>
                      </label>
                    ))}
                  </div>
                </FieldSet>

                <FieldSet>
                  <FieldLegend>Budget type</FieldLegend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {budgetTypes.map((type) => (
                      <label
                        key={type}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                          watchBudgetType === type
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          value={type}
                          checked={watchBudgetType === type}
                          onChange={() => setValue("budgetType", type)}
                        />
                        <span className="font-medium capitalize">{type}</span>
                        <span className="text-sm text-muted-foreground">
                          {type === "fixed" ? "A hard ceiling" : "No limit"}
                        </span>
                      </label>
                    ))}
                  </div>
                </FieldSet>

                {watchBudgetType === "fixed" && (
                  <div className="flex gap-3">
                    <Field className="flex-1">
                      <FieldLabel htmlFor="budgetAmount">
                        Total budget
                      </FieldLabel>
                      <Input
                        id="budgetAmount"
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        placeholder="e.g. 1500"
                        {...register("budgetAmount")}
                      />
                      <FieldError errors={toFieldErrors(form.formState.errors.budgetAmount)} />
                    </Field>
                    <Field className="w-40">
                      <FieldLabel htmlFor="currency">Currency</FieldLabel>
                      <select
                        id="currency"
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        {...register("currency")}
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </FieldGroup>
            )}

            {step === 2 && (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="partySize">Number of travelers</FieldLabel>
                  <div className="flex h-10 w-40 items-center overflow-hidden rounded-md border">
                    <button
                      type="button"
                      aria-label="Decrease travelers"
                      className="flex h-full w-12 items-center justify-center text-lg hover:bg-muted/50"
                      onClick={() =>
                        setValue(
                          "partySize",
                          Math.max(1, getValues("partySize") - 1),
                          { shouldValidate: true }
                        )
                      }
                    >
                      −
                    </button>
                    <input
                      id="partySize"
                      className="w-16 bg-transparent text-center text-sm outline-none"
                      inputMode="numeric"
                      {...register("partySize", { valueAsNumber: true })}
                    />
                    <button
                      type="button"
                      aria-label="Increase travelers"
                      className="flex h-full w-12 items-center justify-center text-lg hover:bg-muted/50"
                      onClick={() =>
                        setValue(
                          "partySize",
                          Math.min(50, getValues("partySize") + 1),
                          { shouldValidate: true }
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                  <FieldError errors={toFieldErrors(form.formState.errors.partySize)} />
                </Field>

                <FieldSet>
                  <FieldLegend>Pace</FieldLegend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {paces.map((pace) => (
                      <label
                        key={pace}
                        className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
                          watchPace === pace
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          value={pace}
                          checked={watchPace === pace}
                          onChange={() => setValue("pace", pace)}
                        />
                        <span className="font-medium">{paceLabels[pace]}</span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          {pace === "packed" &&
                            "Maximize sights per day"}
                          {pace === "balanced" &&
                            "Mix of sightseeing and downtime"}
                          {pace === "relaxed" &&
                            "Slow travel, long lunches, flexibility"}
                        </span>
                      </label>
                    ))}
                  </div>
                </FieldSet>
              </FieldGroup>
            )}

            {step === 3 && (
              <FieldSet>
                <FieldLegend>What matters most?</FieldLegend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {interests.map((interest) => {
                    const checked = watchInterests.includes(interest);
                    return (
                      <label
                        key={interest}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                          checked
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-muted-foreground"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? watchInterests.filter((i) => i !== interest)
                              : [...watchInterests, interest];
                            setValue("interests", next, { shouldValidate: true });
                          }}
                        />
                        <span className="font-medium">
                          {interestLabels[interest]}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <FieldError errors={toFieldErrors(form.formState.errors.interests)} />
              </FieldSet>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-2 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button type="submit" className="gap-2 rounded-full">
              Generate my plan
              <Sparkles className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="gap-2 rounded-full"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}