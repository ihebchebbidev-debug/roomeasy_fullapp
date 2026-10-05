import { privateRouteMeta } from "@/i18n/privateRouteMeta";
import { shortDate } from "@/lib/cardFormat";
import { countLabel } from "@/i18n/countLabel";
import { localeOf, privatePageMeta } from "@/lib/seo";
import { Paged, rowText } from "@/components/admin/ListControls";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DeleteIconButton, EditIconButton } from "@/components/ui/action-buttons";
import {
  BadgeCheck,
  CalendarRange,
  Building2,
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
import { HostOverview } from "@/components/host/overview/HostOverview";
import { SmartPricingPanel } from "@/components/host/SmartPricingPanel";
import { Badge } from "@/components/ui/badge";
import { DataState, EmptyState } from "@/components/ui/empty-state";
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
    // "statistics" is the spelled-out name people type or share for the stats tab.
    section: search["section"] === "statistics" ? "stats" as const : typeof search["section"] === "string" && ["overview", "requests", "listings", "calendar", "stats", "payouts", "reviews", "team"].includes(search["section"])
      ? search["section"] as "overview" | "requests" | "listings" | "calendar" | "stats" | "payouts" | "reviews" | "team"
      : "overview" as const,
    // Stripe sends the host back here after the hosted onboarding.
    ...(search["stripe"] === "done" || search["stripe"] === "refresh"
      ? { stripe: search["stripe"] as "done" | "refresh" }
      : {}),
  }),
  head: ({ match }) => ({
    meta: privatePageMeta(...Object.values(privateRouteMeta["host"][localeOf(match) ?? "en"]) as [string, string]),
  }),
  component: HostPage,
});

function HostPage() {
  const { t, locale } = useLanguage();
  const x = useExtra();
  const cc = useClientCopy();
  const { format } = useCurrency();
  const properties = useAllProperties();
  const { bookings: allBookings, listings, payouts, reviews, threads, team, rateRules, hostDashboard, accountDataStatus, stripeOnboarded } = usePlatform();
  const { session } = usePlatform();
  const { section, stripe: stripeReturn } = Route.useSearch();

  // The dashboard only ever shows reservations made on this host's own listings —
  // never the stays this same account booked elsewhere as a traveller.
  const ownPropertyIds = new Set(listings.map((l) => l.propertyId));
  const bookings = allBookings.filter((b) => ownPropertyIds.has(b.propertyId));

  const revenue = hostDashboard?.earnings.grossUsd ?? bookings.filter((b) => b.status === "confirmed" || b.status === "completed").reduce((sum, b) => sum + b.totalUsd, 0);
  const requests = bookings.filter((b) => b.status === "pending");
  const decided = bookings.filter((b) => b.status !== "pending");
  const confirmationRate = decided.length
    ? Math.round((decided.filter((b) => b.status === "confirmed" || b.status === "completed").length / decided.length) * 100)
    : 0;
  const avgRating = hostDashboard?.reviews.averageRating ?? (reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0);
  const isReady = accountDataStatus === "ready";
  const metric = (value: string) => isReady ? value : "—";
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

  if (accountDataStatus === "ready" && (!session || (session.role !== "host" && session.role !== "admin"))) {
    return (
      <AccountShell title={t.app.host.title} subtitle={t.app.host.subtitle}>
        <EmptyState
          title={session ? t.app.host.noListings : t.auth.login}
          action={<Button asChild><Link to={session ? "/list-your-place" : "/auth"}>{session ? t.app.host.newListing : t.auth.login}</Link></Button>}
        />
      </AccountShell>
    );
  }

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
      {section !== "overview" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Wallet} label={t.app.host.revenue} value={metric(format(revenue))} />
        <Stat icon={CalendarRange} label={t.app.host.requests} value={metric(String(hostDashboard?.bookings.pending ?? requests.length))} />
        <Stat icon={TrendingUp} label={t.app.host.occupancy} value={metric(`${hostDashboard?.occupancy.ratePercent ?? 0}%`)} />
        <Stat icon={BadgeCheck} label={t.app.host.avgRating} value={metric(avgRating > 0 ? avgRating.toFixed(1) : (({ en: "New", fr: "Nouveau", es: "Nuevo", de: "Neu", pt: "Novo" } as Record<string, string>)[locale] ?? "New"))} />
      </div> : null}

      <div className="mt-10">
        {!isReady ? <DataState status={accountDataStatus} loading={t.app.common.loading} error={t.app.common.loadError} retry={t.app.common.retry} /> : null}

        {isReady && section === "overview" ? <HostOverview bookings={bookings} listings={listings} properties={properties} payouts={payouts} reviews={reviews} threads={threads} session={session} stripeOnboarded={stripeOnboarded} onDecide={(booking, decision) => { void decide(booking, decision); }} /> : null}

        {isReady && section === "requests" ? <section className="space-y-5">
          <h2 className="font-display text-xl font-bold">{t.app.host.requests}</h2>
          {requests.length === 0 ? <EmptyState icon={Inbox} title={t.app.host.noRequests} size="compact" /> : null}
          <Paged rows={bookings} filters={[{ value: "pending", label: t.app.status.pending, test: (b) => b.status === "pending" }, { value: "confirmed", label: t.app.status.confirmed, test: (b) => b.status === "confirmed" }, { value: "cancelled", label: t.app.status.cancelled, test: (b) => String(b.status).includes("cancel") || b.status === "declined" }]} text={(x) => `${rowText(x)} ${properties.find((p) => p.id === x.propertyId)?.name ?? ""}`}>{(__rows) => __rows.map((booking) => {
            const property = properties.find((p) => p.id === booking.propertyId);
            return (
              <Panel key={booking.id}>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{property?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.guestName} · {shortDate(booking.from, locale)} → {shortDate(booking.to, locale)} · {format(booking.totalUsd, { from: booking.currency })}
                    </p>
                    {booking.message ? (
                      <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-line break-words">“{booking.message}”</p>
                    ) : null}
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
          })}</Paged>

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
                        {booking.guestName} · {shortDate(booking.from, locale)} → {shortDate(booking.to, locale)} · {format(booking.totalUsd, { from: booking.currency })}
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

        {isReady && section === "listings" ? <section className="space-y-5">
          <h2 className="font-display text-xl font-bold">{t.app.host.listings}</h2>
          {listings.length === 0 ? <EmptyState icon={Building2} title={t.app.host.noListings} description={t.app.host.noListingsHint} action={<Button asChild><Link to="/list-your-place"><Plus className="size-4" aria-hidden />{t.app.host.newListing}</Link></Button>} /> : null}
          <Paged
            rows={listings}
            text={(x) => `${rowText(x)} ${properties.find((p) => p.id === (x as { propertyId?: string }).propertyId)?.name ?? ""}`}
            suggest={(l) => {
              const p = properties.find((pp) => pp.id === l.propertyId) as { name?: string; location?: { city?: string } } | undefined;
              return [p?.name ?? "", p?.location?.city ?? ""];
            }}
          >{(__rows) => __rows.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}</Paged>
        </section> : null}

        {isReady && section === "calendar" ? (listings.length === 0 ? (
          <EmptyState icon={CalendarRange} title={t.app.host.noCalendar} action={<Button asChild><Link to="/list-your-place">{t.app.host.newListing}</Link></Button>} />
        ) : (<section className="grid gap-5 lg:grid-cols-2">
          <CalendarPanel />
          <Panel>
            <h2 className="font-display text-lg font-bold">{t.app.host.rateRules}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <RateField id="longstay" label={t.app.host.longStay} value={rateRules.longStay} onChange={(v) => setPlatform({ rateRules: { ...rateRules, longStay: v } })} />
              <RateField id="lastminute" label={t.app.host.lastMinute} value={rateRules.lastMinute} onChange={(v) => setPlatform({ rateRules: { ...rateRules, lastMinute: v } })} />
            </div>
            <Button className="mt-5" onClick={() => { void remote.saveRateRules({ weekend: rateRules.weekend, longStay: rateRules.longStay, lastMinute: rateRules.lastMinute }); toast.success(t.app.host.ruleSaved); }}>{t.app.common.save}</Button>
          </Panel>
          <SmartPricingPanel listings={listings.map((l) => ({ propertyId: l.propertyId, currency: l.currency, name: properties.find((p) => p.id === l.propertyId)?.name ?? l.propertyId }))} />
        </section>)) : null}

        {isReady && section === "stats" ? (listings.length === 0 ? (
          <EmptyState icon={TrendingUp} title={t.app.host.noStats} />
        ) : (<section className="grid gap-5 lg:grid-cols-2">
          {bookings.length === 0 ? <p className="lg:col-span-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{t.app.host.noStats}</p> : null}
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
        </section>)) : null}

        {isReady && section === "payouts" ? <section className="space-y-5">
          <Panel>
            <PayoutsOnboarding returned={stripeReturn === "done"} />
          </Panel>
          {payouts.length === 0 ? <EmptyState icon={Wallet} title={t.app.host.noPayouts} size="compact" /> : null}
          <Paged rows={payouts} text={rowText}>{(__rows) => __rows.map((payout) => (
            <Panel key={payout.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{format(payout.amountUsd, { from: payout.currency })}</p>
                  <p className="text-xs text-muted-foreground">{t.app.host.nextPayout}: {payout.date}</p>
                </div>
                <Badge className={cn("border-0", payout.status === "paid" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700")}>
                  {payout.status === "paid" ? t.app.admin.paid : t.app.admin.scheduled}
                </Badge>
              </div>
            </Panel>
          ))}</Paged>
        </section> : null}

        {isReady && section === "reviews" ? <section className="space-y-5">
          <h2 className="font-display text-xl font-bold">{t.app.host.reviews}</h2>
          {reviews.length === 0 ? <EmptyState icon={BadgeCheck} title={t.app.host.noReviews} /> : null}
          <Paged rows={reviews} text={(x) => `${rowText(x)} ${properties.find((p) => p.id === (x as { propertyId?: string }).propertyId)?.name ?? ""}`}>{(__rows) => __rows.map((review) => (
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
          ))}</Paged>
        </section> : null}

        {isReady && section === "team" ? <section className="space-y-5">
          <h2 className="font-display text-xl font-bold">{t.app.host.team}</h2>
          {team.length === 0 ? <EmptyState icon={Inbox} title={t.app.host.noTeam} size="compact" /> : null}
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
                  <DeleteIconButton
                    label={x.removeMember}
                    onConfirm={async () => {
                      // Wait for the server: a failed removal must stay visible.
                      const removed = await remote.removeTeamMember(member.id);
                      if (!removed) return;
                      setPlatform((state) => ({ team: state.team.filter((m) => m.id !== member.id) }));
                      toast.success(x.memberRemoved);
                    }}
                  />
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
  const { t, locale } = useLanguage();
  const x = useExtra();
  const cc = useClientCopy();
  const lc = useListingCopy();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const properties = useAllProperties();
  const property = properties.find((p) => p.id === listing.propertyId);

  if (!property) {
    return <Panel><p className="font-semibold">{listing.propertyId}</p><p className="mt-1 text-sm text-muted-foreground">{t.app.common.loading}</p></Panel>;
  }

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
    countLabel(property.guests, lc.guests),
    countLabel(property.rooms ?? property.beds, lc.rooms),
    countLabel(property.baths, lc.baths),
    `${property.area} m²`,
    fill(lc.minNightsValue, { n: property.minNights ?? 1 }),
    `${lc.checkIn} ${property.checkIn ?? "15:00"}`,
    cancellationLabel(property.cancellationPolicy ?? "moderate", cc),
    fill(lc.equipmentCount, { n: new Set([...(property.equipment ?? []), ...((property.amenities ?? []) as string[])]).size }),
  ];

  return (
    <Panel>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <img src={property.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{property.name}</p>
            <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
              {t.app.host.nightlyRate} · <span className="tabular-nums">{format(listing.nightlyUsd, { from: listing.currency })}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge
            className={cn(
              "border-0 rounded-full text-[0.65rem] font-semibold tracking-[0.14em] uppercase",
              listing.status === "published" && !listing.approved
                ? "bg-amber-500/15 text-amber-700"
                : listing.status === "published"
                ? "bg-emerald-500/15 text-emerald-700"
                : listing.status === "draft"
                  ? "bg-muted text-muted-foreground"
                  : "bg-destructive/10 text-destructive",
            )}
          >
            {listing.status === "published" && !listing.approved
              ? (AWAITING_REVIEW[locale as keyof typeof AWAITING_REVIEW] ?? AWAITING_REVIEW.en)
              : t.app.host[listing.status]}
          </Badge>
          <Switch
            checked={listing.status === "published"}
            aria-label={listing.status === "published" ? t.app.host.unpublish : t.app.host.publish}
            onCheckedChange={(checked) => void changeStatus(checked)}
          />
          <EditIconButton
            label={x.editListing}
            itemName={property.name}
            onConfirm={() => navigate({ to: "/list-your-place", search: { edit: listing.propertyId } })}
          />
          <DeleteIconButton itemName={property.name} onConfirm={() => remove()} />
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
  const { format: formatDisplay } = useCurrency();
  const { listings, calendar } = usePlatform();
  const properties = useAllProperties();
  const [listingId, setListingId] = useState(listings[0]?.propertyId ?? "");
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [allListings, setAllListings] = useState(false);
  const mc = {
    en: { selected: "Selected nights", hint: "Tap several days, or hold Shift to select a range.", clearSel: "Clear selection", all: "Apply to all my listings", selectMonth: "Select whole month" },
    fr: { selected: "Nuits sélectionnées", hint: "Touchez plusieurs jours, ou maintenez Maj pour une plage.", clearSel: "Effacer la sélection", all: "Appliquer à toutes mes annonces", selectMonth: "Sélectionner tout le mois" },
    es: { selected: "Noches seleccionadas", hint: "Toca varios días o mantén Mayús para un rango.", clearSel: "Borrar selección", all: "Aplicar a todos mis anuncios", selectMonth: "Seleccionar todo el mes" },
    de: { selected: "Ausgewählte Nächte", hint: "Mehrere Tage antippen oder Umschalt für einen Bereich.", clearSel: "Auswahl löschen", all: "Auf alle meine Anzeigen anwenden", selectMonth: "Ganzen Monat wählen" },
    pt: { selected: "Noites selecionadas", hint: "Toque em vários dias ou mantenha Shift para um intervalo.", clearSel: "Limpar seleção", all: "Aplicar a todos os meus anúncios", selectMonth: "Selecionar o mês inteiro" },
  }[locale] ?? { selected: "Selected nights", hint: "", clearSel: "Clear selection", all: "Apply to all my listings", selectMonth: "Select whole month" };

  const propertyId = listingId;
  const listing = listings.find((l) => l.propertyId === propertyId);
  const basePrice = listing?.nightlyUsd ?? properties.find((p) => p.id === propertyId)?.price ?? 0;
  // Calendar prices are in the listing's own currency.
  const listingCurrency = listing?.currency ?? properties.find((p) => p.id === propertyId)?.currency ?? "EUR";
  const format = (amount: number) => formatDisplay(amount, { from: listingCurrency });
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

  function patchNights(dates: string[], patch: { blocked?: boolean; price?: number } | null) {
    const targets = allListings ? listings : listing ? [listing] : [];
    setPlatform((state) => {
      const next = { ...state.calendar };
      for (const l of targets) {
        const forProperty = { ...(next[l.propertyId] ?? {}) };
        for (const date of dates) {
          if (patch === null) delete forProperty[date];
          else forProperty[date] = { ...forProperty[date], ...patch };
        }
        next[l.propertyId] = forProperty;
      }
      return { calendar: next };
    });
    for (const l of targets) {
      for (const date of dates) {
        if (patch === null) void remote.clearCalendarNight(l.id, date);
        else
          void remote.saveCalendarNight(l.id, date, {
            ...(patch.blocked === undefined ? {} : { blocked: patch.blocked }),
            ...(patch.price === undefined ? {} : { priceUsd: patch.price }),
          });
      }
    }
  }

  function toggleDay(day: string, shift: boolean) {
    if (shift && anchor) {
      const [a, b] = anchor < day ? [anchor, day] : [day, anchor];
      const range = days.filter((d): d is string => !!d && d >= a && d <= b);
      setSelected((s) => Array.from(new Set([...s, ...range])).sort());
    } else {
      setSelected((s) => (s.includes(day) ? s.filter((d) => d !== day) : [...s, day].sort()));
      setAnchor(day);
    }
    if (selected.length === 0) setPriceDraft(String(Math.round(nights[day]?.price ?? basePrice)));
  }

  const allBlocked = selected.length > 0 && selected.every((d) => nights[d]?.blocked);

  return (
    <Panel>
      <h2 className="font-display text-lg font-bold">{x.calendarTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{x.calendarHint} {mc.hint}</p>

      <div className="mt-4 space-y-2">
        <Label htmlFor="cal-listing" className="text-xs">{x.chooseListing}</Label>
        <select
          id="cal-listing"
          value={listingId}
          onChange={(event) => { setListingId(event.target.value); setSelected([]); }}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.propertyId}>{properties.find((p) => p.id === l.propertyId)?.name ?? l.propertyId}</option>
          ))}
        </select>
        {listings.length > 1 ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allListings} onChange={(e) => setAllListings(e.target.checked)} className="size-4 accent-primary" />
            {mc.all} ({listings.length})
          </label>
        ) : null}
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
      <div className="mt-2 flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => setSelected((s) => Array.from(new Set([...s, ...days.filter((d): d is string => !!d)])).sort())}>
          {mc.selectMonth}
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const state = nights[day] ?? {};
          const dayNumber = Number(day.slice(8, 10));
          const isSel = selected.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isSel}
              onClick={(e) => toggleDay(day, e.shiftKey)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors",
                state.blocked
                  ? "border-destructive/40 bg-destructive/10 text-destructive line-through"
                  : state.price
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border hover:bg-secondary",
                isSel && "ring-2 ring-primary ring-offset-1",
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

      {selected.length > 0 ? (
        <div className="mt-5 space-y-4 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {mc.selected}: {selected.length}{" "}
              <span className="font-normal text-muted-foreground">
                ({selected.length === 1 ? selected[0] : `${selected[0]} → ${selected[selected.length - 1]}`})
              </span>
            </p>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>{mc.clearSel}</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
               <Label htmlFor="night-price" className="text-xs">{x.customPrice} ({listingCurrency})</Label>
              <Input id="night-price" type="number" min={0} value={priceDraft} onChange={(event) => setPriceDraft(event.target.value)} className="h-11" />
            </div>
             <Button onClick={() => { patchNights(selected, { price: Number(priceDraft) || basePrice }); toast.success(x.changesSaved); }}>
              {x.applyPrice}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={allBlocked ? "outline" : "secondary"}
              onClick={() => patchNights(selected, { blocked: !allBlocked })}
            >
              {allBlocked ? x.unblockNight : x.blockNight}
            </Button>
            <Button variant="ghost" onClick={() => patchNights(selected, null)}>{x.clearNight}</Button>
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
        onClick={async () => {
          const reply = value.trim();
          const saved = await remote.replyToReview(reviewId, reply);
          // The error toast comes from the save call; keep the text so nothing is lost.
          if (backendEnabled && saved === null) return;
          setPlatform((state) => ({ reviews: state.reviews.map((r) => (r.id === reviewId ? { ...r, reply } : r)) }));
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
      <p className="mt-3 min-w-0 break-words font-display text-2xl font-bold leading-tight tabular-nums [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

/** Shown instead of "Published" while an administrator still has to approve the listing. */
const AWAITING_REVIEW = {
  en: "Awaiting review",
  fr: "En attente de validation",
  es: "En revisión",
  de: "Wird geprüft",
  pt: "Em revisão",
} as const;
