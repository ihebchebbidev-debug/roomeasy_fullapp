# Roadmap

## Open (needs the user)
- [ ] Live payout test: a host must finish Stripe payout verification by hand (the verification page blocks automated browsers).
- [ ] Server-side settings still to fix: allowed site addresses (CORS), admin-creation tool disabled in production, e-mail sender address, public site address.
- [x] Audit of fixed data: invented review, "95%" claim, invented host name, fake homepage counters and stock trust avatars removed; homepage figures now come from the live catalogue; booking confirmation shows the listing's real check-in/out hours; payouts panel no longer fakes a verified state
- [x] Homepage testimonials show only real published guest reviews; the block hides itself when there are none, and it appears on the home page only
- [x] Polished "nothing here yet" block used across guest, host and admin screens instead of bare white space
- [ ] Real listings and photos must be created in the service (host or admin screens). The app now shows only what the service holds, so the catalogue is empty until real stays are added.

## Admin specification (roomeasy-admin-specs.docx)
### Block 1 — hosts, guests and listings (backend done, screens pending)
- [x] Suspensions can carry an end date and lift themselves automatically
- [x] Member search also matches phone numbers (digit-only match)
- [x] Banning a host takes every live listing offline; unbanning restores the approved ones
- [x] Host page endpoint: listings, bookings, revenue, reviews and identity documents together
- [x] Refusals use a fixed reason list (shared backend/app list) instead of free text
- [x] A host editing a published listing sends it back for review
- [x] Host page screen in the back office (linked from the members list)
- [x] Suspension-duration and phone-search controls in the members screen
- [x] Identity document required at host signup (filed as a pending check for the back office)

### Blocks still open
- [x] Bookings: filters by traveller, host, listing and stay dates; sheet showing payment method and the traveller-host conversation
- [x] Statistics: occupancy rate, average basket, signup curve, top destinations, seasonality, Excel export
- [x] Support: "awaiting reply" and "escalated" statuses, conversation view, one-click cancel/refund/suspend from a ticket
- [x] Finance: invoices, monthly/quarterly/yearly accounting exports, commission report per host per period, per-booking payment status (payment states become real once Stripe payouts are connected)

## Done
- [x] Host accept/decline/cancel await the service and roll back on failure
- [x] Expired session token cleared on 401
- [x] Refunds only recorded for payments that were actually charged
- [x] Guest/host reservation lists paginated (500 cap)
- [x] Receipts show the exact charged amount (USD), no re-conversion from a cached rate
- [x] Catalogue loads every stay (no silent 2000 cap)
- [x] Refund rounding aligned with quote rounding (whole dollars)
- [x] Removed bundled demo stays, demo photos and unused demo JSON rows
- [x] Service/tax fee rates come from service settings instead of a bundled file
- [x] Featured homepage stay card shows a real listing and links to its page

## Client feedback round 2 (specification v2)
- [x] Booking emails (request, confirmed, declined, cancelled) and new-message emails, in 5 languages
- [x] Excel downloads for statistics and finance; PDF invoices for admins and guests
- [x] Smart pricing: seasons, weekend, early/last-minute, occupancy, gap nights, min/max price; charged by the server, host preview, per-night breakdown at checkout
- [ ] Gap-night "shorter minimum stay" option is stored but not yet applied to the minimum-nights check
- [x] Smart pricing, invoice and Excel/PDF button texts translated in 5 languages
- [ ] Admin editor for Terms / Privacy / Help pages (spec: Must)
- [ ] Admin-managed amenities and property-type list (spec: Must)
- [ ] Admin editor for site texts/translations
- [ ] Editable role permissions (currently fixed)
- [ ] Profile photos moved to file storage
