import { Link, createFileRoute } from "@tanstack/react-router";
import { API_BASE_URL } from "@/api/http/client";
import { mediaUrl } from "@/lib/images";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ChartPanel, Donut, GroupedBars, StatTile } from "@/components/admin/AdminCharts";
import {
  BadgeCheck,
  LayoutDashboard,
  Building2,
  Globe,
  Home,
  FileText,
  Languages,
  ListChecks,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardCheck,
  Eye,
  EyeOff,
  Flag,
  History,
  LifeBuoy,
  Mail,
  Menu,
  Percent,
  Search,
  Settings,
  Shield,
  Star,
  Trash2,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import {
  AuditPanel,
  BookingActionsPanel,
  BookingsDeskPanel,
  CommissionsPanel,
  FinancePanel,
  ListingReportsPanel,
  NotificationsPanel,
  StatsComparePanel,
  SupportDeskPanel,
  VerificationPanel,
} from "@/components/admin/AdminOpsPanels";
import { TeamRolesPanel } from "@/components/admin/TeamRolesPanel";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { AmenitiesPanel, CitiesPanel, ContentPagesPanel, CountriesPanel, PropertyTypesPanel, TranslationsPanel } from "@/components/admin/CatalogPanels";
import { adminOpsApi, type AdminMeDto } from "@/api/http/adminOps.http";
import { useAdminCopy } from "@/i18n/adminCopy";
import { useSupportCopy } from "@/i18n/supportCopy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAllProperties } from "@/hooks/useAllProperties";
import { useClientCopy } from "@/i18n/clientCopy";
import { backendEnabled, remote, toPayout, toProperty } from "@/api/backend";
import { propertiesApi } from "@/api/http/platform.http";
import type { Property } from "@/models/property";
import type { AdminReportsDto } from "@/api/http/platform.http";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { DataState, EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import authWallpaper from "@/assets/auth-wallpaper.jpg";

function SidebarBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <img src={authWallpaper} alt="" width={1024} height={1536} className="size-full object-cover object-center opacity-[0.14]" />
      <div className="absolute inset-0 bg-sidebar/85" />
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Admin back office — RoomEasy" },
      { name: "description", content: "Moderate listings, manage RoomEasy members, review payouts and tune platform settings." },
      { property: "og:title", content: "Admin back office — RoomEasy" },
      { property: "og:description", content: "Moderate listings, manage members, review payouts and platform settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t, locale } = useLanguage();
  const { format } = useCurrency();
  const cc = useClientCopy();
  const { session, listings, users, payouts, commissionRate, reviews, adminOverview, accountDataStatus } = usePlatform();
  const allProperties = useAllProperties();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("dashboard");
  const [commission, setCommission] = useState(String(commissionRate));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const ac = useAdminCopy();
  const sc = useSupportCopy();
  const [me, setMe] = useState<AdminMeDto | null>(null);
  const [pendingDetails, setPendingDetails] = useState<Record<string, Property>>({});
  // Which payout is currently being sent, so its button can't be clicked twice.
  const [sendingPayoutId, setSendingPayoutId] = useState<string | null>(null);

  // Which back-office modules this administrator's role unlocks.
  useEffect(() => {
    let active = true;
    void adminOpsApi
      .me()
      .then((data) => {
        if (active) setMe(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const can = (capability: string) => me?.capabilities.includes(capability) ?? !backendEnabled;
  const accessResolved = accountDataStatus === "ready" && (!backendEnabled || me !== null);
  const roleName = me?.roles.includes("admin")
    ? ac.roleAdmin
    : me?.roles.includes("moderator")
      ? ac.roleModerator
      : me?.roles.includes("support")
        ? ac.roleSupport
        : me?.roles.includes("accounting")
          ? ac.roleAccounting
          : null;

  const pending = listings.filter((l) => !l.approved);

  // Listings waiting for approval are not in the public catalogue yet, so the
  // back office loads their full record (photos included) on its own.
  const pendingIds = pending.map((l) => l.propertyId).join(",");
  useEffect(() => {
    if (!backendEnabled || !pendingIds) return;
    let active = true;
    void (async () => {
      const ids = pendingIds.split(",");
      const loaded = await Promise.all(
        ids.map(async (id) => {
          try {
            return toProperty(await propertiesApi.get(id));
          } catch {
            return null;
          }
        }),
      );
      if (!active) return;
      const next: Record<string, Property> = {};
      for (const property of loaded) if (property) next[property.id] = property;
      setPendingDetails(next);
    })();
    return () => {
      active = false;
    };
  }, [pendingIds]);

  // Members can be found by name, email or phone number; the phone match
  // ignores spaces and punctuation so "+216 55 123" also finds "21655123".
  const needle = query.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const filteredUsers = users.filter((u) => {
    if (!needle) return true;
    if (`${u.name} ${u.email}`.toLowerCase().includes(needle)) return true;
    return Boolean(digits) && (u.phone ?? "").replace(/\D/g, "").includes(digits);
  });
  const hostsCount = adminOverview?.users.hosts ?? users.filter((u) => u.role === "host").length;
  const payoutsTotal = adminOverview?.revenue.payoutsUsd ?? payouts.reduce((sum, p) => sum + p.amountUsd, 0);
  const metric = (value: number | string) => accountDataStatus === "ready" ? value : "—";

  const overview = [
    { label: t.app.admin.approvals, value: metric(adminOverview?.listings.awaitingApproval ?? pending.length), tone: "amber" as const, to: "approvals" },
    { label: t.app.admin.users, value: metric(adminOverview?.users.total ?? users.length), tone: "primary" as const, to: "users" },
    { label: t.app.admin.host, value: metric(hostsCount), tone: "emerald" as const, to: "users" },
    { label: t.app.admin.payouts, value: metric(format(payoutsTotal)), tone: "primary" as const, to: "payouts" },
  ];

  // The back office is for administrators and the delegated roles the server
  // recognises (moderator, support, accounting).
  if (accessResolved && (!session || (session.role !== "admin" && !session.backOffice) || (backendEnabled && !me))) {
    return (
      <AppShell title={t.app.admin.title} subtitle={t.app.admin.subtitle}>
        <p className="rounded-xl border border-border bg-surface p-6 text-muted-foreground">
          {session ? "You do not have access to the back office." : t.auth.login}
        </p>
      </AppShell>
    );
  }

  type NavItem = { value: string; label: string; icon: typeof Users; group: "overview" | "moderation" | "members" | "finance" | "insights" | "system" };

  const navItems: NavItem[] = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "overview" },
    { value: "approvals", label: t.app.admin.approvals, icon: ClipboardCheck, group: "moderation" },
    ...(can("listings.moderate") ? [{ value: "listing-reports", label: ac.tabReports, icon: Flag, group: "moderation" as const }] : []),
    { value: "moderation", label: cc.reviewModeration, icon: Star, group: "moderation" },

    { value: "users", label: t.app.admin.users, icon: Users, group: "members" },
    ...(can("users.manage") ? [{ value: "verification", label: ac.tabVerification, icon: BadgeCheck, group: "members" as const }] : []),
    ...(can("support.manage") ? [{ value: "support", label: ac.tabSupport, icon: LifeBuoy, group: "members" as const }] : []),

    ...(can("bookings.read") ? [{ value: "bookings", label: ac.tabBookings, icon: CalendarDays, group: "finance" as const }] : []),
    { value: "payouts", label: t.app.admin.payouts, icon: Wallet, group: "finance" },
    ...(can("finance.read") ? [{ value: "commissions", label: ac.tabCommissions, icon: Percent, group: "finance" as const }] : []),
    ...(can("finance.read") ? [{ value: "finance", label: ac.tabFinance, icon: Wallet, group: "finance" as const }] : []),
    ...(can("bookings.manage") || can("finance.manage")
      ? [{ value: "booking-actions", label: ac.tabBooking, icon: CalendarClock, group: "finance" as const }]
      : []),

    { value: "reports", label: t.app.admin.reports, icon: BarChart3, group: "insights" },
    ...(can("stats.read") ? [{ value: "compare", label: ac.tabCompare, icon: TrendingUp, group: "insights" as const }] : []),

    ...(can("audit.read")
      ? [
          { value: "audit", label: ac.tabAudit, icon: History, group: "system" as const },
          { value: "emails", label: ac.tabEmails, icon: Mail, group: "system" as const },
        ]
      : []),
    ...(can("content.manage")
      ? [
          { value: "amenities", label: "Amenities", icon: ListChecks, group: "system" as const },
          { value: "property-types", label: "Property types", icon: Home, group: "system" as const },
          { value: "countries", label: "Countries", icon: Globe, group: "system" as const },
          { value: "cities", label: "Cities", icon: Building2, group: "system" as const },
          { value: "pages", label: "Pages", icon: FileText, group: "system" as const },
          { value: "translations", label: "Translations", icon: Languages, group: "system" as const },
        ]
      : []),
    ...(can("admins.manage") || can("users.manage") ? [{ value: "team", label: sc.tabTeam, icon: UserCog, group: "system" as const }] : []),
    { value: "settings", label: t.app.admin.settings, icon: Settings, group: "system" },
  ];

  const current = navItems.find((item) => item.value === section) ?? navItems[0];
  if (!current) return null;

  const groupLabels = {
    en: ["Overview", "Moderation", "Members", "Finance", "Insights", "Administration"],
    fr: ["Vue d'ensemble", "Modération", "Membres", "Finance", "Analyses", "Administration"],
    es: ["Resumen", "Moderación", "Miembros", "Finanzas", "Análisis", "Administración"],
    de: ["Übersicht", "Moderation", "Mitglieder", "Finanzen", "Analysen", "Verwaltung"],
    pt: ["Visão geral", "Moderação", "Membros", "Finanças", "Análises", "Administração"],
  }[locale];
  const groupOrder: NavItem["group"][] = ["overview", "moderation", "members", "finance", "insights", "system"];

  const navigation = () => (
    <nav aria-label={t.app.admin.title} className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4">
      {groupOrder.map((group, groupIndex) => {
        const items = navItems.filter((item) => item.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className={cn(groupIndex > 0 && "mt-4")}>
            <p className="mb-1.5 px-2 font-sans text-[10px] font-semibold uppercase text-muted-foreground">
              {groupLabels[groupIndex]}
            </p>
            <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.value === section;
            const count = item.value === "approvals" && pending.length > 0 ? pending.length : null;
            return (
              <Button
                key={item.value}
                type="button"
                variant="ghost"
                onClick={() => {
                  setSection(item.value);
                  setMobileNavOpen(false);
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                   "h-9 w-full justify-start gap-2.5 rounded-sm border-l-2 border-transparent px-2 font-sans text-[13px] shadow-none",
                  active
                     ? "border-primary bg-primary/8 font-semibold text-foreground hover:bg-primary/8 hover:text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
                <span className="truncate">{item.label}</span>
                {count ? (
                  <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-5 text-primary-foreground tabular-nums">
                    {count}
                  </span>
                ) : null}
              </Button>
            );
          })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Tabs value={section} onValueChange={setSection} className="min-w-0 gap-0">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
            <SidebarBackdrop />
            <div className="relative flex h-16 shrink-0 items-center px-5">
              <BrandLogo className="h-14 max-w-[11rem]" />
            </div>
            {navigation()}
            {roleName ? (
              <div className="relative flex shrink-0 items-center gap-3 border-t border-sidebar-border bg-sidebar/35 px-5 py-4 backdrop-blur-sm">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold uppercase">{roleName.slice(0, 1)}</span>
                <span className="min-w-0 font-sans">
                  <span className="block truncate text-xs font-semibold">{roleName}</span>
                  <span className="block truncate text-[10px] uppercase text-muted-foreground">{ac.roleLabel}</span>
                </span>
              </div>
            ) : null}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-xl">
              <div className="flex min-w-0 items-center gap-2">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <Button variant="ghost" size="icon" className="-ml-2 shadow-none lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open admin menu">
                  <Menu className="size-[18px]" aria-hidden />
                </Button>
                <SheetContent side="left" className="flex w-[17.5rem] flex-col gap-0 overflow-hidden bg-sidebar p-0 shadow-none sm:max-w-[17.5rem]">
                  <SidebarBackdrop />
                  <SheetHeader className="relative border-b border-sidebar-border bg-sidebar/35 px-4 py-3 pr-12 text-left backdrop-blur-sm">
                    <SheetTitle className="flex h-12 items-center">
                      <BrandLogo className="h-14 max-w-[9rem]" />
                    </SheetTitle>
                    <SheetDescription className="sr-only">{t.app.admin.subtitle}</SheetDescription>
                  </SheetHeader>
                  {navigation()}
                  <div className="relative border-t border-sidebar-border bg-sidebar/35 px-4 py-3 backdrop-blur-sm">
                    <CurrencySelector />
                  </div>
                  {roleName ? (
                    <div className="relative flex items-center gap-3 border-t border-sidebar-border bg-sidebar/35 p-4 backdrop-blur-sm">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold uppercase">{roleName.slice(0, 1)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{roleName}</span>
                        <span className="block text-[11px] text-muted-foreground uppercase">{ac.roleLabel}</span>
                      </span>
                    </div>
                  ) : null}
                </SheetContent>
              </Sheet>
              <span className="min-w-0"><span className="block truncate font-display text-sm font-semibold">{current.label}</span><span className="block truncate text-[10px] text-muted-foreground lg:hidden">{t.app.admin.title}</span></span>
              </div>
              <div className="flex items-center gap-2"><span className="hidden sm:inline-flex"><CurrencySelector /></span><LanguageSelector /><AccountMenu /></div>
            </div>

            <div className="mx-auto w-full max-w-[86rem] px-4 py-6 sm:px-7 lg:px-10 lg:py-8 xl:px-12">
              <header className="mb-6 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="min-w-0">
                  <p className="mb-1 font-sans text-[10px] font-semibold uppercase text-muted-foreground">{t.app.admin.title}</p>
                   <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{current.label}</h1>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t.app.admin.subtitle}</p>
                </div>
                {roleName ? <Badge variant="outline" className="hidden sm:inline-flex">{roleName}</Badge> : null}
              </header>

              <div className={cn("mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", section === "dashboard" && "hidden")}>
                {overview.map(({ label, value, tone, to }) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => setSection(to)}
                    className={cn(
                      "min-w-0 rounded-lg border border-border bg-surface px-3 py-3 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5 sm:py-4",
                    )}
                  >
                     <span className="block truncate text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>
                    <span className={cn(
                       "mt-2 block truncate font-display text-xl font-bold tabular-nums sm:text-2xl",
                      tone === "amber" && Number(value) > 0 && "text-amber-700",
                      tone === "emerald" && "text-emerald-700",
                    )}>{value}</span>
                  </button>
                ))}
              </div>
              {accountDataStatus !== "ready" ? (
                <DataState status={accountDataStatus} loading={t.app.common.loading} error={t.app.common.loadError} retry={t.app.common.retry} compact />
              ) : null}

        <div className={cn("min-w-0 max-w-full", accountDataStatus !== "ready" && "hidden")}>
        <TabsContent value="dashboard" className="mt-0 min-w-0 max-w-full">
          <DashboardPanel overview={adminOverview} canStats={backendEnabled && can("stats.read")} onOpen={setSection} />
        </TabsContent>
        <TabsContent value="team" className="mt-0 min-w-0 max-w-full">
          <TeamRolesPanel />
        </TabsContent>

        <TabsContent value="listing-reports" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <ListingReportsPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="verification" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <VerificationPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="commissions" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <CommissionsPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="finance" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <FinancePanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="support" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <SupportDeskPanel adminId={me?.userId ?? null} /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="booking-actions" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <BookingActionsPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="bookings" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <BookingsDeskPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="compare" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <StatsComparePanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="audit" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <AuditPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="emails" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <NotificationsPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="amenities" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <AmenitiesPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="property-types" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <PropertyTypesPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="countries" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <CountriesPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="cities" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <CitiesPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="pages" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <ContentPagesPanel /> : <Empty text={ac.empty} />}
        </TabsContent>
        <TabsContent value="translations" className="mt-0 min-w-0 max-w-full">
          {backendEnabled ? <TranslationsPanel /> : <Empty text={ac.empty} />}
        </TabsContent>


        <TabsContent value="approvals" className="mt-0 min-w-0 max-w-full">
          {pending.length === 0 ? (
            <Empty text={t.app.admin.noApprovals} />
          ) : (
            <ul className="overflow-hidden border border-border bg-surface divide-y divide-border">
              {pending.map((listing) => {
                const property =
                  pendingDetails[listing.propertyId] ?? allProperties.find((p) => p.id === listing.propertyId);
                return (
                  <li
                    key={listing.id}
                    className="grid gap-4 p-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                  >
                    <Link
                      to="/admin/listings/$listingId"
                      params={{ listingId: listing.id }}
                      className="flex min-w-0 items-center gap-4 text-left"
                    >
                      {property?.image ? (
                        <img
                          src={property.image}
                          alt={property.name}
                          loading="lazy"
                          className="size-16 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="size-16 shrink-0 rounded-md bg-muted" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate font-sans text-sm font-semibold underline-offset-4 hover:underline">
                          {property?.name ?? listing.propertyId}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(listing.nightlyUsd)} · {t.app.host[listing.status]}
                        </p>
                      </div>
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!(await remote.approveListing(listing.id))) return;
                          setPlatform((s) => ({
                            listings: s.listings.map((l) =>
                              l.id === listing.id ? { ...l, approved: true, status: "published" as const } : l,
                            ),
                          }));
                          toast.success(t.app.admin.approved);
                        }}
                      >
                        <Check className="size-4" aria-hidden />
                        {t.app.admin.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!(await remote.rejectListing(listing.id))) return;
                          setPlatform((s) => ({
                            listings: s.listings.map((l) =>
                              l.id === listing.id ? { ...l, status: "suspended" as const } : l,
                            ),
                          }));
                          toast.success(t.app.admin.rejected);
                        }}
                      >
                        <X className="size-4" aria-hidden />
                        {t.app.admin.reject}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-0 space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.app.admin.searchUsers}
              aria-label={t.app.admin.searchUsers}
              className="pl-9"
            />
          </div>
          {filteredUsers.length === 0 ? <Empty text={t.app.admin.noUsers} /> : null}
          <ul className="overflow-hidden border border-border bg-surface divide-y divide-border">
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                className="grid gap-3 p-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email}
                    {user.phone ? ` · ${user.phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{t.app.admin[user.role]}</Badge>
                  {user.suspended ? (
                    <Badge className="border-0 bg-destructive/10 text-destructive">
                      {t.app.host.suspended}
                      {user.suspendedUntil
                        ? ` · ${ac.suspendedUntil} ${new Date(user.suspendedUntil).toLocaleDateString()}`
                        : ""}
                    </Badge>
                  ) : null}
                  {user.role === "host" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/hosts/$userId" params={{ userId: user.id }}>
                        {ac.hostProfile}
                      </Link>
                    </Button>
                  ) : null}
                  {user.suspended ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!(await remote.setUserSuspended(user.id, false))) return;
                        setPlatform((s) => ({
                          users: s.users.map((u) =>
                            u.id === user.id ? { ...u, suspended: false, suspendedUntil: null } : u,
                          ),
                        }));
                        toast.success(t.app.admin.updated);
                      }}
                    >
                      {t.app.admin.reinstate}
                    </Button>
                  ) : (
                    // A suspension can run for a set number of days and lifts
                    // itself, or stay in place until an admin removes it.
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          {t.app.admin.suspend}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t.app.admin.suspend}</DropdownMenuLabel>
                        {[
                          { label: ac.suspend7Days, days: 7 },
                          { label: ac.suspend30Days, days: 30 },
                          { label: ac.suspendPermanent, days: null as number | null },
                        ].map((option) => (
                          <DropdownMenuItem
                            key={option.label}
                            onSelect={async () => {
                              const until =
                                option.days === null
                                  ? undefined
                                  : new Date(Date.now() + option.days * 86_400_000).toISOString();
                              if (!(await remote.setUserSuspended(user.id, true, undefined, until))) return;
                              setPlatform((s) => ({
                                users: s.users.map((u) =>
                                  u.id === user.id ? { ...u, suspended: true, suspendedUntil: until ?? null } : u,
                                ),
                              }));
                              toast.success(t.app.admin.updated);
                            }}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="moderation" className="mt-0 min-w-0 max-w-full">
          {reviews.length === 0 ? (
            <Empty text={t.app.admin.noReports} />
          ) : (
            <ul className="overflow-hidden border border-border bg-surface divide-y divide-border">
              {reviews.map((review) => {
                const property = allProperties.find((p) => p.id === review.propertyId);
                return (
                  <li
                    key={review.id}
                    className="grid gap-3 p-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        {review.author}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <Star className="size-3 fill-primary text-primary" aria-hidden />
                          {review.rating}/5
                        </span>
                        {review.hidden ? (
                          <Badge className="border-0 bg-destructive/10 text-destructive">{cc.hiddenBadge}</Badge>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {property?.name ?? review.propertyId} · {review.date}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
                      {review.reply ? (
                        <p className="mt-2 border-l-2 border-primary pl-3 text-sm text-muted-foreground">
                          {review.reply}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!(await remote.setReviewHidden(review.id, !review.hidden))) return;
                          setPlatform((s) => ({
                            reviews: s.reviews.map((r) =>
                              r.id === review.id ? { ...r, hidden: !r.hidden } : r,
                            ),
                          }));
                          toast.success(review.hidden ? cc.reviewRestored : cc.reviewHidden);
                        }}
                      >
                        {review.hidden ? (
                          <><Eye className="size-4" aria-hidden />{cc.unhideReview}</>
                        ) : (
                          <><EyeOff className="size-4" aria-hidden />{cc.hideReview}</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        aria-label={cc.deleteReview}
                        onClick={async () => {
                          if (!(await remote.deleteReview(review.id))) return;
                          setPlatform((s) => ({ reviews: s.reviews.filter((r) => r.id !== review.id) }));
                          toast.success(cc.reviewDeleted);
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="payouts" className="mt-0 min-w-0 max-w-full">
          {payouts.length === 0 ? <Empty text={t.app.admin.noPayouts} /> : null}
          <ul className="overflow-hidden border border-border bg-surface divide-y divide-border">
            {payouts.map((payout) => (
              <li
                key={payout.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/30 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{payout.hostName}</p>
                  <p className="text-sm text-muted-foreground">{payout.date}</p>
                  {payout.transferId ? (
                    <p className="truncate font-mono text-xs text-muted-foreground">{payout.transferId}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={cn(
                      "border-0",
                      payout.status === "paid" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700",
                    )}
                  >
                    {payout.status === "paid" ? t.app.admin.paid : t.app.admin.scheduled}
                  </Badge>
                  <span className="font-sans text-base font-semibold tabular-nums">{format(payout.amountUsd)}</span>
                  {payout.status === "paid" ? null : (
                    <Button
                      size="sm"
                      disabled={sendingPayoutId === payout.id}
                      onClick={async () => {
                        setSendingPayoutId(payout.id);
                        const updated = await remote.markPayoutPaid(payout.id);
                        setSendingPayoutId(null);
                        if (!updated) return;
                        const mapped = toPayout(updated);
                        setPlatform((s) => ({
                          payouts: s.payouts.map((p) => (p.id === payout.id ? mapped : p)),
                        }));
                        toast.success(ac.payoutSent);
                      }}
                    >
                      <Wallet className="size-4" aria-hidden />
                      {sendingPayoutId === payout.id ? ac.payoutSending : ac.payoutSend}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="reports" className="mt-0 min-w-0 max-w-full">
          <ReportsPanel />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 min-w-0 max-w-full">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const rate = Number(commission) || 0;
              if (!(await remote.saveCommission(rate))) return;
              setPlatform({ commissionRate: rate });
              toast.success(t.app.admin.settingsSaved);
            }}
             className="max-w-md space-y-4 rounded-lg border border-border bg-surface p-6 shadow-sm"
          >
            <div className="space-y-2">
              <Label htmlFor="commission">{t.app.admin.commission}</Label>
              <Input
                id="commission"
                type="number"
                min={0}
                max={50}
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t.app.admin.commissionHint}</p>
            </div>
            <Button type="submit">{t.app.admin.saveSettings}</Button>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="size-3.5" aria-hidden />
              {t.app.admin.auditNote}
            </p>
          </form>
        </TabsContent>
        </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

/** Monthly performance, best places, top hosts and cancellation reasons. */
function ReportsPanel() {
  const allProperties = useAllProperties();
  const { t } = useLanguage();
  const { format } = useCurrency();
  const [reports, setReports] = useState<AdminReportsDto | null>(null);
  const [loading, setLoading] = useState(backendEnabled);

  useEffect(() => {
    if (!backendEnabled) return;
    let active = true;
    void (async () => {
      const data = await remote.reports();
      if (!active) return;
      setReports(data ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Empty text={t.app.common.loading} />;

  const monthly = reports?.monthly ?? [];
  const topListings = reports?.topListings.filter((row) => row.bookings > 0) ?? [];
  const topHosts = reports?.topHosts.filter((row) => row.revenueUsd > 0 || row.listings > 0) ?? [];
  const cancellations = reports?.cancellations ?? [];

  if (monthly.length === 0 && topListings.length === 0 && topHosts.length === 0) {
    return <Empty text={t.app.admin.noReports} />;
  }

  const listingPeak = Math.max(1, ...topListings.map((row) => row.revenueUsd));
  const hostPeak = Math.max(1, ...topHosts.map((row) => row.revenueUsd));
  const cancelTotal = Math.max(1, cancellations.reduce((sum, row) => sum + row.count, 0));
  const rank = (i: number) => (
    <span className={cn(
      "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums",
      i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
    )}>{i + 1}</span>
  );
  const card = "min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6";

  const totalRevenue = monthly.reduce((sum, r) => sum + r.revenueUsd, 0);
  const totalCommission = monthly.reduce((sum, r) => sum + r.commissionUsd, 0);
  const totalBookings = monthly.reduce((sum, r) => sum + r.bookings, 0);
  const cancelCount = cancellations.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-4">
        <StatTile label={t.app.admin.reportRevenue} value={format(totalRevenue)} />
        <StatTile label={t.app.admin.reportCommission} value={format(totalCommission)} tone="primary" hint={totalRevenue > 0 ? `${Math.round((totalCommission / totalRevenue) * 100)}%` : undefined} />
        <StatTile label={t.app.admin.reportBookings} value={String(totalBookings)} />
        <StatTile label={t.app.admin.reportCancellations} value={String(cancelCount)} tone={cancelCount > 0 ? "danger" : "default"} />
      </div>

      <ChartPanel title={t.app.admin.reportMonthly} className="lg:col-span-2">
        <GroupedBars
          data={monthly.map((r) => ({ month: r.month, revenueUsd: Math.round(r.revenueUsd), commissionUsd: Math.round(r.commissionUsd) }))}
          xKey="month"
          series={[{ key: "revenueUsd", label: t.app.admin.reportRevenue }, { key: "commissionUsd", label: t.app.admin.reportCommission }]}
        />
      </ChartPanel>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold">{t.app.admin.reportTopListings}</h2>
        <ul className="mt-4 divide-y divide-border">
          {topListings.map((row, i) => {
            const property = allProperties.find((p) => p.id === row.propertyId);
            const image = property?.image ? mediaUrl(property.image) : null;
            return (
              <li key={row.propertyId}>
                <Link to="/stays/$propertyId" params={{ propertyId: row.propertyId }} className="-mx-2 flex min-w-0 items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/60">
                  {rank(i)}
                  <span className="size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                    {image ? <img src={image} alt="" className="size-full object-cover" loading="lazy" /> : <Home className="m-3 size-5 text-muted-foreground" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{row.name}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{row.bookings} {t.app.admin.reportBookings}</span>
                      {row.rating > 0 ? <span className="inline-flex items-center gap-0.5"><Star className="size-3 fill-current" aria-hidden />{row.rating.toFixed(1)}</span> : null}
                    </span>
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round((row.revenueUsd / listingPeak) * 100)}%` }} />
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{format(row.revenueUsd)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold">{t.app.admin.reportTopHosts}</h2>
        <ul className="mt-4 divide-y divide-border">
          {topHosts.map((row, i) => (
            <li key={row.hostId}>
              <Link to="/admin/hosts/$userId" params={{ userId: row.hostId }} className="-mx-2 flex min-w-0 items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/60">
                {rank(i)}
                <UserAvatar name={row.hostName} src={`${API_BASE_URL}/api/accounts/${encodeURIComponent(row.hostId)}/avatar`} className="size-11 text-base" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{row.hostName}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{row.listings} {t.app.admin.reportListings}</span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round((row.revenueUsd / hostPeak) * 100)}%` }} />
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{format(row.revenueUsd)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {cancellations.length > 0 ? (
        <section className={cn(card, "lg:col-span-2")}>
          <h2 className="font-display text-lg font-semibold">{t.app.admin.reportCancellations}</h2>
          <div className="mt-4">
            <Donut centerLabel={t.app.admin.reportCancellations} data={(() => {
              const sorted = [...cancellations].sort((x, y) => y.count - x.count);
              const head = sorted.slice(0, 4).map((r) => ({ name: r.reason, value: r.count }));
              const rest = sorted.slice(4).reduce((sum, r) => sum + r.count, 0);
              return rest > 0 ? [...head, { name: "Other", value: rest }] : head;
            })()} />
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {cancellations.map((row) => {
              const share = Math.round((row.count / cancelTotal) * 100);
              return (
                <li key={row.reason} className="min-w-0 rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-start gap-2 text-sm">
                      <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                      <span className="line-clamp-2 break-words">{row.reason}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">{row.count}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-destructive" style={{ width: `${share}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{share}% · {format(row.refundedUsd)} {t.app.admin.reportRefunded}</p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <EmptyState title={text} />
  );
}
