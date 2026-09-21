import { Star, Users } from "lucide-react";

import feature1 from "@/assets/feature-1.jpg";
import feature2 from "@/assets/feature-2.jpg";
import { useLiveStats } from "@/components/home/LiveStats";
import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";

export function ValueSection() {
  const { t, locale } = useLanguage();
  const stats = useLiveStats();
  const reviewsLabel = pickCopy(locale, {
    en: (n: number) => `${n} guest reviews`,
    fr: (n: number) => `${n} avis voyageurs`,
    es: (n: number) => `${n} opiniones de huéspedes`,
    de: (n: number) => `${n} Gästebewertungen`,
    pt: (n: number) => `${n} avaliações de hóspedes`,
  });
  const ratingLabel = pickCopy(locale, {
    en: (v: string) => `${v} average rating`,
    fr: (v: string) => `${v} note moyenne`,
    es: (v: string) => `${v} valoración media`,
    de: (v: string) => `${v} Durchschnittsbewertung`,
    pt: (v: string) => `${v} avaliação média`,
  });

  return (
    <section id="values" className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="rounded-[2rem] bg-sky-panel px-6 py-16 sm:px-12 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {t.values.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-balance text-muted-foreground sm:text-base">
            {t.values.subtitle}
          </p>
        </div>


        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
          <ul className="space-y-7">
            {t.values.items.map((item) => (
              <li key={item.title} className="border-l-2 border-lime pl-4">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>

          <div className="relative mx-auto w-full max-w-md">
            <img
              src={feature2}
              alt=""
              loading="lazy"
              width={900}
              height={1100}
              className="aspect-[4/5] w-full rounded-[1.75rem] object-cover shadow-lg"
            />
            <img
              src={feature1}
              alt=""
              loading="lazy"
              width={800}
              height={600}
              className="absolute top-1/4 -left-2 w-40 rounded-2xl border-4 border-surface object-cover shadow-xl sm:-left-8 sm:w-56"
            />
            {stats.rating !== null ? (
              <div className="absolute -top-4 right-4 flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-xs font-semibold shadow-lg">
                <Star className="size-4 fill-foreground" aria-hidden />
                {ratingLabel(stats.rating.toFixed(1))}
              </div>
            ) : null}
            {stats.reviews > 0 ? (
              <div className="absolute -bottom-4 left-2 flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-xs font-semibold shadow-lg sm:-left-6">
                <Users className="size-4" aria-hidden />
                {reviewsLabel(stats.reviews)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
