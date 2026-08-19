import type { Itinerary } from "./schema";

export interface BudgetFitResult {
  enforced: boolean;
  fits: boolean;
  perPersonBudget: number;
  totalBudget: number;
  activitiesSpend: number;
  overage: number;
}

export interface BudgetCheckInput {
  budgetType: "fixed" | "unlimited";
  budgetAmount?: string;
  partySize: number;
}

export const TOTAL_TOLERANCE = 1.05;
export const ACTIVITIES_TOLERANCE = 1.15;
export const BUDGET_REVISION_ATTEMPTS = 2;

export function itineraryTotalCost(itinerary: Itinerary): number {
  return itinerary.daysPlan.reduce(
    (sum, day) =>
      sum +
      day.activities.reduce((daySum, activity) => daySum + activity.cost, 0),
    0
  );
}

export function checkBudgetFit(
  itinerary: Itinerary,
  input: BudgetCheckInput
): BudgetFitResult {
  const perPersonBudget =
    (Number(input.budgetAmount) || 0) / Math.max(input.partySize, 1);
  const totalBudget = itinerary.totalBudget;
  const activitiesSpend = itineraryTotalCost(itinerary);

  if (input.budgetType !== "fixed") {
    return {
      enforced: false,
      fits: true,
      perPersonBudget,
      totalBudget,
      activitiesSpend,
      overage: 0,
    };
  }

  const totalFits = totalBudget <= perPersonBudget * TOTAL_TOLERANCE;
  const activitiesFit =
    activitiesSpend <= perPersonBudget * ACTIVITIES_TOLERANCE;
  const fits = totalFits && activitiesFit;

  return {
    enforced: true,
    fits,
    perPersonBudget,
    totalBudget,
    activitiesSpend,
    overage: Math.max(totalBudget - perPersonBudget, 0),
  };
}