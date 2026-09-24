/**
 * Bridge between the Node backend and the app's platform store.
 *
 * Screens keep reading `usePlatform()`. This module fills that store from the
 * server when a server address is configured, and sends every change back.
 * With no server address nothing here runs and the demo data stays in charge.
 */
import { toast } from "sonner";

import { API_BASE_URL, getAccessToken, setAccessToken } from "@/api/http/client";
import {
  accountsApi,
  adminApi,
  calendarApi,
  currencyApi,
  equipmentApi,
  favoritesApi,
  hostApi,
  hostBookingsApi,
  messagingApi,
  propertiesApi,
  reviewsApi,
  settingsApi,
  type AccountDto,
  type AdminListingDto,
  type AdminUserDto,
  type PayoutDto,
  type PropertyDto,
  type ReviewDto,
  type TeamMemberDto,
  type ThreadDto,
} from "@/api/http/platform.http";
import { getPlatform, setPlatform } from "@/hooks/usePlatform";
import type {
  Booking,
  HostListing,
  HostReview,
  Payout,
  PlatformUser,
  Role,
  SessionUser,
  TeamMember,
  Thread,
} from "@/data/platform";
import type { AmenityId, Property, PropertyCategory } from "@/models/property";
import type { ListingRejectionCode } from "@/lib/listingRejectionReasons";

export const backendEnabled = API_BASE_URL !== "";

/**
 * True when a server address is configured but that server cannot be reached.
 * Screens then stay empty instead of showing invented content.
 */
let offline = false;

export function serverOffline(): boolean {
  return offline;
}

/** Pings the server once so the app knows whether it is reachable. */
export async function checkServerReachable(): Promise<boolean> {
  if (!backendEnabled) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, { headers: { accept: "application/json" } });
    offline = !response.ok;
  } catch {
    offline = true;
  }
  return !offline;
}

/** Runs a backend call, turning a refusal into a toast instead of a crash. */
export async function runRemote<T>(action: () => Promise<T>, fallbackMessage: string): Promise<T | null> {
  if (!backendEnabled) return null;
  try {
    return await action();
  } catch (error) {
    if (offline) return null;
    const message = error instanceof Error && error.message ? error.message : fallbackMessage;
    toast.error(message);
    return null;
  }
}

/**
 * Same as `runRemote`, but a refusal stays silent. Used where the server is
 * expected to say no (a role that only unlocks part of the back office).
 */
export async function runQuiet<T>(action: () => Promise<T>): Promise<T | null> {
  if (!backendEnabled) return null;
  try {
    return await action();
  } catch {
    return null;
  }
}

/**
 * Same as `runRemote` but answers "did the server accept it?", so a screen can
 * wait for the server before changing what it shows. With no server address it
 * answers true, because the app is then running on its own local state.
 */
export async function remoteAccepted(action: () => Promise<unknown>, fallbackMessage: string): Promise<boolean> {
  if (!backendEnabled || offline) return true;
  try {
    await action();
    return true;
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : fallbackMessage;
    toast.error(message);
    return false;
  }
}

/* --------------------------------------------------------------- mappers */

/** Roles the server lets into the back office (see permissions.ts on the API). */
const BACK_OFFICE_ROLES = ["admin", "moderator", "support", "accounting"];

export function toSessionUser(account: AccountDto): SessionUser {
  const role: Role = account.roles.includes("admin") ? "admin" : account.roles.includes("host") ? "host" : "guest";
  const backOffice = account.roles.some((held) => BACK_OFFICE_ROLES.includes(held));
  return {
    id: account.id,
    name: account.fullName,
    email: account.email,
    ...(account.phone ? { phone: account.phone } : {}),
    role,
    roles: account.roles,
    backOffice,
    verified: account.verified,
    ...(typeof account.twoFactorEnabled === "boolean" ? { twoFactorEnabled: account.twoFactorEnabled } : {}),
    ...(account.avatarUrl ? { avatarUrl: account.avatarUrl } : {}),
  };
}

export function toProperty(dto: PropertyDto): Property {
  return {
    id: dto.id,
    name: dto.name,
    location: { en: dto.location.en },
    image: dto.image ?? "",
    gallery: dto.gallery ?? [],
    category: dto.category as PropertyCategory,
    guests: dto.guests,
    beds: dto.beds,
    rooms: dto.rooms,
    baths: dto.baths,
    area: dto.area,
    price: dto.price,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    ...(dto.host?.name
      ? { host: { ...(dto.host.id ? { id: dto.host.id } : {}), name: dto.host.name, ...(dto.host.avatarUrl ? { avatarUrl: dto.host.avatarUrl } : {}), since: dto.host.since ?? 0, superhost: dto.host.superhost } }
      : {}),
    tags: dto.tags ?? [],
    amenities: (dto.amenities ?? []) as AmenityId[],
    equipment: dto.equipment ?? [],
    cancellationPolicy: (dto.cancellationPolicy as Property["cancellationPolicy"]) ?? "moderate",
    ...(dto.postal ? { postal: dto.postal } : {}),
    ...(dto.neighbourhood ? { neighbourhood: dto.neighbourhood } : {}),
    ...(dto.summary ? { summary: dto.summary } : {}),
    ...(dto.description ? { description: dto.description } : {}),
    ...(dto.houseRules ? { houseRules: dto.houseRules } : {}),
    ...(dto.checkIn ? { checkIn: dto.checkIn } : {}),
    ...(dto.checkOut ? { checkOut: dto.checkOut } : {}),
    instantBook: dto.instantBook,
    cleaningFee: dto.cleaningFee,
    minNights: dto.minNights,
    ...(dto.coords ? { coords: dto.coords } : {}),
    ...(dto.createdAt ? { createdAt: dto.createdAt } : {}),
  };
}

type HostListingRow = {
  listingId: string;
  propertyId: string;
  status: string;
  approved: boolean;
  nightlyUsd: number;
  /** Sent by the host listings endpoint; absent on the admin listing rows. */
  longStay?: { enabled: boolean; threshold: number; discount: number };
  mobile?: { enabled: boolean; discount: number };
};

export function toHostListing(row: HostListingRow | AdminListingDto): HostListing {
  const rules = row as HostListingRow;
  return {
    id: row.listingId,
    propertyId: row.propertyId,
    status: (row.status as HostListing["status"]) ?? "draft",
    nightlyUsd: row.nightlyUsd,
    approved: row.approved,
    longStay: rules.longStay ?? { enabled: false, threshold: 7, discount: 0 },
    mobile: rules.mobile ?? { enabled: false, discount: 0 },
  };
}

export function toPlatformUser(dto: AdminUserDto): PlatformUser {
  const role: Role = dto.roles.includes("admin") ? "admin" : dto.roles.includes("host") ? "host" : "guest";
  return {
    id: dto.id,
    name: dto.fullName,
    email: dto.email,
    phone: dto.phone,
    role,
    suspended: dto.suspended,
    suspendedUntil: dto.suspendedUntil,
    joined: dto.joinedOn,
    verificationStatus: dto.verificationStatus,
  };
}

export function toPayout(dto: PayoutDto): Payout {
  return {
    id: dto.id,
    hostName: dto.hostName,
    amountUsd: dto.amountUsd,
    status: dto.status,
    date: dto.payoutDate,
    transferId: dto.transferId ?? null,
  };
}

export function toHostReview(dto: ReviewDto): HostReview {
  return {
    id: dto.id,
    propertyId: dto.propertyId,
    author: dto.author,
    ...(dto.authorAvatar ? { authorAvatar: dto.authorAvatar } : {}),
    rating: dto.rating,
    text: dto.body,
    date: dto.date,
    ...(dto.reply ? { reply: dto.reply } : {}),
    hidden: dto.hidden,
  };
}

export function toTeamMember(dto: TeamMemberDto): TeamMember {
  return {
    id: dto.id,
    name: dto.fullName,
    email: dto.email,
    scopes: dto.scopes.filter((scope): scope is TeamMember["scopes"][number] =>
      scope === "calendar" || scope === "messaging",
    ),
  };
}

export function toThread(dto: ThreadDto): Thread {
  return {
    id: dto.id,
    propertyId: dto.propertyId ?? "",
    ...(dto.bookingId ? { bookingId: dto.bookingId } : {}),
    withName: dto.withName,
    ...(dto.withAvatar ? { withAvatar: dto.withAvatar } : {}),
    unread: dto.unread,
    messages: (dto.messages ?? []).map((message) => ({
      id: message.id,
      from: message.from,
      text: message.text,
      time: message.time,
    })),
  };
}

type ServerBooking = {
  id: string;
  reference: string;
  propertyId: string;
  guest: { name: string; email: string | null; phone: string | null };
  from: string;
  to: string;
  nights: number;
  guests: number;
  status: Booking["status"];
  message: string | null;
  price: { total: number; totalUsd?: number };
  payment?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export function toBooking(dto: ServerBooking): Booking {
  return {
    id: dto.id,
    propertyId: dto.propertyId,
    guestName: dto.guest?.name ?? "Guest",
    from: dto.from,
    to: dto.to,
    nights: dto.nights,
    guests: dto.guests,
    totalUsd: dto.price?.totalUsd ?? dto.price?.total ?? 0,
    status: dto.status,
    reference: dto.reference,
    ...(dto.guest?.email ? { guestEmail: dto.guest.email } : {}),
    ...(dto.guest?.phone ? { guestPhone: dto.guest.phone } : {}),
    ...(dto.message ? { message: dto.message } : {}),
    ...(dto.createdAt ? { createdAt: dto.createdAt } : {}),
    ...(dto.updatedAt ? { updatedAt: dto.updatedAt } : {}),
  };
}

/* ------------------------------------------------------------- hydration */

/** Public data every visitor sees: the stay catalogue and platform fees. */
/**
 * A first slice of the catalogue, for the home page and for quick lookups by
 * id. The search page asks the service for exactly the page it shows, and any
 * stay missing here is fetched on demand by `ensureStays`, so the browser
 * never downloads the whole catalogue however large it grows.
 */
async function fetchAllStays() {
  return propertiesApi.list(100, 0, "newest");
}

/**
 * Loads single stays the hydrated catalogue does not hold yet and merges them
 * in, so a saved or directly opened stay never shows up as "not found".
 */
export async function ensureStays(ids: string[]): Promise<void> {
  if (!backendEnabled || ids.length === 0) return;
  const known = new Set(getPlatform().customProperties.map((property) => property.id));
  const missing = [...new Set(ids)].filter((id) => id && !known.has(id));
  if (missing.length === 0) return;

  const loaded = await Promise.all(
    missing.map((id) => runRemote(() => propertiesApi.get(id), "This stay could not be loaded.")),
  );
  const extra = loaded.filter((dto): dto is PropertyDto => Boolean(dto)).map(toProperty);
  if (extra.length === 0) return;

  setPlatform((current) => ({
    customProperties: [
      ...current.customProperties.filter((property) => !extra.some((item) => item.id === property.id)),
      ...extra,
    ],
  }));
}

export async function hydratePublic(): Promise<void> {
  if (!backendEnabled) return;
  const [stays, settings] = await Promise.all([
    runRemote(() => fetchAllStays(), "Stays could not be loaded."),
    runRemote(() => settingsApi.get(), "Platform settings could not be loaded."),
  ]);
  if (stays) setPlatform({ customProperties: stays.map(toProperty) });
  if (settings?.rateRules) setPlatform({ rateRules: settings.rateRules });
  if (settings) setPlatform({ feeRates: { serviceFeeRate: settings.serviceFeeRate, taxRate: settings.taxRate } });
}

/** Everything that depends on who is signed in. */
export async function hydrateAccount(): Promise<void> {
  if (!backendEnabled || !getAccessToken()) return;

  const account = await runRemote(() => accountsApi.me(), "Your session could not be restored.");
  if (!account) {
    setAccessToken(null);
    setPlatform({ session: null });
    return;
  }
  const session = toSessionUser(account);
  setPlatform({ session });

  const [threads, guestBookings, hostBookings] = await Promise.all([
    runRemote(() => messagingApi.threads(), "Messages could not be loaded."),
    runRemote(() => hostBookingsApi.mine(), "Your trips could not be loaded."),
    runRemote(() => hostBookingsApi.list(), "Reservations could not be loaded."),
  ]);
  // Trips (booked as a guest) and requests (received as a host) live in one list.
  const bookings =
    guestBookings || hostBookings
      ? [...(guestBookings ?? []), ...(hostBookings ?? [])].filter(
          (row, index, rows) => rows.findIndex((other) => other["id"] === row["id"]) === index,
        )
      : null;

  if (threads) {
    const withMessages = await Promise.all(
      threads.map((thread) =>
        runRemote(() => messagingApi.thread(thread.id, false), "A conversation could not be opened."),
      ),
    );
    setPlatform({
      threads: withMessages.map((full, index) => toThread(full ?? (threads[index] as ThreadDto))),
    });
  }
  if (bookings) setPlatform({ bookings: (bookings as unknown as ServerBooking[]).map(toBooking) });

  if (session.role === "host" || session.role === "admin") {
    const [dashboard, listings, payouts, team, rateRules, reviews] = await Promise.all([
      runRemote(() => hostApi.dashboard(), "Your dashboard could not be loaded."),
      runRemote(() => fetchHostListings(), "Your listings could not be loaded."),
      runRemote(() => hostApi.payouts(), "Payouts could not be loaded."),
      runRemote(() => hostApi.team(), "Your team could not be loaded."),
      runRemote(() => hostApi.rateRules(), "Rate rules could not be loaded."),
      runRemote(() => reviewsApi.received(), "Reviews could not be loaded."),
    ]);
    if (dashboard) setPlatform({ hostDashboard: dashboard });
    if (listings) {
      setPlatform({ listings });
      await mergeOwnProperties(listings);
    }
    if (payouts) setPlatform({ payouts: payouts.map(toPayout) });
    if (team) setPlatform({ team: team.map(toTeamMember) });
    if (rateRules) setPlatform({ rateRules });
    if (reviews) setPlatform({ reviews: reviews.map(toHostReview) });
  }

  if (session.backOffice) {
    // Delegated roles (moderator, support, accounting) only unlock part of the
    // back office, so a refusal here is expected and must stay silent.
    const quiet = session.role !== "admin";
    const load = <T,>(action: () => Promise<T>, message: string) =>
      quiet ? runQuiet(action) : runRemote(action, message);
    const [overview, users, adminListings, adminPayouts, adminSettings, allReviews] = await Promise.all([
      load(() => adminApi.overview(), "Dashboard figures could not be loaded."),
      load(() => adminApi.users(), "Members could not be loaded."),
      load(() => adminApi.listings(), "Listings could not be loaded."),
      load(() => adminApi.payouts(), "Payouts could not be loaded."),
      load(() => settingsApi.admin(), "Platform settings could not be loaded."),
      load(() => adminApi.reviews(), "Reviews could not be loaded."),
    ]);
    if (overview) setPlatform({ adminOverview: overview });
    if (allReviews) setPlatform({ reviews: allReviews.map(toHostReview) });
    if (users) setPlatform({ users: users.map(toPlatformUser) });
    if (adminListings) setPlatform({ listings: adminListings.map(toHostListing) });
    if (adminPayouts) setPlatform({ payouts: adminPayouts.map(toPayout) });
    if (adminSettings) setPlatform({ commissionRate: adminSettings.commissionRate });
  }

  // Reviews the signed-in guest wrote themselves. Without these a completed
  // stay would offer the review form again after every reload.
  const written = await runQuiet(() => reviewsApi.written());
  if (written?.length) {
    setPlatform((state) => {
      const mine: HostReview[] = written.map(toHostReview);
      const others = state.reviews.filter((review) => !mine.some((row: HostReview) => row.id === review.id));
      return { reviews: [...others, ...mine] };
    });
  }
}

async function fetchHostListings(): Promise<HostListing[]> {
  const { request } = await import("@/api/http/client");
  const rows = await request<HostListingRow[]>("/listings");
  return rows.map(toHostListing);
}

/**
 * The public catalogue only carries approved stays, so a host would not see a
 * brand-new (or rejected, or paused) place of their own. Load the full record
 * for every listing they own and merge it into the catalogue the app reads.
 */
async function mergeOwnProperties(listings: HostListing[]): Promise<void> {
  const { request } = await import("@/api/http/client");
  const known = new Set(getPlatform().customProperties.map((property) => property.id));
  const missing = listings.filter((listing) => !known.has(listing.propertyId));
  if (missing.length === 0) return;

  const loaded = await Promise.all(
    missing.map((listing) =>
      runRemote(
        () => request<{ property: PropertyDto | null }>(`/listings/${encodeURIComponent(listing.id)}`),
        "One of your listings could not be loaded.",
      ),
    ),
  );
  const extra = loaded
    .map((row) => row?.property)
    .filter((property): property is PropertyDto => Boolean(property))
    .map(toProperty);
  if (extra.length === 0) return;

  setPlatform((current) => ({
    customProperties: [
      ...current.customProperties.filter((property) => !extra.some((item) => item.id === property.id)),
      ...extra,
    ],
  }));
}

/* --------------------------------------------------------------- actions */

export const remote = {
  /** Returns "otp_required" when the account has two-step sign-in and no/incorrect code was sent. */
  async signIn(email: string, password: string, otp?: string): Promise<SessionUser | "otp_required" | null> {
    let needsOtp = false;
    const result = await runRemote(async () => {
      try {
        return await accountsApi.login({ email, password, ...(otp ? { otp } : {}) });
      } catch (error) {
        const code = (error as { details?: { serverCode?: string } })?.details?.serverCode;
        if (code === "TWO_FACTOR_REQUIRED" && !otp) {
          needsOtp = true;
          return null;
        }
        throw error;
      }
    }, "Sign-in failed.");
    if (needsOtp) return "otp_required";
    if (!result) return null;
    setAccessToken(result.token);
    const session = toSessionUser(result.account);
    setPlatform({ session });
    await hydrateAccount();
    return session;
  },

  async signUp(fullName: string, email: string, password: string, asHost = false): Promise<SessionUser | null> {
    const result = await runRemote(
      () => accountsApi.signup({ fullName, email, password, asHost }),
      "The account could not be created.",
    );
    if (!result) return null;
    setAccessToken(result.token);
    const session = toSessionUser(result.account);
    setPlatform({ session });
    await hydrateAccount();
    return session;
  },

  signOut(): void {
    setAccessToken(null);
    if (!backendEnabled) return;
    // Nothing of the previous account may stay behind on the device.
    setPlatform({
      session: null,
      bookings: [],
      threads: [],
      listings: [],
      payouts: [],
      team: [],
      users: [],
      reviews: [],
      hostDashboard: null,
      adminOverview: null,
      accountDataStatus: "ready",
    });
  },

  /**
   * Upgrades the signed-in member to a host so they can own listings.
   * Safe to call again: the server simply keeps the role it already granted.
   */
  async becomeHost(
    displayName: string | undefined,
    document: {
      documentKind: "passport" | "id_card" | "driving_licence" | "residence_permit";
      documentReference: string;
      documentFiles?: string[];
    },
  ): Promise<SessionUser | null> {
    const account = await runRemote(
      () => accountsApi.becomeHost({ ...(displayName ? { displayName } : {}), ...document }),
      "Your host account could not be created.",
    );
    if (!account) return null;
    const session = toSessionUser(account);
    setPlatform({ session });
    await hydrateAccount();
    return session;
  },

  saveProfile: (patch: { fullName?: string; phone?: string | null }) =>
    runRemote(() => accountsApi.updateMe(patch), "Your details could not be saved."),
  startTwoFactor: () => runRemote(() => accountsApi.twoFactorSetup(), "Two-step sign-in could not be started."),
  enableTwoFactor: (code: string) =>
    remoteAccepted(() => accountsApi.twoFactorEnable(code), "That code is not valid."),
  disableTwoFactor: (code: string) =>
    remoteAccepted(() => accountsApi.twoFactorDisable(code), "That code is not valid."),
  changePassword: (currentPassword: string, newPassword: string) =>
    remoteAccepted(
      () => accountsApi.changePassword({ currentPassword, newPassword }),
      "Your password could not be changed.",
    ),
  /** Erases the account for good; the caller signs the person out afterwards. */
  deleteAccount: async (password: string, reason?: string) => {
    const result = await runRemote(
      () => accountsApi.deleteMe({ password, ...(reason ? { reason } : {}) }),
      "Your account could not be deleted.",
    );
    return Boolean(result);
  },


  forgotPassword: (email: string) =>
    runRemote(() => accountsApi.forgotPassword({ email }), "The verification code could not be sent."),
  verifyResetCode: (email: string, code: string) =>
    runRemote(() => accountsApi.verifyResetCode({ email, code }), "That code is not valid or has expired."),
  resetPassword: (token: string, password: string) =>
    runRemote(() => accountsApi.resetPassword({ token, password }), "Your password could not be reset."),
  saveAvatar: (dataUrl: string) =>
    runRemote(() => accountsApi.uploadAvatar(dataUrl), "Your profile photo could not be saved."),
  removeAvatar: () =>
    runRemote(() => accountsApi.removeAvatar(), "Your profile photo could not be removed."),

  cookieConsent: (choice: "accepted" | "essential") =>
    runRemote(() => accountsApi.cookieConsent({ choice }), "Your cookie choice could not be saved."),

  addFavorite: (propertyId: string) => runRemote(() => favoritesApi.add(propertyId), "This stay could not be saved."),
  removeFavorite: (propertyId: string) =>
    runRemote(() => favoritesApi.remove(propertyId), "This stay could not be removed."),
  syncFavorites: (ids: string[]) => runRemote(() => favoritesApi.sync(ids), "Your saved stays could not be synced."),

  startThread: (propertyId: string, text: string, bookingId?: string) =>
    runRemote(
      () => messagingApi.start({ propertyId, ...(bookingId ? { bookingId } : {}), body: text }),
      "The conversation could not be started.",
    ),
  sendMessage: (threadId: string, text: string) =>
    runRemote(() => messagingApi.send(threadId, text), "Your message could not be sent."),
  markThreadRead: (threadId: string) => runRemote(() => messagingApi.markRead(threadId), "The thread could not be updated."),

  decideBooking: (bookingId: string, decision: "confirmed" | "declined") =>
    runRemote(() => hostBookingsApi.decide(bookingId, decision), "The reservation could not be updated."),
  cancelBooking: (bookingId: string) =>
    runRemote(() => hostBookingsApi.cancel(bookingId), "The reservation could not be cancelled."),

  saveCalendarNight: (listingId: string, night: string, patch: { blocked?: boolean; priceUsd?: number | null }) =>
    runRemote(() => calendarApi.save(listingId, [{ night, ...patch }]), "The calendar could not be saved."),
  clearCalendarNight: (listingId: string, night: string) =>
    runRemote(() => calendarApi.clear(listingId, [night]), "The calendar could not be saved."),

  saveRateRules: (rules: { weekend: number; longStay: number; lastMinute: number }) =>
    runRemote(() => hostApi.saveRateRules(rules), "Your rate rules could not be saved."),
  setPayoutOnboarding: (enabled: boolean) =>
    runRemote(() => hostApi.onboardPayouts(enabled), "Payout setup could not be updated."),
  addTeamMember: (member: { fullName: string; email: string; scopes: string[] }) =>
    runRemote(() => hostApi.addTeamMember(member), "This team member could not be added."),
  // Answers true only when the server removed the row, so the list never hides
  // a member who is still on the account.
  removeTeamMember: (id: string) =>
    remoteAccepted(() => hostApi.removeTeamMember(id), "This team member could not be removed."),
  replyToReview: (reviewId: string, reply: string) =>
    runRemote(() => reviewsApi.reply(reviewId, reply), "Your reply could not be saved."),
  createReview: async (bookingId: string, rating: number, body: string) => {
    const created = await runRemote(() => reviewsApi.create({ bookingId, rating, body }), "Your review could not be published.");
    // Reload the stay so its new average rating and review count show everywhere.
    if (created && typeof created === "object" && "propertyId" in created) {
      const id = (created as { propertyId: string }).propertyId;
      const fresh = await runRemote(() => propertiesApi.get(id), "This stay could not be refreshed.");
      if (fresh) {
        const next = toProperty(fresh);
        setPlatform((current) => ({
          customProperties: current.customProperties.some((p) => p.id === id)
            ? current.customProperties.map((p) => (p.id === id ? next : p))
            : [...current.customProperties, next],
        }));
      }
    }
    return created;
  },

  // Back-office actions answer true only when the server accepted the change,
  // so the screen never shows a success it did not get.
  approveListing: (listingId: string) =>
    remoteAccepted(() => adminApi.approveListing(listingId), "The listing could not be approved."),
  rejectListing: (listingId: string, reasonCode: ListingRejectionCode = "not_compliant", details?: string) =>
    remoteAccepted(
      () => adminApi.rejectListing(listingId, reasonCode, details),
      "The listing could not be rejected.",
    ),
  /** Suspend takes the stay off the site; reinstate puts it back live. */
  setListingSuspended: (listingId: string, suspended: boolean, reason?: string) =>
    remoteAccepted(
      () => (suspended ? adminApi.suspendListing(listingId, reason) : adminApi.restoreListing(listingId)),
      "The listing could not be updated.",
    ),
  /** `until` is an ISO date/time; omit it to suspend with no end date. */
  setUserSuspended: (userId: string, suspended: boolean, reason?: string, until?: string | null) =>
    remoteAccepted(
      () =>
        suspended
          ? adminApi.suspendUser(userId, reason ?? "Suspended from the admin back office.", until)
          : adminApi.restoreUser(userId),
      "This member could not be updated.",
    ),
  setReviewHidden: (reviewId: string, hidden: boolean) =>
    remoteAccepted(
      () => (hidden ? adminApi.hideReview(reviewId) : adminApi.restoreReview(reviewId)),
      "This comment could not be updated.",
    ),
  deleteReview: (reviewId: string) =>
    remoteAccepted(() => adminApi.deleteReview(reviewId), "This comment could not be removed."),
  /** Triggers the real transfer to the host and refreshes the payout row. */
  markPayoutPaid: (payoutId: string) =>
    runRemote(() => adminApi.markPayoutPaid(payoutId), "The payout could not be sent to the host."),
  reports: () => runRemote(() => adminApi.reports(), "The reports could not be loaded."),
  saveCommission: (commissionRate: number) =>
    remoteAccepted(() => settingsApi.saveAdmin({ commissionRate }), "The commission could not be saved."),

  equipment: () => runRemote(() => equipmentApi.list(), "The equipment catalogue could not be loaded."),
  rates: () => runRemote(() => currencyApi.rates(), "Exchange rates could not be loaded."),
  favoriteIds: () => runRemote(() => favoritesApi.ids(), "Your saved stays could not be loaded."),
  propertyReviews: (propertyId: string) =>
    runRemote(() => propertiesApi.reviews(propertyId), "Reviews could not be loaded."),
};

/**
 * Loads the visible reviews of one stay from the server and merges them into
 * the store, so the detail page never has to fall back to bundled data.
 */
export async function loadPropertyReviews(propertyId: string): Promise<void> {
  if (!backendEnabled) return;
  const list = await remote.propertyReviews(propertyId);
  if (!list) return;
  const mapped = list.map(toHostReview);
  const others = getPlatform().reviews.filter((review) => review.propertyId !== propertyId);
  setPlatform({ reviews: [...others, ...mapped] });
}
