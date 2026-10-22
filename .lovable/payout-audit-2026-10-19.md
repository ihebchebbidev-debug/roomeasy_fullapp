# Additional payment audit — 19 October 2026

## Reproduced and repaired locally

The isolated tests import the actual payout and refund functions, substituting Stripe and persistence clients; they never load credentials or make network requests.

Four failures occurred in three consecutive pre-fix runs:
1. A charge-only destination refund omitted reversal of the host transfer and application fee.
2. A failed charge lookup proceeded with a guessed refundable balance rather than stopping.
3. Disabled Stripe returned `null`, allowing the calling admin operation to mark an unsent payout paid.
4. Zero/negative transfer amounts returned `null`; non-finite or sub-cent amounts could proceed to Stripe.

The patched functions fail closed for configuration/amount errors, establish the actual captured/refunded balance, and detect the transfer destination on the charge as well as on the intent.

## Additional source-review findings — not integration-reproduced or repaired

Two independent reviewers identified and cross-checked the following code paths. These are not a guarantee of observed production failures:

- **Concurrent payout creation:** `admin.repository.ts`, `createPayoutForHost`, performs unlocked eligibility reads; `registry/bookings.ts` only makes `(payout_id, booking_id)` unique. Different payout IDs also get different Stripe idempotency keys. Reproduce with two synchronized database transactions before adding a reservation/uniqueness repair.
- **Commission inconsistency:** payout creation deducts `service_fee`; checkout and finance use frozen `commission_rate` applied to booking total. Example: 100 total, 5 service fee, 20% commission yields 95 in separate payouts versus 80 in checkout splitting. Verify against real booking rows and agreed settlement rules before changing existing payouts.
- **Refund-adjusted eligibility:** payout creation excludes destination-settled payments only in authorized/paid states and ignores refunds; fully refunded completed bookings may regain eligibility. Scheduled payouts are not revalidated against later refunds.
- **Concurrent host acceptance:** capture precedes the conditional booking update; the losing acceptance compensates with a refund even if another acceptance confirmed the booking.
- **Repeated intent allocation:** checkout intent creation has no booking-scoped allocation lock/idempotency and searches only locally pending payments, while covered approval-required bookings remain pending.
- **Refund event ordering:** webhook cumulative balance assignment can regress on stale events; manual/cancellation paths also increment the same balance, potentially double-counting webhook-first delivery.
- **Refund retries:** the refund key changes with remaining captured balance; a database failure after Stripe success can give a retry a new key for the same intended refund.
- **Partial cancellation accounting:** cancellation marks partially refunded payments fully refunded; admin refundable balance reads booking_refund while guest cancellation writes booking_cancellation/payment instead.

## Verification boundary

Local regression tests validate execution against simulated Stripe responses, not real transfers, PostgreSQL concurrency, deployment state, or receipt of funds in a host bank account. The external API must be updated before these code changes protect live operations. A test-mode connected-host payment, payout, partial refund, cancellation and retry sequence is still required; no real money movement was attempted.