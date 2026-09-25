import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useLanguage } from "./LanguageProvider";

export type CurrencyCode = "EUR" | "USD" | "GBP" | "CHF" | "BRL";

/**
 * Display currencies. No rate is stored here on purpose: every conversion uses
 * a live rate from `/api/public/exchange-rates`, so prices can never be shown
 * through an out-of-date constant.
 */
export const currencies: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real" },
];

const STORAGE_KEY = "nestara.currency";
const RATES_STORAGE_KEY = "nestara.currency-rates";
/** Rates move through the day, so a cached set is only trusted for an hour. */
const RATE_CACHE_MS = 60 * 60 * 1000;

type RateCache = { savedAt: number; rates: Partial<Record<CurrencyCode, number>> };

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  /**
   * Formats an amount into the guest's chosen currency. The amount is in EUR
   * unless `from` names the listing's own currency.
   */
  format: (amount: number, options?: { decimals?: boolean; from?: string | undefined }) => string;
  /**
   * Formats an amount the guest was actually charged. Charges settle in EUR,
   * so this never re-converts through a cached rate — the receipt always shows
   * the exact figure that left the card.
   */
  formatCharged: (amount: number, currency?: string) => string;
  /** Converts between two supported currencies with today's rates (null if a rate is missing). */
  convert: (amount: number, from: string, to: string) => number | null;
  convertFromUsd: (amountUsd: number) => number;
  convertToUsd: (amount: number) => number;
  ratesUpdatedAt: number | null;
  /** False while no live rate is known for the chosen currency (prices stay in USD). */
  ratesLive: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function isCurrency(value: string | null): value is CurrencyCode {
  return !!value && currencies.some((c) => c.code === value);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  // Only EUR is known until the live rates arrive.
  const [rates, setRates] = useState<Partial<Record<CurrencyCode, number>>>({ EUR: 1 });
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isCurrency(stored)) setCurrencyState(stored);

    let cache: RateCache | null = null;
    try {
      const raw = window.localStorage.getItem(RATES_STORAGE_KEY);
      cache = raw ? JSON.parse(raw) as RateCache : null;
      if (cache?.rates) {
        setRates((current) => ({ ...current, ...cache?.rates, EUR: 1 }));
        setRatesUpdatedAt(cache.savedAt);
      }
    } catch {
      cache = null;
    }

    if (cache && Date.now() - cache.savedAt < RATE_CACHE_MS) return;
    const controller = new AbortController();
    fetch("/api/public/exchange-rates", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Currency rates unavailable");
        return response.json() as Promise<{ rates?: Partial<Record<CurrencyCode, number>>; live?: boolean }>;
      })
      .then((payload) => {
        if (!payload.rates || payload.live === false) return;
        const next = { ...payload.rates, EUR: 1 } as Partial<Record<CurrencyCode, number>>;
        const savedAt = Date.now();
        setRates(next);
        setRatesUpdatedAt(savedAt);
        window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({ savedAt, rates: next } satisfies RateCache));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const convert = useCallback(
    (amount: number, from: string, to: string) => {
      if (from === to) return amount;
      const fromRate = rates[from as CurrencyCode];
      const toRate = rates[to as CurrencyCode];
      if (!fromRate || !toRate) return null;
      return (amount / fromRate) * toRate;
    },
    [rates],
  );

  const format = useCallback(
    (amount: number, options?: { decimals?: boolean; from?: string | undefined }) => {
      const source = options?.from || "EUR";
      // Without a live rate the amount stays in its own currency rather than
      // being converted at a guessed rate and labelled with the wrong code.
      const converted = convert(amount, source, currency);
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: converted === null ? source : currency,
        maximumFractionDigits: options?.decimals ? 2 : 0,
        minimumFractionDigits: options?.decimals ? 2 : 0,
      }).format(converted ?? amount);
    },
    [convert, currency, locale],
  );

  const formatCharged = useCallback(
    (amount: number, chargeCurrency = "EUR") =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: chargeCurrency.trim() || "EUR",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }).format(amount),
    [locale],
  );

  const convertFromUsd = useCallback((amountUsd: number) => amountUsd * (rates[currency] ?? 1), [currency, rates]);
  const convertToUsd = useCallback((amount: number) => amount / (rates[currency] ?? 1), [currency, rates]);
  const ratesLive = currency === "EUR" || rates[currency] !== undefined;

  const value = useMemo(() => ({ currency, setCurrency, format, formatCharged, convert, convertFromUsd, convertToUsd, ratesUpdatedAt, ratesLive }), [currency, setCurrency, format, formatCharged, convert, convertFromUsd, convertToUsd, ratesUpdatedAt, ratesLive]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside a CurrencyProvider");
  return ctx;
}
