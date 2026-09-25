import { ApiError, type ApiErrorCode } from "@/api/types";
import { clearSearchCache } from "@/lib/searchCache";

/**
 * Tiny transport used by the HTTP adapters. It knows three things: where the
 * API lives, how to attach the access token, and how to turn a server error
 * envelope into the `ApiError` the UI already knows how to render.
 */

// The production RoomEasy API. `VITE_API_BASE_URL` can override it locally.
export const API_BASE_URL: string = (
  (import.meta.env['VITE_API_BASE_URL'] as string | undefined)?.trim() ||
  "https://api.roomeasy.fr"
)
  .replace(/\/+$/, "")
  // Request paths already start with "/api", so tolerate a server address
  // that already ends in "/api" instead of calling "/api/api/...".
  .replace(/\/api$/i, "");

const TOKEN_KEY = "nestara.accessToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

/** Server codes the UI has a translated message for; anything else maps to NOT_FOUND-free generic handling. */
const KNOWN_CODES: ApiErrorCode[] = [
  "INVALID_DATES",
  "UNAVAILABLE",
  "TOO_MANY_GUESTS",
  "PAYMENT_DECLINED",
  "CARD_INVALID",
  "NOT_FOUND",
  "NOT_CANCELLABLE",
];

/** Server codes that mean the same thing as one of the UI codes. */
const CODE_ALIASES: Record<string, ApiErrorCode> = {
  DATES_IN_PAST: "INVALID_DATES",
  MIN_NIGHTS_NOT_MET: "INVALID_DATES",
  VALIDATION_FAILED: "INVALID_DATES",
  BOOKING_NOT_PENDING: "NOT_CANCELLABLE",
  CONFLICT: "UNAVAILABLE",
  OWN_PROPERTY_BOOKING: "UNAVAILABLE",
  ROUTE_NOT_FOUND: "NOT_FOUND",
};

function toApiError(status: number, body: unknown): ApiError {
  const error = (body as { error?: { code?: string; message?: string; details?: Record<string, unknown> } })?.error;
  const raw = error?.code ?? "";
  const code: ApiErrorCode =
    (KNOWN_CODES as string[]).includes(raw)
      ? (raw as ApiErrorCode)
      : (CODE_ALIASES[raw] ?? (status === 404 ? "NOT_FOUND" : "UNAVAILABLE"));

  return new ApiError(code, error?.message ?? `Request failed (${status}).`, {
    ...(error?.details ?? {}),
    serverCode: raw || undefined,
    status,
  });
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
};

/** Page information the list endpoints return next to the rows. */
export type ListMeta = { total: number; limit: number; offset: number; hasMore: boolean };

/** Performs the call and returns the whole `{ data, meta }` envelope. */
export async function requestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: ListMeta }> {
  const url = new URL(`${API_BASE_URL}/api${path}`, API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "https://api.roomeasy.fr"));
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const token = getAccessToken();
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      credentials: "include",
    });
  } catch {
    throw new ApiError("UNAVAILABLE", "The server could not be reached. Check your connection and try again.");
  }

  // Any change sent to the server can affect which stays are listed.
  if ((options.method ?? "GET") !== "GET" && response.ok) clearSearchCache();

  if (response.status === 204) return { data: undefined as T };

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    // An expired or revoked token would otherwise keep failing every call in
    // the background: drop it so the app shows the signed-out state instead.
    if (response.status === 401 && token && !path.startsWith("/accounts/login") && !path.startsWith("/accounts/signup")) {
      setAccessToken(null);
    }
    throw toApiError(response.status, payload);
  }

  return payload as { data: T; meta?: ListMeta };
}

/** Performs the call and unwraps the `{ data }` envelope the API always returns. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await requestWithMeta<T>(path, options)).data;
}
