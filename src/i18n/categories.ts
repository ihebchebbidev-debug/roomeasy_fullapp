import type { Locale } from "@/i18n/translations";
import type { PropertyCategory } from "@/models/property";

type Key = "all" | PropertyCategory;

const labels: Record<Locale, Record<Key, string>> = {
  en: {
    all: "All",
    apartment: "Apartment",
    villa: "Villa",
    resort: "Resort",
    hotel: "Hotel",
    lodge: "Lodge",
    guesthouse: "Guesthouse",
    riad: "Riad",
    studio: "Studio",
    bungalow: "Bungalow",
    chalet: "Chalet",
    hostel: "Hostel",
    camping: "Camping",
  },
  fr: {
    all: "Tous",
    apartment: "Appartement",
    villa: "Villa",
    resort: "Resort",
    hotel: "Hôtel",
    lodge: "Lodge",
    guesthouse: "Maison d'hôtes",
    riad: "Riad",
    studio: "Studio",
    bungalow: "Bungalow",
    chalet: "Chalet",
    hostel: "Auberge",
    camping: "Camping",
  },
  es: {
    all: "Todos",
    apartment: "Apartamento",
    villa: "Villa",
    resort: "Resort",
    hotel: "Hotel",
    lodge: "Lodge",
    guesthouse: "Casa de huéspedes",
    riad: "Riad",
    studio: "Estudio",
    bungalow: "Bungaló",
    chalet: "Chalet",
    hostel: "Albergue",
    camping: "Camping",
  },
  de: {
    all: "Alle",
    apartment: "Apartment",
    villa: "Villa",
    resort: "Resort",
    hotel: "Hotel",
    lodge: "Lodge",
    guesthouse: "Gästehaus",
    riad: "Riad",
    studio: "Studio",
    bungalow: "Bungalow",
    chalet: "Chalet",
    hostel: "Hostel",
    camping: "Camping",
  },
  pt: {
    all: "Todos",
    apartment: "Apartamento",
    villa: "Villa",
    resort: "Resort",
    hotel: "Hotel",
    lodge: "Lodge",
    guesthouse: "Casa de hóspedes",
    riad: "Riad",
    studio: "Estúdio",
    bungalow: "Bangalô",
    chalet: "Chalé",
    hostel: "Hostel",
    camping: "Camping",
  },
};

/** Localised label for a property type (or "all"). */
export function categoryLabel(category: Key, locale: Locale): string {
  return labels[locale]?.[category] ?? labels.en[category];
}
