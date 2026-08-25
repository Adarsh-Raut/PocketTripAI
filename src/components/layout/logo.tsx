import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-forest-light to-forest-dark shadow-sm",
        className
      )}
    >
      <svg viewBox="0 0 64 64" className="size-5" fill="none">
        <circle
          cx="32"
          cy="32"
          r="15"
          stroke="#faf9f6"
          strokeWidth="3"
        />
        <polygon
          points="32,22 34.5,29.5 42,32 34.5,34.5 32,42 29.5,34.5 22,32 29.5,29.5"
          fill="#faf9f6"
        />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  className,
  markClassName,
}: {
  href?: string;
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
        PocketTripAI
      </span>
    </Link>
  );
}