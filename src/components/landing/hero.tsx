"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
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
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/55 to-background" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-24 pb-40 text-center sm:px-6 sm:pt-32">
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
          className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Your trip, planned around{" "}
          <span className="bg-gradient-to-r from-forest via-forest-light to-terracotta bg-clip-text text-transparent dark:from-sage dark:via-sage dark:to-ochre">
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
          Tell PocketTripAI where you want to go, how long you&apos;ll stay, and
          what you can spend. Get a complete, itemized, day-by-day itinerary in
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
            nativeButton={false}
            render={<a href="#how-it-works" />}
          >
            See how it works
          </Button>
        </motion.div>
      </div>
    </section>
  );
}