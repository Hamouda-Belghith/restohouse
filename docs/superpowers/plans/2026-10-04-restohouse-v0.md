# RestoHouse v0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working two-sided home-cooking marketplace (pickup, delivery, dine-in) with compliance-gated hosts.

**Architecture:** One Next.js App Router app. Pure domain rules live in `src/lib/domain` and are unit-tested. Server actions validate with them, then persist through Prisma on SQLite.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Prisma 6 (SQLite), bcryptjs, jose, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-04-restohouse-v0-design.md`

## Global Constraints

- Enum-like columns are strings: role `GUEST|HOST|ADMIN`; host status `DRAFT|PENDING|APPROVED|REJECTED`; listing type `PICKUP|DELIVERY|DINE_IN`; booking status `REQUESTED|CONFIRMED|DECLINED|CANCELLED|COMPLETED`.
- Money is stored in integer cents (EUR).
- Dine-in capacity is ≤ 12 seats per slot. Delivery radius is 1–15 km.
- Only APPROVED hosts can publish. No alcohol sales.
- Exact host address is visible to the guest only once the booking is CONFIRMED or COMPLETED.
- Domain functions return `Result<T> = { ok: true; value: T } | { ok: false; errors: string[] }`.

## Review Focus

1. Two guests booking the last seats at the same time → no overbooking (capacity checked inside a DB transaction).
2. A host booking their own listing → rejected.
3. Booking a slot in the past → rejected.
4. A non-owner hitting `/host/listings/[id]` or a booking action for someone else's booking → 404 / error, no mutation.
5. A listing with no allergen selection and "contains none" unchecked → rejected; unknown allergen codes → rejected.

---

### Task 1: Scaffold

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `src/app/globals.css`, `.gitignore`, `.env.example`

- [ ] Create the Next.js + Tailwind + Vitest + Prisma project by hand (no interactive CLI).
- [ ] `npm install`, then `npx vitest run --passWithNoTests` should pass.
- [ ] Commit `chore: scaffold next.js app`.

### Task 2: Domain rules (TDD)

**Files:** `src/lib/domain/{result,siret,allergens,compliance,listing,booking,privacy,reviews}.ts` + `*.test.ts`

**Produces:**
- `isValidSiret(s: string): boolean`
- `ALLERGENS: {code,label}[]` (14), `validateAllergens(codes: string[], confirmedNone: boolean): Result<string[]>`
- `missingComplianceItems(p: ComplianceInput, now: Date): string[]`, `canPublish(status: string): boolean`
- `validateListingInput(i: ListingInput): Result<ListingInput>`, `validateSlotCapacity(type, capacity): Result<number>`
- `remainingCapacity(capacity: number, bookings: {quantity,status}[]): number`
- `validateBookingRequest(r: BookingRequest): Result<{ totalCents: number }>`
- `canTransition(from, to, actor: 'HOST'|'GUEST'): boolean`
- `visibleAddress(input): string`
- `canReview(input): Result<true>`, `averageRating(ratings: number[]): number | null`

- [ ] Write a failing test for each rule, including Review Focus items 2, 3 and 5:
  - `isValidSiret('73282932000074')` → true; `'73282932000075'` → false; `'123'` → false; La Poste `'35600000000001'` (digit sum % 5) → true
  - `validateAllergens([], false)` → errors; `([], true)` → ok; `(['gluten','xyz'], false)` → error mentioning `xyz`; `(['gluten'], true)` → error (contradiction)
  - compliance: empty profile lists siret/ddpp/hygiene/insurance/housing/charter; future hygiene date → listed
  - listing: DELIVERY radius 0 → error, 16 → error; price 0 → error; DINE_IN slot capacity 13 → error
  - booking: own listing, past slot, qty > remaining, delivery without address → errors; total = price×qty + fee (delivery only)
  - transitions: GUEST cannot CONFIRM; HOST can REQUESTED→CONFIRMED; COMPLETED→anything false
  - privacy: guest + REQUESTED → city only; guest + CONFIRMED → full; host → full
  - reviews: non-completed → error; already reviewed → error; other user → error
- [ ] Run `npx vitest run` and confirm it fails. Implement. Run again and confirm it passes.
- [ ] Commit `feat(domain): business rules with tests`.

### Task 3: Database + seed

**Files:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`

- [ ] Write the schema from spec §3, with cascades on delete.
- [ ] Seed: admin, 3 approved hosts (Paris Tunisian couscous pickup, Lyon bouchon delivery, Marseille sea-view dine-in), 1 pending host, 1 guest, slots over the next 7 days, plus 1 completed booking with a review. Password for all demo accounts: `password123`.
- [ ] `npx prisma db push && npx prisma db seed` should succeed.
- [ ] Commit `feat(db): prisma schema and seed`.

### Task 4: Auth

**Files:** `src/lib/auth.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/actions.ts`

**Produces:** `getCurrentUser(): Promise<User|null>`, `requireUser(): Promise<User>` (redirects to `/login`), `requireAdmin()`, `createSession(userId)`, `destroySession()`.

- [ ] Sign up (email unique, password ≥ 8 characters), log in, log out.
- [ ] Commit `feat(auth): email/password sessions`.

### Task 5: Guest side

**Files:** `src/app/page.tsx`, `src/app/listings/page.tsx`, `src/app/listings/[id]/page.tsx`, `src/app/listings/[id]/actions.ts`, `src/app/bookings/page.tsx`, `src/app/bookings/actions.ts`, `src/components/*`

- [ ] Search by city, type and cuisine, showing only published listings from APPROVED hosts.
- [ ] Booking action re-reads the slot's bookings inside `prisma.$transaction` and runs `validateBookingRequest` (Review Focus 1).
- [ ] "My bookings" page: cancel, review when completed, and the address according to `visibleAddress`.
- [ ] Commit `feat(guest): search, offer page, booking, reviews`.

### Task 6: Host side + admin + legal

**Files:** `src/app/host/**`, `src/app/admin/**`, `src/app/legal/page.tsx`

- [ ] Compliance form (save as DRAFT, or submit → PENDING when `missingComplianceItems` is empty).
- [ ] Offer create, add slot, publish toggle (`canPublish`), and an owner check on every action (Review Focus 4).
- [ ] Incoming bookings: confirm, decline or complete via `canTransition`.
- [ ] Admin approve/reject.
- [ ] `/legal` page with ranking criteria, professional sellers, cancellation policy and host obligations.
- [ ] Commit `feat(host): onboarding, offers, booking management, admin`.

### Task 7: Verify and ship

- [ ] `npx vitest run`, `npm run build`, then smoke-test with `next start` + curl on the main pages.
- [ ] Write the README (pitch, setup, demo accounts, legal summary link).
- [ ] `gh repo create restohouse --public --source . --push`.
