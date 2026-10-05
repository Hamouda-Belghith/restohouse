# RestoHouse

**Airbnb for home cooking.** People who love to cook open their kitchen. Guests
order dishes for **pickup** or **delivery**, or book a **dine-in experience** at
the host's table: a sea view, a family recipe, a traditional lunch.

Launch market: **France**, then the EU. Selling home-cooked food is regulated,
so compliance is built into the product. Hosts can only publish once their
SIRET, DDPP declaration, hygiene training and insurance have been checked.
See [`docs/legal/france-eu.md`](docs/legal/france-eu.md).

> Status: **v0 prototype**. No real payments yet.

## Features (v0)

**Guests**
- Search offers by city, cuisine and type (pickup / delivery / dine-in)
- Offer page with the 14 EU allergens, a verified-host badge, reviews and slots
- Book a slot (capacity enforced, delivery address for delivery), cancel, review after the meal
- The host's exact address is revealed only after the host confirms

**Hosts**
- Host onboarding in two steps: open a host account (name + kitchen address) and prepare offers right away; legal & hygiene verification (SIRET with checksum, DDPP declaration, 14h hygiene training, RC Pro insurance, housing consent, charter) runs in parallel and is required to publish
- Offers with a mandatory allergen declaration, delivery radius ≤ 15 km, dine-in ≤ 12 seats per slot
- Time slots (Paris time), publish/unpublish, confirm / decline / complete bookings

**Admin**
- Review pending hosts (link to the official SIRET directory), approve or reject with a reason

**Platform**
- `/legal`: professional sellers, ranking criteria (P2B), cancellation policy (L221-28), host obligations, GDPR

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 ·
Prisma 6 + PostgreSQL (Neon) · bcryptjs + jose (cookie sessions) · Vitest

```
src/lib/domain/   pure business rules (SIRET, allergens, compliance, booking, privacy, reviews), unit-tested
src/lib/          db, auth, queries, form helpers
src/app/          pages and server actions (guest, host, admin, legal)
prisma/           schema and demo seed
docs/             design spec, implementation plan, legal research
```

## Getting started

Requires Node ≥ 20.9.

```bash
npm install
vercel env pull .env          # DATABASE_URL, DATABASE_URL_UNPOOLED, SESSION_SECRET
                              # (or copy .env.example and fill it in)
npm run setup                 # apply migrations + seed demo data
npm run dev                   # http://localhost:3000
```

Demo accounts (password `password123`):

| Email | Role |
|---|---|
| guest@restohouse.test | Guest |
| amel@restohouse.test | Host, Paris (Tunisian couscous pickup, brik lunch dine-in) |
| paul@restohouse.test | Host, Lyon (quenelles delivery) |
| marine@restohouse.test | Host, Marseille (bouillabaisse with a sea view) |
| pending@restohouse.test | Host waiting for approval |
| admin@restohouse.test | Admin |

Re-running `npm run db:seed` wipes and recreates the demo data.

## Deployment

Hosted on **Vercel** (team `hbe-projects`, project `restohouse`), with a **Neon
Postgres** database added through the Vercel Marketplace. Every push to `main`
deploys to production automatically. `npm run build` applies pending Prisma
migrations (`prisma migrate deploy`) before `next build`.

- Schema change: edit `prisma/schema.prisma`, run `npm run db:migrate`, then commit the new migration.
- Refresh demo data (slots are relative to the seed date): `npm run db:seed`. This wipes all rows.

## Scripts

| Command | What it does |
|---|---|
| `npm test` | Domain unit tests (Vitest) |
| `npm run lint` | Type-check |
| `npm run build` | Production build |

## Roadmap

Stripe Connect payments and payouts · DAC7 data collection and annual host statement ·
French UI (i18n) · photo upload · host–guest messaging · map search ·
email notifications · DSA report-content flow · Postgres + deployment ·
per-country compliance profiles for EU expansion.

## Disclaimer

The legal notes in this repository are product research, not legal advice.
Have them validated by a lawyer before launch.
