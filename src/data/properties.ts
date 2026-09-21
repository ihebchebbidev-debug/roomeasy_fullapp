/**
 * Stay types and helpers only.
 *
 * There is no bundled stay catalogue any more: every listing, price and photo
 * a guest sees comes from the service (see `hydratePublic` in `src/api/backend.ts`).
 */
export type { Property, PropertyCategory, PropertyHost } from "@/models/property";
export { cityName, propertyPhotos, propertyCategories as categories } from "@/models/property";
