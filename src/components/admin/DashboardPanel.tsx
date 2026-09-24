import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  RefreshCw,
  ChevronRight,
  BadgeCheck,
  CalendarCheck,
  CalendarX,
  Home,
  MapPin,
  Percent,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { adminOpsApi, type StatsCompareDto, type StatsInsightsDto } from "@/api/http/adminOps.http";
import type { AdminOverviewDto } from "@/api/http/platform.http";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { cn } from "@/lib/utils";

type Props = {
  overview: AdminOverviewDto | null;
  canStats: boolean;
  onOpen: (section: string) => void;
};

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);
const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  if (!y || !mo) return m;
  return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};

const revenueConfig = {
  revenueUsd: { label: "Revenue", color: "var(--chart-1)" },
  commissionUsd: { label: "Commission", color: "var(--chart-2)" },
} satisfies ChartConfig;
const bookingsConfig = { bookings: { label: "Bookings", color: "var(--chart-3)" } } satisfies ChartConfig;
const occupancyConfig = { rate: { label: "Occupancy %", color: "var(--chart-2)" } } satisfies ChartConfig;

export function DashboardPanel({ overview, canStats, onOpen }: Props) {
  const { format } = useCurrency();
  const [compare, setCompare] = useState<StatsCompareDto | null>(null);
  const [insights, setInsights] = useState<StatsInsightsDto | null>(null);
  const [statsState, setStatsState] = useState<"loading" | "ready" | "error">(canStats ? "loading" : "ready");
  const [months, setMonths] = useState(6);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!canStats) return;
    let active = true;
    setStatsState("loading");
    Promise.all([adminOpsApi.statsCompare(months), adminOpsApi.statsInsights(Math.max(months, 3))])
      .then(([c, i]) => {
        if (!active) return;
        setCompare(c);
        setInsights(i);
        setStatsState("ready");
      })
      .catch(() => active && setStatsState("error"));
    return () => {
      active = false;
    };
  }, [canStats, months, reload]);

  if (!overview) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const { users, listings, bookings, revenue, reviews } = overview;
  const takeRate = pct(revenue.commissionUsd, revenue.grossUsd);
  const cancelRate = pct(bookings.cancelled, bookings.total);
  const confirmRate = pct(bookings.confirmed + bookings.completed, bookings.total);
  const publishedRate = pct(listings.published, listings.total);
  const hostShare = pct(users.hosts, users.total);
  const listingsPerHost = users.hosts > 0 ? (listings.published / users.hosts).toFixed(1) : "0";

  const headline = [
    {
      label: "Gross booking value",
      value: format(revenue.grossUsd),
      hint: `${bookings.total} bookings all time`,
      icon: Wallet,
      change: compare?.change.revenueUsd,
      section: "finance",
    },
    {
      label: "Platform commission",
      value: format(revenue.commissionUsd),
      hint: `${takeRate}% take rate`,
      icon: Percent,
      change: compare?.change.commissionUsd,
      section: "commissions",
    },
    {
      label: "Average basket",
      value: insights ? format(insights.averageBasketUsd) : "—",
      hint: insights ? `Over ${insights.basketBookings} paid bookings` : "Per paid booking",
      icon: ShoppingBag,
      section: "bookings",
    },
    {
      label: `Occupancy (${months} mo)`,
      value: insights ? `${insights.occupancy.rate}%` : "—",
      hint: insights
        ? `${insights.occupancy.nightsBooked.toLocaleString()} of ${insights.occupancy.nightsAvailable.toLocaleString()} nights`
        : "Booked vs available nights",
      icon: TrendingUp,
      section: "reports",
    },
  ];
  const periodText = `Last ${months} months`;

  const queue = [
    { label: "Listings to approve", value: listings.awaitingApproval, section: "approvals", icon: Home },
    { label: "Bookings awaiting host", value: bookings.pending, section: "bookings", icon: CalendarCheck },
    { label: "Payouts to send", value: format(revenue.payoutsPendingUsd), raw: revenue.payoutsPendingUsd, section: "payouts", icon: Wallet },
    { label: "Suspended members", value: users.suspended, section: "users", icon: AlertTriangle },
  ];

  const series = (compare?.series ?? []).map((row) => ({ ...row, label: monthLabel(row.month) }));
  const occupancy = (insights?.monthlyOccupancy ?? []).map((row) => ({ ...row, label: monthLabel(row.month) }));
  const topDestinations = (insights?.topDestinations ?? []).slice(0, 6);
  const maxDest = Math.max(1, ...topDestinations.map((d) => d.revenueUsd));

  return (
    <div className="space-y-6">
      {/* Filters */}
      {canStats ? (
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Period</span>
            <div className="grid grid-cols-4 gap-1 rounded-md bg-muted p-1">
              {[3, 6, 12, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={cn(
                    "rounded px-3 py-1.5 text-xs font-semibold transition-colors",
                    months === m ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === 24 ? "2 yrs" : `${m} mo`}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button size="sm" variant="outline" onClick={() => setReload((n) => n + 1)} disabled={statsState === "loading"}>
              <RefreshCw className={cn("size-4", statsState === "loading" && "animate-spin")} /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={() => void adminOpsApi.downloadStatsCsv(months).catch(() => undefined)}>
              <Download className="size-4" /> Export CSV
            </Button>
          </div>
        </section>
      ) : null}

      {/* Headline money KPIs */}
      <section className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {headline.map(({ label, value, hint, icon: Icon, change, section }) => (
          <button type="button" onClick={() => onOpen(section)} key={label} className="group min-w-0 rounded-lg border border-border bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 truncate text-[11px] font-semibold uppercase text-muted-foreground">{label}</span>
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-2 truncate font-display text-2xl font-bold tabular-nums">{value}</p>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {typeof change === "number" ? (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
                    change >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {Math.abs(change)}%
                </span>
              ) : null}
              <span className="truncate">{hint}</span>
              <ChevronRight className="ml-auto size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </div>
          </button>
        ))}
      </section>

      {/* Action queue */}
      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold">Needs your attention</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {queue.map(({ label, value, raw, section, icon: Icon }) => {
            const hot = Number(raw ?? value) > 0;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onOpen(section)}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50",
                  hot ? "border-primary/40 bg-primary/5" : "border-border",
                )}
              >
                <Icon className={cn("size-5 shrink-0", hot ? "text-primary" : "text-muted-foreground")} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-xs text-muted-foreground">{label}</span>
                  <span className="block truncate font-display text-lg font-bold tabular-nums">{value}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Health rates */}
      <section className="grid gap-4 lg:grid-cols-3">
        <RateCard
          title="Bookings"
          icon={CalendarCheck}
          rows={[
            { label: "Confirmed or completed", value: confirmRate, detail: `${bookings.confirmed + bookings.completed}` },
            { label: "Cancelled", value: cancelRate, detail: `${bookings.cancelled}`, warn: cancelRate > 30 },
            { label: "Pending", value: pct(bookings.pending, bookings.total), detail: `${bookings.pending}` },
          ]}
        />
        <RateCard
          title="Listings"
          icon={Home}
          rows={[
            { label: "Published", value: publishedRate, detail: `${listings.published} / ${listings.total}` },
            { label: "Awaiting approval", value: pct(listings.awaitingApproval, listings.total), detail: `${listings.awaitingApproval}` },
            { label: "Suspended", value: pct(listings.suspended, listings.total), detail: `${listings.suspended}`, warn: listings.suspended > 0 },
          ]}
          footer={`${listingsPerHost} published listings per host`}
        />
        <RateCard
          title="Members"
          icon={Users}
          rows={[
            { label: "Hosts", value: hostShare, detail: `${users.hosts}` },
            { label: "Guests", value: pct(users.guests, users.total), detail: `${users.guests}` },
            { label: "Suspended", value: pct(users.suspended, users.total), detail: `${users.suspended}`, warn: users.suspended > 0 },
          ]}
          footer={`${users.total} members · ${users.admins} team accounts`}
        />
      </section>

      {/* Small stat strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={Star} label="Average rating" value={reviews.total ? reviews.averageRating.toFixed(2) : "—"} hint={`${reviews.total} reviews · ${reviews.hidden} hidden`} />
        <MiniStat icon={BadgeCheck} label="Payouts sent" value={format(revenue.payoutsUsd)} hint="Paid to hosts" />
        <MiniStat icon={CalendarX} label="Cancellation rate" value={`${cancelRate}%`} hint={`${bookings.cancelled} cancelled`} warn={cancelRate > 30} />
        <MiniStat icon={Users} label="Hosts share" value={`${hostShare}%`} hint={`${users.hosts} hosts`} />
      </section>

      {/* Charts */}
      {canStats ? (
        statsState === "error" ? (
          <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted-foreground">Charts could not be loaded right now.</p>
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <ChartCard title="Revenue & commission" subtitle={periodText}>
                {statsState === "loading" ? <Skeleton className="aspect-auto h-56 w-full sm:h-64" /> : series.length === 0 ? <NoData /> : (
                  <ChartContainer config={revenueConfig} className="aspect-auto h-56 w-full sm:h-64">
                    {series.length < 3 ? (
                    <BarChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={48} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenueUsd" fill="var(--color-revenueUsd)" radius={4} maxBarSize={48} />
                      <Bar dataKey="commissionUsd" fill="var(--color-commissionUsd)" radius={4} maxBarSize={48} />
                    </BarChart>
                    ) : (
                    <AreaChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={48} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area dataKey="revenueUsd" type="monotone" fill="var(--color-revenueUsd)" fillOpacity={0.2} stroke="var(--color-revenueUsd)" strokeWidth={2} />
                      <Area dataKey="commissionUsd" type="monotone" fill="var(--color-commissionUsd)" fillOpacity={0.2} stroke="var(--color-commissionUsd)" strokeWidth={2} />
                    </AreaChart>
                    )}
                  </ChartContainer>
                )}
              </ChartCard>
              <ChartCard title="Bookings per month" subtitle={periodText}>
                {statsState === "loading" ? <Skeleton className="aspect-auto h-56 w-full sm:h-64" /> : series.length === 0 ? <NoData /> : (
                  <ChartContainer config={bookingsConfig} className="aspect-auto h-56 w-full sm:h-64">
                    <BarChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                )}
              </ChartCard>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Occupancy rate" subtitle={`Booked vs available nights, ${periodText.toLowerCase()}`}>
                {statsState === "loading" ? <Skeleton className="h-56 w-full" /> : occupancy.length === 0 ? <NoData /> : (
                  <ChartContainer config={occupancyConfig} className="h-56 w-full">
                    <BarChart data={occupancy} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={32} unit="%" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="rate" fill="var(--color-rate)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                )}
              </ChartCard>
              <ChartCard title="Top destinations" subtitle="By booking revenue">
                {statsState === "loading" ? <Skeleton className="h-56 w-full" /> : topDestinations.length === 0 ? <NoData /> : (
                  <ul className="space-y-3">
                    {topDestinations.map((d) => (
                      <li key={`${d.city}-${d.country}`} className="min-w-0">
                        <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="truncate font-medium">{d.city}</span>
                            <span className="hidden truncate text-xs text-muted-foreground sm:inline">{d.country}</span>
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {format(d.revenueUsd)} <span className="text-xs text-muted-foreground">· {d.bookings} bk</span>
                          </span>
                        </div>
                        <Progress value={(d.revenueUsd / maxDest) * 100} className="mt-1.5 h-1.5" />
                      </li>
                    ))}
                  </ul>
                )}
              </ChartCard>
            </section>
          </>
        )
      ) : null}
    </div>
  );
}

function RateCard({
  title,
  icon: Icon,
  rows,
  footer,
}: {
  title: string;
  icon: typeof Users;
  rows: { label: string; value: number; detail: string; warn?: boolean }[];
  footer?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h3 className="flex items-center gap-2 font-display text-base font-semibold">
        <Icon className="size-4 text-primary" aria-hidden />
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <span className="truncate text-muted-foreground">{row.label}</span>
              <span className={cn("shrink-0 font-semibold tabular-nums", row.warn && "text-destructive")}>
                {row.value}% <span className="text-xs font-normal text-muted-foreground">({row.detail})</span>
              </span>
            </div>
            <Progress value={row.value} className="mt-1.5 h-1.5" />
          </li>
        ))}
      </ul>
      {footer ? <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">{footer}</p> : null}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, hint, warn }: { icon: typeof Users; label: string; value: string; hint: string; warn?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm">
      <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <p className={cn("mt-1.5 truncate font-display text-xl font-bold tabular-nums", warn && "text-destructive")}>{value}</p>
      <p className="truncate text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}

function NoData() {
  return <p className="grid h-40 place-items-center text-sm text-muted-foreground">No data for this period yet.</p>;
}
