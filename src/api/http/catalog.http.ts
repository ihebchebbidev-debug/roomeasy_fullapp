/** Back-office content: amenities, cities, CMS pages, translation overrides, security actions. */
import { API_BASE_URL, request } from "@/api/http/client";

export type AmenityDto = { id: string; group: string; label: { en: string; fr: string }; paid: boolean; active: boolean };
export type CityDto = {
  id: string;
  name: string;
  country: string;
  slug: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  listings: number;
};
export type ContentPageDto = {
  slug: string;
  locale: string;
  title: string;
  body: string;
  published: boolean;
  updatedAt: string;
  updatedBy: string | null;
};
export type TranslationDto = { locale: string; key: string; value: string; updatedAt: string };
export type PropertyTypeAdminDto = {
  id: string;
  labels: { en: string; fr: string; es: string; de: string; pt: string };
  active: boolean;
  sortOrder: number;
  listings: number;
};
export type CountryDto = { code: string; name: string; active: boolean; sortOrder: number; listings: number };
export type CityInput = Pick<CityDto, "name" | "country" | "active" | "featured" | "sortOrder">;

const enc = encodeURIComponent;

export const catalogApi = {
  amenities: (search?: string) =>
    request<{ items: AmenityDto[]; groups: string[] }>("/admin/taxonomy/amenities", { query: { search } }),
  saveAmenity: (id: string, body: { group: string; labelEn: string; labelFr: string; paid: boolean; active: boolean }) =>
    request<unknown>(`/admin/taxonomy/amenities/${enc(id)}`, { method: "PUT", body }),
  removeAmenity: (id: string) =>
    request<{ deleted: boolean }>(`/admin/taxonomy/amenities/${enc(id)}`, { method: "DELETE" }),

  cities: () => request<CityDto[]>("/admin/taxonomy/cities"),
  createCity: (body: CityInput) => request<CityDto>("/admin/taxonomy/cities", { method: "POST", body }),
  updateCity: (id: string, body: CityInput) =>
    request<CityDto>(`/admin/taxonomy/cities/${enc(id)}`, { method: "PUT", body }),
  deleteCity: (id: string) => request<unknown>(`/admin/taxonomy/cities/${enc(id)}`, { method: "DELETE" }),
  importCities: () => request<{ added: number }>("/admin/taxonomy/cities/import", { method: "POST", body: {} }),

  propertyTypes: () => request<PropertyTypeAdminDto[]>("/admin/taxonomy/property-types"),
  savePropertyType: (id: string, body: Pick<PropertyTypeAdminDto, "labels" | "active" | "sortOrder">) =>
    request<PropertyTypeAdminDto>(`/admin/taxonomy/property-types/${enc(id)}`, { method: "PUT", body }),
  removePropertyType: (id: string) =>
    request<{ deleted: boolean }>(`/admin/taxonomy/property-types/${enc(id)}`, { method: "DELETE" }),

  countries: () => request<CountryDto[]>("/admin/taxonomy/countries"),
  saveCountry: (code: string, body: Pick<CountryDto, "name" | "active" | "sortOrder">) =>
    request<CountryDto>(`/admin/taxonomy/countries/${enc(code)}`, { method: "PUT", body }),
  deleteCountry: (code: string) => request<unknown>(`/admin/taxonomy/countries/${enc(code)}`, { method: "DELETE" }),

  publicPropertyTypes: () => request<PropertyTypeAdminDto[]>("/content/property-types"),
  publicCountries: () => request<CountryDto[]>("/content/countries"),

  pages: () => request<ContentPageDto[]>("/admin/content/pages"),
  savePage: (slug: string, locale: string, body: { title: string; body: string; published: boolean }) =>
    request<ContentPageDto>(`/admin/content/pages/${enc(slug)}/${enc(locale)}`, { method: "PUT", body }),
  deletePage: (slug: string, locale: string) =>
    request<unknown>(`/admin/content/pages/${enc(slug)}/${enc(locale)}`, { method: "DELETE" }),

  translations: (locale?: string) => request<TranslationDto[]>("/admin/content/translations", { query: { locale } }),
  saveTranslation: (locale: string, key: string, value: string) =>
    request<unknown>(`/admin/content/translations/${enc(locale)}`, { method: "PUT", body: { key, value } }),
  deleteTranslation: (locale: string, key: string) =>
    request<unknown>(`/admin/content/translations/${enc(locale)}`, { method: "DELETE", query: { key } }),

  resetTwoFactor: (userId: string) =>
    request<{ reset: boolean }>(`/admin/users/${enc(userId)}/2fa/reset`, { method: "POST", body: {} }),
  syncIdentity: (userId: string) =>
    request<{ stripeStatus: string; requirements: string[] }>(`/admin/users/${enc(userId)}/identity/sync`, {
      method: "POST",
      body: {},
    }),

  publicPage: (slug: string, locale: string) =>
    request<ContentPageDto>(`/content/pages/${enc(slug)}`, { query: { locale } }),
  publicTranslations: (locale: string) => request<Record<string, string>>(`/content/translations/${enc(locale)}`),
};

export const catalogEnabled = API_BASE_URL !== "";
