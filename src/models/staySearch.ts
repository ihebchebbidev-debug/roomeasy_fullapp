import { findEquipment } from "@/data/equipment";
import { amenityIds, propertyCategories, type AmenityId, type PropertyCategory } from "@/models/property";

export type SortOption = "recommended" | "price-low" | "price-high" | "rating" | "distance";

export const sortOptions: SortOption[] = [
  "recommended",
  "price-low",
  "price-high",
  "rating",
  "distance",
];

export type StaySearch = {
  where: string;
  from: string;
  to: string;
  guests: number;
  rooms: number;
  category: "all" | PropertyCategory;
  minPrice: number;
  maxPrice: number;
  rating: number;
  beds: number;
  baths: number;
  amenities: string;
  equipment: string;
  superhost: boolean;
  sort: SortOption;
};

export const PRICE_FLOOR = 0;
export const PRICE_CEILING = 450;

export const staySearchDefaults: StaySearch = {
  where: "",
  from: "",
  to: "",
  guests: 1,
  rooms: 1,
  category: "all",
  minPrice: PRICE_FLOOR,
  maxPrice: PRICE_CEILING,
  rating: 0,
  beds: 0,
  baths: 0,
  amenities: "",
  equipment: "",
  superhost: false,
  sort: "recommended",
};

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

/** Parses untrusted URL search params into a fully resolved query. */
export function parseStaySearch(input: Record<string, unknown>): StaySearch {
  const raw = input as Partial<Record<keyof StaySearch, unknown>>;
  const minPrice = clamp(raw.minPrice, PRICE_FLOOR, PRICE_CEILING, PRICE_FLOOR);
  const maxPrice = clamp(raw.maxPrice, PRICE_FLOOR, PRICE_CEILING, PRICE_CEILING);
  return {
    where: typeof raw.where === "string" ? raw.where.slice(0, 80) : "",
    from: typeof raw.from === "string" ? raw.from : "",
    to: typeof raw.to === "string" ? raw.to : "",
    guests: clamp(raw.guests, 1, 24, 1),
    rooms: clamp(raw.rooms, 1, 10, 1),
    category: propertyCategories.includes(raw.category as "all" | PropertyCategory)
      ? (raw.category as "all" | PropertyCategory)
      : "all",
    minPrice: Math.min(minPrice, maxPrice),
    maxPrice: Math.max(minPrice, maxPrice),
    rating: [0, 4.5, 4.8].includes(Number(raw.rating)) ? Number(raw.rating) : 0,
    beds: clamp(raw.beds, 0, 4, 0),
    baths: clamp(raw.baths, 0, 3, 0),
    amenities: selectedAmenities(raw.amenities).join(","),
    equipment: selectedEquipment(raw.equipment).join(","),
    superhost: raw.superhost === true || raw.superhost === "true",
    sort: (sortOptions as string[]).includes(String(raw.sort))
      ? (raw.sort as SortOption)
      : "recommended",
  };
}

/** Reads the comma-separated amenity list, keeping only known ids. */
export function selectedAmenities(value: unknown): AmenityId[] {
  if (typeof value !== "string" || !value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is AmenityId => amenityIds.includes(part as AmenityId));
}

/** Reads the comma-separated equipment list, keeping only catalogue ids. */
export function selectedEquipment(value: unknown): string[] {
  if (typeof value !== "string" || !value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => Boolean(findEquipment(part)));
}

/** Number of filters the guest has changed from the defaults. */
export function activeFilterCount(search: StaySearch): number {
  return [
    search.category !== "all",
    search.minPrice > PRICE_FLOOR,
    search.maxPrice < PRICE_CEILING,
    search.rating > 0,
    search.beds > 0,
    search.baths > 0,
    search.superhost,
    selectedAmenities(search.amenities).length > 0,
    selectedEquipment(search.equipment).length > 0,
  ].filter(Boolean).length;
}
