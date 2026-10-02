# Roadmap — customer feedback

## Localization audit
- [ ] Audit every page and shared interface for untranslated text in English, French, Spanish, German, and Portuguese
- [ ] Fill missing translations and replace static interface text where found
- [ ] Verify translation parity and representative public/account screens

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
