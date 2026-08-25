import { Gauge, Download, Wallet } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const benefits = [
  {
    icon: Wallet,
    title: "Plans that fit your budget",
    desc: "Itemized, line-by-line estimates before you book a thing.",
  },
  {
    icon: Gauge,
    title: "Live budget dashboard",
    desc: "Watch the total adjust as you tweak any line item.",
  },
  {
    icon: Download,
    title: "Save & export anytime",
    desc: "Keep your saved itineraries and take them offline.",
  },
];

export function AuthShell({
  children,
  heading,
  subheading,
}: {
  children: React.ReactNode;
  heading: string;
  subheading: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="hidden flex-col gap-6 lg:flex">
          <Logo />
          <h1 className="text-balance font-heading text-4xl font-semibold tracking-tight">
            {heading}
          </h1>
          <p className="max-w-md text-muted-foreground">{subheading}</p>
          <ul className="mt-2 space-y-4">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-forest/10 text-forest dark:bg-sage/10 dark:text-sage">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>{children}</div>
      </div>
    </main>
  );
}