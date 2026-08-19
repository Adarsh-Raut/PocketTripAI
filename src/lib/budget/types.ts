import { travelStyles } from "@/lib/trip/schema";

export type TravelStyle = (typeof travelStyles)[number];

export type CostCategory = "lodging" | "food" | "transport" | "attractions";

export interface BaseDailyCost {
  lodging: number;
  food: number;
  transport: number;
  attractions: number;
}

export interface CityCostModel {
  city: string;
  country: string;
  aliases: string[];
  currency: string;
  baseDaily: BaseDailyCost;
  visa?: number;
}

export interface BudgetInput {
  destination: string;
  days: number;
  partySize: number;
  travelStyle: TravelStyle;
  flightPerPerson?: number;
}

export interface BudgetLineItem {
  category: string;
  perPersonDaily: number;
  subtotal: number;
}

export interface BudgetResult {
  destination: string;
  cityModel: {
    city: string;
    country: string;
    currency: string;
  };
  travelStyle: TravelStyle;
  days: number;
  partySize: number;
  lineItems: BudgetLineItem[];
  oneOff: number;
  subtotal: number;
  buffer: number;
  total: number;
  perPersonTotal: number;
  perPersonPerDay: number;
  fitsBudget?: boolean;
  currency: string;
}