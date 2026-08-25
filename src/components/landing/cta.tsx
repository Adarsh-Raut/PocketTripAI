import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Cta() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest-dark to-forest-dark px-6 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-sage/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-terracotta/20 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance font-heading text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
              Your next trip is two minutes away
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/70">
              Tell us where you&apos;re going and what you can spend. We&apos;ll
              build a plan that actually fits — free to start.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/plan">
                <Button
                  size="lg"
                  className="gap-2 rounded-full bg-cream text-forest hover:bg-cream/90"
                >
                  Plan my trip
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-cream/30 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                >
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}