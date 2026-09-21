import { useCatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import type { Property } from "@/models/property";

/** Thin compatibility wrapper over the catalogue view-model. */
export function useAllProperties(): Property[] {
  return useCatalogViewModel().properties;
}
