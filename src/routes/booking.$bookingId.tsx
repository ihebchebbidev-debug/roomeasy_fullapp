import { privateRouteMeta } from "@/i18n/privateRouteMeta";
import { countLabel } from "@/i18n/countLabel";
import { localeOf, privatePageMeta } from "@/lib/seo";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Clock, LifeBuoy, MapPin, MessageSquare, Users } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { BookingReceipt } from "@/components/booking/BookingReceipt";
import { Button } from "@/components/ui/button";
import { cityName } from "@/data/properties";
import { useAllProperties } from "@/hooks/useAllProperties";
import { useEnsureStays } from "@/hooks/useEnsureStays";
import { useBooking } from "@/hooks/useBookingApi";
import { longDate } from "@/lib/cardFormat";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useBookingCopy } from "@/i18n/booking";
import { useExtra } from "@/i18n/extra";
import { openConversation } from "@/lib/conversation";
import { useSmartPricingCopy } from "@/i18n/smartPricingCopy";
import { downloadApiFile } from "@/api/http/adminOps.http";
import { FileDown } from "lucide-react";
import { ExactLocation } from "@/components/listing/ExactLocation";

const UNPAID_COPY: Record<string, { title: string; subtitle: string; cta: string }> = {
  en: { title: "Payment not completed", subtitle: "Your reservation is saved but not paid yet. Pay to secure these dates.", cta: "Complete payment" },
  fr: { title: "Paiement non finalisé", subtitle: "Votre réservation est enregistrée mais pas encore payée. Payez pour bloquer ces dates.", cta: "Finaliser le paiement" },
  es: { title: "Pago no completado", subtitle: "Tu reserva está guardada pero aún no pagada. Paga para asegurar estas fechas.", cta: "Completar el pago" },
  de: { title: "Zahlung nicht abgeschlossen", subtitle: "Deine Buchung ist gespeichert, aber noch nicht bezahlt. Bezahle, um diese Daten zu sichern.", cta: "Zahlung abschließen" },
  pt: { title: "Pagamento não concluído", subtitle: "A sua reserva está guardada mas ainda não paga. Pague para garantir estas datas.", cta: "Concluir pagamento" },
};

export const Route = createFileRoute("/booking/$bookingId")({
  head: ({ match }) => ({
    meta: privatePageMeta(...Object.values(privateRouteMeta["booking.$bookingId"][localeOf(match) ?? "en"]) as [string, string]),
  }),
  component: BookingConfirmation,
});

function BookingConfirmation() {
  const { bookingId } = Route.useParams();
  const { t, locale } = useLanguage();
  const c = useBookingCopy();
  const x = useExtra();
  const navigate = useNavigate();
  const sp = useSmartPricingCopy();
  const properties = useAllProperties();
  const { data: booking, isLoading } = useBooking(bookingId);
  // Loads the booked stay when it is not part of the catalogue slice held.
  useEnsureStays([booking?.propertyId]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto grid max-w-3xl gap-6">
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
        </div>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell title={c.confirmTitle}>
        <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted-foreground">{c.notFound}</p>
          <Button asChild className="mt-6">
            <Link to="/trips">{c.viewTrips}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const property = properties.find((p) => p.id === booking.propertyId);
  // Right after the card step the payment record can lag a few seconds behind;
  // show an honest "confirming" state until it lands instead of a premature status.
  const fromCheckout =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("redirect_status") === "succeeded";
  const settling =
    fromCheckout &&
    booking.payment.status !== "paid" &&
    // Instant-book stays are charged at once, so anything short of "paid" is
    // still settling; request-to-book stays legitimately sit on a card hold.
    (booking.status === "confirmed" || (booking.status === "pending" && property?.instantBook === true));
  const location = property ? cityName(property, locale) : undefined;
  // A request the guest left before paying must not claim the payment arrived.
  const unpaid =
    !settling &&
    booking.status === "pending" &&
    !["paid", "authorized", "refunded"].includes(booking.payment?.status ?? "");
  const u = UNPAID_COPY[locale] ?? UNPAID_COPY["en"]!;

  return (
    <AppShell>
      <div className="mx-auto grid max-w-3xl gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
          <div
            className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <span className={`mx-auto flex size-14 items-center justify-center rounded-full ${unpaid ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
              {unpaid ? <Clock className="size-8 text-amber-600" aria-hidden /> : <CheckCircle2 className="size-8 text-emerald-600" aria-hidden />}
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">{settling ? c.settlingTitle : unpaid ? u.title : booking.status === "pending" ? c.pendingTitle : c.confirmTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{settling ? c.settlingSubtitle : unpaid ? u.subtitle : booking.status === "pending" ? c.pendingSubtitle : c.confirmSubtitle}</p>
            <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm">
              <span className="text-muted-foreground">{c.reference}</span>
              <span className="font-mono font-semibold tracking-wide">{booking.reference}</span>
            </p>
            {unpaid ? (
              <div className="mt-5">
                <Button asChild>
                  <Link
                    to="/checkout"
                    search={{ propertyId: booking.propertyId, from: booking.from, to: booking.to, nights: booking.nights, guests: booking.guests, bookingId: booking.id, ...(booking.reference ? { bookingRef: booking.reference } : {}) }}
                  >
                    {u.cta}
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        {property ? (
          <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex gap-4 p-5">
              <img
                src={property.image}
                alt={property.name}
                loading="lazy"
                className="size-24 shrink-0 rounded-xl object-cover sm:size-28"
              />
              <div className="min-w-0 flex-1">
                <Link
                  to="/stays/$propertyId"
                  params={{ propertyId: property.id }}
                  className="font-display text-lg font-bold hover:underline"
                >
                  {property.name}
                </Link>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden />
                  {location}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-3.5" aria-hidden />
                  {countLabel(booking.guests, t.listings.guests)} · {booking.nights} {t.app.trips.nights}
                </p>
              </div>
            </div>

            <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
              {/* Hours come from the listing itself; the generic wording is only
                  used when the host has not set them. */}
              <Stage
                label={c.checkIn}
                date={longDate(booking.from, locale)}
                time={property.checkIn || c.checkInTime}
              />
              <Stage
                label={c.checkOut}
                date={longDate(booking.to, locale)}
                time={property.checkOut || c.checkOutTime}
              />
            </div>
          </section>
        ) : null}

        {booking.status !== "cancelled" && booking.status !== "declined" ? (
          <ExactLocation bookingId={booking.id} paid={booking.payment.status === "paid"} />
        ) : null}

        <BookingReceipt
          booking={booking}
          propertyName={property?.name ?? booking.propertyId}
          {...(location ? { propertyLocation: location } : {})}
        />

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm" data-print-hide>
          <h2 className="font-display text-lg font-bold">{c.whatsNext}</h2>
          <ol className="mt-4 space-y-4">
            {[c.next1, c.next2, c.next3].map((step, index) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-6"
          data-print-hide
        >
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LifeBuoy className="size-4" aria-hidden />
            {c.needHelp}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const opened = await openConversation(
                  booking.propertyId,
                  property?.name ?? booking.propertyId,
                  property?.host?.name,
                  booking.id,
                );
                if (!opened) return;
                toast.success(x.conversationOpened);
                void navigate({ to: "/messages" });
              }}
            >
              <MessageSquare className="size-4" aria-hidden />
              {c.contactHost}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void downloadApiFile(
                  `/api/bookings/${encodeURIComponent(booking.id)}/invoice.pdf`,
                  {},
                  `invoice-${booking.id}.pdf`,
                ).catch(() => toast.error(sp.invoiceFailed))
              }
            >
              <FileDown className="size-4" aria-hidden />
              {sp.invoicePdf}
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/help">{c.helpCenter}</Link>
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-3" data-print-hide>
          <Button asChild size="lg">
            <Link to="/trips">
              <CalendarDays className="size-4" aria-hidden />
              {c.viewTrips}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/">{c.backHome}</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Stage({ label, date, time }: { label: string; date: string; time: string }) {
  return (
    <div className="bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{date}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden />
        {time}
      </p>
    </div>
  );
}
