import { z } from "zod";

import type { ListingStatus } from "@/data/platform";
import type { AmenityId, CancellationPolicy, Property, PropertyCategory } from "@/models/property";
import { propertyTypes } from "@/models/property";

/**
 * The listing payload. This is the exact JSON shape the host wizard produces
 * and the only thing that travels to the backend later: one object per
 * listing, no UI state, no bundled assets. `src/api/listingApi` is the single
 * transport seam — swap the mock adapter for an HTTP one and nothing else
 * changes.
 */

export const MAX_PHOTOS = 10;

export const listingDraftSchema = z.object({
  /** Stable property id (slug). Generated once, kept through every edit. */
  propertyId: z.string().min(1),
  /** Host-listing id, `hl-<propertyId>`. */
  listingId: z.string().min(1),
  title: z.string().trim().min(4).max(120),
  category: z.string().refine((value) => propertyTypes.includes(value), "Choose a property type."),
  summary: z.string().trim().min(20).max(300),
  description: z.string().trim().max(4000),
  location: z.object({
    city: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80),
    postal: z.string().trim().max(16),
    neighbourhood: z.string().trim().max(120),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
  }),
  capacity: z.object({
    guests: z.number().int().min(1).max(64),
    rooms: z.number().int().min(1).max(40),
    beds: z.number().int().min(1).max(64),
    baths: z.number().int().min(1).max(40),
    area: z.number().int().min(10).max(5000),
  }),
  amenities: z.array(z.string()),
  equipment: z.array(z.string()),
  photos: z.array(z.string()).max(MAX_PHOTOS),
  pricing: z.object({
    nightlyUsd: z.number().min(10).max(100000),
    cleaningFeeUsd: z.number().min(0).max(100000),
    minNights: z.number().int().min(1).max(365),
    longStay: z.object({
      enabled: z.boolean(),
      threshold: z.number().int().min(1).max(365),
      discount: z.number().min(0).max(90),
    }),
    mobile: z.object({ enabled: z.boolean(), discount: z.number().min(0).max(90) }),
  }),
  policies: z.object({
    cancellationPolicy: z.enum(["flexible", "moderate", "strict"]),
    houseRules: z.string().trim().max(2000),
    checkIn: z.string().trim().max(10),
    checkOut: z.string().trim().max(10),
    instantBook: z.boolean(),
  }),
  status: z.enum(["draft", "published", "suspended"]),
});

export type ListingDraft = z.infer<typeof listingDraftSchema> & {
  category: PropertyCategory;
  amenities: AmenityId[];
  policies: { cancellationPolicy: CancellationPolicy } & ListingPolicies;
  status: ListingStatus;
};

type ListingPolicies = {
  houseRules: string;
  checkIn: string;
  checkOut: string;
  instantBook: boolean;
};

/** Wizard steps, in order. Each one validates only its own slice. */
export const listingSteps = [
  "basics",
  "location",
  "space",
  "equipment",
  "photos",
  "pricing",
  "story",
  "review",
] as const;

export type ListingStep = (typeof listingSteps)[number];

export function slugifyListing(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "listing"
  );
}

export function emptyListingDraft(): ListingDraft {
  return {
    propertyId: "",
    listingId: "",
    title: "",
    category: "apartment",
    summary: "",
    description: "",
    location: { city: "", country: "", postal: "", neighbourhood: "", lat: null, lng: null },
    capacity: { guests: 2, rooms: 1, beds: 1, baths: 1, area: 60 },
    amenities: ["wifi"],
    equipment: [],
    photos: [],
    pricing: {
      nightlyUsd: 180,
      cleaningFeeUsd: 0,
      minNights: 1,
      longStay: { enabled: false, threshold: 7, discount: 10 },
      mobile: { enabled: false, discount: 5 },
    },
    policies: {
      cancellationPolicy: "moderate",
      houseRules: "",
      checkIn: "15:00",
      checkOut: "11:00",
      instantBook: false,
    },
    status: "draft",
  };
}

/** Rebuilds an editable draft from a stored property + its host listing. */
export function draftFromProperty(
  property: Property,
  listing?: {
    id: string;
    status: ListingStatus;
    nightlyUsd: number;
    longStay: { enabled: boolean; threshold: number; discount: number };
    mobile: { enabled: boolean; discount: number };
  },
): ListingDraft {
  const base = emptyListingDraft();
  const [city = "", country = ""] = (property.location.en ?? "").split(",").map((part) => part.trim());
  return {
    ...base,
    propertyId: property.id,
    listingId: listing?.id ?? `hl-${property.id}`,
    title: property.name,
    category: property.category,
    // Older listings were created before these fields existed — seed them so an
    // edit never starts in an invalid state.
    summary:
      property.summary ??
      `${property.name} welcomes up to ${property.guests} guests in ${city || "town"}.`,
    description:
      property.description ??
      `${property.name} offers ${property.beds} bed(s), ${property.baths} bathroom(s) and ${property.area} m² of space in ${[city, country].filter(Boolean).join(", ")}.`,
    location: {
      city,
      country,
      postal: property.postal ?? "",
      neighbourhood: property.neighbourhood ?? "",
      lat: property.coords?.lat ?? null,
      lng: property.coords?.lng ?? null,
    },
    capacity: {
      guests: property.guests,
      rooms: property.rooms ?? property.beds,
      beds: property.beds,
      baths: property.baths,
      area: property.area,
    },
    amenities: property.amenities ?? [],
    equipment: property.equipment ?? [],
    photos: [property.image, ...(property.gallery ?? [])].filter(Boolean).slice(0, MAX_PHOTOS),
    pricing: {
      nightlyUsd: listing?.nightlyUsd ?? property.price,
      cleaningFeeUsd: property.cleaningFee ?? 0,
      minNights: property.minNights ?? 1,
      longStay: listing?.longStay ?? base.pricing.longStay,
      mobile: listing?.mobile ?? base.pricing.mobile,
    },
    policies: {
      cancellationPolicy: property.cancellationPolicy ?? "moderate",
      houseRules: property.houseRules ?? "",
      checkIn: property.checkIn ?? "15:00",
      checkOut: property.checkOut ?? "11:00",
      instantBook: property.instantBook ?? false,
    },
    status: listing?.status ?? "draft",
  };
}

/** Projects the saved JSON back onto the catalogue shape the UI reads. */
export function propertyFromDraft(draft: ListingDraft, previous?: Property): Property {
  const place = [draft.location.city, draft.location.country].filter(Boolean).join(", ");
  const [cover, ...gallery] = draft.photos;
  return {
    ...previous,
    id: draft.propertyId,
    name: draft.title.trim(),
    location: { en: place, fr: place },
    image: cover ?? "",
    // The wizard sends the complete photo set. An empty gallery therefore
    // means all previous secondary photos were removed, not “keep them”.
    gallery,
    category: draft.category,
    guests: draft.capacity.guests,
    rooms: draft.capacity.rooms,
    beds: draft.capacity.beds,
    baths: draft.capacity.baths,
    area: draft.capacity.area,
    price: draft.pricing.nightlyUsd,
    rating: previous?.rating ?? 5,
    amenities: draft.amenities,
    equipment: draft.equipment,
    summary: draft.summary.trim(),
    description: draft.description.trim(),
    postal: draft.location.postal,
    neighbourhood: draft.location.neighbourhood,
    ...(draft.location.lat != null && draft.location.lng != null ? { coords: { lat: draft.location.lat, lng: draft.location.lng } } : {}),
    cleaningFee: draft.pricing.cleaningFeeUsd,
    minNights: draft.pricing.minNights,
    cancellationPolicy: draft.policies.cancellationPolicy,
    houseRules: draft.policies.houseRules.trim(),
    checkIn: draft.policies.checkIn,
    checkOut: draft.policies.checkOut,
    instantBook: draft.policies.instantBook,
  };
}

/** Field keys that are still invalid for one step. Empty = the step is done. */
export function validateStep(step: ListingStep, draft: ListingDraft): string[] {
  const bad: string[] = [];
  const add = (key: string, ok: boolean) => {
    if (!ok) bad.push(key);
  };
  if (step === "basics") {
    add("title", draft.title.trim().length >= 4);
    add("category", Boolean(draft.category));
  }
  if (step === "location") {
    add("city", draft.location.city.trim().length >= 2);
    add("country", draft.location.country.trim().length >= 2);
    add("coords", draft.location.lat != null && draft.location.lng != null);
  }
  if (step === "space") {
    add("guests", draft.capacity.guests >= 1);
    add("rooms", draft.capacity.rooms >= 1);
    add("beds", draft.capacity.beds >= 1);
    add("baths", draft.capacity.baths >= 1);
    add("area", draft.capacity.area >= 10);
  }
  if (step === "photos") add("photos", draft.photos.length >= 1);
  if (step === "story") {
    add("summary", draft.summary.trim().length >= 20);
    add("description", draft.description.trim().length >= 40);
  }
  if (step === "pricing") {
    add("nightlyUsd", draft.pricing.nightlyUsd >= 10);
    add("minNights", draft.pricing.minNights >= 1);
    add("checkIn", /^\d{1,2}:\d{2}$/.test(draft.policies.checkIn));
    add("checkOut", /^\d{1,2}:\d{2}$/.test(draft.policies.checkOut));
  }
  return bad;
}

/** Every step that is not complete yet — powers the review step checklist. */
export function incompleteSteps(draft: ListingDraft): ListingStep[] {
  return listingSteps.filter((step) => validateStep(step, draft).length > 0);
}

/** The literal JSON body a backend will receive. */
export function toListingPayload(draft: ListingDraft) {
  return listingDraftSchema.parse(draft);
}
