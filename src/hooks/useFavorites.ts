import { useCallback, useEffect, useState } from "react";

import { backendEnabled, remote } from "@/api/backend";
import { getAccessToken } from "@/api/http/client";
import { useSession } from "@/hooks/usePlatform";

const STORAGE_KEY = "nestara.favorites";

function readLocal(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saved stays. Signed in against the server they live in the account, so the
 * list follows the guest across devices; otherwise they stay on this device.
 */
export function useFavorites() {
  const session = useSession();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const local = readLocal();
    setFavorites(local);

    if (!backendEnabled || !getAccessToken() || !session) return;
    let cancelled = false;
    void (async () => {
      const serverIds = await remote.favoriteIds();
      if (cancelled || !serverIds) return;
      // First sign-in on this device: keep what the guest saved while signed out.
      const merged = Array.from(new Set([...serverIds, ...local]));
      if (merged.length !== serverIds.length) await remote.syncFavorites(merged);
      setFavorites(merged);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const toggle = useCallback(
    (id: string) => {
      let added = false;
      setFavorites((prev) => {
        added = !prev.includes(id);
        const next = added ? [...prev, id] : prev.filter((f) => f !== id);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      if (backendEnabled && getAccessToken()) {
        const wasAdded = added;
        void (async () => {
          const saved = await (wasAdded ? remote.addFavorite(id) : remote.removeFavorite(id));
          // The server refused: put the heart back the way it was, so the
          // device and the account never disagree.
          if (saved !== null) return;
          setFavorites((prev) => {
            const next = wasAdded ? prev.filter((f) => f !== id) : Array.from(new Set([...prev, id]));
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        })();
      }
      return added;
    },
    [],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
