/**
 * Real card payment for a booking that already exists on the server.
 *
 * The checkout screen first creates the booking (payment pending), then asks
 * the backend for a Stripe PaymentIntent and hands the client secret here.
 * Stripe collects the card itself — no card data touches RoomEasy — and the
 * booking is flipped to paid/confirmed by the Stripe webhook.
 */
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Loader2, Lock } from "lucide-react";
import { useMemo, useState } from "react";

import paymentCards from "@/assets/payment-cards.png";
import { Button } from "@/components/ui/button";
import { useBookingCopy } from "@/i18n/booking";

const cache = new Map<string, Promise<Stripe | null>>();

function stripePromise(publishableKey: string) {
  const existing = cache.get(publishableKey);
  if (existing) return existing;
  const created = loadStripe(publishableKey);
  cache.set(publishableKey, created);
  return created;
}

type Defaults = { name?: string; email?: string; phone?: string; country?: string };

type Props = {
  publishableKey: string;
  clientSecret: string;
  returnUrl: string;
  totalLabel: string;
  /** Contact details of the signed-in guest, pre-filled in Stripe's form. */
  defaults?: Defaults;
};

export function StripeCardPayment({ publishableKey, clientSecret, returnUrl, totalLabel, defaults }: Props) {
  const promise = useMemo(() => stripePromise(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={promise}
      options={{
        clientSecret,
        appearance: { theme: "stripe", variables: { borderRadius: "12px" } },
      }}
    >
      <CardForm returnUrl={returnUrl} totalLabel={totalLabel} {...(defaults ? { defaults } : {})} />
    </Elements>
  );
}

function CardForm({ returnUrl, totalLabel, defaults }: { returnUrl: string; totalLabel: string; defaults?: Defaults }) {
  const stripe = useStripe();
  const elements = useElements();
  const c = useBookingCopy();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This block lives inside the checkout page's own <form>, so it must not be
  // a form itself (nested forms are invalid markup). The button drives it.
  const submit = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (result.error) {
      setError(result.error.message ?? c.stripeFailed);
      setBusy(false);
      return;
    }
    // No redirect was needed: land on the confirmation page ourselves.
    window.location.assign(returnUrl);
  };

  return (
    <div className="space-y-4">
      <img
        src={paymentCards}
        alt="Accepted credit and debit cards"
        loading="lazy"
        width={1152}
        height={576}
        className="h-7 w-auto opacity-90"
      />
      <PaymentElement
        options={{
          layout: "tabs",
          defaultValues: {
            billingDetails: {
              ...(defaults?.name ? { name: defaults.name } : {}),
              ...(defaults?.email ? { email: defaults.email } : {}),
              ...(defaults?.phone ? { phone: defaults.phone } : {}),
              ...(defaults?.country ? { address: { country: defaults.country } } : {}),
            },
          },
        }}
      />

      {error ? (
        <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="button" onClick={() => void submit()} size="lg" className="w-full" disabled={busy || !stripe}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
        {busy ? c.processing : `${c.payNow} · ${totalLabel}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{c.stripeSecured}</p>
    </div>
  );
}
