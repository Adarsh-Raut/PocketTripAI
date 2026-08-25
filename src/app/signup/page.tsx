import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Sign up — PocketTripAI",
};

export default function SignupPage() {
  return (
    <AuthShell
      heading="Plan your first trip in minutes"
      subheading="Two free AI itineraries every month. No card required — just a destination and a budget."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}