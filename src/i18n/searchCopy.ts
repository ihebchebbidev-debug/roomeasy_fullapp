import { useLanguage } from "@/i18n/LanguageProvider";

/** Copy for the extra search filters and the map view. */
const en = {
  preferences: "Booking preferences",
  pets: "Pets allowed",
  accessible: "Accessible for disabled guests",
  instant: "Instant book",
  instantHint: "Book without waiting for the host",
  freeCancel: "Free cancellation",
  freeCancelHint: "Flexible policy: free until 24 h before check-in",
  stayLength: "Stay length",
  stayLengthHint: "Hides stays with a longer minimum stay",
  stayLengthDates: "Set by your dates: {n} nights",
  nights: "{n}+ nights",
  any: "Any",
  list: "List",
  map: "Map",
  searchArea: "Search this area",
  areaActive: "Map area",
  clearArea: "Clear map area",
  noCoords: "Some stays have no map location and are not shown on the map.",
};

type Copy = typeof en;

const fr: Copy = {
  preferences: "Préférences de réservation",
  pets: "Animaux acceptés",
  accessible: "Accessible aux personnes handicapées",
  instant: "Réservation instantanée",
  instantHint: "Réservez sans attendre l'hôte",
  freeCancel: "Annulation gratuite",
  freeCancelHint: "Conditions flexibles : gratuite jusqu'à 24 h avant l'arrivée",
  stayLength: "Durée du séjour",
  stayLengthHint: "Masque les logements avec un séjour minimum plus long",
  stayLengthDates: "Selon vos dates : {n} nuits",
  nights: "{n}+ nuits",
  any: "Indifférent",
  list: "Liste",
  map: "Carte",
  searchArea: "Rechercher dans cette zone",
  areaActive: "Zone de la carte",
  clearArea: "Effacer la zone",
  noCoords: "Certains logements sans position ne sont pas affichés sur la carte.",
};

const es: Copy = {
  preferences: "Preferencias de reserva",
  pets: "Se admiten mascotas",
  accessible: "Accesible para personas con discapacidad",
  instant: "Reserva inmediata",
  instantHint: "Reserva sin esperar al anfitrión",
  freeCancel: "Cancelación gratuita",
  freeCancelHint: "Política flexible: gratis hasta 24 h antes de la llegada",
  stayLength: "Duración de la estancia",
  stayLengthHint: "Oculta alojamientos con una estancia mínima más larga",
  stayLengthDates: "Según tus fechas: {n} noches",
  nights: "{n}+ noches",
  any: "Cualquiera",
  list: "Lista",
  map: "Mapa",
  searchArea: "Buscar en esta zona",
  areaActive: "Zona del mapa",
  clearArea: "Quitar zona",
  noCoords: "Algunos alojamientos sin ubicación no aparecen en el mapa.",
};

const de: Copy = {
  preferences: "Buchungsoptionen",
  pets: "Haustiere erlaubt",
  accessible: "Barrierefrei",
  instant: "Sofort buchen",
  instantHint: "Buchen ohne auf den Gastgeber zu warten",
  freeCancel: "Kostenlose Stornierung",
  freeCancelHint: "Flexibel: kostenlos bis 24 Std. vor Anreise",
  stayLength: "Aufenthaltsdauer",
  stayLengthHint: "Blendet Unterkünfte mit längerem Mindestaufenthalt aus",
  stayLengthDates: "Aus Ihren Daten: {n} Nächte",
  nights: "{n}+ Nächte",
  any: "Egal",
  list: "Liste",
  map: "Karte",
  searchArea: "In diesem Bereich suchen",
  areaActive: "Kartenbereich",
  clearArea: "Bereich entfernen",
  noCoords: "Unterkünfte ohne Standort werden nicht auf der Karte gezeigt.",
};

const pt: Copy = {
  preferences: "Preferências de reserva",
  pets: "Animais permitidos",
  accessible: "Acessível para pessoas com deficiência",
  instant: "Reserva imediata",
  instantHint: "Reserve sem esperar pelo anfitrião",
  freeCancel: "Cancelamento gratuito",
  freeCancelHint: "Política flexível: grátis até 24 h antes do check-in",
  stayLength: "Duração da estadia",
  stayLengthHint: "Oculta alojamentos com estadia mínima mais longa",
  stayLengthDates: "Pelas suas datas: {n} noites",
  nights: "{n}+ noites",
  any: "Qualquer",
  list: "Lista",
  map: "Mapa",
  searchArea: "Pesquisar nesta área",
  areaActive: "Área do mapa",
  clearArea: "Limpar área",
  noCoords: "Alguns alojamentos sem localização não aparecem no mapa.",
};

const copies: Record<string, Copy> = { en, fr, es, de, pt };

export function useSearchCopy(): Copy {
  const { locale } = useLanguage();
  return copies[locale] ?? en;
}
