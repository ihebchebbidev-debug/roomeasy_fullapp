/** Browser-only memory of recent search result pages. */
export type SearchCacheEntry<T> = {
  at: number;
  items: T[];
  total: number;
  hasMore: boolean;
  counts: Record<string, number>;
};

export const searchCache = new Map<string, SearchCacheEntry<unknown>>();

/** Forget every remembered search, e.g. after a listing changed. */
export function clearSearchCache() {
  searchCache.clear();
}
