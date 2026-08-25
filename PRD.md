# Product Requirements Document: PocketTripAI — AI Travel Planner

## 0. Current Status
- **2026-08-19** — Next.js 16 + React 19 + Tailwind v4 app scaffolded and building. Tech stack locked (see §7). Drizzle schema + migration generated. Landing page hero with motion animations live. Payments decision locked: Razorpay primary (see §10). FR-1 intake questionnaire built and verified. AI decision locked: Gemini Flash primary, Groq fallback, Ollama local (see §7). **FR-3 budget engine + FR-2 itinerary generation implemented and verified end-to-end** (Gemini 3.6 Flash; Nepal/Paris smoke-tested within budget). Next objectives: FR-10 auth (Supabase), FR-8 trip history, async generation progress, save trips to DB.
- **2026-08-19 (later)** — **FR-10 Supabase auth implemented** (email/password + Google OAuth), `src/proxy.ts` session refresh + route guards (Next 16 convention), `/login` + `/signup` pages, `syncUser()` upsert. **FR-8 trip history live**: trips persist on generation (`trips` + `preference_snapshots` + `plans`), `/trips` list + `/trips/[id]` detail rendering saved itineraries; guests get a "sign in to save" prompt. **Freemium gate live** (option A): `plan_counter` + `plan_month`, free users blocked at 2 plans/month with 429 + upgrade messaging. All flows e2e-verified: login→generate→save→history→limit. Next: async generation + progress UI (FR-4 revision passes), pricing/upgrade page, UI polish.
- **2026-08-19 (night)** — **FR-4 budget constraint enforcement implemented**: `checkBudgetFit()` verifies every fixed-budget plan (per-person total ≤ 105% of hard budget AND itemized activity spend ≤ 115%) with a gaming guard; `generateItinerary` runs up to 2 automatic **revision passes** feeding exact overage feedback; hard-budget line now always in the prompt even for out-of-model destinations; UI shows green "Fits your budget" badge or amber over-budget warning. Verified: 8/8 unit tests on `checkBudgetFit`, live tests on Gemini (Paris $400 fits, Kathmandu $600 fits, Tokyo unlimited `enforced:false`) + Ollama. Known caveat: tiny local models (qwen3:8b) can game the check by zeroing activity costs — Gemini produces realistic costs. Next: FR-6 editable itinerary, FR-7 budget dashboard, async generation + progress.
- **2026-08-20 (FR-6 + FR-7)** — **Editable itinerary + budget dashboard shipped**. Refactored budget-fit logic into pure client-safe `src/lib/trip/budget-fit.ts` (reused for live recalculation). **FR-6**: `ItineraryView` is now editable via `editable`/`onEdit` — reorder/delete days (min 1, auto-renumber), add day, reorder/edit/delete activities (inline time/title/desc/cost/category), add activity per day; every edit live-recomputes day/total spend + budget-fit. New `PATCH /api/trips/[id]` persists edits (auth + ownership + latest-plan update + total_cost recompute). Fresh guest results are editable ephemerally; saved trips get an Edit/Discard/Save-changes toolbar (`SavedItinerary`). **FR-7**: `BudgetDashboard` with per-day spend bars, category stacked-bar breakdown, and a budget panel (est. total, activities spend, hard budget + remaining, buffer). Verified: 8/8 unit tests pass on refactored module; PATCH round-trip on real Kathmandu trip (edit persists, 401 no-auth, 404 bad id, 400 invalid body, restore works); saved-trip page SSR renders toolbar + all dashboard sections; lint + build clean. Next: FR-9 export, pricing/upgrade page, async generation + progress.
- **2026-08-20 (async generation + progress)** — **Signed-in only, job-based generation**. Product decision: guests removed — auth required for all trip/plan functionality (proxy now guards `/plan` too; homepage stays public). `plans` gained `input jsonb` (stored `TripFormValues`), `stage text`, `started_at`; migration `0002` applied. `src/lib/trip/job-queue.ts` is a 2s in-process worker (claim `queued→generating` atomically, streams `stage` per AI call via new `onStage` option on `generateItinerary`, writes itinerary + total_cost + `completed`; on failure → `failed` + `errorMessage` + **refunds** the reserved free-plan slot). Started from `src/instrumentation.ts` `register()` (guarded `NEXT_RUNTIME === "nodejs"`); `recoverStalePlans()` marks >10min `generating` as failed on restart. `POST /api/trips` now reserves the plan slot, returns `{ tripId, planId, status:"queued", usage }` in ~2s (no AI call); new `GET /api/plans/[id]` polls status/stage and returns the full result payload on completion (budget + budgetFit recomputed deterministically from trip + itinerary). `trip-form.tsx` shows an animated progress card with stage messages ("Starting…", "Building your itinerary…", "Revising to fit your budget…"), polls every 2s with a 5-min timeout, renders the existing result UI on completion, Retry on failure; guest "sign in to save" prompt removed. Verified on Ollama: authed E2E (POST ~2s queued → poll queued/generating → completed with itinerary/budget/budgetFit/saved/usage; plan slot reserved 0→1; DB trip+plan persisted; 401 no-session POST, 307 redirects for /plan + /trips, homepage 200 public, 404 cross-user/unknown plan, 429 at limit, refund + recovery paths), lint + build clean. Next: FR-9 export, pricing/upgrade page.
- **2026-08-20 (pricing/upgrade)** — **Pricing page + dev "activate Pro" path** (Option A; Razorpay deferred to v1.5). `/pricing` is public: Free (₹0 — 2 AI plans/month, unlimited editing, budget dashboard, markdown export) vs **Pro ₹299/month** (unlimited AI plans, priority generation, PDF export coming soon), "Most popular" styling; signed-in shows current plan + free plans remaining, CTAs = Upgrade to Pro / "You're on Pro" / Sign in to upgrade. `POST/DELETE /api/upgrade` flips `subscription_tier` pro/free (gates via existing `checkPlanUsage`, which returns unlimited for non-free); **guarded to 501 in production unless `UPGRADE_BYPASS=true`** so real users can't self-upgrade. Nav gains a Pricing link; trip-form 429 error now shows an **Upgrade → /pricing** button (via `plan_limit_reached` code) and the "used all free plans" text links to pricing. Verified on Ollama (18/18): public + signed-in + pro pricing renders, 401 no-session upgrade, activate→pro→gate unlocked (no 429 past limit), downgrade→free, 501 without bypass flag, DB tiers confirmed; lint + build clean; test user restored to free/0. Next: FR-9 export (markdown free / PDF pro), Razorpay checkout (v1.5).
- **2026-08-20 (Groq fix + toasts)** — **Groq made reliable + sonner toasts.** Provider now auto-resolves the Groq model from the live `/models` list against a priority list (`llama-3.3-70b-versatile` → `llama-4-scout` → `gpt-oss-120b` → `gpt-oss-20b` → `qwen3.6-27b` → `llama-3.1-8b-instant`; explicit `GROQ_MODEL` always wins, 404 → falls through to next candidate). Structured output gets a `json_object` retry on schema rejection (400/422). Groq free tier caps TPM at 8k and **counts max_tokens toward it**, so max_tokens defaults to 6000 on Groq only (providers keep full output elsewhere). Root cause of the original 404: the free account has no Llama models — `llama-3.3-70b-versatile` doesn't exist for it; also qwen3.6-27b (reasoning) produces output Groq rejects for large structured prompts, so `gpt-oss-120b` is preferred (5-7s, valid JSON, budget-fitting output). **sonner toasts** installed + `<Toaster/>` in root layout; wired into SavedItinerary save (success/error), UpgradeButton (success/error), and trip-form generation (ready/failed). Verified: `/api/ai/test` → `ok:true provider:groq model:openai/gpt-oss-120b`; full queued E2E on Groq (Bangkok $700/2pax → completed, budgetFit `fits:true, overage:0`); lint + build clean; test user restored to free/0. Next: FR-9 export (markdown free / PDF pro), Razorpay checkout (v1.5).
- **2026-08-20 (FR-9 export)** — **Markdown + PDF export shipped.** `src/lib/trip/export-markdown.ts`: pure `itineraryToMarkdown()` (title/dates/party header, summary, budget category table + totals, per-day sections with lodging/meals/activity table + descriptions, notes) + `downloadTextFile()`/`safeFilename()` helpers. `ExportButtons` client component: **Download .md** (always) + **Export PDF** (Pro only), rendering a print-only `PrintableItinerary` inside `#print-area`; `@media print` CSS (visibility-hide all but `#print-area`, absolute-positioned) produces a clean white-on-black PDF via the browser's Save-as-PDF. Gating via new `getSubscriptionTier(userId)` helper; `isPro` threaded from `/plan` + `/trips/[id]` server components into `TripForm`/`SavedItinerary` (exports the *edited* itinerary so edits are included). Verified: markdown util output check; SSR check on `/trips/[id]` — free shows Download .md + no Export PDF, pro shows both; lint + build clean; test trip deleted + user restored to free/0. Next: Razorpay checkout (v1.5), UI polish.

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

## 7. Tech Stack & Architecture (locked 2026-08-19)
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + **shadcn/ui** components.
- **Backend**: Next.js route handlers (single-deploy simplicity). Extract a worker if AI orchestration grows.
- **Async generation**: queue job → POST /api/plans → client polls → WebSocket or SSE for streaming progress. Client state via **TanStack Query**.
- **Database/Auth/Storage**: **Supabase** (Postgres + Auth + object storage); row-level security scopes data per user.
- **ORM**: **Drizzle** (SQL-first, fully typed) + drizzle-kit migrations.
- **AI stack**: provider-agnostic **OpenAI-compatible adapter** (one interface, base-URL + key swap). Primary **Gemini Flash** (free tier, no card, JSON-schema output + tool calling); fallback **Groq** (no training on data); local dev via **Ollama (Qwen3 8B)** on the RTX 3060 Ti. All three support JSON structured output + function/tool calls for the `computeBudget()` tool.
- **Budget engine**: deterministic TS module — cost-model table (`/data/cost-models/{city}.ts`) with categories; multiplier by style.
- **Icons**: lucide-react.
- **Animation**: `motion` (hero/scroll reveals) + Tailwind keyframes (micro-interactions) + React `<ViewTransition>` (route transitions, native in this React version).
- **Forms/validation**: react-hook-form + Zod.
- **LLM cost control**: caching identical input hashes, prompt caching, gating free users to N plans.

## 8. Data Model (Drizzle tables, high level)
- `Users` — auth linkage, plan counters, subscription tier.
- `Trips` — destination, dates, party size, style, budget type/amount.
- `Plans` — versioned generated plans (status, structured itinerary JSON).
- `PlanDays` — per-day activities, transit, meals.
- `CostItems` — category, amount, currency.
- `PreferenceSnapshot` — interests, pace, saved per generation.

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

## 10a. Payments & Billing (locked 2026-08-19)
- **Primary: Razorpay** — one integration for both customer bases (Indian + international travelers):
  - **Domestic**: UPI, cards, net banking, wallets (~2% + GST). **UPI Autopay** for frictionless subscription mandates.
  - **International**: Razorpay International PG (RBI PA-CB licensed, Dec 2025) — USD/cards from 135+ countries, INR settlement T+2/T+3, **auto eFIRC** per transaction.
- **No credit card required** — Razorpay settles directly to an Indian bank account / UPI; onboarding works for sole proprietors.
- **Subscriptions**: Razorpay Subscriptions (recurring billing, smart retry/dunning) mapped to the Pro tier and per-plan gating.
- **Compliance plan**: register for **GST** (free) + file **LUT** once revenue starts → SaaS exports become **zero-rated**; keep eFIRC/FIRA records for the CA. Solopreneur KYC suffices initially.
- **Fallbacks**: Cashfree later for lower domestic fees (1.6–1.95%); Dodo/Polar MoR only as a "no tax admin" global shortcut — not needed now (Lemon Squeezy/Gumroad payouts to India are blocked via Stripe).
- **Integration**: Razorpay Checkout JS (`@razorpay/checkout`) in Next.js; webhooks for `payment.authorized` / subscription events → update `users.subscription_tier` + `plan_counter`. Bill INR domestically, USD internationally.
- **Timing**: architecture decision now; implementation in **v1.5** (post-MVP) so it does not block FR-1.

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
- Auth strategy confirmed as Supabase Auth (email/OAuth) — finalize OAuth providers.
- **Indian solo-founder payment lockouts** — Stripe has paused solo/individual onboarding; Lemon Squeezy & Gumroad pay out India via Stripe Connect (blocked). Razorpay avoids both. Verify Razorpay IPG activation with sole-proprietor KYC before relying on it.
- **GST/LUT timing** — register for GST + file LUT once meaningful revenue begins; until then keep eFIRC records to preserve zero-rated export treatment.
- **LLM provider**: locked — Gemini Flash (primary) + Groq (fallback) + Ollama (local dev), via OpenAI-compatible adapter. **Gemini free tier may use prompts for training** — acceptable for v1 travel data; flip to Groq-primary via env config if privacy becomes a requirement.
