import { Hero } from "@/components/landing/hero";
import { ProductPreview } from "@/components/landing/product-preview";
import { SocialProof } from "@/components/landing/social-proof";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <Hero />
      <ProductPreview />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Faq />
      <Cta />
    </main>
  );
}