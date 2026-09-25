import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { brandLabel, shortDate } from "@/lib/cardFormat";
import type { Booking } from "@/models/booking";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useBookingCopy } from "@/i18n/booking";
import { useExtra } from "@/i18n/extra";
import { useListingCopy } from "@/i18n/listingCopy";

/** Printable, invoice-style receipt. Data comes from the booking service only. */
export function BookingReceipt({
  booking,
  propertyName,
  propertyLocation,
}: {
  booking: Booking;
  propertyName: string;
  propertyLocation?: string;
}) {
  const { t, locale } = useLanguage();
  // The receipt reports the real charge, so every line is in the charged
  // listing currency rather than the currency the visitor happens to browse in.
  const { formatCharged } = useCurrency();
  const format = (amount: number) => formatCharged(amount, booking.price.currency);
  const c = useBookingCopy();
  const x = useExtra();
  const lc = useListingCopy();

  // The receipt only claims "paid" when the server says the money settled and
  // the stay is still alive; otherwise it shows the real state.
  const refused = booking.status === "declined" || booking.status === "cancelled";
  const settled = booking.payment.status === "paid" && !refused;
  const cardKnown = booking.payment.last4 !== "" && booking.payment.last4 !== "0000";

  const discountLabel = (id: string) =>
    id === "longStay" ? x.longStayDiscount : id === "mobile" ? x.mobileOffer : x.lastMinuteOffer;

  return (
    <section
      data-print-area
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      aria-label={c.receipt}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <p className="font-display text-lg font-bold tracking-tight">RoomEasy</p>
          <p className="text-xs text-muted-foreground">{c.receipt}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>
            {c.receiptNo} <span className="font-mono text-foreground">{booking.reference}</span>
          </p>
          <p className="mt-1">
            {c.issued} {shortDate(booking.createdAt, locale)}
          </p>
          <span
            className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              settled
                ? "bg-emerald-500/10 text-emerald-700"
                : refused
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-700"
            }`}
          >
            {settled ? c.paid : t.app.status[booking.status]}
          </span>
        </div>
      </header>

      <div className="grid gap-6 border-b border-border px-6 py-5 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.billedTo}</p>
          <p className="mt-1.5 font-medium">{booking.guest.name}</p>
          <p className="text-muted-foreground">{booking.guest.email}</p>
          {booking.guest.phone ? <p className="text-muted-foreground">{booking.guest.phone}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.yourTrip}</p>
          <p className="mt-1.5 font-medium">{propertyName}</p>
          {propertyLocation ? <p className="text-muted-foreground">{propertyLocation}</p> : null}
          <p className="text-muted-foreground">
            {shortDate(booking.from, locale)} — {shortDate(booking.to, locale)} · {booking.nights}{" "}
            {t.app.trips.nights} · {booking.guests} {t.listings.guests}
          </p>
        </div>
      </div>

      <dl className="space-y-2.5 px-6 py-5 text-sm">
        <Line
          label={t.app.checkout.nightsLine
            .replace("{price}", format(booking.price.nightly))
            .replace("{nights}", String(booking.nights))}
          value={format(booking.price.baseSubtotal)}
        />
        {booking.price.discounts.map((discount) => (
          <Line
            key={discount.id}
            label={`${discountLabel(discount.id)} (−${discount.percent}%)`}
            value={`−${format(discount.amount)}`}
            tone="positive"
          />
        ))}
        {booking.price.cleaningFee ? <Line label={lc.cleaningFeeLabel} value={format(booking.price.cleaningFee)} /> : null}
        <Line label={t.app.checkout.serviceFee} value={format(booking.price.serviceFee)} />
        <Line label={t.app.checkout.taxes} value={format(booking.price.taxes)} />
        <div className="flex items-center justify-between border-t border-border pt-4">
          <dt className="font-semibold">{c.totalPaid}</dt>
          <dd className="font-display text-2xl font-bold">{format(booking.price.total)}</dd>
        </div>
        {cardKnown ? (
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <dt>{c.paymentMethod}</dt>
            <dd>
              {brandLabel(booking.payment.brand)} •••• {booking.payment.last4}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
        <p className="max-w-md text-[11px] leading-relaxed text-muted-foreground">{c.receiptFooter}</p>
        <div className="flex gap-2" data-print-hide>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            {c.print}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
            <Download className="size-4" aria-hidden />
            {c.download}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: "positive" }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className={tone === "positive" ? "text-primary" : "text-muted-foreground"}>{label}</dt>
      <dd className={tone === "positive" ? "text-primary" : "text-foreground"}>{value}</dd>
    </div>
  );
}
