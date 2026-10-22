import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { getAccessToken, request, requestAll, setAccessToken } from "./client";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
let expiredEvents;
beforeEach(() => {
  const values = new Map();
  expiredEvents = 0;
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
    dispatchEvent: () => { expiredEvents++; },
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

describe("account session and administrator list transport", () => {
  test("a stale unauthorized response cannot sign out a newly signed-in account", async () => {
    let complete;
    globalThis.fetch = () => new Promise((resolve) => { complete = resolve; });
    setAccessToken("old-test-token");
    const pending = request("/accounts/me");
    setAccessToken("new-test-token");
    complete(Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }));
    await expect(pending).rejects.toThrow();
    expect(getAccessToken()).toBe("new-test-token");
    expect(expiredEvents).toBe(0);
  });

  test("an unauthorized response for the current account still clears its session", async () => {
    setAccessToken("current-test-token");
    globalThis.fetch = async () => Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    await expect(request("/accounts/me")).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
    expect(expiredEvents).toBe(1);
  });

  test("administrator list loading respects a smaller service page size", async () => {
    const all = Array.from({ length: 75 }, (_, id) => ({ id }));
    const offsets = [];
    globalThis.fetch = async (url) => {
      const offset = Number(new URL(url).searchParams.get("offset"));
      offsets.push(offset);
      const data = all.slice(offset, offset + 25);
      return Response.json({ data, meta: { total: 75, offset, limit: 25, hasMore: offset + data.length < 75 } });
    };
    const rows = await requestAll("/admin/users");
    expect(rows).toHaveLength(75);
    expect(offsets).toEqual([0, 25, 50]);
  });

  test("administrator list loading never returns more rows than its safety limit", async () => {
    const all = Array.from({ length: 150 }, (_, id) => ({ id }));
    globalThis.fetch = async (url) => {
      const params = new URL(url).searchParams;
      const offset = Number(params.get("offset"));
      const limit = Number(params.get("limit"));
      const data = all.slice(offset, offset + limit);
      return Response.json({ data, meta: { total: 150, offset, limit, hasMore: offset + data.length < 150 } });
    };
    const rows = await requestAll("/admin/users", {}, 100, 125);
    expect(rows).toHaveLength(125);
    expect(rows.at(-1)?.id).toBe(124);
  });

  test("a service that repeats its first page cannot create an endless list", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return Response.json({ data: [{ id: 1 }, { id: 2 }] });
    };
    expect(await requestAll("/admin/users", {}, 2)).toHaveLength(2);
    expect(calls).toBe(2);
  });
});