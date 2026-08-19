import { NextResponse } from "next/server";
import { getActiveProvider } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getActiveProvider();

  try {
    const [ping, structured] = await Promise.all([
      provider.ping(),
      provider.generateStructured<{
        destination: string;
        days: number;
        budget: number;
      }>({
        temperature: 0.2,
        system:
          "You are a helpful travel assistant. Always respond with valid JSON matching the required schema.",
        prompt:
          "Plan a budget trip to Paris for 5 days. Return the destination, number of days, and an estimated daily budget in USD.",
        schema: {
          type: "object",
          properties: {
            destination: { type: "string" },
            days: { type: "integer" },
            budget: { type: "number" },
          },
          required: ["destination", "days", "budget"],
          additionalProperties: false,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      provider: provider.config.name,
      model: ping.model,
      structured,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI provider error";
    return NextResponse.json(
      {
        ok: false,
        provider: provider.config.name,
        error: message,
        hint: `Check your ${
          provider.config.name === "gemini"
            ? "GEMINI_API_KEY"
            : provider.config.name === "groq"
              ? "GROQ_API_KEY"
              : "OLLAMA_BASE_URL"
        } env var or set AI_PROVIDER.`,
      },
      { status: 500 }
    );
  }
}