-- =============================================================================
-- Nestara / Roomeasy — PostgreSQL schema
-- Generated from the application data model (src/models, src/data, src/api).
-- Target: PostgreSQL 14+
--
-- Load order:
--   psql -f db/schema.sql
--   psql -f db/seed.sql
--
-- Naming: snake_case, UTC timestamptz, money in USD numeric(12,2),
-- percentages as numeric(5,2) (10.00 = 10%).
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist; -- exclusion constraint on date ranges

-- -----------------------------------------------------------------------------
-- 1. Enumerated types  (values mirror the TypeScript unions exactly)
-- -----------------------------------------------------------------------------

-- src/data/platform.ts :: Role
CREATE TYPE user_role AS ENUM ('guest', 'host', 'admin');

-- src/data/platform.ts :: BookingStatus
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'declined', 'cancelled', 'completed');

-- src/data/platform.ts :: ListingStatus
CREATE TYPE listing_status AS ENUM ('draft', 'published', 'suspended');

-- src/models/property.ts :: PropertyCategory
CREATE TYPE property_category AS ENUM (
  'apartment', 'resort', 'lodge', 'hotel', 'villa', 'guesthouse',
  'riad', 'studio', 'bungalow', 'chalet', 'hostel', 'camping'
);

-- src/models/property.ts :: AmenityId (quick-filter amenities)
CREATE TYPE amenity_id AS ENUM (
  'wifi', 'pool', 'kitchen', 'parking', 'airConditioning',
  'workspace', 'petFriendly', 'breakfast'
);

-- src/models/property.ts :: CancellationPolicy
CREATE TYPE cancellation_policy AS ENUM ('flexible', 'moderate', 'strict');

-- src/data/equipment.ts :: EquipmentGroup
CREATE TYPE equipment_group AS ENUM (
  'general', 'wellness', 'food', 'activities', 'transport',
  'services', 'family', 'safety', 'cleaning', 'access'
);

-- src/models/booking.ts :: PriceLine['id']
CREATE TYPE discount_kind AS ENUM ('longStay', 'mobile', 'lastMinute');

-- src/models/booking.ts :: PaymentRecord
CREATE TYPE payment_method AS ENUM ('card');
CREATE TYPE card_brand     AS ENUM ('visa', 'mastercard', 'amex', 'card');
CREATE TYPE payment_status AS ENUM ('authorized', 'paid', 'refunded');

-- src/data/platform.ts :: Payout['status']
CREATE TYPE payout_status AS ENUM ('paid', 'scheduled');

-- src/data/platform.ts :: TeamMember['scopes']
CREATE TYPE team_scope AS ENUM ('calendar', 'messaging');

-- src/hooks/usePlatform.ts :: cookiesChoice
CREATE TYPE cookie_choice AS ENUM ('accepted', 'essential');

-- Who triggered a cancellation (client note: hosts *and* guests can cancel).
CREATE TYPE actor_role AS ENUM ('guest', 'host', 'admin', 'system');

-- Admin moderation (client note: admin can censor comments / block users).
CREATE TYPE moderation_action AS ENUM (
  'review_hidden', 'review_restored', 'review_deleted',
  'user_suspended', 'user_restored',
  'listing_suspended', 'listing_published'
);

-- -----------------------------------------------------------------------------
-- 2. Shared helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Accent-insensitive comparison helper (no unaccent extension required).
-- Used to match display names such as 'Tomás' against 'Tomas'.
CREATE OR REPLACE FUNCTION deaccent(value text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT AS $$
  -- Map the common precomposed accents, then drop any leftover non-ASCII
  -- bytes (covers decomposed forms such as 'a' + combining acute).
  SELECT lower(regexp_replace(translate(value,
    'áàâäãåéèêëíìîïóòôöõúùûüçñýÁÀÂÄÃÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑÝ',
    'aaaaaaeeeeiiiiooooouuuucnyaaaaaaeeeeiiiiooooouuuucny'), '[^ -~]', '', 'g'));
$$;

-- -----------------------------------------------------------------------------
-- 3. Accounts
-- -----------------------------------------------------------------------------

CREATE TABLE app_user (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stable public key used by the current front-end seeds ("u-1", ...).
  legacy_id     text UNIQUE,
  full_name     text        NOT NULL,
  email         text        NOT NULL UNIQUE CHECK (position('@' IN email) > 1),
  phone         text,
  verified      boolean     NOT NULL DEFAULT false,
  email_verified boolean    NOT NULL DEFAULT false, -- separate from `verified` (identity check): confirms the signup email
  suspended     boolean     NOT NULL DEFAULT false,
  avatar_url    text,
  locale        text        NOT NULL DEFAULT 'en',
  currency      text        NOT NULL DEFAULT 'EUR',
  joined_on     date        NOT NULL DEFAULT CURRENT_DATE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


CREATE TRIGGER app_user_touch BEFORE UPDATE ON app_user
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Roles live in their own table: never store a role on the profile row.
CREATE TABLE user_role_grant (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  role       user_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX user_role_grant_user_idx ON user_role_grant(user_id);

CREATE TABLE user_avatar (
  user_id      uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  content      bytea       NOT NULL,
  content_type text        NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size    integer     NOT NULL CHECK (byte_size > 0 AND byte_size <= 2097152),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER user_avatar_touch BEFORE UPDATE ON user_avatar
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION has_role(p_user_id uuid, p_role user_role)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM user_role_grant
                 WHERE user_id = p_user_id AND role = p_role);
$$;

-- Public host profile (src/models/property.ts :: PropertyHost)
CREATE TABLE host_profile (
  user_id           uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  display_name      text    NOT NULL,
  hosting_since     integer NOT NULL CHECK (hosting_since BETWEEN 1990 AND 2100),
  superhost         boolean NOT NULL DEFAULT false,
  bio               text,
  response_rate     numeric(5,2) CHECK (response_rate BETWEEN 0 AND 100),
  payouts_onboarded boolean NOT NULL DEFAULT false,  -- stripeOnboarded
  payout_reference  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER host_profile_touch BEFORE UPDATE ON host_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE email_verification_token (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_verification_user_idx ON email_verification_token(user_id, created_at DESC);

-- Host team members with scoped access (src/data/platform.ts :: TeamMember)
CREATE TABLE host_team_member (
  id         text PRIMARY KEY,
  host_id    uuid NOT NULL REFERENCES host_profile(user_id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  email      text NOT NULL,
  scopes     team_scope[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (host_id, email)
);

-- Cookie banner choice, per account or per anonymous device.
CREATE TABLE cookie_consent (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES app_user(id) ON DELETE CASCADE,
  device_id  text,
  choice     cookie_choice NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);

-- -----------------------------------------------------------------------------
-- 4. Equipment & services catalogue (196 rows, from the client PDF)
-- -----------------------------------------------------------------------------

CREATE TABLE equipment (
  id       text PRIMARY KEY,               -- slug, e.g. 'swimming-pool'
  "group"  equipment_group NOT NULL,
  label_en text NOT NULL,
  label_fr text NOT NULL,
  -- true = charged as an extra rather than included in the nightly rate
  paid     boolean NOT NULL DEFAULT false,
  active   boolean NOT NULL DEFAULT true
);
CREATE INDEX equipment_group_idx ON equipment("group");
-- Powers the host dashboard search box (EN + FR).
CREATE INDEX equipment_search_idx ON equipment
  USING gin (to_tsvector('simple', label_en || ' ' || label_fr));

-- -----------------------------------------------------------------------------
-- 5. Properties & listings
-- -----------------------------------------------------------------------------

CREATE TABLE property (
  -- Slug generated from the title by the wizard (src/models/listing.ts).
  id                  text PRIMARY KEY,
  host_id             uuid REFERENCES host_profile(user_id) ON DELETE SET NULL,
  name                text NOT NULL CHECK (char_length(name) BETWEEN 4 AND 120),
  category            property_category NOT NULL,
  summary             text CHECK (summary IS NULL OR char_length(summary) <= 300),
  description         text CHECK (description IS NULL OR char_length(description) <= 4000),

  -- Location. `location_*` mirrors the localised label the UI shows;
  -- city/country are the structured values the wizard collects.
  city                text NOT NULL,
  country             text NOT NULL,
  neighbourhood       text,
  postal_code         text,                       -- searchable alongside the city
  latitude            numeric(9,6)  CHECK (latitude  BETWEEN -90  AND 90),
  longitude           numeric(9,6)  CHECK (longitude BETWEEN -180 AND 180),

  -- Capacity
  guests              integer NOT NULL CHECK (guests  BETWEEN 1 AND 64),
  rooms               integer NOT NULL CHECK (rooms   BETWEEN 1 AND 40),
  beds                integer NOT NULL CHECK (beds    BETWEEN 1 AND 64),
  baths               integer NOT NULL CHECK (baths   BETWEEN 1 AND 40),
  area_sqm            integer NOT NULL CHECK (area_sqm BETWEEN 10 AND 5000),

  -- Pricing defaults (the live nightly rate lives on `listing`)
  base_price_usd      numeric(12,2) NOT NULL CHECK (base_price_usd BETWEEN 10 AND 100000),
  cleaning_fee_usd    numeric(12,2) NOT NULL DEFAULT 0 CHECK (cleaning_fee_usd >= 0),
  min_nights          integer NOT NULL DEFAULT 1 CHECK (min_nights BETWEEN 1 AND 365),

  -- Rules & policies (host-controlled, per client note)
  cancellation_policy cancellation_policy NOT NULL DEFAULT 'moderate',
  house_rules         text CHECK (house_rules IS NULL OR char_length(house_rules) <= 2000),
  check_in            time,
  check_out           time,
  instant_book        boolean NOT NULL DEFAULT false,

  -- Aggregates, refreshed from `review`
  rating              numeric(3,2) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count        integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX property_host_idx     ON property(host_id);
CREATE INDEX property_category_idx ON property(category);
CREATE INDEX property_city_idx     ON property(lower(city));
CREATE INDEX property_postal_idx   ON property(postal_code);
CREATE INDEX property_price_idx    ON property(base_price_usd);
-- Keyword search over name + city + country + postal code.
CREATE INDEX property_search_idx ON property USING gin (
  to_tsvector('simple',
    name || ' ' || city || ' ' || country || ' ' || coalesce(postal_code, ''))
);
CREATE TRIGGER property_touch BEFORE UPDATE ON property
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Localised city/country labels shown per language ("New York, USA" / "…, États-Unis").
CREATE TABLE property_translation (
  property_id   text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  locale        text NOT NULL CHECK (locale IN ('en', 'fr', 'es', 'de', 'pt')),
  location_label text NOT NULL,
  name          text,
  summary       text,
  description   text,
  PRIMARY KEY (property_id, locale)
);

-- Up to 10 photos per listing (client note: 10 instead of 4).
CREATE TABLE property_photo (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  url         text NOT NULL,
  alt_text    text,
  position    integer NOT NULL CHECK (position BETWEEN 0 AND 9),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, position)
);
CREATE INDEX property_photo_property_idx ON property_photo(property_id);

CREATE OR REPLACE FUNCTION enforce_photo_limit() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM property_photo WHERE property_id = NEW.property_id) > 10 THEN
    RAISE EXCEPTION 'A listing can hold at most 10 photos';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER property_photo_limit
  AFTER INSERT ON property_photo DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION enforce_photo_limit();

CREATE TABLE property_amenity (
  property_id text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  amenity     amenity_id NOT NULL,
  PRIMARY KEY (property_id, amenity)
);

CREATE TABLE property_equipment (
  property_id  text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  equipment_id text NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  -- Host may override the catalogue default and charge for this item.
  paid         boolean,
  note         text,
  PRIMARY KEY (property_id, equipment_id)
);
CREATE INDEX property_equipment_equipment_idx ON property_equipment(equipment_id);

CREATE TABLE property_tag (
  property_id text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  tag         text NOT NULL,
  PRIMARY KEY (property_id, tag)
);

-- The host-facing listing record (src/data/platform.ts :: HostListing)
CREATE TABLE listing (
  id                     text PRIMARY KEY,           -- 'hl-<propertyId>' / 'ls-n'
  property_id            text NOT NULL UNIQUE REFERENCES property(id) ON DELETE CASCADE,
  status                 listing_status NOT NULL DEFAULT 'draft',
  approved               boolean NOT NULL DEFAULT false,
  nightly_usd            numeric(12,2) NOT NULL CHECK (nightly_usd BETWEEN 10 AND 100000),
  long_stay_enabled      boolean NOT NULL DEFAULT false,
  long_stay_threshold    integer NOT NULL DEFAULT 7  CHECK (long_stay_threshold BETWEEN 1 AND 365),
  long_stay_discount     numeric(5,2) NOT NULL DEFAULT 10 CHECK (long_stay_discount BETWEEN 0 AND 90),
  mobile_enabled         boolean NOT NULL DEFAULT false,
  mobile_discount        numeric(5,2) NOT NULL DEFAULT 5  CHECK (mobile_discount BETWEEN 0 AND 90),
  published_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listing_status_idx ON listing(status);
CREATE TRIGGER listing_touch BEFORE UPDATE ON listing
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Every wizard save, stored verbatim as the JSON payload the API receives
-- (src/models/listing.ts :: ListingDraft). Gives a full edit history and lets
-- the backend replay a submission.
CREATE TABLE listing_submission (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   text NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
  property_id  text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES app_user(id) ON DELETE SET NULL,
  status       listing_status NOT NULL,
  payload      jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listing_submission_listing_idx ON listing_submission(listing_id, submitted_at DESC);

-- -----------------------------------------------------------------------------
-- 6. Availability calendar (src/data/platform.ts :: CalendarMap)
-- -----------------------------------------------------------------------------

CREATE TABLE calendar_night (
  property_id text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  night       date NOT NULL,
  blocked     boolean NOT NULL DEFAULT false,
  price_usd   numeric(12,2) CHECK (price_usd IS NULL OR price_usd >= 0),
  PRIMARY KEY (property_id, night)
);
CREATE INDEX calendar_night_night_idx ON calendar_night(night);

-- -----------------------------------------------------------------------------
-- 7. Bookings, pricing and payments
-- -----------------------------------------------------------------------------

CREATE TABLE booking (
  id             text PRIMARY KEY,
  reference      text NOT NULL UNIQUE,            -- e.g. 'RE-8H4K2P'
  property_id    text NOT NULL REFERENCES property(id) ON DELETE RESTRICT,
  guest_id       uuid REFERENCES app_user(id) ON DELETE SET NULL,
  guest_name     text NOT NULL,
  guest_email    text,
  guest_phone    text,
  message        text,

  check_in       date NOT NULL,
  check_out      date NOT NULL,
  nights         integer GENERATED ALWAYS AS (check_out - check_in) STORED,
  guests         integer NOT NULL CHECK (guests BETWEEN 1 AND 64),
  status         booking_status NOT NULL DEFAULT 'pending',

  -- Price breakdown (src/models/booking.ts :: PriceBreakdown)
  currency       char(3) NOT NULL DEFAULT 'EUR',
  nightly_usd    numeric(12,2) NOT NULL CHECK (nightly_usd >= 0),
  base_subtotal  numeric(12,2) NOT NULL CHECK (base_subtotal >= 0),
  subtotal       numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  cleaning_fee   numeric(12,2) NOT NULL DEFAULT 0 CHECK (cleaning_fee >= 0),
  service_fee    numeric(12,2) NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
  taxes          numeric(12,2) NOT NULL DEFAULT 0 CHECK (taxes >= 0),
  total_usd      numeric(12,2) NOT NULL CHECK (total_usd >= 0),
  commission_rate numeric(5,2) NOT NULL CHECK (commission_rate BETWEEN 0 AND 100), -- Commission rate frozen at booking time

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
CREATE INDEX booking_property_idx ON booking(property_id, check_in);
CREATE INDEX booking_guest_idx    ON booking(guest_id, check_in DESC);
CREATE INDEX booking_status_idx   ON booking(status);
CREATE TRIGGER booking_touch BEFORE UPDATE ON booking
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- No two live bookings may overlap on the same property.
ALTER TABLE booking ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    property_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (status IN ('pending', 'confirmed', 'completed'));

CREATE TABLE booking_discount (
  booking_id text NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  kind       discount_kind NOT NULL,
  percent    numeric(5,2)  NOT NULL CHECK (percent BETWEEN 0 AND 90),
  amount_usd numeric(12,2) NOT NULL CHECK (amount_usd >= 0),
  PRIMARY KEY (booking_id, kind)
);

CREATE TABLE payment (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  method     payment_method NOT NULL DEFAULT 'card',
  brand      card_brand     NOT NULL DEFAULT 'card',
  last4      char(4) NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
  status     payment_status NOT NULL DEFAULT 'authorized',
  amount_usd numeric(12,2) NOT NULL CHECK (amount_usd >= 0),
  reference  text NOT NULL,                       -- PSP intent id
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reference)
);
CREATE INDEX payment_booking_idx ON payment(booking_id);

-- Cancellations: both sides can cancel; refund follows the listing policy.
CREATE TABLE booking_cancellation (
  booking_id      text PRIMARY KEY REFERENCES booking(id) ON DELETE CASCADE,
  cancelled_by    actor_role NOT NULL,
  cancelled_by_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  policy          cancellation_policy NOT NULL,
  refund_percent  numeric(5,2) NOT NULL CHECK (refund_percent BETWEEN 0 AND 100),
  refund_usd      numeric(12,2) NOT NULL CHECK (refund_usd >= 0),
  reason          text,
  cancelled_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payout (
  id          text PRIMARY KEY,
  host_id     uuid REFERENCES host_profile(user_id) ON DELETE SET NULL,
  host_name   text NOT NULL,
  amount_usd  numeric(12,2) NOT NULL CHECK (amount_usd >= 0),
  status      payout_status NOT NULL,
  payout_date date NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payout_host_idx ON payout(host_id, payout_date DESC);

CREATE TABLE payout_item (
  payout_id  text NOT NULL REFERENCES payout(id) ON DELETE CASCADE,
  booking_id text NOT NULL REFERENCES booking(id) ON DELETE RESTRICT,
  amount_usd numeric(12,2) NOT NULL CHECK (amount_usd >= 0),
  PRIMARY KEY (payout_id, booking_id)
);

-- -----------------------------------------------------------------------------
-- 8. Reviews & moderation
-- -----------------------------------------------------------------------------

CREATE TABLE review (
  id           text PRIMARY KEY,
  property_id  text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  booking_id   text UNIQUE REFERENCES booking(id) ON DELETE SET NULL,
  author_id    uuid REFERENCES app_user(id) ON DELETE SET NULL,
  author_name  text NOT NULL,
  rating       integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body         text NOT NULL CHECK (char_length(body) <= 2000),
  -- Host response (client note: host can respond to a visitor review).
  reply        text CHECK (reply IS NULL OR char_length(reply) <= 2000),
  replied_at   timestamptz,
  replied_by   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  -- Admin censorship: hidden reviews stay in the table but leave the public view.
  hidden       boolean NOT NULL DEFAULT false,
  hidden_at    timestamptz,
  hidden_by    uuid REFERENCES app_user(id) ON DELETE SET NULL,
  created_on   date NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (reply IS NULL OR replied_at IS NOT NULL)
);
CREATE INDEX review_property_idx ON review(property_id, created_on DESC);
CREATE INDEX review_hidden_idx   ON review(hidden);
CREATE TRIGGER review_touch BEFORE UPDATE ON review
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE VIEW public_review AS
  SELECT * FROM review WHERE hidden = false;

-- Keeps property.rating / review_count in step with visible reviews.
CREATE OR REPLACE FUNCTION refresh_property_rating() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE target text := coalesce(NEW.property_id, OLD.property_id);
BEGIN
  UPDATE property p
     SET rating = coalesce((SELECT round(avg(rating)::numeric, 2)
                              FROM review WHERE property_id = target AND hidden = false), 0),
         review_count = (SELECT count(*) FROM review
                          WHERE property_id = target AND hidden = false)
   WHERE p.id = target;
  RETURN NULL;
END;
$$;
CREATE TRIGGER review_rating_sync
  AFTER INSERT OR UPDATE OR DELETE ON review
  FOR EACH ROW EXECUTE FUNCTION refresh_property_rating();

CREATE TABLE moderation_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid REFERENCES app_user(id) ON DELETE SET NULL,
  action       moderation_action NOT NULL,
  target_kind  text NOT NULL CHECK (target_kind IN ('review', 'user', 'listing')),
  target_id    text NOT NULL,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moderation_log_target_idx ON moderation_log(target_kind, target_id);

-- -----------------------------------------------------------------------------
-- 9. Messaging (src/data/platform.ts :: Thread)
-- -----------------------------------------------------------------------------

CREATE TABLE message_thread (
  id          text PRIMARY KEY,
  property_id text REFERENCES property(id) ON DELETE SET NULL,
  booking_id  text REFERENCES booking(id) ON DELETE SET NULL,
  guest_id    uuid REFERENCES app_user(id) ON DELETE SET NULL,
  host_id     uuid REFERENCES app_user(id) ON DELETE SET NULL,
  -- Display label used while accounts are not linked yet ("Maya (host)").
  with_name   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX message_thread_property_idx ON message_thread(property_id);
CREATE TRIGGER message_thread_touch BEFORE UPDATE ON message_thread
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE message (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id   text,
  thread_id   text NOT NULL REFERENCES message_thread(id) ON DELETE CASCADE,
  sender_id   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  sender_role actor_role NOT NULL,
  body        text NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz,
  UNIQUE (thread_id, legacy_id)
);
CREATE INDEX message_thread_idx ON message(thread_id, sent_at);

CREATE VIEW thread_unread_count AS
  SELECT thread_id, count(*) FILTER (WHERE read_at IS NULL) AS unread
    FROM message GROUP BY thread_id;

-- -----------------------------------------------------------------------------
-- 10. Favourites
-- -----------------------------------------------------------------------------

CREATE TABLE favorite (
  user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  property_id text NOT NULL REFERENCES property(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

-- -----------------------------------------------------------------------------
-- 11. Platform settings & analytics
-- -----------------------------------------------------------------------------

-- Single-row configuration table (src/data/seed/settings.json + admin screen).
CREATE TABLE platform_settings (
  id                     boolean PRIMARY KEY DEFAULT true CHECK (id),
  service_fee_rate       numeric(5,4) NOT NULL DEFAULT 0.08 CHECK (service_fee_rate BETWEEN 0 AND 1),
  tax_rate               numeric(5,4) NOT NULL DEFAULT 0.05 CHECK (tax_rate BETWEEN 0 AND 1),
  commission_rate        numeric(5,2) NOT NULL DEFAULT 12   CHECK (commission_rate BETWEEN 0 AND 100),
  rate_weekend_percent   numeric(5,2) NOT NULL DEFAULT 15,
  rate_long_stay_percent numeric(5,2) NOT NULL DEFAULT 10,
  rate_last_minute_percent numeric(5,2) NOT NULL DEFAULT 5,
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Per-host override of the global rate rules (host dashboard).
CREATE TABLE host_rate_rules (
  host_id                uuid PRIMARY KEY REFERENCES host_profile(user_id) ON DELETE CASCADE,
  weekend_percent        numeric(5,2) NOT NULL DEFAULT 15,
  long_stay_percent      numeric(5,2) NOT NULL DEFAULT 10,
  last_minute_percent    numeric(5,2) NOT NULL DEFAULT 5,
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Dashboard chart source (src/data/seed/analytics.json).
CREATE TABLE booking_monthly_stat (
  host_id  uuid REFERENCES host_profile(user_id) ON DELETE CASCADE,
  year     integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month    integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  bookings integer NOT NULL DEFAULT 0 CHECK (bookings >= 0),
  revenue_usd numeric(12,2) NOT NULL DEFAULT 0 CHECK (revenue_usd >= 0),
  UNIQUE (host_id, year, month)
);

-- FX rates used by the currency selector (src/routes/api/public/exchange-rates.ts).
CREATE TABLE exchange_rate (
  base_currency   char(3) NOT NULL DEFAULT 'EUR',
  quote_currency  char(3) NOT NULL,
  rate            numeric(18,8) NOT NULL CHECK (rate > 0),
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (base_currency, quote_currency)
);

-- -----------------------------------------------------------------------------
-- 12. "Genuse" trusted-guest criteria  (PROVISIONAL — client clarification pending)
-- Known rule so far: 5 reservations within 2 years.
-- -----------------------------------------------------------------------------

CREATE TABLE trust_badge_rule (
  code             text PRIMARY KEY,            -- 'genuse'
  min_reservations integer NOT NULL CHECK (min_reservations > 0),
  window_months    integer NOT NULL CHECK (window_months > 0),
  requires_verified_account boolean NOT NULL DEFAULT true,
  active           boolean NOT NULL DEFAULT true,
  notes            text
);

CREATE TABLE trust_badge_award (
  user_id    uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  code       text NOT NULL REFERENCES trust_badge_rule(code) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (user_id, code)
);

-- Live eligibility, computed from completed stays inside the rule's window.
CREATE OR REPLACE VIEW trust_badge_eligibility AS
  SELECT u.id AS user_id,
         r.code,
         count(b.id) AS qualifying_reservations,
         r.min_reservations,
         count(b.id) >= r.min_reservations
           AND (NOT r.requires_verified_account OR u.verified) AS eligible
    FROM app_user u
    CROSS JOIN trust_badge_rule r
    LEFT JOIN booking b
      ON b.guest_id = u.id
     AND b.status = 'completed'
     AND b.check_out >= (CURRENT_DATE - make_interval(months => r.window_months))
   WHERE r.active
   GROUP BY u.id, r.code, r.min_reservations, r.requires_verified_account, u.verified;

COMMIT;
