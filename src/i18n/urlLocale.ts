/**
 * Language prefixes in page addresses: `/fr/stays`, `/de/stays/abc`, ...
 *
 * The router strips the prefix before matching (so route files stay
 * language-free) and adds it back to every link it builds. An address
 * without a prefix still works: it is the "x-default" version and picks the
 * language from the visitor's saved choice or browser.
 */
export const URL_LOCALES = ["en", "fr", "es", "de", "pt"] as const;
export type UrlLocale = (typeof URL_LOCALES)[number];

/** Addresses that are never language-prefixed (files, feeds, API). */
const UNPREFIXED = /^\/(api|_serverFn|_build|assets|sitemap\.xml|robots\.txt|favicon|og-image)/;

export function isUrlLocale(value: string | null | undefined): value is UrlLocale {
  return !!value && (URL_LOCALES as readonly string[]).includes(value);
}

/** `/fr/stays` → { locale: "fr", path: "/stays" }; `/stays` → { locale: null, path: "/stays" }. */
export function splitLocale(pathname: string): { locale: UrlLocale | null; path: string } {
  const match = /^\/([a-z]{2})(?=\/|$)(.*)$/.exec(pathname);
  if (match && isUrlLocale(match[1])) {
    return { locale: match[1], path: match[2] || "/" };
  }
  return { locale: null, path: pathname };
}

/** Adds the language prefix to a language-free path. */
export function withLocale(path: string, locale: UrlLocale | null): string {
  if (!locale || UNPREFIXED.test(path)) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Mutable per-router holder for the language taken from the address. */
export type UrlLocaleRef = { current: UrlLocale | null };

/** Open Graph locale tag per language. */
export const OG_LOCALE: Record<UrlLocale, string> = {
  en: "en_GB",
  fr: "fr_FR",
  es: "es_ES",
  de: "de_DE",
  pt: "pt_PT",
};
