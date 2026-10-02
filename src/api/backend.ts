/**
 * Bridge between the Node backend and the app's platform store.
 *
 * Screens keep reading `usePlatform()`. This module fills that store from the
 * server when a server address is configured, and sends every change back.
 * With no server address nothing here runs and the demo data stays in charge.
 */
import { toast } from "sonner";
import { activeServiceLocale, serviceError } from "@/i18n/serviceErrors";

import { API_BASE_URL, getAccessToken, setAccessToken } from "@/api/http/client";
import { ApiError, type ApiErrorCode } from "@/api/types";
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
    const message = error instanceof Error && error.message && activeServiceLocale() === "en" ? error.message : fallbackMessage;
    toast.error(serviceError(message));
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
    const message = error instanceof Error && error.message && activeServiceLocale() === "en" ? error.message : fallbackMessage;
    toast.error(serviceError(message));
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
    emailVerified: account.emailVerified,
    verificationStatus: account.verificationStatus ?? "none",
    payoutsOnboarded: account.host?.payoutsOnboarded ?? false,
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
    currency: dto.currency ?? "EUR",
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    ...(dto.host?.name
      ? { host: { ...(dto.host.id ? { id: dto.host.id } : {}), name: dto.host.name, ...(dto.host.avatarUrl ? { avatarUrl: dto.host.avatarUrl } : {}), since: dto.host.since ?? 0, superhost: dto.host.superhost, verified: dto.host.verified === true } }
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
  rejectedReason?: string | null;
  currency?: string;
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
    currency: (row as HostListingRow).currency ?? "EUR",
    approved: row.approved,
    ...(row.rejectedReason ? { rejectedReason: row.rejectedReason } : {}),
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
    avatarUrl: dto.avatarUrl ?? null,
    verificationStatus: dto.verificationStatus,
  };
}

export function toPayout(dto: PayoutDto): Payout {
  return {
    id: dto.id,
    hostName: dto.hostName,
    amountUsd: dto.amountUsd,
    currency: dto.currency ?? "EUR",
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

// Older servers send a Postgres array literal ("{calendar,messaging}") instead of a list.
function toScopeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.replace(/^\{|\}$/g, "").split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export function toTeamMember(dto: TeamMemberDto): TeamMember {
  return {
    id: dto.id,
    name: dto.fullName,
    email: dto.email,
    scopes: toScopeList(dto.scopes).filter((scope): scope is TeamMember["scopes"][number] =>
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
      ...(message.attachmentUrl ? { attachmentUrl: message.attachmentUrl } : {}),
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
  price: { total: number; totalUsd?: number; currency?: string };
  currency?: string;
  payment?: { method?: "card"; brand: string; last4: string; status: string; reference: string } | null;
  propertyName?: string | null;
  propertyCity?: string | null;
  propertyPhoto?: string | null;
  cancellationPolicy?: string | null;
  review?: { id: string; rating: number; body: string } | null;
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
    currency: (dto.currency ?? dto.price?.currency ?? "EUR").trim(),
    status: dto.status,
    reference: dto.reference,
    ...(dto.guest?.email ? { guestEmail: dto.guest.email } : {}),
    ...(dto.guest?.phone ? { guestPhone: dto.guest.phone } : {}),
    ...(dto.message ? { message: dto.message } : {}),
    ...(dto.payment
      ? {
          payment: {
            method: "card" as const,
            brand: (["visa", "mastercard", "amex"].includes(dto.payment.brand) ? dto.payment.brand : "card") as NonNullable<Booking["payment"]>["brand"],
            last4: dto.payment.last4,
            status: dto.payment.status as NonNullable<Booking["payment"]>["status"],
            reference: dto.payment.reference,
          },
        }
      : {}),
    ...(dto.propertyName
      ? {
          propertySnapshot: {
            name: dto.propertyName,
            city: dto.propertyCity ?? "",
            image: dto.propertyPhoto ?? "",
            ...(dto.cancellationPolicy ? { cancellationPolicy: dto.cancellationPolicy } : {}),
          },
        }
      : {}),
    ...(dto.review ? { review: { id: dto.review.id, rating: dto.review.rating, text: dto.review.body } } : {}),
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

  // A pending/own listing can 404 on the public endpoint until it is approved;
  // that is expected, so fail quietly instead of showing an error toast.
  const loaded = await Promise.all(missing.map((id) => runQuiet(() => propertiesApi.get(id))));
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
  if (stays) {
    // Keep the host's own unpublished places, which the public list never carries.
    setPlatform((current) => {
      const own = new Set(current.listings.map((listing) => listing.propertyId));
      const fresh = stays.map(toProperty);
      const ids = new Set(fresh.map((property) => property.id));
      const kept = current.customProperties.filter((property) => own.has(property.id) && !ids.has(property.id));
      return { customProperties: [...fresh, ...kept] };
    });
  }
  if (settings?.rateRules) setPlatform({ rateRules: settings.rateRules });
  if (settings) setPlatform({ feeRates: { serviceFeeRate: settings.serviceFeeRate, taxRate: settings.taxRate } });
}

/** Re-reads conversations and their messages so new replies appear without a reload. */
export async function refreshThreads(): Promise<void> {
  if (!backendEnabled || !getAccessToken()) return;
  const threads = await runQuiet(() => messagingApi.threads());
  if (!threads) return;
  const full = await Promise.all(threads.map((thread) => runQuiet(() => messagingApi.thread(thread.id, false))));
  setPlatform({ threads: full.map((row, index) => toThread(row ?? (threads[index] as ThreadDto))) });
}

/** Everything that depends on who is signed in. */
const SITE_LOCALES = ["en", "fr", "es", "de", "pt"] as const;
type SiteLocale = (typeof SITE_LOCALES)[number];

/** Language the visitor is currently reading the site in. */
export function currentSiteLocale(): SiteLocale {
  if (typeof document === "undefined") return "fr";
  const lang = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
  return (SITE_LOCALES as readonly string[]).includes(lang) ? (lang as SiteLocale) : "fr";
}

/** Saves the site language on the signed-in account so emails use it too. */
export async function syncAccountLocale(saved?: string | null, next: SiteLocale = currentSiteLocale()): Promise<void> {
  if (!backendEnabled || !getAccessToken() || saved === next) return;
  try {
    await accountsApi.updateMe({ locale: next });
  } catch {
    /* not critical: the next visit retries */
  }
}

export async function hydrateAccount(): Promise<void> {
  if (!backendEnabled || !getAccessToken()) return;

  const account = await runRemote(() => accountsApi.me(), "Your session could not be restored.");
  if (!account) {
    setAccessToken(null);
    setPlatform({ session: null });
    return;
  }
  const session = toSessionUser(account);
  setPlatform({ session, stripeOnboarded: session.payoutsOnboarded ?? false });
  // Emails go out in the language saved on the account: keep it equal to the site language.
  void syncAccountLocale((account as { locale?: string }).locale);

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

  if (bookings) setPlatform({ bookings: (bookings as unknown as ServerBooking[]).map(toBooking) });
  if (threads) {
    // Show conversations at once; fill in each thread's messages in the
    // background so trips and dashboards are not held up by them.
    setPlatform({ threads: threads.map((thread) => toThread(thread as ThreadDto)) });
    void Promise.all(
      threads.map((thread) =>
        runQuiet(() => messagingApi.thread(thread.id, false)),
      ),
    ).then((full) => {
      setPlatform({
        threads: full.map((row, index) => toThread(row ?? (threads[index] as ThreadDto))),
      });
    });
  }

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

  // One request for all of them; older servers without the batch call fall
  // back to one request per listing.
  const batch = await runQuiet(() =>
    request<{ listingId: string; property: PropertyDto | null }[]>(
      `/listings/batch?ids=${missing.map((listing) => encodeURIComponent(listing.id)).join(",")}`,
    ),
  );
  const loaded = batch
    ? batch
    : await Promise.all(
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
    setPlatform({ session, stripeOnboarded: session.payoutsOnboarded ?? false });
    // Load the rest of the account in the background so sign-in moves on at once.
    void hydrateAccount();
    return session;
  },

  async signUp(fullName: string, email: string, password: string, asHost = false): Promise<SessionUser | null> {
    const result = await runRemote(
      () => accountsApi.signup({ fullName, email, password, asHost, locale: currentSiteLocale() }),
      "The account could not be created.",
    );
    if (!result) return null;
    setAccessToken(result.token);
    const session = toSessionUser(result.account);
    setPlatform({ session, stripeOnboarded: session.payoutsOnboarded ?? false });
    // Load the rest of the account in the background so sign-in moves on at once.
    void hydrateAccount();
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
      stripeOnboarded: false,
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
    setPlatform({ session, stripeOnboarded: session.payoutsOnboarded ?? false });
    // Load the rest of the account in the background so sign-in moves on at once.
    void hydrateAccount();
    return session;
  },

  saveProfile: (patch: { fullName?: string; phone?: string | null }) =>
    runRemote(() => accountsApi.updateMe(patch), "Your details could not be saved."),
  startTwoFactor: () => runRemote(() => accountsApi.twoFactorSetup(), "Two-step sign-in could not be started."),
  enableTwoFactor: (code: string) =>
    remoteAccepted(() => accountsApi.twoFactorEnable(code), "That code is not valid."),
  disableTwoFactor: (code: string) =>
    remoteAccepted(() => accountsApi.twoFactorDisable(code), "That code is not valid."),
  /**
   * Returns the server's verdict directly instead of a plain boolean so the
   * dialog can show an inline, translated message for a wrong current
   * password instead of a generic toast (the member stays signed in either
   * way).
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ ok: boolean; code?: ApiErrorCode }> => {
    if (!backendEnabled || offline) return { ok: true };
    try {
      await accountsApi.changePassword({ currentPassword, newPassword });
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_CURRENT_PASSWORD") {
        return { ok: false, code: error.code };
      }
      const message = error instanceof Error && error.message && activeServiceLocale() === "en" ? error.message : "Your password could not be changed.";
      toast.error(serviceError(message));
      return { ok: false };
    }
  },
  /**
   * Erases the account for good; the caller signs the person out afterwards.
   * A `CONFLICT` (upcoming trip or pending payout) is handed back untouched
   * so the dialog can explain it inline instead of a generic toast.
   */
  deleteAccount: async (password: string, reason?: string): Promise<{ ok: boolean; code?: ApiErrorCode }> => {
    if (!backendEnabled || offline) {
      toast.error(serviceError("The account service is unreachable right now. Please try again in a moment."));
      return { ok: false };
    }
    try {
      await accountsApi.deleteMe({ password, ...(reason ? { reason } : {}) });
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONFLICT") {
        return { ok: false, code: error.code };
      }
      const message = error instanceof Error && error.message && activeServiceLocale() === "en" ? error.message : "Your account could not be deleted.";
      toast.error(serviceError(message));
      return { ok: false };
    }
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
  openThread: (propertyId: string, bookingId?: string) =>
    runRemote(
      () => messagingApi.open({ propertyId, ...(bookingId ? { bookingId } : {}) }),
      "The conversation could not be opened.",
    ),
  sendMessage: (threadId: string, text: string, attachmentUrl?: string) =>
    runRemote(() => messagingApi.send(threadId, text, attachmentUrl), "Your message could not be sent."),
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

// An expired or revoked session wipes the account and its private data at once.
if (typeof window !== "undefined") {
  window.addEventListener("nestara:session-expired", () => remote.signOut());
}
