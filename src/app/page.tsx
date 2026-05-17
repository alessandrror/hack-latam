import { BlogPreviewSection } from "@/components/landing/BlogPreviewSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { LandingHero } from "@/components/landing/LandingHero";
import { CyberBackground } from "@/components/ui/CyberBackground";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

export default function HomePage() {
  return (
    <CyberBackground>
      <SiteHeader />
      <main>
        <LandingHero />
        <FeaturesSection />
        <BlogPreviewSection />
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <NewsletterCTA />
        </section>
      </main>
      <SiteFooter />
    </CyberBackground>
  );
}
