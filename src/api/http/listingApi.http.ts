import { request } from "@/api/http/client";
import type { ListingApi, ListingStatusResult, SavedListing } from "@/api/listingApi.types";
import type { ListingStatus } from "@/data/platform";
import type { ListingDraft } from "@/models/listing";

/** Real transport for the host wizard: one JSON payload in, one record out. */
export const httpListingApi: ListingApi = {
  saveListing(draft: ListingDraft) {
    return request<SavedListing>("/listings", { method: "PUT", body: draft });
  },

  setStatus(listingId: string, status: ListingStatus) {
    return request<ListingStatusResult>(`/listings/${encodeURIComponent(listingId)}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  async deleteListing(listingId: string) {
    await request<void>(`/listings/${encodeURIComponent(listingId)}`, { method: "DELETE" });
  },
};
