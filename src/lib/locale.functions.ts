import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";

/** Locale codes we ship UI copy for. Keep in sync with src/i18n/translations.ts. */
const SUPPORTED_LOCALES = ["en", "fr", "es", "de", "pt"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_COOKIE = "nestara.locale";

function isSupported(value: string | null | undefined): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Picks the best supported locale out of an Accept-Language header value. */
function parseAcceptLanguage(header: string | null | undefined): SupportedLocale | null {
  if (!header) return null;
  const candidates = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.slice(0, 2).toLowerCase())
    .filter(Boolean);
  for (const candidate of candidates) {
    if (isSupported(candidate)) return candidate;
  }
  return null;
}

/**
 * Server-side locale detection used to render locale-correct <title>/meta
 * tags before any client JS runs: remembered cookie choice first, then the
 * browser's Accept-Language header, defaulting to English (the language the
 * product spec lists first) when nothing is known.
 */
export const detectServerLocale = createServerFn({ method: "GET" }).handler(async (): Promise<SupportedLocale> => {
  try {
    const cookieLocale = getCookie(LOCALE_COOKIE);
    if (isSupported(cookieLocale)) return cookieLocale;
    const acceptLanguage = getRequestHeader("accept-language");
    const detected = parseAcceptLanguage(acceptLanguage);
    if (detected) return detected;
  } catch {
    // Not running in a request context (e.g. static build) — fall through.
  }
  return "en";
});
