import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2 } from "lucide-react";

import backdrop from "@/assets/coming-soon-backdrop.jpg";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { unlockSite } from "@/lib/gate.functions";
import { useLanguage } from "@/i18n/LanguageProvider";
import { accountFlowCopy } from "@/i18n/accountFlowCopy";
import { Button } from "@/components/ui/button";

/**
 * Pre-launch curtain shown on the public domain.
 * The backdrop is a blurred capture of the real site; the password is verified server-side.
 */
export function ComingSoonGate() {
  const { locale } = useLanguage();
  const copy = accountFlowCopy[locale];
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !value.trim()) return;
    setBusy(true);
    setError(false);
    try {
      const result = await unlock({ data: { password: value } });
      if (result.ok) {
        await router.invalidate();
        return;
      }
      setError(true);
      setValue("");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy text-navy-foreground">
      <img
        src={backdrop}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-navy/82 via-navy/45 to-navy/90"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy/85 to-transparent"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between">
          <BrandLogo inverted className="h-11" />
          <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.28em] text-navy-foreground/55 sm:block">
            {copy.gateLaunch}
          </span>
        </header>

        <div className="flex flex-1 items-center py-16">
          <div className="w-full max-w-2xl">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-navy-foreground/60">
              {copy.gateEarly}
            </p>

            <h1 className="mt-6 font-display text-[2.75rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              {copy.gateTitle}
            </h1>

            <p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-navy-foreground/72">
              {copy.gateBody}
            </p>

            <form onSubmit={onSubmit} className="mt-10 max-w-md">
              <label
                htmlFor="gate-password"
                className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-navy-foreground/55"
              >
                {copy.gateCode}
              </label>

              <div className="mt-3 flex items-center gap-2 rounded-full border border-navy-foreground/18 bg-navy/55 p-1.5 pl-5 transition focus-within:border-navy-foreground/40">
                <input
                  id="gate-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={copy.gatePassword}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  aria-invalid={error}
                  className="h-11 flex-1 bg-transparent text-base text-navy-foreground outline-none placeholder:text-navy-foreground/40"
                />
                <Button
                  type="submit"
                  disabled={busy}
                  aria-label={copy.gateUnlock}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-navy-foreground px-5 text-sm font-semibold text-navy transition hover:bg-navy-foreground/90 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{copy.gateEnter}</span>
                </Button>
              </div>

              <p
                role="status"
                className={`mt-3 text-sm text-destructive transition-opacity ${error ? "opacity-100" : "opacity-0"}`}
              >
                {copy.gateInvalid}
              </p>
            </form>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-navy-foreground/12 pt-6 text-[0.8rem] text-navy-foreground/55 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 RoomEasy</span>
          <span className="flex flex-wrap gap-x-6 gap-y-1">
            <a href="mailto:contact@roomeasy.fr" className="transition hover:text-navy-foreground">
              contact@roomeasy.fr
            </a>
            <span>{copy.gateTagline}</span>
          </span>
        </footer>
      </div>
    </main>
  );
}
