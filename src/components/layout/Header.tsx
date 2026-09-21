import { BedDouble, ChevronRight, Home, LifeBuoy, Luggage, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";

import { AccountMenu } from "@/components/layout/AccountMenu";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePlatform } from "@/hooks/usePlatform";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useLanguage();
  const { session } = usePlatform();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    const id = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(id);
  }, [open]);

  const links = [
    { to: "/stays", label: t.nav.stays, icon: BedDouble },
    { to: "/list-your-place", label: t.app.nav.host, icon: Home },
    { to: "/trips", label: t.app.nav.trips, icon: Luggage },
    { to: "/help", label: t.footer.help, icon: LifeBuoy },
  ] as const;

  const accountTo = session ? "/profile" : "/auth";
  const accountLabel = session ? session.name : t.app.auth.signIn;

  const linkClass =
    "relative text-sm font-medium text-white/85 transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-lime after:transition-all hover:text-lime hover:after:w-full focus-visible:text-lime focus-visible:outline-none focus-visible:after:w-full";

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
        <Link to="/" aria-label={t.brand} className="flex min-w-0 items-center">
          <BrandLogo inverted className="h-14 sm:h-16" />
        </Link>

        <nav className="hidden justify-center gap-8 lg:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <CurrencySelector variant="dark" />
            <LanguageSelector variant="dark" />
          </div>
          <AccountMenu variant="dark" />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-lime focus-visible:outline-none lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mounted ? createPortal(
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className={cn(
              "absolute inset-0 bg-foreground/50 backdrop-blur-sm transition-opacity duration-300",
              open ? "opacity-100" : "opacity-0",
            )}
          />
          <aside
            className={cn(
              "absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out",
              open ? "translate-x-0" : "translate-x-full",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <BrandLogo className="h-10" />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-base font-semibold transition-colors hover:bg-secondary active:bg-secondary"
                >
                  <span className="flex items-center gap-3">
                    <l.icon className="size-4 text-muted-foreground" aria-hidden />
                    {l.label}
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              ))}

            </nav>

            <div className="flex flex-col gap-3 border-t border-border p-5">
              <div className="flex items-center gap-2">
                <LanguageSelector />
                <CurrencySelector />
              </div>
              <Link
                to={accountTo}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-lime px-5 py-3.5 text-sm font-bold text-lime-foreground transition-transform active:scale-95"
              >
                <UserRound className="size-4" aria-hidden />
                <span className="max-w-40 truncate">{accountLabel}</span>
              </Link>
            </div>
          </aside>
        </div>,
        document.body,
      ) : null}
    </header>
  );
}
