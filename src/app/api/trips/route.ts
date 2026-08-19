import { NextResponse } from "next/server";
import { tripFormSchema } from "@/lib/trip/schema";
import { generateItinerary } from "@/lib/trip/generate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = tripFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid trip parameters",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateItinerary(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Itinerary generation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}