# Make the server fetch data faster

Goal: pages like trips, messages, stays and the admin dashboard load noticeably quicker, with no change to what they show.

## What I will do

1. **Faster stays list, never out of date.** I won't keep a timed copy of stays in the browser or on a relay server, because an edited or deleted listing could still show there. Instead:
   - The server keeps a copy of the list in memory and **throws it away the moment any listing is created, edited, approved, paused or deleted**, or when its photos or price change. The next visitor gets the new version.
   - Browsers check with the server every time ("has it changed?"). If nothing changed, the server replies with a tiny "same as before" answer instead of the whole list. If anything changed, they get the new list right away.
2. **Remember exchange rates in memory.** Right now every price quote reads rates from the database again. Instead, the server keeps the rates in memory for up to an hour.
3. **Admin dashboard in parallel.** It runs 5 independent counts one after another. They'll run at the same time instead.
4. **Lighter trips, bookings and messages lists.** For every row, these lists look up extra details one at a time (photo, payment, discounts, cancellation, unread count). I'll change them to load those details in one go. Messages also stop counting unread twice.
5. **Load a host's own listings in one request.** Today the site asks the server once per listing (50 listings = 50 requests). I'll add a single "give me these listings" request and use it on the site.
6. **Add missing database shortcuts (indexes)** for things that are often sorted or filtered: stay rating, approved listings, booking date, suspended or banned members, payout currency, identity checks.
7. **Trim the public stays list** so it only sends the fields the cards need, not full descriptions.

## Technical details

- Remove the dead `/api/properties` / `/api/listings` `s-maxage` rule from `middleware/cacheControl.ts`. Send `/api/stays` with `Cache-Control: no-cache` plus an ETag, so browsers always revalidate and get a cheap 304 when nothing changed. There is no shared or CDN caching.
- In-memory catalogue cache keyed by query string, with a version counter. Every listing, property, photo, price, approval, status or delete write (listings, admin moderation, host routes) calls `invalidateCatalogue()`, which bumps the version and clears the cache. The ETag includes the version, so an old copy can never be served as current. There is also a 60 s safety expiry.
- `currency.repository.ts`: add an in-process cache of `getRates()` with a 5-minute TTL, cleared on refresh.
- `admin.repository.ts` `adminOverview`: wrap the aggregates in `Promise.all`. Replace the per-row FX subquery with a join on `exchange_rate`.
- `bookings.repository.ts` `SELECT_BOOKING`: turn the correlated subqueries into `LEFT JOIN LATERAL` applied after the page LIMIT (CTE on paged ids).
- `messaging.repository.ts`: compute unread and last message once through a lateral join. Derive the totals from the same CTE.
- New `GET /listings?ids=` batch (host-scoped). Update `mergeOwnProperties` / `ensureStays` in `src/api/backend.ts` to use it.
- New migration file with the `CREATE INDEX IF NOT EXISTS` statements, also added to `db/schema.sql` and the registry: `property(rating DESC)`, `listing(status, approved)`, `booking(created_at DESC)`, partial indexes on `app_user(suspended)` / `app_user(banned)`, `payout(currency)`, `identity_verification(user_id, status)`.
- `searchProperties` list mode: explicit column list instead of `p.*`.
- Check: backend typecheck, run the existing API test suite, time the endpoints before and after against the live server.

## Needs you afterwards

Backend changes go live only after you redeploy the server and run the new index script on the live database. The website changes (item 5) go live right away.
