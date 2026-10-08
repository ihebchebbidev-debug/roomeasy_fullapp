# Roadmap — customer feedback

## Localization audit
- [x] Audit every page and shared interface for untranslated text in English, French, Spanish, German, and Portuguese
- [x] Fill missing translations and replace static interface text where found
- [x] Verify translation parity and representative public/account screens

## Admin
- [x] Identity checks: visible navigation entry + live pending counter
- [x] Payouts: confirmation before marking a payout paid
- [x] Team roles: admin grant controls hidden without admin-management access
- [x] Users: search + role/account filters
- [x] Finance: stat numbers no longer cut off
- [x] Admin UI: audit and harden all money/stat values against clipping on desktop and mobile
- [x] Payouts: host + date range + status filters
- [x] Reservations and reservation actions merged into one tab
- [x] Actions history: action/type/admin/date filters
- [x] Cities: Open in Google Maps button
- [x] Settings: sender no-reply@roomeasy.fr, reply-to contact@roomeasy.fr

## Host
- [x] Replace the host overview with an action-first dashboard
- [x] Add upcoming activity and inline request decisions
- [x] Add comparative stats and a nine-month revenue chart
- [x] Add listing snapshots, recent reviews/messages, and useful empty states
- [ ] Validate the signed-in host overview on desktop and mobile — blocked locally by the account service’s browser-access policy
- [x] Calendar: multi-date selection (click, Shift-range, whole month) + apply price/block
- [x] Apply calendar changes to all listings at once
- [x] Listing search shows suggestions

## Visitor
- [x] Hide host dashboard entries for non-hosts
- [x] Redirect signed-out visitors away from every account workspace page

## Footer
- [x] BxBstudio -> BxB Studio

## Full frontend QA
- [ ] Repeat complete administrator browser QA with per-step screenshots
- [x] Audit all public and account routes with screenshots
- [x] Show “New” instead of a zero rating for unrated listings
- [x] Show guest booking notes in host requests
- [x] Make the mobile menu keyboard-safe with focus trapping and Escape dismissal
- [x] Remove the artificial search delay and preserve the full default price range
- [x] Show a visible error when admin CSV export fails
- [x] Give the admin screen a primary page landmark
- [x] Re-test signed-in booking, payment, reviews, replies (2026-09-29, test card)

## RoomEasy QA fixes (2026-10-02)
- [x] Accounts: wrong current password logs out; stale verify-email banner; listing host name stale; deletion 409 toast; deletion/cancellation emails
- [x] Bookings: unpaid pending holds dates + emails + "paid" UI; duplicate request email; min-night error shown; error debug leak
- [x] Listing page (except statistics link — needs exact repro): fake amenities/badges; reviews count; pending 404 call; wizard copy (steps left, France default, FR placeholders, highlights→equipment)
- [x] Messaging: no auto-send on Message host; checkout note in thread; attachments; host avatar
- [ ] Content: remove QA/test listings & reviews from public lists (data — needs backend DB access)
- [ ] Stripe live keys (needs the owner's live keys)

## QA open issues (2026-10-02, round 3)
- [x] Emails in the member's site language (sign-up sends language; language changes saved on account; French default)
- [x] City list: proper capitals, no regions/departments
- [x] "1 chambre · 1 lit" singular/plural everywhere
- [x] Wizard "steps left" counts steps still ahead
- [x] Trip/host dates shown in the site language
- [x] Wi-Fi no longer pre-selected in new listings

## New-client QA fixes (Oct 5)
- [ ] 1. Booking status consistency (awaiting approval vs Confirmed, receipt "Not paid", instant booking)
- [ ] 2. Booking message thread linked to reservation
- [ ] 3. Phone keeps country code after profile save
- [ ] 4. Sign-up profile photo persists
- [ ] 5. Identity document required before first publish
- [ ] 6. Admin approvals count + reservation search exact match
- [ ] 7. Host Statistics section shows statistics

## QA round (Oct 8, new test accounts)
- [x] "Complete payment" resumes the same unpaid booking instead of creating a new one
- [x] Messages panel shows "Total due" (not "Total paid") for unpaid bookings
- [x] Email confirmation link still confirms when opened a second time
- [ ] Reset code email in French for English accounts — code is correct; live server needs redeploy with latest backend
- [ ] Checkout default guests (3) — waiting on owner's choice
