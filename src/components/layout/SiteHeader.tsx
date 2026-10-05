import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { BedDouble, ChevronRight, Heart, Home, House, LayoutDashboard, LifeBuoy, Luggage, Menu, MessageSquare, Shield, UserRound, type LucideIcon } from "lucide-react";

import { AccountMenu } from "@/components/layout/AccountMenu";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePlatform } from "@/hooks/usePlatform";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon?: LucideIcon };

/** Shared signed-in chrome used by every in-app page. */
export function SiteHeader() {
  const { t, locale } = useLanguage();
  const { session, threads } = usePlatform();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { favorites } = useFavorites();
  const unread = threads.reduce((sum, thread) => sum + thread.unread, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuLabel = { en: "Menu", fr: "Menu", es: "Menú", de: "Menü", pt: "Menu" }[locale];
  const sheetLinks = [
    { to: "/stays", label: t.nav.stays, icon: BedDouble },
    { to: "/list-your-place", label: t.app.nav.host, icon: Home },
    { to: "/trips", label: t.app.nav.trips, icon: Luggage },
    { to: "/help", label: t.footer.help, icon: LifeBuoy },
  ] as const;

  // Only hosts see the host area, only admins the back office.
  const role = session?.role;
  const nav: NavItem[] = [
    { to: "/stays", label: t.nav.stays },
    { to: "/trips", label: t.app.nav.trips },
    { to: "/messages", label: t.app.nav.messages, icon: MessageSquare },
    ...(role === "host" || role === "admin"
      ? [{ to: "/host", label: t.app.nav.host, icon: LayoutDashboard }]
      : []),
    ...(role === "admin" ? [{ to: "/admin", label: t.app.nav.admin, icon: Shield }] : []),
  ];
  const mobileNav: NavItem[] = [
    { to: "/stays", label: t.nav.stays, icon: House },
    { to: "/favourites", label: t.app.nav.favourites, icon: Heart },
    { to: "/trips", label: t.app.nav.trips, icon: Luggage },
    { to: "/messages", label: t.app.nav.messages, icon: MessageSquare },
    { to: session ? "/profile" : "/auth", label: t.app.nav.profile, icon: UserRound },
  ];

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur max-lg:border-transparent max-lg:bg-surface/70 max-lg:backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" aria-label={t.brand} className="flex min-w-0 items-center">
            <BrandLogo className="h-14 sm:h-12" />
          </Link>
          <nav className="hidden items-center gap-5 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  pathname.startsWith(item.to) && "text-foreground",
                )}
              >
                {item.label}
                {item.to === "/messages" && unread > 0 ? (
                  <span className="ml-1.5 rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-bold text-lime-foreground">
                    {unread}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <CurrencySelector />
            <LanguageSelector />
          </div>
          <AccountMenu />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={menuLabel}
                className="size-10 shrink-0 rounded-full border border-border bg-surface/80 backdrop-blur lg:hidden"
              >
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="z-[100] flex w-80 max-w-[85vw] flex-col gap-0 border-border bg-surface p-0 lg:hidden">
              <SheetTitle className="sr-only">{menuLabel}</SheetTitle>
              <SheetDescription className="sr-only">{t.brand}</SheetDescription>
              <div className="flex items-center border-b border-border px-5 py-4">
                <BrandLogo className="h-10" />
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                {sheetLinks.map((l) => (
                  <SheetClose asChild key={l.to}>
                    <Link to={l.to} className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-base font-semibold transition-colors hover:bg-secondary active:bg-secondary">
                      <span className="flex items-center gap-3"><l.icon className="size-4 text-muted-foreground" aria-hidden />{l.label}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="flex flex-col gap-3 border-t border-border p-5">
                <div className="flex items-center gap-2"><LanguageSelector /><CurrencySelector /></div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

      {/* Outside the header: its backdrop blur would otherwise pin this bar to the top. */}
      <nav
        aria-label={{ en: "Mobile navigation", fr: "Navigation mobile", es: "Navegación móvil", de: "Mobile Navigation", pt: "Navegação móvel" }[locale]}
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-surface/95 px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur-xl lg:hidden"
      >
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.to) || (item.to === "/auth" && pathname === "/auth");
          return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors",
              active ? "text-primary" : "hover:text-foreground",
            )}
          >
            {Icon ? <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden /> : null}
            <span className="w-full truncate text-center">{item.label}</span>
            {(() => {
              const count = item.to === "/messages" ? unread : item.to === "/favourites" ? favorites.length : 0;
              return count > 0 ? (
                <span className="absolute top-0.5 left-[calc(50%+0.35rem)] grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] leading-4 font-bold text-destructive-foreground ring-2 ring-surface">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null;
            })()}
          </Link>
          );
        })}
      </nav>
    </>
  );
}
