import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarRange,
  Check,
  ChevronLeft,
  Inbox,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AccountShell } from "@/components/layout/AccountShell";
import { PayoutsOnboarding } from "@/components/host/PayoutsOnboarding";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { listingApi } from "@/api";
import { useClientCopy } from "@/i18n/clientCopy";
import { fill, useListingCopy } from "@/i18n/listingCopy";
import { cancellationLabel, refundShare } from "@/lib/cancellation";
import { Textarea } from "@/components/ui/textarea";
import { type Booking, type HostListing, type ListingStatus } from "@/data/platform";
import type { ListingStatusResult } from "@/api/listingApi.types";
import { useAllProperties } from "@/hooks/useAllProperties";
import { backendEnabled, remote, serverOffline, toTeamMember } from "@/api/backend";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useExtra } from "@/i18n/extra";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { toISODate } from "@/lib/pricing";

export const Route = createFileRoute("/host")({
  validateSearch: (search: Record<string, unknown>) => ({
    section: typeof search["section"] === "string" && ["overview", "requests", "listings", "calendar", "stats", "payouts", "reviews", "team"].includes(search["section"])
      ? search["section"] as "overview" | "requests" | "listings" | "calendar" | "stats" | "payouts" | "reviews" | "team"
      : "overview" as const,
    // Stripe sends the host back here after the hosted onboarding.
    ...(search["stripe"] === "done" || search["stripe"] === "refresh"
      ? { stripe: search["stripe"] as "done" | "refresh" }
      : {}),
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Host dashboard — RoomEasy" },
      { name: "description", content: "Manage RoomEasy listings, availability, rates, booking requests and payouts in one dashboard." },
      { property: "og:title", content: "Host dashboard — RoomEasy" },
      { property: "og:description", content: "Manage listings, availability, rates, requests and payouts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HostPage,
});

function HostPage() {
  const { t } = useLanguage();
  const x = useExtra();
  const cc = useClientCopy();
  const { format } = useCurrency();
  const properties = useAllProperties();
  const { bookings: allBookings, listings, payouts, reviews, team, rateRules } = usePlatform();
  const { section, stripe: stripeReturn } = Route.useSearch();

  // The dashboard only ever shows reservations made on this host's own listings —
  // never the stays this same account booked elsewhere as a traveller.
  const ownPropertyIds = new Set(listings.map((l) => l.propertyId));
  const bookings = allBookings.filter((b) => ownPropertyIds.has(b.propertyId));

  const revenue = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").reduce((sum, b) => sum + b.totalUsd, 0);
  const requests = bookings.filter((b) => b.status === "pending");
  const decided = bookings.filter((b) => b.status !== "pending");
  const confirmationRate = decided.length
    ? Math.round((decided.filter((b) => b.status === "confirmed" || b.status === "completed").length / decided.length) * 100)
    : 0;
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  // The chart counts the host's real reservations per month.
  const monthlyBookings = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (11 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      month: date.toLocaleDateString(undefined, { month: "short" }),
      value: bookings.filter((b) => b.from.slice(0, 7) === key).length,
    };
  });
  const maxMonth = Math.max(...monthlyBookings.map((m) => m.value), 1);

  /** Applies the new status at once, then puts the old one back if the server refused. */
  function patchStatus(bookingId: string, status: Booking["status"]) {
    setPlatform((state) => ({
      bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
    }));
  }

  async function decide(booking: Booking, decision: "confirmed" | "declined") {
    const previous = booking.status;
    patchStatus(booking.id, decision);
    const saved = await remote.decideBooking(booking.id, decision);
    if (!saved) {
      patchStatus(booking.id, previous);
      return;
    }
    if (decision === "confirmed") toast.success(t.app.host.accepted);
    else toast(t.app.host.declinedToast);
  }

  async function cancel(booking: Booking) {
    const previous = booking.status;
    patchStatus(booking.id, "cancelled");
    const saved = await remote.cancelBooking(booking.id);
    if (!saved) {
      patchStatus(booking.id, previous);
      return;
    }
    toast.success(cc.bookingCancelled);
  }


  return (
    <AccountShell
      title={t.app.host.title}
      subtitle={t.app.host.subtitle}
      actions={
          <Button asChild className="rounded-lg shadow-none">
          <Link to="/list-your-place">
            <Plus className="size-4" aria-hidden />
            {t.app.host.newListing}
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Wallet} label={t.app.host.revenue} value={format(revenue)} />
        <Stat icon={CalendarRange} label={t.app.host.requests} value={String(requests.length)} />
        <Stat icon={TrendingUp} label={t.app.host.confirmationRate} value={`${confirmationRate}%`} />
        <Stat icon={BadgeCheck} label={t.app.host.avgRating} value={avgRating.toFixed(1)} />
      </div>

      <div className="mt-10">
        {section === "requests" ? <section className="space-y-5">
          <h2 className="font-display text-xl font-bold">{t.app.host.requests}</h2>
          {requests.length === 0 ? <EmptyState icon={Inbox} title={t.app.host.noRequests} size="compact" /> : null}
          {requests.map((booking) => {
            const property = properties.find((p) => p.id === booking.propertyId);
            return (
              <Panel key={booking.id}>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{property?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.guestName} · {booking.from} → {booking.to} · {format(booking.totalUsd)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        void decide(booking, "confirmed");
                      }}
                    >
                      <Check className="size-4" aria-hidden />{t.app.host.accept}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void decide(booking, "declined");
                      }}
                    >
                      <X className="size-4" aria-hidden />{t.app.host.decline}
                    </Button>
                  </div>
                </div>
              </Panel>
            );
          })}

          {bookings
            .filter((booking) => booking.status === "confirmed")
            .map((booking) => {
              const property = properties.find((p) => p.id === booking.propertyId);
              const policy = property?.cancellationPolicy ?? "moderate";
              const days = Math.ceil((new Date(booking.from).getTime() - Date.now()) / 86_400_000);
              const refund = Math.round(booking.totalUsd * refundShare(policy, days));
              return (
                <Panel key={booking.id}>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{property?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.guestName} · {booking.from} → {booking.to} · {format(booking.totalUsd)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {cancellationLabel(policy, cc)} · {cc.refundDue}: {format(refund)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => {
                        void cancel(booking);
                      }}
                    >
                      <X className="size-4" aria-hidden />{cc.cancelBooking}
                    </Button>
                  </div>
                </Panel>
              );
            })}
        </section> : null}

        {section === "listings" ? <section className="space-y-5">
          <h2 className="font-display text-xl font-bold">{t.app.host.listings}</h2>
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </section> : null}

        {section === "calendar" ? <section className="grid gap-5 lg:grid-cols-2">
          <CalendarPanel />
          <Panel>
            <h2 className="font-display text-lg font-bold">{t.app.host.rateRules}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <RateField id="weekend" label={t.app.host.weekend} value={rateRules.weekend} onChange={(v) => setPlatform({ rateRules: { ...rateRules, weekend: v } })} />
              <RateField id="longstay" label={t.app.host.longStay} value={rateRules.longStay} onChange={(v) => setPlatform({ rateRules: { ...rateRules, longStay: v } })} />
              <RateField id="lastminute" label={t.app.host.lastMinute} value={rateRules.lastMinute} onChange={(v) => setPlatform({ rateRules: { ...rateRules, lastMinute: v } })} />
            </div>
            <Button className="mt-5" onClick={() => { void remote.saveRateRules({ weekend: rateRules.weekend, longStay: rateRules.longStay, lastMinute: rateRules.lastMinute }); toast.success(t.app.host.ruleSaved); }}>{t.app.common.save}</Button>
          </Panel>
        </section> : null}

        {section === "stats" ? <section className="grid gap-5 lg:grid-cols-2">
          <Panel className="lg:col-span-2">
            <h2 className="font-display text-lg font-bold">{x.bookingsPerMonth}</h2>
            <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3">
              {monthlyBookings.map((month) => (
                <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground">{month.value}</span>
                  <div className="w-full rounded-t-lg bg-lime" style={{ height: `${(month.value / maxMonth) * 100}%` }} />
                  <span className="text-[10px] font-semibold text-muted-foreground">{month.month}</span>
                </div>
              ))}
            </div>
          </Panel>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <Stat icon={TrendingUp} label={t.app.host.confirmationRate} value={`${confirmationRate}%`} />
            <Stat icon={Wallet} label={t.app.host.revenue} value={format(revenue)} />
          </div>
        </section> : null}

        {section === "payouts" ? <section className="space-y-5">
          <Panel>
            <PayoutsOnboarding returned={stripeReturn === "done"} />
          </Panel>
          {payouts.map((payout) => (
            <Panel key={payout.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{format(payout.amountUsd)}</p>
                  <p className="text-xs text-muted-foreground">{t.app.host.nextPayout}: {payout.date}</p>
                </div>
                <Badge className={cn("border-0", payout.status === "paid" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700")}>
                  {payout.status === "paid" ? t.app.admin.paid : t.app.admin.scheduled}
                </Badge>
              </div>
            </Panel>
          ))}
        </section> : null}

        {section === "reviews" ? <section className="space-y-5">
          {reviews.map((review) => (
            <Panel key={review.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{review.author}</p>
                <span className="text-sm font-semibold">★ {review.rating.toFixed(1)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
              {review.reply ? (
                <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
                  <span className="font-semibold">{x.hostReply}: </span>
                  {review.reply}
                </p>
              ) : (
                <ReplyBox reviewId={review.id} />
              )}
            </Panel>
          ))}
        </section> : null}

        {section === "team" ? <section className="space-y-5">
          {team.map((member) => (
            <Panel key={member.id}>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {member.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary">{scope === "calendar" ? x.scopeCalendar : x.scopeMessaging}</Badge>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      // Wait for the server: a failed removal must stay visible.
                      const removed = await remote.removeTeamMember(member.id);
                      if (!removed) return;
                      setPlatform((state) => ({ team: state.team.filter((m) => m.id !== member.id) }));
                      toast.success(x.memberRemoved);
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />{x.removeMember}
                  </Button>
                </div>
              </div>
            </Panel>
          ))}
          <InviteForm />
        </section> : null}
      </div>
    </AccountShell>
  );
}

function ListingRow({ listing }: { listing: HostListing }) {
  const { t } = useLanguage();
  const x = useExtra();
  const cc = useClientCopy();
  const lc = useListingCopy();
  const { format } = useCurrency();
  const properties = useAllProperties();
  const property = properties.find((p) => p.id === listing.propertyId);

  if (!property) return null;

  // Both actions wait for the server: nothing is announced, and nothing
  // disappears from the list, until the server actually accepted it.
  async function remove() {
    try {
      await listingApi.deleteListing(listing.id);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : x.listingDeleted);
      return;
    }
    setPlatform((state) => ({ listings: state.listings.filter((row) => row.id !== listing.id) }));
    toast.success(x.listingDeleted);
  }

  async function changeStatus(published: boolean) {
    const next: ListingStatus = published ? "published" : "draft";
    let result: ListingStatusResult;
    try {
      result = await listingApi.setStatus(listing.id, next);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t.app.host.statusChanged,
      );
      return;
    }
    setPlatform((state) => ({
      listings: state.listings.map((row) => (row.id === listing.id ? { ...row, status: result.status } : row)),
    }));
    // The server tells the host when an administrator still has to approve.
    if (result.message) toast.info(result.message);
    else toast.success(t.app.host.statusChanged);
  }

  const facts = [
    `${property.guests} ${lc.guests}`,
    `${property.rooms ?? property.beds} ${lc.rooms}`,
    `${property.baths} ${lc.baths}`,
    `${property.area} m²`,
    fill(lc.minNightsValue, { n: property.minNights ?? 1 }),
    `${lc.checkIn} ${property.checkIn ?? "15:00"}`,
    cancellationLabel(property.cancellationPolicy ?? "moderate", cc),
    fill(lc.equipmentCount, { n: property.equipment?.length ?? 0 }),
  ];

  return (
    <Panel>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <img src={property.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{property.name}</p>
            <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
              {t.app.host.nightlyRate} · <span className="tabular-nums">{format(listing.nightlyUsd)}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge
            className={cn(
              "border-0 rounded-full text-[0.65rem] font-semibold tracking-[0.14em] uppercase",
              listing.status === "published"
                ? "bg-emerald-500/15 text-emerald-700"
                : listing.status === "draft"
                  ? "bg-muted text-muted-foreground"
                  : "bg-destructive/10 text-destructive",
            )}
          >
            {t.app.host[listing.status]}
          </Badge>
          <Switch
            checked={listing.status === "published"}
            aria-label={listing.status === "published" ? t.app.host.unpublish : t.app.host.publish}
            onCheckedChange={(checked) => void changeStatus(checked)}
          />
          <Button size="sm" variant="outline" asChild>
            <Link to="/list-your-place" search={{ edit: listing.propertyId }}>
              <Pencil className="size-4" aria-hidden />
              {x.editListing}
            </Link>
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void remove()} aria-label={x.deleteListing}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
        {facts.map((fact) => (
          <li key={fact} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            {fact}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function CalendarPanel() {
  const x = useExtra();
  const { locale } = useLanguage();
  const { currency, format, convertFromUsd, convertToUsd } = useCurrency();
  const { listings, calendar } = usePlatform();
  const properties = useAllProperties();
  const [listingId, setListingId] = useState(listings[0]?.propertyId ?? "");
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");

  const propertyId = listingId;
  const listing = listings.find((l) => l.propertyId === propertyId);
  const basePrice = listing?.nightlyUsd ?? properties.find((p) => p.id === propertyId)?.price ?? 0;
  const nights = calendar[propertyId] ?? {};

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: total }, (_, i) => toISODate(new Date(month.getFullYear(), month.getMonth(), i + 1))),
    ];
  }, [month]);

  function patchNight(date: string, patch: { blocked?: boolean; price?: number } | null) {
    setPlatform((state) => {
      const forProperty = { ...(state.calendar[propertyId] ?? {}) };
      if (patch === null) delete forProperty[date];
      else forProperty[date] = { ...forProperty[date], ...patch };
      return { calendar: { ...state.calendar, [propertyId]: forProperty } };
    });
    if (listing) {
      if (patch === null) void remote.clearCalendarNight(listing.id, date);
      else
        void remote.saveCalendarNight(listing.id, date, {
          ...(patch.blocked === undefined ? {} : { blocked: patch.blocked }),
          ...(patch.price === undefined ? {} : { priceUsd: patch.price }),
        });
    }
  }

  const selectedState = selected ? nights[selected] : undefined;

  return (
    <Panel>
      <h2 className="font-display text-lg font-bold">{x.calendarTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{x.calendarHint}</p>

      <div className="mt-4 space-y-2">
        <Label htmlFor="cal-listing" className="text-xs">{x.chooseListing}</Label>
        <select
          id="cal-listing"
          value={listingId}
          onChange={(event) => { setListingId(event.target.value); setSelected(null); }}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.propertyId}>{properties.find((p) => p.id === l.propertyId)?.name ?? l.propertyId}</option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button size="icon" variant="outline" aria-label={x.previousMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <p className="font-semibold capitalize">{month.toLocaleDateString(locale, { month: "long", year: "numeric" })}</p>
        <Button size="icon" variant="outline" aria-label={x.nextMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const state = nights[day] ?? {};
          const dayNumber = Number(day.slice(8, 10));
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected === day}
              onClick={() => { setSelected(day); setPriceDraft(String(Math.round(convertFromUsd(state.price ?? basePrice)))); }}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors",
                state.blocked
                  ? "border-destructive/40 bg-destructive/10 text-destructive line-through"
                  : state.price
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border hover:bg-secondary",
                selected === day && "ring-2 ring-primary ring-offset-1",
              )}
            >
              {dayNumber}
              {state.price && !state.blocked ? <span className="text-[9px] font-medium">{format(state.price)}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-destructive/40 bg-destructive/10" />{x.blockedLegend}</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-primary/40 bg-primary/10" />{x.pricedLegend}</span>
      </div>

      {selected ? (
        <div className="mt-5 space-y-4 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">{x.selectedNight}: {selected}</p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
               <Label htmlFor="night-price" className="text-xs">{x.customPrice} ({currency})</Label>
              <Input id="night-price" type="number" min={0} value={priceDraft} onChange={(event) => setPriceDraft(event.target.value)} className="h-11" />
            </div>
             <Button onClick={() => { patchNight(selected, { price: convertToUsd(Number(priceDraft)) || basePrice }); toast.success(x.changesSaved); }}>
              {x.applyPrice}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedState?.blocked ? "outline" : "secondary"}
              onClick={() => patchNight(selected, { blocked: !selectedState?.blocked })}
            >
              {selectedState?.blocked ? x.unblockNight : x.blockNight}
            </Button>
            <Button variant="ghost" onClick={() => patchNight(selected, null)}>{x.clearNight}</Button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function InviteForm() {
  const x = useExtra();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [scopes, setScopes] = useState<("calendar" | "messaging")[]>(["messaging"]);

  function toggleScope(scope: "calendar" | "messaging") {
    setScopes((current) => (current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope]));
  }

  return (
    <Panel>
      <h2 className="font-display text-lg font-bold">{x.inviteTitle}</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const picked = scopes.length ? scopes : (["messaging"] as ("calendar" | "messaging")[]);
          // Keep the identifier the server issued, otherwise removing this
          // person later would not match any record.
          const saved = await remote.addTeamMember({ fullName: name.trim(), email: email.trim(), scopes: picked });
          if (backendEnabled && !serverOffline() && !saved) return;
          const member = saved
            ? toTeamMember(saved)
            : { id: `tm-${Date.now()}`, name: name.trim(), email: email.trim(), scopes: picked };
          setPlatform((state) => ({
            team: [...state.team.filter((row) => row.id !== member.id), member],
          }));
          setName("");
          setEmail("");
          setScopes(["messaging"]);
          toast.success(x.sendInvite);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="tm-name" label={x.memberName} value={name} onChange={setName} required />
          <Field id="tm-email" label={x.memberEmail} type="email" value={email} onChange={setEmail} required />
        </div>
        <div className="flex flex-wrap gap-4">
          {(["calendar", "messaging"] as const).map((scope) => (
            <label key={scope} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} className="size-4 accent-primary" />
              {scope === "calendar" ? x.scopeCalendar : x.scopeMessaging}
            </label>
          ))}
        </div>
        <Button type="submit" variant="outline">
          <Plus className="size-4" aria-hidden />{x.sendInvite}
        </Button>
      </form>
    </Panel>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-11" />
    </div>
  );
}

function ReplyBox({ reviewId }: { reviewId: string }) {
  const { t } = useLanguage();
  const x = useExtra();
  const [value, setValue] = useState("");
  return (
    <div className="mt-3 space-y-2">
      <Label htmlFor={`reply-${reviewId}`} className="text-xs">{t.app.messages.placeholder}</Label>
      <Textarea id={`reply-${reviewId}`} value={value} onChange={(event) => setValue(event.target.value)} rows={2} />
      <Button
        size="sm"
        variant="outline"
        disabled={!value.trim()}
        onClick={() => {
          setPlatform((state) => ({ reviews: state.reviews.map((r) => (r.id === reviewId ? { ...r, reply: value.trim() } : r)) }));
          void remote.replyToReview(reviewId, value.trim());
          setValue("");
          toast.success(x.replySent);
        }}
      >
        {t.app.messages.send}
      </Button>
    </div>
  );
}

function RateField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label} (%)</Label>
      <Input id={id} type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-11" />
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6", className)}>{children}</section>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <span className="grid size-8 place-items-center rounded-md bg-primary/8 text-primary"><Icon className="size-4" aria-hidden /></span>
      </div>
      <p className="mt-3 truncate font-display text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
