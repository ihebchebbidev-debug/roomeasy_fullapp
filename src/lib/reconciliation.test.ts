import { describe, expect, test } from "bun:test";

import { computeReport, mapBookings, mapPayouts, mapRefunds } from "./reconciliation.functions";

const bookings = (rows: Record<string, string>[]) => mapBookings(rows);
const payouts = (rows: Record<string, string>[]) => mapPayouts(rows);
const refunds = (rows: Record<string, string>[]) => mapRefunds(rows);

describe("payout reconciliation", () => {
  test("a completed booking paid at total minus commission reconciles cleanly", () => {
    const report = computeReport(
      bookings([{ booking_reference: "BK1", total: "200.00", commission: "30.00", status: "completed", currency: "EUR" }]),
      payouts([{ payout_id: "PO1", amount: "170.00", bookings: "BK1", status: "paid", currency: "EUR" }]),
      refunds([]),
      "en",
    );
    expect(report.discrepancies).toHaveLength(0);
  });

  test("a payout above total minus commission is flagged as an amount mismatch", () => {
    const report = computeReport(
      bookings([{ booking_reference: "BK1", total: "200.00", commission: "30.00", status: "completed", currency: "EUR" }]),
      payouts([{ payout_id: "PO1", amount: "190.00", bookings: "BK1", status: "paid", currency: "EUR" }]),
      refunds([]),
      "en",
    );
    expect(report.discrepancies.some((d) => d.kind === "amount_mismatch" && d.payoutId === "PO1")).toBe(true);
  });

  test("a completed booking with no payout is flagged as missing", () => {
    const report = computeReport(
      bookings([{ booking_reference: "BK2", total: "150.00", commission: "20.00", status: "confirmed", currency: "EUR" }]),
      payouts([]),
      refunds([]),
      "en",
    );
    const d = report.discrepancies.find((x) => x.kind === "missing_payout");
    expect(d?.bookingReference).toBe("BK2");
    expect(report.affectedPayouts.some((p) => p.impact.includes("underpaid"))).toBe(true);
  });

  test("a payout for a cancelled booking is flagged", () => {
    const report = computeReport(
      bookings([{ booking_reference: "BK3", total: "100.00", status: "cancelled", currency: "EUR" }]),
      payouts([{ payout_id: "PO3", amount: "100.00", bookings: "BK3", status: "paid", currency: "EUR" }]),
      refunds([]),
      "en",
    );
    expect(report.discrepancies.some((d) => d.kind === "payout_for_cancelled_booking")).toBe(true);
  });

  test("the same booking paid in two payouts is flagged as duplicate", () => {
    const report = computeReport(
      bookings([{ booking_reference: "BK4", total: "100.00", status: "completed", currency: "EUR" }]),
      payouts([
        { payout_id: "PO4a", amount: "100.00", bookings: "BK4", status: "paid", currency: "EUR" },
        { payout_id: "PO4b", amount: "100.00", bookings: "BK4", status: "paid", currency: "EUR" },
      ]),
      refunds([]),
      "en",
    );
    expect(report.discrepancies.some((d) => d.kind === "duplicate_payout" && d.payoutId === "PO4b")).toBe(true);
  });

  test("a booking already paid to the host at checkout must not appear in a payout", () => {
    const report = computeReport(
      bookings([{ booking_reference: "BK5", total: "100.00", status: "completed", paid_to_host: "true", currency: "EUR" }]),
      payouts([{ payout_id: "PO5", amount: "100.00", bookings: "BK5", status: "paid", currency: "EUR" }]),
      refunds([]),
      "en",
    );
    expect(report.discrepancies.some((d) => d.kind === "payout_for_destination_charge")).toBe(true);
  });

  test("a refunded booking whose payout still pays the full host share is flagged", () => {
    const report = computeReport(
      bookings([{ booking_reference: "BK6", total: "200.00", commission: "30.00", status: "completed", currency: "EUR" }]),
      payouts([{ payout_id: "PO6", amount: "170.00", bookings: "BK6", status: "paid", currency: "EUR" }]),
      refunds([{ refund_id: "RF1", booking_reference: "BK6", amount: "50.00", status: "succeeded", currency: "EUR" }]),
      "en",
    );
    expect(report.discrepancies.some((d) => d.kind === "refund_not_reflected")).toBe(true);
  });

  test("a payout correctly reduced by the host share of a refund reconciles", () => {
    // 200 total, 30 commission => host share 85%; refund 50 => host refund 42.50 => payout 127.50
    const report = computeReport(
      bookings([{ booking_reference: "BK7", total: "200.00", commission: "30.00", status: "completed", currency: "EUR" }]),
      payouts([{ payout_id: "PO7", amount: "127.50", bookings: "BK7", status: "paid", currency: "EUR" }]),
      refunds([{ refund_id: "RF2", booking_reference: "BK7", amount: "50.00", status: "succeeded", currency: "EUR" }]),
      "en",
    );
    expect(report.discrepancies).toHaveLength(0);
  });

  test("european formatted amounts parse correctly", () => {
    const [b] = bookings([{ booking_reference: "BK8", total: "1 234,56", commission: "100,00", status: "completed" }]);
    expect(b?.totalMinor).toBe(123456);
    expect(b?.commissionMinor).toBe(10000);
  });

  test("whole-number amounts are major units (Stripe export style)", () => {
    const [p] = payouts([{ payout_id: "PO9", amount: "46300", bookings: "BK9" }]);
    expect(p?.amountMinor).toBe(4630000);
  });
});
