import { CalendarDays, Download, Gauge, MapPin, PencilLine, Wallet } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Budget-fit plans",
    desc: "Every line item is priced and totaled against your ceiling before you see it.",
  },
  {
    icon: PencilLine,
    title: "Edit anything",
    desc: "Swap a restaurant, drop an activity, upgrade a hotel — the budget recalculates live.",
  },
  {
    icon: Gauge,
    title: "Budget dashboard",
    desc: "See where the money goes with a category-by-category breakdown.",
  },
  {
    icon: MapPin,
    title: "Any destination",
    desc: "From Paris to Pokhara — pick a city or country, we do the rest.",
  },
  {
    icon: CalendarDays,
    title: "Any length",
    desc: "A weekend, a week, or a month of slow travel. Plans scale to fit.",
  },
  {
    icon: Download,
    title: "Export & go",
    desc: "Save as Markdown or PDF and take your plan with you, offline.",
  },
];

export function Features() {
  return (
    <section className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-widest text-terracotta uppercase">
            Why PocketTripAI
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to plan smarter, not harder
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-3xl border bg-card p-7 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-forest/10 text-forest dark:bg-sage/10 dark:text-sage">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}