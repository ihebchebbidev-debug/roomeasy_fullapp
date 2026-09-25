# Roadmap — spec compliance fixes (audit Sep 2026)

- [x] Remove fake card payment path (checkout form, backend card field, mock PSP)
- [x] Freeze commission rate on each booking; payments + finance use frozen rate
- [x] Admin access to guest–host conversation: only via open ticket/dispute for that booking, logged in audit log; ticket links to thread
- [x] Invoices in the booking's currency (all prices are EUR; bookings now labelled EUR)
- [x] Admin 2FA enforced at login when enabled
- [x] Email verification on sign-up (send link, confirm endpoint, page)
- [ ] Host team permissions enforced (team members act with scoped access)
- [x] Report a review (guest/host) → support desk "review" ticket
- [x] Pricing parity check script between the two engine copies
- [x] Login rate limit survives restarts (DB-backed)
- [x] Brand design system: teal/paper/gold, Fraunces/Inter/Space Mono
- [x] Home page title/description per language
- [ ] Search filters: pets, accessibility, stay length, instant book, free cancellation, map/radius
- [ ] Verify: language auto-detect, translation completeness, daily FX rate fallback, photo storage
- [ ] Money in minor units (blocked: needs user decision — large data migration)
- [ ] Redeploy Node server so backend fixes go live (blocked: user redeploy)

## Earlier
- [ ] Annonces signalées: show listing images
- [ ] Users (admin.tsx:374 area): add numbers the user pointed at

## Sep 25 — pricing / multilingual SEO / currencies
- [ ] Smart pricing: verify rules end to end, fix gaps
- [ ] Per-language URLs (/fr/...), hreflang, canonical, html lang, multilingual sitemap
- [ ] Structured data: LodgingBusiness, BreadcrumbList, Organization/WebSite
- [ ] Host listing currency + conversion from listing currency + booking stores currency & FX
- [ ] Admin finance grouped by currency
