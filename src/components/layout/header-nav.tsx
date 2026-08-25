"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function HeaderNav({
  email,
  isPro,
}: {
  email: string | null;
  isPro: boolean;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/plan", label: "Plan a trip" },
    { href: "/pricing", label: "Pricing" },
    { href: "/trips", label: "My trips" },
  ];

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
      {email ? (
        <>
          <Link
            href="/pricing"
            className={cn(
              "ml-1 hidden items-center rounded-full border border-forest/25 bg-forest/5 px-2.5 py-1 text-xs font-medium text-forest transition-colors hover:bg-forest/10 dark:border-sage/30 dark:bg-sage/10 dark:text-sage sm:inline-flex",
              isPro &&
                "border-ochre/40 bg-ochre/10 text-ochre hover:bg-ochre/15 dark:border-ochre/40 dark:bg-ochre/10 dark:text-ochre"
            )}
          >
            {isPro ? "Pro" : "Free plan"}
          </Link>
          <span className="hidden px-2 text-sm text-muted-foreground lg:inline">
            {email}
          </span>
          <ThemeToggle />
          <SignOutButton />
        </>
      ) : (
        <div className="ml-1 flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Sign in
          </Button>
          <Button nativeButton={false} render={<Link href="/signup" />}>
            Sign up
          </Button>
        </div>
      )}
    </nav>
  );
}