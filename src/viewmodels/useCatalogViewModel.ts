import { useMemo } from "react";

import { usePlatform } from "@/hooks/usePlatform";
import type { Property } from "@/models/property";
import { findProperty } from "@/services/propertyService";

/** View-model for the whole catalogue. Stays always come from the database. */
export function useCatalogViewModel() {
  const { customProperties, propertyOverrides } = usePlatform();
  const all = useMemo<Property[]>(() => {
    return customProperties.map((property) => {
      const override = propertyOverrides[property.id];
      return override ? { ...property, ...override } : property;
    });
  }, [customProperties, propertyOverrides]);

  return {
    properties: all,
    getById: (id: string) => findProperty(all, id),
  };
}
