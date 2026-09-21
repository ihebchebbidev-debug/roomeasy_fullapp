import { request } from "@/api/http/client";
import type { AvailabilityInput, BookingApi, ListBookingsInput, QuoteInput } from "@/api/types";
import type { AvailabilityResult, Booking, BookingDraft, PriceBreakdown } from "@/models/booking";

/**
 * Real transport for the booking flow. Every method maps to one endpoint of
 * the Node backend in `nodejs_backend/`, which already answers with the exact
 * shapes declared in `src/models/booking.ts`.
 */
export const httpBookingApi: BookingApi = {
  getAvailability(input: AvailabilityInput) {
    return request<AvailabilityResult>("/bookings/availability", {
      query: { propertyId: input.propertyId, from: input.from, to: input.to },
    });
  },

  getQuote(input: QuoteInput) {
    return request<PriceBreakdown>("/bookings/quote", {
      query: {
        propertyId: input.propertyId,
        from: input.from,
        to: input.to,
        guests: input.guests,
        isMobile: input.isMobile ?? false,
      },
    });
  },

  createBooking(draft: BookingDraft) {
    // The card never reaches our database: the server uses it to authorise the
    // payment and keeps only the brand and the last four digits.
    return request<Booking>("/bookings", { method: "POST", body: draft });
  },

  listBookings(input?: ListBookingsInput) {
    return request<Booking[]>("/bookings", {
      query: { status: input?.status?.join(",") },
    });
  },

  getBooking(id: string) {
    return request<Booking>(`/bookings/${encodeURIComponent(id)}`);
  },

  cancelBooking(id: string) {
    return request<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST", body: {} });
  },
};
