import type { ListingStatus } from "@/data/platform";
import type { ListingDraft } from "@/models/listing";

/**
 * Listing transport contract. The wizard only ever hands over the JSON
 * payload described by `ListingDraft`; a real backend adapter just has to
 * implement this interface and be registered in `src/api/index.ts`.
 */
export type SavedListing = {
  propertyId: string;
  listingId: string;
  status: ListingStatus;
  /** False while an administrator still has to approve the listing. */
  approved?: boolean;
  /** Serialised payload exactly as it was sent. */
  payload: ListingDraft;
  savedAt: string;
};

/** What the server answers when a listing is published or paused. */
export type ListingStatusResult = {
  listingId: string;
  status: ListingStatus;
  approved: boolean;
  propertyId: string;
  /** False while an administrator still has to approve the listing. */
  visibleToGuests: boolean;
  /** Set when guests cannot see the listing yet, explaining why. */
  message?: string;
};

export interface ListingApi {
  /** Creates or updates a listing from one JSON payload. */
  saveListing(draft: ListingDraft): Promise<SavedListing>;
  setStatus(listingId: string, status: ListingStatus): Promise<ListingStatusResult>;
  deleteListing(listingId: string): Promise<void>;
}
