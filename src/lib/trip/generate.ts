import { z } from "zod";
import { getActiveProvider } from "@/lib/ai/client";
import { computeBudget } from "@/lib/budget/engine";
import { findCityModel } from "@/data/cost-models";
import {
  itinerarySchema,
  interestLabels,
  paceLabels,
  travelStyleLabels,
  type Itinerary,
  type TripFormValues,
} from "./schema";

export interface GenerateResult {
  itinerary: Itinerary;
  budget: ReturnType<typeof computeBudget>;
  attempts: number;
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

function buildPrompt(input: TripFormValues, days: number): string {
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
  ? `- USER HARD BUDGET: ${Number(input.budgetAmount)} ${input.currency}. The plan MUST fit this total.`
  : "- Unlimited budget: no cost ceiling, recommend premium experiences."}
`
    : `NOTE: "${input.destination}" is not yet in our cost model. Provide realistic cost estimates in the itinerary and flag estimates as approximate.`;

  const destinationContext = model
    ? `Destination facts (${model.city}, ${model.country}): use well-known, real attractions. Do NOT invent landmarks or prices that don't exist.`
    : "Use only well-known, real attractions and realistic prices. Do not invent landmarks.";

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
`;
}

export async function generateItinerary(
  input: TripFormValues,
  maxAttempts = 2
): Promise<GenerateResult> {
  const days = calcDays(input.startDate, input.endDate);
  const provider = getActiveProvider();
  let attempts = 0;
  let lastError: unknown;

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const raw = await provider.generateStructured<unknown>({
        temperature: 0.6,
        system:
          "You are PocketTripAI, a travel planning assistant. Always respond with valid JSON matching the requested schema. Never invent places or prices.",
        prompt: buildPrompt(input, days),
        schema: itineraryJsonSchema,
      });

      const itinerary = itinerarySchema.parse(raw);
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
        }),
        attempts,
      };
    } catch (error) {
      lastError = error;
      if (attempts >= maxAttempts) break;
    }
  }

  throw new Error(
    `Failed to generate a valid itinerary after ${maxAttempts} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}