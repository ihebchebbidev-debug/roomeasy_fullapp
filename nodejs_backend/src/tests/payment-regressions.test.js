import { beforeEach, describe, expect, mock, test } from "bun:test";

// No configuration, database, or network clients are loaded by this suite.
const at = (path) => new URL(`../${path}`, import.meta.url).pathname;
let enabled = true;
let payment;
let charge;
let intent;
let readError;
let refundCalls;
let transferCalls;
const stripe = {
  paymentIntents: {
    retrieve: async () => intent,
    cancel: async () => ({}),
    capture: async () => ({}),
  },
  charges: { retrieve: async () => { if (readError) throw readError; return charge; } },
  refunds: { create: async (...args) => { refundCalls.push(args); return { id: "re_test" }; } },
  transfers: { create: async (...args) => { transferCalls.push(args); return { id: "tr_test" }; } },
};
mock.module(at("config/env.ts"), () => ({ env: { PAYMENT_CURRENCY: "EUR" } }));
mock.module(at("core/logger.ts"), () => ({ log: () => ({ info() {}, warn() {}, error() {} }) }));
mock.module(at("core/errors.ts"), () => ({ apiError: (code, details) => Object.assign(new Error(details?.message ?? code), { code }) }));
mock.module(at("modules/payments/stripe.client.ts"), () => ({
  stripeEnabled: () => enabled,
  requireStripe: () => stripe,
  toMinorUnits: (value) => Math.round(value * 100),
}));
mock.module(at("modules/payments/payments.repository.ts"), () => ({
  stripePaymentForBooking: async () => payment,
  hostStripeAccount: async () => ({ accountId: "acct_test", payoutsEnabled: true }),
}));
const { refundThroughStripe } = await import("../modules/payments/refunds.ts");
const { transferPayoutToHost } = await import("../modules/payments/payouts.ts");

beforeEach(() => {
  enabled = true;
  payment = { intentId: null, chargeId: "ch_test", amountUsd: 200, status: "paid" };
  charge = { amount: 20000, amount_captured: 20000, amount_refunded: 0, transfer_data: { destination: "acct_test" } };
  intent = { id: "pi_test", status: "succeeded", latest_charge: "ch_test", transfer_data: { destination: "acct_test" } };
  readError = null;
  refundCalls = [];
  transferCalls = [];
});

describe("actual Stripe refund and payout functions (isolated)", () => {
  test("charge-only destination refund reverses the host share and application fee", async () => {
    await refundThroughStripe("BK1", 50);
    expect(refundCalls[0]?.[0]).toMatchObject({ charge: "ch_test", amount: 5000, reverse_transfer: true, refund_application_fee: true });
  });

  test("charge-only platform refund never requests a destination reversal", async () => {
    charge.transfer_data = null;
    await refundThroughStripe("BK2", 50);
    expect(refundCalls[0]?.[0].reverse_transfer).toBeUndefined();
    expect(refundCalls[0]?.[0].refund_application_fee).toBeUndefined();
  });

  test("refund stops if Stripe cannot establish the captured balance", async () => {
    readError = new Error("Stripe unavailable");
    await expect(refundThroughStripe("BK3", 200)).rejects.toThrow("Stripe unavailable");
    expect(refundCalls).toHaveLength(0);
  });

  test("refund is capped at the 150 EUR still captured after a 50 EUR refund", async () => {
    charge.amount_refunded = 5000;
    await refundThroughStripe("BK4", 200);
    expect(refundCalls[0]?.[0].amount).toBe(15000);
  });

  test("a fully refunded charge sends no further refund", async () => {
    charge.amount_refunded = 20000;
    await refundThroughStripe("BK5", 200);
    expect(refundCalls).toHaveLength(0);
  });

  test("an uncaptured charge cannot be treated as refundable captured money", async () => {
    charge.amount_captured = 0;
    await refundThroughStripe("BK_uncaptured", 200);
    expect(refundCalls).toHaveLength(0);
  });

  test("an uncaptured authorization is released without a refund", async () => {
    payment.intentId = "pi_test";
    intent.status = "requires_capture";
    await refundThroughStripe("BK6", 200);
    expect(refundCalls).toHaveLength(0);
  });

  test("disabled Stripe must not return success for a 170 EUR host transfer", async () => {
    enabled = false;
    await expect(transferPayoutToHost({ payoutId: "PO1", hostId: "H1", amountUsd: 170 })).rejects.toMatchObject({ code: "PAYOUT_NOT_READY" });
    expect(transferCalls).toHaveLength(0);
  });

  test("invalid transfer amounts cannot fall through as successful payouts", async () => {
    for (const amountUsd of [0, -1, NaN, Infinity, 0.001]) {
      await expect(transferPayoutToHost({ payoutId: "PO2", hostId: "H1", amountUsd })).rejects.toMatchObject({ code: "PAYOUT_NOT_READY" });
    }
    expect(transferCalls).toHaveLength(0);
  });

  test("a valid transfer sends 17000 cents with a stable payout-specific key", async () => {
    const id = await transferPayoutToHost({ payoutId: "PO3", hostId: "H1", amountUsd: 170, currency: "EUR" });
    expect(id).toBe("tr_test");
    expect(transferCalls[0]).toEqual([
      expect.objectContaining({ amount: 17000, currency: "eur", destination: "acct_test" }),
      { idempotencyKey: "payout_PO3" },
    ]);
  });
});