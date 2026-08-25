const faqs = [
  {
    q: "Is PocketTripAI really free?",
    a: "Yes. You get 2 AI-generated trips every month on the free plan — no card required. Upgrade to Pro for unlimited trips and priority generation.",
  },
  {
    q: "How accurate are the budget estimates?",
    a: "Estimates are built from current, destination-specific prices for lodging, meals, attractions, and transit. They're itemized line-by-line, so you can verify or adjust each one.",
  },
  {
    q: "Can I edit the itinerary after it's generated?",
    a: "Absolutely. Swap any activity, restaurant, or hotel and the budget dashboard recalculates instantly. You're never stuck with the first draft.",
  },
  {
    q: "Which currencies and countries do you support?",
    a: "Plans work for any destination worldwide, and you can view estimates in your preferred currency. Prices update as you adjust the plan.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-widest text-terracotta uppercase">
            FAQ
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border bg-card px-6 py-4 open:pb-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="size-4"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}