import { CalendarDays, ListChecks, MapPin } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Tell us about your trip",
    desc: "Destination, dates, travelers, and the number you can spend. Takes two minutes.",
  },
  {
    number: "02",
    icon: CalendarDays,
    title: "AI builds the itinerary",
    desc: "A complete day-by-day plan with real landmarks, meals, lodging, and transit — priced to your budget.",
  },
  {
    number: "03",
    icon: ListChecks,
    title: "Edit, review, export",
    desc: "Swap any item, check the live budget dashboard, then save or export for the road.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-widest text-terracotta uppercase">
            How it works
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From blank page to packed itinerary in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, desc }) => (
            <div
              key={number}
              className="group relative overflow-hidden rounded-3xl border bg-card p-7 shadow-sm transition-shadow hover:shadow-lg"
            >
              <span className="pointer-events-none absolute -top-3 -right-2 font-heading text-7xl font-semibold text-muted/60 select-none">
                {number}
              </span>
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