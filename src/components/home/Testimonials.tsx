import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { reviewsApi, type ReviewHighlightDto } from "@/api/http/platform.http";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

type Item = { name: string; quote: string; location: string; stay: string; avatar: string | null };

export function Testimonials() {
  const { t } = useLanguage();
  const [real, setReal] = useState<ReviewHighlightDto[] | null>(null);
  const [index, setIndex] = useState(0);

  // Only real guest reviews are ever shown. Nothing appears until a guest
  // has actually written one.
  useEffect(() => {
    let cancelled = false;
    reviewsApi
      .highlights()
      .then((rows) => {
        if (!cancelled) setReal(rows);
      })
      .catch(() => {
        if (!cancelled) setReal([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items: Item[] = (real ?? []).map((review) => ({
    name: review.author,
    quote: review.body,
    location: [review.city, review.country].filter(Boolean).join(", "),
    stay: review.propertyName,
    avatar: review.authorAvatar,
  }));

  const active = items[index] ?? items[0];
  if (!active) return null;

  const move = (dir: number) => setIndex((i) => (i + dir + items.length) % items.length);

  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-lime px-6 py-16 text-lime-foreground sm:px-12 sm:py-24">
        {/* original line-art accents */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <path
            d="M-20 90 C 220 10, 420 190, 700 110 S 1120 40, 1240 130"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M-20 520 C 260 600, 480 420, 760 500 S 1100 580, 1240 470"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        <svg
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-64 opacity-20"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-display text-xs font-bold tracking-[0.25em] uppercase opacity-60">
            {t.testimonials.subtitle}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {t.testimonials.title}
          </h2>

          <Quote className="mx-auto mt-10 size-8 opacity-40" aria-hidden />

          <blockquote
            key={active.name}
            className="mt-5 text-xl leading-snug font-medium text-balance duration-500 animate-in fade-in slide-in-from-bottom-2 sm:text-3xl"
          >
            “{active.quote}”
          </blockquote>

          <div className="mt-8 flex items-center justify-center gap-1" aria-label="5 / 5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-lime-foreground" aria-hidden />
            ))}
          </div>

          <p className="mt-6 font-display text-lg font-bold">{active.name}</p>
          <p className="text-sm opacity-70">{active.location}</p>
          <p className="mt-1 text-xs font-semibold tracking-wide uppercase opacity-55">
            {active.stay}
          </p>

          <div className="mt-10 flex items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label={t.testimonials.previous}
              onClick={() => move(-1)}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-lime-foreground/25 transition-all hover:-translate-x-0.5 hover:bg-lime-foreground hover:text-lime focus-visible:ring-2 focus-visible:ring-lime-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-lime focus-visible:outline-none"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {items.map((item, i) => (
                <button
                  key={`${item.name}-${i}`}
                  type="button"
                  aria-label={item.name}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "overflow-hidden rounded-full border-2 transition-all focus-visible:ring-2 focus-visible:ring-lime-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-lime focus-visible:outline-none",
                    i === index
                      ? "size-14 border-lime-foreground shadow-lg sm:size-16"
                      : "size-11 border-transparent opacity-55 hover:scale-105 hover:opacity-100 sm:size-12",
                  )}
                >
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt=""
                      loading="lazy"
                      width={512}
                      height={512}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center bg-lime-foreground/10 text-sm font-semibold">
                      {item.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label={t.testimonials.next}
              onClick={() => move(1)}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-lime-foreground/25 transition-all hover:translate-x-0.5 hover:bg-lime-foreground hover:text-lime focus-visible:ring-2 focus-visible:ring-lime-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-lime focus-visible:outline-none"
            >
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
