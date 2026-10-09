import { Link } from "@tanstack/react-router";
import { shortDate } from "@/lib/cardFormat";
import { AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, CalendarCheck, CalendarRange, Check, CheckCircle2, Clock3, Images, MessageSquare, Pencil, ShieldCheck, Sparkles, Star, Wallet, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { Booking, HostListing, HostReview, SessionUser, Thread } from "@/data/platform";
import type { Property } from "@/models/property";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useLanguage, interpolate } from "@/i18n/LanguageProvider";
import { useExtra } from "@/i18n/extra";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { DAY_MS, isoDay, monthKey, occupancyForRange, percentageDifference, requestExpiry, threadNeedsReply, upcomingActivity } from "./calculations";
import { getHostOverviewCopy, type HostOverviewCopy } from "./copy";

type Props = {
  bookings: Booking[];
  listings: HostListing[];
  properties: Property[];
  payouts: { amountUsd: number; status: "paid" | "scheduled" }[];
  reviews: HostReview[];
  threads: Thread[];
  session: SessionUser | null;
  stripeOnboarded: boolean;
  onDecide: (booking: Booking, decision: "confirmed" | "declined") => void;
};

export function HostOverview(props: Props) {
  const { locale, t } = useLanguage();
  const x = useExtra();
  const { format } = useCurrency();
  const c = getHostOverviewCopy(locale);
  const now = new Date();
  const today = isoDay(now);
  const inSevenDays = isoDay(new Date(now.getTime() + 7 * DAY_MS));
  const inThirtyDays = isoDay(new Date(now.getTime() + 30 * DAY_MS));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS);

  const pending = props.bookings.filter((booking) => booking.status === "pending").sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const confirmed = props.bookings.filter((booking) => booking.status === "confirmed");
  const isEarnedBooking = (booking: Booking) => booking.status === "completed" || (booking.status === "confirmed" && booking.to <= today);
  const earned = props.bookings.filter(isEarnedBooking).reduce((sum, booking) => sum + booking.totalUsd, 0);
  const upcomingRevenue = confirmed.filter((booking) => booking.to > today).reduce((sum, booking) => sum + booking.totalUsd, 0);
  const recentRevenue = props.bookings.filter((booking) => isEarnedBooking(booking) && booking.to >= isoDay(thirtyDaysAgo) && booking.to <= today).reduce((sum, booking) => sum + booking.totalUsd, 0);
  const previousRevenue = props.bookings.filter((booking) => isEarnedBooking(booking) && booking.to >= isoDay(sixtyDaysAgo) && booking.to < isoDay(thirtyDaysAgo)).reduce((sum, booking) => sum + booking.totalUsd, 0);
  const recentRequests = props.bookings.filter((booking) => booking.createdAt && new Date(booking.createdAt) >= thirtyDaysAgo).length;
  const previousRequests = props.bookings.filter((booking) => booking.createdAt && new Date(booking.createdAt) >= sixtyDaysAgo && new Date(booking.createdAt) < thirtyDaysAgo).length;
  const nextOccupancy = occupancyForRange(props.bookings, props.listings, today, inThirtyDays);
  const previousOccupancy = occupancyForRange(props.bookings, props.listings, isoDay(thirtyDaysAgo), today);
  const avgRating = props.reviews.length ? props.reviews.reduce((sum, review) => sum + review.rating, 0) / props.reviews.length : 0;
  const recentReviews = props.reviews.filter((review) => new Date(review.date) >= thirtyDaysAgo);
  const previousReviews = props.reviews.filter((review) => new Date(review.date) >= sixtyDaysAgo && new Date(review.date) < thirtyDaysAgo);
  const recentAverage = recentReviews.length ? recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length : 0;
  const previousAverage = previousReviews.length ? previousReviews.reduce((sum, review) => sum + review.rating, 0) / previousReviews.length : 0;
  const activity = upcomingActivity(props.bookings, today, inSevenDays);
  const sortedReviews = [...props.reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  const sortedThreads = [...props.threads].sort((a, b) => (b.messages.at(-1)?.time ?? "").localeCompare(a.messages.at(-1)?.time ?? "")).slice(0, 3);

  const tasks: { key: string; icon: typeof AlertCircle; title: string; detail?: string; to: "/host" | "/messages" | "/profile" | "/list-your-place"; search?: Record<string, string>; label: string; tone?: "danger" }[] = [];
  props.listings.filter((listing) => listing.status === "published" && !listing.approved && !listing.rejectedReason).forEach((listing) => {
    const property = props.properties.find((item) => item.id === listing.propertyId);
    tasks.push({ key: `pending-${listing.id}`, icon: Clock3, title: c.pendingReview, ...(property?.name ? { detail: property.name } : {}), to: "/host", search: { section: "listings" }, label: c.reviewStatus });
  });
  props.listings.filter((listing) => Boolean(listing.rejectedReason)).forEach((listing) => {
    const property = props.properties.find((item) => item.id === listing.propertyId);
    tasks.push({ key: `rejected-${listing.id}`, icon: AlertCircle, title: c.rejected, detail: [property?.name, listing.rejectedReason].filter(Boolean).join(" · "), to: "/list-your-place", search: { edit: listing.propertyId }, label: c.edit, tone: "danger" });
  });
  if (props.session?.verificationStatus !== "verified") tasks.push({ key: "identity", icon: ShieldCheck, title: c.identity, to: "/profile", label: c.finishVerification });
  if (!props.stripeOnboarded) tasks.push({ key: "payouts", icon: Wallet, title: c.payouts, to: "/host", search: { section: "payouts" }, label: c.setupPayouts });
  if (pending.length) {
    const nearestExpiry = Math.min(...pending.map((booking) => requestExpiry(booking.createdAt)));
    tasks.push({ key: "requests", icon: CalendarCheck, title: c.waitingRequests, detail: `${pending.length} · ${requestTimeLabel(nearestExpiry, c)}`, to: "/host", search: { section: "requests" }, label: c.reply });
  }
  const unansweredThreads = props.threads.filter(threadNeedsReply);
  if (unansweredThreads.length) tasks.push({ key: "messages", icon: MessageSquare, title: c.unansweredMessages, detail: String(unansweredThreads.length), to: "/messages", label: c.viewMessages });
  const unansweredReviews = props.reviews.filter((review) => !review.reply).length;
  if (unansweredReviews) tasks.push({ key: "reviews", icon: Star, title: c.unansweredReviews, detail: String(unansweredReviews), to: "/host", search: { section: "reviews" }, label: c.review });

  const chartData = Array.from({ length: 9 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = monthKey(date);
    const isFuture = date > new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      month: date.toLocaleDateString(locale, { month: "short" }),
      earned: isFuture ? 0 : props.bookings.filter((booking) => booking.status === "completed" && booking.to.slice(0, 7) === key).reduce((sum, booking) => sum + booking.totalUsd, 0),
      forecast: props.bookings.filter((booking) => booking.status === "confirmed" && booking.from > today && booking.from.slice(0, 7) === key).reduce((sum, booking) => sum + booking.totalUsd, 0),
    };
  });
  const chartConfig: ChartConfig = { earned: { label: c.actual, color: "var(--chart-1)" }, forecast: { label: c.forecast, color: "var(--chart-3)" } };
  const pendingPayout = props.payouts.filter((payout) => payout.status === "scheduled").reduce((sum, payout) => sum + payout.amountUsd, 0);

  return <section className="space-y-6">
    <OverviewPanel>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="min-w-0 font-display text-lg font-bold">{c.attention}</h2>
        <Badge variant="secondary" className="shrink-0">{tasks.length}</Badge>
      </div>
      {tasks.length ? <div className="mt-4 divide-y divide-border">{tasks.map(({ key, icon: Icon, title, detail, to, search, label, tone }) => <div key={key} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary", tone === "danger" && "bg-destructive/10 text-destructive")}><Icon className="size-4" aria-hidden /></span>
        <div className="min-w-0"><p className="font-semibold">{title}</p>{detail ? <p className="break-words text-xs text-muted-foreground">{detail}</p> : null}</div>
        <Button asChild size="sm" variant="outline" className="col-start-2 justify-self-start sm:col-start-auto"><Link to={to} {...(search ? { search } : {})}>{label}<ArrowRight className="size-3.5" aria-hidden /></Link></Button>
      </div>)}</div> : <div className="mt-4 flex items-start gap-3 rounded-lg bg-primary/8 p-4"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /><div><p className="font-semibold">{c.allSet}</p><p className="text-sm text-muted-foreground">{c.allSetBody}</p></div></div>}
    </OverviewPanel>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <OverviewStat icon={Wallet} label={t.app.host.revenue} value={format(earned)} subvalue={`${c.upcomingRevenue}: ${format(upcomingRevenue)}`} delta={percentageDifference(recentRevenue, previousRevenue)} comparison={c.previousPeriod} noData={c.noPreviousData} />
      <OverviewStat icon={CalendarRange} label={t.app.host.requests} value={String(pending.length)} subvalue={interpolate(c.requestsReceived, { count: recentRequests })} delta={percentageDifference(recentRequests, previousRequests)} comparison={c.previousPeriod} noData={c.noPreviousData} />
      <OverviewStat icon={CalendarCheck} label={t.app.host.occupancy} value={`${nextOccupancy.rate}%`} subvalue={interpolate(c.nightsBooked, { booked: nextOccupancy.booked, available: nextOccupancy.available })} delta={previousOccupancy.available ? percentageDifference(nextOccupancy.rate, previousOccupancy.rate) : null} comparison={c.occupancyComparison} noData={c.noPreviousData} />
      <OverviewStat icon={BadgeCheck} label={t.app.host.avgRating} value={avgRating ? avgRating.toFixed(1) : c.newRating} subvalue={interpolate(c.reviewsCount, { count: props.reviews.length })} delta={previousReviews.length ? percentageDifference(recentAverage, previousAverage) : null} comparison={c.previousPeriod} noData={c.noPreviousData} />
    </div>

    {props.bookings.length === 0 ? <OverviewPanel className="border-primary/25 bg-primary/5"><div className="flex gap-3"><Sparkles className="size-5 shrink-0 text-primary" aria-hidden /><div><h2 className="font-display text-lg font-bold">{c.noBookingsTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{c.noBookingsBody}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{([
      { icon: Images, label: c.addPhotos, section: "listings" },
      { icon: CalendarRange, label: c.setWeekend, section: "calendar" },
      { icon: Sparkles, label: c.enableSmart, section: "calendar" },
    ] as const).map(({ icon: Icon, label, section }) => <Link key={label} to="/host" search={{ section }} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm font-semibold hover:border-primary/40"><Icon className="size-4 shrink-0 text-primary" aria-hidden />{label}</Link>)}</div></OverviewPanel> : null}

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
      <OverviewPanel><PanelHeading title={c.upcomingActivity} subtitle={c.nextSevenDays} />{activity.length ? <div className="mt-4 divide-y divide-border">{activity.map(({ key, booking, date, kind }) => { const property = props.properties.find((item) => item.id === booking.propertyId); return <div key={key} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><span className="grid size-9 place-items-center rounded-md bg-secondary text-primary"><CalendarCheck className="size-4" /></span><div className="min-w-0"><p className="break-words font-semibold">{booking.guestName} · {property?.name}</p><p className="text-xs text-muted-foreground">{kind === "checkIn" ? c.checkIn : c.checkOut} · {shortDate(date, locale)}</p><p className="text-xs text-muted-foreground">{shortDate(booking.from, locale)} → {shortDate(booking.to, locale)} · {booking.nights} {t.app.trips.nights}</p></div><p className="col-start-2 break-words font-semibold tabular-nums [overflow-wrap:anywhere] sm:col-start-auto sm:text-right">{format(booking.totalUsd, { from: booking.currency })}</p></div>; })}</div> : <p className="mt-4 text-sm text-muted-foreground">{c.noActivity}</p>}</OverviewPanel>
      <OverviewPanel><PanelHeading title={c.pendingRequests} subtitle={c.newestRequests} action={pending.length > 3 ? <Button asChild variant="ghost" size="sm"><Link to="/host" search={{ section: "requests" }}>{c.viewAll}</Link></Button> : undefined} />{pending.length ? <div className="mt-4 space-y-4">{pending.slice(0, 3).map((booking) => { const property = props.properties.find((item) => item.id === booking.propertyId); return <div key={booking.id} className="border-b border-border pb-4 last:border-0 last:pb-0"><p className="break-words font-semibold">{booking.guestName}</p><p className="break-words text-xs text-muted-foreground">{property?.name} · {booking.from}</p><p className="mt-1 text-xs font-medium text-primary">{requestTimeLabel(requestExpiry(booking.createdAt), c)}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => props.onDecide(booking, "confirmed")}><Check className="size-4" />{t.app.host.accept}</Button><Button size="sm" variant="outline" onClick={() => props.onDecide(booking, "declined")}><X className="size-4" />{t.app.host.decline}</Button></div></div>; })}</div> : <p className="mt-4 text-sm text-muted-foreground">{t.app.host.noRequests}</p>}</OverviewPanel>
    </div>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
      <OverviewPanel><PanelHeading title={c.revenueChart} subtitle={c.revenueChartHint} /><ChartContainer config={chartConfig} className="mt-4 h-64 w-full aspect-auto"><BarChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis width={48} tickLine={false} axisLine={false} tickFormatter={(value) => new Intl.NumberFormat(locale, { notation: "compact" }).format(value)} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => <span className="break-words font-mono font-medium [overflow-wrap:anywhere]">{format(Number(value))}</span>} />} /><ChartLegend content={<ChartLegendContent />} /><Bar dataKey="earned" fill="var(--color-earned)" radius={[4, 4, 0, 0]} /><Bar dataKey="forecast" fill="var(--color-forecast)" radius={[4, 4, 0, 0]} /></BarChart></ChartContainer></OverviewPanel>
      <OverviewPanel className="flex min-h-64 flex-col"><span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary"><Wallet className="size-5" /></span><h2 className="mt-5 font-display text-lg font-bold">{c.payout}</h2><p className="mt-2 break-words font-display text-3xl font-bold leading-tight tabular-nums [overflow-wrap:anywhere]">{format(pendingPayout)}</p><p className="mt-1 text-sm text-muted-foreground">{c.payoutHint}</p><Button asChild variant="outline" className="mt-auto self-start"><Link to="/host" search={{ section: "payouts" }}>{c.managePayouts}</Link></Button></OverviewPanel>
    </div>

    <OverviewPanel><PanelHeading title={c.listingsSnapshot} subtitle={c.listingSnapshotHint} />{props.listings.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{props.listings.map((listing) => { const property = props.properties.find((item) => item.id === listing.propertyId); const next = confirmed.filter((booking) => booking.propertyId === listing.propertyId && booking.from >= today).sort((a, b) => a.from.localeCompare(b.from))[0]; const status = listing.rejectedReason ? c.rejectedStatus : listing.status === "published" && listing.approved ? c.live : listing.status === "published" ? c.pending : c.draft; return <article key={listing.id} className="overflow-hidden rounded-lg border border-border bg-background"><div className="aspect-[16/8] bg-muted">{property?.image ? <img src={property.image} alt="" className="size-full object-cover" /> : null}</div><div className="p-4"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><h3 className="min-w-0 break-words font-display font-semibold">{property?.name ?? listing.propertyId}</h3><Badge variant={listing.rejectedReason ? "destructive" : "secondary"}>{status}</Badge></div><p className="mt-2 break-words font-semibold tabular-nums [overflow-wrap:anywhere]">{format(listing.nightlyUsd, { from: listing.currency })} <span className="font-normal text-muted-foreground">/ {t.listings.night}</span></p><p className="mt-2 text-xs text-muted-foreground">{c.nextBooking}: <span className="text-foreground">{next ? shortDate(next.from, locale) : c.noBooking}</span></p>{listing.rejectedReason ? <p className="mt-2 break-words text-xs text-destructive">{listing.rejectedReason}</p> : null}<div className="mt-4 flex flex-wrap gap-1"><Button asChild size="sm" variant="ghost"><Link to="/list-your-place" search={{ edit: listing.propertyId }}><Pencil className="size-3.5" />{c.edit}</Link></Button><Button asChild size="sm" variant="ghost"><Link to="/host" search={{ section: "calendar" }}><CalendarRange className="size-3.5" />{c.calendar}</Link></Button><Button asChild size="sm" variant="ghost"><Link to="/host" search={{ section: "stats" }}>{x.statsTitle}</Link></Button>{listing.status === "published" && listing.approved ? <Button asChild size="sm" variant="ghost"><Link to="/stays/$propertyId" params={{ propertyId: listing.propertyId }}>{c.viewPage}</Link></Button> : null}</div></div></article>; })}</div> : <div className="mt-5 flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-5"><p className="text-sm text-muted-foreground">{c.noListings}</p><Button asChild size="sm"><Link to="/list-your-place"><ArrowRight className="size-4" />{c.newListing}</Link></Button></div>}</OverviewPanel>

    <div className="grid gap-5 lg:grid-cols-2">
      <OverviewPanel><PanelHeading title={c.recentReviews} action={<Button asChild size="sm" variant="ghost"><Link to="/host" search={{ section: "reviews" }}>{c.viewAll}</Link></Button>} />{sortedReviews.length ? <div className="mt-4 divide-y divide-border">{sortedReviews.map((review) => <div key={review.id} className="py-3 first:pt-0"><div className="flex justify-between gap-3"><p className="font-semibold">{review.author}</p><span className="shrink-0 text-sm font-semibold">★ {review.rating.toFixed(1)}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{review.text}</p>{!review.reply ? <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/host" search={{ section: "reviews" }}>{c.review}</Link></Button> : null}</div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">{c.noReviews}</p>}</OverviewPanel>
      <OverviewPanel><PanelHeading title={c.recentMessages} action={<Button asChild size="sm" variant="ghost"><Link to="/messages">{c.viewAll}</Link></Button>} />{sortedThreads.length ? <div className="mt-4 divide-y divide-border">{sortedThreads.map((thread) => { const latest = thread.messages.at(-1); const needsReply = threadNeedsReply(thread); return <Link key={thread.id} to="/messages" className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 first:pt-0"><div className="min-w-0"><p className="truncate font-semibold">{thread.withName}</p><p className="truncate text-sm text-muted-foreground">{latest?.text ?? "—"}</p>{needsReply ? <p className="mt-1 text-xs font-medium text-primary">{c.replyNeeded}</p> : null}</div>{thread.unread ? <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" aria-label={interpolate(c.unread, { count: thread.unread })} /> : null}</Link>; })}</div> : <p className="mt-4 text-sm text-muted-foreground">{c.noMessages}</p>}</OverviewPanel>
    </div>
  </section>;
}

function requestTimeLabel(expiresAt: number, c: HostOverviewCopy) {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return c.expired;
  const hours = Math.ceil(remaining / 3_600_000);
  return interpolate(c.expiresIn, { time: hours >= 24 ? interpolate(c.days, { count: Math.ceil(hours / 24) }) : interpolate(c.hours, { count: hours }) });
}

function OverviewPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6", className)}>{children}</section>;
}

function PanelHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><div className="min-w-0"><h2 className="font-display text-lg font-bold">{title}</h2>{subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}</div>{action}</div>;
}

function OverviewStat({ icon: Icon, label, value, subvalue, delta, comparison, noData }: { icon: typeof Wallet; label: string; value: string; subvalue?: string; delta?: number | null; comparison: string; noData?: string }) {
  const up = typeof delta === "number" && delta >= 0;
  const flat = delta === 0;
  return <div className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><p className="min-w-0 text-xs font-semibold text-muted-foreground">{label}</p><span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/8 text-primary"><Icon className="size-4" /></span></div><p className="mt-3 min-w-0 break-words font-display text-2xl font-bold leading-tight tabular-nums [overflow-wrap:anywhere]">{value}</p>{subvalue ? <p className="mt-1 break-words text-xs text-muted-foreground">{subvalue}</p> : null}<div className="mt-3 flex items-start gap-1 text-[11px] text-muted-foreground">{typeof delta === "number" ? <><span className={cn("inline-flex shrink-0 items-center font-semibold", flat ? "text-muted-foreground" : up ? "text-primary" : "text-destructive")}>{flat ? null : up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{Math.abs(delta)}%</span><span>{comparison}</span></> : <span>{noData ?? comparison}</span>}</div></div>;
}