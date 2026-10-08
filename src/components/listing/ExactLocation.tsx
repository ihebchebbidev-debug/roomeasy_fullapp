import { ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, MapPin } from "lucide-react";
import { Suspense, lazy } from "react";

import { request } from "@/api/http/client";
import { useLanguage } from "@/i18n/LanguageProvider";

const LeafletPin = lazy(() => import("@/components/listing/LeafletPin"));

const copy = {
  en: { title: "Exact location", locked: "The exact address unlocks once your payment is complete.", open: "Open in maps" },
  fr: { title: "Emplacement exact", locked: "L'emplacement exact se débloque une fois votre paiement effectué.", open: "Ouvrir dans Maps" },
  es: { title: "Ubicación exacta", locked: "La ubicación exacta se desbloquea cuando se completa el pago.", open: "Abrir en mapas" },
  de: { title: "Genauer Standort", locked: "Der genaue Standort wird nach Abschluss der Zahlung freigeschaltet.", open: "In Karten öffnen" },
  pt: { title: "Localização exata", locked: "A localização exata é desbloqueada após o pagamento.", open: "Abrir no mapa" },
} as const;

/** Precise spot of a booked stay — only returned by the server once paid. */
export function ExactLocation({ bookingId, paid }: { bookingId: string; paid: boolean }) {
  const { locale } = useLanguage();
  const c = copy[locale] ?? copy.en;
  const { data } = useQuery({
    queryKey: ["booking-location", bookingId, paid],
    queryFn: () =>
      request<{ unlocked: boolean; coords: { lat: number; lng: number } | null }>(
        `/bookings/${encodeURIComponent(bookingId)}/location`,
      ),
    enabled: paid,
  });
  const coords = data?.unlocked ? data.coords : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-2 p-5 pb-3">
        <MapPin className="size-4 text-primary" aria-hidden />
        <h2 className="font-display text-lg font-bold">{c.title}</h2>
      </div>
      {coords ? (
        <>
          <div className="h-64 w-full">
            <ClientOnly fallback={<div className="size-full animate-pulse bg-secondary" />}>
              <Suspense fallback={<div className="size-full animate-pulse bg-secondary" />}>
                <LeafletPin lat={coords.lat} lng={coords.lng} />
              </Suspense>
            </ClientOnly>
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`}
            target="_blank"
            rel="noreferrer"
            className="block p-4 text-sm font-semibold text-primary hover:underline"
          >
            {c.open}
          </a>
        </>
      ) : (
        <p className="flex items-center gap-2 px-5 pb-5 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          {c.locked}
        </p>
      )}
    </section>
  );
}
