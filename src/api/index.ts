import { API_BASE_URL } from "@/api/http/client";
import { httpBookingApi } from "@/api/http/bookingApi.http";
import { httpListingApi } from "@/api/http/listingApi.http";
import type { BookingApi } from "@/api/types";
import type { ListingApi } from "@/api/listingApi.types";

/**
 * Single registration point. Every screen talks to the Node backend; there is
 * no bundled demo data.
 */
export const usingRealBackend = API_BASE_URL !== "";

let current: BookingApi = httpBookingApi;

export function setBookingApi(api: BookingApi) {
  current = api;
}

export const bookingApi: BookingApi = {
  getAvailability: (input) => current.getAvailability(input),
  getQuote: (input) => current.getQuote(input),
  createBooking: (draft) => current.createBooking(draft),
  listBookings: (input) => current.listBookings(input),
  getBooking: (id) => current.getBooking(id),
  cancelBooking: (id) => current.cancelBooking(id),
};

let currentListings: ListingApi = httpListingApi;

export function setListingApi(api: ListingApi) {
  currentListings = api;
}

/** Everything the host wizard needs. One JSON payload in, one record out. */
export const listingApi: ListingApi = {
  saveListing: (draft) => currentListings.saveListing(draft),
  setStatus: (id, status) => currentListings.setStatus(id, status),
  deleteListing: (id) => currentListings.deleteListing(id),
};

export * from "@/api/types";
export type { ListingApi, SavedListing } from "@/api/listingApi.types";
