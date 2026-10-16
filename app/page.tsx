import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProgramsSection } from "@/components/marketing/programs-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { BackToTop } from "@/components/site/back-to-top";
import { FloatingContact } from "@/components/site/floating-contact";
import { ScrollProgress } from "@/components/site/scroll-progress";

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <ScrollProgress />
      <MarketingNav />
      <main id="main" className="flex-1">
        <HeroSection />
        <ProgramsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FaqSection />
        <CtaSection />
      </main>
      <MarketingFooter />
      <BackToTop />
      <FloatingContact />
    </div>
  );
}
