# Roadmap — admin back office

- [x] Users list: identity status highlighted + filter, click opens full member page (identity proof, validate/refuse, listings, trips)
- [x] Remove separate "Identity verification" section
- [x] Cities: country as a dropdown from the countries list
- [x] Team & access page: show only admin/staff users
- [x] Top summary cards only on the Dashboard
- [ ] Redeploy server so identity status per member and guest trips appear (blocked: user redeploy)
- [x] Réglages: email (SMTP), Stripe keys, fees & pricing editable, with Test email / Test Stripe
- [ ] Redeploy server so the new Réglages sections can load and save (blocked: user redeploy)
- [x] Search, filter and show-more (30 at a time) on every admin list
- [x] Search/filter/show-more on host listings, requests, payouts, reviews and guest trips
- [ ] Annonces signalées: show listing images
- [ ] Users (admin.tsx:374 area): add numbers the user pointed at
- [x] Listing galleries: never mix in photos from other users or retain removed secondary photos
- [x] New listing identifiers: generate collision-resistant ids on the server and block cross-host overwrites
