/**
 * Card payments and host payouts (Stripe).
 *
 * `config()` is the switch the checkout uses: while the account keys are empty
 * it answers `enabled: false` and the built-in demo card flow stays in place.
 * As soon as the keys are filled in, the same screen can collect a real card
 * with the returned publishable key and client secret.
 */
import { request } from "@/api/http/client";

export type PaymentsConfigDto = {
  enabled: boolean;
  mode: "live" | "test" | null;
  publishableKey: string | null;
  currency: string;
  commissionSplit: boolean;
};

export type PaymentIntentDto = {
  clientSecret: string | null;
  intentId: string;
  amount: number;
  currency: string;
  commissionUsd: number;
  splitToHost: boolean;
};

export type ConnectStatusDto = {
  enabled: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: string[];
};

export const paymentsApi = {
  config: () => request<PaymentsConfigDto>("/payments/config"),

  createIntent: (bookingReference: string) =>
    request<PaymentIntentDto>("/payments/intents", { method: "POST", body: { bookingReference } }),

  connectStatus: () => request<ConnectStatusDto>("/payments/connect/status"),

  /** Hosted Stripe onboarding: open the returned url in the same tab. */
  onboardingLink: (country?: string) =>
    request<{ url: string; accountId: string; expiresAt: string }>("/payments/connect/onboarding-link", {
      method: "POST",
      ...(country ? { body: { country } } : {}),
    }),

  dashboardLink: () => request<{ url: string }>("/payments/connect/dashboard-link", { method: "POST" }),
};
