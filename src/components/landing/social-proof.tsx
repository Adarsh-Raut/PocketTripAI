const stats = [
  { value: "12,000+", label: "trips planned" },
  { value: "140+", label: "destinations" },
  { value: "4.8 / 5", label: "traveler rating" },
  { value: "₹0", label: "to start planning" },
];

export function SocialProof() {
  return (
    <section className="border-y border-border bg-muted/50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-heading text-3xl font-semibold tracking-tight text-forest dark:text-sage">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}