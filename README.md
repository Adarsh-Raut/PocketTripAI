# 🧭 PocketTripAI

> Tell it where you want to go and what you can spend. Get a complete, itemized, day-by-day itinerary that fits your budget.

PocketTripAI is an AI travel planner built with **Next.js 16**, **Drizzle + Postgres**, and **Supabase Auth**. You choose the destination, dates, travel style and budget. An LLM drafts the itinerary, and a budget engine checks it against your ceiling. If it is over budget, the plan is revised automatically.

![PocketTripAI landing page](docs/screenshots/landing.webp)

| Itinerary | Budget dashboard |
| --- | --- |
| ![Day-by-day itinerary](docs/screenshots/itinerary.webp) | ![Budget dashboard](docs/screenshots/budget.webp) |

The same itinerary in dark mode:

![Saved trip in dark mode](docs/screenshots/trip-dark.webp)

*Screenshots show a real itinerary generated for a sample 5-day Lisbon trip on the local dev setup. To regenerate them, see [Screenshots](#-screenshots).*

---

## ✨ Features

- 📝 **Trip intake** — destination, dates, travel style, party size, pace and interests, with sensible defaults
- 🤖 **AI itineraries** — structured day-by-day plans (activities, meals, lodging) validated with Zod
- 💰 **Budget enforcement** — fixed budgets are verified, with up to 2 automatic revision passes; unlimited mode has no constraint
- 📊 **Budget dashboard** — per-day spend, category breakdown, remaining buffer, over/under indicators
- ✏️ **Editable plans** — reorder, add or remove days and activities; costs recalculate live
- ⏳ **Async generation** — job queue with progress stages, polling and automatic refund of the plan slot on failure
- 💾 **Trip history** — saved plans per user
- 📤 **Export** — Markdown for everyone, PDF (print-to-PDF) for Pro
- 💳 **Freemium** — 2 free AI plans per month, Pro unlimited (payments deferred, dev upgrade path included)
- 🔌 **Provider-agnostic AI** — Gemini, Groq (auto-selects an available model) or local Ollama
- 🌙 **Dark mode** — system-aware, forest/sage palette with serif headings

---

## 🛠 Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) + React 19     |
| Language   | TypeScript                                        |
| Auth       | Supabase Auth (email/password + Google OAuth)     |
| Database   | PostgreSQL + Drizzle ORM                          |
| AI         | OpenAI-compatible SDK → Gemini / Groq / Ollama    |
| Styling    | Tailwind CSS 4 + shadcn/ui (Base UI) + Motion     |
| Forms      | react-hook-form + Zod                             |
| Toasts     | sonner                                            |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker (for the local Postgres)
- An API key for one AI provider: [Groq](https://console.groq.com) (free), [Gemini](https://aistudio.google.com), or a local [Ollama](https://ollama.com)

### 1. Install

```bash
git clone https://github.com/Adarsh-Raut/PocketTripAI.git
cd PocketTripAI
npm install
```

### 2. Start the database

```bash
docker compose up -d     # Postgres on :5442
```

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` (see `.env.example` for all options):

```env
DATABASE_URL="postgresql://pockettrip:pockettrip@localhost:5442/pockettripai"

# AI — pick one provider: gemini | groq | ollama
AI_PROVIDER=groq
GROQ_API_KEY=your_key

# Local dev login (skips Supabase; development builds only)
DEV_LOGIN=1
NEXT_PUBLIC_DEV_LOGIN=1
UPGRADE_BYPASS=true
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are only needed for real Supabase auth (see below).

### 4. Migrate and run

```bash
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Sign in**, and press **Dev login (local only)**. Then head to **Plan a trip**.

Check the AI provider with `GET /api/ai/test` (needs a signed-in session; in production it returns 404 unless `AI_TEST_ENABLED=true`).

---

## 🔐 Authentication

**Local development** — with `DEV_LOGIN=1` the login page shows a *Dev login* button. It sets a cookie that the proxy and server client treat as a signed-in user (`src/lib/auth/dev-login.ts`). This is only active when `NODE_ENV === "development"`, so it can never run in a production build.

**Real auth** — create a [Supabase](https://supabase.com) project, add its URL and publishable key to `.env.local`, set `DATABASE_URL` to its Postgres connection string, run `npm run db:migrate`, and remove the `DEV_LOGIN` flags. To use Google sign-in, enable the provider in Supabase and add `http://localhost:3000/auth/callback` as a redirect URL.

---

## ☁️ Deploying to Vercel

1. Import the repo in Vercel. The framework (Next.js) is detected automatically.
2. Add these environment variables (Production):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   DATABASE_URL=...            # Supabase pooler URL (transaction mode, port 6543)
   AI_PROVIDER=groq            # or gemini
   GROQ_API_KEY=...            # or GEMINI_API_KEY
   ```

   Do **not** set `DEV_LOGIN`, `NEXT_PUBLIC_DEV_LOGIN` or `UPGRADE_BYPASS` in production. The last one would let anyone give themselves Pro.
3. Run the migrations once against Supabase, from your machine: `DATABASE_URL="<session or direct connection string>" npm run db:migrate`. Use port 5432, not the 6543 pooler, for migrations.
4. In Supabase, go to Authentication → URL Configuration. Set the Site URL to your Vercel domain and add `https://<your-domain>/auth/callback` to the redirect URLs.
5. Deploy. `vercel.json` pins functions to `sin1` (Singapore) to sit next to the database. Change it if your Supabase project is in another region.

Generation runs for up to 5 minutes (`maxDuration = 300`), which Vercel's Hobby plan allows with Fluid Compute (the default on new projects).

---

## 🧠 How It Works

1. `POST /api/trips` validates the form, reserves a free-plan slot, saves the trip and returns `queued` in about 2 seconds.
2. Right after responding, the same request keeps working through Next.js `after()` (`src/lib/trip/job-queue.ts`). It claims the plan and calls the AI provider, reporting a `stage` as it goes. The route sets `maxDuration = 300`, so this works on Vercel without a separate worker.
3. `checkBudgetFit()` verifies the plan against the hard budget. If it is over, the model is re-prompted with the exact overage, up to 2 times.
4. The client polls `GET /api/plans/[id]` and renders the itinerary and dashboard when it completes. On failure the slot is refunded. A plan stuck too long (function timed out or was redeployed mid-run) is failed and refunded the next time it is polled.
5. Saved trips can be edited in place; `PATCH /api/trips/[id]` persists the changes and recomputes totals.

---

## 🧱 Project Structure

```
src/
├── app/
│   ├── api/            # trips, plans, upgrade, budget estimate, ai/test, dev-login
│   ├── plan/           # Trip intake + generation
│   ├── trips/          # History list and saved trip detail
│   ├── pricing/  login/  signup/  auth/callback/
│   └── page.tsx        # Marketing landing
├── components/
│   ├── landing/  onboarding/  auth/  layout/  pricing/  ui/
├── db/                 # Drizzle schema + client
├── lib/
│   ├── ai/             # Provider adapter (Gemini / Groq / Ollama)
│   ├── auth/           # syncUser, usage limits, dev login
│   ├── budget/         # Per-city cost model engine
│   ├── supabase/       # Browser + server clients
│   └── trip/           # Schema, generation, budget-fit, job runner, markdown export
└── proxy.ts            # Session refresh + route guards
drizzle/                # SQL migrations
docs/screenshots/       # README screenshots + capture script
```

---

## 🧪 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate a migration from the schema
npm run db:migrate   # Apply migrations
npm run db:studio    # Drizzle Studio
```

---

## 📸 Screenshots

With the dev server running on port 3100 and the local env above:

```bash
npm run dev -- -p 3100
npm i --no-save playwright && npx playwright install chromium
node docs/screenshots/capture.mjs                 # generates a fresh trip via the AI provider
TRIP_ID=<uuid> node docs/screenshots/capture.mjs  # or reuse an existing trip
node docs/screenshots/optimize.mjs                # PNG -> small WebP for the README
```

Full-size captures go to `docs/screenshots/raw/` (gitignored). Only the four optimized WebP files the README uses are committed, about 190 KB in total, so the GitHub page loads quickly.

The script signs in as `demo@example.com`, switches that user to Pro for the run (so exports show) and back to Free afterwards. It writes desktop and mobile shots of the landing, pricing, login, plan, trip, budget, itinerary and trips screens, plus dark mode.

---

## 🔮 Roadmap

- Razorpay checkout (Pro currently uses a dev-only upgrade path)
- Currency conversion and local phrase guide
- Weather-aware suggestions
- Follow-up chat on an existing plan
- Live flight and hotel prices

See [PRD.md](PRD.md) for the full product spec and status log.

---

## 📄 License

MIT

---

Built by [Adarsh Raut](https://adarshraut.vercel.app)
