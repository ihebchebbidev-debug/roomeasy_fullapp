import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { remote } from "@/api/backend";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { useLanguage } from "@/i18n/LanguageProvider";

export function CookieBanner() {
  const { t } = useLanguage();
  const { cookiesChoice } = usePlatform();
  if (cookiesChoice) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-card/95 p-4 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.45)] backdrop-blur">
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <p className="text-sm leading-relaxed text-foreground">
            {t.app.cookies.text}{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
              {t.app.cookies.more}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-md text-xs font-semibold uppercase tracking-[0.1em]"
            onClick={() => { setPlatform({ cookiesChoice: "essential" }); void remote.cookieConsent("essential"); }}
          >
            {t.app.cookies.decline}
          </Button>
          <Button
            size="sm"
            className="rounded-md text-xs font-semibold uppercase tracking-[0.1em]"
            onClick={() => { setPlatform({ cookiesChoice: "accepted" }); void remote.cookieConsent("accepted"); }}
          >
            {t.app.cookies.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
