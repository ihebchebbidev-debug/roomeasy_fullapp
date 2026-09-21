# Database

PostgreSQL 14+ schema and demo data for the Nestara / Roomeasy app.

```bash
createdb nestara
psql -d nestara -v ON_ERROR_STOP=1 -f db/schema.sql
psql -d nestara -v ON_ERROR_STOP=1 -f db/seed.sql
```

Both files were executed end-to-end against PostgreSQL 17 with
`ON_ERROR_STOP=1` before being committed.

## Files

| File | Contents |
| --- | --- |
| `schema.sql` | Enums, 32 tables, indexes, constraints, triggers and views |
| `seed.sql` | Demo rows generated 1:1 from `src/data/seed/*.json` |

## Coverage map (app → database)

| App area | Tables |
| --- | --- |
| Accounts, roles, hosts, team | `app_user`, `user_role_grant`, `host_profile`, `host_team_member`, `cookie_consent` |
| Equipment & services (196 items) | `equipment`, `property_equipment` |
| Listings | `property`, `property_translation`, `property_photo`, `property_amenity`, `property_tag`, `listing`, `listing_submission` |
| Availability | `calendar_night` |
| Bookings & money | `booking`, `booking_discount`, `payment`, `booking_cancellation`, `payout`, `payout_item` |
| Reviews & moderation | `review`, `public_review` (view), `moderation_log` |
| Messaging | `message_thread`, `message`, `thread_unread_count` (view) |
| Favourites | `favorite` |
| Settings & analytics | `platform_settings`, `host_rate_rules`, `booking_monthly_stat`, `exchange_rate` |
| "Genuse" trusted guest | `trust_badge_rule`, `trust_badge_award`, `trust_badge_eligibility` (view) |

## Notes and assumptions

- `listing_submission.payload` stores the exact JSON the host wizard sends
  (`ListingDraft`), so every save is replayable and auditable.
- A photo-count trigger enforces the 10-photos-per-listing limit.
- `booking_no_overlap` is a GiST exclusion constraint: two live bookings can
  never overlap on the same property.
- `property.rating` / `review_count` are kept in sync by a trigger over
  visible (non-hidden) reviews, so seeded demo averages are recomputed from
  the seeded reviews on load.
- `deaccent()` is a small helper used by the seed to match host names written
  with and without accents (`Tomás` vs `Tomas Alvarez`).
- Amenities are derived in the UI (`src/data/properties.ts :: amenitiesFor`);
  the generator applies the same rule, so `property_amenity` matches the app.
- Demo host accounts (the names shown on catalogue cards) get generated
  `firstname@nestara.travel` addresses purely so the foreign keys resolve.
- The "Genuse" rule is seeded with the only criterion given so far
  (5 reservations / 24 months) and is marked provisional pending the client's
  full definition; awards are computed live by `trust_badge_eligibility`.

## Deliberately empty after seeding

| Table | Why |
| --- | --- |
| `property_photo` | The demo front-end uses bundled image assets, so there are no stored URLs to seed. Real uploads land here (max 10 per listing, enforced by trigger). |
| `booking_discount` | No demo stay is long enough to trigger the 7-night long-stay discount; the generator inserts rows automatically when one is. |
| `trust_badge_award` | Badges are computed live by the `trust_badge_eligibility` view; the award table only stores manually granted or snapshotted badges. |

## Regenerating the seed

`seed.sql` is generated — edit `db/generate-seed.ts`, never `seed.sql`:

```bash
bun db/generate-seed.ts
```

## Known front-end gap (not a schema gap)

`app_user.currency` and `app_user.locale` exist for per-account preferences,
but the app currently keeps the currency and language choice in browser
storage only. Wire the selector to these columns when the real API lands.

