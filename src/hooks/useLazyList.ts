import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Progressive ("lazy") rendering of a long list: exposes only `count` items and
 * grows the window whenever the returned sentinel scrolls into view.
 */
export function useLazyList<T>(items: T[], step = 6) {
  const [count, setCount] = useState(step);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset the window whenever the underlying collection changes (filters, sort).
  useEffect(() => {
    setCount(step);
  }, [items, step]);

  const hasMore = count < items.length;

  const loadMore = useCallback(() => {
    setCount((current) => Math.min(current + step, items.length));
  }, [items.length, step]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return { visible: items.slice(0, count), hasMore, loadMore, sentinelRef };
}
