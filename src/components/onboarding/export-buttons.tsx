"use client";

import { FileDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Itinerary } from "@/lib/trip/schema";
import type { ComputeBudgetResult } from "@/lib/budget/engine";
import {
  downloadTextFile,
  itineraryToMarkdown,
  safeFilename,
  type ExportMeta,
} from "@/lib/trip/export-markdown";
import { PrintableItinerary } from "./printable-itinerary";

export function ExportButtons({
  itinerary,
  budget,
  meta,
  isPro,
}: {
  itinerary: Itinerary;
  budget: ComputeBudgetResult;
  meta: ExportMeta;
  isPro: boolean;
}) {
  function downloadMarkdown() {
    const md = itineraryToMarkdown(itinerary, budget, meta);
    downloadTextFile(`${safeFilename(itinerary.destination)}-itinerary.md`, md);
    toast.success("Markdown downloaded");
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 print:hidden"
        onClick={downloadMarkdown}
      >
        <FileDown className="h-4 w-4" />
        Download .md
      </Button>
      {isPro && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 print:hidden"
          onClick={exportPdf}
        >
          <Printer className="h-4 w-4" />
          Export PDF
        </Button>
      )}
      <div id="print-area" aria-hidden>
        <PrintableItinerary itinerary={itinerary} budget={budget} meta={meta} />
      </div>
    </div>
  );
}