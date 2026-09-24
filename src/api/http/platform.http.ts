/**
 * Endpoint map for everything outside the booking and listing flows:
 * accounts, stays, favourites, messaging, host, admin, reviews, settings,
 * equipment and currency. One function per route of the Node backend.
 */
import { request, requestWithMeta } from "@/api/http/client";
import type { ListingRejectionCode } from "@/lib/listingRejectionReasons";

/* ---------------------------------------------------------------- accounts */

export type AccountDto = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  verified: boolean;
  suspended: boolean;
  avatarUrl: string | null;
  locale: string;
  currency: string;
  twoFactorEnabled: boolean;
  roles: ("guest" | "host" | "admin")[];
  joinedOn: string;
  lastLoginAt: string | null;
  host: {
    displayName: string;
    hostingSince: number;
    superhost: boolean;
    bio: string | null;
    responseRate: number | null;
    payoutsOnboarded: boolean;
  } | null;
};

export type SessionDto = { account: AccountDto; token: string };

export const accountsApi = {
  signup: (body: { fullName: string; email: string; password: string; phone?: string; asHost?: boolean }) =>
    request<SessionDto>("/accounts/signup", { method: "POST", body }),
  login: (body: { email: string; password: string; otp?: string }) =>
    request<SessionDto>("/accounts/login", { method: "POST", body }),
  twoFactorSetup: () => request<{ secret: string; otpauthUrl: string }>("/accounts/2fa/setup", { method: "POST", body: {} }),
  twoFactorEnable: (code: string) => request<{ enabled: boolean }>("/accounts/2fa/enable", { method: "POST", body: { code } }),
  twoFactorDisable: (code: string) => request<{ enabled: boolean }>("/accounts/2fa/disable", { method: "POST", body: { code } }),
  me: () => request<AccountDto>("/accounts/me"),
  updateMe: (body: Record<string, unknown>) => request<AccountDto>("/accounts/me", { method: "PATCH", body }),
  uploadAvatar: (dataUrl: string) => request<AccountDto>("/accounts/me/avatar", { method: "PUT", body: { dataUrl } }),
  removeAvatar: () => request<AccountDto>("/accounts/me/avatar", { method: "DELETE" }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<void>("/accounts/me/password", { method: "POST", body }),
  /** GDPR erasure: the password confirms the person asking. */
  deleteMe: (body: { password: string; reason?: string }) =>
    request<{ deletedAt: string }>("/accounts/me", { method: "DELETE", body }),

  /** An identity document is mandatory to become a host. */
  becomeHost: (body: {
    displayName?: string;
    documentKind: "passport" | "id_card" | "driving_licence" | "residence_permit";
    documentReference: string;
    documentFiles?: string[];
  }) => request<AccountDto>("/accounts/me/become-host", { method: "POST", body }),
  forgotPassword: (body: { email: string }) =>
    request<{ message: string; devCode?: string; expiresAt?: string }>("/accounts/forgot-password", {
      method: "POST",
      body,
    }),
  verifyResetCode: (body: { email: string; code: string }) =>
    request<{ message: string; token: string; expiresAt: string }>("/accounts/verify-reset-code", {
      method: "POST",
      body,
    }),
  resetPassword: (body: { token: string; password: string }) =>
    request<{ message: string }>("/accounts/reset-password", { method: "POST", body }),
  cookieConsent: (body: { choice: "accepted" | "essential" }) =>
    request<unknown>("/accounts/cookie-consent", { method: "POST", body: { ...body, deviceId: deviceId() } }),
};

/** Stable per-device id so a visitor's cookie choice can be stored before sign-in. */
const DEVICE_KEY = "nestara.deviceId";

function deviceId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/* -------------------------------------------------------------- properties */

export type PropertyDto = {
  id: string;
  createdAt?: string;
  name: string;
  location: { en: string; city: string; country: string };
  category: string;
  summary: string | null;
  description: string | null;
  neighbourhood: string | null;
  postal: string | null;
  coords: { lat: number; lng: number } | null;
  guests: number;
  rooms: number;
  beds: number;
  baths: number;
  area: number;
  price: number;
  cleaningFee: number;
  minNights: number;
  cancellationPolicy: string;
  houseRules: string | null;
  checkIn: string | null;
  checkOut: string | null;
  instantBook: boolean;
  rating: number;
  reviewCount: number;
  amenities: string[];
  equipment: string[];
  tags: string[];
  image: string | null;
  gallery: string[];
  host: { id: string | null; name: string | null; avatarUrl: string | null; since: number | null; superhost: boolean } | null;
  listing: {
    id: string;
    status: string;
    approved: boolean;
    nightlyUsd: number;
    longStay: { enabled: boolean; threshold: number; discount: number };
    mobile: { enabled: boolean; discount: number };
  } | null;
};

/**
 * Search filters sent to the service. Everything is optional: only the filters
 * the guest actually set are put on the URL, so the service does the work and
 * the browser never downloads the whole catalogue.
 */
export type StayQueryDto = {
  where?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  beds?: number;
  baths?: number;
  rooms?: number;
  guests?: number;
  amenities?: string;
  equipment?: string;
  superhost?: boolean;
  from?: string;
  to?: string;
  sort?: string;
  locale?: string;
};

export const propertiesApi = {
  // The server caps a page at 100 stays; hydration walks the pages.
  list: (limit = 100, offset = 0, sort?: string) => request<PropertyDto[]>("/stays", { query: { limit, offset, ...(sort ? { sort } : {}) } }),
  /** One page of search results, with the total so the page can say how many. */
  search: async (query: StayQueryDto, limit: number, offset: number) => {
    const { data, meta } = await requestWithMeta<PropertyDto[]>("/stays", {
      query: { ...query, limit, offset },
    });
    return {
      items: data,
      total: meta?.total ?? data.length,
      hasMore: meta?.hasMore ?? false,
    };
  },
  /** Result counts per property type for the same filters (the chips). */
  categories: (query: StayQueryDto) =>
    request<Record<string, number>>("/stays/categories", { query: { ...query, category: undefined } }),
  // Stays that are not free for those nights, so the search page can hide them.
  unavailable: (from: string, to: string) => request<string[]>("/stays/unavailable", { query: { from, to } }),
  get: (id: string) => request<PropertyDto>(`/stays/${encodeURIComponent(id)}`),
  reviews: (id: string) => request<ReviewDto[]>(`/stays/${encodeURIComponent(id)}/reviews`),
  calendar: (id: string, from: string, to: string) =>
    request<{ night: string; blocked: boolean; priceUsd: number | null }[]>(
      `/stays/${encodeURIComponent(id)}/calendar`,
      { query: { from, to } },
    ),
};

/* --------------------------------------------------------------- favorites */

export const favoritesApi = {
  ids: () => request<string[]>("/favorites/ids"),
  list: () => request<PropertyDto[]>("/favorites"),
  add: (propertyId: string) =>
    request<{ propertyId: string; saved: boolean }>(`/favorites/${encodeURIComponent(propertyId)}`, { method: "PUT" }),
  remove: (propertyId: string) =>
    request<void>(`/favorites/${encodeURIComponent(propertyId)}`, { method: "DELETE" }),
  sync: (propertyIds: string[]) => request<string[]>("/favorites/sync", { method: "POST", body: { propertyIds } }),
};

/* --------------------------------------------------------------- messaging */

export type MessageDto = {
  id: string;
  from: "me" | "them";
  senderRole: string;
  text: string;
  sentAt: string;
  time: string;
  readAt: string | null;
};

export type ThreadDto = {
  id: string;
  propertyId: string | null;
  bookingId: string | null;
  withName: string;
  withAvatar: string | null;
  closed: boolean;
  unread: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  messages?: MessageDto[];
};

export const messagingApi = {
  threads: () => request<ThreadDto[]>("/messaging/threads"),
  /** `markRead: false` keeps unread badges intact when the inbox prefetches. */
  thread: (id: string, markRead = true) =>
    request<ThreadDto>(`/messaging/threads/${encodeURIComponent(id)}?markRead=${markRead ? "true" : "false"}`),
  start: (body: { propertyId?: string; bookingId?: string; body: string }) =>
    request<ThreadDto>("/messaging/threads", { method: "POST", body }),
  send: (threadId: string, text: string) =>
    request<MessageDto>(`/messaging/threads/${encodeURIComponent(threadId)}/messages`, {
      method: "POST",
      body: { body: text },
    }),
  markRead: (threadId: string) =>
    request<unknown>(`/messaging/threads/${encodeURIComponent(threadId)}/read`, { method: "POST", body: {} }),
};

/* -------------------------------------------------------------------- host */

export type HostDashboardDto = {
  listings: { total: number; published: number; awaitingApproval: number; drafts: number; suspended: number };
  bookings: { pending: number; upcoming: number; staying: number; completed: number; cancelled: number };
  earnings: { grossUsd: number; netUsd: number; pendingPayoutUsd: number; paidOutUsd: number };
  reviews: { count: number; averageRating: number; awaitingReply: number };
  messages: { openThreads: number; unread: number };
  occupancy: { nightsBooked: number; nightsAvailable: number; ratePercent: number };
};
export type TeamMemberDto = { id: string; fullName: string; email: string; scopes: string[]; createdAt: string };
export type PayoutDto = {
  id: string;
  hostId: string | null;
  hostName: string;
  amountUsd: number;
  commissionUsd: number;
  status: "paid" | "scheduled";
  payoutDate: string;
  bookings: string[];
  createdAt: string;
  /** Stripe transfer reference, once the money has actually been sent. */
  transferId?: string | null;
  paidAt?: string | null;
};
export type RateRulesDto = { weekend: number; longStay: number; lastMinute: number };

export const hostApi = {
  dashboard: () => request<HostDashboardDto>("/host/dashboard"),
  earnings: () => request<Record<string, unknown>>("/host/earnings"),
  payouts: () => request<PayoutDto[]>("/host/payouts"),
  onboardPayouts: (enabled: boolean) =>
    request<unknown>("/host/payouts/onboarding", { method: "POST", body: { onboarded: enabled } }),
  rateRules: () => request<RateRulesDto>("/host/rate-rules"),
  saveRateRules: (body: RateRulesDto) => request<RateRulesDto>("/host/rate-rules", { method: "PUT", body }),
  team: () => request<TeamMemberDto[]>("/host/team"),
  addTeamMember: (body: { fullName: string; email: string; scopes: string[] }) =>
    request<TeamMemberDto>("/host/team", { method: "POST", body }),
  removeTeamMember: (id: string) => request<void>(`/host/team/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

/* ----------------------------------------------------------------- reviews */

export type ReviewDto = {
  id: string;
  propertyId: string;
  bookingId: string | null;
  author: string;
  authorId: string | null;
  authorAvatar: string | null;
  rating: number;
  body: string;
  reply: string | null;
  repliedAt: string | null;
  hidden: boolean;
  hiddenReason: string | null;
  date: string;
  createdAt: string;
};

export type ReviewHighlightDto = {
  id: string;
  author: string;
  authorAvatar: string | null;
  rating: number;
  body: string;
  propertyId: string;
  propertyName: string;
  city: string;
  country: string;
  date: string;
};

export const reviewsApi = {
  /** Real 5-star guest reviews for the homepage. */
  highlights: () => request<ReviewHighlightDto[]>("/reviews/highlights"),
  received: () => request<ReviewDto[]>("/reviews/host/received"),
  written: () => request<ReviewDto[]>("/reviews/mine/written"),
  pending: () => request<{ bookingId: string; propertyId: string }[]>("/reviews/mine/pending"),
  create: (body: { bookingId: string; rating: number; body: string }) =>
    request<ReviewDto>("/reviews", { method: "POST", body }),
  reply: (reviewId: string, reply: string) =>
    request<ReviewDto>(`/reviews/${encodeURIComponent(reviewId)}/reply`, { method: "POST", body: { reply } }),
};

/* ------------------------------------------------------------------- admin */

export type AdminUserDto = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roles: ("guest" | "host" | "admin")[];
  verified: boolean;
  suspended: boolean;
  suspendedReason: string | null;
  /** ISO date/time the suspension lifts itself; null means no end date. */
  suspendedUntil: string | null;
  banned: boolean;
  joinedOn: string;
  lastLoginAt: string | null;
  bookings: number;
  listings: number;
};

export type AdminListingDto = {
  listingId: string;
  propertyId: string;
  name: string;
  city: string;
  country: string;
  category: string;
  hostId: string | null;
  hostName: string | null;
  status: "draft" | "published" | "suspended";
  approved: boolean;
  rejectedReason: string | null;
  nightlyUsd: number;
  photoCount: number;
  createdAt: string;
};

export type AdminHostProfileDto = {
  host: AdminUserDto & {
    displayName: string | null;
    hostingSince: number | null;
    superhost: boolean;
    bannedReason: string | null;
    commissionRate: number | null;
    defaultCommissionRate: number;
    verificationStatus: "none" | "pending" | "verified" | "rejected";
  };
  totals: {
    listings: number;
    publishedListings: number;
    bookings: number;
    completedBookings: number;
    cancelledBookings: number;
    grossRevenueUsd: number;
    commissionUsd: number;
    averageRating: number;
    reviews: number;
  };
  listings: AdminListingDto[];
  bookings: {
    id: string;
    reference: string;
    propertyId: string;
    propertyName: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    status: string;
    totalUsd: number;
  }[];
  reviews: {
    id: string;
    propertyId: string;
    propertyName: string;
    authorName: string;
    rating: number;
    body: string;
    hidden: boolean;
    createdAt: string | null;
  }[];
  documents: {
    id: string;
    status: string;
    documentKind: string | null;
    documentReference: string | null;
    documentFiles: string[] | null;
    notes: string | null;
    createdAt: string;
    decidedAt: string | null;
  }[];
};

export type AdminReportsDto = {
  monthly: { month: string; bookings: number; revenueUsd: number; commissionUsd: number }[];
  topListings: { propertyId: string; name: string; bookings: number; revenueUsd: number; rating: number }[];
  topHosts: { hostId: string; hostName: string; listings: number; revenueUsd: number }[];
  cancellations: { reason: string; count: number; refundedUsd: number }[];
};

export type AdminOverviewDto = {
  users: { total: number; guests: number; hosts: number; admins: number; suspended: number };
  listings: { total: number; published: number; awaitingApproval: number; suspended: number };
  bookings: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  revenue: { grossUsd: number; commissionUsd: number; payoutsUsd: number; payoutsPendingUsd: number };
  reviews: { total: number; hidden: number; averageRating: number };
};

export const adminApi = {
  overview: () => request<AdminOverviewDto>("/admin/overview"),
  reports: () => request<AdminReportsDto>("/admin/reports?months=12"),
  listings: () => request<AdminListingDto[]>("/admin/listings?scope=all&limit=100"),
  reviews: () => request<ReviewDto[]>("/admin/reviews"),
  approveListing: (id: string) =>
    request<unknown>(`/admin/listings/${encodeURIComponent(id)}/approve`, { method: "POST", body: {} }),
  rejectListing: (id: string, reasonCode: ListingRejectionCode, details?: string) =>
    request<unknown>(`/admin/listings/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: { reasonCode, details },
    }),
  suspendListing: (id: string, reason = "Suspended from the admin back office.") =>
    request<unknown>(`/admin/listings/${encodeURIComponent(id)}/suspend`, { method: "POST", body: { reason } }),
  restoreListing: (id: string) =>
    request<unknown>(`/admin/listings/${encodeURIComponent(id)}/restore`, { method: "POST", body: {} }),
  users: () => request<AdminUserDto[]>("/admin/users"),
  /** `until` is an ISO date/time; omit it for a suspension with no end date. */
  suspendUser: (id: string, reason = "Suspended from the admin back office.", until?: string | null) =>
    request<unknown>(`/admin/users/${encodeURIComponent(id)}/suspend`, {
      method: "POST",
      body: { reason, until: until ?? null },
    }),
  hostProfile: (id: string) => request<AdminHostProfileDto>(`/admin/hosts/${encodeURIComponent(id)}`),
  restoreUser: (id: string) =>
    request<unknown>(`/admin/users/${encodeURIComponent(id)}/restore`, { method: "POST", body: {} }),
  payouts: () => request<PayoutDto[]>("/admin/payouts"),
  /** Sends the money to the host, then records the payout as paid. */
  markPayoutPaid: (payoutId: string) =>
    request<PayoutDto>(`/admin/payouts/${encodeURIComponent(payoutId)}/paid`, { method: "POST", body: {} }),
  hideReview: (id: string, reason = "Hidden from the admin back office.") =>
    request<unknown>(`/admin/reviews/${encodeURIComponent(id)}/hide`, { method: "POST", body: { reason } }),
  restoreReview: (id: string) =>
    request<unknown>(`/admin/reviews/${encodeURIComponent(id)}/restore`, { method: "POST", body: {} }),
  deleteReview: (id: string) => request<void>(`/admin/reviews/${encodeURIComponent(id)}`, { method: "DELETE" }),
  moderationLog: () => request<Record<string, unknown>[]>("/admin/moderation-log"),
};

/* -------------------------------------------------- settings / catalogues */

export type PublicSettingsDto = {
  serviceFeeRate: number;
  taxRate: number;
  rateRules: RateRulesDto;
  updatedAt?: string;
};

export type AdminSettingsDto = PublicSettingsDto & { commissionRate: number };

export const settingsApi = {
  get: () => request<PublicSettingsDto>("/settings"),
  admin: () => request<AdminSettingsDto>("/settings/admin"),
  saveAdmin: (body: Partial<{ serviceFeeRate: number; taxRate: number; commissionRate: number; weekend: number; longStay: number; lastMinute: number }>) =>
    request<AdminSettingsDto>("/settings/admin", { method: "PUT", body }),
};

export type EquipmentDto = { id: string; group: string; label: { en: string; fr: string }; paid: boolean; active: boolean };

export const equipmentApi = {
  list: () => request<EquipmentDto[]>("/equipment"),
};

export const currencyApi = {
  rates: () => request<{ base: string; rates: Record<string, number>; source?: string }>("/currency/rates"),
};

/* ---------------------------------------------------------------- bookings */

export const hostBookingsApi = {
  /** Reservations the signed-in member made as a guest (their trips). */
  mine: () => request<Record<string, unknown>[]>("/bookings"),
  /** Reservations received on the member's own listings. */
  list: () => request<Record<string, unknown>[]>("/bookings/host"),
  decide: (bookingId: string, decision: "confirmed" | "declined") =>
    request<Record<string, unknown>>(`/bookings/${encodeURIComponent(bookingId)}/decision`, {
      method: "POST",
      body: { decision },
    }),
  cancel: (bookingId: string, reason?: string) =>
    request<Record<string, unknown>>(`/bookings/${encodeURIComponent(bookingId)}/cancel`, {
      method: "POST",
      body: reason ? { reason } : {},
    }),
};

/* ------------------------------------------------------- listing calendar */

export const calendarApi = {
  save: (listingId: string, nights: { night: string; blocked?: boolean; priceUsd?: number | null }[]) =>
    request<unknown>(`/listings/${encodeURIComponent(listingId)}/calendar`, { method: "PUT", body: { nights } }),
  clear: (listingId: string, nights: string[]) =>
    request<void>(`/listings/${encodeURIComponent(listingId)}/calendar`, { method: "DELETE", body: { nights } }),
};
