/**
 * Shared types for the data the app reads from the service. No rows, prices or
 * photos live here — every value the screens show comes from the API.
 */

export type Role = "guest" | "host" | "admin";
export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";
export type ListingStatus = "draft" | "published" | "suspended";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  /** Every role the server granted, including delegated back-office roles. */
  roles?: string[];
  /** True when one of those roles can open the back office. */
  backOffice?: boolean;
  verified: boolean;
  twoFactorEnabled?: boolean;
  avatarUrl?: string;
};

/**
 * Persisted booking row. The flat fields are what host/admin screens read;
 * the optional ones are filled by the booking API (see src/api) and hold the
 * full guest, price and payment record of a real reservation.
 */
export type Booking = {
  id: string;
  propertyId: string;
  guestName: string;
  from: string;
  to: string;
  nights: number;
  guests: number;
  totalUsd: number;
  status: BookingStatus;
  reference?: string;
  guestEmail?: string;
  guestPhone?: string;
  message?: string;
  price?: import("@/models/booking").PriceBreakdown;
  payment?: import("@/models/booking").PaymentRecord;
  createdAt?: string;
  updatedAt?: string;
};

export type DerivedLongStay = { enabled: boolean; threshold: number; discount: number };
export type DerivedMobile = { enabled: boolean; discount: number };

export type HostListing = {
  id: string;
  propertyId: string;
  status: ListingStatus;
  nightlyUsd: number;
  approved: boolean;
  longStay: DerivedLongStay;
  mobile: DerivedMobile;
};

/** Availability and per-night price, keyed by property id then ISO date. */
export type NightState = { blocked?: boolean; price?: number };
export type CalendarMap = Record<string, Record<string, NightState>>;

export type Thread = {
  id: string;
  propertyId: string;
  /** The reservation this conversation is about, when there is one. */
  bookingId?: string;
  withName: string;
  withAvatar?: string;
  unread: number;
  messages: { id: string; from: "me" | "them"; text: string; time: string }[];
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  suspended: boolean;
  /** ISO date/time the suspension lifts itself; null means no end date. */
  suspendedUntil?: string | null;
  joined: string;
  verificationStatus?: "none" | "pending" | "verified" | "rejected" | undefined;
};

export type Payout = {
  id: string;
  hostName: string;
  amountUsd: number;
  status: "paid" | "scheduled";
  date: string;
  /** Stripe transfer reference, once the money has actually been sent. */
  transferId?: string | null;
};

export type HostReview = {
  id: string;
  propertyId: string;
  author: string;
  authorAvatar?: string;
  rating: number;
  text: string;
  date: string;
  reply?: string;
  /** Set by an admin when a comment is censored; hidden from guests. */
  hidden?: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  scopes: ("calendar" | "messaging")[];
};

export type RateRules = { weekend: number; longStay: number; lastMinute: number };

export type FeeRates = { serviceFeeRate: number; taxRate: number };
