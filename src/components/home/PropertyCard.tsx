import { Heart, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { cityName } from "@/models/property";
import type { Property } from "@/models/property";
import { categoryLabel } from "@/i18n/categories";
import { interpolate, useLanguage } from "@/i18n/LanguageProvider";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { cn } from "@/lib/utils";

type Props = {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
};

export function PropertyCard({ property, isFavorite, onToggleFavorite }: Props) {
  const { t, locale } = useLanguage();
  const { format } = useCurrency();
  const [loaded, setLoaded] = useState(false);

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative isolate aspect-square overflow-hidden rounded-2xl bg-secondary">
        <Link
          to="/stays/$propertyId"
          params={{ propertyId: property.id }}
          aria-label={interpolate(t.listings.viewDetails, { property: property.name })}
          className="absolute inset-0 z-[1] rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        {!loaded ? (
          <div className="absolute inset-0 animate-pulse bg-secondary" aria-hidden />
        ) : null}
        <img
          src={property.image}
          alt={property.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          width={900}
          height={900}
          className={cn(
            "size-full object-cover transition-[transform,opacity] duration-700 group-hover:scale-[1.04]",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />

        {property.host?.superhost && property.rating >= 4.85 ? (
          <span className="absolute top-3 left-3 z-[2] rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            {t.listings.guestFavourite}
          </span>
        ) : null}

        <button
          type="button"
          aria-label={t.listings.save}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(property.id)}
          className="absolute top-3 right-3 z-[2] grid size-8 place-items-center rounded-full text-surface transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
        >
          <Heart
            className={cn(
              "size-6 drop-shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_55%,transparent)]",
              isFavorite
                ? "fill-destructive text-destructive"
                : "fill-foreground/35 text-surface",
            )}
            aria-hidden
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-[15px] leading-tight font-semibold text-foreground">
            {categoryLabel(property.category, locale)} · {cityName(property, locale)}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-[13px] text-foreground">
            <Star className="size-3.5 fill-foreground text-foreground" aria-hidden />
            {property.reviewCount && property.rating > 0 ? (
              <>
                {property.rating.toFixed(2)}
                <span className="text-muted-foreground">({property.reviewCount})</span>
              </>
            ) : (
              ({ en: "New", fr: "Nouveau", es: "Nuevo", de: "Neu", pt: "Novo" } as Record<string, string>)[locale] ?? "New"
            )}
          </span>
        </div>

        <p className="mt-1 truncate text-[14px] text-muted-foreground">{property.name}</p>
        {property.host ? (
          <p className="truncate text-[14px] text-muted-foreground">
            {property.host.name}
          </p>
        ) : null}
        <p className="text-[14px] text-muted-foreground">
          {property.guests} {t.listings.guests} · {property.beds} {t.listings.beds}
        </p>

        <p className="mt-1.5 text-[15px] font-semibold text-foreground">
          {format(property.price)}{" "}
          <span className="font-normal text-muted-foreground">/{t.listings.night}</span>
        </p>
      </div>
    </article>
  );
}

