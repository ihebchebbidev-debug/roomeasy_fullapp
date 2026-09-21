/**
 * Real platform figures derived from the live catalogue returned by the
 * service. Nothing here is invented: when the service has no listings or no
 * reviews yet, the matching figure is simply not shown.
 */
import { useAllProperties } from "@/hooks/useAllProperties";

export type LiveStats = {
  listings: number;
  reviews: number;
  /** Average rating across listings that actually have reviews, or null. */
  rating: number | null;
};

export function useLiveStats(): LiveStats {
  const properties = useAllProperties();
  const rated = properties.filter((p) => (p.reviewCount ?? 0) > 0);
  const reviews = rated.reduce((sum, p) => sum + (p.reviewCount ?? 0), 0);
  const rating = rated.length
    ? rated.reduce((sum, p) => sum + p.rating, 0) / rated.length
    : null;
  return { listings: properties.length, reviews, rating };
}
