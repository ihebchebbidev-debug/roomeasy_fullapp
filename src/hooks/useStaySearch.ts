import { useCallback, useEffect, useRef, useState } from "react";
import { searchCache as sharedSearchCache, type SearchCacheEntry } from "@/lib/searchCache";

import { backendEnabled, toProperty } from "@/api/backend";
import { propertiesApi, type StayQueryDto } from "@/api/http/platform.http";
import type { Property } from "@/models/property";
import {
  PRICE_CEILING,
  PRICE_FLOOR,
  selectedAmenities,
  selectedEquipment,
  nightsBetween,
  parseBounds,
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
    // With both dates set, the stay length always comes from the dates.
  const nights = search.from && search.to ? nightsBetween(search.from, search.to) : search.nights;
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
    ...(search.instant ? { instantBook: true } : {}),
    ...(search.freeCancel ? { freeCancellation: true } : {}),
    // Chosen dates decide the stay length; otherwise the stay-length filter does.
    ...(nights ? { nights } : {}),
    ...(parseBounds(search.bounds) ? { bounds: search.bounds } : {}),
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

type CacheEntry = SearchCacheEntry<Property>;
// Browser-only memory of recent first pages (the effect never runs on the server).
// Kept short, always refreshed in the background, and wiped whenever this
// browser changes anything on the server (hiding a listing, a booking...).
const searchCache = sharedSearchCache as Map<string, CacheEntry>;
const CACHE_TTL_MS = 30_000;
function trimCache() {
  while (searchCache.size > 30) {
    const oldest = searchCache.keys().next().value;
    if (oldest === undefined) break;
    searchCache.delete(oldest);
  }
}

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
    const cacheKey = `${pageSize}|${key}`;
    const cached = searchCache.get(cacheKey);
    setFailed(false);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      // Show the remembered results instantly, then refresh quietly.
      setItems(cached.items);
      setTotal(cached.total);
      setHasMore(cached.hasMore);
      setCounts(cached.counts);
      setLoading(false);
    } else {
      setLoading(true);
    }

    void propertiesApi
      .search(parsed, pageSize, 0)
      .then((page) => {
        if (requestRef.current !== ticket) return;
        const mapped = page.items.map(toProperty);
        setItems(mapped);
        setTotal(page.total);
        setHasMore(page.hasMore);
        const entry = searchCache.get(cacheKey);
        searchCache.set(cacheKey, {
          at: Date.now(),
          items: mapped,
          total: page.total,
          hasMore: page.hasMore,
          counts: entry?.counts ?? {},
        });
        trimCache();
      })
      .catch(() => {
        if (requestRef.current !== ticket) return;
        // Never keep showing remembered results the server could not confirm.
        searchCache.delete(cacheKey);
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
        if (requestRef.current !== ticket) return;
        setCounts(result);
        const entry = searchCache.get(cacheKey);
        if (entry) entry.counts = result;
      })
      .catch(() => {
        if (requestRef.current === ticket && !cached) setCounts({});
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
