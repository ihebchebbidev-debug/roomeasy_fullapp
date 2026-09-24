import { useSyncExternalStore } from "react";

import { propertyTypesVersion, subscribePropertyTypes } from "@/models/property";

/** Re-render when the admin-managed property types arrive from the server. */
export function usePropertyTypesVersion(): number {
  return useSyncExternalStore(subscribePropertyTypes, propertyTypesVersion, () => 0);
}
