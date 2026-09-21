import type { Locale } from "@/i18n/translations";

/** Picks the copy block for the active locale, falling back to English. */
export function pickCopy<T extends Partial<Record<Locale, unknown>> & { en: unknown }>(
  locale: Locale,
  maps: T,
): T[Locale] extends undefined ? T["en"] : NonNullable<T[Locale]> {
  return (maps[locale] ?? maps.en) as never;
}
