# Client feedback round 1 — gap analysis and build plan

## Where the app stands today

Already there:
- Search bar with destination suggestions, dates, guests (adults + children) and a stays results page with filters (type, price, rating, beds, baths, amenities, superhost) and sorting.
- Currency switcher exists as a component, plus 5 languages.
- Host area with listings, calendar/pricing, reviews list where the host can reply, payouts, team.
- Admin area with users and basic moderation.
- Booking flow with confirmation and cancellation on demo data.

Missing or partial versus the client notes:
- Search accepts keywords only — no postal code.
- Guest picker counts travellers, not rooms/chambers.
- Currency switcher is not present in the top bar on every page.
- Reviews only exist as host-side demo data; a guest cannot write one after a stay.
- Admin can act on users but cannot hide/censor a single review.
- Cancellation is one-sided: no host-defined cancellation policy, no host-initiated cancellation.
- No "distance to destination" sort.
- No account drop-down (profile / settings / logout) in the header and host dashboard.
- Only 4 property types (apartment, resort, lodge, hotel) and 8 amenities; the client's document lists ~200 equipment and service items in many groups.
- Photos per listing are limited to 4.

## What I will build

1. Search and results
   - Destination field accepts a postal code as well as a place name, matching on either.
   - Guest picker gains a "rooms" counter alongside travellers.
   - New "Distance to destination" sort option, computed from the searched place.
   - Currency switcher pinned in the top bar across the site.

2. Account drop-down
   - One avatar menu (profile, settings, log out) shown in the site header and in the host dashboard header.

3. Reviews and moderation
   - Guests can leave a rating and comment on a completed stay; it appears on the listing page.
   - Host reply stays as is, now visible publicly under the review.
   - Admin gains hide/unhide and delete on any review, next to the existing block-user action.

4. Cancellation
   - Host sets a cancellation policy per listing (flexible / moderate / strict) with a plain-language summary.
   - Both guest and host can cancel a booking; the applied policy and refund result are shown on the booking.

5. Equipment and services (from the attached document)
   - Full catalogue rebuilt from the PDF, grouped as in the document: general, wellness and spa, food and drink, activities, transport and parking, services, family, accessibility and safety, health and cleaning, check-in and access.
   - Host dashboard gets an equipment section with a search box, grouped yes/no toggles, and a paid/free marker where the document has one (meals, spa, transfers).
   - Listing page shows the selected equipment by group; guest filters use the popular subset so the filter panel stays usable.

6. Property types and photos
   - Property type list expanded (villa, guesthouse, riad, studio, bungalow, chalet, hostel, camping…) — final list to confirm against video 3/4.
   - Photo upload limit raised from 4 to 10 per listing, with count and clear ordering.

## Waiting on the client
- "Genuse" criteria: only "5 reservations / 2 years" is known — the rest of the rules are needed before it can be built.
- Videos 1–4 (host dashboard layout, property types, equipment screens): I do not have them, so I will build these from the notes and the document; send the videos and I will align the layouts.

## Technical notes
- Equipment catalogue lands as a typed, grouped data module (`src/data/equipment.ts` + seed JSON) so it can seed a backend table later; property model gains `equipment` ids and `cancellationPolicy`.
- Distance sort uses the existing `coords` on each stay plus a coordinate lookup for the searched destination; postal-code matching uses a postal field added to stay location data.
- Search state stays in URL params (`rooms`, `postal`, `sort=distance`) via the existing `staySearch` model.
- Everything remains on the current local demo data store; no backend is added in this step.

## Suggested order
Round A: currency in top bar, account drop-down, postal code + rooms + distance sort.
Round B: equipment catalogue, host equipment screen with search, listing display, property types, 10 photos.
Round C: guest reviews, admin review moderation, cancellation policies and two-sided cancellation.
