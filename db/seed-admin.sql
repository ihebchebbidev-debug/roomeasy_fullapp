-- =============================================================================
-- Nestara / Roomeasy — back-office demo data
-- Run AFTER db/schema.sql and db/seed.sql. Fills the administrator modules
-- (reports queue, support desk, identity checks, per-host commission, refunds,
-- notification queue) so every back-office screen has realistic content.
-- =============================================================================

BEGIN;

-- Listing reports sent by guests ---------------------------------------------
INSERT INTO listing_report (listing_id, reported_by, reporter_name, reason, details, status)
SELECT 'ls-2', u.id, u.full_name, 'wrong_information',
       'Les photos ne correspondent pas au logement reçu.', 'open'
  FROM app_user u WHERE u.legacy_id = 'u-2'
  AND EXISTS (SELECT 1 FROM listing WHERE id = 'ls-2')
ON CONFLICT DO NOTHING;

INSERT INTO listing_report (listing_id, reported_by, reporter_name, reason, details, status)
SELECT 'ls-3', u.id, u.full_name, 'unavailable',
       'The host said the flat was not available for the dates shown online.', 'reviewing'
  FROM app_user u WHERE u.legacy_id = 'u-3'
  AND EXISTS (SELECT 1 FROM listing WHERE id = 'ls-3')
ON CONFLICT DO NOTHING;

INSERT INTO listing_report (listing_id, reported_by, reporter_name, reason, details, status, resolution, handled_at)
SELECT 'ls-4', u.id, u.full_name, 'inappropriate',
       'Description with discriminatory wording.', 'resolved',
       'Wording removed by the host after a warning.', now() - interval '3 days'
  FROM app_user u WHERE u.legacy_id = 'u-2'
  AND EXISTS (SELECT 1 FROM listing WHERE id = 'ls-4')
ON CONFLICT DO NOTHING;

-- Support tickets and their conversations ------------------------------------
INSERT INTO support_ticket (reference, subject, category, priority, status, opened_by, opened_by_name, opened_by_role, booking_id)
SELECT 'TK-1001', 'Double débit sur ma réservation', 'payment', 'high', 'open',
       u.id, u.full_name, 'guest', 'bk-1'
  FROM app_user u WHERE u.legacy_id = 'u-2'
ON CONFLICT (reference) DO NOTHING;

INSERT INTO support_ticket (reference, subject, category, priority, status, opened_by, opened_by_name, opened_by_role, listing_id)
SELECT 'TK-1002', 'Dispute with a guest about cleaning', 'dispute', 'normal', 'pending',
       u.id, u.full_name, 'host', 'ls-1'
  FROM app_user u WHERE u.legacy_id = 'u-1'
ON CONFLICT (reference) DO NOTHING;

INSERT INTO support_ticket (reference, subject, category, priority, status, opened_by, opened_by_name, opened_by_role, resolution, closed_at)
SELECT 'TK-1003', 'Cannot change my e-mail address', 'account', 'low', 'resolved',
       u.id, u.full_name, 'guest', 'Address changed by the support team.', now() - interval '6 days'
  FROM app_user u WHERE u.legacy_id = 'u-3'
ON CONFLICT (reference) DO NOTHING;

INSERT INTO support_ticket_message (ticket_id, author_id, author_name, author_role, body, internal_note, sent_at)
SELECT t.id, t.opened_by, t.opened_by_name, t.opened_by_role,
       'Ma carte a été débitée deux fois pour la même réservation, pouvez-vous vérifier ?', false, t.created_at
  FROM support_ticket t WHERE t.reference = 'TK-1001'
ON CONFLICT DO NOTHING;

INSERT INTO support_ticket_message (ticket_id, author_id, author_name, author_role, body, internal_note, sent_at)
SELECT t.id, a.id, a.full_name, 'admin',
       'Bonjour, nous vérifions auprès du prestataire de paiement et revenons vers vous aujourd''hui.', false, t.created_at + interval '2 hours'
  FROM support_ticket t, app_user a
 WHERE t.reference = 'TK-1001' AND a.email = 'admin@nestara.test'
ON CONFLICT DO NOTHING;

INSERT INTO support_ticket_message (ticket_id, author_id, author_name, author_role, body, internal_note, sent_at)
SELECT t.id, a.id, a.full_name, 'admin',
       'Internal: duplicate charge confirmed, refund the second payment.', true, t.created_at + interval '3 hours'
  FROM support_ticket t, app_user a
 WHERE t.reference = 'TK-1001' AND a.email = 'admin@nestara.test'
ON CONFLICT DO NOTHING;

INSERT INTO support_ticket_message (ticket_id, author_id, author_name, author_role, body, internal_note, sent_at)
SELECT t.id, t.opened_by, t.opened_by_name, t.opened_by_role,
       'The guest left the kitchen in a poor state and refuses to pay the cleaning fee.', false, t.created_at
  FROM support_ticket t WHERE t.reference = 'TK-1002'
ON CONFLICT DO NOTHING;

INSERT INTO support_ticket_message (ticket_id, author_id, author_name, author_role, body, internal_note, sent_at)
SELECT t.id, t.opened_by, t.opened_by_name, t.opened_by_role,
       'I still cannot change the address on my account.', false, t.created_at
  FROM support_ticket t WHERE t.reference = 'TK-1003'
ON CONFLICT DO NOTHING;

-- Identity verification queue -------------------------------------------------
INSERT INTO identity_verification (user_id, status, document_kind, document_reference, notes)
SELECT u.id, 'pending', 'passport', 'DOC-2026-0001', 'Submitted at sign-up.'
  FROM app_user u WHERE u.legacy_id = 'u-2'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO identity_verification (user_id, status, document_kind, document_reference, notes)
SELECT u.id, 'pending', 'id_card', 'DOC-2026-0002', 'Host awaiting validation before first publication.'
  FROM app_user u WHERE u.legacy_id = 'u-1'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO identity_verification (user_id, status, document_kind, document_reference, notes, decided_by, decided_at)
SELECT u.id, 'verified', 'id_card', 'DOC-2025-0088', 'Document valid.',
       a.id, now() - interval '20 days'
  FROM app_user u, app_user a
 WHERE u.legacy_id = 'u-5' AND a.email = 'admin@nestara.test'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO identity_verification (user_id, status, document_kind, document_reference, notes, decided_by, decided_at)
SELECT u.id, 'rejected', 'driving_licence', 'DOC-2025-0140', 'Blurred photo, new document requested.',
       a.id, now() - interval '9 days'
  FROM app_user u, app_user a
 WHERE u.legacy_id = 'u-4' AND a.email = 'admin@nestara.test'
ON CONFLICT (user_id) DO NOTHING;

-- Per-host commission agreements ---------------------------------------------
INSERT INTO host_commission (host_id, commission_rate, note, set_by)
SELECT h.id, 9.50, 'Volume agreement — more than 40 nights a month.', a.id
  FROM app_user h, app_user a
 WHERE h.legacy_id = 'u-1' AND a.email = 'admin@nestara.test'
ON CONFLICT (host_id) DO NOTHING;

INSERT INTO host_commission (host_id, commission_rate, note, set_by)
SELECT h.id, 15.00, 'Trial period rate for a new host.', a.id
  FROM app_user h, app_user a
 WHERE h.email = 'host@nestara.test' AND a.email = 'admin@nestara.test'
ON CONFLICT (host_id) DO NOTHING;

-- A refund already issued by the accounting team ------------------------------
INSERT INTO booking_refund (booking_id, amount_usd, reason, issued_by, created_at)
SELECT 'bk-4', 120.00, 'Partial refund — heating out of order on the first night.', a.id, now() - interval '5 days'
  FROM app_user a WHERE a.email = 'admin@nestara.test'
  AND EXISTS (SELECT 1 FROM booking WHERE id = 'bk-4')
ON CONFLICT DO NOTHING;

-- Notification queue ----------------------------------------------------------
INSERT INTO notification_outbox (recipient_id, recipient_email, template, locale, subject, body, status, sent_at)
SELECT u.id, u.email, 'booking_confirmed', 'fr', 'Votre réservation est confirmée',
       'Votre réservation RE-BK1 est confirmée. Bon séjour !', 'sent', now() - interval '4 days'
  FROM app_user u WHERE u.legacy_id = 'u-2'
ON CONFLICT DO NOTHING;

INSERT INTO notification_outbox (recipient_id, recipient_email, template, locale, subject, body, status)
SELECT u.id, u.email, 'listing_suspended', 'en', 'Your listing was taken offline',
       'Your listing was taken offline: photos do not match the description.', 'queued'
  FROM app_user u WHERE u.legacy_id = 'u-1'
ON CONFLICT DO NOTHING;

INSERT INTO notification_outbox (recipient_id, recipient_email, template, locale, subject, body, status, attempts, error_message, last_attempt_at)
SELECT u.id, u.email, 'booking_refunded', 'en', 'A refund has been issued',
       'We refunded 120 USD on booking RE-BK4.', 'failed', 3, 'SMTP credentials not configured yet', now() - interval '1 hour'
  FROM app_user u WHERE u.legacy_id = 'u-3'
ON CONFLICT DO NOTHING;

COMMIT;
