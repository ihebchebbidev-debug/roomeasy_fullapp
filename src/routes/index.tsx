import { createFileRoute } from "@tanstack/react-router";

import { AwardSection } from "@/components/home/AwardSection";
import { Hero } from "@/components/home/Hero";
import { StaysSection } from "@/components/home/StaysSection";
import { Testimonials } from "@/components/home/Testimonials";
import { ValueSection } from "@/components/home/ValueSection";
import { Footer } from "@/components/layout/Footer";
import { canonical, localeOf, KEYWORDS, OG_IMAGE, publicPageMeta, SITE_NAME, SITE_URL } from "@/lib/seo";

import { detectServerLocale } from "@/lib/locale.functions";

const HOME_META = {
  fr: {
    title: "RoomEasy — Location de vacances & séjours d'exception en France",
    description:
      "Réservez appartements, villas, chalets et maisons d'hôtes sélectionnés partout en France : prix transparents, paiement sécurisé et annulation claire.",
    lang: "fr-FR",
  },
  en: {
    title: "RoomEasy — Holiday rentals & exceptional stays in France",
    description:
      "Book hand-picked apartments, villas, chalets and guesthouses across France: transparent prices, secure payment and clear cancellation.",
    lang: "en",
  },
  es: {
    title: "RoomEasy — Alquileres vacacionales y estancias excepcionales en Francia",
    description:
      "Reserva apartamentos, villas, chalets y casas de huéspedes seleccionados en toda Francia: precios transparentes, pago seguro y cancelación clara.",
    lang: "es",
  },
  de: {
    title: "RoomEasy — Ferienunterkünfte & besondere Aufenthalte in Frankreich",
    description:
      "Buche ausgewählte Wohnungen, Villen, Chalets und Gästehäuser in ganz Frankreich: transparente Preise, sichere Zahlung und klare Stornierung.",
    lang: "de",
  },
  pt: {
    title: "RoomEasy — Alojamento de férias e estadias excecionais em França",
    description:
      "Reserve apartamentos, moradias, chalés e casas de hóspedes selecionados em toda a França: preços transparentes, pagamento seguro e cancelamento claro.",
    lang: "pt",
  },
} as const;

export const Route = createFileRoute("/")({
  loader: async ({ context }) => ({ locale: context.urlLocale.current ?? await detectServerLocale().catch(() => "en" as const) }),
  head: ({ loaderData, match }) => {
    const m = HOME_META[loaderData?.locale ?? "en"] ?? HOME_META.en;
    const TITLE = m.title;
    const DESCRIPTION = m.description;
    return {
    meta: publicPageMeta({
      locale: localeOf(match), title: TITLE, description: DESCRIPTION, path: "/", keywords: KEYWORDS.home }),
    links: canonical("/", localeOf(match)),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: m.lang,
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
    };
  },
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
