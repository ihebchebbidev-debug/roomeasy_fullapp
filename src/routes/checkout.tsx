import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CalendarDays, CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, Users } from "lucide-react";
import { longDate } from "@/lib/cardFormat";

const PAYMENT_UNAVAILABLE = {
  en: "Online card payment is not available right now. Please try again later.",
  fr: "Le paiement par carte en ligne n'est pas disponible pour le moment. Veuillez réessayer plus tard.",
  es: "El pago con tarjeta en línea no está disponible en este momento. Inténtalo más tarde.",
  de: "Die Online-Kartenzahlung ist derzeit nicht verfügbar. Bitte versuche es später erneut.",
  pt: "O pagamento com cartão online não está disponível de momento. Tente novamente mais tarde.",
} as const;
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useExtra } from "@/i18n/extra";
import { useListingCopy } from "@/i18n/listingCopy";
import { cityName } from "@/data/properties";
import { hydrateAccount } from "@/api/backend";
import { useAllProperties } from "@/hooks/useAllProperties";
import { useEnsureStays } from "@/hooks/useEnsureStays";

import { ruleSummary, useSmartPricingCopy } from "@/i18n/smartPricingCopy";
import { useAvailability, useCreateBooking, useQuote } from "@/hooks/useBookingApi";
import { usePlatform } from "@/hooks/usePlatform";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useBookingCopy } from "@/i18n/booking";
import { ApiError, type ApiErrorCode } from "@/api/types";
import { useClientCopy } from "@/i18n/clientCopy";
import { cancellationLabel, cancellationText } from "@/lib/cancellation";
import { paymentsApi, type PaymentsConfigDto } from "@/api/http/payments.http";
import { StripeCardPayment } from "@/components/booking/StripeCardPayment";

type CheckoutSearch = {
  propertyId: string | undefined;
  from: string | undefined;
  to: string | undefined;
  nights: number | undefined;
  guests: number | undefined;
};

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    propertyId: typeof search["propertyId"] === "string" ? search["propertyId"] : undefined,
    from: typeof search["from"] === "string" ? search["from"] : undefined,
    to: typeof search["to"] === "string" ? search["to"] : undefined,
    nights: Number(search["nights"]) > 0 ? Number(search["nights"]) : undefined,
    guests: Number(search["guests"]) > 0 ? Number(search["guests"]) : undefined,
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Confirm and pay — RoomEasy" },
      { name: "description", content: "Review your RoomEasy stay, price breakdown and cancellation policy, then confirm your booking." },
      { property: "og:title", content: "Confirm and pay — RoomEasy" },
      { property: "og:description", content: "Review your stay, price breakdown and cancellation policy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

const SIGNED_OUT_COPY = {
  en: {
    title: "Sign in to book",
    body: "A RoomEasy account is required to pay for a stay, so your booking, payment and confirmation stay linked to you.",
    back: "Back to the listing",
  },
  fr: {
    title: "Connectez-vous pour réserver",
    body: "Un compte RoomEasy est nécessaire pour payer un séjour, afin que votre réservation et votre paiement restent liés à vous.",
    back: "Retour à l'annonce",
  },
  es: {
    title: "Inicia sesión para reservar",
    body: "Se necesita una cuenta de RoomEasy para pagar una estancia, así tu reserva y tu pago quedan vinculados a ti.",
    back: "Volver al anuncio",
  },
  de: {
    title: "Zum Buchen anmelden",
    body: "Für die Zahlung eines Aufenthalts ist ein RoomEasy-Konto erforderlich, damit Buchung und Zahlung dir zugeordnet bleiben.",
    back: "Zurück zum Angebot",
  },
  pt: {
    title: "Entre para reservar",
    body: "É necessária uma conta RoomEasy para pagar uma estadia, para que a reserva e o pagamento fiquem ligados a você.",
    back: "Voltar ao anúncio",
  },
} as const;

/** Sensible billing country per interface language, so the card form is not stuck on another country. */
const COUNTRY_BY_LOCALE = { en: "GB", fr: "FR", es: "ES", de: "DE", pt: "PT" } as const;

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function CheckoutPage() {
  const { t, locale } = useLanguage();
  const { format: formatDisplay, formatCharged: formatChargedIn } = useCurrency();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { session } = usePlatform();
  const isMobile = useIsMobile();
  const x = useExtra();
  const c = useBookingCopy();
  const lc = useListingCopy();

  const properties = useAllProperties();
  // The stay may sit outside the slice of the catalogue already loaded.
  const loadingStay = useEnsureStays([search.propertyId]);
  // Never fall back to another listing: paying for a stay the guest did not
  // choose is worse than showing "not found".
  const property = properties.find((p) => p.id === search.propertyId) ?? null;
  // Amounts are in the listing's currency; the guest is charged in it.
  const listingCurrency = property?.currency ?? "EUR";
  const format = (amount: number, options?: { decimals?: boolean }) => formatDisplay(amount, { ...options, from: listingCurrency });
  const formatCharged = (amount: number) => formatChargedIn(amount, listingCurrency);
  const propertyMissing = !property && !loadingStay && properties.length > 0;

  const from = search.from ?? addDays(new Date().toISOString().slice(0, 10), 14);
  const to = search.to ?? addDays(from, search.nights ?? 2);
  const guests = search.guests ?? 2;

  const [name, setName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [phone, setPhone] = useState(session?.phone ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [payConfig, setPayConfig] = useState<PaymentsConfigDto | null>(null);
  const [stripeStage, setStripeStage] = useState<{ clientSecret: string; bookingId: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const cc = useClientCopy();

  // The account is loaded after the first render, so fill the contact details
  // in as soon as they arrive — unless the guest already typed something.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched || !session) return;
    setName((current) => current || session.name || "");
    setEmail((current) => current || session.email || "");
    setPhone((current) => current || session.phone || "");
  }, [session, touched]);

  // While the Stripe keys are empty this stays null and the demo card form is used.
  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .config()
      .then((config) => {
        if (!cancelled) setPayConfig(config.enabled && config.publishableKey ? config : null);
      })
      .catch(() => setPayConfig(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const availability = useAvailability(property ? { propertyId: property.id, from, to } : null);
  const quoteQuery = useQuote(property ? { propertyId: property.id, from, to, guests, isMobile } : null);
  const createBooking = useCreateBooking();
  const paySubmitting = useRef(false);
  const quote = quoteQuery.data;
  const sp = useSmartPricingCopy();
  const nights = quote?.nights ?? search.nights ?? 2;

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    // One submission at a time: a double click or double Enter never books twice.
    if (paySubmitting.current) return;
    setError(null);
    if (!property || !session) return;
    paySubmitting.current = true;
    try {
      await payOnce();
    } finally {
      paySubmitting.current = false;
    }
  }

  async function payOnce() {
    if (!property || !session) return;

    // Real card payment: reserve first, then let Stripe collect the card.
    if (payConfig) {
      setPreparing(true);
      try {
        const booking = await createBooking.mutateAsync({
          propertyId: property.id,
          from,
          to,
          guests,
          guest: { name: name || "Guest", email, ...(phone ? { phone } : {}) },
          ...(note.trim() ? { message: note.trim() } : {}),
          paymentMethod: "stripe",
          isMobile,
        });
        const intent = await paymentsApi.createIntent(booking.reference || booking.id);
        if (!intent.clientSecret) throw new ApiError("PAYMENT_DECLINED", "No client secret");
        setStripeStage({ clientSecret: intent.clientSecret, bookingId: booking.id });
      } catch (caught) {
        const code = caught instanceof ApiError ? (caught.code as ApiErrorCode) : "NOT_FOUND";
        setError(c.errors[code]);
        toast.error(c.errors[code]);
      } finally {
        setPreparing(false);
      }
      return;
    }

    // No card is ever collected by RoomEasy itself: without Stripe, checkout is closed.
    setError(PAYMENT_UNAVAILABLE[locale as keyof typeof PAYMENT_UNAVAILABLE] ?? PAYMENT_UNAVAILABLE.en);
  }

  const signedOutCopy = SIGNED_OUT_COPY[locale as keyof typeof SIGNED_OUT_COPY] ?? SIGNED_OUT_COPY.en;

  if (propertyMissing) {
    return (
      <AppShell title={t.app.checkout.title}>
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{c.errors.NOT_FOUND}</p>
          <Button asChild size="lg" className="w-full">
            <Link to="/stays">{t.detail.back}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!property) {
    return (
      <AppShell title={t.app.checkout.title}>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
          {t.app.checkout.title}
        </div>
      </AppShell>
    );
  }


  if (!session) {
    return (
      <AppShell title={t.app.checkout.title}>
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <Lock className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-bold">{signedOutCopy.title}</h2>
          <p className="text-sm text-muted-foreground">{signedOutCopy.body}</p>
          <Button asChild size="lg" className="w-full">
            <Link to="/auth">{t.app.auth.signIn}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/stays/$propertyId" params={{ propertyId: property.id }}>
              {signedOutCopy.back}
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={t.app.checkout.title}>
      <nav className="mb-8 flex items-center gap-3 text-xs font-medium sm:text-sm" aria-label="progress">
        <Step index={1} label={c.stepTrip} state="done" />
        <span className="h-px flex-1 bg-border" aria-hidden />
        <Step index={2} label={c.stepPay} state="current" />
        <span className="h-px flex-1 bg-border" aria-hidden />
        <Step index={3} label={c.stepDone} state="todo" />
      </nav>

      <form onSubmit={pay} className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold">{t.app.checkout.contact}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cname">{t.app.auth.name}</Label>
                <Input id="cname" autoComplete="name" value={name} onChange={(e) => { setTouched(true); setName(e.target.value); }} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cemail">{t.app.auth.email}</Label>
                <Input id="cemail" type="email" autoComplete="email" value={email} onChange={(e) => { setTouched(true); setEmail(e.target.value); }} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cphone">{c.phone}</Label>
                <Input id="cphone" type="tel" autoComplete="tel" value={phone} onChange={(e) => { setTouched(true); setPhone(e.target.value); }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnote">
                {t.app.checkout.request} <span className="text-muted-foreground">({t.app.checkout.optional})</span>
              </Label>
              <Textarea id="cnote" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">{payConfig ? c.stripeStep : c.paymentTitle}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Lock className="size-3" aria-hidden />
                Stripe
              </span>
            </div>
            {payConfig ? null : (
              <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground" role="status">
                {PAYMENT_UNAVAILABLE[locale as keyof typeof PAYMENT_UNAVAILABLE] ?? PAYMENT_UNAVAILABLE.en}
              </p>
            )}
            {payConfig && stripeStage ? (
              <StripeCardPayment
                publishableKey={payConfig.publishableKey as string}
                clientSecret={stripeStage.clientSecret}
                returnUrl={`${window.location.origin}/booking/${stripeStage.bookingId}`}
                totalLabel={formatCharged(quote?.total ?? 0)}
                defaults={{
                  name,
                  email,
                  ...(phone ? { phone } : {}),
                  country: COUNTRY_BY_LOCALE[locale as keyof typeof COUNTRY_BY_LOCALE] ?? "FR",
                }}
              />
            ) : null}
            {payConfig && !stripeStage ? (
              <p className="text-sm text-muted-foreground">{c.stripeSecured}</p>
            ) : null}
            {error ? (
              <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            ) : null}
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {c.encrypted}
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold">{t.app.checkout.policy}</h2>
            <p className="text-sm font-medium">{cancellationLabel(property.cancellationPolicy ?? "moderate", cc)}</p>
            <p className="text-sm text-muted-foreground">
              {cancellationText(property.cancellationPolicy ?? "moderate", cc)}
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden />
              {t.app.checkout.secure}
            </p>
          </section>
        </div>

        <aside className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex gap-3">
            <img
              src={property.image}
              alt={property.name}
              loading="lazy"
              className="size-20 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <Link
                to="/stays/$propertyId"
                params={{ propertyId: property.id }}
                className="block truncate font-semibold hover:underline"
              >
                {property.name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">{cityName(property, locale)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs">
                {availability.isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    <span className="text-muted-foreground">{c.checkingAvailability}</span>
                  </>
                ) : availability.data?.available ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
                    <span className="text-emerald-700">{c.available}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3.5 text-destructive" aria-hidden />
                    <span className="text-destructive">{c.unavailable}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            <div className="bg-surface p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.checkIn}</p>
              <p className="mt-0.5 text-sm font-medium">{longDate(from, locale)}</p>
            </div>
            <div className="bg-surface p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.checkOut}</p>
              <p className="mt-0.5 text-sm font-medium">{longDate(to, locale)}</p>
            </div>
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {nights} {t.app.trips.nights}
            </li>
            <li className="flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden />
              {guests} {t.listings.guests}
            </li>
          </ul>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <p className="pb-1 font-semibold">{c.priceDetails}</p>
            <Row
              label={t.app.checkout.nightsLine
                .replace("{price}", format(quote?.nightly ?? property.price))
                .replace("{nights}", String(nights))}
              value={format(quote?.baseSubtotal ?? 0)}
            />
            {quote?.nightsDetail?.length ? (
              <details className="rounded-md bg-muted/40 px-3 py-2 text-xs">
                <summary className="cursor-pointer text-muted-foreground">{sp.perNight}</summary>
                <ul className="mt-2 space-y-1">
                  {quote.nightsDetail.map((night) => (
                    <li key={night.date} className="flex justify-between gap-3">
                      <span>
                        {night.date}
                        {night.applied.length ? (
                          <span className="text-muted-foreground">
                            {" · "}
                            {ruleSummary(sp, night.applied)}
                          </span>
                        ) : null}
                      </span>
                      <span className="tabular-nums">{format(night.finalPrice)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {(quote?.discounts ?? []).map((discount) => (
              <div key={discount.id} className="flex items-center justify-between gap-3 text-primary">
                <span>
                  {discount.id === "longStay" ? x.longStayDiscount : discount.id === "mobile" ? x.mobileOffer : x.lastMinuteOffer} (−{discount.percent}%)
                </span>
                <span>−{format(discount.amount)}</span>
              </div>
            ))}
            {quote?.cleaningFee ? <Row label={lc.cleaningFeeLabel} value={format(quote.cleaningFee)} /> : null}
            <Row label={t.app.checkout.serviceFee} value={format(quote?.serviceFee ?? 0)} />
            <Row label={t.app.checkout.taxes} value={format(quote?.taxes ?? 0)} />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold">{t.app.checkout.total}</span>
            <span className="font-display text-xl font-bold">{format(quote?.total ?? 0)}</span>
          </div>

          {payConfig && stripeStage ? null : (
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!payConfig || createBooking.isPending || preparing || !quote || availability.data?.available === false}
            >
              {createBooking.isPending || preparing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <CreditCard className="size-4" aria-hidden />
              )}
              {preparing ? c.preparingPayment : createBooking.isPending ? c.processing : payConfig ? c.continueToPayment : c.payNow}
            </Button>
          )}

          <p className="text-center text-xs text-muted-foreground">{c.notChargedYet}</p>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden />
            {cancellationLabel(property.cancellationPolicy ?? "moderate", cc)}
          </p>
        </aside>
      </form>
    </AppShell>
  );
}

function Step({ index, label, state }: { index: number; label: string; state: "done" | "current" | "todo" }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={
          "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold " +
          (state === "todo" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")
        }
      >
        {state === "done" ? <CheckCircle2 className="size-3.5" aria-hidden /> : index}
      </span>
      <span className={state === "current" ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

