import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Compares Stripe payout, booking and refund records an admin supplies and
 * lists reconciliation discrepancies plus the payouts they affect. All checks
 * run in code — no AI. Only admins with finance access may run it: the
 * caller's token is checked against the RoomEasy API before any comparison.
 */

const MAX_RECORDS_CHARS = 200_000;
const MAX_ROWS = 5_000;
const CENT_TOLERANCE = 1; // amounts differ by more than 1 minor unit => mismatch

const inputSchema = z.object({
  token: z.string().min(10).max(4000),
  payouts: z.string().max(MAX_RECORDS_CHARS),
  bookings: z.string().max(MAX_RECORDS_CHARS),
  refunds: z.string().max(MAX_RECORDS_CHARS),
  locale: z.string().trim().max(5).default("en"),
});

export type Discrepancy = {
  severity: "high" | "medium" | "low";
  kind: string;
  payoutId: string;
  bookingReference: string;
  expected: string;
  actual: string;
  explanation: string;
};
export type AffectedPayout = { payoutId: string; host: string; impact: string; explanation: string };
export type ReconciliationReport = {
  summary: string;
  discrepancies: Discrepancy[];
  affectedPayouts: AffectedPayout[];
};
export type ReconciliationResult =
  | { ok: true; report: ReconciliationReport }
  | { ok: false; error: "forbidden" | "empty" | "unreadable" };

/* ---------- parsing ---------- */

type Row = Record<string, string>;

/** Accepts JSON (array of objects, or {data|rows|items: [...]}) and CSV/TSV with a header row. */
function parseRows(raw: string): Row[] {
  const text = raw.trim();
  if (!text) return [];
  if (text.startsWith("[") || text.startsWith("{")) {
    const parsed = JSON.parse(text) as unknown;
    const arr = Array.isArray(parsed)
      ? parsed
      : ((parsed as { data?: unknown; rows?: unknown; items?: unknown }).data ??
        (parsed as { rows?: unknown }).rows ??
        (parsed as { items?: unknown }).items);
    if (!Array.isArray(arr)) throw new Error("json_not_array");
    return arr.slice(0, MAX_ROWS).map((r) => {
      const out: Row = {};
      for (const [k, v] of Object.entries((r ?? {}) as Record<string, unknown>)) {
        out[k.toLowerCase()] = v == null ? "" : String(v);
      }
      return out;
    });
  }
  const first = text.slice(0, text.indexOf("\n") + 1 || undefined);
  const delim = (first.match(/\t/g)?.length ?? 0) > 0 ? "\t" : (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const lines = splitCsvLines(text);
  const headers = splitCsvRow(lines[0] ?? "", delim).map((h) => h.toLowerCase().trim());
  const rows: Row[] = [];
  for (const line of lines.slice(1, MAX_ROWS + 1)) {
    const cells = splitCsvRow(line, delim);
    const row: Row = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    if (Object.values(row).some((v) => v)) rows.push(row);
  }
  return rows;
}

function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (c === '"') {
      if (inQ && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if ((c === "\n" || c === "\r") && !inQ) {
      if (cur.trim()) lines.push(cur);
      cur = "";
    } else cur += c;
  }
  if (cur.trim()) lines.push(cur);
  return lines;
}

function splitCsvRow(line: string, delim: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === delim && !inQ) {
      cells.push(cur);
      cur = "";
    } else cur += c;
  }
  cells.push(cur);
  return cells;
}

/* ---------- field mapping ---------- */

function pick(row: Row, ...names: string[]): string {
  for (const n of names) {
    for (const [k, v] of Object.entries(row)) {
      if (v && (k === n || k.replace(/[\s_\-.]+/g, "_") === n || k.includes(n))) return v;
    }
  }
  return "";
}

/** Parses "1 234,56", "1,234.56", "1234.56" into major units. */
function parseAmount(v: string): number | null {
  const t = v.replace(/[^\d,.\-]/g, "");
  if (!t) return null;
  const norm =
    t.includes(",") && t.includes(".")
      ? t.lastIndexOf(",") > t.lastIndexOf(".")
        ? t.replace(/\./g, "").replace(",", ".")
        : t.replace(/,/g, "")
      : t.includes(",")
        ? t.replace(",", ".")
        : t;
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

function toMinor(amount: number, _raw: string): number {
  // Amounts are major currency units (as in Stripe dashboard exports); convert to minor units.
  return Math.round(amount * 100);
}

type Booking = { ref: string; totalMinor: number; commissionMinor: number | null; currency: string; status: string; paidToHost: boolean };
type Payout = { id: string; host: string; amountMinor: number; currency: string; refs: string[]; status: string };
type Refund = { ref: string; bookingRef: string; amountMinor: number; currency: string; status: string };

export function mapBookings(rows: Row[]): Booking[] {
  return rows
    .map((r) => {
      const ref = pick(r, "booking_reference", "booking_ref", "reference", "booking_id", "booking", "reservation");
      const totalRaw = pick(r, "total", "amount", "gross", "price", "guest_total");
      const total = totalRaw ? parseAmount(totalRaw) : null;
      if (!ref || total == null) return null;
      const commRaw = pick(r, "commission", "service_fee", "platform_fee", "fee");
      const comm = commRaw ? parseAmount(commRaw) : null;
      const status = pick(r, "status", "state").toLowerCase();
      const dest = pick(r, "paid_to_host", "destination_charge", "split_to_host", "charge_type").toLowerCase();
      return {
        ref,
        totalMinor: toMinor(total, totalRaw),
        commissionMinor: comm == null ? null : toMinor(comm, commRaw),
        currency: pick(r, "currency", "cur").toUpperCase() || "EUR",
        status,
        paidToHost: /^(true|1|yes|destination)/.test(dest),
      };
    })
    .filter((b): b is Booking => b != null);
}

export function mapPayouts(rows: Row[]): Payout[] {
  return rows
    .map((r) => {
      const id = pick(r, "payout_id", "payout", "transfer_id", "id");
      const amountRaw = pick(r, "amount", "total", "payout_amount", "value");
      const amount = amountRaw ? parseAmount(amountRaw) : null;
      if (!id || amount == null) return null;
      const refsRaw = pick(r, "bookings", "booking_references", "references", "booking_refs", "booking_reference");
      return {
        id,
        host: pick(r, "host", "host_name", "host_id", "account", "destination"),
        amountMinor: toMinor(amount, amountRaw),
        currency: pick(r, "currency", "cur").toUpperCase() || "EUR",
        refs: refsRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean),
        status: pick(r, "status", "state").toLowerCase(),
      };
    })
    .filter((p): p is Payout => p != null);
}

export function mapRefunds(rows: Row[]): Refund[] {
  return rows
    .map((r) => {
      const bookingRef = pick(r, "booking_reference", "booking_ref", "reference", "booking_id", "booking");
      const amountRaw = pick(r, "amount", "refund_amount", "total");
      const amount = amountRaw ? parseAmount(amountRaw) : null;
      if (!amountRaw || amount == null) return null;
      return {
        ref: pick(r, "refund_id", "refund", "id"),
        bookingRef,
        amountMinor: toMinor(amount, amountRaw),
        currency: pick(r, "currency", "cur").toUpperCase() || "EUR",
        status: pick(r, "status", "state").toLowerCase(),
      };
    })
    .filter((r): r is Refund => r != null);
}

/* ---------- checks ---------- */

const DONE = ["completed", "complete", "confirmed", "paid", "checked_out", "finished"];
const DEAD = ["cancelled", "canceled", "refunded", "void", "failed", "expired"];

function isDone(s: string) {
  return !s || DONE.some((d) => s.includes(d));
}
function isDead(s: string) {
  return DEAD.some((d) => s.includes(d));
}

const CURRENCY_LOCALE: Record<string, string> = { fr: "fr-FR", es: "es-ES", de: "de-DE", pt: "pt-PT" };

function fmt(minor: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[locale.slice(0, 2)] ?? "en-GB", {
      style: "currency",
      currency: currency || "EUR",
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency || "EUR"}`;
  }
}

export function computeReport(bookings: Booking[], payouts: Payout[], refunds: Refund[], locale: string): ReconciliationReport {
  const discrepancies: Discrepancy[] = [];
  const impacts = new Map<string, { host: string; net: number; notes: string[] }>();
  const money = (n: number, c: string) => fmt(n, c, locale);

  const touch = (p: Payout | undefined, id: string, host: string, net: number, note: string) => {
    const key = p?.id ?? id;
    const e = impacts.get(key) ?? { host: p?.host ?? host, net: 0, notes: [] };
    e.net += net;
    e.notes.push(note);
    impacts.set(key, e);
  };

  const paidOutRefs = new Map<string, Payout[]>();
  for (const p of payouts) {
    for (const ref of p.refs.length ? p.refs : bookings.map((b) => b.ref)) {
      // per-booking checks only use explicit refs below
      void ref;
    }
    for (const ref of p.refs) {
      const list = paidOutRefs.get(ref) ?? [];
      list.push(p);
      paidOutRefs.set(ref, list);
    }
  }

  // Duplicate payouts for the same booking.
  for (const [ref, ps] of paidOutRefs) {
    if (ps.length > 1) {
      for (const p of ps.slice(1)) {
        discrepancies.push({
          severity: "high",
          kind: "duplicate_payout",
          payoutId: p.id,
          bookingReference: ref,
          expected: money(0, p.currency),
          actual: money(p.amountMinor, p.currency),
          explanation: `Booking ${ref} appears in ${ps.length} payouts; ${p.id} pays it again.`,
        });
        touch(p, p.id, p.host, -p.amountMinor, `duplicate payout for booking ${ref}`);
      }
    }
  }

  const currencyMismatch = (b: Booking, p: Payout | undefined) => {
    if (p && b.currency && p.currency && b.currency !== p.currency) {
      discrepancies.push({
        severity: "medium",
        kind: "currency_mismatch",
        payoutId: p.id,
        bookingReference: b.ref,
        expected: b.currency,
        actual: p.currency,
        explanation: `Booking ${b.ref} is in ${b.currency} but payout ${p.id} is in ${p.currency}.`,
      });
      touch(p, p.id, p.host, 0, `currency ${p.currency} differs from booking currency ${b.currency}`);
    }
  };

  for (const b of bookings) {
    if (b.paidToHost) {
      // Destination charge: must not appear in any payout.
      for (const p of paidOutRefs.get(b.ref) ?? []) {
        discrepancies.push({
          severity: "high",
          kind: "payout_for_destination_charge",
          payoutId: p.id,
          bookingReference: b.ref,
          expected: money(0, b.currency),
          actual: money(p.amountMinor, p.currency),
          explanation: `Booking ${b.ref} was already paid directly to the host at checkout, so payout ${p.id} pays it twice.`,
        });
        touch(p, p.id, p.host, -p.amountMinor, `booking ${b.ref} already paid to host at checkout`);
      }
      continue;
    }
    const ps = paidOutRefs.get(b.ref) ?? [];
    const p = ps[0];
    if (isDead(b.status)) {
      for (const x of ps) {
        discrepancies.push({
          severity: "high",
          kind: "payout_for_cancelled_booking",
          payoutId: x.id,
          bookingReference: b.ref,
          expected: money(0, b.currency),
          actual: money(x.amountMinor, x.currency),
          explanation: `Booking ${b.ref} is ${b.status} but payout ${x.id} still pays the host.`,
        });
        touch(x, x.id, x.host, -x.amountMinor, `payout for a ${b.status} booking`);
      }
      continue;
    }
    if (!isDone(b.status)) continue;
    if (ps.length === 0) {
      const expected = b.commissionMinor != null ? b.totalMinor - b.commissionMinor : b.totalMinor;
      discrepancies.push({
        severity: "high",
        kind: "missing_payout",
        payoutId: "",
        bookingReference: b.ref,
        expected: money(expected, b.currency),
        actual: money(0, b.currency),
        explanation: `Completed booking ${b.ref} has no payout. The host is owed ${money(expected, b.currency)}${b.commissionMinor == null ? " (no commission column supplied, so commission could not be deducted)" : ""}.`,
      });
      touch(undefined, `(missing) ${b.ref}`, "", expected, `no payout for completed booking ${b.ref}`);
      continue;
    }
    currencyMismatch(b, p);
    if (b.commissionMinor != null && ps.length === 1) {
      // Refunds reduce the expected payout by the host's share of each refund.
      const refundShare = refunds
        .filter((r) => r.bookingRef === b.ref && !(r.status && /failed|cancel/.test(r.status)))
        .reduce((sum, r) => sum + Math.round((r.amountMinor * (b.totalMinor - b.commissionMinor!)) / b.totalMinor), 0);
      const expected = b.totalMinor - b.commissionMinor - refundShare;
      if (Math.abs(p!.amountMinor - expected) > CENT_TOLERANCE) {
        discrepancies.push({
          severity: "high",
          kind: "amount_mismatch",
          payoutId: p!.id,
          bookingReference: b.ref,
          expected: money(expected, b.currency),
          actual: money(p!.amountMinor, p!.currency),
          explanation: `Booking ${b.ref} totals ${money(b.totalMinor, b.currency)} minus ${money(b.commissionMinor, b.currency)} commission = ${money(expected, b.currency)}, but payout ${p!.id} is ${money(p!.amountMinor, p!.currency)}.`,
        });
        touch(p, p!.id, p!.host, p!.amountMinor - expected, `payout differs from booking total minus commission`);
      }
    }
  }

  // Refunds must reduce the payout.
  for (const r of refunds) {
    if (r.status && /failed|cancel/.test(r.status)) continue;
    const b = bookings.find((x) => x.ref === r.bookingRef);
    if (!b) {
      discrepancies.push({
        severity: "medium",
        kind: "unknown_reference",
        payoutId: "",
        bookingReference: r.bookingRef || r.ref,
        expected: "a booking in the booking records",
        actual: "no matching booking",
        explanation: `Refund ${r.ref || r.bookingRef} of ${money(r.amountMinor, r.currency)} has no matching booking in the records supplied.`,
      });
      continue;
    }
    const p = (paidOutRefs.get(r.bookingRef) ?? [])[0];
    if (p && b.commissionMinor != null) {
      const hostShareRefund = Math.round((r.amountMinor * (b.totalMinor - b.commissionMinor)) / b.totalMinor);
      const expected = b.totalMinor - b.commissionMinor - hostShareRefund;
      if (!isDead(b.status) && Math.abs(p.amountMinor - expected) > CENT_TOLERANCE && Math.abs(p.amountMinor - (b.totalMinor - b.commissionMinor)) <= CENT_TOLERANCE) {
        discrepancies.push({
          severity: "high",
          kind: "refund_not_reflected",
          payoutId: p.id,
          bookingReference: r.bookingRef,
          expected: money(expected, b.currency),
          actual: money(p.amountMinor, p.currency),
          explanation: `Booking ${r.bookingRef} was refunded ${money(r.amountMinor, r.currency)} but payout ${p.id} still pays the full host share.`,
        });
        touch(p, p.id, p.host, expected - p.amountMinor, `refund of ${money(r.amountMinor, r.currency)} not deducted`);
      }
    }
  }

  // Payouts referencing unknown bookings.
  for (const p of payouts) {
    for (const ref of p.refs) {
      if (!bookings.some((b) => b.ref === ref)) {
        discrepancies.push({
          severity: "medium",
          kind: "unknown_reference",
          payoutId: p.id,
          bookingReference: ref,
          expected: "a booking in the booking records",
          actual: "no matching booking",
          explanation: `Payout ${p.id} references booking ${ref}, which is not in the booking records supplied.`,
        });
        touch(p, p.id, p.host, 0, `references unknown booking ${ref}`);
      }
    }
  }

  const affectedPayouts: AffectedPayout[] = [...impacts.entries()].map(([payoutId, e]) => ({
    payoutId,
    host: e.host,
    impact:
      e.net === 0
        ? "see discrepancies"
        : e.net > 0
          ? `underpaid ${money(e.net, payouts.find((p) => p.id === payoutId)?.currency ?? "EUR")}`
          : `overpaid ${money(-e.net, payouts.find((p) => p.id === payoutId)?.currency ?? "EUR")}`,
    explanation: e.notes.join("; "),
  }));

  const high = discrepancies.filter((d) => d.severity === "high").length;
  const summary =
    discrepancies.length === 0
      ? `Checked ${bookings.length} bookings, ${payouts.length} payouts and ${refunds.length} refunds: everything reconciles.`
      : `Checked ${bookings.length} bookings, ${payouts.length} payouts and ${refunds.length} refunds: found ${discrepancies.length} discrepanc${discrepancies.length === 1 ? "y" : "ies"} (${high} high severity) affecting ${affectedPayouts.length} payout${affectedPayouts.length === 1 ? "" : "s"}.`;

  return { summary, discrepancies: discrepancies.slice(0, 200), affectedPayouts: affectedPayouts.slice(0, 200) };
}

/* ---------- auth + entry ---------- */

const API_BASE = "https://api.roomeasy.fr";

async function callerHasFinanceAccess(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { data?: { capabilities?: string[] } };
    const caps = body.data?.capabilities ?? [];
    return caps.includes("finance.read") || caps.includes("finance.manage");
  } catch {
    return false;
  }
}

export const reconcilePayouts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<ReconciliationResult> => {
    if (!(await callerHasFinanceAccess(data.token))) return { ok: false, error: "forbidden" };
    if (!data.payouts.trim() || (!data.bookings.trim() && !data.refunds.trim())) {
      return { ok: false, error: "empty" };
    }
    try {
      const report = computeReport(
        mapBookings(parseRows(data.bookings)),
        mapPayouts(parseRows(data.payouts)),
        mapRefunds(parseRows(data.refunds)),
        data.locale,
      );
      return { ok: true, report };
    } catch {
      return { ok: false, error: "unreadable" };
    }
  });
