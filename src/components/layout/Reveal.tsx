import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Cards that scroll into view in the same moment are queued so they appear
 * one after another (a cascade) instead of all at once.
 */
const STEP_MS = 110;
const MAX_QUEUE_DELAY = 900;
let queueEndsAt = 0;

function nextCascadeDelay(extra: number) {
  const now = performance.now();
  const start = Math.max(now, queueEndsAt);
  const delay = Math.min(start - now, MAX_QUEUE_DELAY);
  queueEndsAt = now + delay + STEP_MS;
  return Math.round(delay + extra);
}

/** Lifts, un-blurs and fades its children into place the first time they scroll into view, one by one. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Optional extra delay on top of the automatic cascade. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shownDelay, setShownDelay] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShownDelay(0);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          // The automatic cascade handles ordering; the passed delay is kept small.
          setShownDelay(nextCascadeDelay(Math.min(delay, 60)));
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  const shown = shownDelay !== null;

  return (
    <div
      ref={ref}
      style={shown ? { animationDelay: `${shownDelay}ms` } : undefined}
      className={cn(shown ? "reveal-in" : "reveal-pending", className)}
    >
      {children}
    </div>
  );
}
