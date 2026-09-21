# API layer

The UI never touches storage directly. It calls `bookingApi` from
`src/api/index.ts`, which is typed by `BookingApi` in `src/api/types.ts`.

```
components / routes
        │  react-query hooks (src/hooks/useBookingApi.ts)
        ▼
   bookingApi  ── interface BookingApi (src/api/types.ts)
        │
        ├── mockBookingApi   (src/api/mock/bookingApi.mock.ts)  ← today
        └── httpBookingApi   (to write)                          ← later
```

## Replacing the mock with a real backend

1. Create `src/api/http/bookingApi.http.ts` exporting an object that implements
   `BookingApi`. Each method maps 1:1 to an endpoint:

   | Method           | Suggested endpoint                        |
   | ---------------- | ----------------------------------------- |
   | `getAvailability`| `GET  /properties/:id/availability`       |
   | `getQuote`       | `POST /quotes`                            |
   | `createBooking`  | `POST /bookings`                          |
   | `listBookings`   | `GET  /bookings`                          |
   | `getBooking`     | `GET  /bookings/:id`                      |
   | `cancelBooking`  | `POST /bookings/:id/cancel`               |

2. Translate server errors into `ApiError` with one of the `ApiErrorCode`
   values. The UI already renders a translated message for each code.
3. Register it in `src/api/index.ts` (`setBookingApi(httpBookingApi)`).

Nothing else changes: routes, hooks, cache keys and translations stay as they
are. Card data is only used to derive a brand + last4 in the mock; a real
implementation must send it to the payment provider, never to our own server.

## Rules kept by the mock so the swap is faithful

- Every call is async and can fail.
- Prices are computed by the API, never by a component.
- Availability is re-checked at booking time, not only at quote time.
- Booking ids and references are produced by the API.
