import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

/** Hosts that must show the coming-soon curtain until the shared password is entered. */
const GATED_HOST_SUFFIXES = ["roomeasy.fr"];

/** Shared coming-soon password, fixed in code so no configuration is needed. */
const SITE_PASSWORD = "roomeasy2026";

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  const password = process.env["SESSION_SECRET"] ?? "roomeasy-development-session-secret-key-0001";
  return {
    password,
    name: "roomeasy-gate",
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function hostIsGated(host: string): boolean {
  const clean = host.toLowerCase().split(":")[0] ?? "";
  return GATED_HOST_SUFFIXES.some((suffix) => clean === suffix || clean.endsWith(`.${suffix}`));
}

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/** Tells the app whether the current visitor must pass the curtain. */
export const getGateState = createServerFn({ method: "GET" }).handler(async () => {
  let host = "";
  try {
    host = getRequestHost() ?? "";
  } catch {
    host = "";
  }

  if (!hostIsGated(host)) return { locked: false as const };

  const session = await useSession<GateSession>(sessionConfig());
  return { locked: session.data.unlocked !== true };
});

/** Checks the shared password and opens the site for this browser. */
export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: String(data?.password ?? "") }))
  .handler(async ({ data }) => {
    if (!data.password || !matches(data.password, SITE_PASSWORD)) {
      return { ok: false as const };
    }

    const session = await useSession<GateSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

/** Closes the site again for this browser. */
export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});
