"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UpgradeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/upgrade", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Upgrade failed");
      }
      toast.success("Welcome to Pro! Enjoy unlimited plans.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upgrade failed");
      setLoading(false);
    }
  }

  return (
    <Button className="w-full gap-2" disabled={loading} onClick={upgrade}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      Upgrade to Pro
    </Button>
  );
}