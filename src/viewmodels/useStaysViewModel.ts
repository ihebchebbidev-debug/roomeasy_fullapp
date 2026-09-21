import { useMemo } from "react";

import { useCatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import {
  countByCategory,
  destinationCoords,
  filterProperties,
  sortProperties,
  type PropertyQuery,
  type PropertySort,
} from "@/services/propertyService";

/** View-model for the browse/search page. */
export function useStaysViewModel(query: PropertyQuery, sort: PropertySort) {
  const { properties } = useCatalogViewModel();

  const origin = useMemo(() => destinationCoords(properties, query.where), [properties, query.where]);

  const results = useMemo(
    () => sortProperties(filterProperties(properties, query), sort, origin),
    [properties, query, sort, origin],
  );

  const counts = useMemo(() => countByCategory(properties, query), [properties, query]);

  return { results, counts, origin, total: properties.length };
}
