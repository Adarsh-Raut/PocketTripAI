import { z } from "zod";
import { getActiveProvider } from "@/lib/ai/client";
import { computeBudget } from "@/lib/budget/engine";
import { findCityModel } from "@/data/cost-models";
import {
  BUDGET_REVISION_ATTEMPTS,
  checkBudgetFit,
  type BudgetFitResult,
} from "./budget-fit";
import {
  itinerarySchema,
  interestLabels,
  paceLabels,
  travelStyleLabels,
  type Itinerary,
  type TripFormValues,
} from "./schema";

export { BUDGET_REVISION_ATTEMPTS } from "./budget-fit";
export type { BudgetFitResult } from "./budget-fit";
export { checkBudgetFit, itineraryTotalCost } from "./budget-fit";

export interface GenerateResult {
  itinerary: Itinerary;
  budget: ReturnType<typeof computeBudget>;
  attempts: number;
  budgetFit: BudgetFitResult;
  revisions: number;
}

export function calcDays(startDate: string, endDate: string): number {
  const ms =
    new Date(endDate).getTime() - new Date(startDate).getTime();
  if (Number.isNaN(ms) || ms < 0) return 1;
  return Math.round(ms / 86_400_000) + 1;
}

const itineraryJsonSchema = z.toJSONSchema(itinerarySchema) as Record<
  string,
  unknown
>;

function buildPrompt(
  input: TripFormValues,
  days: number,
  revisionFit?: BudgetFitResult
): string {
  const model = findCityModel(input.destination);
  const budget = computeBudget({
    destination: input.destination,
    days,
    partySize: input.partySize,
    travelStyle: input.travelStyle,
    currency: input.budgetType === "fixed" ? input.currency : undefined,
    availableBudget:
      input.budgetType === "fixed" ? Number(input.budgetAmount) : undefined,
  });

  const interestList = input.interests
    .map((i) => interestLabels[i])
    .join(", ");

  const budgetSection = budget.ok
    ? `
BUDGET CONTEXT (per person, ${budget.currency}):
- Travel style: ${travelStyleLabels[input.travelStyle].label}
- Daily budget target: ${budget.perPersonPerDay} ${budget.currency}/person/day
- Total estimated: ${budget.total} ${budget.currency} (incl. ${budget.buffer} ${budget.currency} buffer)
- Itemized daily breakdown:
${budget.lineItems
  .map((item) => `  - ${item.category}: ${item.subtotal / days} ${budget.currency}/day`)
  .join("\n")}
${input.budgetType === "fixed"
  ? `- USER HARD BUDGET: ${Number(input.budgetAmount)} ${input.currency} total (${(Number(input.budgetAmount) / input.partySize).toFixed(0)} ${input.currency} per person). The plan MUST fit this total.`
  : "- Unlimited budget: no cost ceiling, recommend premium experiences."}
`
    : `NOTE: "${input.destination}" is not yet in our cost model. Provide realistic cost estimates in the itinerary and flag estimates as approximate.`;

  const hardBudgetLine =
    input.budgetType === "fixed"
      ? `HARD BUDGET: ${Number(input.budgetAmount)} ${input.currency} total for the whole trip, ${(Number(input.budgetAmount) / input.partySize).toFixed(0)} ${input.currency} per person. The plan MUST fit this total.`
      : "";

  const destinationContext = model
    ? `Destination facts (${model.city}, ${model.country}): use well-known, real attractions. Do NOT invent landmarks or prices that don't exist.`
    : "Use only well-known, real attractions and realistic prices. Do not invent landmarks.";

  const revisionSection = revisionFit
    ? `
REVISION REQUIRED — YOUR PREVIOUS PLAN DID NOT FIT THE HARD BUDGET:
- Per-person hard budget: ${revisionFit.perPersonBudget.toFixed(0)} ${input.currency}
- Your plan's stated total: ${revisionFit.totalBudget.toFixed(0)} ${input.currency}/person (${revisionFit.overage.toFixed(0)} ${input.currency} over)
${revisionFit.activitiesSpend > revisionFit.perPersonBudget
  ? `- Itemized activities alone total ${revisionFit.activitiesSpend.toFixed(0)} ${input.currency}/person — you must actually cut activity costs, not just lower the totalBudget number.`
  : ""}
Produce a leaner plan that FITS the budget: cheaper lodging tier, street/budget meals instead of restaurants, free or low-cost attractions, public transit, fewer paid add-ons. Keep the exact same JSON schema, real landmarks, and geographically coherent routing.
`
    : "";

  return `
You are PocketTripAI's travel planner. Build a complete day-by-day itinerary that is realistic, practical, and follows the user's budget and interests.

USER REQUEST:
- Destination: ${input.destination}
- Dates: ${input.startDate} → ${input.endDate} (${days} days)
- Travel style: ${travelStyleLabels[input.travelStyle].label}
- Party size: ${input.partySize} traveler(s)
- Pace: ${paceLabels[input.pace]}
- Interests: ${interestList}
${input.budgetType === "fixed" ? `- Total budget: ${input.budgetAmount} ${input.currency}` : "- Budget: unlimited"}

${destinationContext}

${budgetSection}

${hardBudgetLine}

${revisionSection}

REQUIREMENTS:
1. Output MUST be valid JSON matching the required schema exactly.
2. ${input.pace === "packed" ? "Pack in many activities per day." : input.pace === "relaxed" ? "Keep 1-3 activities per day with generous downtime." : "Balance 3-5 activities per day with some downtime."}
3. Every activity has a per-person cost in ${input.currency}. Free activities use cost 0 and category "free".
4. Assign each activity a category: attraction, food, transport, or free.
5. ${input.budgetType === "fixed" ? "Keep total estimated spend AT OR BELOW the hard budget." : "Spend generously within the luxury tier."}
6. Include practical lodging and meal suggestions per day.
7. ${input.interests.includes("food") ? "Feature local food highlights (street food markets, cafes, restaurants). " : ""}${input.interests.includes("nature") ? "Include parks, gardens, and outdoor spots. " : ""}${input.interests.includes("adventure") ? "Include hiking, tours, or adventure activities. " : ""}${input.interests.includes("culture") ? "Include museums, historical sites, and local culture. " : ""}${input.interests.includes("relaxation") ? "Include spa, cafés, and slow experiences. " : ""}${input.interests.includes("shopping") ? "Include local markets and shopping districts. " : ""}${input.interests.includes("nightlife") ? "Include evening bars, shows, or nightlife. " : ""}
8. Be geographically coherent: order activities so the traveler moves sensibly across the city each day.
9. Return a 2-3 sentence trip summary and a few practical notes (packing, tips, weather).
10. Set "totalBudget" to the estimated total cost PER PERSON for the entire trip (lodging + meals + activities + local transport + a small buffer). Set "dailyBudgetPerPerson" to totalBudget / days. The itemized activity costs must be consistent with these totals — no gaming the numbers.
`;
}

function assembleResult(
  itinerary: Itinerary,
  input: TripFormValues,
  days: number,
  attempts: number,
  budgetFit: BudgetFitResult
): GenerateResult {
  return {
    itinerary: {
      ...itinerary,
      days,
      partySize: input.partySize,
      travelStyle: input.travelStyle,
      destination: itinerary.destination || input.destination,
    },
    budget: computeBudget({
      destination: input.destination,
      days,
      partySize: input.partySize,
      travelStyle: input.travelStyle,
      currency: input.budgetType === "fixed" ? input.currency : undefined,
      availableBudget:
        input.budgetType === "fixed" ? Number(input.budgetAmount) : undefined,
    }),
    attempts,
    budgetFit,
    revisions: 0,
  };
}

export type GenerationStage =
  | "generating"
  | "revising";

export interface GenerateOptions {
  maxAttempts?: number;
  onStage?: (stage: GenerationStage, attempt: number) => void;
}

export async function generateItinerary(
  input: TripFormValues,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const { maxAttempts = 2, onStage } = options;
  const days = calcDays(input.startDate, input.endDate);
  const provider = getActiveProvider();
  const maxCalls = maxAttempts + BUDGET_REVISION_ATTEMPTS;
  let calls = 0;
  let revisions = 0;
  let lastFit: BudgetFitResult | undefined;
  let lastGood:
    | { itinerary: Itinerary; calls: number; fit: BudgetFitResult }
    | undefined;
  let lastError: unknown;

  while (calls < maxCalls) {
    calls += 1;
    try {
      onStage?.(lastFit ? "revising" : "generating", calls);
      const raw = await provider.generateStructured<unknown>({
        temperature: 0.6,
        system:
          "You are PocketTripAI, a travel planning assistant. Always respond with valid JSON matching the requested schema. Never invent places or prices.",
        prompt: buildPrompt(input, days, lastFit),
        schema: itineraryJsonSchema,
      });

      const itinerary = itinerarySchema.parse(raw);
      const fit = checkBudgetFit(itinerary, input);
      lastGood = { itinerary, calls, fit };

      if (input.budgetType === "fixed" && !fit.fits && calls < maxCalls) {
        lastFit = fit;
        revisions += 1;
        continue;
      }

      return {
        ...assembleResult(itinerary, input, days, calls, fit),
        revisions,
      };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastGood) {
    return {
      ...assembleResult(
        lastGood.itinerary,
        input,
        days,
        lastGood.calls,
        lastGood.fit
      ),
      revisions,
    };
  }

  throw new Error(
    `Failed to generate a valid itinerary after ${maxCalls} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}