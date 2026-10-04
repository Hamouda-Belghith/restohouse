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
- Compliance onboarding: SIRET (checksum validated), DDPP declaration, 14h hygiene training, RC Pro insurance, housing consent, charter
- Offers with a mandatory allergen declaration, delivery radius ≤ 15 km, dine-in ≤ 12 seats per slot
- Time slots (Paris time), publish/unpublish, confirm / decline / complete bookings

**Admin**
- Review pending hosts (link to the official SIRET directory), approve or reject with a reason

**Platform**
- `/legal`: professional sellers, ranking criteria (P2B), cancellation policy (L221-28), host obligations, GDPR

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 ·
Prisma 6 + SQLite · bcryptjs + jose (cookie sessions) · Vitest

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
cp .env.example .env          # then set SESSION_SECRET (openssl rand -base64 32)
npm run setup                 # create SQLite DB + seed demo data
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
