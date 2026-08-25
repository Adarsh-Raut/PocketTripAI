import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I planned a two-week Southeast Asia trip on a student budget. Every day came in itemized — I knew exactly what I'd spend before I booked anything.",
    name: "Ananya R.",
    role: "Backpacking through Thailand",
    initials: "AR",
  },
  {
    quote:
      "The budget dashboard alone is worth it. I moved one expensive activity and watched the total drop instantly. My girlfriend thought I used a travel agent.",
    name: "Dev M.",
    role: "4 days in Chamonix",
    initials: "DM",
  },
  {
    quote:
      "It caught a train fare I'd have missed and suggested free spots near where I was staying. My trip cost 20% less than the last one I planned myself.",
    name: "Priya S.",
    role: "Weekend in Rishikesh",
    initials: "PS",
  },
];

export function Testimonials() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-widest text-terracotta uppercase">
            Loved by travelers
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Plans that fit real budgets
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-3xl border bg-card p-7 shadow-sm"
            >
              <div>
                <div className="flex gap-0.5 text-ochre">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-forest to-forest-dark text-sm font-medium text-cream">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}