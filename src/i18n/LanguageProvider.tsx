import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  extraTranslations,
  locales,
  translations,
  type Dictionary,
  type Locale,
} from "./translations";

import { catalogApi, catalogEnabled } from "@/api/http/catalog.http";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { splitLocale, withLocale, type UrlLocaleRef } from "./urlLocale";

const STORAGE_KEY = "nestara.locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) || typeof base !== "object") return override as T;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    result[key] = deepMerge((base as Record<string, unknown>)[key], value);
  }
  return result as T;
}

const dictionaries: Record<Locale, Dictionary> = {
  en: translations.en as Dictionary,
  fr: translations.fr as unknown as Dictionary,
  es: deepMerge(translations.en as Dictionary, extraTranslations.es),
  de: deepMerge(translations.en as Dictionary, extraTranslations.de),
  pt: deepMerge(translations.en as Dictionary, extraTranslations.pt),
};

function applyOverrides(base: Dictionary, overrides: Record<string, string>): Dictionary {
  const keys = Object.keys(overrides);
  if (!keys.length) return base;
  const root: Record<string, unknown> = { ...(base as unknown as Record<string, unknown>) };
  for (const key of keys) {
    const parts = key.split(".");
    let node = root;
    let ok = true;
    const leaf = parts.pop() as string;
    for (const part of parts) {
      const child = node[part];
      if (!child || typeof child !== "object" || Array.isArray(child)) {
        ok = false;
        break;
      }
      const copy = { ...(child as Record<string, unknown>) };
      node[part] = copy;
      node = copy;
    }
    // Only replace existing texts, so a typo can never break the app.
    if (ok && typeof node[leaf] === "string") node[leaf] = overrides[key] as string;
  }
  return root as unknown as Dictionary;
}

function isLocale(value: string | null): value is Locale {
  return !!value && locales.some((l) => l.code === value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const urlLocaleRef = (router.options.context as { urlLocale?: UrlLocaleRef } | undefined)?.urlLocale;
  // The language in the address (`/fr/...`) wins over any saved preference.
  const publicHref = useRouterState({ select: (s) => s.location.publicHref ?? s.location.href });
  const urlLocale = splitLocale(new URL(publicHref, "http://x").pathname).locale;
  const [locale, setLocaleState] = useState<Locale>(urlLocale ?? "en");

  useEffect(() => {
    if (urlLocale) {
      setLocaleState(urlLocale);
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
      return;
    }
    const detected = window.navigator.language?.slice(0, 2).toLowerCase() ?? "";
    if (isLocale(detected)) setLocaleState(detected);
  }, [urlLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    // Lets the server render titles in the chosen language on the next visit.
    document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Move to the same page in the chosen language (`/stays` → `/de/stays`).
    const current = new URL(window.location.href);
    const { path } = splitLocale(current.pathname);
    const target = `${withLocale(path, next)}${current.search}${current.hash}`;
    if (urlLocaleRef) urlLocaleRef.current = next;
    if (target !== `${current.pathname}${current.search}${current.hash}`) router.history.replace(target);
  }, [router, urlLocaleRef]);

  // Texts replaced by an administrator in the back office ("app.auth.signIn" → value).
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!catalogEnabled) return;
    let alive = true;
    catalogApi
      .publicTranslations(locale)
      .then((rows) => alive && setOverrides(rows ?? {}))
      .catch(() => alive && setOverrides({}));
    return () => {
      alive = false;
    };
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t: applyOverrides(dictionaries[locale], overrides) }),
    [locale, setLocale, overrides],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside a LanguageProvider");
  return ctx;
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
