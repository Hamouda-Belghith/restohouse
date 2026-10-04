# RestoHouse v0 — Design

Date: 2026-10-04 · Status: approved

## 1. Intent

RestoHouse is "Airbnb for home cooking". Instead of renting a room, people
open their kitchen:

- **Hosts (cooks)** sell food prepared at home, either as **pickup**,
  **delivery**, or as a **dine-in experience** at their place (a view, an
  ambiance, a traditional recipe, "my restaurant at home").
- **Guests (eaters)** look for a good meal, or for an experience: local,
  traditional, special.

Launch market: **France**, then the rest of the EU. The legal framework
(see [`docs/legal/france-eu.md`](../../legal/france-eu.md)) shapes the
product: a host can only publish offers once their compliance profile is
complete and approved.

### v0 success criteria

1. A visitor can browse and search offers by city, type and cuisine.
2. A user can sign up / log in and become a host.
3. A host fills a compliance profile (SIRET, DDPP declaration, hygiene
   training, insurance, housing consent, charter) and is approved by an admin.
4. An approved host creates offers (PICKUP / DELIVERY / DINE_IN) with
   mandatory allergen declaration and time slots.
5. A guest books a slot (quantity or number of guests, delivery address for
   delivery); capacity is enforced.
6. The host confirms or declines, then marks the booking completed; the exact
   address is only revealed to the guest after confirmation.
7. The guest reviews a completed booking; ratings show on the offer.

### Explicit non-goals for v0

Real payments (Stripe Connect later), messaging, maps/geosearch, image upload
(URLs only), i18n (English UI first, French next), DAC7 reporting export,
notifications/email, mobile app.

## 2. Architecture

Single **Next.js (App Router) + TypeScript** app.

- **UI**: React Server Components + Server Actions, Tailwind CSS.
- **Data**: Prisma ORM on SQLite (`prisma/dev.db`). Schema is portable to
  Postgres.
- **Auth**: email + password (bcryptjs), session stored in an HTTP-only
  cookie containing a JWT signed with `jose` (`SESSION_SECRET`).
- **Domain rules**: pure functions in `src/lib/domain/*`, no I/O, unit-tested
  with Vitest. Server actions call these rules before touching the DB.

```
src/
  app/                 routes (pages + server actions)
  components/          presentational components
  lib/
    db.ts              Prisma client singleton
    auth.ts            session cookie, current user, guards
    domain/            pure business rules (tested)
prisma/
  schema.prisma, seed.ts
```

## 3. Data model

String columns are used for enums (SQLite). Values are validated in the
domain layer.

- **User**: id, email (unique), passwordHash, name, role (`GUEST|HOST|ADMIN`),
  createdAt. Every user can book; HOST additionally has a HostProfile.
- **HostProfile**: userId (unique), displayName, bio, phone, addressLine,
  postalCode, city, siret, ddppDeclarationDate, hygieneTrainingDate,
  insurer, insurancePolicyNumber, housingConsent (bool), charterAccepted
  (bool), status (`DRAFT|PENDING|APPROVED|REJECTED`), rejectionReason.
- **Listing**: id, hostId, title, description, cuisine, type
  (`PICKUP|DELIVERY|DINE_IN`), priceCents (per portion, or per guest for
  dine-in), allergens (JSON string array of EU-14 codes; `[]` only allowed
  when `allergensConfirmedNone` is true), deliveryRadiusKm, deliveryFeeCents,
  imageUrl, city, published, createdAt.
- **Slot**: id, listingId, startsAt, capacity (portions or seats).
- **Booking**: id, slotId, guestId, quantity, status
  (`REQUESTED|CONFIRMED|DECLINED|CANCELLED|COMPLETED`), deliveryAddress,
  note, totalCents, createdAt.
- **Review**: id, bookingId (unique), rating 1–5, comment, createdAt.

## 4. Domain rules (`src/lib/domain`)

| Module | Rule |
|---|---|
| `siret.ts` | 14 digits + Luhn checksum (La Poste exception: SIREN 356000000 uses digit-sum % 5) |
| `compliance.ts` | `missingComplianceItems(profile)` lists what blocks submission; hygiene training must be in the past; `canPublish(profile)` ⇔ status APPROVED |
| `allergens.ts` | The 14 EU allergens (Reg. 1169/2011 Annex II); validate codes; declaration must be non-empty or explicitly "none" |
| `listing.ts` | Validate listing input: price > 0, DINE_IN capacity ≤ 12 seats per slot (small-scale), DELIVERY requires radius 1–15 km |
| `booking.ts` | `remainingCapacity(slot, bookings)` counts REQUESTED+CONFIRMED+COMPLETED; reject overbooking, past slots, booking own listing; delivery requires address; `computeTotal` = price × qty (+ delivery fee) |
| `booking.ts` | Status transitions: REQUESTED→CONFIRMED/DECLINED/CANCELLED, CONFIRMED→COMPLETED/CANCELLED; who may perform each |
| `privacy.ts` | `visibleAddress(booking, viewer)`: full address only for host, or for the guest once CONFIRMED/COMPLETED; otherwise city only |
| `reviews.ts` | Only the guest of a COMPLETED booking, once; average rating |

## 5. Pages

| Route | Who | Purpose |
|---|---|---|
| `/` | all | Hero + search form + featured offers |
| `/listings` | all | Search results (city, type, cuisine) |
| `/listings/[id]` | all | Offer details, allergens, host badge, rating, slots, booking form |
| `/signup`, `/login` | anon | Auth |
| `/bookings` | user | My bookings as guest; review form when completed |
| `/host` | user | Become host / compliance form / status; dashboard when approved |
| `/host/listings/new` | approved host | Create offer |
| `/host/listings/[id]` | host owner | Add slots, publish/unpublish |
| `/host/bookings` | host | Incoming bookings, confirm/decline/complete |
| `/admin` | admin | Approve/reject pending hosts |
| `/legal` | all | Platform rules, ranking criteria, host obligations, cancellation policy |

## 6. Error handling

Domain functions return `{ ok: true, value } | { ok: false, errors: string[] }`.
Server actions surface errors to the form via `useActionState`. Guards
redirect anonymous users to `/login` and forbid cross-user access (404).

## 7. Testing

- Vitest unit tests for every domain module (TDD).
- `npm run build` and a manual smoke pass of the main flows on the seeded DB.

## 8. Next steps after v0

Stripe Connect payments & payouts, DAC7 data + annual statement, French
i18n, image upload, messaging, map search, notifications, report-content
flow (DSA), Postgres deployment, EU country compliance profiles.
