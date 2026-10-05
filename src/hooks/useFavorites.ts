import { useCallback, useEffect, useState } from "react";

import { backendEnabled, remote } from "@/api/backend";
import { getAccessToken } from "@/api/http/client";
import { useSession } from "@/hooks/usePlatform";

const STORAGE_KEY = "nestara.favorites";
const SYNC_EVENT = "nestara:favorites-changed";

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

  const signedIn = Boolean(session && backendEnabled && getAccessToken());

  useEffect(() => {
    // Signed out: the list saved on this device. Signed in: only the
    // account's own list — never hearts left on this device by someone else.
    if (!signedIn) {
      setFavorites(readLocal());
      return;
    }
    setFavorites([]);
    let cancelled = false;
    void (async () => {
      const serverIds = await remote.favoriteIds();
      if (!cancelled && serverIds) setFavorites(serverIds);
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, session?.id]);

  // Keep every mounted copy (e.g. the nav badge) in step with changes made elsewhere.
  useEffect(() => {
    const onChange = (e: Event) => setFavorites((e as CustomEvent<string[]>).detail);
    window.addEventListener(SYNC_EVENT, onChange);
    return () => window.removeEventListener(SYNC_EVENT, onChange);
  }, []);

  const toggle = useCallback(
    (id: string) => {
      // Decide from the current list now: a state updater runs later, so
      // reading its result here would always say "not added" and send a remove.
      const added = !favorites.includes(id);
      const next = added ? [...favorites, id] : favorites.filter((f) => f !== id);
      setFavorites(next);
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: next }));
      if (!signedIn) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (signedIn) {
        void (async () => {
          const saved = await (added ? remote.addFavorite(id) : remote.removeFavorite(id));
          // The server refused: put the heart back the way it was, so the
          // device and the account never disagree.
          if (saved !== null) return;
          setFavorites((prev) => (added ? prev.filter((f) => f !== id) : Array.from(new Set([...prev, id]))));
        })();
      }
      return added;
    },
    [signedIn, favorites],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
