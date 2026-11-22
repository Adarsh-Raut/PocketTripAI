import { NextResponse } from "next/server";
import { getActiveProvider } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Diagnostic endpoint. Each call makes real AI requests, so it is off in
// production unless AI_TEST_ENABLED=true, and always needs a signed-in user.
export async function GET() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.AI_TEST_ENABLED !== "true"
  ) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to run the AI check" },
      { status: 401 }
    );
  }

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