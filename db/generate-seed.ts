import users from "/dev-server/src/data/seed/users.json";
import props from "/dev-server/src/data/seed/properties.json";
import listings from "/dev-server/src/data/seed/listings.json";
import equipment from "/dev-server/src/data/seed/equipment.json";
import bookings from "/dev-server/src/data/seed/bookings.json";
import reviews from "/dev-server/src/data/seed/reviews.json";
import threads from "/dev-server/src/data/seed/threads.json";
import payouts from "/dev-server/src/data/seed/payouts.json";
import team from "/dev-server/src/data/seed/team.json";
import settings from "/dev-server/src/data/seed/settings.json";
import analytics from "/dev-server/src/data/seed/analytics.json";

const q = (v: unknown) =>
  v === null || v === undefined || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
const n = (v: unknown) => (v === null || v === undefined ? "NULL" : String(v));
const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const out: string[] = [];
const w = (s = "") => out.push(s);

w(`-- =============================================================================
-- Nestara / Roomeasy — demo seed data
-- Generated from src/data/seed/*.json (run AFTER db/schema.sql).
-- Every row below mirrors a JSON record one-for-one. Emails for the demo
-- property hosts are derived from their first name; photo URLs are not seeded
-- because the front-end demo uses bundled image assets, not stored URLs.
-- =============================================================================

BEGIN;
`);

/* ---------- platform settings ---------- */
w(`-- Platform settings (src/data/seed/settings.json)`);
w(`INSERT INTO platform_settings (id, service_fee_rate, tax_rate, commission_rate,
  rate_weekend_percent, rate_long_stay_percent, rate_last_minute_percent)
VALUES (true, ${settings.serviceFeeRate}, ${settings.taxRate}, 12, ${settings.rateRules.weekend}, ${settings.rateRules.longStay}, ${settings.rateRules.lastMinute})
ON CONFLICT (id) DO NOTHING;
`);

w(`-- "Genuse" trusted-guest rule (PROVISIONAL: 5 reservations / 2 years)`);
w(`INSERT INTO trust_badge_rule (code, min_reservations, window_months, requires_verified_account, notes)
VALUES ('genuse', 5, 24, true, 'Provisional rule from client meeting 1; full criteria pending.')
ON CONFLICT (code) DO NOTHING;
`);

/* ---------- accounts ---------- */
w(`-- Accounts (src/data/seed/users.json)`);
for (const u of users as any[]) {
  w(`INSERT INTO app_user (legacy_id, full_name, email, verified, suspended, joined_on)
VALUES (${q(u.id)}, ${q(u.name)}, ${q(u.email)}, ${u.role === "admin" ? "true" : "false"}, ${u.suspended}, ${q(u.joined)});`);
}
w();
w(`-- Role grants (roles never live on the profile row)`);
for (const u of users as any[]) {
  w(`INSERT INTO user_role_grant (user_id, role)
SELECT id, ${q(u.role)}::user_role FROM app_user WHERE legacy_id = ${q(u.id)};`);
}
w();
w(`-- Host profiles for accounts holding the host role`);
for (const u of (users as any[]).filter((x) => x.role === "host")) {
  w(`INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, ${q(u.name)}, ${Number(String(u.joined).slice(0, 4))}, false FROM app_user WHERE legacy_id = ${q(u.id)}
ON CONFLICT (user_id) DO NOTHING;`);
}
w();

/* ---------- demo property hosts ---------- */
const hosts = new Map<string, { name: string; since: number; superhost: boolean }>();
for (const p of props as any[]) if (p.host) hosts.set(p.host.name, p.host);
w(`-- Property hosts referenced by the catalogue (accounts created for the demo)`);
for (const h of hosts.values()) {
  const email = `${slug(h.name)}@nestara.travel`;
  w(`INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES (${q("host-" + slug(h.name))}, ${q(h.name)}, ${q(email)}, true, ${q(h.since + "-01-01")})
ON CONFLICT (email) DO NOTHING;`);
  w(`INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = ${q(email)} ON CONFLICT DO NOTHING;`);
  w(`INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, ${q(h.name)}, ${h.since}, ${h.superhost} FROM app_user WHERE email = ${q(email)}
ON CONFLICT (user_id) DO NOTHING;`);
}
w();

/* ---------- equipment ---------- */
w(`-- Equipment & services catalogue — ${(equipment as any[]).length} rows (client PDF)`);
w(`INSERT INTO equipment (id, "group", label_en, label_fr, paid) VALUES`);
w(
  (equipment as any[])
    .map((e) => `  (${q(e.id)}, ${q(e.group)}, ${q(e.en)}, ${q(e.fr)}, ${e.paid ? "true" : "false"})`)
    .join(",\n") + "\nON CONFLICT (id) DO NOTHING;\n",
);

/* ---------- properties ---------- */
// Amenities are derived in the UI (src/data/properties.ts :: amenitiesFor);
// the same rule is applied here so the database matches what the app shows.
const amenityIds = ["wifi","pool","kitchen","parking","airConditioning","workspace","petFriendly","breakfast"];
function amenitiesFor(p: any, index: number): string[] {
  if (p.amenities?.length) return p.amenities;
  const always = ["wifi", "kitchen"];
  const rest = amenityIds.filter((id) => !always.includes(id));
  const picked = rest.filter((_, position) => ((index + position * 3) % 4) !== 0);
  if (p.category === "resort" && !picked.includes("pool")) picked.push("pool");
  if (p.category === "hotel" && !picked.includes("breakfast")) picked.push("breakfast");
  return [...always, ...picked];
}

w(`-- Properties (src/data/seed/properties.json)`);
for (const [index, p] of (props as any[]).entries()) {
  const parts = String(p.location.en).split(",").map((s: string) => s.trim()).filter(Boolean);
  // City-states such as "Singapore" carry a single part: reuse it as the country.
  const city = parts[0] ?? "";
  const country = parts[1] ?? parts[0] ?? "";
  const hostEmail = p.host ? `${slug(p.host.name)}@nestara.travel` : null;
  w(`INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES (${q(p.id)}, ${hostEmail ? `(SELECT id FROM app_user WHERE email = ${q(hostEmail)})` : "NULL"}, ${q(p.name)}, ${q(p.category)}::property_category,
  ${q(city)}, ${q(country)}, ${q(p.postal)}, ${q(p.neighbourhood)},
  ${n(p.coords?.lat)}, ${n(p.coords?.lng)}, ${p.guests}, ${p.rooms ?? p.beds}, ${p.beds}, ${p.baths}, ${p.area},
  ${p.price}, ${p.rating}, ${p.reviewCount ?? 0});`);
  for (const [locale, label] of Object.entries(p.location)) {
    w(`INSERT INTO property_translation (property_id, locale, location_label) VALUES (${q(p.id)}, ${q(locale)}, ${q(label)});`);
  }
  for (const tag of p.tags ?? []) {
    w(`INSERT INTO property_tag (property_id, tag) VALUES (${q(p.id)}, ${q(tag)});`);
  }
  for (const a of amenitiesFor(p, index)) {
    w(`INSERT INTO property_amenity (property_id, amenity) VALUES (${q(p.id)}, ${q(a)}::amenity_id);`);
  }
  const eq = (p.equipment ?? []) as string[];
  if (eq.length) {
    w(`INSERT INTO property_equipment (property_id, equipment_id) VALUES
${eq.map((id) => `  (${q(p.id)}, ${q(id)})`).join(",\n")};`);
  }
  w();
}

/* ---------- listings ---------- */
w(`-- Host listings (src/data/seed/listings.json)`);
w(`INSERT INTO listing (id, property_id, status, approved, nightly_usd,
  long_stay_enabled, long_stay_threshold, long_stay_discount, mobile_enabled, mobile_discount, published_at) VALUES`);
w(
  (listings as any[])
    .map(
      (l) =>
        `  (${q(l.id)}, ${q(l.propertyId)}, ${q(l.status)}::listing_status, ${l.approved}, ${l.nightlyUsd},
   ${l.longStay.enabled}, ${l.longStay.threshold}, ${l.longStay.discount}, ${l.mobile.enabled}, ${l.mobile.discount}, ${l.status === "published" ? "now()" : "NULL"})`,
    )
    .join(",\n") + ";\n",
);

/* ---------- bookings ---------- */
w(`-- Bookings (src/data/seed/bookings.json). Fees derived from platform_settings:
-- service fee ${settings.serviceFeeRate * 100}% and tax ${settings.taxRate * 100}% of the nightly subtotal.`);
const refundByPolicy: Record<string, number> = { flexible: 100, moderate: 50, strict: 0 };
const brands = ["visa", "mastercard", "amex"] as const;
const propById = new Map((props as any[]).map((p) => [p.id, p]));

for (const [i, b] of (bookings as any[]).entries()) {
  const nightly = +(b.totalUsd / b.nights / (1 + settings.serviceFeeRate + settings.taxRate)).toFixed(2);
  const subtotal = +(nightly * b.nights).toFixed(2);
  const fee = +(subtotal * settings.serviceFeeRate).toFixed(2);
  const tax = +(subtotal * settings.taxRate).toFixed(2);
  const ref = "RE-" + b.id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  w(`INSERT INTO booking (id, reference, property_id, guest_id, guest_name, check_in, check_out, guests, status,
  nightly_usd, base_subtotal, subtotal, service_fee, taxes, total_usd)
VALUES (${q(b.id)}, ${q(ref)}, ${q(b.propertyId)},
  (SELECT id FROM app_user WHERE full_name = ${q(b.guestName)} LIMIT 1),
  ${q(b.guestName)}, ${q(b.from)}, ${q(b.to)}, ${b.guests}, ${q(b.status)}::booking_status,
  ${nightly}, ${subtotal}, ${subtotal}, ${fee}, ${tax}, ${b.totalUsd});`);

  // Payment record (src/models/booking.ts :: PaymentRecord). Pending requests are
  // only authorized; confirmed/completed stays are captured; cancelled ones refunded.
  const status = b.status === "pending" ? "authorized" : b.status === "cancelled" ? "refunded" : "paid";
  if (b.status !== "declined") {
    w(`INSERT INTO payment (booking_id, method, brand, last4, status, amount_usd, reference)
VALUES (${q(b.id)}, 'card', ${q(brands[i % brands.length])}::card_brand, '${String(4242 + i).slice(-4)}',
  ${q(status)}::payment_status, ${b.totalUsd}, ${q("pi_demo_" + b.id)});`);
  }

  // Long-stay discount is applied on stays reaching the listing threshold.
  const listing = (listings as any[]).find((l) => l.propertyId === b.propertyId);
  if (listing?.longStay?.enabled && b.nights >= listing.longStay.threshold) {
    const amount = +((subtotal * listing.longStay.discount) / 100).toFixed(2);
    w(`INSERT INTO booking_discount (booking_id, kind, percent, amount_usd)
VALUES (${q(b.id)}, 'longStay'::discount_kind, ${listing.longStay.discount}, ${amount});`);
  }

  if (b.status === "cancelled") {
    const policy = propById.get(b.propertyId)?.cancellationPolicy ?? "moderate";
    const percent = refundByPolicy[policy] ?? 50;
    w(`INSERT INTO booking_cancellation (booking_id, cancelled_by, cancelled_by_id, policy, refund_percent, refund_usd, reason)
VALUES (${q(b.id)}, 'guest'::actor_role, (SELECT id FROM app_user WHERE full_name = ${q(b.guestName)} LIMIT 1),
  ${q(policy)}::cancellation_policy, ${percent}, ${+((b.totalUsd * percent) / 100).toFixed(2)}, 'Change of plans');`);
  }
}
w();

/* ---------- reviews ---------- */
w(`-- Reviews (src/data/seed/reviews.json)`);
for (const r of reviews as any[]) {
  w(`INSERT INTO review (id, property_id, author_name, rating, body, reply, replied_at, hidden, created_on)
VALUES (${q(r.id)}, ${q(r.propertyId)}, ${q(r.author)}, ${r.rating}, ${q(r.text)}, ${q(r.reply)}, ${r.reply ? "now()" : "NULL"}, ${r.hidden ? "true" : "false"}, ${q(r.date)});`);
}
w();

/* ---------- threads ---------- */
w(`-- Message threads (src/data/seed/threads.json). "me" = the signed-in guest,
-- "them" = the other party; unread messages are the ones with no read_at.`);
for (const t of threads as any[]) {
  w(`INSERT INTO message_thread (id, property_id, with_name) VALUES (${q(t.id)}, ${q(t.propertyId)}, ${q(t.withName)});`);
  const msgs = t.messages as any[];
  const unread = t.unread as number;
  const incoming = msgs.filter((m) => m.from === "them");
  const unreadIds = new Set(unread > 0 ? incoming.slice(-unread).map((m) => m.id) : []);
  msgs.forEach((m, i) => {
    const read = m.from === "me" || !unreadIds.has(m.id);
    w(`INSERT INTO message (legacy_id, thread_id, sender_role, body, sent_at, read_at)
VALUES (${q(m.id)}, ${q(t.id)}, ${m.from === "me" ? "'guest'" : "'host'"}, ${q(m.text)},
  (CURRENT_DATE + time ${q(m.time)}) AT TIME ZONE 'UTC', ${read ? "now()" : "NULL"});`);
  });
  w();
}

/* ---------- payouts ---------- */
// Host names in payouts.json are free text and may differ in accent or surname
// from the profile ("Tomas Alvarez" vs "Tomás"), so match accent-insensitively
// on the full name first and fall back to the first name.
w(`-- Payouts (src/data/seed/payouts.json)`);
for (const p of payouts as any[]) {
  const lookup = `(SELECT user_id FROM host_profile
   WHERE deaccent(display_name) = deaccent(${q(p.hostName)})
      OR split_part(deaccent(display_name), ' ', 1) = split_part(deaccent(${q(p.hostName)}), ' ', 1)
   ORDER BY (deaccent(display_name) = deaccent(${q(p.hostName)})) DESC LIMIT 1)`;
  w(`INSERT INTO payout (id, host_id, host_name, amount_usd, status, payout_date)
VALUES (${q(p.id)}, ${lookup},
  ${q(p.hostName)}, ${p.amountUsd}, ${q(p.status)}::payout_status, ${q(p.date)});`);
}
w();

/* ---------- team ---------- */
w(`-- Host team members (src/data/seed/team.json), attached to the first demo host account`);
for (const m of team as any[]) {
  w(`INSERT INTO host_team_member (id, host_id, full_name, email, scopes)
SELECT ${q(m.id)}, hp.user_id, ${q(m.name)}, ${q(m.email)}, ARRAY[${(m.scopes as string[]).map((s) => `'${s}'`).join(", ")}]::team_scope[]
  FROM host_profile hp JOIN app_user u ON u.id = hp.user_id
 WHERE u.legacy_id = 'u-1' LIMIT 1;`);
}
w();

/* ---------- analytics ---------- */
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
w(`-- Monthly booking stats (src/data/seed/analytics.json) — platform-wide (host_id NULL)`);
w(`INSERT INTO booking_monthly_stat (host_id, year, month, bookings) VALUES`);
w(
  (analytics.monthlyBookings as any[])
    .map((m) => `  (NULL, 2026, ${months.indexOf(m.month) + 1}, ${m.value})`)
    .join(",\n") + ";\n",
);

/* ---------- calendar ---------- */
// Host calendar sample: two blocked nights and two custom-priced nights
// (src/data/platform.ts :: CalendarMap) on the first demo listing.
w(`-- Availability calendar sample (src/data/platform.ts :: CalendarMap)`);
const calProperty = (props as any[])[0].id;
w(`INSERT INTO calendar_night (property_id, night, blocked, price_usd) VALUES
  (${q(calProperty)}, CURRENT_DATE + 10, true, NULL),
  (${q(calProperty)}, CURRENT_DATE + 11, true, NULL),
  (${q(calProperty)}, CURRENT_DATE + 20, false, ${(props as any[])[0].price + 40}),
  (${q(calProperty)}, CURRENT_DATE + 21, false, ${(props as any[])[0].price + 40})
ON CONFLICT (property_id, night) DO NOTHING;
`);

/* ---------- wizard submissions ---------- */
// One archived payload per published listing, exactly the JSON the host wizard
// sends (src/models/listing.ts :: ListingDraft).
w(`-- Listing submissions — the wizard payload stored verbatim (ListingDraft JSON)`);
for (const l of listings as any[]) {
  const p = propById.get(l.propertyId);
  if (!p) continue;
  const parts = String(p.location.en).split(",").map((s: string) => s.trim()).filter(Boolean);
  const draft = {
    propertyId: p.id,
    listingId: l.id,
    title: p.name,
    category: p.category,
    summary: p.summary ?? "",
    description: p.description ?? "",
    location: {
      city: parts[0] ?? "",
      country: parts[1] ?? parts[0] ?? "",
      postal: p.postal ?? "",
      neighbourhood: p.neighbourhood ?? "",
    },
    capacity: { guests: p.guests, rooms: p.rooms ?? p.beds, beds: p.beds, baths: p.baths, area: p.area },
    amenities: amenitiesFor(p, (props as any[]).indexOf(p)),
    equipment: p.equipment ?? [],
    photos: [],
    pricing: {
      nightlyUsd: l.nightlyUsd,
      cleaningFeeUsd: p.cleaningFee ?? 0,
      minNights: p.minNights ?? 1,
      longStay: l.longStay,
      mobile: l.mobile,
    },
    policies: {
      cancellationPolicy: p.cancellationPolicy ?? "moderate",
      houseRules: p.houseRules ?? "",
      checkIn: p.checkIn ?? "15:00",
      checkOut: p.checkOut ?? "11:00",
      instantBook: p.instantBook ?? false,
    },
    status: l.status,
  };
  w(`INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT ${q(l.id)}, ${q(l.propertyId)}, pr.host_id, ${q(l.status)}::listing_status, ${q(JSON.stringify(draft))}::jsonb
  FROM property pr WHERE pr.id = ${q(l.propertyId)};`);
}
w();

/* ---------- payout items ---------- */
w(`-- Payout lines: completed stays settled in the first payout`);
for (const b of (bookings as any[]).filter((x) => x.status === "completed")) {
  w(`INSERT INTO payout_item (payout_id, booking_id, amount_usd) VALUES ('po-1', ${q(b.id)}, ${b.totalUsd});`);
}
w();

/* ---------- favourites ---------- */
w(`-- Favourites (src/routes/favourites.tsx) — demo guest saves two places`);
for (const pid of (props as any[]).slice(0, 2).map((p) => p.id)) {
  w(`INSERT INTO favorite (user_id, property_id)
SELECT id, ${q(pid)} FROM app_user WHERE legacy_id = 'u-2' ON CONFLICT DO NOTHING;`);
}
w();

/* ---------- cookie consent ---------- */
w(`-- Cookie banner choices (src/hooks/usePlatform.ts :: cookiesChoice)`);
w(`INSERT INTO cookie_consent (user_id, choice)
SELECT id, 'accepted'::cookie_choice FROM app_user WHERE legacy_id = 'u-2';`);
w(`INSERT INTO cookie_consent (device_id, choice) VALUES ('device-demo-1', 'essential'::cookie_choice);`);
w();

/* ---------- moderation log ---------- */
w(`-- Admin moderation trail (src/routes/admin.tsx): suspended user + hidden review`);
w(`INSERT INTO moderation_log (admin_id, action, target_kind, target_id, reason)
SELECT id, 'user_suspended'::moderation_action, 'user', 'u-4', 'Repeated policy breaches'
  FROM app_user WHERE legacy_id = 'u-5';`);
for (const r of (reviews as any[]).filter((x) => x.hidden)) {
  w(`INSERT INTO moderation_log (admin_id, action, target_kind, target_id, reason)
SELECT id, 'review_hidden'::moderation_action, 'review', ${q(r.id)}, 'Offensive language'
  FROM app_user WHERE legacy_id = 'u-5';`);
}
w();

/* ---------- per-host rate rules ---------- */
w(`-- Per-host override of the global rate rules (host dashboard)`);
w(`INSERT INTO host_rate_rules (host_id, weekend_percent, long_stay_percent, last_minute_percent)
SELECT hp.user_id, ${settings.rateRules.weekend}, ${settings.rateRules.longStay}, ${settings.rateRules.lastMinute}
  FROM host_profile hp JOIN app_user u ON u.id = hp.user_id WHERE u.legacy_id = 'u-1'
ON CONFLICT (host_id) DO NOTHING;`);
w();

/* ---------- exchange rates ---------- */
w(`-- FX fallback rates (src/routes/api/public/exchange-rates.ts)`);
w(`INSERT INTO exchange_rate (base_currency, quote_currency, rate) VALUES
  ('USD', 'USD', 1),
  ('USD', 'EUR', 0.92),
  ('USD', 'GBP', 0.79),
  ('USD', 'CHF', 0.88),
  ('USD', 'BRL', 5.4)
ON CONFLICT (base_currency, quote_currency) DO UPDATE SET rate = EXCLUDED.rate;
`);

w(`COMMIT;`);

await Bun.write("/dev-server/db/seed.sql", out.join("\n"));
console.log("rows written", out.length);
