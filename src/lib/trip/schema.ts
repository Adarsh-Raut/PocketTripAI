import { z } from "zod";

export const travelStyles = ["budget", "standard", "comfort", "luxury"] as const;
export const budgetTypes = ["fixed", "unlimited"] as const;
export const paces = ["packed", "balanced", "relaxed"] as const;
export const interests = [
  "food",
  "nature",
  "adventure",
  "culture",
  "relaxation",
  "shopping",
  "nightlife",
] as const;
export const currencies = ["USD", "EUR", "INR", "GBP", "JPY", "AUD"] as const;

export const tripFormSchema = z
  .object({
    destination: z
      .string()
      .trim()
      .min(2, "Enter the city or country you want to visit"),
    startDate: z.string().min(1, "Choose a start date"),
    endDate: z.string().min(1, "Choose an end date"),
    travelStyle: z.enum(travelStyles),
    budgetType: z.enum(budgetTypes),
    budgetAmount: z.string().optional(),
    currency: z.enum(currencies),
    partySize: z
      .number()
      .min(1, "At least 1 traveler")
      .max(50, "Max 50 travelers"),
    pace: z.enum(paces),
    interests: z
      .array(z.enum(interests))
      .min(1, "Pick at least one interest"),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after the start date",
      });
    }
    if (
      data.budgetType === "fixed" &&
      (!data.budgetAmount || Number(data.budgetAmount) <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetAmount"],
        message: "Enter your total trip budget",
      });
    }
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;

export const stepFields: (keyof TripFormValues)[][] = [
  ["destination", "startDate", "endDate"],
  ["travelStyle", "budgetType", "budgetAmount", "currency"],
  ["partySize", "pace"],
  ["interests"],
];

export const travelStyleLabels: Record<
  (typeof travelStyles)[number],
  { label: string; description: string }
> = {
  budget: {
    label: "Budget",
    description: "Hostels, street food, public transit",
  },
  standard: {
    label: "Standard",
    description: "Mid-range hotels, casual dining",
  },
  comfort: {
    label: "Comfort",
    description: "Nice hotels, fine dining, some upgrades",
  },
  luxury: {
    label: "Luxury",
    description: "Top-tier stays and experiences",
  },
};

export const interestLabels: Record<
  (typeof interests)[number],
  string
> = {
  food: "Food & dining",
  nature: "Nature & outdoors",
  adventure: "Adventure",
  culture: "Culture & history",
  relaxation: "Relaxation",
  shopping: "Shopping",
  nightlife: "Nightlife",
};

export const paceLabels: Record<(typeof paces)[number], string> = {
  packed: "Packed",
  balanced: "Balanced",
  relaxed: "Relaxed",
};

export const activityCategories = [
  "attraction",
  "food",
  "transport",
  "free",
] as const;

export const itineraryActivitySchema = z.object({
  time: z.string(),
  title: z.string(),
  description: z.string(),
  cost: z.number().min(0, "Cost cannot be negative"),
  category: z.enum(activityCategories),
});

export const itineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  date: z.string(),
  summary: z.string(),
  lodging: z.string(),
  meals: z.array(z.string()),
  activities: z.array(itineraryActivitySchema),
});

export const itinerarySchema = z.object({
  destination: z.string(),
  travelStyle: z.enum(travelStyles),
  days: z.number().int().positive(),
  partySize: z.number().int().positive(),
  summary: z.string(),
  dailyBudgetPerPerson: z.number().positive(),
  totalBudget: z.number().nonnegative(),
  daysPlan: z.array(itineraryDaySchema),
  notes: z.array(z.string()),
});

export type Itinerary = z.infer<typeof itinerarySchema>;

export type ItineraryActivity = z.infer<typeof itineraryActivitySchema>;
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;