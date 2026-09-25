import { usePropertyTypesVersion } from "@/hooks/useTaxonomy";
import {
  Car,
  ChefHat,
  Croissant,
  Laptop,
  PawPrint,
  Snowflake,
  Star,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import { CategoryIcon } from "@/components/listing/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { categoryLabel } from "@/i18n/categories";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { amenityIds, propertyCategories, type AmenityId } from "@/models/property";
import {
  PRICE_CEILING,
  PRICE_FLOOR,
  selectedAmenities,
  selectedEquipment,
  nightOptions,
  nightsBetween,
  ACCESSIBLE_EQUIPMENT_ID,
  type StaySearch,
} from "@/models/staySearch";
import { useSearchCopy } from "@/i18n/searchCopy";
import { interpolate } from "@/i18n/LanguageProvider";
import {
  equipmentLabel,
  findEquipment,
  activePopularEquipmentIds,
  useEquipmentVersion,
} from "@/data/equipment";
import { useClientCopy } from "@/i18n/clientCopy";
import { cn } from "@/lib/utils";

const amenityIcons: Record<AmenityId, LucideIcon> = {
  wifi: Wifi,
  pool: Waves,
  kitchen: ChefHat,
  parking: Car,
  airConditioning: Snowflake,
  workspace: Laptop,
  petFriendly: PawPrint,
  breakfast: Croissant,
};

type Update = (values: Partial<StaySearch>) => void;

export function FilterPanel({
  search,
  update,
  counts,
}: {
  search: StaySearch;
  update: Update;
  counts?: Record<string, number>;
}) {
  const { t, locale } = useLanguage();
  const cc = useClientCopy();
  const sc = useSearchCopy();
  const datedNights = nightsBetween(search.from, search.to);
  const { format } = useCurrency();
  useEquipmentVersion();
  usePropertyTypesVersion();
  const chosen = selectedAmenities(search.amenities);
  const chosenEquipment = selectedEquipment(search.equipment);

  const toggleEquipment = (id: string) => {
    const next = chosenEquipment.includes(id)
      ? chosenEquipment.filter((item) => item !== id)
      : [...chosenEquipment, id];
    update({ equipment: next.join(",") });
  };

  const toggleAmenity = (amenity: AmenityId) => {
    const next = chosen.includes(amenity)
      ? chosen.filter((item) => item !== amenity)
      : [...chosen, amenity];
    update({ amenities: next.join(",") });
  };

  return (
    <div className="divide-y divide-border">
      <Group label={t.explore.propertyType}>
        <div className="grid grid-cols-2 gap-2">
          {propertyCategories.map((category) => {
            const active = search.category === category;
            const count = counts?.[category];
            return (
              <button
                key={category}
                type="button"
                onClick={() => update({ category })}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors",
                  active
                    ? "border-foreground bg-secondary"
                    : "border-border hover:border-foreground/40 hover:bg-secondary/60",
                )}
              >
                {category === "all" ? (
                  <span className="grid size-7 place-items-center rounded-md border border-current text-[10px] font-bold">
                    ALL
                  </span>
                ) : (
                  <CategoryIcon category={category} />
                )}
                <span className="text-xs font-semibold">{categoryLabel(category, locale)}</span>
                {typeof count === "number" ? (
                  <span className="text-[11px] text-muted-foreground">{count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Group>

      <Group label={t.explore.priceRange}>
        <Slider
          min={PRICE_FLOOR}
          max={PRICE_CEILING}
          step={10}
          value={[search.minPrice, search.maxPrice]}
          onValueChange={([min, max]) =>
            update({ minPrice: min ?? PRICE_FLOOR, maxPrice: max ?? PRICE_CEILING })
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <PriceBox label={t.explore.priceFrom} value={format(search.minPrice)} />
          <PriceBox
            label={t.explore.priceTo}
            value={format(search.maxPrice)}
            suffix={search.maxPrice >= PRICE_CEILING ? "+" : ""}
          />
        </div>
      </Group>

      <Group label={t.explore.bedrooms}>
        <Segmented
          options={[0, 1, 2, 3]}
          value={search.beds}
          anyLabel={t.explore.any}
          onSelect={(beds) => update({ beds })}
        />
        
      </Group>
      

      <Group label={t.explore.bathrooms}>
        <Segmented
          options={[0, 1, 2, 3]}
          value={search.baths}
          anyLabel={t.explore.any}
          onSelect={(baths) => update({ baths })}
        />
      </Group>

      <Group label={t.explore.guestRating}>
        <div className="grid grid-cols-3 gap-2">
          {[0, 4.5, 4.8].map((rating) => (
            <Button
              key={rating}
              variant={search.rating === rating ? "default" : "outline"}
              size="sm"
              className="min-w-0 truncate px-1 text-[11px]"
              onClick={() => update({ rating })}
            >
              {rating ? (
                <>
                  <Star className="size-3 fill-current" />
                  {rating}+
                </>
              ) : (
                t.explore.any
              )}
            </Button>
          ))}
        </div>
      </Group>

      <Group label={t.explore.amenities}>
        <div className="flex flex-wrap gap-2">
          {amenityIds.map((amenity) => {
            const Icon = amenityIcons[amenity];
            const active = chosen.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40 hover:bg-secondary",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {t.explore.amenity[amenity]}
              </button>
            );
          })}
        </div>
      </Group>

      <Group label={cc.equipment}>
        <div className="flex flex-wrap gap-2">
          {activePopularEquipmentIds().map((id) => {
            const item = findEquipment(id);
            if (!item) return null;
            const active = chosenEquipment.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleEquipment(id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40 hover:bg-secondary",
                )}
              >
                {equipmentLabel(item, locale)}
                {item.paid ? (
                  <span className="text-[10px] font-bold opacity-70">{cc.paid}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Group>

      <Group label={sc.preferences}>
        <div className="space-y-4">
          <ToggleRow
            label={sc.pets}
            checked={chosen.includes("petFriendly")}
            onChange={() => toggleAmenity("petFriendly")}
          />
          <ToggleRow
            label={sc.accessible}
            checked={chosenEquipment.includes(ACCESSIBLE_EQUIPMENT_ID)}
            onChange={() => toggleEquipment(ACCESSIBLE_EQUIPMENT_ID)}
          />
          <ToggleRow
            label={sc.instant}
            hint={sc.instantHint}
            checked={search.instant}
            onChange={(instant) => update({ instant })}
          />
          <ToggleRow
            label={sc.freeCancel}
            hint={sc.freeCancelHint}
            checked={search.freeCancel}
            onChange={(freeCancel) => update({ freeCancel })}
          />
        </div>
      </Group>

      <Group label={sc.stayLength}>
        {datedNights ? (
          <p className="text-xs text-muted-foreground">
            {interpolate(sc.stayLengthDates, { n: datedNights })}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {nightOptions.map((option) => (
                <Button
                  key={option}
                  variant={search.nights === option ? "default" : "outline"}
                  size="sm"
                  className="px-1 text-xs"
                  onClick={() => update({ nights: option })}
                >
                  {option ? interpolate(sc.nights, { n: option }) : sc.any}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{sc.stayLengthHint}</p>
          </>
        )}
      </Group>

      <div className="flex items-start justify-between gap-4 py-5">
        <div>
          <p className="text-sm font-bold">{t.explore.superhostOnly}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.explore.superhostHint}</p>
        </div>
        <Switch
          checked={search.superhost}
          onCheckedChange={(superhost) => update({ superhost })}
          aria-label={t.explore.superhostOnly}
        />
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="py-5 first:pt-0">
      <legend className="mb-3 text-sm font-bold">{label}</legend>
      {children}
    </fieldset>
  );
}

function PriceBox({ label, value, suffix = "" }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function Segmented({
  options,
  value,
  anyLabel,
  onSelect,
}: {
  options: number[];
  value: number;
  anyLabel: string;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {options.map((option) => (
        <Button
          key={option}
          variant={value === option ? "default" : "outline"}
          size="sm"
          className="min-w-0 truncate px-0.5 text-[10px]"
          onClick={() => onSelect(option)}
        >
          {option ? `${option}+` : anyLabel}
        </Button>
      ))}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
