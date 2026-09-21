import { useCallback, useEffect, useRef, useState } from "react";

import { backendEnabled, toProperty } from "@/api/backend";
import { propertiesApi, type StayQueryDto } from "@/api/http/platform.http";
import type { Property } from "@/models/property";
import {
  PRICE_CEILING,
  PRICE_FLOOR,
  selectedAmenities,
  selectedEquipment,
  type StaySearch,
} from "@/models/staySearch";

/**
 * Turns the URL search state into the filters the service understands. Only
 * the filters the guest actually changed are sent, so the service can use its
 * indexes and the browser only ever receives the page it shows.
 */
export function stayQuery(search: StaySearch, locale: string): StayQueryDto {
  const amenities = selectedAmenities(search.amenities).join(",");
  const equipment = selectedEquipment(search.equipment).join(",");
  return {
    ...(search.where.trim() ? { where: search.where.trim() } : {}),
    ...(search.category !== "all" ? { category: search.category } : {}),
    ...(search.minPrice > PRICE_FLOOR ? { minPrice: search.minPrice } : {}),
    // The top of the slider means "and above", so no ceiling is sent.
    ...(search.maxPrice < PRICE_CEILING ? { maxPrice: search.maxPrice } : {}),
    ...(search.rating > 0 ? { rating: search.rating } : {}),
    ...(search.beds > 0 ? { beds: search.beds } : {}),
    ...(search.baths > 0 ? { baths: search.baths } : {}),
    ...(search.rooms > 1 ? { rooms: search.rooms } : {}),
    ...(search.guests > 1 ? { guests: search.guests } : {}),
    ...(amenities ? { amenities } : {}),
    ...(equipment ? { equipment } : {}),
    ...(search.superhost ? { superhost: true } : {}),
    // Dates are part of the query: stays already taken never come back.
    ...(search.from && search.to && search.to > search.from
      ? { from: search.from, to: search.to }
      : {}),
    sort: search.sort,
    locale,
  };
}

export type StaySearchResult = {
  items: Property[];
  total: number;
  counts: Record<string, number>;
  hasMore: boolean;
  /** First page still loading: the grid shows placeholders. */
  loading: boolean;
  /** A further page is on its way. */
  loadingMore: boolean;
  failed: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Paged search against the service. The results grow as the guest scrolls;
 * changing any filter starts a fresh first page.
 */
export function useStaySearch(query: StayQueryDto, pageSize = 12): StaySearchResult {
  const key = JSON.stringify(query);
  const [items, setItems] = useState<Property[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(backendEnabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Guards against a stale page landing after the filters moved on.
  const requestRef = useRef(0);
  // How many stays are already on screen, read when asking for the next page.
  const countRef = useRef(0);
  countRef.current = items.length;

  // First page whenever the filters or the sort order change.
  useEffect(() => {
    if (!backendEnabled) return;
    const parsed = JSON.parse(key) as StayQueryDto;
    const ticket = (requestRef.current += 1);
    setLoading(true);
    setFailed(false);

    void propertiesApi
      .search(parsed, pageSize, 0)
      .then((page) => {
        if (requestRef.current !== ticket) return;
        setItems(page.items.map(toProperty));
        setTotal(page.total);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        if (requestRef.current !== ticket) return;
        setItems([]);
        setTotal(0);
        setHasMore(false);
        setFailed(true);
      })
      .finally(() => {
        if (requestRef.current === ticket) setLoading(false);
      });

    void propertiesApi
      .categories(parsed)
      .then((result) => {
        if (requestRef.current === ticket) setCounts(result);
      })
      .catch(() => {
        if (requestRef.current === ticket) setCounts({});
      });
  }, [key, pageSize]);

  const loadMore = useCallback(() => {
    if (!backendEnabled) return;
    const ticket = requestRef.current;
    setLoadingMore(true);
    const parsed = JSON.parse(key) as StayQueryDto;
    void propertiesApi
      .search(parsed, pageSize, countRef.current)
      .then((page) => {
        if (requestRef.current !== ticket) return;
        setItems((existing) => {
          const known = new Set(existing.map((property) => property.id));
          return [...existing, ...page.items.map(toProperty).filter((item) => !known.has(item.id))];
        });
        setTotal(page.total);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        if (requestRef.current === ticket) setHasMore(false);
      })
      .finally(() => {
        if (requestRef.current === ticket) setLoadingMore(false);
      });
  }, [key, pageSize]);

  // Asks for the next page as the placeholder row scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  return { items, total, counts, hasMore, loading, loadingMore, failed, sentinelRef };
}
