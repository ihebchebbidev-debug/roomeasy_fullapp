import { PRICE_CEILING } from "@/models/staySearch";
import type { AmenityId, Property, PropertyCategory } from "@/models/property";

/** Service layer (MVVM): the only place that knows where stays come from. */

export type PropertyQuery = {
  where: string;
  category: "all" | PropertyCategory;
  minPrice: number;
  maxPrice: number;
  rating: number;
  beds: number;
  baths: number;
  guests: number;
  rooms: number;
  amenities: AmenityId[];
  equipment: string[];
  superhostOnly: boolean;
  /** Stays that are not free for the chosen dates; hidden from the results. */
  unavailableIds?: string[];
};

export type Coords = { lat: number; lng: number };

export type PropertySort = "recommended" | "price-low" | "price-high" | "rating" | "distance";

export function findProperty(all: Property[], id: string): Property | undefined {
  return all.find((property) => property.id === id);
}

export function filterProperties(all: Property[], query: PropertyQuery): Property[] {
  const needle = query.where.trim().toLocaleLowerCase();
  const taken = query.unavailableIds ? new Set(query.unavailableIds) : null;
  return all.filter((property) => {
    const haystack = `${property.name} ${property.location.en} ${property.location.fr ?? ""} ${property.postal ?? ""}`.toLocaleLowerCase();
    return (
      (!taken || !taken.has(property.id)) &&
      (!needle || haystack.includes(needle)) &&
      (query.category === "all" || property.category === query.category) &&
      property.price >= query.minPrice &&
      // The top of the slider means "and above", so it never hides pricier stays.
      (query.maxPrice >= PRICE_CEILING || property.price <= query.maxPrice) &&
      property.rating >= query.rating &&
      property.beds >= query.beds &&
      (property.rooms ?? property.beds) >= query.rooms &&
      property.baths >= query.baths &&
      property.guests >= query.guests &&
      (!query.superhostOnly || Boolean(property.host?.superhost)) &&
      query.amenities.every((amenity) => property.amenities?.includes(amenity)) &&
      query.equipment.every((id) => property.equipment?.includes(id))
    );
  });
}

/**
 * Coordinates of the searched destination: the first matching stay's city
 * point, so "distance to destination" works without a geocoding service.
 */
export function destinationCoords(all: Property[], where: string): Coords | undefined {
  const needle = where.trim().toLocaleLowerCase();
  if (!needle) return undefined;
  const match = all.find((property) => {
    const haystack = `${property.location.en} ${property.location.fr ?? ""} ${property.postal ?? ""}`.toLocaleLowerCase();
    return haystack.includes(needle);
  });
  return match?.coords;
}

/** Great-circle distance in km between two approximate city points. */
export function distanceKm(a: Coords, b: Coords): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function sortProperties(list: Property[], sort: PropertySort, origin?: Coords): Property[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    if (sort === "distance") {
      if (!origin) return 0;
      const far = Number.POSITIVE_INFINITY;
      const da = a.coords ? distanceKm(origin, a.coords) : far;
      const db = b.coords ? distanceKm(origin, b.coords) : far;
      return da - db;
    }
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "rating") return b.rating - a.rating;
    const score = (p: Property) => p.rating * 20 + (p.host?.superhost ? 6 : 0) + (p.reviewCount ?? 0) / 50;
    return score(b) - score(a) || a.price - b.price;
  });
  return sorted;
}

/** Result counts per property type for the current query (facet counts). */
export function countByCategory(all: Property[], query: PropertyQuery): Record<string, number> {
  const counts: Record<string, number> = { all: filterProperties(all, { ...query, category: "all" }).length };
  for (const property of all) {
    const scoped = filterProperties(all, { ...query, category: property.category });
    counts[property.category] = scoped.length;
  }
  return counts;
}
