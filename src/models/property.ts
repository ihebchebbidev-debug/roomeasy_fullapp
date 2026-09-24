import type { Locale } from "@/i18n/translations";

/** Domain model layer (MVVM: Model). No React, no data source details. */

export type AmenityId =
  | "wifi"
  | "pool"
  | "kitchen"
  | "parking"
  | "airConditioning"
  | "workspace"
  | "petFriendly"
  | "breakfast";

export const amenityIds: AmenityId[] = [
  "wifi",
  "pool",
  "kitchen",
  "parking",
  "airConditioning",
  "workspace",
  "petFriendly",
  "breakfast",
];

export type CancellationPolicy = "flexible" | "moderate" | "strict";

export type PropertyCategory =
  | "apartment"
  | "resort"
  | "lodge"
  | "hotel"
  | "villa"
  | "guesthouse"
  | "riad"
  | "studio"
  | "bungalow"
  | "chalet"
  | "hostel"
  | "camping"
  // Types added later by an admin in the back office.
  | (string & {});

export type PropertyHost = {
  id?: string;
  name: string;
  avatarUrl?: string;
  since: number;
  superhost: boolean;
};

export type Property = {
  /** When the stay was first added; used to show new stays first. */
  createdAt?: string;
  id: string;
  name: string;
  location: Partial<Record<Locale, string>> & { en: string };
  image: string;
  /** Extra photos shown in the detail gallery. */
  gallery?: string[];
  category: PropertyCategory;
  guests: number;
  beds: number;
  /** Bedrooms / rentable rooms; falls back to bed count when absent. */
  rooms?: number;
  baths: number;
  area: number;
  price: number;
  rating: number;
  reviewCount?: number;
  host?: PropertyHost;
  tags?: string[];
  amenities?: AmenityId[];
  /** Equipment and service ids from the equipment catalogue. */
  equipment?: string[];
  /** Cancellation terms the host chose for this stay. */
  cancellationPolicy?: CancellationPolicy;
  /** Postal / ZIP code of the area, searchable alongside the city name. */
  postal?: string;
  /** Neighbourhood or area name shown under the city. */
  neighbourhood?: string;
  /** One-line pitch used in search results and the listing header. */
  summary?: string;
  /** Long description written by the host. */
  description?: string;
  /** House rules written by the host. */
  houseRules?: string;
  /** Check-in / check-out times, "HH:MM". */
  checkIn?: string;
  checkOut?: string;
  /** Guests can book without host approval. */
  instantBook?: boolean;
  /** One-off cleaning fee in USD. */
  cleaningFee?: number;
  /** Shortest stay the host accepts. */
  minNights?: number;
  /** Approximate city coordinates; exact address is never stored. */
  coords?: { lat: number; lng: number };
};

/** Every property type a host can publish. */
export const propertyTypes: PropertyCategory[] = [
  "apartment",
  "villa",
  "resort",
  "hotel",
  "lodge",
  "guesthouse",
  "riad",
  "studio",
  "bungalow",
  "chalet",
  "hostel",
  "camping",
];

export const propertyCategories: ("all" | PropertyCategory)[] = ["all", ...propertyTypes];

/* Live property types, managed in the admin "Property types" section. */
export type PropertyTypeDto = {
  id: string;
  labels: { en: string; fr: string; es: string; de: string; pt: string };
  active: boolean;
  sortOrder: number;
};

const liveTypeLabels = new Map<string, PropertyTypeDto["labels"]>();
let typesVersion = 0;
const typeListeners = new Set<() => void>();

/** Replaces the type lists in place with the server's active types (admin order). */
export function setPropertyTypes(rows: PropertyTypeDto[]) {
  const active = rows.filter((row) => row.active);
  if (!active.length) return;
  for (const row of rows) liveTypeLabels.set(row.id, row.labels);
  propertyTypes.splice(0, propertyTypes.length, ...active.map((row) => row.id));
  propertyCategories.splice(0, propertyCategories.length, "all", ...propertyTypes);
  typesVersion += 1;
  typeListeners.forEach((listener) => listener());
}

/** Admin-written label for a type in a language, if any. */
export function livePropertyTypeLabel(id: string, locale: string): string | undefined {
  const labels = liveTypeLabels.get(id);
  if (!labels) return undefined;
  return (labels as Record<string, string>)[locale] || labels.en || undefined;
}

export function subscribePropertyTypes(listener: () => void) {
  typeListeners.add(listener);
  return () => {
    typeListeners.delete(listener);
  };
}
export const propertyTypesVersion = () => typesVersion;

export function cityName(property: Property, locale: Locale) {
  return property.location[locale] ?? property.location.en;
}

export function propertyPhotos(property: Property): string[] {
  return [property.image, ...(property.gallery ?? [])];
}
