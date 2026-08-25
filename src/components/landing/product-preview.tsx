import { ArrowRight, CalendarDays, MapPin, Wallet } from "lucide-react";

const days = [
  {
    label: "Day 1 · Arrive",
    items: [
      { name: "Aiguille du Midi cable car", cat: "attraction", cost: "Free" },
      { name: "Fondue dinner, Le Serac", cat: "food", cost: "₹1,200" },
      { name: "Auberge le Mont Blanc", cat: "lodging", cost: "₹2,800" },
    ],
  },
  {
    label: "Day 2 · The Valley",
    items: [
      { name: "Lake Lac Blanc hike", cat: "attraction", cost: "Free" },
      { name: "Bus to Argentière", cat: "transport", cost: "₹240" },
      { name: "Market picnic lunch", cat: "food", cost: "₹480" },
    ],
  },
];

const chipColor: Record<string, string> = {
  attraction: "bg-forest/10 text-forest dark:text-sage",
  food: "bg-terracotta/10 text-terracotta",
  transport: "bg-olive/15 text-olive dark:text-olive",
  lodging: "bg-ochre/10 text-ochre",
};

export function ProductPreview() {
  return (
    <section className="relative -mt-28 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative rounded-3xl border border-border bg-card/80 shadow-2xl shadow-forest/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <span className="size-2.5 rounded-full bg-[#f1b35b]" />
            <span className="size-2.5 rounded-full bg-sage" />
            <span className="size-2.5 rounded-full bg-terracotta/60" />
            <div className="mx-auto flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              app.pockettripai.com/trips/chamonix
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-wide text-terracotta uppercase">
                    Saved itinerary
                  </p>
                  <h3 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
                    Chamonix, France
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Jun 12 – Jun 18 · 6 nights
                  </p>
                </div>
                <div className="rounded-2xl border border-forest/20 bg-forest/5 px-4 py-2.5 text-right">
                  <p className="text-[0.7rem] text-muted-foreground">
                    Total budget
                  </p>
                  <p className="font-heading text-lg font-semibold text-forest dark:text-sage">
                    ₹38,400
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { icon: MapPin, label: "5 attractions" },
                  { icon: Wallet, label: "6 meals" },
                  { icon: ArrowRight, label: "26 km transit" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"
                  >
                    <Icon className="size-3" />
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {days.map((day) => (
                  <div key={day.label} className="rounded-2xl border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      {day.label}
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {day.items.map((item) => (
                        <li
                          key={item.name}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-sm">{item.name}</span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${chipColor[item.cat]}`}
                            >
                              {item.cost}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden flex-col justify-between gap-6 lg:flex">
              <div className="rounded-2xl border bg-card p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Budget breakdown
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Lodging", pct: 44, color: "bg-ochre" },
                    { label: "Food", pct: 26, color: "bg-terracotta" },
                    { label: "Transport", pct: 18, color: "bg-olive" },
                    { label: "Activities", pct: 12, color: "bg-forest" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {row.label}
                        </span>
                        <span className="font-medium">{row.pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-forest to-forest-dark p-5 text-cream">
                <p className="text-sm font-medium">Budget-fit guarantee</p>
                <p className="mt-1 text-xs text-cream/70">
                  Every estimate is itemized to the rupee and stays at or under
                  your ceiling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}