-- =============================================================================
-- Nestara / Roomeasy — demo seed data
-- Generated from src/data/seed/*.json (run AFTER db/schema.sql).
-- Every row below mirrors a JSON record one-for-one. Emails for the demo
-- property hosts are derived from their first name; photo URLs are not seeded
-- because the front-end demo uses bundled image assets, not stored URLs.
-- =============================================================================

BEGIN;

-- Platform settings (src/data/seed/settings.json)
INSERT INTO platform_settings (id, service_fee_rate, tax_rate, commission_rate,
  rate_weekend_percent, rate_long_stay_percent, rate_last_minute_percent)
VALUES (true, 0.08, 0.05, 12, 15, 10, 5)
ON CONFLICT (id) DO NOTHING;

-- "Genuse" trusted-guest rule (PROVISIONAL: 5 reservations / 2 years)
INSERT INTO trust_badge_rule (code, min_reservations, window_months, requires_verified_account, notes)
VALUES ('genuse', 5, 24, true, 'Provisional rule from client meeting 1; full criteria pending.')
ON CONFLICT (code) DO NOTHING;

-- Accounts (src/data/seed/users.json)
INSERT INTO app_user (legacy_id, full_name, email, verified, suspended, joined_on)
VALUES ('u-1', 'Maya Lindqvist', 'maya@nestara.travel', false, false, '2025-02-11');
INSERT INTO app_user (legacy_id, full_name, email, verified, suspended, joined_on)
VALUES ('u-2', 'Clara Mercier', 'clara@example.com', false, false, '2025-06-02');
INSERT INTO app_user (legacy_id, full_name, email, verified, suspended, joined_on)
VALUES ('u-3', 'Jonas Weber', 'jonas@example.com', false, false, '2025-08-19');
INSERT INTO app_user (legacy_id, full_name, email, verified, suspended, joined_on)
VALUES ('u-4', 'Ana Ferreira', 'ana@example.com', false, true, '2024-11-30');
INSERT INTO app_user (legacy_id, full_name, email, verified, suspended, joined_on)
VALUES ('u-5', 'Sofia Marchetti', 'sofia@nestara.travel', true, false, '2024-01-08');

-- Role grants (roles never live on the profile row)
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host'::user_role FROM app_user WHERE legacy_id = 'u-1';
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'guest'::user_role FROM app_user WHERE legacy_id = 'u-2';
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'guest'::user_role FROM app_user WHERE legacy_id = 'u-3';
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host'::user_role FROM app_user WHERE legacy_id = 'u-4';
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'admin'::user_role FROM app_user WHERE legacy_id = 'u-5';

-- Host profiles for accounts holding the host role
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Maya Lindqvist', 2025, false FROM app_user WHERE legacy_id = 'u-1'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Ana Ferreira', 2024, false FROM app_user WHERE legacy_id = 'u-4'
ON CONFLICT (user_id) DO NOTHING;

-- Property hosts referenced by the catalogue (accounts created for the demo)
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-amelia', 'Amelia', 'amelia@nestara.travel', true, '2019-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'amelia@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Amelia', 2019, true FROM app_user WHERE email = 'amelia@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-mateo', 'Mateo', 'mateo@nestara.travel', true, '2018-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'mateo@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Mateo', 2018, true FROM app_user WHERE email = 'mateo@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-claire', 'Claire', 'claire@nestara.travel', true, '2017-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'claire@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Claire', 2017, false FROM app_user WHERE email = 'claire@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-diego', 'Diego', 'diego@nestara.travel', true, '2020-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'diego@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Diego', 2020, true FROM app_user WHERE email = 'diego@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-sari', 'Sari', 'sari@nestara.travel', true, '2021-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'sari@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Sari', 2021, false FROM app_user WHERE email = 'sari@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-tomas', 'Tomás', 'tomas@nestara.travel', true, '2016-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'tomas@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Tomás', 2016, true FROM app_user WHERE email = 'tomas@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-nuria', 'Nuria', 'nuria@nestara.travel', true, '2019-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'nuria@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Nuria', 2019, false FROM app_user WHERE email = 'nuria@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-hannah', 'Hannah', 'hannah@nestara.travel', true, '2018-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'hannah@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Hannah', 2018, true FROM app_user WHERE email = 'hannah@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-giulia', 'Giulia', 'giulia@nestara.travel', true, '2015-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'giulia@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Giulia', 2015, false FROM app_user WHERE email = 'giulia@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-layla', 'Layla', 'layla@nestara.travel', true, '2020-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'layla@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Layla', 2020, true FROM app_user WHERE email = 'layla@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-freja', 'Freja', 'freja@nestara.travel', true, '2019-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'freja@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Freja', 2019, false FROM app_user WHERE email = 'freja@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-nikos', 'Nikos', 'nikos@nestara.travel', true, '2017-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'nikos@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Nikos', 2017, true FROM app_user WHERE email = 'nikos@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-haruto', 'Haruto', 'haruto@nestara.travel', true, '2018-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'haruto@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Haruto', 2018, true FROM app_user WHERE email = 'haruto@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-oliver', 'Oliver', 'oliver@nestara.travel', true, '2016-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'oliver@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Oliver', 2016, false FROM app_user WHERE email = 'oliver@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-camila', 'Camila', 'camila@nestara.travel', true, '2019-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'camila@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Camila', 2019, true FROM app_user WHERE email = 'camila@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-ingrid', 'Ingrid', 'ingrid@nestara.travel', true, '2020-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'ingrid@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Ingrid', 2020, false FROM app_user WHERE email = 'ingrid@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-jonas', 'Jonas', 'jonas@nestara.travel', true, '2018-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'jonas@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Jonas', 2018, false FROM app_user WHERE email = 'jonas@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-ines', 'Inês', 'ines@nestara.travel', true, '2017-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'ines@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Inês', 2017, true FROM app_user WHERE email = 'ines@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-thandi', 'Thandi', 'thandi@nestara.travel', true, '2019-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'thandi@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Thandi', 2019, true FROM app_user WHERE email = 'thandi@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-wei', 'Wei', 'wei@nestara.travel', true, '2016-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'wei@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Wei', 2016, false FROM app_user WHERE email = 'wei@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-elif', 'Elif', 'elif@nestara.travel', true, '2020-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'elif@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Elif', 2020, false FROM app_user WHERE email = 'elif@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-callum', 'Callum', 'callum@nestara.travel', true, '2018-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'callum@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Callum', 2018, true FROM app_user WHERE email = 'callum@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-grace', 'Grace', 'grace@nestara.travel', true, '2019-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'grace@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Grace', 2019, true FROM app_user WHERE email = 'grace@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO app_user (legacy_id, full_name, email, verified, joined_on)
VALUES ('host-eleni', 'Eleni', 'eleni@nestara.travel', true, '2015-01-01')
ON CONFLICT (email) DO NOTHING;
INSERT INTO user_role_grant (user_id, role)
SELECT id, 'host' FROM app_user WHERE email = 'eleni@nestara.travel' ON CONFLICT DO NOTHING;
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Eleni', 2015, true FROM app_user WHERE email = 'eleni@nestara.travel'
ON CONFLICT (user_id) DO NOTHING;

-- Equipment & services catalogue — 196 rows (client PDF)
INSERT INTO equipment (id, "group", label_en, label_fr, paid) VALUES
  ('swimming-pool', 'general', 'Swimming pool', 'Piscine', false),
  ('children-s-pool', 'general', 'Children''s pool', 'Piscine pour enfants', false),
  ('garden', 'general', 'Garden', 'Jardin', false),
  ('terrace', 'general', 'Terrace', 'Terrasse', false),
  ('sun-terrace', 'general', 'Sun terrace', 'Terrasse bien exposée', false),
  ('non-smoking-rooms', 'general', 'Non-smoking rooms', 'Chambres non-fumeurs', false),
  ('family-rooms', 'general', 'Family rooms', 'Chambres familiales', false),
  ('air-conditioning', 'general', 'Air conditioning', 'Climatisation', false),
  ('heating', 'general', 'Heating', 'Chauffage', false),
  ('lift', 'general', 'Lift', 'Ascenseur', false),
  ('soundproof-rooms', 'general', 'Soundproof rooms', 'Chambres insonorisées', false),
  ('allergy-free-rooms', 'general', 'Allergy-free rooms', 'Chambres anti-allergie', false),
  ('entirely-non-smoking-property', 'general', 'Entirely non-smoking property', 'Établissement entièrement non-fumeurs', false),
  ('designated-smoking-area', 'general', 'Designated smoking area', 'Espace fumeurs', false),
  ('adults-only', 'general', 'Adults only', 'Réservé aux adultes', false),
  ('outdoor-furniture', 'general', 'Outdoor furniture', 'Mobilier extérieur', false),
  ('picnic-area', 'general', 'Picnic area', 'Aire de pique-nique', false),
  ('indoor-fireplace', 'general', 'Indoor fireplace', 'Cheminée intérieure', false),
  ('outdoor-fireplace', 'general', 'Outdoor fireplace', 'Cheminée extérieure', false),
  ('shared-kitchen', 'general', 'Shared kitchen', 'Cuisine commune', false),
  ('shared-lounge-tv-area', 'general', 'Shared lounge / TV area', 'Salon commun/salle de télévision', false),
  ('sun-loungers-or-beach-chairs', 'general', 'Sun loungers or beach chairs', 'Chaises longues ou de plage', false),
  ('sun-umbrellas', 'general', 'Sun umbrellas', 'Parasols', false),
  ('water-slide', 'general', 'Water slide', 'Toboggan aquatique', false),
  ('beach', 'general', 'Beach', 'Plage', false),
  ('safe', 'general', 'Safe', 'Coffre-fort', false),
  ('sauna', 'wellness', 'Sauna', 'Sauna', false),
  ('turkish-bath-hammam', 'wellness', 'Turkish bath / hammam', 'Hammam', false),
  ('hot-tub-jacuzzi', 'wellness', 'Hot tub / jacuzzi', 'Bain à remous/jacuzzi', false),
  ('steam-room', 'wellness', 'Steam room', 'Bain à vapeur', false),
  ('spa', 'wellness', 'Spa', 'Spa', false),
  ('spa-and-wellness-centre', 'wellness', 'Spa and wellness centre', 'Spa et centre de bien-être', false),
  ('spa-relaxation-area', 'wellness', 'Spa / relaxation area', 'Coin spa/relaxation', false),
  ('foot-bath', 'wellness', 'Foot bath', 'Bain de pieds', false),
  ('spa-wellness-packages', 'wellness', 'Spa / wellness packages', 'Forfaits spa/bien-être', false),
  ('massage-chair', 'wellness', 'Massage chair', 'Fauteuil massant', false),
  ('massages', 'wellness', 'Massages', 'Massages', false),
  ('beauty-services', 'wellness', 'Beauty services', 'Services beauté', false),
  ('hair-or-beauty-salon', 'wellness', 'Hair or beauty salon', 'Salon de coiffure/institut de beauté', false),
  ('solarium', 'wellness', 'Solarium', 'Solarium', false),
  ('thermal-bath-onsen', 'wellness', 'Thermal bath / onsen', 'Bain thermal/onsen', false),
  ('open-air-bath', 'wellness', 'Open-air bath', 'Bain en plein air', false),
  ('public-bath', 'wellness', 'Public bath', 'Bain public', false),
  ('fitness', 'wellness', 'Fitness', 'Fitness', false),
  ('fitness-centre', 'wellness', 'Fitness centre', 'Centre de remise en forme', false),
  ('fitness-classes', 'wellness', 'Fitness classes', 'Cours de fitness', false),
  ('yoga-classes', 'wellness', 'Yoga classes', 'Cours de yoga', false),
  ('personal-trainer', 'wellness', 'Personal trainer', 'Coach sportif personnel', false),
  ('gym-spa-changing-rooms', 'wellness', 'Gym / spa changing rooms', 'Vestiaires salle de sport/spa', false),
  ('breakfast', 'food', 'Breakfast', 'Petit-déjeuner', true),
  ('lunch', 'food', 'Lunch', 'Déjeuner', true),
  ('dinner', 'food', 'Dinner', 'Dîner', true),
  ('bar', 'food', 'Bar', 'Bar', false),
  ('snack-bar', 'food', 'Snack bar', 'Snack-bar', false),
  ('coffee-shop-on-site', 'food', 'Coffee shop on site', 'Café sur place', false),
  ('restaurant', 'food', 'Restaurant', 'Restaurant', false),
  ('breakfast-in-the-room', 'food', 'Breakfast in the room', 'Petit-déjeuner en chambre', false),
  ('room-service', 'food', 'Room service', 'Service d''étage', false),
  ('kids-meals', 'food', 'Kids'' meals', 'Menus enfants', false),
  ('buffet-with-kids-options', 'food', 'Buffet with kids'' options', 'Buffet avec options enfants', false),
  ('special-diet-menus-on-request', 'food', 'Special diet menus (on request)', 'Menus pour régimes spéciaux (sur demande)', false),
  ('wine-or-champagne', 'food', 'Wine or champagne', 'Vin/champagne', true),
  ('fruit', 'food', 'Fruit', 'Fruits', true),
  ('grocery-delivery', 'food', 'Grocery delivery', 'Livraison de courses', false),
  ('packed-lunches', 'food', 'Packed lunches', 'Paniers-repas', false),
  ('bbq-facilities', 'food', 'BBQ facilities', 'Installations pour barbecue', false),
  ('vending-machine-drinks', 'food', 'Vending machine (drinks)', 'Distributeur automatique (boissons)', false),
  ('vending-machine-snacks', 'food', 'Vending machine (snacks)', 'Distributeur automatique (collations)', false),
  ('meal-delivery-to-the-accommodation', 'food', 'Meal delivery to the accommodation', 'Livraison de repas possible dans l''hébergement', false),
  ('takeaway-breakfast-containers', 'food', 'Takeaway breakfast containers', 'Récipients pour petit-déjeuner à emporter', false),
  ('tennis-equipment', 'activities', 'Tennis equipment', 'Matériel de tennis', false),
  ('tennis-court', 'activities', 'Tennis court', 'Court de tennis', false),
  ('badminton-equipment', 'activities', 'Badminton equipment', 'Matériel de badminton', false),
  ('billiards', 'activities', 'Billiards', 'Billard', false),
  ('table-tennis', 'activities', 'Table tennis', 'Tennis de table', false),
  ('darts', 'activities', 'Darts', 'Fléchettes', false),
  ('squash', 'activities', 'Squash', 'Squash', false),
  ('bowling', 'activities', 'Bowling', 'Bowling', false),
  ('mini-golf', 'activities', 'Mini golf', 'Minigolf', false),
  ('golf-course-within-3-km', 'activities', 'Golf course (within 3 km)', 'Parcours de golf (à moins de 3 km)', false),
  ('archery', 'activities', 'Archery', 'Tir à l''arc', false),
  ('aerobics', 'activities', 'Aerobics', 'Aérobic', false),
  ('bingo', 'activities', 'Bingo', 'Bingo', false),
  ('karaoke', 'activities', 'Karaoke', 'Karaoké', false),
  ('water-park', 'activities', 'Water park', 'Parc aquatique', false),
  ('water-sports-facilities-on-site', 'activities', 'Water sports facilities on site', 'Installations de sports nautiques sur place', false),
  ('windsurfing', 'activities', 'Windsurfing', 'Planche à voile', false),
  ('diving', 'activities', 'Diving', 'Plongée sous-marine', false),
  ('snorkelling', 'activities', 'Snorkelling', 'Plongée avec tuba', false),
  ('canoeing', 'activities', 'Canoeing', 'Canoë-kayak', false),
  ('fishing', 'activities', 'Fishing', 'Pêche', false),
  ('horse-riding', 'activities', 'Horse riding', 'Équitation', false),
  ('cycling', 'activities', 'Cycling', 'Cyclisme', false),
  ('hiking', 'activities', 'Hiking', 'Randonnée', false),
  ('skiing', 'activities', 'Skiing', 'Ski', false),
  ('walking-tours', 'activities', 'Walking tours', 'Balades à pied', false),
  ('bike-tours', 'activities', 'Bike tours', 'Visites à vélo', false),
  ('temporary-art-galleries', 'activities', 'Temporary art galleries', 'Galeries d''art temporaires', false),
  ('bar-crawls', 'activities', 'Bar crawls', 'Tournées des bars', false),
  ('stand-up-comedy', 'activities', 'Stand-up comedy', 'Spectacles d''humoristes', false),
  ('movie-nights', 'activities', 'Movie nights', 'Soirées film', false),
  ('themed-dinner-nights', 'activities', 'Themed dinner nights', 'Dîners à thème', false),
  ('happy-hour', 'activities', 'Happy hour', 'Happy hour', false),
  ('local-culture-tour-or-class', 'activities', 'Local culture tour or class', 'Visite ou cours autour de la culture locale', false),
  ('cooking-class', 'activities', 'Cooking class', 'Cours de cuisine', false),
  ('live-music-performances', 'activities', 'Live music / performances', 'Concerts/Spectacles', false),
  ('live-sport-events-screening', 'activities', 'Live sport events screening', 'Diffusion d''événements sportifs', false),
  ('evening-entertainment', 'activities', 'Evening entertainment', 'Animations en soirée', false),
  ('nightclub-dj', 'activities', 'Nightclub / DJ', 'Discothèque/DJ', false),
  ('casino', 'activities', 'Casino', 'Casino', false),
  ('entertainment-team', 'activities', 'Entertainment team', 'Équipe d''animation', false),
  ('games-room', 'activities', 'Games room', 'Salle de jeux', false),
  ('chapel-shrine', 'general', 'Chapel / place of worship', 'Chapelle/lieu de culte', false),
  ('board-games-puzzles', 'activities', 'Board games / puzzles', 'Jeux de société/puzzles', false),
  ('parking', 'transport', 'Parking', 'Parking', false),
  ('bicycle-parking', 'transport', 'Bicycle parking', 'Parking à vélos', false),
  ('bicycle-rental', 'transport', 'Bicycle rental', 'Location de vélos', false),
  ('car-rental', 'transport', 'Car rental', 'Location de voitures', false),
  ('airport-shuttle', 'transport', 'Airport shuttle', 'Navette aéroport', true),
  ('shuttle-service', 'transport', 'Shuttle service', 'Service de navette', true),
  ('public-transport-tickets', 'transport', 'Public transport tickets', 'Tickets de transports en commun', true),
  ('24-hour-front-desk', 'services', '24-hour front desk', 'Réception ouverte 24h/24', false),
  ('private-check-in-check-out', 'services', 'Private check-in / check-out', 'Enregistrement/départ privé', false),
  ('express-check-in-check-out', 'services', 'Express check-in / check-out', 'Enregistrement/règlement rapide', false),
  ('concierge-service', 'services', 'Concierge service', 'Service de concierge', false),
  ('tour-desk', 'services', 'Tour desk', 'Bureau d''excursions', false),
  ('currency-exchange', 'services', 'Currency exchange', 'Service de change', false),
  ('atm-on-site', 'services', 'ATM on site', 'Distributeur automatique de billets sur place', false),
  ('luggage-storage', 'services', 'Luggage storage', 'Bagagerie', false),
  ('lockers', 'services', 'Lockers', 'Casiers', false),
  ('invoice-provided-on-request', 'services', 'Invoice provided on request', 'Facture fournie sur demande', false),
  ('dry-cleaning', 'services', 'Dry cleaning', 'Nettoyage à sec', true),
  ('ironing-service', 'services', 'Ironing service', 'Service de repassage', true),
  ('laundry', 'services', 'Laundry', 'Blanchisserie/laverie', true),
  ('daily-housekeeping', 'services', 'Daily housekeeping', 'Service de ménage quotidien', false),
  ('trouser-press', 'services', 'Trouser press', 'Presse à pantalons', false),
  ('meeting-banquet-facilities', 'services', 'Meeting / banquet facilities', 'Salles de réunion/réception', false),
  ('business-centre', 'services', 'Business centre', 'Centre d''affaires', false),
  ('fax-photocopying', 'services', 'Fax / photocopying', 'Fax/photocopies', false),
  ('mini-market-on-site', 'services', 'Mini-market on site', 'Supérette sur place', false),
  ('cashless-payment-available', 'services', 'Cashless payment available', 'Paiement sans espèces disponible', false),
  ('mobile-app-for-room-service', 'services', 'Mobile app for room service', 'Application mobile pour utiliser le service d''étage', false),
  ('kids-club', 'family', 'Kids'' club', 'Club pour enfants', false),
  ('children-s-playground', 'family', 'Children''s playground', 'Aire de jeux pour enfants', false),
  ('indoor-play-area', 'family', 'Indoor play area', 'Aire de jeux intérieure', false),
  ('outdoor-play-equipment', 'family', 'Outdoor play equipment', 'Jeux de plein air pour enfants', false),
  ('babysitting-child-services', 'family', 'Babysitting / child services', 'Garde d''enfants', true),
  ('baby-safety-gates', 'family', 'Baby safety gates', 'Barrières de sécurité pour bébés', false),
  ('strollers', 'family', 'Strollers', 'Poussettes', false),
  ('pet-basket', 'family', 'Pet basket', 'Panier pour animal de compagnie', false),
  ('pet-bowls', 'family', 'Pet bowls', 'Gamelles pour animaux de compagnie', false),
  ('24-hour-security', 'safety', '24-hour security', 'Sécurité 24h/24', false),
  ('security-alarm', 'safety', 'Security alarm', 'Alarme de sécurité', false),
  ('smoke-alarms', 'safety', 'Smoke alarms', 'Détecteurs de fumée', false),
  ('carbon-monoxide-detector', 'safety', 'Carbon monoxide detector', 'Détecteur de monoxyde de carbone', false),
  ('carbon-monoxide-sources', 'safety', 'Carbon monoxide sources', 'Sources de monoxyde de carbone', false),
  ('fire-extinguishers', 'safety', 'Fire extinguishers', 'Extincteurs', false),
  ('cctv-in-common-areas', 'safety', 'CCTV in common areas', 'Caméras de surveillance dans les parties communes', false),
  ('cctv-outside-the-property', 'safety', 'CCTV outside the property', 'Caméras de surveillance à l''extérieur de l''établissement', false),
  ('facilities-for-disabled-guests', 'safety', 'Facilities for disabled guests', 'Équipements pour les personnes handicapées', false),
  ('first-aid-kit-available', 'safety', 'First aid kit available', 'Trousse de secours disponible', false),
  ('health-professionals-available', 'safety', 'Health professionals available', 'Professionnels de santé disponibles', false),
  ('thermometers-provided-to-guests', 'safety', 'Thermometers provided to guests', 'Thermomètres fournis aux clients par l''établissement', false),
  ('face-masks-available-for-guests', 'safety', 'Face masks available for guests', 'Masques à disposition des clients', false),
  ('hand-sanitiser-in-the-accommodation-and-common-areas', 'safety', 'Hand sanitiser in the accommodation and common areas', 'Gel hydroalcoolique dans l''hébergement et les pièces fréquentées', false),
  ('physical-distancing-rules-followed', 'safety', 'Physical distancing rules followed', 'Respect des règles de distanciation physique', false),
  ('physical-barriers-or-screens-between-staff-and-guests', 'safety', 'Physical barriers or screens between staff and guests', 'Barrières physiques ou écrans placés entre le personnel et les clients', false),
  ('staff-follow-local-authority-safety-protocols', 'safety', 'Staff follow local authority safety protocols', 'Le personnel respecte les protocoles de sécurité établis par les autorités locales', false),
  ('physical-distancing-in-dining-areas', 'safety', 'Physical distancing in dining areas', 'Distanciation physique dans les espaces repas', false),
  ('accommodation-disinfected-between-stays', 'cleaning', 'Accommodation disinfected between stays', 'Hébergement désinfecté après chaque séjour', false),
  ('accommodation-sealed-after-cleaning', 'cleaning', 'Accommodation sealed after cleaning', 'Hébergement fermé après le nettoyage', false),
  ('cleaning-by-professional-cleaning-companies', 'cleaning', 'Cleaning by professional cleaning companies', 'Le ménage est effectué par des sociétés de nettoyage professionnelles', false),
  ('linen-and-towels-washed-per-local-guidelines', 'cleaning', 'Linen and towels washed per local guidelines', 'Serviettes et linge de lit lavés selon les recommandations locales', false),
  ('guests-can-opt-out-of-cleaning-during-the-stay', 'cleaning', 'Guests can opt out of cleaning during the stay', 'Les clients peuvent refuser le service de nettoyage pendant leur séjour', false),
  ('tableware-and-cutlery-disinfected', 'cleaning', 'Tableware and cutlery disinfected', 'Vaisselle et couverts désinfectés', false),
  ('delivered-food-sealed', 'cleaning', 'Delivered food sealed', 'Protection hermétique des plats livrés', false),
  ('use-of-cleaning-products-effective-against-coronavirus', 'cleaning', 'Use of cleaning products effective against coronavirus', 'Utilisation de produits d''entretien efficaces contre le coronavirus', false),
  ('shared-items-such-as-menus-magazines-and-pens-removed', 'cleaning', 'Shared items such as menus, magazines and pens removed', 'Les accessoires partagés (menus, magazines, stylos) ont été retirés', false),
  ('contactless-check-in-check-out', 'access', 'Contactless check-in / check-out', 'Enregistrement et départ sans contact', false),
  ('check-in-kiosk-in-the-lobby', 'access', 'Check-in kiosk in the lobby', 'Borne d''enregistrement disponible dans le hall d''entrée', false),
  ('keys-in-a-key-box-at-the-property', 'access', 'Keys in a key box at the property', 'Clés disponibles dans une boîte à clés dans l''établissement', false),
  ('keys-in-a-key-box-nearby', 'access', 'Keys in a key box nearby', 'Clés disponibles dans une boîte à clés à proximité', false),
  ('unlock-the-accommodation-with-a-phone-via-bluetooth', 'access', 'Unlock the accommodation with a phone via Bluetooth', 'Ouverture du logement avec un smartphone par Bluetooth', false),
  ('unlock-the-accommodation-with-a-phone-via-the-internet', 'access', 'Unlock the accommodation with a phone via the internet', 'Ouverture du logement avec un smartphone via Internet', false),
  ('unlock-the-accommodation-with-a-private-code', 'access', 'Unlock the accommodation with a private code', 'Ouverture du logement avec un code confidentiel', false),
  ('unlock-the-accommodation-by-scanning-a-qr-code', 'access', 'Unlock the accommodation by scanning a QR code', 'Ouverture du logement en scannant un code QR', false),
  ('unlock-the-accommodation-via-an-app', 'access', 'Unlock the accommodation via an app', 'Ouverture du logement via une application', false),
  ('access-the-property-via-bluetooth', 'access', 'Access the property via Bluetooth', 'Accès à l''établissement par Bluetooth', false),
  ('access-the-property-via-the-internet', 'access', 'Access the property via the internet', 'Accès à l''établissement via Internet', false),
  ('access-with-a-private-code', 'access', 'Access with a private code', 'Accès avec un code confidentiel', false),
  ('access-by-scanning-a-qr-code', 'access', 'Access by scanning a QR code', 'Accès en scannant un code QR', false),
  ('access-via-a-downloadable-app', 'access', 'Access via a downloadable app', 'Accès via une application à télécharger', false),
  ('access-keys', 'access', 'Access keys', 'Clés d''accès', false),
  ('access-cards', 'access', 'Access cards', 'Cartes d''accès', false),
  ('guest-id-details-collected-online-before-the-stay', 'access', 'Guest ID details collected online before the stay', 'Informations d''identité collectées en ligne avant le séjour', false),
  ('guest-health-screening', 'access', 'Guest health screening', 'Contrôle de l''état de santé des clients', false)
ON CONFLICT (id) DO NOTHING;

-- Properties (src/data/seed/properties.json)
INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('hidden-quill-haven', (SELECT id FROM app_user WHERE email = 'amelia@nestara.travel'), 'Hidden Quill Haven', 'apartment'::property_category,
  'New York', 'USA', '10011', NULL,
  40.7128, -74.006, 4, 2, 2, 2, 1500,
  246, 4.9, 128);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('hidden-quill-haven', 'en', 'New York, USA');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('hidden-quill-haven', 'fr', 'New York, États-Unis');
INSERT INTO property_tag (property_id, tag) VALUES ('hidden-quill-haven', 'City centre');
INSERT INTO property_tag (property_id, tag) VALUES ('hidden-quill-haven', 'Self check-in');
INSERT INTO property_amenity (property_id, amenity) VALUES ('hidden-quill-haven', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('hidden-quill-haven', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('hidden-quill-haven', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('hidden-quill-haven', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('hidden-quill-haven', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('hidden-quill-haven', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('hidden-quill-haven', 'air-conditioning'),
  ('hidden-quill-haven', 'garden'),
  ('hidden-quill-haven', 'heating'),
  ('hidden-quill-haven', 'lift'),
  ('hidden-quill-haven', 'non-smoking-rooms'),
  ('hidden-quill-haven', 'parking'),
  ('hidden-quill-haven', 'safe'),
  ('hidden-quill-haven', 'shared-kitchen'),
  ('hidden-quill-haven', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('coastal-haven-lodge', (SELECT id FROM app_user WHERE email = 'mateo@nestara.travel'), 'Coastal Haven Lodge', 'lodge'::property_category,
  'Andalusia', 'Spain', '29601', NULL,
  36.7213, -4.4214, 5, 3, 3, 2, 1600,
  299, 4.8, 96);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('coastal-haven-lodge', 'en', 'Andalusia, Spain');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('coastal-haven-lodge', 'fr', 'Andalousie, Espagne');
INSERT INTO property_tag (property_id, tag) VALUES ('coastal-haven-lodge', 'Sea view');
INSERT INTO property_tag (property_id, tag) VALUES ('coastal-haven-lodge', 'Pool');
INSERT INTO property_amenity (property_id, amenity) VALUES ('coastal-haven-lodge', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('coastal-haven-lodge', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('coastal-haven-lodge', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('coastal-haven-lodge', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('coastal-haven-lodge', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('coastal-haven-lodge', 'petFriendly'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('coastal-haven-lodge', 'air-conditioning'),
  ('coastal-haven-lodge', 'bbq-facilities'),
  ('coastal-haven-lodge', 'family-rooms'),
  ('coastal-haven-lodge', 'garden'),
  ('coastal-haven-lodge', 'hiking'),
  ('coastal-haven-lodge', 'indoor-fireplace'),
  ('coastal-haven-lodge', 'parking'),
  ('coastal-haven-lodge', 'safe'),
  ('coastal-haven-lodge', 'sauna'),
  ('coastal-haven-lodge', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('brass-lantern-inn', (SELECT id FROM app_user WHERE email = 'claire@nestara.travel'), 'Brass Lantern Inn', 'hotel'::property_category,
  'Paris', 'France', '75004', NULL,
  48.8566, 2.3522, 6, 3, 3, 2, 1500,
  325, 4.5, 214);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('brass-lantern-inn', 'en', 'Paris, France');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('brass-lantern-inn', 'fr', 'Paris, France');
INSERT INTO property_tag (property_id, tag) VALUES ('brass-lantern-inn', 'Breakfast');
INSERT INTO property_tag (property_id, tag) VALUES ('brass-lantern-inn', 'Historic');
INSERT INTO property_amenity (property_id, amenity) VALUES ('brass-lantern-inn', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('brass-lantern-inn', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('brass-lantern-inn', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('brass-lantern-inn', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('brass-lantern-inn', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('brass-lantern-inn', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('brass-lantern-inn', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('brass-lantern-inn', '24-hour-front-desk'),
  ('brass-lantern-inn', 'bar'),
  ('brass-lantern-inn', 'breakfast'),
  ('brass-lantern-inn', 'concierge-service'),
  ('brass-lantern-inn', 'garden'),
  ('brass-lantern-inn', 'heating'),
  ('brass-lantern-inn', 'laundry'),
  ('brass-lantern-inn', 'lift'),
  ('brass-lantern-inn', 'parking'),
  ('brass-lantern-inn', 'restaurant'),
  ('brass-lantern-inn', 'room-service'),
  ('brass-lantern-inn', 'safe');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('golden-willowbrook', (SELECT id FROM app_user WHERE email = 'diego@nestara.travel'), 'Golden Willowbrook Mansion', 'resort'::property_category,
  'Miami', 'USA', '33139', NULL,
  25.7617, -80.1918, 5, 3, 3, 2, 1500,
  249, 4.8, 172);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('golden-willowbrook', 'en', 'Miami, USA');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('golden-willowbrook', 'fr', 'Miami, États-Unis');
INSERT INTO property_tag (property_id, tag) VALUES ('golden-willowbrook', 'Beachfront');
INSERT INTO property_tag (property_id, tag) VALUES ('golden-willowbrook', 'Gym');
INSERT INTO property_amenity (property_id, amenity) VALUES ('golden-willowbrook', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('golden-willowbrook', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('golden-willowbrook', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('golden-willowbrook', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('golden-willowbrook', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('golden-willowbrook', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('golden-willowbrook', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('golden-willowbrook', 'airport-shuttle'),
  ('golden-willowbrook', 'bar'),
  ('golden-willowbrook', 'breakfast'),
  ('golden-willowbrook', 'fitness-centre'),
  ('golden-willowbrook', 'garden'),
  ('golden-willowbrook', 'heating'),
  ('golden-willowbrook', 'kids-club'),
  ('golden-willowbrook', 'restaurant'),
  ('golden-willowbrook', 'spa'),
  ('golden-willowbrook', 'sun-loungers-or-beach-chairs'),
  ('golden-willowbrook', 'swimming-pool'),
  ('golden-willowbrook', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('the-verdant-frame', (SELECT id FROM app_user WHERE email = 'sari@nestara.travel'), 'The Verdant Frame', 'lodge'::property_category,
  'Jakarta', 'Indonesia', '12920', NULL,
  -6.2088, 106.8456, 5, 2, 2, 2, 1500,
  330, 4.6, 64);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('the-verdant-frame', 'en', 'Jakarta, Indonesia');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('the-verdant-frame', 'fr', 'Jakarta, Indonésie');
INSERT INTO property_tag (property_id, tag) VALUES ('the-verdant-frame', 'Garden');
INSERT INTO property_tag (property_id, tag) VALUES ('the-verdant-frame', 'Quiet');
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-verdant-frame', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-verdant-frame', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-verdant-frame', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-verdant-frame', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-verdant-frame', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-verdant-frame', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('the-verdant-frame', 'air-conditioning'),
  ('the-verdant-frame', 'bbq-facilities'),
  ('the-verdant-frame', 'family-rooms'),
  ('the-verdant-frame', 'garden'),
  ('the-verdant-frame', 'heating'),
  ('the-verdant-frame', 'hiking'),
  ('the-verdant-frame', 'indoor-fireplace'),
  ('the-verdant-frame', 'parking'),
  ('the-verdant-frame', 'sauna'),
  ('the-verdant-frame', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('silver-fern-estate', (SELECT id FROM app_user WHERE email = 'tomas@nestara.travel'), 'Silver Fern Estate', 'hotel'::property_category,
  'Lisbon', 'Portugal', '1200-109', NULL,
  38.7223, -9.1393, 4, 2, 2, 2, 1500,
  359, 4.9, 188);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('silver-fern-estate', 'en', 'Lisbon, Portugal');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('silver-fern-estate', 'fr', 'Lisbonne, Portugal');
INSERT INTO property_tag (property_id, tag) VALUES ('silver-fern-estate', 'Rooftop');
INSERT INTO property_tag (property_id, tag) VALUES ('silver-fern-estate', 'Design');
INSERT INTO property_amenity (property_id, amenity) VALUES ('silver-fern-estate', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('silver-fern-estate', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('silver-fern-estate', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('silver-fern-estate', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('silver-fern-estate', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('silver-fern-estate', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('silver-fern-estate', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('silver-fern-estate', '24-hour-front-desk'),
  ('silver-fern-estate', 'air-conditioning'),
  ('silver-fern-estate', 'bar'),
  ('silver-fern-estate', 'breakfast'),
  ('silver-fern-estate', 'concierge-service'),
  ('silver-fern-estate', 'garden'),
  ('silver-fern-estate', 'laundry'),
  ('silver-fern-estate', 'lift'),
  ('silver-fern-estate', 'restaurant'),
  ('silver-fern-estate', 'room-service'),
  ('silver-fern-estate', 'safe'),
  ('silver-fern-estate', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('azure-tide-loft', (SELECT id FROM app_user WHERE email = 'nuria@nestara.travel'), 'Azure Tide Loft', 'apartment'::property_category,
  'Barcelona', 'Spain', '08003', NULL,
  41.3874, 2.1686, 3, 2, 2, 1, 980,
  189, 4.7, 143);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('azure-tide-loft', 'en', 'Barcelona, Spain');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('azure-tide-loft', 'fr', 'Barcelone, Espagne');
INSERT INTO property_tag (property_id, tag) VALUES ('azure-tide-loft', 'Balcony');
INSERT INTO property_tag (property_id, tag) VALUES ('azure-tide-loft', 'Near metro');
INSERT INTO property_amenity (property_id, amenity) VALUES ('azure-tide-loft', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('azure-tide-loft', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('azure-tide-loft', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('azure-tide-loft', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('azure-tide-loft', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('azure-tide-loft', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('azure-tide-loft', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('azure-tide-loft', 'air-conditioning'),
  ('azure-tide-loft', 'garden'),
  ('azure-tide-loft', 'heating'),
  ('azure-tide-loft', 'lift'),
  ('azure-tide-loft', 'non-smoking-rooms'),
  ('azure-tide-loft', 'parking'),
  ('azure-tide-loft', 'safe'),
  ('azure-tide-loft', 'shared-kitchen'),
  ('azure-tide-loft', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('cedar-hollow-cabin', (SELECT id FROM app_user WHERE email = 'hannah@nestara.travel'), 'Cedar Hollow Cabin', 'lodge'::property_category,
  'Aspen', 'USA', '81611', NULL,
  39.1911, -106.8175, 6, 4, 4, 3, 2100,
  388, 4.9, 87);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('cedar-hollow-cabin', 'en', 'Aspen, USA');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('cedar-hollow-cabin', 'fr', 'Aspen, États-Unis');
INSERT INTO property_tag (property_id, tag) VALUES ('cedar-hollow-cabin', 'Fireplace');
INSERT INTO property_tag (property_id, tag) VALUES ('cedar-hollow-cabin', 'Ski-in');
INSERT INTO property_amenity (property_id, amenity) VALUES ('cedar-hollow-cabin', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cedar-hollow-cabin', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cedar-hollow-cabin', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cedar-hollow-cabin', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cedar-hollow-cabin', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cedar-hollow-cabin', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cedar-hollow-cabin', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('cedar-hollow-cabin', 'air-conditioning'),
  ('cedar-hollow-cabin', 'bbq-facilities'),
  ('cedar-hollow-cabin', 'family-rooms'),
  ('cedar-hollow-cabin', 'garden'),
  ('cedar-hollow-cabin', 'hiking'),
  ('cedar-hollow-cabin', 'indoor-fireplace'),
  ('cedar-hollow-cabin', 'non-smoking-rooms'),
  ('cedar-hollow-cabin', 'parking'),
  ('cedar-hollow-cabin', 'sauna'),
  ('cedar-hollow-cabin', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('marble-court-suites', (SELECT id FROM app_user WHERE email = 'giulia@nestara.travel'), 'Marble Court Suites', 'hotel'::property_category,
  'Rome', 'Italy', '00186', NULL,
  41.9028, 12.4964, 2, 1, 1, 1, 720,
  212, 4.6, 251);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('marble-court-suites', 'en', 'Rome, Italy');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('marble-court-suites', 'fr', 'Rome, Italie');
INSERT INTO property_tag (property_id, tag) VALUES ('marble-court-suites', 'Concierge');
INSERT INTO property_tag (property_id, tag) VALUES ('marble-court-suites', 'Historic');
INSERT INTO property_amenity (property_id, amenity) VALUES ('marble-court-suites', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('marble-court-suites', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('marble-court-suites', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('marble-court-suites', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('marble-court-suites', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('marble-court-suites', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('marble-court-suites', '24-hour-front-desk'),
  ('marble-court-suites', 'bar'),
  ('marble-court-suites', 'breakfast'),
  ('marble-court-suites', 'concierge-service'),
  ('marble-court-suites', 'family-rooms'),
  ('marble-court-suites', 'heating'),
  ('marble-court-suites', 'laundry'),
  ('marble-court-suites', 'lift'),
  ('marble-court-suites', 'non-smoking-rooms'),
  ('marble-court-suites', 'restaurant'),
  ('marble-court-suites', 'room-service'),
  ('marble-court-suites', 'safe');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('palm-quarter-villa', (SELECT id FROM app_user WHERE email = 'layla@nestara.travel'), 'Palm Quarter Villa', 'resort'::property_category,
  'Dubai', 'UAE', '00000', NULL,
  25.2048, 55.2708, 8, 4, 4, 4, 3200,
  399, 4.8, 76);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('palm-quarter-villa', 'en', 'Dubai, UAE');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('palm-quarter-villa', 'fr', 'Dubaï, Émirats arabes unis');
INSERT INTO property_tag (property_id, tag) VALUES ('palm-quarter-villa', 'Private pool');
INSERT INTO property_tag (property_id, tag) VALUES ('palm-quarter-villa', 'Chef');
INSERT INTO property_amenity (property_id, amenity) VALUES ('palm-quarter-villa', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('palm-quarter-villa', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('palm-quarter-villa', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('palm-quarter-villa', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('palm-quarter-villa', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('palm-quarter-villa', 'petFriendly'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('palm-quarter-villa', 'airport-shuttle'),
  ('palm-quarter-villa', 'bar'),
  ('palm-quarter-villa', 'breakfast'),
  ('palm-quarter-villa', 'fitness-centre'),
  ('palm-quarter-villa', 'garden'),
  ('palm-quarter-villa', 'heating'),
  ('palm-quarter-villa', 'kids-club'),
  ('palm-quarter-villa', 'non-smoking-rooms'),
  ('palm-quarter-villa', 'restaurant'),
  ('palm-quarter-villa', 'spa'),
  ('palm-quarter-villa', 'sun-loungers-or-beach-chairs'),
  ('palm-quarter-villa', 'swimming-pool');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('harbour-light-studio', (SELECT id FROM app_user WHERE email = 'freja@nestara.travel'), 'Harbour Light Studio', 'apartment'::property_category,
  'Copenhagen', 'Denmark', '1050', NULL,
  55.6761, 12.5683, 2, 1, 1, 1, 640,
  168, 4.7, 119);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('harbour-light-studio', 'en', 'Copenhagen, Denmark');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('harbour-light-studio', 'fr', 'Copenhague, Danemark');
INSERT INTO property_tag (property_id, tag) VALUES ('harbour-light-studio', 'Bikes');
INSERT INTO property_tag (property_id, tag) VALUES ('harbour-light-studio', 'Canal view');
INSERT INTO property_amenity (property_id, amenity) VALUES ('harbour-light-studio', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('harbour-light-studio', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('harbour-light-studio', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('harbour-light-studio', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('harbour-light-studio', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('harbour-light-studio', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('harbour-light-studio', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('harbour-light-studio', 'air-conditioning'),
  ('harbour-light-studio', 'family-rooms'),
  ('harbour-light-studio', 'garden'),
  ('harbour-light-studio', 'heating'),
  ('harbour-light-studio', 'lift'),
  ('harbour-light-studio', 'non-smoking-rooms'),
  ('harbour-light-studio', 'parking'),
  ('harbour-light-studio', 'shared-kitchen'),
  ('harbour-light-studio', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('olive-grove-retreat', (SELECT id FROM app_user WHERE email = 'nikos@nestara.travel'), 'Olive Grove Retreat', 'lodge'::property_category,
  'Crete', 'Greece', '71202', NULL,
  35.3387, 25.1442, 6, 3, 3, 2, 1750,
  264, 4.8, 103);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('olive-grove-retreat', 'en', 'Crete, Greece');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('olive-grove-retreat', 'fr', 'Crète, Grèce');
INSERT INTO property_tag (property_id, tag) VALUES ('olive-grove-retreat', 'Terrace');
INSERT INTO property_tag (property_id, tag) VALUES ('olive-grove-retreat', 'Sea view');
INSERT INTO property_amenity (property_id, amenity) VALUES ('olive-grove-retreat', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('olive-grove-retreat', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('olive-grove-retreat', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('olive-grove-retreat', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('olive-grove-retreat', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('olive-grove-retreat', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('olive-grove-retreat', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('olive-grove-retreat', 'air-conditioning'),
  ('olive-grove-retreat', 'bbq-facilities'),
  ('olive-grove-retreat', 'garden'),
  ('olive-grove-retreat', 'heating'),
  ('olive-grove-retreat', 'hiking'),
  ('olive-grove-retreat', 'indoor-fireplace'),
  ('olive-grove-retreat', 'non-smoking-rooms'),
  ('olive-grove-retreat', 'parking'),
  ('olive-grove-retreat', 'sauna'),
  ('olive-grove-retreat', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('kyoto-paper-house', (SELECT id FROM app_user WHERE email = 'haruto@nestara.travel'), 'Kyoto Paper House', 'apartment'::property_category,
  'Kyoto', 'Japan', '604-8006', NULL,
  35.0116, 135.7681, 3, 2, 2, 1, 860,
  231, 4.9, 162);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('kyoto-paper-house', 'en', 'Kyoto, Japan');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('kyoto-paper-house', 'fr', 'Kyoto, Japon');
INSERT INTO property_tag (property_id, tag) VALUES ('kyoto-paper-house', 'Tatami');
INSERT INTO property_tag (property_id, tag) VALUES ('kyoto-paper-house', 'Garden');
INSERT INTO property_amenity (property_id, amenity) VALUES ('kyoto-paper-house', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('kyoto-paper-house', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('kyoto-paper-house', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('kyoto-paper-house', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('kyoto-paper-house', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('kyoto-paper-house', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('kyoto-paper-house', 'air-conditioning'),
  ('kyoto-paper-house', 'family-rooms'),
  ('kyoto-paper-house', 'garden'),
  ('kyoto-paper-house', 'heating'),
  ('kyoto-paper-house', 'lift'),
  ('kyoto-paper-house', 'non-smoking-rooms'),
  ('kyoto-paper-house', 'parking'),
  ('kyoto-paper-house', 'shared-kitchen'),
  ('kyoto-paper-house', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('the-copper-townhouse', (SELECT id FROM app_user WHERE email = 'oliver@nestara.travel'), 'The Copper Townhouse', 'apartment'::property_category,
  'London', 'UK', 'SW1A 1AA', NULL,
  51.5072, -0.1276, 5, 3, 3, 2, 1400,
  342, 4.6, 198);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('the-copper-townhouse', 'en', 'London, UK');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('the-copper-townhouse', 'fr', 'Londres, Royaume-Uni');
INSERT INTO property_tag (property_id, tag) VALUES ('the-copper-townhouse', 'Workspace');
INSERT INTO property_tag (property_id, tag) VALUES ('the-copper-townhouse', 'Family');
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-copper-townhouse', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-copper-townhouse', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-copper-townhouse', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-copper-townhouse', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-copper-townhouse', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-copper-townhouse', 'petFriendly'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('the-copper-townhouse', 'air-conditioning'),
  ('the-copper-townhouse', 'family-rooms'),
  ('the-copper-townhouse', 'garden'),
  ('the-copper-townhouse', 'heating'),
  ('the-copper-townhouse', 'lift'),
  ('the-copper-townhouse', 'non-smoking-rooms'),
  ('the-copper-townhouse', 'parking'),
  ('the-copper-townhouse', 'shared-kitchen'),
  ('the-copper-townhouse', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('sunset-dune-resort', (SELECT id FROM app_user WHERE email = 'camila@nestara.travel'), 'Sunset Dune Resort', 'resort'::property_category,
  'Tulum', 'Mexico', '77780', NULL,
  20.2114, -87.4654, 4, 2, 2, 2, 1250,
  276, 4.7, 134);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('sunset-dune-resort', 'en', 'Tulum, Mexico');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('sunset-dune-resort', 'fr', 'Tulum, Mexique');
INSERT INTO property_tag (property_id, tag) VALUES ('sunset-dune-resort', 'Beachfront');
INSERT INTO property_tag (property_id, tag) VALUES ('sunset-dune-resort', 'Yoga');
INSERT INTO property_amenity (property_id, amenity) VALUES ('sunset-dune-resort', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sunset-dune-resort', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sunset-dune-resort', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sunset-dune-resort', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sunset-dune-resort', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sunset-dune-resort', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sunset-dune-resort', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('sunset-dune-resort', 'airport-shuttle'),
  ('sunset-dune-resort', 'bar'),
  ('sunset-dune-resort', 'breakfast'),
  ('sunset-dune-resort', 'fitness-centre'),
  ('sunset-dune-resort', 'heating'),
  ('sunset-dune-resort', 'kids-club'),
  ('sunset-dune-resort', 'non-smoking-rooms'),
  ('sunset-dune-resort', 'restaurant'),
  ('sunset-dune-resort', 'spa'),
  ('sunset-dune-resort', 'sun-loungers-or-beach-chairs'),
  ('sunset-dune-resort', 'swimming-pool'),
  ('sunset-dune-resort', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('north-fjord-cabin', (SELECT id FROM app_user WHERE email = 'ingrid@nestara.travel'), 'North Fjord Cabin', 'lodge'::property_category,
  'Bergen', 'Norway', '5003', NULL,
  60.3913, 5.3221, 4, 2, 2, 1, 1100,
  221, 4.8, 71);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('north-fjord-cabin', 'en', 'Bergen, Norway');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('north-fjord-cabin', 'fr', 'Bergen, Norvège');
INSERT INTO property_tag (property_id, tag) VALUES ('north-fjord-cabin', 'Sauna');
INSERT INTO property_tag (property_id, tag) VALUES ('north-fjord-cabin', 'Hiking');
INSERT INTO property_amenity (property_id, amenity) VALUES ('north-fjord-cabin', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('north-fjord-cabin', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('north-fjord-cabin', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('north-fjord-cabin', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('north-fjord-cabin', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('north-fjord-cabin', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('north-fjord-cabin', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('north-fjord-cabin', 'air-conditioning'),
  ('north-fjord-cabin', 'bbq-facilities'),
  ('north-fjord-cabin', 'garden'),
  ('north-fjord-cabin', 'heating'),
  ('north-fjord-cabin', 'hiking'),
  ('north-fjord-cabin', 'indoor-fireplace'),
  ('north-fjord-cabin', 'parking'),
  ('north-fjord-cabin', 'safe'),
  ('north-fjord-cabin', 'sauna'),
  ('north-fjord-cabin', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('the-gallery-flat', (SELECT id FROM app_user WHERE email = 'jonas@nestara.travel'), 'The Gallery Flat', 'apartment'::property_category,
  'Berlin', 'Germany', '10119', NULL,
  52.52, 13.405, 4, 2, 2, 1, 1050,
  174, 4.5, 156);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('the-gallery-flat', 'en', 'Berlin, Germany');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('the-gallery-flat', 'fr', 'Berlin, Allemagne');
INSERT INTO property_tag (property_id, tag) VALUES ('the-gallery-flat', 'Art');
INSERT INTO property_tag (property_id, tag) VALUES ('the-gallery-flat', 'Long stay');
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-gallery-flat', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-gallery-flat', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-gallery-flat', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-gallery-flat', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-gallery-flat', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-gallery-flat', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('the-gallery-flat', 'air-conditioning'),
  ('the-gallery-flat', 'family-rooms'),
  ('the-gallery-flat', 'garden'),
  ('the-gallery-flat', 'heating'),
  ('the-gallery-flat', 'lift'),
  ('the-gallery-flat', 'non-smoking-rooms'),
  ('the-gallery-flat', 'parking'),
  ('the-gallery-flat', 'shared-kitchen'),
  ('the-gallery-flat', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('porto-river-suites', (SELECT id FROM app_user WHERE email = 'ines@nestara.travel'), 'Porto River Suites', 'hotel'::property_category,
  'Porto', 'Portugal', '4050-011', NULL,
  41.1579, -8.6291, 3, 2, 2, 1, 900,
  198, 4.7, 205);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('porto-river-suites', 'en', 'Porto, Portugal');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('porto-river-suites', 'fr', 'Porto, Portugal');
INSERT INTO property_tag (property_id, tag) VALUES ('porto-river-suites', 'River view');
INSERT INTO property_tag (property_id, tag) VALUES ('porto-river-suites', 'Breakfast');
INSERT INTO property_amenity (property_id, amenity) VALUES ('porto-river-suites', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('porto-river-suites', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('porto-river-suites', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('porto-river-suites', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('porto-river-suites', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('porto-river-suites', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('porto-river-suites', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('porto-river-suites', '24-hour-front-desk'),
  ('porto-river-suites', 'air-conditioning'),
  ('porto-river-suites', 'bar'),
  ('porto-river-suites', 'breakfast'),
  ('porto-river-suites', 'concierge-service'),
  ('porto-river-suites', 'heating'),
  ('porto-river-suites', 'laundry'),
  ('porto-river-suites', 'lift'),
  ('porto-river-suites', 'restaurant'),
  ('porto-river-suites', 'room-service'),
  ('porto-river-suites', 'safe'),
  ('porto-river-suites', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('table-mountain-lodge', (SELECT id FROM app_user WHERE email = 'thandi@nestara.travel'), 'Table Mountain Lodge', 'lodge'::property_category,
  'Cape Town', 'South Africa', '8001', NULL,
  -33.9249, 18.4241, 7, 4, 4, 3, 2400,
  312, 4.9, 92);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('table-mountain-lodge', 'en', 'Cape Town, South Africa');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('table-mountain-lodge', 'fr', 'Le Cap, Afrique du Sud');
INSERT INTO property_tag (property_id, tag) VALUES ('table-mountain-lodge', 'Mountain view');
INSERT INTO property_tag (property_id, tag) VALUES ('table-mountain-lodge', 'Pool');
INSERT INTO property_amenity (property_id, amenity) VALUES ('table-mountain-lodge', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('table-mountain-lodge', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('table-mountain-lodge', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('table-mountain-lodge', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('table-mountain-lodge', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('table-mountain-lodge', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('table-mountain-lodge', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('table-mountain-lodge', 'bbq-facilities'),
  ('table-mountain-lodge', 'family-rooms'),
  ('table-mountain-lodge', 'garden'),
  ('table-mountain-lodge', 'heating'),
  ('table-mountain-lodge', 'hiking'),
  ('table-mountain-lodge', 'indoor-fireplace'),
  ('table-mountain-lodge', 'non-smoking-rooms'),
  ('table-mountain-lodge', 'parking'),
  ('table-mountain-lodge', 'sauna'),
  ('table-mountain-lodge', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('the-orchid-residence', (SELECT id FROM app_user WHERE email = 'wei@nestara.travel'), 'The Orchid Residence', 'hotel'::property_category,
  'Singapore', 'Singapore', '249715', NULL,
  1.3521, 103.8198, 2, 1, 1, 1, 700,
  289, 4.8, 240);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('the-orchid-residence', 'en', 'Singapore');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('the-orchid-residence', 'fr', 'Singapour');
INSERT INTO property_tag (property_id, tag) VALUES ('the-orchid-residence', 'Infinity pool');
INSERT INTO property_tag (property_id, tag) VALUES ('the-orchid-residence', 'Skyline');
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-orchid-residence', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-orchid-residence', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-orchid-residence', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-orchid-residence', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-orchid-residence', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-orchid-residence', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('the-orchid-residence', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('the-orchid-residence', '24-hour-front-desk'),
  ('the-orchid-residence', 'air-conditioning'),
  ('the-orchid-residence', 'bar'),
  ('the-orchid-residence', 'breakfast'),
  ('the-orchid-residence', 'concierge-service'),
  ('the-orchid-residence', 'family-rooms'),
  ('the-orchid-residence', 'heating'),
  ('the-orchid-residence', 'laundry'),
  ('the-orchid-residence', 'lift'),
  ('the-orchid-residence', 'restaurant'),
  ('the-orchid-residence', 'room-service'),
  ('the-orchid-residence', 'safe');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('bosphorus-blue-house', (SELECT id FROM app_user WHERE email = 'elif@nestara.travel'), 'Bosphorus Blue House', 'apartment'::property_category,
  'Istanbul', 'Türkiye', '34433', NULL,
  41.0082, 28.9784, 5, 3, 3, 2, 1320,
  183, 4.6, 111);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('bosphorus-blue-house', 'en', 'Istanbul, Türkiye');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('bosphorus-blue-house', 'fr', 'Istanbul, Turquie');
INSERT INTO property_tag (property_id, tag) VALUES ('bosphorus-blue-house', 'Sea view');
INSERT INTO property_tag (property_id, tag) VALUES ('bosphorus-blue-house', 'Family');
INSERT INTO property_amenity (property_id, amenity) VALUES ('bosphorus-blue-house', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('bosphorus-blue-house', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('bosphorus-blue-house', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('bosphorus-blue-house', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('bosphorus-blue-house', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('bosphorus-blue-house', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('bosphorus-blue-house', 'air-conditioning'),
  ('bosphorus-blue-house', 'garden'),
  ('bosphorus-blue-house', 'heating'),
  ('bosphorus-blue-house', 'lift'),
  ('bosphorus-blue-house', 'non-smoking-rooms'),
  ('bosphorus-blue-house', 'parking'),
  ('bosphorus-blue-house', 'safe'),
  ('bosphorus-blue-house', 'shared-kitchen'),
  ('bosphorus-blue-house', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('highland-stone-barn', (SELECT id FROM app_user WHERE email = 'callum@nestara.travel'), 'Highland Stone Barn', 'lodge'::property_category,
  'Edinburgh', 'UK', 'EH1 1RE', NULL,
  55.9533, -3.1883, 6, 3, 3, 2, 1680,
  207, 4.7, 84);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('highland-stone-barn', 'en', 'Edinburgh, UK');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('highland-stone-barn', 'fr', 'Édimbourg, Royaume-Uni');
INSERT INTO property_tag (property_id, tag) VALUES ('highland-stone-barn', 'Fireplace');
INSERT INTO property_tag (property_id, tag) VALUES ('highland-stone-barn', 'Pets welcome');
INSERT INTO property_amenity (property_id, amenity) VALUES ('highland-stone-barn', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('highland-stone-barn', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('highland-stone-barn', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('highland-stone-barn', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('highland-stone-barn', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('highland-stone-barn', 'petFriendly'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('highland-stone-barn', 'air-conditioning'),
  ('highland-stone-barn', 'bbq-facilities'),
  ('highland-stone-barn', 'family-rooms'),
  ('highland-stone-barn', 'garden'),
  ('highland-stone-barn', 'heating'),
  ('highland-stone-barn', 'hiking'),
  ('highland-stone-barn', 'indoor-fireplace'),
  ('highland-stone-barn', 'parking'),
  ('highland-stone-barn', 'sauna'),
  ('highland-stone-barn', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('sydney-cove-apartment', (SELECT id FROM app_user WHERE email = 'grace@nestara.travel'), 'Sydney Cove Apartment', 'apartment'::property_category,
  'Sydney', 'Australia', '2000', NULL,
  -33.8688, 151.2093, 4, 2, 2, 2, 1180,
  258, 4.8, 147);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('sydney-cove-apartment', 'en', 'Sydney, Australia');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('sydney-cove-apartment', 'fr', 'Sydney, Australie');
INSERT INTO property_tag (property_id, tag) VALUES ('sydney-cove-apartment', 'Harbour view');
INSERT INTO property_tag (property_id, tag) VALUES ('sydney-cove-apartment', 'Balcony');
INSERT INTO property_amenity (property_id, amenity) VALUES ('sydney-cove-apartment', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sydney-cove-apartment', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sydney-cove-apartment', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sydney-cove-apartment', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sydney-cove-apartment', 'workspace'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sydney-cove-apartment', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('sydney-cove-apartment', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('sydney-cove-apartment', 'air-conditioning'),
  ('sydney-cove-apartment', 'family-rooms'),
  ('sydney-cove-apartment', 'garden'),
  ('sydney-cove-apartment', 'lift'),
  ('sydney-cove-apartment', 'non-smoking-rooms'),
  ('sydney-cove-apartment', 'parking'),
  ('sydney-cove-apartment', 'safe'),
  ('sydney-cove-apartment', 'shared-kitchen'),
  ('sydney-cove-apartment', 'terrace');

INSERT INTO property (id, host_id, name, category, city, country, postal_code, neighbourhood,
  latitude, longitude, guests, rooms, beds, baths, area_sqm, base_price_usd, rating, review_count)
VALUES ('cyclades-white-resort', (SELECT id FROM app_user WHERE email = 'eleni@nestara.travel'), 'Cyclades White Resort', 'resort'::property_category,
  'Santorini', 'Greece', '84700', NULL,
  36.3932, 25.4615, 4, 2, 2, 2, 1350,
  374, 4.9, 168);
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('cyclades-white-resort', 'en', 'Santorini, Greece');
INSERT INTO property_translation (property_id, locale, location_label) VALUES ('cyclades-white-resort', 'fr', 'Santorin, Grèce');
INSERT INTO property_tag (property_id, tag) VALUES ('cyclades-white-resort', 'Caldera view');
INSERT INTO property_tag (property_id, tag) VALUES ('cyclades-white-resort', 'Spa');
INSERT INTO property_amenity (property_id, amenity) VALUES ('cyclades-white-resort', 'wifi'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cyclades-white-resort', 'kitchen'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cyclades-white-resort', 'pool'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cyclades-white-resort', 'parking'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cyclades-white-resort', 'airConditioning'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cyclades-white-resort', 'petFriendly'::amenity_id);
INSERT INTO property_amenity (property_id, amenity) VALUES ('cyclades-white-resort', 'breakfast'::amenity_id);
INSERT INTO property_equipment (property_id, equipment_id) VALUES
  ('cyclades-white-resort', 'air-conditioning'),
  ('cyclades-white-resort', 'airport-shuttle'),
  ('cyclades-white-resort', 'bar'),
  ('cyclades-white-resort', 'breakfast'),
  ('cyclades-white-resort', 'family-rooms'),
  ('cyclades-white-resort', 'fitness-centre'),
  ('cyclades-white-resort', 'kids-club'),
  ('cyclades-white-resort', 'restaurant'),
  ('cyclades-white-resort', 'safe'),
  ('cyclades-white-resort', 'spa'),
  ('cyclades-white-resort', 'sun-loungers-or-beach-chairs'),
  ('cyclades-white-resort', 'swimming-pool');

-- Host listings (src/data/seed/listings.json)
INSERT INTO listing (id, property_id, status, approved, nightly_usd,
  long_stay_enabled, long_stay_threshold, long_stay_discount, mobile_enabled, mobile_discount, published_at) VALUES
  ('ls-1', 'hidden-quill-haven', 'published'::listing_status, true, 246,
   true, 7, 10, true, 5, now()),
  ('ls-2', 'coastal-haven-lodge', 'published'::listing_status, true, 299,
   false, 7, 10, false, 5, now()),
  ('ls-3', 'brass-lantern-inn', 'published'::listing_status, true, 325,
   true, 7, 10, false, 5, now()),
  ('ls-4', 'golden-willowbrook', 'published'::listing_status, true, 249,
   false, 7, 10, true, 5, now()),
  ('ls-5', 'the-verdant-frame', 'draft'::listing_status, false, 330,
   true, 7, 10, false, 5, NULL),
  ('ls-6', 'silver-fern-estate', 'suspended'::listing_status, true, 359,
   false, 7, 10, false, 5, NULL),
  ('ls-7', 'azure-tide-loft', 'published'::listing_status, true, 189,
   true, 7, 10, true, 5, now()),
  ('ls-8', 'cedar-hollow-cabin', 'published'::listing_status, true, 388,
   false, 7, 10, false, 5, now()),
  ('ls-9', 'marble-court-suites', 'published'::listing_status, true, 212,
   true, 7, 10, false, 5, now()),
  ('ls-10', 'palm-quarter-villa', 'published'::listing_status, true, 399,
   false, 7, 10, true, 5, now()),
  ('ls-11', 'harbour-light-studio', 'published'::listing_status, true, 168,
   true, 7, 10, false, 5, now()),
  ('ls-12', 'olive-grove-retreat', 'published'::listing_status, true, 264,
   false, 7, 10, false, 5, now()),
  ('ls-13', 'kyoto-paper-house', 'published'::listing_status, true, 231,
   true, 7, 10, true, 5, now()),
  ('ls-14', 'the-copper-townhouse', 'published'::listing_status, true, 342,
   false, 7, 10, false, 5, now()),
  ('ls-15', 'sunset-dune-resort', 'published'::listing_status, true, 276,
   true, 7, 10, false, 5, now()),
  ('ls-16', 'north-fjord-cabin', 'published'::listing_status, true, 221,
   false, 7, 10, true, 5, now()),
  ('ls-17', 'the-gallery-flat', 'published'::listing_status, true, 174,
   true, 7, 10, false, 5, now()),
  ('ls-18', 'porto-river-suites', 'published'::listing_status, true, 198,
   false, 7, 10, false, 5, now()),
  ('ls-19', 'table-mountain-lodge', 'published'::listing_status, true, 312,
   true, 7, 10, true, 5, now()),
  ('ls-20', 'the-orchid-residence', 'published'::listing_status, true, 289,
   false, 7, 10, false, 5, now()),
  ('ls-21', 'bosphorus-blue-house', 'published'::listing_status, true, 183,
   true, 7, 10, false, 5, now()),
  ('ls-22', 'highland-stone-barn', 'published'::listing_status, true, 207,
   false, 7, 10, true, 5, now()),
  ('ls-23', 'sydney-cove-apartment', 'published'::listing_status, true, 258,
   true, 7, 10, false, 5, now()),
  ('ls-24', 'cyclades-white-resort', 'published'::listing_status, true, 374,
   false, 7, 10, false, 5, now());

-- Bookings (src/data/seed/bookings.json). Fees derived from platform_settings:
-- service fee 8% and tax 5% of the nightly subtotal.
INSERT INTO booking (id, reference, property_id, guest_id, guest_name, check_in, check_out, guests, status,
  nightly_usd, base_subtotal, subtotal, service_fee, taxes, total_usd)
VALUES ('bk-1', 'RE-BK1', 'hidden-quill-haven',
  (SELECT id FROM app_user WHERE full_name = 'Clara Mercier' LIMIT 1),
  'Clara Mercier', '2026-09-18', '2026-09-22', 2, 'confirmed'::booking_status,
  217.7, 870.8, 870.8, 69.66, 43.54, 984);
INSERT INTO payment (booking_id, method, brand, last4, status, amount_usd, reference)
VALUES ('bk-1', 'card', 'visa'::card_brand, '4242',
  'paid'::payment_status, 984, 'pi_demo_bk-1');
INSERT INTO booking (id, reference, property_id, guest_id, guest_name, check_in, check_out, guests, status,
  nightly_usd, base_subtotal, subtotal, service_fee, taxes, total_usd)
VALUES ('bk-2', 'RE-BK2', 'coastal-haven-lodge',
  (SELECT id FROM app_user WHERE full_name = 'Jonas Weber' LIMIT 1),
  'Jonas Weber', '2026-10-04', '2026-10-07', 4, 'pending'::booking_status,
  264.6, 793.8, 793.8, 63.5, 39.69, 897);
INSERT INTO payment (booking_id, method, brand, last4, status, amount_usd, reference)
VALUES ('bk-2', 'card', 'mastercard'::card_brand, '4243',
  'authorized'::payment_status, 897, 'pi_demo_bk-2');
INSERT INTO booking (id, reference, property_id, guest_id, guest_name, check_in, check_out, guests, status,
  nightly_usd, base_subtotal, subtotal, service_fee, taxes, total_usd)
VALUES ('bk-3', 'RE-BK3', 'brass-lantern-inn',
  (SELECT id FROM app_user WHERE full_name = 'Ana Ferreira' LIMIT 1),
  'Ana Ferreira', '2026-06-02', '2026-06-06', 2, 'completed'::booking_status,
  317.7, 1270.8, 1270.8, 101.66, 63.54, 1436);
INSERT INTO payment (booking_id, method, brand, last4, status, amount_usd, reference)
VALUES ('bk-3', 'card', 'amex'::card_brand, '4244',
  'paid'::payment_status, 1436, 'pi_demo_bk-3');
INSERT INTO booking (id, reference, property_id, guest_id, guest_name, check_in, check_out, guests, status,
  nightly_usd, base_subtotal, subtotal, service_fee, taxes, total_usd)
VALUES ('bk-4', 'RE-BK4', 'golden-willowbrook',
  (SELECT id FROM app_user WHERE full_name = 'Marc Dupont' LIMIT 1),
  'Marc Dupont', '2026-05-11', '2026-05-13', 3, 'cancelled'::booking_status,
  220.35, 440.7, 440.7, 35.26, 22.04, 498);
INSERT INTO payment (booking_id, method, brand, last4, status, amount_usd, reference)
VALUES ('bk-4', 'card', 'visa'::card_brand, '4245',
  'refunded'::payment_status, 498, 'pi_demo_bk-4');
INSERT INTO booking_cancellation (booking_id, cancelled_by, cancelled_by_id, policy, refund_percent, refund_usd, reason)
VALUES ('bk-4', 'guest'::actor_role, (SELECT id FROM app_user WHERE full_name = 'Marc Dupont' LIMIT 1),
  'moderate'::cancellation_policy, 50, 249, 'Change of plans');
INSERT INTO booking (id, reference, property_id, guest_id, guest_name, check_in, check_out, guests, status,
  nightly_usd, base_subtotal, subtotal, service_fee, taxes, total_usd)
VALUES ('bk-5', 'RE-BK5', 'the-verdant-frame',
  (SELECT id FROM app_user WHERE full_name = 'Lucía Ortega' LIMIT 1),
  'Lucía Ortega', '2026-11-01', '2026-11-05', 5, 'pending'::booking_status,
  292.04, 1168.16, 1168.16, 93.45, 58.41, 1320);
INSERT INTO payment (booking_id, method, brand, last4, status, amount_usd, reference)
VALUES ('bk-5', 'card', 'mastercard'::card_brand, '4246',
  'authorized'::payment_status, 1320, 'pi_demo_bk-5');

-- Reviews (src/data/seed/reviews.json)
INSERT INTO review (id, property_id, author_name, rating, body, reply, replied_at, hidden, created_on)
VALUES ('rv-1', 'hidden-quill-haven', 'Clara M.', 5, 'Spotless, quiet and exactly as pictured.', NULL, NULL, false, '2026-07-22');
INSERT INTO review (id, property_id, author_name, rating, body, reply, replied_at, hidden, created_on)
VALUES ('rv-2', 'coastal-haven-lodge', 'Daniel O.', 4, 'Great location, the kitchen could use more pans.', NULL, NULL, false, '2026-06-14');
INSERT INTO review (id, property_id, author_name, rating, body, reply, replied_at, hidden, created_on)
VALUES ('rv-3', 'brass-lantern-inn', 'Mei T.', 5, 'The host thought of everything for our late arrival.', NULL, NULL, false, '2026-05-03');

-- Message threads (src/data/seed/threads.json). "me" = the signed-in guest,
-- "them" = the other party; unread messages are the ones with no read_at.
INSERT INTO message_thread (id, property_id, with_name) VALUES ('th-1', 'hidden-quill-haven', 'Maya (host)');
INSERT INTO message (legacy_id, thread_id, sender_role, body, sent_at, read_at)
VALUES ('m1', 'th-1', 'host', 'Hi! Your booking request is in — do you need an early check-in?',
  (CURRENT_DATE + time '09:12') AT TIME ZONE 'UTC', NULL);
INSERT INTO message (legacy_id, thread_id, sender_role, body, sent_at, read_at)
VALUES ('m2', 'th-1', 'guest', 'Yes please, we land at 11am.',
  (CURRENT_DATE + time '09:20') AT TIME ZONE 'UTC', now());
INSERT INTO message (legacy_id, thread_id, sender_role, body, sent_at, read_at)
VALUES ('m3', 'th-1', 'host', 'Perfect, the flat will be ready from 11:30.',
  (CURRENT_DATE + time '09:24') AT TIME ZONE 'UTC', NULL);

INSERT INTO message_thread (id, property_id, with_name) VALUES ('th-2', 'coastal-haven-lodge', 'Jonas Weber');
INSERT INTO message (legacy_id, thread_id, sender_role, body, sent_at, read_at)
VALUES ('m1', 'th-2', 'host', 'Is parking included for two cars?',
  (CURRENT_DATE + time '14:02') AT TIME ZONE 'UTC', now());
INSERT INTO message (legacy_id, thread_id, sender_role, body, sent_at, read_at)
VALUES ('m2', 'th-2', 'guest', 'One space is included, the second is €12 a night.',
  (CURRENT_DATE + time '14:30') AT TIME ZONE 'UTC', now());

INSERT INTO message_thread (id, property_id, with_name) VALUES ('th-3', 'brass-lantern-inn', 'Ana Ferreira');
INSERT INTO message (legacy_id, thread_id, sender_role, body, sent_at, read_at)
VALUES ('m1', 'th-3', 'host', 'Thanks again — we left the keys in the box.',
  (CURRENT_DATE + time '18:45') AT TIME ZONE 'UTC', NULL);

-- Payouts (src/data/seed/payouts.json)
INSERT INTO payout (id, host_id, host_name, amount_usd, status, payout_date)
VALUES ('po-1', (SELECT user_id FROM host_profile
   WHERE deaccent(display_name) = deaccent('Maya Lindqvist')
      OR split_part(deaccent(display_name), ' ', 1) = split_part(deaccent('Maya Lindqvist'), ' ', 1)
   ORDER BY (deaccent(display_name) = deaccent('Maya Lindqvist')) DESC LIMIT 1),
  'Maya Lindqvist', 2840, 'paid'::payout_status, '2026-08-01');
INSERT INTO payout (id, host_id, host_name, amount_usd, status, payout_date)
VALUES ('po-2', (SELECT user_id FROM host_profile
   WHERE deaccent(display_name) = deaccent('Ana Ferreira')
      OR split_part(deaccent(display_name), ' ', 1) = split_part(deaccent('Ana Ferreira'), ' ', 1)
   ORDER BY (deaccent(display_name) = deaccent('Ana Ferreira')) DESC LIMIT 1),
  'Ana Ferreira', 1120, 'scheduled'::payout_status, '2026-09-01');
INSERT INTO payout (id, host_id, host_name, amount_usd, status, payout_date)
VALUES ('po-3', (SELECT user_id FROM host_profile
   WHERE deaccent(display_name) = deaccent('Tomas Alvarez')
      OR split_part(deaccent(display_name), ' ', 1) = split_part(deaccent('Tomas Alvarez'), ' ', 1)
   ORDER BY (deaccent(display_name) = deaccent('Tomas Alvarez')) DESC LIMIT 1),
  'Tomas Alvarez', 640, 'scheduled'::payout_status, '2026-09-01');

-- Host team members (src/data/seed/team.json), attached to the first demo host account
INSERT INTO host_team_member (id, host_id, full_name, email, scopes)
SELECT 'tm-1', hp.user_id, 'Elena Rossi', 'elena@nestara.travel', ARRAY['calendar', 'messaging']::team_scope[]
  FROM host_profile hp JOIN app_user u ON u.id = hp.user_id
 WHERE u.legacy_id = 'u-1' LIMIT 1;
INSERT INTO host_team_member (id, host_id, full_name, email, scopes)
SELECT 'tm-2', hp.user_id, 'Paul Girard', 'paul@nestara.travel', ARRAY['messaging']::team_scope[]
  FROM host_profile hp JOIN app_user u ON u.id = hp.user_id
 WHERE u.legacy_id = 'u-1' LIMIT 1;

-- Monthly booking stats (src/data/seed/analytics.json) — platform-wide (host_id NULL)
INSERT INTO booking_monthly_stat (host_id, year, month, bookings) VALUES
  (NULL, 2026, 1, 4),
  (NULL, 2026, 2, 6),
  (NULL, 2026, 3, 9),
  (NULL, 2026, 4, 7),
  (NULL, 2026, 5, 12),
  (NULL, 2026, 6, 15),
  (NULL, 2026, 7, 18),
  (NULL, 2026, 8, 21),
  (NULL, 2026, 9, 14);

-- Availability calendar sample (src/data/platform.ts :: CalendarMap)
INSERT INTO calendar_night (property_id, night, blocked, price_usd) VALUES
  ('hidden-quill-haven', CURRENT_DATE + 10, true, NULL),
  ('hidden-quill-haven', CURRENT_DATE + 11, true, NULL),
  ('hidden-quill-haven', CURRENT_DATE + 20, false, 286),
  ('hidden-quill-haven', CURRENT_DATE + 21, false, 286)
ON CONFLICT (property_id, night) DO NOTHING;

-- Listing submissions — the wizard payload stored verbatim (ListingDraft JSON)
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-1', 'hidden-quill-haven', pr.host_id, 'published'::listing_status, '{"propertyId":"hidden-quill-haven","listingId":"ls-1","title":"Hidden Quill Haven","category":"apartment","summary":"","description":"","location":{"city":"New York","country":"USA","postal":"10011","neighbourhood":""},"capacity":{"guests":4,"rooms":2,"beds":2,"baths":2,"area":1500},"amenities":["wifi","kitchen","parking","airConditioning","workspace","breakfast"],"equipment":["air-conditioning","garden","heating","lift","non-smoking-rooms","parking","safe","shared-kitchen","terrace"],"photos":[],"pricing":{"nightlyUsd":246,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":true,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'hidden-quill-haven';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-2', 'coastal-haven-lodge', pr.host_id, 'published'::listing_status, '{"propertyId":"coastal-haven-lodge","listingId":"ls-2","title":"Coastal Haven Lodge","category":"lodge","summary":"","description":"","location":{"city":"Andalusia","country":"Spain","postal":"29601","neighbourhood":""},"capacity":{"guests":5,"rooms":3,"beds":3,"baths":2,"area":1600},"amenities":["wifi","kitchen","pool","airConditioning","workspace","petFriendly"],"equipment":["air-conditioning","bbq-facilities","family-rooms","garden","hiking","indoor-fireplace","parking","safe","sauna","terrace"],"photos":[],"pricing":{"nightlyUsd":299,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'coastal-haven-lodge';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-3', 'brass-lantern-inn', pr.host_id, 'published'::listing_status, '{"propertyId":"brass-lantern-inn","listingId":"ls-3","title":"Brass Lantern Inn","category":"hotel","summary":"","description":"","location":{"city":"Paris","country":"France","postal":"75004","neighbourhood":""},"capacity":{"guests":6,"rooms":3,"beds":3,"baths":2,"area":1500},"amenities":["wifi","kitchen","pool","parking","workspace","petFriendly","breakfast"],"equipment":["24-hour-front-desk","bar","breakfast","concierge-service","garden","heating","laundry","lift","parking","restaurant","room-service","safe"],"photos":[],"pricing":{"nightlyUsd":325,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'brass-lantern-inn';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-4', 'golden-willowbrook', pr.host_id, 'published'::listing_status, '{"propertyId":"golden-willowbrook","listingId":"ls-4","title":"Golden Willowbrook Mansion","category":"resort","summary":"","description":"","location":{"city":"Miami","country":"USA","postal":"33139","neighbourhood":""},"capacity":{"guests":5,"rooms":3,"beds":3,"baths":2,"area":1500},"amenities":["wifi","kitchen","pool","parking","airConditioning","petFriendly","breakfast"],"equipment":["airport-shuttle","bar","breakfast","fitness-centre","garden","heating","kids-club","restaurant","spa","sun-loungers-or-beach-chairs","swimming-pool","terrace"],"photos":[],"pricing":{"nightlyUsd":249,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":true,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'golden-willowbrook';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-5', 'the-verdant-frame', pr.host_id, 'draft'::listing_status, '{"propertyId":"the-verdant-frame","listingId":"ls-5","title":"The Verdant Frame","category":"lodge","summary":"","description":"","location":{"city":"Jakarta","country":"Indonesia","postal":"12920","neighbourhood":""},"capacity":{"guests":5,"rooms":2,"beds":2,"baths":2,"area":1500},"amenities":["wifi","kitchen","parking","airConditioning","workspace","breakfast"],"equipment":["air-conditioning","bbq-facilities","family-rooms","garden","heating","hiking","indoor-fireplace","parking","sauna","terrace"],"photos":[],"pricing":{"nightlyUsd":330,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"draft"}'::jsonb
  FROM property pr WHERE pr.id = 'the-verdant-frame';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-6', 'silver-fern-estate', pr.host_id, 'suspended'::listing_status, '{"propertyId":"silver-fern-estate","listingId":"ls-6","title":"Silver Fern Estate","category":"hotel","summary":"","description":"","location":{"city":"Lisbon","country":"Portugal","postal":"1200-109","neighbourhood":""},"capacity":{"guests":4,"rooms":2,"beds":2,"baths":2,"area":1500},"amenities":["wifi","kitchen","pool","airConditioning","workspace","petFriendly","breakfast"],"equipment":["24-hour-front-desk","air-conditioning","bar","breakfast","concierge-service","garden","laundry","lift","restaurant","room-service","safe","terrace"],"photos":[],"pricing":{"nightlyUsd":359,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"suspended"}'::jsonb
  FROM property pr WHERE pr.id = 'silver-fern-estate';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-7', 'azure-tide-loft', pr.host_id, 'published'::listing_status, '{"propertyId":"azure-tide-loft","listingId":"ls-7","title":"Azure Tide Loft","category":"apartment","summary":"","description":"","location":{"city":"Barcelona","country":"Spain","postal":"08003","neighbourhood":""},"capacity":{"guests":3,"rooms":2,"beds":2,"baths":1,"area":980},"amenities":["wifi","kitchen","pool","parking","workspace","petFriendly","breakfast"],"equipment":["air-conditioning","garden","heating","lift","non-smoking-rooms","parking","safe","shared-kitchen","terrace"],"photos":[],"pricing":{"nightlyUsd":189,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":true,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'azure-tide-loft';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-8', 'cedar-hollow-cabin', pr.host_id, 'published'::listing_status, '{"propertyId":"cedar-hollow-cabin","listingId":"ls-8","title":"Cedar Hollow Cabin","category":"lodge","summary":"","description":"","location":{"city":"Aspen","country":"USA","postal":"81611","neighbourhood":""},"capacity":{"guests":6,"rooms":4,"beds":4,"baths":3,"area":2100},"amenities":["wifi","kitchen","pool","parking","airConditioning","petFriendly","breakfast"],"equipment":["air-conditioning","bbq-facilities","family-rooms","garden","hiking","indoor-fireplace","non-smoking-rooms","parking","sauna","terrace"],"photos":[],"pricing":{"nightlyUsd":388,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'cedar-hollow-cabin';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-9', 'marble-court-suites', pr.host_id, 'published'::listing_status, '{"propertyId":"marble-court-suites","listingId":"ls-9","title":"Marble Court Suites","category":"hotel","summary":"","description":"","location":{"city":"Rome","country":"Italy","postal":"00186","neighbourhood":""},"capacity":{"guests":2,"rooms":1,"beds":1,"baths":1,"area":720},"amenities":["wifi","kitchen","parking","airConditioning","workspace","breakfast"],"equipment":["24-hour-front-desk","bar","breakfast","concierge-service","family-rooms","heating","laundry","lift","non-smoking-rooms","restaurant","room-service","safe"],"photos":[],"pricing":{"nightlyUsd":212,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'marble-court-suites';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-10', 'palm-quarter-villa', pr.host_id, 'published'::listing_status, '{"propertyId":"palm-quarter-villa","listingId":"ls-10","title":"Palm Quarter Villa","category":"resort","summary":"","description":"","location":{"city":"Dubai","country":"UAE","postal":"00000","neighbourhood":""},"capacity":{"guests":8,"rooms":4,"beds":4,"baths":4,"area":3200},"amenities":["wifi","kitchen","pool","airConditioning","workspace","petFriendly"],"equipment":["airport-shuttle","bar","breakfast","fitness-centre","garden","heating","kids-club","non-smoking-rooms","restaurant","spa","sun-loungers-or-beach-chairs","swimming-pool"],"photos":[],"pricing":{"nightlyUsd":399,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":true,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'palm-quarter-villa';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-11', 'harbour-light-studio', pr.host_id, 'published'::listing_status, '{"propertyId":"harbour-light-studio","listingId":"ls-11","title":"Harbour Light Studio","category":"apartment","summary":"","description":"","location":{"city":"Copenhagen","country":"Denmark","postal":"1050","neighbourhood":""},"capacity":{"guests":2,"rooms":1,"beds":1,"baths":1,"area":640},"amenities":["wifi","kitchen","pool","parking","workspace","petFriendly","breakfast"],"equipment":["air-conditioning","family-rooms","garden","heating","lift","non-smoking-rooms","parking","shared-kitchen","terrace"],"photos":[],"pricing":{"nightlyUsd":168,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'harbour-light-studio';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-12', 'olive-grove-retreat', pr.host_id, 'published'::listing_status, '{"propertyId":"olive-grove-retreat","listingId":"ls-12","title":"Olive Grove Retreat","category":"lodge","summary":"","description":"","location":{"city":"Crete","country":"Greece","postal":"71202","neighbourhood":""},"capacity":{"guests":6,"rooms":3,"beds":3,"baths":2,"area":1750},"amenities":["wifi","kitchen","pool","parking","airConditioning","petFriendly","breakfast"],"equipment":["air-conditioning","bbq-facilities","garden","heating","hiking","indoor-fireplace","non-smoking-rooms","parking","sauna","terrace"],"photos":[],"pricing":{"nightlyUsd":264,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'olive-grove-retreat';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-13', 'kyoto-paper-house', pr.host_id, 'published'::listing_status, '{"propertyId":"kyoto-paper-house","listingId":"ls-13","title":"Kyoto Paper House","category":"apartment","summary":"","description":"","location":{"city":"Kyoto","country":"Japan","postal":"604-8006","neighbourhood":""},"capacity":{"guests":3,"rooms":2,"beds":2,"baths":1,"area":860},"amenities":["wifi","kitchen","parking","airConditioning","workspace","breakfast"],"equipment":["air-conditioning","family-rooms","garden","heating","lift","non-smoking-rooms","parking","shared-kitchen","terrace"],"photos":[],"pricing":{"nightlyUsd":231,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":true,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'kyoto-paper-house';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-14', 'the-copper-townhouse', pr.host_id, 'published'::listing_status, '{"propertyId":"the-copper-townhouse","listingId":"ls-14","title":"The Copper Townhouse","category":"apartment","summary":"","description":"","location":{"city":"London","country":"UK","postal":"SW1A 1AA","neighbourhood":""},"capacity":{"guests":5,"rooms":3,"beds":3,"baths":2,"area":1400},"amenities":["wifi","kitchen","pool","airConditioning","workspace","petFriendly"],"equipment":["air-conditioning","family-rooms","garden","heating","lift","non-smoking-rooms","parking","shared-kitchen","terrace"],"photos":[],"pricing":{"nightlyUsd":342,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'the-copper-townhouse';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-15', 'sunset-dune-resort', pr.host_id, 'published'::listing_status, '{"propertyId":"sunset-dune-resort","listingId":"ls-15","title":"Sunset Dune Resort","category":"resort","summary":"","description":"","location":{"city":"Tulum","country":"Mexico","postal":"77780","neighbourhood":""},"capacity":{"guests":4,"rooms":2,"beds":2,"baths":2,"area":1250},"amenities":["wifi","kitchen","pool","parking","workspace","petFriendly","breakfast"],"equipment":["airport-shuttle","bar","breakfast","fitness-centre","heating","kids-club","non-smoking-rooms","restaurant","spa","sun-loungers-or-beach-chairs","swimming-pool","terrace"],"photos":[],"pricing":{"nightlyUsd":276,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'sunset-dune-resort';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-16', 'north-fjord-cabin', pr.host_id, 'published'::listing_status, '{"propertyId":"north-fjord-cabin","listingId":"ls-16","title":"North Fjord Cabin","category":"lodge","summary":"","description":"","location":{"city":"Bergen","country":"Norway","postal":"5003","neighbourhood":""},"capacity":{"guests":4,"rooms":2,"beds":2,"baths":1,"area":1100},"amenities":["wifi","kitchen","pool","parking","airConditioning","petFriendly","breakfast"],"equipment":["air-conditioning","bbq-facilities","garden","heating","hiking","indoor-fireplace","parking","safe","sauna","terrace"],"photos":[],"pricing":{"nightlyUsd":221,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":true,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'north-fjord-cabin';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-17', 'the-gallery-flat', pr.host_id, 'published'::listing_status, '{"propertyId":"the-gallery-flat","listingId":"ls-17","title":"The Gallery Flat","category":"apartment","summary":"","description":"","location":{"city":"Berlin","country":"Germany","postal":"10119","neighbourhood":""},"capacity":{"guests":4,"rooms":2,"beds":2,"baths":1,"area":1050},"amenities":["wifi","kitchen","parking","airConditioning","workspace","breakfast"],"equipment":["air-conditioning","family-rooms","garden","heating","lift","non-smoking-rooms","parking","shared-kitchen","terrace"],"photos":[],"pricing":{"nightlyUsd":174,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'the-gallery-flat';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-18', 'porto-river-suites', pr.host_id, 'published'::listing_status, '{"propertyId":"porto-river-suites","listingId":"ls-18","title":"Porto River Suites","category":"hotel","summary":"","description":"","location":{"city":"Porto","country":"Portugal","postal":"4050-011","neighbourhood":""},"capacity":{"guests":3,"rooms":2,"beds":2,"baths":1,"area":900},"amenities":["wifi","kitchen","pool","airConditioning","workspace","petFriendly","breakfast"],"equipment":["24-hour-front-desk","air-conditioning","bar","breakfast","concierge-service","heating","laundry","lift","restaurant","room-service","safe","terrace"],"photos":[],"pricing":{"nightlyUsd":198,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'porto-river-suites';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-19', 'table-mountain-lodge', pr.host_id, 'published'::listing_status, '{"propertyId":"table-mountain-lodge","listingId":"ls-19","title":"Table Mountain Lodge","category":"lodge","summary":"","description":"","location":{"city":"Cape Town","country":"South Africa","postal":"8001","neighbourhood":""},"capacity":{"guests":7,"rooms":4,"beds":4,"baths":3,"area":2400},"amenities":["wifi","kitchen","pool","parking","workspace","petFriendly","breakfast"],"equipment":["bbq-facilities","family-rooms","garden","heating","hiking","indoor-fireplace","non-smoking-rooms","parking","sauna","terrace"],"photos":[],"pricing":{"nightlyUsd":312,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":true,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'table-mountain-lodge';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-20', 'the-orchid-residence', pr.host_id, 'published'::listing_status, '{"propertyId":"the-orchid-residence","listingId":"ls-20","title":"The Orchid Residence","category":"hotel","summary":"","description":"","location":{"city":"Singapore","country":"Singapore","postal":"249715","neighbourhood":""},"capacity":{"guests":2,"rooms":1,"beds":1,"baths":1,"area":700},"amenities":["wifi","kitchen","pool","parking","airConditioning","petFriendly","breakfast"],"equipment":["24-hour-front-desk","air-conditioning","bar","breakfast","concierge-service","family-rooms","heating","laundry","lift","restaurant","room-service","safe"],"photos":[],"pricing":{"nightlyUsd":289,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'the-orchid-residence';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-21', 'bosphorus-blue-house', pr.host_id, 'published'::listing_status, '{"propertyId":"bosphorus-blue-house","listingId":"ls-21","title":"Bosphorus Blue House","category":"apartment","summary":"","description":"","location":{"city":"Istanbul","country":"Türkiye","postal":"34433","neighbourhood":""},"capacity":{"guests":5,"rooms":3,"beds":3,"baths":2,"area":1320},"amenities":["wifi","kitchen","parking","airConditioning","workspace","breakfast"],"equipment":["air-conditioning","garden","heating","lift","non-smoking-rooms","parking","safe","shared-kitchen","terrace"],"photos":[],"pricing":{"nightlyUsd":183,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'bosphorus-blue-house';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-22', 'highland-stone-barn', pr.host_id, 'published'::listing_status, '{"propertyId":"highland-stone-barn","listingId":"ls-22","title":"Highland Stone Barn","category":"lodge","summary":"","description":"","location":{"city":"Edinburgh","country":"UK","postal":"EH1 1RE","neighbourhood":""},"capacity":{"guests":6,"rooms":3,"beds":3,"baths":2,"area":1680},"amenities":["wifi","kitchen","pool","airConditioning","workspace","petFriendly"],"equipment":["air-conditioning","bbq-facilities","family-rooms","garden","heating","hiking","indoor-fireplace","parking","sauna","terrace"],"photos":[],"pricing":{"nightlyUsd":207,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":true,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'highland-stone-barn';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-23', 'sydney-cove-apartment', pr.host_id, 'published'::listing_status, '{"propertyId":"sydney-cove-apartment","listingId":"ls-23","title":"Sydney Cove Apartment","category":"apartment","summary":"","description":"","location":{"city":"Sydney","country":"Australia","postal":"2000","neighbourhood":""},"capacity":{"guests":4,"rooms":2,"beds":2,"baths":2,"area":1180},"amenities":["wifi","kitchen","pool","parking","workspace","petFriendly","breakfast"],"equipment":["air-conditioning","family-rooms","garden","lift","non-smoking-rooms","parking","safe","shared-kitchen","terrace"],"photos":[],"pricing":{"nightlyUsd":258,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":true,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'sydney-cove-apartment';
INSERT INTO listing_submission (listing_id, property_id, submitted_by, status, payload)
SELECT 'ls-24', 'cyclades-white-resort', pr.host_id, 'published'::listing_status, '{"propertyId":"cyclades-white-resort","listingId":"ls-24","title":"Cyclades White Resort","category":"resort","summary":"","description":"","location":{"city":"Santorini","country":"Greece","postal":"84700","neighbourhood":""},"capacity":{"guests":4,"rooms":2,"beds":2,"baths":2,"area":1350},"amenities":["wifi","kitchen","pool","parking","airConditioning","petFriendly","breakfast"],"equipment":["air-conditioning","airport-shuttle","bar","breakfast","family-rooms","fitness-centre","kids-club","restaurant","safe","spa","sun-loungers-or-beach-chairs","swimming-pool"],"photos":[],"pricing":{"nightlyUsd":374,"cleaningFeeUsd":0,"minNights":1,"longStay":{"enabled":false,"threshold":7,"discount":10},"mobile":{"enabled":false,"discount":5}},"policies":{"cancellationPolicy":"moderate","houseRules":"","checkIn":"15:00","checkOut":"11:00","instantBook":false},"status":"published"}'::jsonb
  FROM property pr WHERE pr.id = 'cyclades-white-resort';

-- Payout lines: completed stays settled in the first payout
INSERT INTO payout_item (payout_id, booking_id, amount_usd) VALUES ('po-1', 'bk-3', 1436);

-- Favourites (src/routes/favourites.tsx) — demo guest saves two places
INSERT INTO favorite (user_id, property_id)
SELECT id, 'hidden-quill-haven' FROM app_user WHERE legacy_id = 'u-2' ON CONFLICT DO NOTHING;
INSERT INTO favorite (user_id, property_id)
SELECT id, 'coastal-haven-lodge' FROM app_user WHERE legacy_id = 'u-2' ON CONFLICT DO NOTHING;

-- Cookie banner choices (src/hooks/usePlatform.ts :: cookiesChoice)
INSERT INTO cookie_consent (user_id, choice)
SELECT id, 'accepted'::cookie_choice FROM app_user WHERE legacy_id = 'u-2';
INSERT INTO cookie_consent (device_id, choice) VALUES ('device-demo-1', 'essential'::cookie_choice);

-- Admin moderation trail (src/routes/admin.tsx): suspended user + hidden review
INSERT INTO moderation_log (admin_id, action, target_kind, target_id, reason)
SELECT id, 'user_suspended'::moderation_action, 'user', 'u-4', 'Repeated policy breaches'
  FROM app_user WHERE legacy_id = 'u-5';

-- Per-host override of the global rate rules (host dashboard)
INSERT INTO host_rate_rules (host_id, weekend_percent, long_stay_percent, last_minute_percent)
SELECT hp.user_id, 15, 10, 5
  FROM host_profile hp JOIN app_user u ON u.id = hp.user_id WHERE u.legacy_id = 'u-1'
ON CONFLICT (host_id) DO NOTHING;

-- FX fallback rates (src/routes/api/public/exchange-rates.ts)
INSERT INTO exchange_rate (base_currency, quote_currency, rate) VALUES
  ('EUR', 'EUR', 1),
  ('EUR', 'USD', 1.09),
  ('EUR', 'GBP', 0.86),
  ('EUR', 'CHF', 0.96),
  ('EUR', 'BRL', 5.9)
ON CONFLICT (base_currency, quote_currency) DO UPDATE SET rate = EXCLUDED.rate;

-- Demo host login owns a few real places, so guest <-> host messaging can be
-- tried end to end with the demo accounts (host@nestara.test).
INSERT INTO host_profile (user_id, display_name, hosting_since, superhost)
SELECT id, 'Hana Host', 2020, true FROM app_user WHERE email = 'host@nestara.test'
ON CONFLICT (user_id) DO NOTHING;

UPDATE property SET host_id = (SELECT id FROM app_user WHERE email = 'host@nestara.test')
WHERE EXISTS (SELECT 1 FROM app_user WHERE email = 'host@nestara.test')
  AND id IN (SELECT id FROM property ORDER BY id LIMIT 3);

COMMIT;

-- ---------------------------------------------------------------------------
-- Demo copy + photos for every seeded place.
-- Without these a host cannot re-save a demo listing (the publish check asks
-- for a summary and at least one photo) and the cards have no image.
-- ---------------------------------------------------------------------------

UPDATE property SET
  summary = COALESCE(NULLIF(summary, ''),
    name || ' is a bright ' || category::text || ' in ' || city || ', ' || country ||
    ', set up for ' || guests || ' guests with ' || rooms || ' rooms and ' || beds || ' beds.'),
  description = COALESCE(NULLIF(description, ''),
    'Stay at ' || name || ' in ' || city || '. The space sleeps ' || guests ||
    ' across ' || rooms || ' rooms with ' || baths || ' bathrooms, and sits close to the cafes, ' ||
    'transport and sights that make ' || city || ' worth the trip. Self check-in, fast wifi and a ' ||
    'calm place to work or unwind after a long day out.')
WHERE summary IS NULL OR summary = '' OR description IS NULL OR description = '';

INSERT INTO property_photo (property_id, url, alt_text, position)
SELECT p.id, u.url, p.name || ' photo ' || u.ord, (u.ord - 1)::int
FROM property p
CROSS JOIN LATERAL unnest(
    CASE p.category::text
      WHEN 'villa' THEN ARRAY[
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80']
      WHEN 'resort' THEN ARRAY[
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80']
      WHEN 'hotel' THEN ARRAY[
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1600&q=80']
      WHEN 'lodge' THEN ARRAY[
        'https://images.unsplash.com/photo-1518602164578-cd0074062767?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80']
      WHEN 'chalet' THEN ARRAY[
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80']
      WHEN 'riad' THEN ARRAY[
        'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1600&q=80']
      WHEN 'guesthouse' THEN ARRAY[
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80']
      WHEN 'bungalow' THEN ARRAY[
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80']
      WHEN 'studio' THEN ARRAY[
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80']
      WHEN 'hostel' THEN ARRAY[
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80']
      WHEN 'camping' THEN ARRAY[
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1487730116645-74489c95b41b?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1471115853179-bb1d604434e0?auto=format&fit=crop&w=1600&q=80']
      ELSE ARRAY[
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80']
    END
  ) WITH ORDINALITY AS u(url, ord)
WHERE NOT EXISTS (SELECT 1 FROM property_photo pp WHERE pp.property_id = p.id);
