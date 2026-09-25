-- =====================================================================
-- Test data: support tickets (+ conversation messages), listing reports
-- and guest reviews, so the admin screens (Support, Moderation, Reviews)
-- are never empty.
--
-- Uses the members, properties, listings and bookings ALREADY in your
-- database — run it after seed.sql / seed:demo.
-- Safe to re-run: it first deletes only the rows it created itself
-- (tickets "TK-TEST-*", reviews "rv-test-*", reports tagged [TEST]).
--
--   psql "$DATABASE_URL" -f db/seed-test-tickets-reviews.sql
-- =====================================================================
BEGIN;

-- 1. Clean previous test rows ---------------------------------------
DELETE FROM support_ticket WHERE reference LIKE 'TK-TEST-%';
DELETE FROM listing_report WHERE details LIKE '[TEST]%';
DELETE FROM review WHERE id LIKE 'rv-test-%';

DO $$
DECLARE
  guests   uuid[];
  gnames   text[];
  hosts    uuid[];
  hnames   text[];
  staff    uuid[];
  props    text[];
  lists    text[];
  books    text[];
  n_g int; n_h int; n_s int; n_p int; n_l int; n_b int;
  i int;
  t_id uuid;
  g int;
  cats   text[] := ARRAY['booking','payment','listing','account','dispute','review','other'];
  prios  text[] := ARRAY['low','normal','normal','high','urgent'];
  stats  text[] := ARRAY['open','open','pending','awaiting_reply','escalated','resolved','closed'];
  subjects text[] := ARRAY[
    'Je n''ai pas reçu ma confirmation de réservation',
    'Double prélèvement sur ma carte bancaire',
    'Les photos de l''annonce ne correspondent pas',
    'Impossible de modifier mon adresse e-mail',
    'Litige : logement sale à l''arrivée',
    'Avis injuste laissé par un voyageur',
    'Question sur les frais de service',
    'L''hôte ne répond plus à mes messages',
    'Remboursement après annulation non reçu',
    'Mon annonce est bloquée en validation',
    'Problème de connexion à mon compte',
    'Clés non remises à l''heure prévue',
    'Demande de facture pour mon entreprise',
    'Chauffage en panne pendant le séjour',
    'Versement hôte en retard',
    'Commentaire insultant sur mon logement',
    'Changer les dates de ma réservation',
    'Caution non restituée',
    'Signalement d''un comportement suspect',
    'Suggestion d''amélioration de la recherche'];
  bodies text[] := ARRAY[
    'Bonjour, pouvez-vous m''aider rapidement ? Merci d''avance.',
    'J''ai joint les détails, la situation n''est toujours pas réglée.',
    'Cela fait plusieurs jours que j''attends une réponse, c''est urgent.',
    'Merci de vérifier mon dossier, je reste disponible pour tout complément.'];
  review_txt text[] := ARRAY[
    'Séjour parfait, logement impeccable et hôte très réactif. Je recommande !',
    'Très bon emplacement, proche de tout. Literie un peu fatiguée.',
    'Correct pour le prix, mais le ménage laissait à désirer.',
    'Décevant : bruyant la nuit et wifi très lent.',
    'Magnifique vue, appartement lumineux, on reviendra sans hésiter.',
    'Arrivée autonome simple, tout était conforme à l''annonce.',
    'Hôte injoignable pendant deux jours, expérience moyenne.',
    'Superbe maison, idéale en famille. Cuisine très bien équipée.',
    'Arnaque totale, contactez-moi hors plateforme au 06 00 00 00 00 !!',
    'Rien à redire, rapport qualité/prix excellent.'];
  ratings int[] := ARRAY[5,4,3,2,5,5,2,5,1,4];
BEGIN
  SELECT array_agg(u.id ORDER BY u.created_at), array_agg(u.full_name ORDER BY u.created_at)
    INTO guests, gnames FROM app_user u
   WHERE EXISTS (SELECT 1 FROM user_role_grant r WHERE r.user_id = u.id AND r.role::text = 'guest');
  IF guests IS NULL THEN
    SELECT array_agg(id ORDER BY created_at), array_agg(full_name ORDER BY created_at) INTO guests, gnames FROM app_user;
  END IF;
  SELECT array_agg(u.id), array_agg(u.full_name) INTO hosts, hnames
    FROM app_user u JOIN host_profile h ON h.user_id = u.id;
  SELECT array_agg(DISTINCT r.user_id) INTO staff
    FROM user_role_grant r WHERE r.role::text IN ('admin','support','moderator');
  SELECT array_agg(id ORDER BY id) INTO props FROM property;
  SELECT array_agg(id ORDER BY id) INTO lists FROM listing;
  SELECT array_agg(id ORDER BY check_in DESC) INTO books FROM booking;

  n_g := coalesce(array_length(guests,1),0); n_h := coalesce(array_length(hosts,1),0);
  n_s := coalesce(array_length(staff,1),0);  n_p := coalesce(array_length(props,1),0);
  n_l := coalesce(array_length(lists,1),0);  n_b := coalesce(array_length(books,1),0);

  IF n_g = 0 OR n_p = 0 THEN
    RAISE EXCEPTION 'Need at least one user and one property — run seed.sql first.';
  END IF;

  -- 2. 20 support tickets with a short conversation each -------------
  FOR i IN 1..20 LOOP
    g := 1 + (i % n_g);
    INSERT INTO support_ticket
      (reference, subject, category, priority, status, opened_by, opened_by_name, opened_by_role,
       booking_id, listing_id, assigned_to, resolution, closed_at, last_activity_at, created_at)
    VALUES (
      'TK-TEST-' || lpad(i::text, 3, '0'),
      subjects[i],
      cats[1 + (i % 7)]::ticket_category,
      prios[1 + (i % 5)]::ticket_priority,
      stats[1 + (i % 7)]::ticket_status,
      CASE WHEN i % 4 = 0 AND n_h > 0 THEN hosts[1 + (i % n_h)] ELSE guests[g] END,
      CASE WHEN i % 4 = 0 AND n_h > 0 THEN hnames[1 + (i % n_h)] ELSE gnames[g] END,
      (CASE WHEN i % 4 = 0 AND n_h > 0 THEN 'host' ELSE 'guest' END)::actor_role,
      CASE WHEN n_b > 0 AND i % 2 = 1 THEN books[1 + (i % n_b)] END,
      CASE WHEN n_l > 0 AND i % 3 = 0 THEN lists[1 + (i % n_l)] END,
      CASE WHEN n_s > 0 AND i % 3 <> 1 THEN staff[1 + (i % n_s)] END,
      CASE WHEN stats[1 + (i % 7)] IN ('resolved','closed') THEN 'Problème résolu avec le membre, geste commercial accordé.' END,
      CASE WHEN stats[1 + (i % 7)] = 'closed' THEN now() - (i || ' hours')::interval END,
      now() - (i * 3 || ' hours')::interval,
      now() - (i || ' days')::interval
    ) RETURNING id INTO t_id;

    INSERT INTO support_ticket_message (ticket_id, author_id, author_name, author_role, body, internal_note, sent_at) VALUES
      (t_id, guests[g], gnames[g], 'guest', subjects[i] || '. ' || bodies[1 + (i % 4)], false, now() - (i || ' days')::interval),
      (t_id, CASE WHEN n_s > 0 THEN staff[1 + (i % n_s)] END, 'Équipe support', 'admin',
         'Bonjour, merci pour votre message. Nous étudions votre demande et revenons vers vous rapidement.', false,
         now() - (i || ' days')::interval + interval '2 hours');
    IF i % 2 = 0 THEN
      INSERT INTO support_ticket_message (ticket_id, author_id, author_name, author_role, body, internal_note, sent_at) VALUES
        (t_id, CASE WHEN n_s > 0 THEN staff[1] END, 'Équipe support', 'admin',
         'Note interne : vérifier le paiement Stripe et contacter l''hôte.', true,
         now() - (i || ' days')::interval + interval '3 hours'),
        (t_id, guests[g], gnames[g], 'guest', bodies[1 + ((i+1) % 4)], false,
         now() - (i || ' days')::interval + interval '5 hours');
    END IF;
  END LOOP;

  -- 3. 8 listing reports for the moderation queue ---------------------
  IF n_l > 0 THEN
    FOR i IN 1..8 LOOP
      g := 1 + (i % n_g);
      INSERT INTO listing_report (listing_id, reported_by, reporter_name, reason, details, status, resolution, handled_by, handled_at, created_at)
      VALUES (
        lists[1 + (i * 3 % n_l)], guests[g], gnames[g],
        (ARRAY['fraud','inappropriate','wrong_information','unavailable','safety','other'])[1 + (i % 6)]::report_reason,
        '[TEST] ' || (ARRAY['Prix suspect, demande de virement hors plateforme.','Photos trompeuses.','Adresse incorrecte.',
          'Logement jamais disponible.','Détecteur de fumée absent.','Autre problème signalé par un voyageur.'])[1 + (i % 6)],
        (ARRAY['open','open','reviewing','resolved','dismissed'])[1 + (i % 5)]::report_status,
        CASE WHEN i % 5 IN (3,4) THEN 'Traité par la modération.' END,
        CASE WHEN i % 5 IN (3,4) AND n_s > 0 THEN staff[1] END,
        CASE WHEN i % 5 IN (3,4) THEN now() - interval '1 day' END,
        now() - (i * 2 || ' days')::interval);
    END LOOP;
  END IF;

  -- 4. 30 reviews spread over properties (some hidden, some replied) --
  FOR i IN 1..30 LOOP
    g := 1 + (i % n_g);
    INSERT INTO review (id, property_id, booking_id, author_id, author_name, rating, body,
                        reply, replied_at, hidden, hidden_at, hidden_reason, created_on, created_at)
    VALUES (
      'rv-test-' || i,
      props[1 + (i % n_p)],
      NULL,
      guests[g], gnames[g],
      ratings[1 + (i % 10)],
      review_txt[1 + (i % 10)],
      CASE WHEN i % 3 = 0 THEN 'Merci beaucoup pour votre retour, au plaisir de vous accueillir à nouveau !' END,
      CASE WHEN i % 3 = 0 THEN now() - (i || ' days')::interval + interval '1 day' END,
      (i % 10 = 8),
      CASE WHEN i % 10 = 8 THEN now() - interval '1 day' END,
      CASE WHEN i % 10 = 8 THEN 'Coordonnées hors plateforme' END,
      CURRENT_DATE - (i * 4),
      now() - (i * 4 || ' days')::interval);
  END LOOP;
END $$;

-- 5. Refresh each property's average rating / review count ----------
UPDATE property p SET
  rating = coalesce(s.avg, 0),
  review_count = coalesce(s.cnt, 0)
FROM (SELECT property_id, round(avg(rating)::numeric, 2) AS avg, count(*) AS cnt
        FROM review WHERE NOT hidden GROUP BY property_id) s
WHERE s.property_id = p.id;

COMMIT;

SELECT 'tickets' AS what, count(*) FROM support_ticket WHERE reference LIKE 'TK-TEST-%'
UNION ALL SELECT 'ticket messages', count(*) FROM support_ticket_message m JOIN support_ticket t ON t.id = m.ticket_id WHERE t.reference LIKE 'TK-TEST-%'
UNION ALL SELECT 'listing reports', count(*) FROM listing_report WHERE details LIKE '[TEST]%'
UNION ALL SELECT 'reviews', count(*) FROM review WHERE id LIKE 'rv-test-%';
