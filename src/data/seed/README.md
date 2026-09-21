# Reference data

This folder no longer holds demo rows. Stays, bookings, listings, payouts,
reviews, users, threads, payouts and app settings all come from the service at
runtime (see `src/api/backend.ts`).

| File              | Purpose                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `equipment.json`  | The equipment & services catalogue from the client's reference document. |

Rules:

- No code, no imports, no computed values — the JSON must be importable by any
  language or seeding script.
- Nothing a guest can book or pay for lives here; that data belongs in the
  service.
