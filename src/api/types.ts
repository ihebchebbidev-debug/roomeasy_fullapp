/**
 * Transport contract. Every screen talks to this interface only.
 *
 * Swapping the mock for a real backend = writing one more object that
 * implements `BookingApi` and registering it in `src/api/index.ts`.
 */

import type {
  AvailabilityResult,
  Booking,
  BookingDraft,
  BookingStatus,
  PriceBreakdown,
} from "@/models/booking";

export type ApiErrorCode =
  | "INVALID_DATES"
  | "UNAVAILABLE"
  | "TOO_MANY_GUESTS"
  | "PAYMENT_DECLINED"
  | "CARD_INVALID"
  | "NOT_FOUND"
  | "NOT_CANCELLABLE";

/** Thrown by every adapter so the UI can branch on a stable code, not a string. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: ApiErrorCode, message?: string, details: Record<string, unknown> = {}) {
    super(message ?? code);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export type AvailabilityInput = { propertyId: string; from: string; to: string };
export type QuoteInput = AvailabilityInput & { guests: number; isMobile?: boolean };
export type ListBookingsInput = { status?: BookingStatus[] };

export interface BookingApi {
  /** Can these nights be booked? Called before the guest reaches payment. */
  getAvailability(input: AvailabilityInput): Promise<AvailabilityResult>;
  /** Authoritative price for a stay. The UI never invents a total. */
  getQuote(input: QuoteInput): Promise<PriceBreakdown>;
  /** Validates, charges and persists. Throws ApiError on any refusal. */
  createBooking(draft: BookingDraft): Promise<Booking>;
  listBookings(input?: ListBookingsInput): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking>;
  cancelBooking(id: string): Promise<Booking>;
}
