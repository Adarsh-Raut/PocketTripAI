import Link from "next/link";
import { AtSign, Globe, Send } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Plan a trip", href: "/plan" },
      { label: "Pricing", href: "/pricing" },
      { label: "My trips", href: "/trips" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              AI-powered itineraries that fit your budget — planned day by day,
              priced item by item.
            </p>
            <div className="mt-4 flex items-center gap-1">
              {[
                { icon: Globe, label: "Website" },
                { icon: AtSign, label: "Social" },
                { icon: Send, label: "Contact" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-medium text-foreground">
                {column.title}
              </h4>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PocketTripAI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made by{" "}
            <a
              href="https://adarshraut.vercel.app"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Adarsh Raut
            </a>{" "}
            for budget travelers, everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}