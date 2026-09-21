import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, UserRound } from "lucide-react";
import { toast } from "sonner";

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

/** Account drop-down (profile, settings, log out) shared by every header. */
export function AccountMenu({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { t, locale } = useLanguage();
  const { session } = usePlatform();
  const navigate = useNavigate();
  const copy = pickCopy(locale, {
    en: { settings: "Settings" },
    fr: { settings: "Paramètres" },
    es: { settings: "Ajustes" },
    de: { settings: "Einstellungen" },
    pt: { settings: "Definições" },
  });

  if (!session) {
    return (
      <Button
        asChild
        size="sm"
        className={cn(
          "rounded-full",
          variant === "dark" && "bg-lime text-lime-foreground hover:brightness-105",
        )}
      >
        <Link to="/auth">{t.app.auth.signIn}</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t.app.nav.profile}
        className="flex shrink-0 items-center gap-2 rounded-full bg-lime py-1.5 pr-2 pl-1.5 font-bold text-lime-foreground transition-transform hover:scale-[1.03] active:scale-95 sm:pr-4"
      >
        <UserAvatar name={session.name} src={session.avatarUrl} className="size-7 bg-lime-foreground/10" />
        <span className="hidden max-w-28 truncate text-sm sm:block">{session.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{session.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/profile">{t.app.nav.profile}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/trips">{t.app.nav.trips}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/favourites">{t.app.nav.favourites}</Link></DropdownMenuItem>
        {(session.role === "host" || session.role === "admin") && (
          <DropdownMenuItem asChild><Link to="/host" search={{ section: "overview" }}>{t.app.nav.host}</Link></DropdownMenuItem>
        )}
        {session.role === "admin" && (
          <DropdownMenuItem asChild><Link to="/admin">{t.app.nav.admin}</Link></DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2">
          <Link to="/profile">
            <Settings className="size-4" aria-hidden />
            {copy.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            remote.signOut();
            setPlatform({ session: null });
            toast.success(t.app.auth.signedOut);
            void navigate({ to: "/" });
          }}
          className="cursor-pointer gap-2"
        >
          <LogOut className="size-4" aria-hidden />
          {t.app.nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
