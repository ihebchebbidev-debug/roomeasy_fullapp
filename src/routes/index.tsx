import { createFileRoute } from "@tanstack/react-router";

import { AwardSection } from "@/components/home/AwardSection";
import { Hero } from "@/components/home/Hero";
import { StaysSection } from "@/components/home/StaysSection";
import { Testimonials } from "@/components/home/Testimonials";
import { ValueSection } from "@/components/home/ValueSection";
import { Footer } from "@/components/layout/Footer";
import { canonical, KEYWORDS, OG_IMAGE, publicPageMeta, SITE_NAME, SITE_URL } from "@/lib/seo";

const TITLE = "RoomEasy — Location de vacances & séjours d'exception en France";
const DESCRIPTION =
  "Réservez appartements, villas, chalets et maisons d'hôtes sélectionnés partout en France : prix transparents, paiement sécurisé et annulation claire.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: publicPageMeta({ title: TITLE, description: DESCRIPTION, path: "/", keywords: KEYWORDS.home }),
    links: canonical("/"),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: "fr-FR",
            description: DESCRIPTION,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/stays?where={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: OG_IMAGE,
            areaServed: "FR",
          },
        ]),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <StaysSection />
      <ValueSection />
      <AwardSection />
      <Testimonials />
      <Footer />
    </main>
  );
}
