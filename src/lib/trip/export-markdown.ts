import type { Itinerary } from "./schema";
import type { ComputeBudgetResult } from "@/lib/budget/engine";
import { itineraryTotalCost } from "./budget-fit";

export interface ExportMeta {
  destination: string;
  startDate?: string;
  endDate?: string;
  partySize: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  INR: "₹",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
};

export function money(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
}

export function itineraryToMarkdown(
  itinerary: Itinerary,
  budget: ComputeBudgetResult,
  meta: ExportMeta
): string {
  const currency = budget.ok ? budget.currency : "USD";
  const lines: string[] = [];

  lines.push(`# ${itinerary.destination} — Trip Itinerary`);
  lines.push("");

  const details = [
    meta.startDate && meta.endDate ? `${meta.startDate} → ${meta.endDate}` : null,
    `${meta.partySize} ${meta.partySize === 1 ? "traveler" : "travelers"}`,
    itinerary.travelStyle ? `${itinerary.travelStyle} style` : null,
  ].filter(Boolean);
  if (details.length) {
    lines.push(`**${details.join(" · ")}**`);
    lines.push("");
  }

  if (itinerary.summary) {
    lines.push(itinerary.summary);
    lines.push("");
  }

  lines.push("## Budget");
  lines.push("");
  if (budget.ok && budget.lineItems.length) {
    lines.push("| Category | Amount |");
    lines.push("| --- | ---: |");
    for (const item of budget.lineItems) {
      lines.push(`| ${item.category} | ${money(item.subtotal, currency)} |`);
    }
    lines.push("");
  }
  lines.push(`- **Estimated total:** ${money(budget.ok ? budget.total : itineraryTotalCost(itinerary), currency)}` +
    (budget.ok && budget.buffer ? ` (incl. ${money(budget.buffer, currency)} buffer)` : ""));
  if (budget.ok) {
    lines.push(`- **Per person:** ${money(budget.perPersonTotal, currency)} · **Per person/day:** ${money(budget.perPersonPerDay, currency)}`);
  }
  if (itinerary.totalBudget != null) {
    lines.push(`- **Plan total budget:** ${money(itinerary.totalBudget, currency)}`);
  }
  lines.push("");

  lines.push(`## Itinerary`);
  lines.push("");
  for (const day of itinerary.daysPlan) {
    lines.push(`### Day ${day.dayNumber}${day.date ? ` — ${day.date}` : ""}`);
    lines.push("");
    if (day.summary) {
      lines.push(day.summary);
      lines.push("");
    }
    if (day.lodging) {
      lines.push(`**Lodging:** ${day.lodging}`);
      lines.push("");
    }
    if (day.meals?.length) {
      lines.push(`**Meals:** ${day.meals.join(", ")}`);
      lines.push("");
    }
    if (day.activities.length) {
      lines.push("| Time | Activity | Cost |");
      lines.push("| --- | --- | ---: |");
      for (const a of day.activities) {
        lines.push(
          `| ${a.time} | ${a.title.replace(/\|/g, "\\|")} | ${money(a.cost, currency)} |`
        );
      }
      lines.push("");
      for (const a of day.activities) {
        lines.push(`- **${a.time} ${a.title}** — ${money(a.cost, currency)}`);
        if (a.description) {
          lines.push(`  ${a.description}`);
        }
        lines.push("");
      }
    }
  }

  if (itinerary.notes?.length) {
    lines.push("## Notes");
    lines.push("");
    for (const note of itinerary.notes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function safeFilename(destination: string): string {
  return destination
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "trip";
}