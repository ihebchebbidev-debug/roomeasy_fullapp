/**
 * Equipment & services catalogue, rebuilt from the client's
 * "Liste des équipements" document. The raw rows live in
 * `src/data/seed/equipment.json` so a backend can seed a table from them.
 */
import equipmentJson from "@/data/seed/equipment.json";
import type { Locale } from "@/i18n/translations";

export type EquipmentGroup =
  | "general"
  | "wellness"
  | "food"
  | "activities"
  | "transport"
  | "services"
  | "family"
  | "safety"
  | "cleaning"
  | "access";

export type EquipmentItem = {
  id: string;
  group: EquipmentGroup;
  en: string;
  fr: string;
  /** Charged as an extra rather than included in the nightly rate. */
  paid?: boolean;
};

export const equipmentCatalogue: EquipmentItem[] = equipmentJson as EquipmentItem[];

export const equipmentGroups: EquipmentGroup[] = [
  "general",
  "wellness",
  "food",
  "activities",
  "transport",
  "services",
  "family",
  "safety",
  "cleaning",
  "access",
];

const groupLabels: Record<Locale, Record<EquipmentGroup, string>> = {
  en: {
    general: "General",
    wellness: "Wellness & spa",
    food: "Food & drink",
    activities: "Activities",
    transport: "Transport & parking",
    services: "Services",
    family: "Family & pets",
    safety: "Safety & accessibility",
    cleaning: "Cleaning",
    access: "Check-in & access",
  },
  fr: {
    general: "Général",
    wellness: "Bien-être et spa",
    food: "Restauration",
    activities: "Activités",
    transport: "Transport et parking",
    services: "Services",
    family: "Famille et animaux",
    safety: "Sécurité et accessibilité",
    cleaning: "Propreté",
    access: "Arrivée et accès",
  },
  es: {
    general: "General",
    wellness: "Bienestar y spa",
    food: "Comida y bebida",
    activities: "Actividades",
    transport: "Transporte y aparcamiento",
    services: "Servicios",
    family: "Familia y mascotas",
    safety: "Seguridad y accesibilidad",
    cleaning: "Limpieza",
    access: "Llegada y acceso",
  },
  de: {
    general: "Allgemein",
    wellness: "Wellness & Spa",
    food: "Essen & Trinken",
    activities: "Aktivitäten",
    transport: "Transport & Parken",
    services: "Services",
    family: "Familie & Haustiere",
    safety: "Sicherheit & Barrierefreiheit",
    cleaning: "Reinigung",
    access: "Anreise & Zugang",
  },
  pt: {
    general: "Geral",
    wellness: "Bem-estar e spa",
    food: "Comida e bebida",
    activities: "Atividades",
    transport: "Transporte e estacionamento",
    services: "Serviços",
    family: "Família e animais",
    safety: "Segurança e acessibilidade",
    cleaning: "Limpeza",
    access: "Chegada e acesso",
  },
};

/** Items a guest is most likely to filter by. */
export const popularEquipmentIds: string[] = [
  "swimming-pool",
  "air-conditioning",
  "parking",
  "breakfast",
  "spa",
  "fitness-centre",
  "restaurant",
  "bar",
  "garden",
  "terrace",
  "24-hour-front-desk",
  "airport-shuttle",
  "family-rooms",
  "laundry",
  "bbq-facilities",
  "hot-tub-jacuzzi",
];

export function equipmentGroupLabel(group: EquipmentGroup, locale: Locale): string {
  return groupLabels[locale]?.[group] ?? groupLabels.en[group];
}

/** Localised item name; every locale except French falls back to English. */
export function equipmentLabel(item: EquipmentItem, locale: Locale): string {
  return locale === "fr" ? item.fr : item.en;
}

const byId = new Map(equipmentCatalogue.map((item) => [item.id, item]));

export function findEquipment(id: string): EquipmentItem | undefined {
  return byId.get(id);
}

export function equipmentByGroup(items: EquipmentItem[]): { group: EquipmentGroup; items: EquipmentItem[] }[] {
  return equipmentGroups
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length > 0);
}

/** Free-text search across both label languages, for the host dashboard box. */
export function searchEquipment(query: string): EquipmentItem[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return equipmentCatalogue;
  return equipmentCatalogue.filter(
    (item) =>
      item.en.toLocaleLowerCase().includes(needle) || item.fr.toLocaleLowerCase().includes(needle),
  );
}
