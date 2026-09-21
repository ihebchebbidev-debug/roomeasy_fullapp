import { createFileRoute } from "@tanstack/react-router";

const QUOTES = ["USD", "GBP", "CHF", "BRL"] as const;
const PROVIDER_URL = `https://api.frankfurter.app/latest?from=EUR&to=${QUOTES.join(",")}`;
const PROVIDER_TIMEOUT_MS = 5000;

type RatesResponse = {
  base: "EUR";
  /** Live rates only. Missing quotes mean the provider had nothing for them. */
  rates: Record<string, number>;
  /** Provider date for the quotes, when known. */
  date?: string;
  /** False when no live rate could be obtained; the app then stays in EUR. */
  live: boolean;
};

/**
 * Live EUR exchange rates. There is deliberately no hardcoded rate table here:
 * an out-of-date constant would show guests a wrong price, so when the provider
 * cannot be reached we report `live: false` and only USD, and the app keeps
 * displaying EUR instead of inventing a conversion.
 */
export const Route = createFileRoute("/api/public/exchange-rates")({
  server: {
    handlers: {
      GET: async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
        try {
          const response = await fetch(PROVIDER_URL, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Exchange-rate provider unavailable");
          const payload = (await response.json()) as { date?: string; rates?: Record<string, number> };
          const live: Record<string, number> = { EUR: 1 };
          for (const quote of QUOTES) {
            const rate = payload.rates?.[quote];
            if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) live[quote] = rate;
          }
          if (Object.keys(live).length === 1) throw new Error("Exchange-rate provider returned no quotes");
          const body: RatesResponse = { base: "EUR", rates: live, live: true, ...(payload.date ? { date: payload.date } : {}) };
          return Response.json(body, {
            // Rates move through the day; an hour keeps prices honest without
            // hammering the provider on every visit.
            headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" },
          });
        } catch {
          const body: RatesResponse = { base: "EUR", rates: { EUR: 1 }, live: false };
          return Response.json(body, { status: 503, headers: { "Cache-Control": "no-store" } });
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
