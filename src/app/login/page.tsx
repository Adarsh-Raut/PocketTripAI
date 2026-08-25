import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Sign in — PocketTripAI",
};

export default function LoginPage() {
  return (
    <AuthShell
      heading="Welcome back to your plans"
      subheading="Your saved itineraries and budget dashboards are waiting. Sign in to pick up where you left off."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}