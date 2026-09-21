import { Bath, BedDouble, Check, Images, MapPin, Ruler, Star, Users } from "lucide-react";

import { AreaMap } from "@/components/listing/AreaMap";
import { EquipmentList } from "@/components/listing/EquipmentList";
import { Badge } from "@/components/ui/badge";
import type { HostListing } from "@/data/platform";
import { categoryLabel } from "@/i18n/categories";
import { useClientCopy } from "@/i18n/clientCopy";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useListingCopy } from "@/i18n/listingCopy";
import { cancellationLabel } from "@/lib/cancellation";
import { cityName, propertyPhotos, type Property } from "@/models/property";

/**
 * Read-only replica of the public stay page, used by moderators to review a
 * listing before approving it. Same content, no booking controls.
 */
export function ListingPreview({ property, listing }: { property: Property; listing: HostListing }) {
  const { t, locale } = useLanguage();
  const { format } = useCurrency();
  const lc = useListingCopy();
  const cc = useClientCopy();

  const photos = propertyPhotos(property);
  const city = cityName(property, locale);
  const facts: ReadonlyArray<readonly [typeof Users, string, string]> = [
    [Users, String(property.guests), lc.guests],
    [BedDouble, String(property.rooms ?? property.beds), lc.rooms],
    [Bath, String(property.baths), lc.baths],
    [Ruler, `${property.area}`, "m²"],
  ] as const;

  const sideShots = photos.slice(1, 5);
  const extraShots = photos.slice(5, 13);

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{categoryLabel(property.category, locale)}</Badge>
          <Badge variant={listing.approved ? "outline" : "default"}>{t.app.host[listing.status]}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            <Star className="size-3.5 fill-current" aria-hidden />
            {property.rating.toFixed(1)}
            {property.reviewCount ? (
              <span className="text-muted-foreground">
                · {property.reviewCount} {t.detail.reviews}
              </span>
            ) : null}
          </span>
        </div>
        <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight break-words sm:text-4xl">
          {property.name}
        </h1>
        <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">
            {property.neighbourhood ? `${property.neighbourhood}, ` : ""}
            {city}
            {property.postal ? ` · ${property.postal}` : ""}
          </span>
        </p>
      </header>

      <div className="grid gap-2 overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-[2fr_1fr]">
        <img
          src={photos[0]}
          alt={`${property.name}, ${city}`}
          loading="lazy"
          className="aspect-[4/3] w-full bg-muted object-cover sm:aspect-[3/2] lg:aspect-[4/3]"
        />
        {sideShots.length ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            {sideShots.map((photo) => (
              <img
                key={photo}
                src={photo}
                alt=""
                loading="lazy"
                className="aspect-square h-full w-full bg-muted object-cover lg:aspect-auto"
              />
            ))}
          </div>
        ) : null}
      </div>

      {extraShots.length ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <Images className="size-4" aria-hidden />
            {photos.length}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {extraShots.map((photo) => (
              <img
                key={photo}
                src={photo}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-lg bg-muted object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {facts.map(([Icon, value, label]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <dt className="truncate text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-semibold">{value}</dd>
                  </span>
                </div>
              ))}
            </dl>
          </section>

          {property.summary || property.description ? (
            <Section title={property.summary ?? t.detail.amenities}>
              {property.description ? (
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {property.description}
                </p>
              ) : null}
            </Section>
          ) : null}

          {property.amenities?.length ? (
            <Section title={t.detail.amenities}>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {property.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2.5 text-sm">
                    <Check className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 break-words">{t.explore.amenity[amenity] ?? amenity}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {property.equipment?.length ? (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <EquipmentList ids={property.equipment} />
            </div>
          ) : null}

          {property.houseRules ? (
            <Section title={t.detail.houseRules}>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {property.houseRules}
              </p>
            </Section>
          ) : null}

          <Section title={t.detail.area}>
            <AreaMap coords={property.coords} city={city} note={property.neighbourhood ?? city} />
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-2xl font-semibold">
              {format(listing.nightlyUsd)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">/ {t.listings.night}</span>
            </p>
            <dl className="mt-4 space-y-2.5 text-sm">
              {property.cleaningFee ? <Row label={lc.cleaningFee} value={format(property.cleaningFee)} /> : null}
              {property.minNights ? <Row label={lc.minNights} value={String(property.minNights)} /> : null}
              {property.checkIn ? <Row label={lc.checkIn} value={property.checkIn} /> : null}
              {property.checkOut ? <Row label={lc.checkOut} value={property.checkOut} /> : null}
              {property.cancellationPolicy ? (
                <Row label={lc.cancellation} value={cancellationLabel(property.cancellationPolicy, cc)} />
              ) : null}
              {property.host?.name ? <Row label={t.app.admin.host} value={property.host.name} /> : null}
            </dl>
          </div>
        </aside>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold break-words">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="min-w-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
    </div>
  );
}
