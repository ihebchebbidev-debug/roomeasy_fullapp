import { de, enUS, es, fr, pt } from "date-fns/locale";

import type { Locale } from "@/i18n/translations";

const map = { en: enUS, fr, es, de, pt } as const;

/** date-fns locale for the active app language. */
export function dateFnsLocale(locale: Locale) {
  return map[locale] ?? enUS;
}
