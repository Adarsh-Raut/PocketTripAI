"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[840px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/20 via-sky-400/20 to-transparent blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-16 text-center sm:pt-32">
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Badge className="gap-1.5 rounded-full border px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered trip planning
          </Badge>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="mt-6 max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl"
        >
          Your trip, planned around{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
            your budget
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Tell PocketTripAI where you want to go, how long you&apos;ll stay, and what
          you can spend. Get a complete, itemized, day-by-day itinerary in
          minutes — no spreadsheets, no guesswork.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Link href="/plan">
            <Button size="lg" className="gap-2 rounded-full">
              Plan my trip
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full"
          >
            See how it works
          </Button>
        </motion.div>

        <motion.dl
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.45 }}
          className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            {
              icon: MapPin,
              title: "Any destination",
              desc: "From Paris to Pokhara — you pick the city or country.",
            },
            {
              icon: CalendarDays,
              title: "Any length",
              desc: "A weekend, a week, or a month-long slow travel.",
            },
            {
              icon: Wallet,
              title: "Any budget",
              desc: "Fixed ceiling or unlimited — the plan fits the number.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border bg-card p-6 text-left shadow-sm"
            >
              <Icon className="h-6 w-6 text-indigo-500" />
              <dt className="mt-3 font-medium">{title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{desc}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}