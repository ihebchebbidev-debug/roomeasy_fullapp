import { getPlatform } from "@/hooks/usePlatform";
import {
  type CalendarMap,
  type HostListing,
  type RateRules,
} from "@/data/platform";

export type { CalendarMap, NightState } from "@/data/platform";

export type Discount = { id: "longStay" | "mobile" | "lastMinute"; percent: number; amount: number };

export type Quote = {
  nights: number;
  baseSubtotal: number;
  discounts: Discount[];
  subtotal: number;
  perNight: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
};

export function toISODate(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  const copy = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
}

/** Nights covered by a stay: check-in included, check-out excluded. */
export function stayNights(from?: string | Date | undefined, to?: string | Date | undefined): string[] {
  if (!from || !to) return [];
  const start = new Date(toISODate(from));
  const end = new Date(toISODate(to));
  const out: string[] = [];
  for (let d = start; d < end; d = new Date(d.getTime() + 86400000)) out.push(toISODate(d));
  return out;
}

export function nightState(calendar: CalendarMap, propertyId: string, date: string) {
  return calendar[propertyId]?.[date] ?? {};
}

export function isNightBlocked(calendar: CalendarMap, propertyId: string, date: string): boolean {
  return nightState(calendar, propertyId, date).blocked === true;
}

export function blockedNightsIn(
  calendar: CalendarMap,
  propertyId: string,
  from?: string | Date | undefined,
  to?: string | Date | undefined,
): string[] {
  return stayNights(from, to).filter((date) => isNightBlocked(calendar, propertyId, date));
}

function round(value: number) {
  return Math.round(value);
}

export function quoteStay(options: {
  basePrice: number;
  /** Charged once per stay, exactly like the server quote. */
  cleaningFee?: number;
  nights: number;
  from?: string | Date | undefined;
  to?: string | Date | undefined;
  propertyId: string;
  calendar?: CalendarMap;
  listing?: HostListing | undefined;
  rateRules?: RateRules;
  feeRates?: { serviceFeeRate: number; taxRate: number };
  isMobile?: boolean;
}): Quote {
  const { basePrice, propertyId, calendar = {}, listing, rateRules, isMobile } = options;
  const dates = stayNights(options.from, options.to);
  const nights = dates.length || Math.max(0, options.nights);

  const baseSubtotal = dates.length
    ? dates.reduce((sum, date) => sum + (nightState(calendar, propertyId, date).price ?? basePrice), 0)
    : nights * basePrice;

  const discounts: Discount[] = [];
  const longStay = listing?.longStay;
  if (longStay?.enabled && nights >= longStay.threshold && longStay.discount > 0) {
    discounts.push({ id: "longStay", percent: longStay.discount, amount: round((baseSubtotal * longStay.discount) / 100) });
  }
  const mobile = listing?.mobile;
  if (isMobile && mobile?.enabled && mobile.discount > 0) {
    discounts.push({ id: "mobile", percent: mobile.discount, amount: round((baseSubtotal * mobile.discount) / 100) });
  }
  if (rateRules?.lastMinute && options.from) {
    const days = (new Date(toISODate(options.from)).getTime() - new Date(toISODate(new Date())).getTime()) / 86400000;
    if (days >= 0 && days <= 7) {
      discounts.push({ id: "lastMinute", percent: rateRules.lastMinute, amount: round((baseSubtotal * rateRules.lastMinute) / 100) });
    }
  }

  const subtotal = Math.max(0, baseSubtotal - discounts.reduce((sum, d) => sum + d.amount, 0));
  const cleaningFee = round(Math.max(0, options.cleaningFee ?? 0));
  // Fee rates are service settings; the server recomputes the same quote when
  // the stay is booked, so there is nothing hard-coded to drift from.
  const fees = options.feeRates ?? getPlatform().feeRates;
  const serviceFee = round(subtotal * fees.serviceFeeRate);
  const taxes = round(subtotal * fees.taxRate);

  return {
    nights,
    baseSubtotal,
    discounts,
    subtotal,
    perNight: nights ? round(subtotal / nights) : basePrice,
    cleaningFee,
    serviceFee,
    taxes,
    total: subtotal + cleaningFee + serviceFee + taxes,
  };
}
