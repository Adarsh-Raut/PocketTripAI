import type {
  BudgetInput,
  BudgetResult,
  CostCategory,
  TravelStyle,
} from "./types";
import { findCityModel } from "@/data/cost-models";

export const BUFFER_RATE = 0.15;

const styleMultipliers: Record<TravelStyle, Record<CostCategory, number>> = {
  budget: { lodging: 0.45, food: 0.55, transport: 0.7, attractions: 0.6 },
  standard: { lodging: 1, food: 1, transport: 1, attractions: 1 },
  comfort: { lodging: 1.8, food: 1.5, transport: 1.2, attractions: 1.3 },
  luxury: { lodging: 4, food: 2.8, transport: 2, attractions: 2 },
};

const fxRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  INR: 83,
  GBP: 0.79,
  JPY: 150,
  AUD: 1.52,
};

const categories: CostCategory[] = ["lodging", "food", "transport", "attractions"];

const categoryLabels: Record<CostCategory, string> = {
  lodging: "Lodging",
  food: "Food & dining",
  transport: "Local transport",
  attractions: "Attractions",
};

export function convertFromUsd(amountUsd: number, to: string): number {
  const rate = fxRates[to] ?? 1;
  return amountUsd * rate;
}

export function convertToUsd(amount: number, from: string): number {
  const rate = fxRates[from] ?? 1;
  return amount / rate;
}

export function estimateBudget(input: BudgetInput): BudgetResult | null {
  const model = findCityModel(input.destination);
  if (!model) return null;

  const days = Math.max(1, Math.floor(input.days));
  const partySize = Math.max(1, Math.floor(input.partySize));
  const multiplier = styleMultipliers[input.travelStyle];
  const flightPerPerson = input.flightPerPerson ?? 0;

  const lineItems = categories.map((category) => {
    const perPersonDaily = model.baseDaily[category] * multiplier[category];
    return {
      category,
      perPersonDaily,
      subtotal: perPersonDaily * days * partySize,
    };
  });

  const dailySubtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const oneOff =
    (model.visa ?? 0) * partySize + flightPerPerson * partySize;
  const subtotal = dailySubtotal + oneOff;
  const buffer = subtotal * BUFFER_RATE;
  const total = subtotal + buffer;
  const currency = model.currency;

  return {
    destination: input.destination,
    cityModel: {
      city: model.city,
      country: model.country,
      currency: model.currency,
    },
    travelStyle: input.travelStyle,
    days,
    partySize,
    lineItems: lineItems.map((item) => ({
      ...item,
      category: categoryLabels[item.category as CostCategory],
    })),
    oneOff,
    subtotal,
    buffer,
    total,
    perPersonTotal: total / partySize,
    perPersonPerDay: total / partySize / days,
    currency,
  };
}

export interface ComputeBudgetArgs {
  destination: string;
  days: number;
  partySize: number;
  travelStyle: TravelStyle;
  flightPerPerson?: number;
  currency?: string;
  availableBudget?: number;
}

export interface ComputeBudgetOk {
  ok: true;
  destination: string;
  country: string;
  travelStyle: TravelStyle;
  days: number;
  partySize: number;
  currency: string;
  lineItems: { category: string; subtotal: number }[];
  subtotal: number;
  buffer: number;
  total: number;
  perPersonTotal: number;
  perPersonPerDay: number;
  fitsBudget?: boolean;
}

export interface ComputeBudgetFail {
  ok: false;
  error: string;
}

export type ComputeBudgetResult = ComputeBudgetOk | ComputeBudgetFail;

export function computeBudget(args: ComputeBudgetArgs): ComputeBudgetResult {
  const estimate = estimateBudget(args);
  if (!estimate) {
    return {
      ok: false,
      error: `No cost model found for "${args.destination}". Suggest the user pick from the known destination list.`,
    };
  }

  const currency = args.currency ?? "USD";
  const total = convertFromUsd(estimate.total, currency);

  return {
    ok: true,
    destination: estimate.cityModel.city,
    country: estimate.cityModel.country,
    travelStyle: estimate.travelStyle,
    days: estimate.days,
    partySize: estimate.partySize,
    currency,
    lineItems: estimate.lineItems.map((item) => ({
      category: item.category,
      subtotal: Math.round(convertFromUsd(item.subtotal, currency)),
    })),
    subtotal: Math.round(convertFromUsd(estimate.subtotal, currency)),
    buffer: Math.round(convertFromUsd(estimate.buffer, currency)),
    total: Math.round(total),
    perPersonTotal: Math.round(convertFromUsd(estimate.perPersonTotal, currency)),
    perPersonPerDay: Math.round(
      convertFromUsd(estimate.perPersonPerDay, currency)
    ),
    fitsBudget: args.availableBudget
      ? total <= args.availableBudget
      : undefined,
  };
}