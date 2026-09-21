# Real profile photos and zero fake runtime data

## Goal
Make every user and host identity come from persisted account data. Signup gains an optional photo step, profile settings can replace or remove the photo, and the saved photo appears consistently in account navigation, listing-owner details, reviews, and messaging. Runtime screens must never invent users, stays, dates, totals, portraits, or successful writes.

## 1. Remove fake and demo runtime behavior
- Remove bundled person-photo assignment and all `avatarFor(name)` usage. A missing photo will render a neutral initials/icon fallback, never another person’s face.
- Remove frontend seed JSON imports from live stores/catalogue and stop reading bundled properties directly in booking, checkout, host, listing, and trip screens.
- Remove offline/local-only signup and fake-success write behavior. When the real API is unavailable, keep data empty and show a clear unavailable/error state.
- Remove invented listing images, host dates, summaries, descriptions, reservation values, and first-item checkout fallbacks. Missing real values get an explicit empty state.
- Keep seed generators and test fixtures only as explicit development/test utilities; they will not be imported by production UI code.

## 2. Persist profile photos in the existing backend
- Add an idempotent database migration/registry update for one avatar record per account, storing the processed image bytes, MIME type, size, and update timestamp.
- Keep roles in the existing separate role table; photo changes never affect permissions.
- Add authenticated upload and delete endpoints plus a public read endpoint for displaying a user’s chosen profile image.
- Accept only JPEG, PNG, or WebP; enforce a strict size limit and reject malformed/non-image payloads.
- Update account responses so `avatarUrl` points to the persisted image endpoint and immediately reflects upload/removal.
- Update the canonical SQL schema, backend schema registry, OpenAPI documentation, and API tests together.

## 3. Add the signup photo step
- Turn account creation into a two-step flow for both travellers and hosts: account details first, optional profile photo second.
- After successful account creation, allow choosing, previewing, changing, uploading, or skipping the photo before entering the app.
- Resize/compress the chosen image in the browser before upload, preserve aspect ratio, and show upload progress/error state without losing the signed-in account.
- Never send the photo before authentication succeeds, and never claim it saved until the API confirms it.

## 4. Make profile photo settings fully functional
- Replace the current non-functional photo buttons with a real file picker, preview, save/replace, and remove actions.
- Update the in-memory session only from the account returned by the server so headers and menus refresh immediately.
- Preserve the current photo when unrelated profile fields are edited; allow intentional removal as a distinct action.
- Add translated labels and validation/error copy for all supported languages.

## 5. Propagate real avatars everywhere
- Extend session, user, host, property, review, thread, and message models/DTOs with the correct persisted avatar URL.
- Listing queries will join the owner account and return the host avatar; show it in listing details and host identity areas.
- Messaging queries will return the counterpart avatar and sender avatar; show it in the conversation list, active-thread header, and incoming message identity.
- Reviews will use the existing author avatar returned by the API instead of assigning a bundled portrait.
- Account menus and account workspace headers will show the current user’s photo.
- All surfaces use the same accessible avatar component with initials/icon fallback, alt text, stable sizing, and image-error handling.

## 6. Verification
- Add backend tests for upload, replacement, removal, authentication, MIME rejection, size rejection, public retrieval, and avatar propagation through listings/messages/reviews.
- Verify signup with and without a photo, profile replacement/removal, host listing display, guest/host chat display, and review display.
- Check desktop and mobile layouts, API errors, runtime logs, and the final build.

## Technical details
- Continue using the project’s existing Node/PostgreSQL backend and automatic schema reconciler.
- Store only processed profile images; do not store browser object URLs or bundled demo assets.
- The public image endpoint exposes only the chosen avatar bytes, never private account fields.
- Existing accounts migrate safely with no avatar; no fake backfill is created.
