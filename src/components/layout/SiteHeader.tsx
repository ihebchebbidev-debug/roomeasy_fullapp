import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, House, LayoutDashboard, Luggage, MessageSquare, Shield, UserRound, type LucideIcon } from "lucide-react";

import { AccountMenu } from "@/components/layout/AccountMenu";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePlatform } from "@/hooks/usePlatform";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon?: LucideIcon };

/** Shared signed-in chrome used by every in-app page. */
export function SiteHeader() {
  const { t, locale } = useLanguage();
  const { session, threads } = usePlatform();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = threads.reduce((sum, thread) => sum + thread.unread, 0);

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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" aria-label={t.brand} className="flex min-w-0 items-center">
            <BrandLogo className="h-12" />
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
          <CurrencySelector />
          <LanguageSelector />
          <AccountMenu />
        </div>
      </div>

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
            {item.to === "/messages" && unread > 0 ? (
              <span className="absolute top-0.5 left-[calc(50%+0.35rem)] grid min-w-4 place-items-center rounded-full bg-lime px-1 text-[9px] leading-4 font-bold text-lime-foreground">
                {unread}
              </span>
            ) : null}
          </Link>
          );
        })}
      </nav>
    </header>
  );
}
