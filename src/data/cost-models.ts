import type { CityCostModel } from "@/lib/budget/types";

export const costModels: CityCostModel[] = [
  {
    city: "Paris",
    country: "France",
    aliases: ["paris", "france", "paris france"],
    currency: "USD",
    baseDaily: { lodging: 120, food: 55, transport: 12, attractions: 25 },
  },
  {
    city: "London",
    country: "United Kingdom",
    aliases: ["london", "united kingdom", "uk", "england"],
    currency: "USD",
    baseDaily: { lodging: 130, food: 55, transport: 15, attractions: 28 },
  },
  {
    city: "Kathmandu",
    country: "Nepal",
    aliases: ["nepal", "kathmandu", "pokhara"],
    currency: "USD",
    baseDaily: { lodging: 25, food: 12, transport: 5, attractions: 10 },
    visa: 50,
  },
  {
    city: "Tokyo",
    country: "Japan",
    aliases: ["tokyo", "japan", "kyoto", "osaka"],
    currency: "USD",
    baseDaily: { lodging: 90, food: 40, transport: 8, attractions: 20 },
  },
  {
    city: "Bangkok",
    country: "Thailand",
    aliases: ["thailand", "bangkok", "phuket", "chiang mai"],
    currency: "USD",
    baseDaily: { lodging: 35, food: 15, transport: 5, attractions: 12 },
  },
  {
    city: "New York",
    country: "United States",
    aliases: ["new york", "nyc", "new york city", "usa", "america"],
    currency: "USD",
    baseDaily: { lodging: 160, food: 70, transport: 15, attractions: 35 },
  },
  {
    city: "Bali",
    country: "Indonesia",
    aliases: ["indonesia", "bali", "ubud"],
    currency: "USD",
    baseDaily: { lodging: 40, food: 18, transport: 6, attractions: 14 },
  },
  {
    city: "Rome",
    country: "Italy",
    aliases: ["rome", "italy", "milan", "florence"],
    currency: "USD",
    baseDaily: { lodging: 100, food: 45, transport: 10, attractions: 22 },
  },
  {
    city: "Lisbon",
    country: "Portugal",
    aliases: ["lisbon", "portugal", "porto"],
    currency: "USD",
    baseDaily: { lodging: 70, food: 35, transport: 8, attractions: 18 },
  },
  {
    city: "Dubai",
    country: "United Arab Emirates",
    aliases: ["dubai", "uae", "united arab emirates"],
    currency: "USD",
    baseDaily: { lodging: 110, food: 50, transport: 12, attractions: 30 },
  },
];

export function findCityModel(destination: string): CityCostModel | null {
  const normalized = destination.trim().toLowerCase();
  return (
    costModels.find(
      (model) =>
        normalized === model.city.toLowerCase() ||
        model.aliases.some((alias) => normalized === alias)
    ) ?? null
  );
}