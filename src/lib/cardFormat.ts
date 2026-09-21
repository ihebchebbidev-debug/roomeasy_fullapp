/** Presentation helpers for card inputs and dates. Pure, UI-only. */

export type CardBrand = "visa" | "mastercard" | "amex" | "card";

export function detectBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "card";
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  if (detectBrand(digits) === "amex") {
    return digits.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_m, a, b, c) =>
      [a, b, c].filter(Boolean).join(" "),
    );
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCvc(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function brandLabel(brand: CardBrand): string {
  return brand === "amex" ? "Amex" : brand === "card" ? "Card" : brand[0]!.toUpperCase() + brand.slice(1);
}

/** Localised long date, e.g. "Mon, 12 May 2026". */
export function longDate(iso: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function shortDate(iso: string, locale: string): string {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}
