# Full administrator QA and repair

## Scope
- Sign in with the provided administrator account and test every administrator section, page, modal, button, filter, and form.
- Exercise safe create, read, update, and delete flows for catalogue data, users, support, team roles, settings, content pages, reviews, listings, reservations, finance, commissions, payouts, notifications, and integrations.
- Re-test the previously untested actions: listing approval/rejection, listing reports, reservation date/amount changes, commissions, queued emails, payment/email tests, and payouts.
- Capture a screenshot at each meaningful step and keep a clear result matrix of passed, failed, blocked, and restored test data.

## Safety
- Use uniquely named QA records and remove or restore them after verification.
- Do not trigger real customer emails, payments, refunds, or payouts unless the interface is explicitly in test mode; otherwise verify validation and disabled/safety states.
- Preserve existing production data and administrator access.

## Fix and verify
- Reproduce each defect before changing it.
- Fix only verified issues, then repeat the affected browser journey.
- Check desktop and mobile layouts, browser console/network failures, accessibility of dialogs, and the final build.

## Deliverable
- A concise QA report listing tested areas, fixes made, remaining external blockers, and the screenshot folder/archive.
