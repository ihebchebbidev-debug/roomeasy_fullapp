import { stripePaymentForBooking } from "@/modules/payments/payments.repository.js";
import { requireStripe, stripeEnabled, toMinorUnits } from "@/modules/payments/stripe.client.js";

/**
 * Sends money back through Stripe for a booking, when Stripe is configured and
 * a real charge exists. Call this BEFORE writing "refunded" in our own tables
 * so a Stripe failure never leaves the database claiming money moved.
 */
export async function refundThroughStripe(bookingId: string, amountUsd: number): Promise<string | null> {
  if (!stripeEnabled() || amountUsd <= 0) return null;
  const payment = await stripePaymentForBooking(bookingId);
  if (!payment || (!payment.intentId && !payment.chargeId)) return null;

  const stripe = requireStripe();
  // A destination charge already sent the host's share to their Stripe account:
  // pull that share back with the refund instead of the platform paying it all.
  let destinationCharge = false;
  let chargeId = payment.chargeId;

  // Money still only held on the card was never taken: release the hold
  // instead of refunding a charge that does not exist.
  if (payment.intentId) {
    const intent = await stripe.paymentIntents.retrieve(payment.intentId);
    if (
      intent.status === "requires_capture" ||
      intent.status === "requires_payment_method" ||
      intent.status === "requires_confirmation" ||
      intent.status === "requires_action"
    ) {
      await stripe.paymentIntents.cancel(payment.intentId, { cancellation_reason: "requested_by_customer" });
      return null;
    }
    if (intent.status === "canceled") return null;
    destinationCharge = Boolean(intent.transfer_data?.destination);
    chargeId ??= typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id ?? null;
  }

  // Part of the money may already have been sent back (a partial refund, then
  // a cancellation). Stripe rejects a refund larger than what is left on the
  // charge, so only ever ask for the remaining amount.
  // Reading the charge is mandatory: guessing its balance or destination can
  // charge the platform for the host's refund and record a refund that failed.
  if (!chargeId) throw new Error("No captured Stripe charge is available for this refund.");
  const charge = await stripe.charges.retrieve(chargeId);
  destinationCharge ||= Boolean(charge.transfer_data?.destination);
  const remainingMinor = Math.max(0, charge.amount_captured - charge.amount_refunded);
  if (remainingMinor <= 0) return null;

  const amountMinor = Math.min(toMinorUnits(amountUsd), remainingMinor);
  if (amountMinor <= 0) return null;

  // The key includes what is left on the charge, so a retried identical request
  // is deduplicated by Stripe while a genuine later refund gets a new key.
  const refund = await stripe.refunds.create(
    {
      ...(payment.intentId ? { payment_intent: payment.intentId } : { charge: payment.chargeId as string }),
      amount: amountMinor,
      ...(destinationCharge ? { reverse_transfer: true, refund_application_fee: true } : {}),
      metadata: { bookingId },
    },
    { idempotencyKey: `refund_${bookingId}_${remainingMinor}_${amountMinor}` },
  );
  return refund.id;
}

/**
 * Takes the money that was only held on the guest's card. Called when the host
 * accepts a request; a booking paid outright (instant book) is already
 * captured and is left untouched.
 */
export async function capturePaymentForBooking(bookingId: string): Promise<void> {
  if (!stripeEnabled()) return;
  const payment = await stripePaymentForBooking(bookingId);
  if (!payment?.intentId) return;

  const stripe = requireStripe();
  const intent = await stripe.paymentIntents.retrieve(payment.intentId);
  if (intent.status !== "requires_capture") return;
  await stripe.paymentIntents.capture(payment.intentId, {}, { idempotencyKey: `capture_${payment.intentId}` });
}
