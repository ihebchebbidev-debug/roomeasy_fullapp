import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Compares Stripe payout, booking and refund records an admin supplies and
 * asks the model to list reconciliation discrepancies and explain which
 * payouts they affect. Only admins with finance access may run it: the
 * caller's token is checked against the RoomEasy API before any model call.
 */

const MAX_RECORDS_CHARS = 200_000;

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
  | { ok: false; error: "forbidden" | "empty" | "credits" | "rate_limited" | "ai_blocked" | "unavailable" | "unreadable"; message?: string | undefined };

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "discrepancies", "affectedPayouts"],
  properties: {
    summary: { type: "string" },
    discrepancies: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "kind", "payoutId", "bookingReference", "expected", "actual", "explanation"],
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low"] },
          kind: { type: "string" },
          payoutId: { type: "string" },
          bookingReference: { type: "string" },
          expected: { type: "string" },
          actual: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
    affectedPayouts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["payoutId", "host", "impact", "explanation"],
        properties: {
          payoutId: { type: "string" },
          host: { type: "string" },
          impact: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;

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

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "unavailable", message: "AI is not configured." };

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          stream: true,
          store: false,
          reasoning: { effort: "medium", summary: "auto" },
          include: ["reasoning.encrypted_content"],
          instructions: buildInstructions(data.locale),
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: [
                    "=== STRIPE PAYOUT RECORDS ===",
                    data.payouts,
                    "=== BOOKING RECORDS ===",
                    data.bookings || "(none supplied)",
                    "=== REFUND RECORDS ===",
                    data.refunds || "(none supplied)",
                  ].join("\n"),
                },
              ],
            },
          ],
          text: { format: { type: "json_schema", name: "reconciliation_report", strict: true, schema: reportSchema } },
        }),
      });
    } catch {
      return { ok: false, error: "unavailable" };
    }

    if (!response.ok || !response.body) {
      const message = await response
        .json()
        .then((b: { error?: { message?: string }; message?: string }) => b?.error?.message ?? b?.message)
        .catch(() => undefined);
      if (response.status === 402) return { ok: false, error: "credits", message };
      if (response.status === 429) return { ok: false, error: "rate_limited", message };
      if (response.status === 403) return { ok: false, error: "ai_blocked", message };
      return { ok: false, error: "unavailable", message };
    }

    const { text, refused } = await readOutput(response.body);
    if (refused) return { ok: false, error: "ai_blocked", message: "The model declined to analyse these records." };
    try {
      const parsed = JSON.parse(text) as ReconciliationReport;
      return {
        ok: true,
        report: {
          summary: String(parsed.summary ?? ""),
          discrepancies: Array.isArray(parsed.discrepancies) ? parsed.discrepancies.slice(0, 200) : [],
          affectedPayouts: Array.isArray(parsed.affectedPayouts) ? parsed.affectedPayouts.slice(0, 200) : [],
        },
      };
    } catch {
      return { ok: false, error: "unreadable" };
    }
  });

function buildInstructions(locale: string) {
  const language = { fr: "French", es: "Spanish", de: "German", pt: "Portuguese" }[locale.slice(0, 2)] ?? "English";
  return [
    "You are a payments reconciliation analyst for RoomEasy, a holiday-rental marketplace using Stripe Connect.",
    "The admin supplies three record sets (CSV or JSON, any column naming): Stripe payouts/transfers to hosts, bookings, and refunds.",
    "Expected rules: a host payout equals the sum of its completed bookings' totals minus the platform commission (service fee), minus any refunded host share.",
    "Bookings paid by destination charge (host already paid at checkout) must NOT appear in a separate payout. A cancelled or fully refunded booking must not be paid out. Each booking is paid out at most once. Currencies must match.",
    "Find every discrepancy: amount mismatches, missing payouts for completed bookings, duplicate payouts, payouts for cancelled/refunded bookings, refunds not reflected in payouts, currency mismatches, unknown references, status inconsistencies.",
    "Only use values present in the records; never invent ids or amounts. Quote amounts with currency. Use an empty string for payoutId or bookingReference when none applies.",
    "affectedPayouts lists each payout touched by at least one discrepancy, with the net impact (e.g. 'overpaid 42.00 EUR') and a plain explanation an admin can act on.",
    "If everything reconciles, return empty arrays and say so in the summary.",
    `Write summary, kind, impact and explanation text in ${language}.`,
  ].join("\n");
}

async function readOutput(body: ReadableStream<Uint8Array>): Promise<{ text: string; refused: boolean }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  let refused = false;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.value) buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = chunk.done ? "" : (lines.pop() ?? "");
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as { type?: string; delta?: string; response?: { output_text?: string } };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") output += event.delta;
        if (event.type === "response.refusal.delta") refused = true;
        if (event.type === "response.completed" && !output && event.response?.output_text) output = event.response.output_text;
      } catch {
        // partial frame
      }
    }
    if (chunk.done) break;
  }
  return { text: output.trim(), refused: refused && !output.trim() };
}
