"use client";

import { useState } from "react";
import { Check, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Itinerary } from "@/lib/trip/schema";
import type { ComputeBudgetResult } from "@/lib/budget/engine";
import { ItineraryView } from "./itinerary-view";
import { Button } from "@/components/ui/button";

export function SavedItinerary({
  tripId,
  initialItinerary,
  budget,
  hardBudgetPerPerson,
}: {
  tripId: string;
  initialItinerary: Itinerary;
  budget: ComputeBudgetResult;
  hardBudgetPerPerson: number | null;
}) {
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [savedItinerary, setSavedItinerary] = useState(initialItinerary);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const dirty = JSON.stringify(itinerary) !== JSON.stringify(savedItinerary);

  const save = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itinerary),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to save");
      }
      setSavedItinerary(itinerary);
      setEditing(false);
      setStatus("saved");
      toast.success("Changes saved");
    } catch {
      setStatus("error");
      toast.error("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {editing
            ? "Reorder, edit or add activities — changes recalculate your budget live."
            : "Make adjustments to your plan."}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {status === "saved" && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-300">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
          {status === "error" && (
            <span className="inline-flex items-center gap-1 text-sm text-destructive">
              Save failed — try again
            </span>
          )}
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => {
                  setItinerary(savedItinerary);
                  setEditing(false);
                  setStatus("idle");
                }}
              >
                Discard
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving || !dirty}
                onClick={save}
                className="gap-2"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save changes
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditing(true);
                setStatus("idle");
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
      <ItineraryView
        itinerary={itinerary}
        budget={budget}
        editable={editing}
        onEdit={editing ? setItinerary : undefined}
        hardBudgetPerPerson={hardBudgetPerPerson}
      />
    </div>
  );
}