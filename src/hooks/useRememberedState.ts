import { useEffect, useRef, useState } from "react";

/**
 * Like useState, but kept for the browser tab (sessionStorage), so filters
 * and searches are still there when the person comes back with Back.
 * Pass no key to behave exactly like useState.
 */
export function useRememberedState<T>(key: string | undefined, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    if (!key) return;
    try {
      const raw = window.sessionStorage.getItem(`remember:${key}`);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* storage unavailable */
    }
    loaded.current = true;
  }, [key]);

  useEffect(() => {
    if (!key || !loaded.current) return;
    try {
      window.sessionStorage.setItem(`remember:${key}`, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
