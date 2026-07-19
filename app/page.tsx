import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProgramsSection } from "@/components/marketing/programs-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingNav />
      <main className="flex-1">
        <HeroSection />
        <ProgramsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
