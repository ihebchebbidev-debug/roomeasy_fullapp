# Dynamic account and administration screens

## Goal
Make every guest, host, and administrator screen clearly useful with real account data, meaningful KPIs, and purposeful empty states instead of blank areas.

## What will change
- Add a shared account-data status so screens distinguish loading, offline/error, and genuinely empty results.
- Improve the host overview with real listing, booking, revenue, confirmation, occupancy, and rating indicators derived from the signed-in host’s data.
- Add complete empty states and next-step actions for host listings, calendar, statistics, payouts, reviews, team, requests, and messages.
- Ensure rows do not silently disappear when a related listing record or image is still loading; show a safe fallback instead.
- Improve the administrator overview with real member, host, listing, approval, booking, payout/revenue, and review indicators where the service exposes them.
- Add explicit empty and no-search-results states to administrator members, payouts, reports, moderation, approvals, and operational panels.
- Replace generic “nothing here” messages with screen-specific French/English/Spanish/German/Portuguese copy and relevant actions where appropriate.
- Keep all figures dynamic: no invented examples, fake bookings, fake listings, or hard-coded KPI values.

## Validation
- Check guest, host, and administrator views with empty data and populated data.
- Verify desktop and mobile layouts, especially KPI grids and empty-state actions.
- Confirm loading and service failure states cannot be mistaken for an empty account.
- Confirm all existing actions and navigation remain functional.

## Technical details
- Extend the existing shared platform store with hydration state rather than introducing a second data layer.
- Reuse the existing `EmptyState` and design-system controls.
- Keep current service endpoints and role permissions; derive KPIs from already-authorized responses.
- Use route/search state patterns already present in the app and preserve current URLs.
