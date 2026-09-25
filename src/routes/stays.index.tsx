import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  ArrowUpDown,
  CalendarDays,
  Filter,
  List,
  Map as MapIcon,
  MapPin,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { PropertyCard } from "@/components/home/PropertyCard";
import { equipmentLabel, findEquipment } from "@/data/equipment";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HeroBackdrop } from "@/components/layout/HeroBackdrop";
import { Footer } from "@/components/layout/Footer";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterPanel } from "@/components/listing/FilterPanel";
import { ResultsMap } from "@/components/listing/ResultsMap";
import { useSearchCopy } from "@/i18n/searchCopy";
import { stayQuery, useStaySearch } from "@/hooks/useStaySearch";
import {
  PRICE_CEILING,
  PRICE_FLOOR,
  activeFilterCount,
  formatBounds,
  parseBounds,
  parseStaySearch,
  selectedAmenities,
  selectedEquipment,
  staySearchDefaults,
  type SortOption,
  type StaySearch,
} from "@/models/staySearch";
import { Reveal } from "@/components/layout/Reveal";
import { useFavorites } from "@/hooks/useFavorites";
import { categoryLabel } from "@/i18n/categories";
import { useClientCopy } from "@/i18n/clientCopy";
import { dateFnsLocale } from "@/i18n/dateLocale";
import { interpolate, useLanguage } from "@/i18n/LanguageProvider";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { cn } from "@/lib/utils";
import { canonical, localeOf, KEYWORDS, publicPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/stays/")({
  validateSearch: (input: Partial<StaySearch>): Partial<StaySearch> =>
    parseStaySearch(input as Record<string, unknown>),

  head: ({ match }) => ({
    meta: publicPageMeta({
      locale: localeOf(match),
      title: "Locations de vacances en France — RoomEasy",
      description:
        "Comparez appartements, villas, chalets et maisons d'hôtes en France : filtres par ville, dates, budget et équipements, avis vérifiés et prix tout compris.",
      path: "/stays",
      keywords: KEYWORDS.search,
    }),
    links: canonical("/stays", localeOf(match)),
  }),
  component: StaysPage,
});

function StaysPage() {
  const search = parseStaySearch(Route.useSearch() as Record<string, unknown>);
  const navigate = useNavigate({ from: "/stays/" });
  const { t, locale } = useLanguage();
  const cc = useClientCopy();
  const sc = useSearchCopy();
  const area = parseBounds(search.bounds);
  const { format: formatCurrency } = useCurrency();
  const { isFavorite, toggle } = useFavorites();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const dateLocale = dateFnsLocale(locale);
  const range: DateRange | undefined = search.from
    ? { from: parseISO(search.from), to: search.to ? parseISO(search.to) : undefined }
    : undefined;

  const update = (values: Partial<StaySearch>) => {
    void navigate({ search: (previous) => ({ ...previous, ...values }), replace: true });
  };

  // The service does the filtering, the sorting and the paging: only the
  // stays shown on screen are downloaded, and stays already taken for the
  // chosen nights never come back at all.
  const {
    items: visible,
    total,
    counts,
    hasMore,
    loading,
    sentinelRef,
  } = useStaySearch(stayQuery(search, locale), search.view === "map" ? 100 : 12);
  const activeCount = activeFilterCount(search);
  const dateText = range?.from
    ? `${format(range.from, "dd MMM", { locale: dateLocale })}${range.to ? ` – ${format(range.to, "dd MMM", { locale: dateLocale })}` : ""}`
    : t.search.datePlaceholder;

  const reset = () => update(staySearchDefaults);

  return (
    <main className="min-h-screen bg-background pb-24 lg:pb-0">
      <SiteHeader />

      <section className="relative isolate overflow-hidden border-b border-border bg-sky-panel">
        <HeroBackdrop />
        {/* layered scrim keeps white type readable over the photos */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_35%_45%,rgb(0_0_0/0.35),transparent_75%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-sm font-bold text-white/90 drop-shadow-[0_1px_8px_rgb(0_0_0/0.5)]">{t.explore.eyebrow}</p>
          <div className="mt-2 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="max-w-3xl font-display text-3xl font-bold text-balance text-white drop-shadow-[0_2px_18px_rgb(0_0_0/0.55)] sm:text-5xl">
                {t.explore.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/95 drop-shadow-[0_1px_10px_rgb(0_0_0/0.5)] sm:text-base">
                {t.explore.subtitle}
              </p>
            </div>
            <p className="text-sm font-semibold text-white/90 drop-shadow-[0_1px_8px_rgb(0_0_0/0.5)]">
              {interpolate(t.explore.curated, { count: total })}
            </p>
          </div>

          <div className="mt-8 grid gap-2 rounded-2xl border border-border bg-surface p-2 shadow-lg sm:grid-cols-[1.2fr_1fr_0.8fr_auto] sm:rounded-full">
            <label className="flex min-w-0 items-center gap-3 rounded-xl px-4 py-3 hover:bg-secondary sm:rounded-full">
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="sr-only">{t.search.where}</span>
              <Input
                value={search.where}
                onChange={(event) => update({ where: event.target.value })}
                placeholder={cc.wherePlaceholder}
                className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-12 justify-start rounded-xl px-4 sm:rounded-full"
                >
                  <CalendarDays className="text-primary" />
                  <span className="truncate">{dateText}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[calc(100vw-2rem)] max-w-sm p-0">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(value) =>
                    update({
                      from: value?.from ? format(value.from, "yyyy-MM-dd") : "",
                      to: value?.to ? format(value.to, "yyyy-MM-dd") : "",
                    })
                  }
                  disabled={{ before: new Date() }}
                  locale={dateLocale}
                  fixedWeeks
                  className="mx-auto p-3 [--cell-size:2.35rem]"
                />
              </PopoverContent>
            </Popover>
            <GuestPicker
              guests={search.guests}
              rooms={search.rooms}
              onChange={(values) => update(values)}
            />
            <Button size="lg" className="h-12 rounded-xl px-7 sm:rounded-full">
              <Search />
              {t.search.search}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
          <aside className="sticky top-28 hidden lg:block">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{t.explore.filters}</h2>
              <Button variant="link" className="h-auto px-0" onClick={reset}>
                {t.explore.clearAll}
              </Button>
            </div>
            <FilterPanel search={search} update={update} counts={counts} />
          </aside>

          <div className="min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-xl font-bold sm:text-2xl">
                  {total} {t.explore.results}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {search.where || t.explore.worldwide}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter />
                      {t.explore.filters}
                      {activeCount ? ` (${activeCount})` : ""}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="max-h-[88svh] overflow-y-auto rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                  >
                    <SheetHeader className="text-left">
                      <SheetTitle>{t.explore.filters}</SheetTitle>
                      <SheetDescription>{t.explore.filterHint}</SheetDescription>
                    </SheetHeader>
                    <FilterPanel search={search} update={update} counts={counts} />
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={reset}>
                        {t.explore.clearAll}
                      </Button>
                      <Button onClick={() => setMobileFiltersOpen(false)}>
                        {t.explore.showResults.replace("{count}", String(total))}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="inline-flex rounded-full border border-border p-0.5" role="group">
                  <Button
                    size="sm"
                    variant={search.view === "list" ? "default" : "ghost"}
                    className="rounded-full"
                    aria-pressed={search.view === "list"}
                    onClick={() => update({ view: "list" })}
                  >
                    <List className="size-4" aria-hidden />
                    <span className="hidden sm:inline">{sc.list}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={search.view === "map" ? "default" : "ghost"}
                    className="rounded-full"
                    aria-pressed={search.view === "map"}
                    onClick={() => update({ view: "map" })}
                  >
                    <MapIcon className="size-4" aria-hidden />
                    <span className="hidden sm:inline">{sc.map}</span>
                  </Button>
                </div>
                <Select value={search.sort} onValueChange={(sort: SortOption) => update({ sort })}>
                  <SelectTrigger
                    aria-label={t.explore.sortBy}
                    className="h-10 w-11 justify-center gap-0 sm:w-52 sm:justify-between sm:gap-2 [&>svg:last-child]:hidden sm:[&>svg:last-child]:block"
                  >
                    <ArrowUpDown className="size-4 shrink-0 sm:hidden" />
                    <span className="hidden truncate text-sm sm:inline">
                      {sortLabels(t, cc)[search.sort]}
                    </span>
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="recommended">{t.explore.recommended}</SelectItem>
                    <SelectItem value="price-low">{t.explore.priceLow}</SelectItem>
                    <SelectItem value="price-high">{t.explore.priceHigh}</SelectItem>
                    <SelectItem value="rating">{t.explore.topRated}</SelectItem>
                    <SelectItem value="distance">{cc.sortDistance}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeCount > 0 ? (
              <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
                {search.category !== "all" ? (
                  <ActiveChip
                    label={categoryLabel(search.category, locale)}
                    onRemove={() => update({ category: "all" })}
                  />
                ) : null}
                {search.minPrice > PRICE_FLOOR || search.maxPrice < PRICE_CEILING ? (
                  <ActiveChip
                    label={`${formatCurrency(search.minPrice)} – ${formatCurrency(search.maxPrice)}${search.maxPrice >= PRICE_CEILING ? "+" : ""}`}
                    onRemove={() => update({ minPrice: PRICE_FLOOR, maxPrice: PRICE_CEILING })}
                  />
                ) : null}
                {search.rating > 0 ? (
                  <ActiveChip
                    label={`${search.rating}+ ★`}
                    onRemove={() => update({ rating: 0 })}
                  />
                ) : null}
                {search.beds > 0 ? (
                  <ActiveChip
                    label={`${search.beds}+ ${t.listings.beds}`}
                    onRemove={() => update({ beds: 0 })}
                  />
                ) : null}
                {search.baths > 0 ? (
                  <ActiveChip
                    label={`${search.baths}+ ${t.listings.baths}`}
                    onRemove={() => update({ baths: 0 })}
                  />
                ) : null}
                {area ? (
                  <ActiveChip label={sc.areaActive} onRemove={() => update({ bounds: "" })} />
                ) : null}
                {search.instant ? (
                  <ActiveChip label={sc.instant} onRemove={() => update({ instant: false })} />
                ) : null}
                {search.freeCancel ? (
                  <ActiveChip label={sc.freeCancel} onRemove={() => update({ freeCancel: false })} />
                ) : null}
                {search.nights > 0 ? (
                  <ActiveChip
                    label={interpolate(sc.nights, { n: search.nights })}
                    onRemove={() => update({ nights: 0 })}
                  />
                ) : null}
                {search.superhost ? (
                  <ActiveChip
                    label={t.explore.superhostOnly}
                    onRemove={() => update({ superhost: false })}
                  />
                ) : null}
                {selectedAmenities(search.amenities).map((amenity) => (
                  <ActiveChip
                    key={amenity}
                    label={t.explore.amenity[amenity]}
                    onRemove={() =>
                      update({
                        amenities: selectedAmenities(search.amenities)
                          .filter((item) => item !== amenity)
                          .join(","),
                      })
                    }
                  />
                ))}
                {selectedEquipment(search.equipment).map((id) => {
                  const item = findEquipment(id);
                  if (!item) return null;
                  return (
                    <ActiveChip
                      key={id}
                      label={equipmentLabel(item, locale)}
                      onRemove={() =>
                        update({
                          equipment: selectedEquipment(search.equipment)
                            .filter((value) => value !== id)
                            .join(","),
                        })
                      }
                    />
                  );
                })}
              </div>
            ) : null}

            {search.view === "map" ? (
              <>
                <ResultsMap
                  items={visible}
                  area={area}
                  formatPrice={(value, from) => formatCurrency(value, { from })}
                  searchLabel={sc.searchArea}
                  onSearchArea={(bounds) => update({ bounds: formatBounds(bounds) })}
                />
                {visible.some((item) => !item.coords) ? (
                  <p className="mt-2 text-xs text-muted-foreground">{sc.noCoords}</p>
                ) : null}
                {!loading && !visible.length ? (
                  <EmptyState
                    className="mt-6"
                    icon={SlidersHorizontal}
                    title={t.explore.noResults}
                    description={t.explore.noResultsHint}
                    action={<Button onClick={reset}>{t.explore.resetFilters}</Button>}
                  />
                ) : null}
              </>
            ) : loading ? (
              <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
                {[0, 1, 2, 3, 4, 5].map((key) => (
                  <div key={key} className="space-y-3">
                    <div className="aspect-[4/3] animate-pulse rounded-2xl bg-secondary" />
                    <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-secondary" />
                    <div className="h-3 w-1/3 animate-pulse rounded-full bg-secondary" />
                  </div>
                ))}
              </div>
            ) : visible.length ? (
              <>
                <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((property, index) => (
                    <Reveal key={property.id} delay={(index % 3) * 90}>
                      <PropertyCard
                        property={property}
                        priority={index < 3}
                        isFavorite={isFavorite(property.id)}
                        onToggleFavorite={(id) => {
                          const added = toggle(id);
                          toast(added ? t.listings.favouriteAdded : t.listings.favouriteRemoved);
                        }}
                      />
                    </Reveal>
                  ))}
                </div>
                {hasMore ? (
                  <div
                    ref={sentinelRef}
                    className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    aria-hidden
                  >
                    {[0, 1, 2].map((key) => (
                      <div key={key} className="space-y-3">
                        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-secondary" />
                        <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-secondary" />
                        <div className="h-3 w-1/3 animate-pulse rounded-full bg-secondary" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                className="mt-10"
                icon={SlidersHorizontal}
                title={t.explore.noResults}
                description={t.explore.noResultsHint}
                action={<Button onClick={reset}>{t.explore.resetFilters}</Button>}
              />
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function sortLabels(
  t: ReturnType<typeof useLanguage>["t"],
  cc: ReturnType<typeof useClientCopy>,
): Record<SortOption, string> {
  return {
    recommended: t.explore.recommended,
    "price-low": t.explore.priceLow,
    "price-high": t.explore.priceHigh,
    rating: t.explore.topRated,
    distance: cc.sortDistance,
  };
}

function GuestPicker({
  guests,
  rooms,
  onChange,
}: {
  guests: number;
  rooms: number;
  onChange: (values: { guests?: number; rooms?: number }) => void;
}) {
  const { t } = useLanguage();
  const cc = useClientCopy();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-12 justify-start rounded-xl px-4 sm:rounded-full">
          <Users className="text-primary" />
          <span className="truncate">
            {guests} {t.listings.guests} · {rooms} {cc.rooms.toLowerCase()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-4 p-4">
        <CounterRow
          title={t.detail.guestsLabel}
          hint={t.explore.guestHint}
          value={guests}
          min={1}
          max={24}
          onChange={(value) => onChange({ guests: value })}
        />
        <CounterRow
          title={cc.rooms}
          hint={cc.roomsHint}
          value={rooms}
          min={1}
          max={10}
          onChange={(value) => onChange({ rooms: value })}
        />
      </PopoverContent>
    </Popover>
  );
}

function CounterRow({
  title,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  title: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="size-8 rounded-full"
          aria-label={`- ${title}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus />
        </Button>
        <span className="w-4 text-center text-sm font-bold tabular-nums">{value}</span>
        <Button
          size="icon"
          variant="outline"
          className="size-8 rounded-full"
          aria-label={`+ ${title}`}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      {label}
      <X className="size-3.5" />
    </button>
  );
}
