# Refine Nestara discovery and listing experience

## Goal
Create a cohesive, premium booking journey across the landing page, a new all-listings page, and property details while preserving Nestara’s current blue/cloud-white visual identity, bilingual experience, and local asset library.

## What will change

### Landing page
- Refine the hero’s visual hierarchy and spacing so its headline, trust signal, and search controls feel balanced across desktop and mobile.
- Make search navigation more useful by sending completed searches to the full listings page with the selected destination, dates, and guests.
- Tighten the featured stays section, show a curated subset on the homepage, and connect “See all” to the new listings route.
- Keep the supporting value, award, testimonial, and footer sections, but normalize section rhythm and interaction polish where needed.

### All-listings page
- Add a dedicated `/stays` discovery route with unique metadata, shared header/footer, and full English/French translation coverage.
- Add a responsive search/filter system for destination, date range, guests, property type, price range, rating, bedrooms, and sorting.
- Use a desktop filter sidebar and mobile filter drawer, with active-filter chips, clear/reset actions, result counts, and a helpful empty state.
- Render all matching local listings in a responsive grid using the existing property-card and favorites behavior.
- Store filter state in the page URL so results remain shareable and survive navigation.

### Listing details
- Improve gallery controls and image browsing, including a full gallery view and clearer image-count affordance.
- Strengthen the content hierarchy with an overview/host summary, better amenity grouping, richer review presentation, and related stays.
- Refine the booking panel with clear check-in/check-out states, guest constraints, price breakdown, and a stronger responsive mobile booking flow.
- Ensure back-navigation returns to the listings experience and preserve bilingual labels throughout.

## Technical approach
- Extend the static property model only with presentation/filter data needed by the new UI; all listing images remain imported from `src/assets`.
- Extract reusable discovery controls where useful so homepage and `/stays` stay visually and behaviorally consistent.
- Use existing Tailwind v4 semantic tokens, shadcn controls, TanStack `Link`, and route search parameters; no backend or external image hosting.
- Preserve local favorites persistence and existing routes.

## Validation
- Verify landing, `/stays`, and detail routes at desktop and mobile widths.
- Test filters, sorting, reset, date/guest controls, favorites, route navigation, gallery interactions, language switching, and empty states.
- Confirm no console errors and that each route has complete metadata.
