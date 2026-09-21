import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Plus,
  Star,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import authWallpaper from "@/assets/auth-wallpaper.jpg";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePlatform } from "@/hooks/usePlatform";
import { pickCopy } from "@/i18n/copy";
import { useExtra } from "@/i18n/extra";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

type HostSection = "overview" | "requests" | "listings" | "calendar" | "stats" | "payouts" | "reviews" | "team";
type Item = { to: "/host" | "/trips" | "/favourites" | "/messages" | "/profile"; label: string; icon: LucideIcon; section?: HostSection };

function SidebarBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <img src={authWallpaper} alt="" width={1024} height={1536} className="size-full object-cover object-center opacity-[0.14]" />
      <div className="absolute inset-0 bg-sidebar/85" />
    </div>
  );
}

export function AccountShell({ children, title, subtitle, actions }: { children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode }) {
  const { locale, t } = useLanguage();
  const x = useExtra();
  const { threads, session } = usePlatform();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeHostSection = useRouterState({ select: (state) => (state.location.search as { section?: HostSection }).section });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const unread = threads.reduce((total, thread) => total + thread.unread, 0);
  const copy = pickCopy(locale, {
    en: { workspace: "Account workspace", overview: "Overview", listings: "Listings", newListing: "New listing", collapse: "Collapse menu", expand: "Expand menu", open: "Open account menu" },
    fr: { workspace: "Espace compte", overview: "Aperçu", listings: "Annonces", newListing: "Nouvelle annonce", collapse: "Réduire le menu", expand: "Ouvrir le menu", open: "Ouvrir le menu du compte" },
    es: { workspace: "Espacio de cuenta", overview: "Resumen", listings: "Anuncios", newListing: "Nuevo anuncio", collapse: "Contraer menú", expand: "Abrir menú", open: "Abrir el menú de la cuenta" },
    de: { workspace: "Kontobereich", overview: "Übersicht", listings: "Anzeigen", newListing: "Neue Anzeige", collapse: "Menü einklappen", expand: "Menü öffnen", open: "Kontomenü öffnen" },
    pt: { workspace: "Área da conta", overview: "Resumo", listings: "Anúncios", newListing: "Novo anúncio", collapse: "Recolher menu", expand: "Abrir menu", open: "Abrir menu da conta" },
  });
  const accountItems: Item[] = [
    { to: "/host", section: "overview", label: copy.overview, icon: LayoutDashboard },
    { to: "/trips", label: t.app.nav.trips, icon: CalendarDays },
    { to: "/favourites", label: t.app.nav.favourites, icon: Heart },
    { to: "/messages", label: t.app.nav.messages, icon: MessageSquare },
    { to: "/profile", label: t.app.nav.profile, icon: UserRound },
  ];
  const hostItems: Item[] = [
    { to: "/host", section: "requests", label: t.app.host.requests, icon: ClipboardCheck },
    { to: "/host", section: "listings", label: t.app.host.listings, icon: Building2 },
    { to: "/host", section: "calendar", label: t.app.host.calendar, icon: CalendarRange },
    { to: "/host", section: "stats", label: x.statsTitle, icon: BarChart3 },
    { to: "/host", section: "payouts", label: t.app.host.payouts, icon: Wallet },
    { to: "/host", section: "reviews", label: t.app.host.reviews, icon: Star },
    { to: "/host", section: "team", label: t.app.host.team, icon: Users },
  ];

  const navigationGroup = (items: Item[], mobile = false) => (
    <div className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.to && (item.to !== "/host" || item.section === (activeHostSection ?? "overview"));
        const Icon = item.icon;
        return (
          <Link
            key={`${item.to}-${item.section ?? item.label}`}
            to={item.to}
            {...(item.to === "/host" ? { search: item.section ? { section: item.section } : {} } : {})}
            onClick={() => mobile && setMobileNavOpen(false)}
            aria-current={active ? "page" : undefined}
            title={!mobile && collapsed ? item.label : undefined}
            className={cn(
              "group relative grid h-10 items-center rounded-lg text-sm font-semibold transition-colors duration-200",
              !mobile && collapsed ? "grid-cols-1 place-items-center" : "grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-3",
              active ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Icon className="size-[1.125rem] shrink-0" strokeWidth={1.8} aria-hidden />
            {mobile || !collapsed ? <span className="truncate">{item.label}</span> : null}
            {(mobile || !collapsed) && item.to === "/messages" && unread > 0 ? <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] leading-5 text-primary-foreground">{unread}</span> : null}
          </Link>
        );
      })}
    </div>
  );

  const navigation = (mobile = false) => (
    <nav aria-label={copy.workspace}>
      {navigationGroup(accountItems, mobile)}
      <p className={cn("px-3 pt-7 pb-3 text-[10px] font-semibold uppercase text-muted-foreground", !mobile && collapsed && "sr-only")}>{t.app.host.title}</p>
      {navigationGroup(hostItems, mobile)}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background font-sans lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
      <aside className={cn("sticky top-0 z-50 hidden h-screen overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 lg:flex lg:flex-col", collapsed ? "w-20" : "w-64")}>
        <SidebarBackdrop />
        <div className={cn("relative flex h-16 items-center", collapsed ? "justify-center px-3" : "px-5")}>
          <Link to="/" aria-label={t.brand} className="min-w-0">
            {collapsed ? <span className="grid size-9 place-items-center rounded-lg bg-primary font-display font-bold text-primary-foreground">R</span> : <BrandLogo className="h-14" />}
          </Link>
        </div>
        <div className="relative flex-1 overflow-y-auto px-3 pb-3">
          {!collapsed ? <p className="px-3 pt-5 pb-3 text-[10px] font-semibold uppercase text-muted-foreground">{copy.workspace}</p> : <div className="h-5" />}
          {navigation()}
          <Button asChild className={cn("mt-5 w-full rounded-lg shadow-none", collapsed && "px-0")} title={collapsed ? copy.newListing : undefined}>
            <Link to="/list-your-place"><Plus className="size-4" aria-hidden />{!collapsed ? copy.newListing : null}</Link>
          </Button>
        </div>
        <div className="relative border-t border-sidebar-border bg-sidebar/35 p-3 backdrop-blur-sm">
          <Link to="/profile" className={cn("flex items-center rounded-lg p-2 transition-colors hover:bg-muted", collapsed ? "justify-center" : "gap-3")}>
            <UserAvatar name={session?.name ?? t.app.nav.profile} src={session?.avatarUrl} className="size-9" />
            {!collapsed ? <span className="min-w-0"><span className="block truncate text-sm font-semibold">{session?.name ?? t.app.nav.profile}</span><span className="block truncate text-xs text-muted-foreground">{session?.email ?? copy.workspace}</span></span> : null}
          </Link>
          <Button variant="ghost" size="sm" className={cn("mt-2 w-full text-muted-foreground", collapsed ? "px-0" : "justify-start")} onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? copy.expand : copy.collapse}>
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}{!collapsed ? copy.collapse : null}
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border bg-surface/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label={copy.open}><Menu className="size-5" /></Button>
              <SheetContent side="left" className="flex w-[17rem] flex-col gap-0 overflow-hidden bg-sidebar p-0 sm:max-w-[17rem]">
                <SidebarBackdrop />
                <SheetHeader className="relative border-b border-sidebar-border bg-sidebar/35 px-5 py-3 text-left backdrop-blur-sm"><SheetTitle><BrandLogo className="h-14" /></SheetTitle><SheetDescription className="sr-only">{copy.workspace}</SheetDescription></SheetHeader>
                <div className="relative min-h-0 flex-1 overflow-y-auto p-3"><p className="px-3 py-3 text-[10px] font-semibold uppercase text-muted-foreground">{copy.workspace}</p>{navigation(true)}<Button asChild className="mt-5 w-full"><Link to="/list-your-place" onClick={() => setMobileNavOpen(false)}><Plus className="size-4" />{copy.newListing}</Link></Button></div>
              </SheetContent>
            </Sheet>
            <Link to="/" aria-label={t.brand} className="lg:hidden"><BrandLogo className="h-9" /></Link>
            <p className="hidden truncate font-display text-sm font-semibold lg:block">{title ?? copy.workspace}</p>
          </div>
          <div className="flex items-center gap-2"><CurrencySelector /><LanguageSelector /><AccountMenu /></div>
        </header>
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {title ? <div className="mx-auto mb-7 flex max-w-7xl flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>{subtitle ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}</div>{actions ? <div className="w-full shrink-0 sm:w-auto">{actions}</div> : null}</div> : null}
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}