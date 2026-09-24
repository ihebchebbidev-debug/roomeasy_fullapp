/**
 * Domain model (MVVM: Model) for the booking flow.
 *
 * These types are the contract between the UI and the data source. They are
 * intentionally free of React, storage and transport details so a real backend
 * can be plugged in without touching a single component.
 */

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";

export type PriceLine = {
  /** Stable machine id — safe to use in a database. */
  id: "longStay" | "mobile" | "lastMinute";
  percent: number;
  /** Positive amount that was subtracted from the base subtotal. */
  amount: number;
};

export type PriceBreakdown = {
  currency: "EUR";
  nightly: number;
  nights: number;
  baseSubtotal: number;
  discounts: PriceLine[];
  subtotal: number;
  /** One-off cleaning fee set by the host; 0 when they charge none. */
  cleaningFee?: number;
  serviceFee: number;
  taxes: number;
  total: number;
  /** Per-night explanation, present when the host uses smart pricing. */
  nightsDetail?: { date: string; basePrice: number; finalPrice: number; applied: { rule: string; label?: string; percent?: number }[] }[];
};

export type PaymentRecord = {
  method: "card";
  brand: "visa" | "mastercard" | "amex" | "card";
  last4: string;
  status: "authorized" | "paid" | "refunded";
  /** Payment-provider reference; a real backend stores the PSP intent id here. */
  reference: string;
};

export type GuestContact = {
  name: string;
  email: string;
  phone?: string;
};

export type Booking = {
  id: string;
  /** Human readable code shown to the guest, e.g. "RE-8H4K2P". */
  reference: string;
  propertyId: string;
  guest: GuestContact;
  /** ISO date (YYYY-MM-DD), check-in. */
  from: string;
  /** ISO date (YYYY-MM-DD), check-out (exclusive). */
  to: string;
  nights: number;
  guests: number;
  message?: string;
  price: PriceBreakdown;
  payment: PaymentRecord;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

/** Everything the UI collects before it can create a booking. */
export type BookingDraft = {
  propertyId: string;
  from: string;
  to: string;
  guests: number;
  guest: GuestContact;
  message?: string;
  /** Absent when the guest pays with Stripe: Stripe collects the card itself. */
  card?: CardDetails;
  paymentMethod?: "card" | "stripe";
  /** Mobile-only promotions are resolved server-side in a real backend. */
  isMobile?: boolean;
};

export type CardDetails = {
  number: string;
  name: string;
  /** MM/YY */
  expiry: string;
  cvc: string;
};

export type AvailabilityResult = {
  propertyId: string;
  from: string;
  to: string;
  available: boolean;
  /** ISO dates inside the range that cannot be booked. */
  unavailableDates: string[];
  maxGuests: number;
};

export function isUpcoming(booking: Booking): boolean {
  return booking.status === "pending" || booking.status === "confirmed";
}

export function isCancellable(booking: Booking): boolean {
  return isUpcoming(booking);
}
