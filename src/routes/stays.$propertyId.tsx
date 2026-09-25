import { ReportReviewButton } from "@/components/support/ReportReviewButton";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { differenceInCalendarDays, format } from "date-fns";
import {
  Award,
  CalendarDays,
  Car,
  Check,
  ChefHat,
  DoorOpen,
  Heart,
  Images,
  Key,
  Laptop,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Share2,
  Snowflake,
  Sparkles,
  Star,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Clock, SearchX } from "lucide-react";
import { StatusScreen } from "@/components/layout/StatusScreen";
import { bookingApi } from "@/api";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ReportListingDialog } from "@/components/support/ReportListingDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EquipmentList } from "@/components/listing/EquipmentList";
import { useClientCopy } from "@/i18n/clientCopy";
import { fill, useListingCopy } from "@/i18n/listingCopy";
import { cancellationLabel, cancellationText } from "@/lib/cancellation";
import { AreaMap } from "@/components/listing/AreaMap";
import { PropertyHeader } from "@/components/listing/PropertyHeader";
import { PhotoGalleryDialog } from "@/components/listing/PhotoGalleryDialog";
import { Footer } from "@/components/layout/Footer";
import { UserAvatar } from "@/components/ui/user-avatar";
import { propertyPhotos, cityName } from "@/data/properties";
import { backendEnabled, ensureStays, loadPropertyReviews, remote, toThread } from "@/api/backend";
import { propertiesApi } from "@/api/http/platform.http";
import { useAllProperties } from "@/hooks/useAllProperties";
import { dateFnsLocale } from "@/i18n/dateLocale";
import { pickCopy } from "@/i18n/copy";
import { interpolate, useLanguage } from "@/i18n/LanguageProvider";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useExtra } from "@/i18n/extra";
import { useFavorites } from "@/hooks/useFavorites";
import { useIsMobileDevice } from "@/hooks/use-mobile";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { blockedNightsIn, isNightBlocked, quoteStay, toISODate, type Quote } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { absoluteUrl, canonical, localeOf, publicPageMeta } from "@/lib/seo";
import { withLocale } from "@/i18n/urlLocale";


const MISSING_COPY: Record<string, { eyebrow: string; reviewEyebrow: string; text: string; browse: string; home: string }> = {
  en: { eyebrow: "Unavailable", reviewEyebrow: "Under review", text: "This stay may have been removed, paused by its host, or the link is incorrect. Plenty of other places are waiting for you.", browse: "Browse stays", home: "Home" },
  fr: { eyebrow: "Indisponible", reviewEyebrow: "En vérification", text: "Ce logement a peut-être été retiré, mis en pause par son hôte, ou le lien est incorrect. De nombreux autres logements vous attendent.", browse: "Voir les logements", home: "Accueil" },
  es: { eyebrow: "No disponible", reviewEyebrow: "En revisión", text: "Es posible que este alojamiento se haya eliminado, que el anfitrión lo haya pausado o que el enlace sea incorrecto. Muchos otros te esperan.", browse: "Ver alojamientos", home: "Inicio" },
  de: { eyebrow: "Nicht verfügbar", reviewEyebrow: "In Prüfung", text: "Diese Unterkunft wurde möglicherweise entfernt, vom Gastgeber pausiert, oder der Link ist falsch. Viele andere Unterkünfte warten auf dich.", browse: "Unterkünfte ansehen", home: "Startseite" },
  pt: { eyebrow: "Indisponível", reviewEyebrow: "Em análise", text: "Esta estadia pode ter sido removida, pausada pelo anfitrião ou o link está incorreto. Muitas outras estadias esperam por si.", browse: "Ver estadias", home: "Início" },
};

export const Route = createFileRoute("/stays/$propertyId")({
  // The listing itself is fetched here so search results and share cards show
  // its real name, city and photo instead of a generic site title. A failure
  // never breaks the page: the head simply falls back to the generic copy.
  loader: async ({ params }) => {
    if (!backendEnabled) return { seo: null };
    try {
      const dto = await propertiesApi.get(params.propertyId);
      return {
        seo: {
          name: dto.name,
          city: dto.location?.city ?? dto.location?.en ?? "",
          country: dto.location?.country ?? "",
          summary: dto.summary ?? dto.description ?? "",
          guests: dto.guests,
          rooms: dto.rooms,
          price: dto.price,
          image: dto.image ?? dto.gallery?.[0] ?? null,
          rating: typeof dto.rating === "number" ? dto.rating : null,
          reviewCount: typeof dto.reviewCount === "number" ? dto.reviewCount : 0,
        },
      };
    } catch {
      return { seo: null };
    }
  },

  head: ({ params, loaderData, match }) => {
    const seo = loaderData?.seo ?? null;
    const place = seo ? [seo.city, seo.country].filter(Boolean).join(", ") : "";
    // Many listing names already end with their city, so only add the place
    // when it is not part of the name already ("Appartement — Paris — Paris").
    const placeInName = Boolean(seo && seo.city && seo.name.toLowerCase().includes(seo.city.toLowerCase()));
    const titlePlace = place && !placeInName ? ` — ${place}` : "";
    const title = seo ? `${seo.name}${titlePlace} | RoomEasy` : "Logement — RoomEasy";
    const description = seo
      ? (seo.summary?.trim().slice(0, 155) ||
        `${seo.name}${place ? ` à ${place}` : ""} : ${seo.guests} voyageurs, ${seo.rooms} chambres, à partir de ${Math.round(seo.price)} € la nuit. Réservez en ligne sur RoomEasy.`)
      : "Photos, équipements, avis voyageurs, disponibilités et réservation en ligne avec RoomEasy.";
    // Only an absolute https image is usable as a share card.
    const image = seo?.image && /^https:\/\//.test(seo.image) ? seo.image : undefined;
    return {
      meta: publicPageMeta({
      locale: localeOf(match),
        title,
        description,
        path: `/stays/${params.propertyId}`,
        keywords: seo
          ? `${seo.name}, location ${place}, réservation logement ${seo.city}, séjour ${seo.city}, RoomEasy`
          : "location vacances, réservation logement, séjour France, RoomEasy",
        type: "product",
        ...(image ? { image } : {}),
      }),
      links: canonical(`/stays/${params.propertyId}`, localeOf(match)),
      // Rich results: the stay itself, its nightly price, its rating and the
      // breadcrumb trail Google shows above the result.
      scripts: seo
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "VacationRental",
                name: seo.name,
                description,
                url: absoluteUrl(withLocale(`/stays/${params.propertyId}`, localeOf(match))),
                ...(image ? { image } : {}),
                ...(seo.city || seo.country
                  ? {
                      address: {
                        "@type": "PostalAddress",
                        ...(seo.city ? { addressLocality: seo.city } : {}),
                        ...(seo.country ? { addressCountry: seo.country } : {}),
                      },
                    }
                  : {}),
                ...(seo.guests ? { occupancy: { "@type": "QuantitativeValue", value: seo.guests } } : {}),
                ...(seo.rooms ? { numberOfRooms: seo.rooms } : {}),
                ...(seo.rating && seo.reviewCount
                  ? {
                      aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: seo.rating,
                        reviewCount: seo.reviewCount,
                        bestRating: 5,
                      },
                    }
                  : {}),
                ...(seo.price
                  ? {
                      offers: {
                        "@type": "Offer",
                        price: Math.round(seo.price),
                        priceCurrency: "EUR",
                        availability: "https://schema.org/InStock",
                        url: absoluteUrl(`/stays/${params.propertyId}`),
                      },
                    }
                  : {}),
              }),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "RoomEasy", item: absoluteUrl("/") },
                  { "@type": "ListItem", position: 2, name: "Logements", item: absoluteUrl("/stays") },
                  { "@type": "ListItem", position: 3, name: seo.name, item: absoluteUrl(`/stays/${params.propertyId}`) },
                ],
              }),
            },
          ]
        : [],
    };
  },

  component: ListingDetail,
});

function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("border-t border-border py-10", className)}>
      {children}
    </section>
  );
}

function ListingDetail() {
  const { propertyId } = Route.useParams();
  // Reviews for this stay come from the database when a server is configured.
  // True until the fetch for this stay has finished, so the page shows a
  // loading state instead of claiming the stay does not exist.
  const [loadingStay, setLoadingStay] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoadingStay(true);
    void loadPropertyReviews(propertyId);
    // The hydrated catalogue is capped, so fetch this stay if it is missing.
    void ensureStays([propertyId]).finally(() => {
      if (!cancelled) setLoadingStay(false);
    });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);
  const allProperties = useAllProperties();
  const property = allProperties.find((item) => item.id === propertyId);
  const { t, locale } = useLanguage();
  const { format: formatDisplay } = useCurrency();
  // Listing prices are stored in the host's currency; convert for display.
  const formatCurrency = (amount: number, options?: { decimals?: boolean }) =>
    formatDisplay(amount, { ...options, from: property?.currency });
  const x = useExtra();
  const navigate = useNavigate();
  const isMobile = useIsMobileDevice();
  const cc = useClientCopy();
  const lc = useListingCopy();
  const { listings, calendar, rateRules, threads, reviews } = usePlatform();
  const session = usePlatform().session;
  const ownListing = listings.find((item) => item.propertyId === propertyId);
  const isOwner = Boolean(session && ownListing && session.role !== "admin");
  const { isFavorite, toggle } = useFavorites();
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [serverQuote, setServerQuote] = useState<{ key: string; quote: Quote } | null>(null);
  const quoteFrom = range?.from ? toISODate(range.from) : "";
  const quoteTo = range?.to ? toISODate(range.to) : "";
  const quoteKey = `${propertyId}|${quoteFrom}|${quoteTo}|${isMobile ? 1 : 0}`;
  useEffect(() => {
    if (!quoteFrom || !quoteTo || quoteFrom >= quoteTo) return;
    let cancelled = false;
    bookingApi
      .getQuote({ propertyId, from: quoteFrom, to: quoteTo, guests: 1, isMobile })
      .then((price) => {
        if (cancelled) return;
        const nights = price.nights || 0;
        setServerQuote({
          key: quoteKey,
          quote: {
            nights,
            baseSubtotal: price.baseSubtotal,
            discounts: price.discounts.map((d) => ({ id: d.id, percent: d.percent, amount: d.amount })),
            subtotal: price.subtotal,
            perNight: nights ? Math.round((price.subtotal / nights) * 100) / 100 : price.nightly,
            cleaningFee: price.cleaningFee ?? 0,
            serviceFee: price.serviceFee,
            taxes: price.taxes,
            total: price.total,
          },
        });
      })
      // Minimum-stay or date errors are already explained by the booking box.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [quoteKey]);
  const dateLocale = dateFnsLocale(locale);
  const d = pickCopy(locale, {
    en: {
      selfCheckIn: "Self check-in",
      selfCheckInText: "Let yourself in with the lockbox.",
      greatLocation: "Great location",
      greatLocationText: "95% of recent guests rated it 5 stars.",
      clean: "Sparkling clean",
      cleanText: "Guests love how spotless it is.",
      cleanliness: "Cleanliness",
      accuracy: "Accuracy",
      checkIn: "Check-in",
      communication: "Communication",
      location: "Location",
      value: "Value",
      save: "Save",
      showPhotos: "Show all photos",
      loved: "One of the most loved homes on RoomEasy",
      hostedBy: "Hosted by",
      hostSince: "Host since",
      availability: "Availability in",
      meetHost: "Meet your host",
      houseRules: "House rules",
      safety: "Safety & property",
      cancellation: "Cancellation policy",
      notFound: "Stay not found",
      pendingTitle: "Waiting for approval",
      pendingText: "Only you can see this listing. Our team is reviewing it — it will appear publicly once approved.",
      draftTitle: "Draft listing",
      draftText: "This listing is not published yet. Only you can see it.",
      suspendedTitle: "Listing paused",
      suspendedText: "This listing is currently paused and hidden from guests.",
    },
    fr: {
      selfCheckIn: "Arrivée autonome",
      selfCheckInText: "Entrez seul grâce à la boîte à clés.",
      greatLocation: "Emplacement idéal",
      greatLocationText: "95 % des voyageurs ont noté 5 étoiles.",
      clean: "Ménage impeccable",
      cleanText: "Les voyageurs adorent la propreté.",
      cleanliness: "Propreté",
      accuracy: "Précision",
      checkIn: "Arrivée",
      communication: "Communication",
      location: "Emplacement",
      value: "Qualité-prix",
      save: "Enregistrer",
      showPhotos: "Afficher toutes les photos",
      loved: "Parmi les logements les plus appréciés sur RoomEasy",
      hostedBy: "Hôte :",
      hostSince: "Hôte depuis",
      availability: "Disponibilités à",
      meetHost: "Faites connaissance avec votre hôte",
      houseRules: "Règlement intérieur",
      safety: "Sécurité et logement",
      cancellation: "Conditions d’annulation",
      notFound: "Merci pour votre patience ! Votre annonce est en cours de vérification par notre équipe et sera bientôt disponible.",
      pendingTitle: "En attente de validation",
      pendingText: "Vous seul voyez cette annonce. Notre équipe la vérifie — elle sera visible une fois validée.",
      draftTitle: "Annonce en brouillon",
      draftText: "Cette annonce n’est pas encore publiée. Vous seul pouvez la voir.",
      suspendedTitle: "Annonce suspendue",
      suspendedText: "Cette annonce est suspendue et masquée aux voyageurs.",
    },
    es: {
      selfCheckIn: "Entrada autónoma",
      selfCheckInText: "Entra por tu cuenta con la caja de llaves.",
      greatLocation: "Gran ubicación",
      greatLocationText: "El 95 % de los huéspedes recientes le dio 5 estrellas.",
      clean: "Impecable",
      cleanText: "A los huéspedes les encanta su limpieza.",
      cleanliness: "Limpieza",
      accuracy: "Exactitud",
      checkIn: "Llegada",
      communication: "Comunicación",
      location: "Ubicación",
      value: "Relación calidad-precio",
      save: "Guardar",
      showPhotos: "Ver todas las fotos",
      loved: "Uno de los alojamientos más valorados de RoomEasy",
      hostedBy: "Anfitrión:",
      hostSince: "Anfitrión desde",
      availability: "Disponibilidad en",
      meetHost: "Conoce a tu anfitrión",
      houseRules: "Normas de la casa",
      safety: "Seguridad y alojamiento",
      cancellation: "Política de cancelación",
      notFound: "Alojamiento no encontrado",
      pendingTitle: "Pendiente de aprobación",
      pendingText: "Solo tú ves este alojamiento. Nuestro equipo lo está revisando — será público al aprobarse.",
      draftTitle: "Anuncio en borrador",
      draftText: "Este anuncio aún no está publicado. Solo tú puedes verlo.",
      suspendedTitle: "Anuncio pausado",
      suspendedText: "Este anuncio está pausado y oculto para los huéspedes.",
    },
    de: {
      selfCheckIn: "Selbst-Check-in",
      selfCheckInText: "Komm mit dem Schlüsselkasten selbst hinein.",
      greatLocation: "Top-Lage",
      greatLocationText: "95 % der letzten Gäste gaben 5 Sterne.",
      clean: "Blitzsauber",
      cleanText: "Gäste lieben die Sauberkeit.",
      cleanliness: "Sauberkeit",
      accuracy: "Genauigkeit",
      checkIn: "Check-in",
      communication: "Kommunikation",
      location: "Lage",
      value: "Preis-Leistung",
      save: "Speichern",
      showPhotos: "Alle Fotos ansehen",
      loved: "Eine der beliebtesten Unterkünfte auf RoomEasy",
      hostedBy: "Gastgeber:",
      hostSince: "Gastgeber seit",
      availability: "Verfügbarkeit in",
      meetHost: "Lerne deinen Gastgeber kennen",
      houseRules: "Hausregeln",
      safety: "Sicherheit & Unterkunft",
      cancellation: "Stornierungsbedingungen",
      notFound: "Unterkunft nicht gefunden",
      pendingTitle: "Warten auf Freigabe",
      pendingText: "Nur du siehst dieses Inserat. Unser Team prüft es — nach der Freigabe wird es öffentlich.",
      draftTitle: "Entwurf",
      draftText: "Dieses Inserat ist noch nicht veröffentlicht. Nur du kannst es sehen.",
      suspendedTitle: "Inserat pausiert",
      suspendedText: "Dieses Inserat ist pausiert und für Gäste ausgeblendet.",
    },
    pt: {
      selfCheckIn: "Check-in autónomo",
      selfCheckInText: "Entre sozinho com a caixa de chaves.",
      greatLocation: "Ótima localização",
      greatLocationText: "95 % dos hóspedes recentes deram 5 estrelas.",
      clean: "Impecável",
      cleanText: "Os hóspedes adoram a limpeza.",
      cleanliness: "Limpeza",
      accuracy: "Precisão",
      checkIn: "Chegada",
      communication: "Comunicação",
      location: "Localização",
      value: "Relação qualidade-preço",
      save: "Guardar",
      showPhotos: "Ver todas as fotos",
      loved: "Uma das estadias mais apreciadas na RoomEasy",
      hostedBy: "Anfitrião:",
      hostSince: "Anfitrião desde",
      availability: "Disponibilidade em",
      meetHost: "Conheça o seu anfitrião",
      houseRules: "Regras da casa",
      safety: "Segurança e alojamento",
      cancellation: "Política de cancelamento",
      notFound: "Estadia não encontrada",
      pendingTitle: "A aguardar aprovação",
      pendingText: "Só você vê este anúncio. A nossa equipa está a analisá-lo — ficará público após aprovação.",
      draftTitle: "Anúncio em rascunho",
      draftText: "Este anúncio ainda não foi publicado. Só você pode vê-lo.",
      suspendedTitle: "Anúncio pausado",
      suspendedText: "Este anúncio está pausado e oculto para os hóspedes.",
    },
  });

  if (!property && loadingStay) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{t.app.auth.loading}</span>
        </div>
      </main>
    );
  }

  if (!property) {
    const missing = MISSING_COPY[locale] ?? MISSING_COPY["en"]!;
    return (
      <StatusScreen
        icon={isOwner ? <Clock className="h-7 w-7" /> : <SearchX className="h-7 w-7" />}
        eyebrow={isOwner ? missing.reviewEyebrow : missing.eyebrow}
        title={isOwner ? d.pendingTitle : d.notFound}
        text={isOwner ? d.pendingText : missing.text}
        actions={
          <>
            <Button asChild size="lg">
              <Link to="/stays">{isOwner ? t.detail.back : missing.browse}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">{missing.home}</Link>
            </Button>
          </>
        }
      />
    );
  }

  // A listing gallery must contain only photos explicitly attached to that
  // listing. Never fill empty slots with images from other properties.
  const gallery = propertyPhotos(property).filter(Boolean);

  // A same-day range is not a stay: keep it at 0 so `reserve()` asks the guest
  // to pick real dates instead of sending check-in = check-out to the server.
  const nights =
    range?.from && range.to ? Math.max(0, differenceInCalendarDays(range.to, range.from)) : 0;

  const listing = listings.find((item) => item.propertyId === property.id);
  const localQuote = quoteStay({
    basePrice: listing?.nightlyUsd ?? property.price,
    cleaningFee: property.cleaningFee ?? 0,
    nights,
    from: range?.from,
    to: range?.to,
    propertyId: property.id,
    calendar,
    listing,
    rateRules,
    isMobile,
  });
  // The local figure is only an instant estimate. The server applies the
  // host's smart-pricing rules, so its quote replaces it as soon as it
  // arrives — the guest sees exactly what they will be charged.
  const quote: Quote =
    serverQuote && serverQuote.key === quoteKey ? serverQuote.quote : localQuote;
  const total = quote.total;
  const propertyReviews = reviews.filter((review) => review.propertyId === property.id && !review.hidden);
  const displayedRating = propertyReviews.length
    ? propertyReviews.reduce((sum, review) => sum + review.rating, 0) / propertyReviews.length
    : property.rating;
  const displayedReviewCount = propertyReviews.length || property.reviewCount || 0;
  const favorite = isFavorite(property.id);
  const propertyName = property.name;
  const imageAlt = `${property.name}, ${cityName(property, locale)}`;
  const hostFallback = pickCopy(locale, {
    en: "Your host",
    fr: "Votre hôte",
    es: "Tu anfitrión",
    de: "Ihr Gastgeber",
    pt: "O seu anfitrião",
  });
  const noReviewsText = pickCopy(locale, {
    en: "No reviews yet for this stay.",
    fr: "Pas encore d'avis pour ce logement.",
    es: "Todavía no hay opiniones sobre este alojamiento.",
    de: "Noch keine Bewertungen für diese Unterkunft.",
    pt: "Ainda não há avaliações para esta estadia.",
  });
  const hostName = property.host?.name ?? hostFallback;
  const amenities: ReadonlyArray<readonly [LucideIcon, string]> = [
    [Wifi, t.detail.wifi],
    [Car, t.detail.parking],
    [ChefHat, t.detail.kitchen],
    [Laptop, t.detail.workspace],
    [Snowflake, t.detail.air],
    [ShieldCheck, t.detail.security],
  ] as const;

  // Only facts taken from the listing itself: no invented statistics.
  const highlights: ReadonlyArray<readonly [LucideIcon, string, string]> = [
    ...(property.instantBook ? ([[Key, d.selfCheckIn, d.selfCheckInText]] as const) : []),
    ...(property.checkIn || property.checkOut
      ? ([
          [
            MapPin,
            `${t.detail.checkIn ?? d.checkIn}`,
            [property.checkIn, property.checkOut].filter(Boolean).join(" → "),
          ],
        ] as const)
      : []),
    ...(property.host?.superhost ? ([[Sparkles, t.detail.superhost, d.cleanText]] as const) : []),
  ];

  // Only real reviews returned by the service are shown; none are invented.
  const reviewList = propertyReviews.slice(0, 6);

  async function shareListing() {
    if (navigator.share) {
      await navigator.share({ title: propertyName, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    toast.success(t.detail.shared);
  }

  function openGallery(index: number) {
    setActiveImage(index);
    setGalleryOpen(true);
  }

  async function contactHost() {
    if (!property) return;
    if (!session) {
      void navigate({ to: "/auth", search: { redirect: `/stays/${property.id}` } });
      return;
    }
    const existing = threads.find((thread) => thread.propertyId === property.id);
    const intro = `Hi! I have a question about ${property.name}.`;
    if (!existing && backendEnabled) {
      const created = await remote.startThread(property.id, intro);
      if (!created) return;
      const thread = toThread(created);
      setPlatform((state) => ({
        threads: [thread, ...state.threads.filter((row) => row.id !== thread.id)],
      }));
      toast.success(x.conversationOpened);
      void navigate({ to: "/messages" });
      return;
    }
    if (!existing) {
      setPlatform((state) => ({
        threads: [
          {
            id: `th-${property.id}`,
            propertyId: property.id,
            withName: `${property.host?.name ?? "Host"} (host)`,
            unread: 0,
            messages: [
              {
                id: "m-intro",
                from: "me" as const,
                text: `Hi! I have a question about ${property.name}.`,
                time: new Date().toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ],
          },
          ...state.threads,
        ],
      }));
    }
    toast.success(x.conversationOpened);
    void navigate({ to: "/messages" });
  }

  function reserve() {
    if (!property) return;
    if (!nights || !range?.from || !range.to) {
      toast.error(t.detail.selectDates);
      return;
    }
    if (blockedNightsIn(calendar, property.id, range.from, range.to).length) {
      toast.error(x.nightsUnavailable);
      return;
    }
    if (adults + children > property.guests) {
      toast.error(x.maxGuests.replace("{n}", String(property.guests)));
      return;
    }
    navigate({
      to: "/checkout",
      search: {
        propertyId,
        // The calendar hands back local midnight: `toISODate` keeps the day the
        // guest actually picked (`toISOString` shifts it east of UTC).
        from: toISODate(range.from),
        to: toISODate(range.to),

        nights,
        guests: adults + children,
      },
    });
  }

  const ownerNotice = !isOwner || !ownListing
    ? null
    : ownListing.status === "suspended"
      ? { title: d.suspendedTitle, text: d.suspendedText }
      : ownListing.status !== "published"
        ? { title: d.draftTitle, text: d.draftText }
        : !ownListing.approved
          ? { title: d.pendingTitle, text: d.pendingText }
          : null;

  return (
    <main className="min-h-screen bg-background pb-48 lg:pb-24">
      <PropertyHeader
        favorite={favorite}
        onShare={() => void shareListing()}
        onToggleFavorite={() => toggle(property.id)}
      />

      {ownerNotice ? (
        <div className="mx-auto max-w-6xl px-5 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-amber-900">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{ownerNotice.title}</p>
              <p className="text-sm opacity-90">{ownerNotice.text}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-0 pt-4 sm:px-6 sm:pt-8 lg:px-8">
        {/* Title row */}
        <div className="hidden items-end justify-between gap-6 pb-4 sm:flex">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.7rem]">
            {property.name}
          </h1>
        </div>

        {/* Airbnb-style photo grid */}
        <section
          aria-label={t.detail.photo
            .replace("{current}", "1")
            .replace("{total}", String(gallery.length))}
          className="relative overflow-hidden sm:grid sm:h-[26rem] sm:grid-cols-4 sm:grid-rows-2 sm:gap-2 sm:overflow-hidden sm:rounded-xl"
        >
          {gallery.slice(0, 5).map((image, index) => (
            <Button
              key={`${image}-${index}`}
              type="button"
              variant="ghost"
              onClick={() => openGallery(index)}
              aria-label={interpolate(t.detail.photo, {
                current: index + 1,
                total: gallery.length,
              })}
              className={cn(
                "group relative h-auto overflow-hidden rounded-none bg-muted p-0 hover:bg-muted",
                index === 0
                  ? "h-[17rem] w-full sm:col-span-2 sm:row-span-2 sm:h-full"
                  : "hidden sm:block sm:h-full",
              )}
            >
              <img
                src={image}
                alt={index === 0 ? imageAlt : ""}
                loading={index === 0 ? "eager" : "lazy"}
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/10" />
            </Button>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={() => openGallery(0)}
            className="absolute right-4 bottom-4 z-20 gap-2 rounded-lg border border-border bg-surface/95 px-4 text-xs font-semibold shadow-lift backdrop-blur hover:bg-surface"
          >
            <Images className="size-4" aria-hidden />
            {d.showPhotos}
            <span className="text-muted-foreground">{gallery.length}</span>
          </Button>
        </section>

        <div className="relative bg-surface px-5 pt-8 sm:bg-transparent sm:px-0">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
            {/* Main column */}
            <div className="min-w-0 lg:col-span-7">
              <header className="pb-8">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:hidden">
                  {property.name}
                </h1>
                <h2 className="mt-1 font-display text-xl font-semibold sm:mt-0">
                  {t.detail.entire} · {cityName(property, locale)}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {property.guests} {t.listings.guests} · {property.beds} {t.listings.beds} ·{" "}
                  {property.baths} {t.listings.baths} · {property.area} m²
                </p>
              </header>

              {/* Rating card — only when the stay has real reviews */}
              {displayedReviewCount > 0 ? (
                <div className="flex items-center gap-6 rounded-xl border border-border bg-surface px-6 py-4">
                  <Award className="size-8 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t.detail.guestFavorite}</p>
                    <p className="text-xs text-muted-foreground">{d.loved}</p>
                  </div>
                  <div className="shrink-0 border-l border-border pl-6 text-center">
                    <p className="font-display text-xl font-semibold">
                      {displayedRating.toFixed(2)}
                    </p>
                    <div className="flex justify-center gap-0.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="size-2.5 fill-primary text-primary" aria-hidden />
                      ))}
                    </div>
                  </div>
                  <a
                    href="#reviews"
                    className="shrink-0 border-l border-border pl-6 text-center hover:opacity-80"
                  >
                    <p className="font-display text-xl font-semibold">{displayedReviewCount}</p>
                    <p className="text-[11px] text-muted-foreground">{t.detail.reviews}</p>
                  </a>
                </div>
              ) : null}


              {/* Host row */}
              <Section>
                <div className="flex items-center gap-4">
                  <UserAvatar name={hostName} src={property.host?.avatarUrl} className="size-12" />
                  <div>
                    <p className="text-sm font-semibold">{`${d.hostedBy} ${hostName}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {property.host?.superhost ? `${t.detail.superhost} · ` : ""}
                      {property.host?.since
                        ? `${d.hostSince} ${property.host.since}`
                        : t.detail.hostNote}
                    </p>
                  </div>
                </div>

                <ul className="mt-8 space-y-6">
                  {highlights.map(([Icon, title, note]) => (
                    <li key={title} className="flex items-start gap-4">
                      <Icon className="mt-0.5 size-5 shrink-0 text-foreground" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-sm text-muted-foreground">{note}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Description */}
              <Section>
                <h2 className="font-display text-xl font-semibold">{t.detail.description}</h2>
                {property.summary ? (
                  <p className="mt-4 leading-relaxed font-medium">{property.summary}</p>
                ) : null}
                <p
                  className={cn(
                    "mt-4 leading-relaxed whitespace-pre-line text-muted-foreground",
                    !expanded && "line-clamp-4",
                  )}
                >
                  {property.description || t.detail.descriptionBody}
                </p>
                <Button
                  variant="link"
                  className="mt-2 h-auto px-0 text-sm font-semibold underline"
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? t.detail.showLess : t.detail.showMore}
                </Button>
              </Section>

              {/* Good to know — everything the host filled in the wizard */}
              <Section>
                <h2 className="font-display text-xl font-semibold">{lc.goodToKnow}</h2>
                <dl className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                  <Fact label={lc.checkIn} value={property.checkIn ?? "15:00"} />
                  <Fact label={lc.checkOut} value={property.checkOut ?? "11:00"} />
                  <Fact label={lc.minNights} value={fill(lc.minNightsValue, { n: property.minNights ?? 1 })} />
                  <Fact label={lc.rooms} value={String(property.rooms ?? property.beds)} />
                  {property.cleaningFee ? (
                    <Fact label={lc.cleaningFeeLabel} value={formatCurrency(property.cleaningFee)} />
                  ) : null}
                  {property.neighbourhood ? <Fact label={lc.neighbourhood} value={property.neighbourhood} /> : null}
                  {property.postal ? <Fact label={lc.postal} value={property.postal} /> : null}
                  {property.instantBook ? <Fact label={lc.instantBook} value={lc.instantBookOn} /> : null}
                  {listing?.longStay.enabled ? (
                    <Fact
                      label={lc.longStay}
                      value={fill(lc.discountLong, { d: listing.longStay.discount, n: listing.longStay.threshold })}
                    />
                  ) : null}
                  {listing?.mobile.enabled ? (
                    <Fact label={lc.mobileDiscount} value={fill(lc.discountMobile, { d: listing.mobile.discount })} />
                  ) : null}
                </dl>
                {property.houseRules ? (
                  <div className="mt-6">
                    <p className="text-sm font-semibold">{lc.rules}</p>
                    <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{property.houseRules}</p>
                  </div>
                ) : null}
              </Section>

              {/* Amenities */}
              <Section>
                <h2 className="font-display text-xl font-semibold">{t.detail.amenities}</h2>
                <ul className="mt-6 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                  {amenities.map(([Icon, label]) => (
                    <li
                      key={label}
                      className="flex items-center gap-4 border-b border-border/60 py-4 text-sm last:border-0"
                    >
                      <Icon className="size-5 shrink-0 text-foreground" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Equipment & services */}
              {property.equipment?.length ? (
                <Section>
                  <EquipmentList ids={property.equipment} />
                </Section>
              ) : null}

              {/* Cancellation policy */}
              <Section>
                <h2 className="font-display text-xl font-semibold">{cc.cancellationPolicy}</h2>
                <p className="mt-3 text-sm font-semibold">
                  {cancellationLabel(property.cancellationPolicy ?? "moderate", cc)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cancellationText(property.cancellationPolicy ?? "moderate", cc)}
                </p>
                <div className="mt-4">
                  <ReportListingDialog listingId={listing?.id ?? property.id} />
                </div>
              </Section>

              {/* Availability */}
              <Section>
                <h2 className="font-display text-xl font-semibold">
                  {`${d.availability} ${cityName(property, locale)}`}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {range?.from
                    ? `${format(range.from, "d MMM yyyy", { locale: dateLocale })}${range.to ? ` — ${format(range.to, "d MMM yyyy", { locale: dateLocale })}` : ""}`
                    : t.detail.selectDates}
                </p>
                <div className="mt-4 overflow-x-auto">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={range}
                    onSelect={setRange}
                    locale={dateLocale}
                    disabled={[
                      { before: new Date() },
                      (date: Date) => isNightBlocked(calendar, property.id, toISODate(date)),
                    ]}
                  />
                </div>
              </Section>
            </div>

            {/* Booking sidecar */}
            <aside className="hidden lg:col-span-5 lg:block">
              <div className="sticky top-8 rounded-2xl border border-border bg-surface p-6 shadow-[0_16px_40px_-18px_color-mix(in_oklab,var(--navy)_28%,transparent)]">
                <BookingPanel
                  propertyPrice={property.price}
                  currency={property.currency}
                  range={range}
                  setRange={setRange}
                  adults={adults}
                  setAdults={setAdults}
                  children={children}
                  setChildren={setChildren}
                  nights={nights}
                  total={total}
                  reserve={reserve}
                  quote={quote}
                  maxGuests={property.guests}
                  rating={displayedRating}
                  reviewCount={displayedReviewCount}
                  isNightUnavailable={(date) =>
                    isNightBlocked(calendar, property.id, toISODate(date))
                  }
                />
              </div>
            </aside>
          </div>

          {/* Full-width sections */}
          <Section id="reviews" className="mt-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <Star className="size-6 translate-y-1 fill-primary text-primary" aria-hidden />
              <h2 className="font-display text-2xl font-semibold">
                {displayedRating.toFixed(2)} · {displayedReviewCount} {t.detail.reviews}
              </h2>
            </div>


            {reviewList.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">{noReviewsText}</p>
            ) : null}

            <div className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {reviewList.map((review) => (
                <article key={review.id}>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={review.author} src={'authorAvatar' in review ? review.authorAvatar : undefined} className="size-10" />
                    <div>
                      <p className="text-sm font-semibold">{review.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {review.date} · {review.rating}/5
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {review.text}
                  </p>
                  {review.reply ? (
                    <p className="mt-3 border-l-2 border-primary pl-4 text-sm text-muted-foreground">
                      {review.reply}
                    </p>
                  ) : null}
                  <ReportReviewButton reviewId={review.id} />
                </article>
              ))}
            </div>
          </Section>

          <Section>
            <h2 className="font-display text-xl font-semibold">{t.detail.locationTitle}</h2>
            <AreaMap
              className="mt-6"
              coords={property.coords}
              city={cityName(property, locale)}
              note={t.detail.mapNote}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              {cityName(property, locale)} · {t.detail.mapNote}
            </p>
          </Section>

          <Section>
            <h2 className="font-display text-xl font-semibold">{d.meetHost}</h2>
            <div className="mt-6 grid gap-8 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="rounded-xl border border-border p-6 text-center">
                <UserAvatar name={hostName} src={property.host?.avatarUrl} className="mx-auto size-20" />
                <p className="mt-4 font-display text-xl font-semibold">{hostName}</p>
                <p className="text-xs text-muted-foreground">
                  {property.host?.superhost ? t.detail.superhost : `${d.hostedBy} ${hostName}`}
                </p>
                <div className="mt-4 flex justify-center gap-6 text-xs">
                  <div>
                    <p className="font-display text-lg font-semibold">{displayedReviewCount}</p>
                    <p className="text-muted-foreground">{t.detail.reviews}</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {displayedRating.toFixed(1)}
                    </p>
                    <p className="text-muted-foreground">{t.detail.rating}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">{t.detail.hostNote}</p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <DoorOpen className="size-4 text-foreground" aria-hidden />
                    {t.detail.arrival}
                  </li>
                  <li className="flex items-center gap-3">
                    <ShieldCheck className="size-4 text-foreground" aria-hidden />
                    {t.detail.superhost}
                  </li>
                </ul>
                <Button variant="outline" className="mt-8 rounded-lg" onClick={contactHost}>
                  {x.contactHost}
                </Button>
              </div>
            </div>
          </Section>

          <Section>
            <h2 className="font-display text-xl font-semibold">{t.detail.houseRules}</h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-3">
              {(
                [
                  [d.houseRules, [t.detail.arrival, `${property.guests} ${t.listings.guests} max`]],
                  [d.safety, [t.detail.security, t.detail.mapNote]],
                  [
                    d.cancellation,
                    [
                      cancellationLabel(property.cancellationPolicy ?? "moderate", cc),
                      cancellationText(property.cancellationPolicy ?? "moderate", cc),
                    ],
                  ],
                ] as ReadonlyArray<readonly [string, string[]]>
              ).map(([title, items]) => (
                <div key={title}>
                  <p className="text-sm font-semibold">{title}</p>
                  <ul className="mt-3 space-y-2">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <PhotoGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        images={gallery}
        activeIndex={activeImage}
        onActiveIndexChange={setActiveImage}
        propertyName={property.name}
        location={cityName(property, locale)}
      />

      <div className="fixed inset-x-0 bottom-[calc(4.35rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {formatCurrency(property.price)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {t.listings.night}
              </span>
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3 fill-primary text-primary" aria-hidden />
              {displayedRating.toFixed(1)} · {displayedReviewCount} {t.detail.reviews}
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="lg" className="rounded-lg">
                {t.detail.reserve}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-[calc(100vw-2rem)] max-w-sm p-6">
              <BookingPanel
                propertyPrice={property.price}
                  currency={property.currency}
                range={range}
                setRange={setRange}
                adults={adults}
                setAdults={setAdults}
                children={children}
                setChildren={setChildren}
                nights={nights}
                total={total}
                reserve={reserve}
                quote={quote}
                maxGuests={property.guests}
                rating={displayedRating}
                reviewCount={displayedReviewCount}
                isNightUnavailable={(date) =>
                  isNightBlocked(calendar, property.id, toISODate(date))
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Footer />
    </main>
  );
}

type BookingPanelProps = {
  propertyPrice: number;
  currency?: string | undefined;
  range: DateRange | undefined;
  setRange: (range: DateRange | undefined) => void;
  adults: number;
  setAdults: (value: number) => void;
  children: number;
  setChildren: (value: number) => void;
  nights: number;
  total: number;
  reserve: () => void;
  quote: Quote;
  maxGuests: number;
  rating: number;
  reviewCount: number;
  isNightUnavailable: (date: Date) => boolean;
};

function BookingPanel({
  propertyPrice,
  range,
  setRange,
  adults,
  setAdults,
  children,
  setChildren,
  nights,
  total,
  reserve,
  quote,
  maxGuests,
  rating,
  reviewCount,
  isNightUnavailable,
  currency,
}: BookingPanelProps) {
  const { t, locale } = useLanguage();
  const { format: formatDisplay } = useCurrency();
  const formatCurrency = (amount: number, options?: { decimals?: boolean }) =>
    formatDisplay(amount, { ...options, from: currency });
  const x = useExtra();
  const dateLocale = dateFnsLocale(locale);
  const dateText = range?.from
    ? `${format(range.from, "dd MMM", { locale: dateLocale })}${range.to ? ` — ${format(range.to, "dd MMM", { locale: dateLocale })}` : ""}`
    : t.search.datePlaceholder;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-semibold">
            {formatCurrency(propertyPrice)}
          </span>
          <span className="text-sm text-muted-foreground">/ {t.listings.night}</span>
        </p>
        <p className="flex items-baseline gap-1.5 text-xs">
          <Star className="size-3.5 translate-y-0.5 fill-primary text-primary" aria-hidden />
          {reviewCount > 0 && rating > 0 ? (
            <>
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviewCount})</span>
            </>
          ) : (
            <span className="font-semibold">★</span>
          )}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start rounded-none px-4 py-3.5 text-sm font-medium hover:bg-secondary/50"
            >
              <CalendarDays className="text-muted-foreground" />
              {dateText}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={dateLocale}
              disabled={[{ before: new Date() }, isNightUnavailable]}
            />
          </PopoverContent>
        </Popover>
        <div className="border-t border-border px-4 py-3.5">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t.detail.guestsLabel}
          </p>
          {[
            [t.detail.adults, adults, setAdults, 1],
            [t.detail.children, children, setChildren, 0],
          ].map(([label, value, setter, min]) => (
            <div
              key={String(label)}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pt-3"
            >
              <span className="text-sm">{String(label)}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7 rounded-full"
                  onClick={() =>
                    (setter as (n: number) => void)(Math.max(Number(min), Number(value) - 1))
                  }
                  disabled={Number(value) <= Number(min)}
                >
                  <Minus />
                </Button>
                <span className="w-5 text-center text-sm tabular-nums">{String(value)}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7 rounded-full"
                  onClick={() => (setter as (n: number) => void)(Math.min(12, Number(value) + 1))}
                  disabled={adults + children >= maxGuests}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        className="mt-5 w-full rounded-xl py-6 text-sm font-semibold"
        onClick={reserve}
      >
        {t.detail.reserve}
      </Button>

      {nights > 0 ? (
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground underline">
              {formatCurrency(propertyPrice)} × {nights} {t.detail.nights}
            </span>
            <span>{formatCurrency(quote.baseSubtotal)}</span>
          </div>
          {quote.discounts.map((discount) => (
            <div key={discount.id} className="flex justify-between text-primary">
              <span>
                {discount.id === "longStay"
                  ? x.longStayDiscount
                  : discount.id === "mobile"
                    ? x.mobileOffer
                    : x.lastMinuteOffer}{" "}
                (−{discount.percent}%)
              </span>
              <span>−{formatCurrency(discount.amount)}</span>
            </div>
          ))}
          {quote.cleaningFee > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground underline">{x.cleaningFeeLine}</span>
              <span>{formatCurrency(quote.cleaningFee)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground underline">{t.app.checkout.serviceFee}</span>
            <span>{formatCurrency(quote.serviceFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground underline">{t.app.checkout.taxes}</span>
            <span>{formatCurrency(quote.taxes)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-4 font-semibold">
            <span>{t.detail.total}</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {x.avgPerNight}: {formatCurrency(quote.perNight)}
          </p>
        </div>
      ) : null}

      <p className="mt-5 text-center text-xs text-muted-foreground">{t.detail.noFees}</p>
      <p className="mt-1 text-center text-xs text-muted-foreground">{x.unavailableNote}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border/60 pb-3">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
