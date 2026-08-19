# Product Requirements Document: PocketTripAI — AI Travel Planner

## 1. Problem Statement
Planning a trip is a multi-step, high-friction process: choosing dates, matching a destination to a budget, estimating costs, and building a day-by-day itinerary. Most tools give generic guides; users still can't answer "**can I afford 9 days in Nepal on $1,200?**" and get a concrete, itemized plan back in minutes.

## 2. Product Vision
A conversational AI travel planner that takes a few inputs (destination, dates, budget) and returns a **complete, itemized, day-by-day itinerary that fits the user's budget** — editable, shareable, and exportable. The user always specifies the city/country they want to visit; we never auto-suggest a destination.

## 3. Target Users & Personas
- **Primary (v1): Budget-conscious travelers** — students, backpackers, first-time international travelers (ages 18–35).
- Secondary (later): families on fixed budgets, luxury travelers (unlimited budget mode).
- **Personas:** *Sam, the backpacker* (wants to max experience on $1k), *Priya, the planner* (wants family trip under a strict ceiling), *Alex, the aspirer* (has no budget limit, wants the best-of-everything plan).

## 4. Core User Journey
1. **Onboarding questionnaire** (chunky, 5–7 questions): destination (required, user-specified), dates/duration, travel style, budget type (fixed vs unlimited), party size, interests (food/nature/adventure/culture/relaxation), pace (packed vs relaxed).
2. **AI generation** (async, ~10–30s): LLM plans the trip; **budget engine** validates and re-iterates until the plan fits.
3. **Review & edit**: day-by-day timeline, budget breakdown by category, per-item costs, and "swap / cheaper option / upgrade" suggestions.
4. **Budget dashboard**: live re-optimization when user tweaks anything (e.g., "shorter stay", "cheaper hotels").
5. **Export/share**: PDF, markdown, shareable link, save to account.

## 5. Functional Requirements (prioritized)

### MVP (v1)
- **FR-1 Trip intake questionnaire** — with presets and smart defaults. Destination is user-specified (free-text city/country with autocomplete validation).
- **FR-2 Itinerary generation (AI)** — structured output: daily plan with activities, meals, transit, lodging.
- **FR-3 Budget engine** — per-city base cost model × travel-style multiplier × party size × duration; itemized estimates (lodging, food, transport, attractions, buffer).
- **FR-4 Budget constraint enforcement** — AI proposes a plan; budget engine computes; if over budget, the system triggers a revision pass to bring it under (adjusting hotel tier, meal plan, activity count).
- **FR-5 Unlimited-budget mode** — no constraint; recommends top-tier lodging/dining/experiences.
- **FR-6 Editable itinerary** — add/remove/reorder days & activities; each edit re-runs cost calc.
- **FR-7 Budget dashboard** — category pie chart, per-day spend, remaining buffer, "over/under" indicators.
- **FR-8 Trip history** — saved plans per user.
- **FR-9 Export** — PDF & markdown.
- **FR-10 Auth** — email/OAuth (needed for saving & freemium gating).

### v1.5 (next)
- Group/party split-cost breakdown.
- Currency conversion + local-language phrase guide.
- Weather-aware suggestions (indoor/outdoor swap).
- AI "ask follow-up" chat on an existing plan.

### v2 (later)
- Live flight/hotel price checks (Amadeus/Skyscanner/Booking APIs).
- One-tap booking links (affiliate).
- Offline mobile app / PWA.
- Community-shared itineraries.

## 6. Non-Functional Requirements
- **Cost per plan**: LLM + tool-call budget ≤ $0.15/plan at peak.
- **P95 generation time** < 45s (async with progress polling).
- **Reliability**: structured JSON output enforced (schema validation + retries).
- **Security**: no PII in LLM prompts; secure secrets handling; rate limiting.

## 7. Proposed Architecture (Next.js, TypeScript)
- **Frontend**: Next.js (App Router) + Tailwind; server components; react-query for async generation status.
- **Backend**: Next.js API routes / route handlers (single-deploy simplicity). If AI orchestration grows, extract a worker.
- **Async generation**: queue job → POST /api/plans → client polls → WebSocket or SSE for streaming progress.
- **AI stack**: LLM provider (e.g., Anthropic/OpenAI) with **structured output**; **function/tool calls** for a `computeBudget()` tool that the model invokes.
- **Budget engine**: deterministic TS module — cost-model table (`/data/cost-models/{city}.ts`) with categories; multiplier by style.
- **Data**: Postgres (Neon/Supabase) + Prisma; KV store for job state; object storage for exports.
- **LLM cost control**: caching identical input hashes, prompt caching, gating free users to N plans.

## 8. Data Model (high level)
- `User`, `Trip` (destination, dates, party size, style, budget type/amount), `Plan` (versioned), `PlanDay` (activities, transit, meals), `CostItem` (category, amount, currency), `PreferenceSnapshot`.

## 9. Cost Model Design (the differentiator)
Per city, base daily cost per travel style:
```
cityDailyCost = {
  lodging: {hostel, budget, mid, luxury, ultra},
  food: {street, casual, fine, tasting},
  transit: {public, rideshare, private},
  attractions: {free, standard, premium},
}
```
Trip total = Σ(daily) × days + one-off (flights, visas, gear) + 15% buffer. This table is seeded from public cost-of-living data and curated per top-50 destinations in v1.

## 10. Monetization (Freemium)
- **Free**: 2 generated plans/month, basic export (markdown), community templates.
- **Pro ($4–6/mo)**: unlimited plans, PDF export, budget re-optimization, group split, weather-aware swapping, priority speed, booking links.

## 11. Success Metrics
- Activation: % who complete questionnaire.
- Conversion: % questionnaire → generated plan.
- Budget fit: % plans delivered under budget (with buffer).
- Retention: plans created per user / month; re-edit rate.
- Pro conversion rate.

## 12. Risks & Open Questions
- **Cost drift**: LLM pricing changes → mitigation: caching, cheaper model tier for re-optimization.
- **Hallucinated prices/destinations** → mitigation: constrained cost model + only-known-destination list.
- **Refund/mistake liability** — add "estimates only" disclaimers.
- **Rate limits / abuse** → account gating, email verification.
- Which LLM provider(s)? (need decision in setup)
- Auth provider choice.
