import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Share2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { remote } from "@/api/backend";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

type PropertyHeaderProps = {
  favorite: boolean;
  onShare: () => void;
  onToggleFavorite: () => void;
};

export function PropertyHeader({ favorite, onShare, onToggleFavorite }: PropertyHeaderProps) {
  const { locale, t } = useLanguage();
  const { session, threads } = usePlatform();
  const unread = threads.reduce((total, thread) => total + thread.unread, 0);
  const copy = pickCopy(locale, {
    en: { anywhere: "Anywhere", dates: "Any week", guests: "Add guests", host: "List your property", account: "Your account", signedOut: "You’re signed out" },
    fr: { anywhere: "Partout", dates: "Toutes dates", guests: "Ajouter des voyageurs", host: "Publier un logement", account: "Votre compte", signedOut: "Vous êtes déconnecté" },
    es: { anywhere: "Cualquier destino", dates: "Cualquier semana", guests: "Añadir huéspedes", host: "Publica tu alojamiento", account: "Tu cuenta", signedOut: "Has cerrado sesión" },
    de: { anywhere: "Überall", dates: "Beliebige Woche", guests: "Gäste hinzufügen", host: "Unterkunft anbieten", account: "Dein Konto", signedOut: "Du bist abgemeldet" },
    pt: { anywhere: "Qualquer destino", dates: "Qualquer semana", guests: "Adicionar hóspedes", host: "Publique o seu espaço", account: "A sua conta", signedOut: "Sessão terminada" },
  });

  return (
    <>
      <header className="relative z-40 border-b border-navy-foreground/10 bg-navy text-navy-foreground">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:h-20 lg:px-10">
          <Link to="/" aria-label={t.brand} className="flex shrink-0 items-center">
            <BrandLogo inverted className="h-11 sm:h-12" />
          </Link>

          <Button asChild variant="ghost" className="hidden h-11 rounded-full border border-navy-foreground/15 bg-navy-foreground/8 px-2 text-navy-foreground shadow-none hover:bg-navy-foreground/14 hover:text-navy-foreground md:inline-flex">
            <Link to="/stays" className="group">
              <span className="border-r border-navy-foreground/15 px-3 text-xs font-semibold">{copy.anywhere}</span>
              <span className="border-r border-navy-foreground/15 px-3 text-xs font-semibold">{copy.dates}</span>
              <span className="px-3 text-xs font-medium text-navy-muted">{copy.guests}</span>
              <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                <Search className="size-3.5" aria-hidden />
              </span>
            </Link>
          </Button>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <div className="hidden items-center gap-2 xl:flex">
              <CurrencySelector variant="dark" />
              <LanguageSelector variant="dark" />
            </div>
            <Button asChild variant="ghost" className="hidden rounded-full px-3 text-xs text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground lg:inline-flex">
              <Link to="/list-your-place">{copy.host}</Link>
            </Button>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-11 max-w-56 rounded-full border border-navy-foreground/20 bg-navy-foreground/8 py-1 pr-2 pl-3 text-navy-foreground shadow-none hover:bg-navy-foreground/14 hover:text-navy-foreground" aria-label={copy.account}>
                    <Menu className="size-4 text-navy-muted" aria-hidden />
                    <span className="hidden min-w-0 text-left sm:block">
                      <span className="block max-w-28 truncate text-xs font-semibold">{session.name}</span>
                      <span className="block text-[10px] font-medium text-navy-muted">{session.role === "host" ? t.app.nav.host : t.app.nav.trips}</span>
                    </span>
                    <span className="relative size-8 shrink-0">
                      <UserAvatar name={session.name} src={session.avatarUrl} className="size-8 bg-primary text-primary-foreground" />
                      {unread > 0 ? <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] leading-4 text-destructive-foreground">{unread}</span> : null}
                    </span>
                    <ChevronDown className="hidden size-3.5 text-navy-muted sm:block" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="px-3 py-2">
                    <span className="block truncate">{session.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{session.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="py-2.5"><Link to="/trips"><CalendarDays />{t.app.nav.trips}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5"><Link to="/messages"><MessageSquare />{t.app.nav.messages}{unread > 0 ? <span className="ml-auto text-xs font-semibold text-primary">{unread}</span> : null}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5"><Link to="/favourites"><Heart />{t.app.nav.favourites}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5"><Link to="/host" search={{ section: "overview" }}><LayoutDashboard />{t.app.nav.host}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5"><Link to="/profile"><UserRound />{t.app.nav.profile}</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer py-2.5 text-destructive focus:text-destructive"
                    onSelect={() => {
                      remote.signOut();
                      setPlatform({ session: null });
                      toast.success(copy.signedOut);
                    }}
                  >
                    <LogOut />{t.app.nav.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="h-11 rounded-full bg-surface px-4 text-navy shadow-none hover:bg-secondary sm:px-5">
                <Link to="/auth"><UserRound className="size-4" aria-hidden /><span>{t.app.auth.signIn}</span></Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Button variant="ghost" asChild className="-ml-3 rounded-lg px-3 text-sm font-semibold hover:bg-muted">
            <Link to="/stays"><ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden /> <span className="hidden sm:inline">{t.detail.back}</span><span className="sm:hidden">{t.detail.back}</span></Link>
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" onClick={onShare} className="rounded-lg px-3 text-sm font-semibold hover:bg-muted sm:px-4"><Share2 aria-hidden /><span className="hidden sm:inline">{t.detail.share}</span></Button>
            <Button variant="ghost" onClick={onToggleFavorite} aria-pressed={favorite} className="rounded-lg px-3 text-sm font-semibold hover:bg-muted sm:px-4">
              <Heart className={cn(favorite && "fill-destructive text-destructive")} aria-hidden />
              <span className="hidden sm:inline">{favorite ? t.listings.saved : t.listings.save}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}