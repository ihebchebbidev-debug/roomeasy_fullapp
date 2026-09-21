import { Star } from "lucide-react";

import { useLiveStats } from "@/components/home/LiveStats";
import { SearchBar } from "@/components/home/SearchBar";
import { Header } from "@/components/layout/Header";
import { HeroBackdrop } from "@/components/layout/HeroBackdrop";
import { usePlatform } from "@/hooks/usePlatform";
import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function Hero() {
  const { t, locale } = useLanguage();
  const { cookiesChoice } = usePlatform();
  const stats = useLiveStats();
  const badgeLabel = pickCopy(locale, {
    en: (n: number) => `${n} stays available`,
    fr: (n: number) => `${n} logements disponibles`,
    es: (n: number) => `${n} alojamientos disponibles`,
    de: (n: number) => `${n} Unterkünfte verfügbar`,
    pt: (n: number) => `${n} estadias disponíveis`,
  });

  return (
    <section id="top" className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="relative isolate flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-[2rem] sm:min-h-[calc(100svh-2.5rem)] sm:max-h-[46rem] sm:rounded-[2.5rem]">
        <HeroBackdrop />
        <span className="sr-only">{t.hero.imageAlt}</span>
        {/* layered scrim keeps white type readable over the bright sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(65%_45%_at_50%_58%,rgb(0_0_0/0.42),transparent_72%)]" />

        <Header />

        <div className="relative mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-5 pt-20 pb-5 text-center sm:pt-24 sm:pb-7 lg:pt-20">
          {stats.listings > 0 ? (
            <div className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-black/35 px-5 py-1.5 backdrop-blur-md">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.1em] text-lime uppercase sm:text-sm">
                <Star className="size-3.5 fill-lime" aria-hidden />
                {badgeLabel(stats.listings)}
              </span>
            </div>
          ) : null}

          <h1 className="mt-4 font-display text-[2rem] leading-[1.05] font-bold tracking-tight text-balance text-white drop-shadow-[0_2px_18px_rgb(0_0_0/0.55)] sm:mt-5 sm:text-5xl lg:text-[3.5rem]">
            {t.hero.titleLine1}
            <br className="hidden sm:block" /> {t.hero.titleLine2}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-balance text-white/95 drop-shadow-[0_1px_10px_rgb(0_0_0/0.5)] sm:mt-4 sm:text-base">
            {t.hero.subtitle}
          </p>
        </div>

        <div
          className={cn(
            "relative mx-auto w-full max-w-5xl px-4 pb-7 transition-all sm:px-8 sm:pb-8",
            !cookiesChoice && "pb-36 sm:pb-36",
          )}
        >
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
