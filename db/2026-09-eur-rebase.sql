-- ---------------------------------------------------------------------------
-- Rebase the platform from USD to EUR (run once, against the live database).
--
-- The platform is French, so prices are now quoted and charged in euros.
-- Existing prices are CONVERTED at the rate below, so a place that cost the
-- guest 120 USD still costs the same in real terms (about 110 EUR) instead of
-- silently becoming 120 EUR.
--
-- Set :rate to the USD -> EUR rate of the day before running, e.g.
--   psql "$DATABASE_URL" -v rate=0.92 -f db/2026-09-eur-rebase.sql
--
-- What is NOT touched: payments, refunds and payouts that already happened.
-- Those are historical records of money that really moved in USD; rewriting
-- them would falsify the books. Only forward-looking prices are converted.
-- ---------------------------------------------------------------------------

\set ON_ERROR_STOP on

BEGIN;

-- Listing prices ------------------------------------------------------------
UPDATE property
   SET base_price_usd   = round(base_price_usd   * :rate, 2),
       cleaning_fee_usd = round(cleaning_fee_usd * :rate, 2);

UPDATE listing
   SET nightly_usd = round(nightly_usd * :rate, 2);

-- Per-night calendar overrides ----------------------------------------------
UPDATE calendar_day
   SET price_usd = round(price_usd * :rate, 2)
 WHERE price_usd IS NOT NULL;

-- Bookings that have not been paid yet --------------------------------------
UPDATE booking
   SET currency      = 'EUR',
       nightly_usd   = round(nightly_usd   * :rate, 2),
       base_subtotal = round(base_subtotal * :rate, 2),
       subtotal      = round(subtotal      * :rate, 2),
       cleaning_fee  = round(cleaning_fee  * :rate, 2),
       service_fee   = round(service_fee   * :rate, 2),
       taxes         = round(taxes         * :rate, 2),
       total_usd     = round(total_usd     * :rate, 2)
 WHERE id NOT IN (SELECT booking_id FROM payment);

-- Member display preference --------------------------------------------------
UPDATE app_user SET currency = 'EUR' WHERE currency = 'USD';

-- Exchange-rate cache is now euro-based; it refills itself from the provider.
DELETE FROM exchange_rate;

COMMIT;
