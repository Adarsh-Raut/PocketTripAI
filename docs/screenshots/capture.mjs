// Local-only: captures showcase screenshots using the local dev DB + dev login.
// Run: npm run dev -- -p 3100        (needs DEV_LOGIN=1, NEXT_PUBLIC_DEV_LOGIN=1,
//                                      UPGRADE_BYPASS=true and a working AI provider in .env.local)
//      node docs/screenshots/capture.mjs
// Needs `playwright` resolvable (e.g. npm i --no-save playwright).
// One real itinerary is generated through the app; the demo user is switched
// to Pro for the run (so exports show) and back to Free afterwards.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = process.env.OUT_DIR ?? path.dirname(fileURLToPath(import.meta.url));
const EMAIL = "demo@example.com";
const SIZES = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const TRIP = {
  destination: "Lisbon, Portugal",
  startDate: "2027-03-10",
  endDate: "2027-03-14",
  travelStyle: "standard",
  budgetType: "fixed",
  budgetAmount: "1800",
  currency: "USD",
  partySize: 2,
  pace: "balanced",
  interests: ["food", "culture"],
};

const browser = await chromium.launch();
const mk = (label, scheme = "light") =>
  browser.newContext({
    viewport: SIZES[label], deviceScaleFactor: 2, reducedMotion: "reduce", colorScheme: scheme,
    isMobile: label === "mobile", hasTouch: label === "mobile",
  });
const login = async (ctx) => { await (await ctx.newPage()).goto(`${BASE}/api/dev-login?email=${EMAIL}&next=/trips`); };

// 1. Generate one trip through the real API (or reuse one with TRIP_ID=<uuid>).
const setup = await mk("desktop");
await login(setup);
await setup.request.post(`${BASE}/api/upgrade`);
const start = process.env.TRIP_ID ? { ok: true, tripId: process.env.TRIP_ID, planId: null } : await (await setup.request.post(`${BASE}/api/trips`, { data: TRIP })).json();
if (!start.ok) throw new Error(`Trip creation failed: ${JSON.stringify(start)}`);
for (let i = 0; start.planId && i < 90; i++) {
  const r = await (await setup.request.get(`${BASE}/api/plans/${start.planId}`)).json();
  if (r.status === "completed") break;
  if (r.status === "failed") throw new Error(`Generation failed: ${r.error ?? r.errorMessage}`);
  await new Promise((r) => setTimeout(r, 2000));
}
await setup.close();
const tripUrl = `${BASE}/trips/${start.tripId}`;

const hide = (page) => page.addStyleTag({ content: "html{scroll-behavior:auto!important} nextjs-portal{display:none!important}" });
const save = async (page, name, label, full = false) => {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${name}-${label}.png`), fullPage: full });
  console.log("saved", `${name}-${label}.png`);
};
const scrollToText = (page, text) =>
  page.getByText(text, { exact: false }).first().evaluate((el) => {
    el.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy({ top: -24, behavior: "instant" });
  });

for (const label of Object.keys(SIZES)) {
  // Public screens
  const anon = await mk(label);
  for (const [name, route] of [["landing", "/"], ["pricing", "/pricing"], ["login", "/login"]]) {
    const page = await anon.newPage();
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await hide(page);
    await save(page, name, label);
    await page.close();
  }
  await anon.close();

  // Signed-in screens
  const ctx = await mk(label);
  await login(ctx);
  const page = await ctx.newPage();

  await page.goto(BASE + "/plan", { waitUntil: "networkidle" });
  await hide(page);
  await page.locator("#destination").fill(TRIP.destination);
  await page.locator("#startDate").fill(TRIP.startDate);
  await page.locator("#endDate").fill(TRIP.endDate);
  await save(page, "plan", label);

  await page.goto(tripUrl, { waitUntil: "networkidle" });
  await hide(page);
  await save(page, "trip", label);
  await scrollToText(page, "Budget").catch(() => {});
  await save(page, "budget", label);
  await scrollToText(page, "Day 1 —");
  await save(page, "itinerary", label);

  await page.goto(BASE + "/trips", { waitUntil: "networkidle" });
  await hide(page);
  await save(page, "trips", label);
  await ctx.close();

  // Dark mode
  const dark = await mk(label, "dark");
  await login(dark);
  const dp = await dark.newPage();
  await dp.goto(tripUrl, { waitUntil: "networkidle" });
  await hide(dp);
  await save(dp, "trip-dark", label);
  await dark.close();
}

// Restore the demo user to the Free tier.
const end = await mk("desktop");
await login(end);
await end.request.delete(`${BASE}/api/upgrade`);
await end.close();
await browser.close();
