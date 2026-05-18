import type { Metadata } from "next";

import { BlogPreviewSection } from "@/components/landing/BlogPreviewSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { LandingHero } from "@/components/landing/LandingHero";
import { JsonLd } from "@/components/seo/json-ld";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { websiteOrganizationJsonLd } from "@/lib/json-ld";
import {
  SITE_DESCRIPTION,
  TITLE_DEFAULT,
  absoluteUrl,
  openGraphImageUrl,
} from "@/lib/site-metadata";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    url: absoluteUrl("/"),
    title: TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: openGraphImageUrl(),
        width: 1200,
        height: 630,
        alt: TITLE_DEFAULT,
      },
    ],
  },
  twitter: {
    title: TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [openGraphImageUrl()],
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteOrganizationJsonLd()} />
      <div className="min-h-dvh min-w-0 overflow-x-hidden bg-background">
        <SiteHeader />
        <main className="min-w-0 overflow-x-hidden">
          <LandingHero />
          <FeaturesSection />
          <BlogPreviewSection />
          <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <NewsletterCTA />
          </section>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
