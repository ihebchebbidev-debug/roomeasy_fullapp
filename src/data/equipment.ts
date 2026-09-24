/**
 * Equipment & services catalogue, rebuilt from the client's
 * "Liste des équipements" document. The raw rows live in
 * `src/data/seed/equipment.json` so a backend can seed a table from them.
 */
import equipmentJson from "@/data/seed/equipment.json";
import { useSyncExternalStore } from "react";
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

/**
 * Starts with the bundled list so the first paint never waits, then is replaced
 * in place by the live list from the server (managed in the admin "Amenities"
 * section) via `loadEquipmentFromApi`. Components re-render through
 * `useEquipmentCatalogue()`.
 */
export const equipmentCatalogue: EquipmentItem[] = [...(equipmentJson as EquipmentItem[])];

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
  // Groups created by an admin have no built-in label: show their name.
  return groupLabels[locale]?.[group] ?? groupLabels.en[group] ?? String(group).replace(/[-_]/g, " ");
}

/** Localised item name; every locale except French falls back to English. */
export function equipmentLabel(item: EquipmentItem, locale: Locale): string {
  return locale === "fr" ? item.fr : item.en;
}

const byId = new Map(equipmentCatalogue.map((item) => [item.id, item]));

let version = 0;
const listeners = new Set<() => void>();

/** Replaces the catalogue with the server's active amenities. */
export function setEquipmentCatalogue(items: EquipmentItem[]) {
  if (!items.length) return;
  equipmentCatalogue.splice(0, equipmentCatalogue.length, ...items);
  // Keep retired ids resolvable for old listings, but only list active ones.
  for (const item of items) byId.set(item.id, item);
  version += 1;
  listeners.forEach((listener) => listener());
}

let loading: Promise<void> | null = null;
export function loadEquipmentFromApi(fetcher: () => Promise<{ id: string; group: string; label: { en: string; fr: string }; paid: boolean; active: boolean }[]>) {
  loading ??= fetcher()
    .then((rows) =>
      setEquipmentCatalogue(
        rows
          .filter((row) => row.active)
          .map((row) => ({ id: row.id, group: row.group as EquipmentGroup, en: row.label.en, fr: row.label.fr, paid: row.paid })),
      ),
    )
    .catch(() => {
      loading = null; // keep the bundled list; retry next time
    });
  return loading;
}

/** Subscribe a component to catalogue updates; returns a number that changes on every update. */
export function useEquipmentVersion(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
    () => 0,
  );
}

/** Popular filter ids that still exist in the live catalogue. */
export function activePopularEquipmentIds(): string[] {
  const live = new Set(equipmentCatalogue.map((item) => item.id));
  return popularEquipmentIds.filter((id) => live.has(id));
}

export function findEquipment(id: string): EquipmentItem | undefined {
  return byId.get(id);
}

export function equipmentByGroup(items: EquipmentItem[]): { group: EquipmentGroup; items: EquipmentItem[] }[] {
  const extra = [...new Set(items.map((item) => item.group))].filter((group) => !equipmentGroups.includes(group));
  return [...equipmentGroups, ...extra]
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
