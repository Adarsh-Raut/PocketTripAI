import { NextResponse } from "next/server";
import { computeBudget } from "@/lib/budget/engine";
import { travelStyles } from "@/lib/trip/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const samples = [
    { destination: "Paris", days: 9, partySize: 1, travelStyle: "budget" as const },
    { destination: "Nepal", days: 9, partySize: 1, travelStyle: "budget" as const },
    { destination: "Tokyo", days: 7, partySize: 2, travelStyle: "standard" as const },
    { destination: "Mars", days: 3, partySize: 1, travelStyle: "luxury" as const },
  ];

  const results = samples.map((sample) => ({
    input: sample,
    result: computeBudget(sample),
  }));

  return NextResponse.json({
    ok: true,
    travelStyles,
    results,
  });
}