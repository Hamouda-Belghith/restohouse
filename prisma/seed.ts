import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

/** Today + `days` at `hour`:00 local time. */
function at(days: number, hour: number): Date {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

async function main() {
  await db.review.deleteMany();
  await db.booking.deleteMany();
  await db.slot.deleteMany();
  await db.listing.deleteMany();
  await db.hostProfile.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const compliant = {
    ddppDeclarationDate: new Date("2026-02-01"),
    hygieneTrainingDate: new Date("2025-12-10"),
    housingConsent: true,
    charterAccepted: true,
    status: "APPROVED",
    submittedAt: new Date("2026-02-02"),
  };

  await db.user.create({ data: { email: "admin@restohouse.test", name: "Admin", role: "ADMIN", passwordHash } });
  const guest = await db.user.create({ data: { email: "guest@restohouse.test", name: "Léa Martin", passwordHash } });

  const amel = await db.user.create({
    data: {
      email: "amel@restohouse.test",
      name: "Amel Ben Salah",
      role: "HOST",
      passwordHash,
      hostProfile: {
        create: {
          ...compliant,
          displayName: "Chez Amel",
          bio: "Born in Djerba, cooking my grandmother's recipes in Paris 11e since 2015.",
          phone: "+33 6 12 34 56 78",
          addressLine: "12 rue des Lilas",
          postalCode: "75011",
          city: "Paris",
          siret: "73282932000074",
          insurer: "MAIF",
          insurancePolicyNumber: "RCP-2026-0042",
        },
      },
    },
    include: { hostProfile: true },
  });

  const paul = await db.user.create({
    data: {
      email: "paul@restohouse.test",
      name: "Paul Girard",
      role: "HOST",
      passwordHash,
      hostProfile: {
        create: {
          ...compliant,
          displayName: "Le Bouchon de Paul",
          bio: "Retired bouchon chef. Quenelles, tablier de sapeur and tarte aux pralines, delivered warm.",
          addressLine: "5 quai Saint-Vincent",
          postalCode: "69001",
          city: "Lyon",
          siret: "35600000000001",
          insurer: "AXA",
          insurancePolicyNumber: "AXA-RC-99812",
        },
      },
    },
    include: { hostProfile: true },
  });

  const marine = await db.user.create({
    data: {
      email: "marine@restohouse.test",
      name: "Marine Rossi",
      role: "HOST",
      passwordHash,
      hostProfile: {
        create: {
          ...compliant,
          displayName: "La Terrasse de Marine",
          bio: "A terrace above the Vallon des Auffes, a bouillabaisse the way my father made it.",
          addressLine: "3 traverse du Vallon",
          postalCode: "13007",
          city: "Marseille",
          siret: "44306184100047",
          insurer: "Groupama",
          insurancePolicyNumber: "GRP-55120",
        },
      },
    },
    include: { hostProfile: true },
  });

  await db.user.create({
    data: {
      email: "pending@restohouse.test",
      name: "Yuki Tanaka",
      role: "HOST",
      passwordHash,
      hostProfile: {
        create: {
          ...compliant,
          status: "PENDING",
          displayName: "Yuki's Bento",
          bio: "Home-style Japanese bento in Bordeaux.",
          addressLine: "8 rue Sainte-Catherine",
          postalCode: "33000",
          city: "Bordeaux",
          siret: "73282932000074",
          insurer: "MACIF",
          insurancePolicyNumber: "MC-7781",
        },
      },
    },
  });

  const couscous = await db.listing.create({
    data: {
      hostId: amel.hostProfile!.id,
      title: "Fish couscous from Djerba",
      description:
        "Hand-rolled semolina, grouper, pumpkin and chickpeas, with homemade harissa on the side. One generous portion per order.",
      cuisine: "Tunisian",
      type: "PICKUP",
      priceCents: 1400,
      allergens: JSON.stringify(["gluten", "fish", "celery"]),
      imageUrl: img("photo-1541518763669-27fef04b14ea"),
      city: "Paris",
      published: true,
      slots: {
        create: [1, 2, 3, 5].map((d) => ({ startsAt: at(d, 19), capacity: 12 })),
      },
    },
    include: { slots: true },
  });

  await db.listing.create({
    data: {
      hostId: amel.hostProfile!.id,
      title: "Brik & mloukhia Sunday lunch",
      description: "Learn the brik fold, then share a mloukhia slow-cooked for 6 hours. A real Tunisian family lunch.",
      cuisine: "Tunisian",
      type: "DINE_IN",
      priceCents: 3500,
      allergens: JSON.stringify(["gluten", "eggs"]),
      imageUrl: img("photo-1547592180-85f173990554"),
      city: "Paris",
      published: true,
      slots: { create: [{ startsAt: at(6, 12), capacity: 6 }] },
    },
  });

  await db.listing.create({
    data: {
      hostId: paul.hostProfile!.id,
      title: "Quenelle de brochet, sauce Nantua",
      description: "The Lyon classic, delivered hot (≥ 63°C) in insulated boxes, with rice pilaf.",
      cuisine: "French — Lyonnaise",
      type: "DELIVERY",
      priceCents: 1650,
      allergens: JSON.stringify(["gluten", "eggs", "milk", "fish", "crustaceans"]),
      deliveryRadiusKm: 6,
      deliveryFeeCents: 350,
      imageUrl: img("photo-1504674900247-0877df9cc836"),
      city: "Lyon",
      published: true,
      slots: { create: [1, 2, 4].map((d) => ({ startsAt: at(d, 20), capacity: 15 })) },
    },
  });

  await db.listing.create({
    data: {
      hostId: marine.hostProfile!.id,
      title: "Bouillabaisse dinner with a sea view",
      description:
        "Six guests, one terrace above the sea at sunset. Rouille, croûtons, and the fish of the day from the Vallon des Auffes. No alcohol is sold.",
      cuisine: "French — Provençal",
      type: "DINE_IN",
      priceCents: 5500,
      allergens: JSON.stringify(["fish", "crustaceans", "molluscs", "gluten", "eggs", "celery"]),
      imageUrl: img("photo-1559339352-11d035aa65de"),
      city: "Marseille",
      published: true,
      slots: { create: [2, 4, 6].map((d) => ({ startsAt: at(d, 20), capacity: 6 })) },
    },
  });

  // A past, completed booking with a review so ratings show up.
  const pastSlot = await db.slot.create({ data: { listingId: couscous.id, startsAt: at(-3, 19), capacity: 12 } });
  await db.booking.create({
    data: {
      slotId: pastSlot.id,
      guestId: guest.id,
      quantity: 2,
      status: "COMPLETED",
      totalCents: 2800,
      review: { create: { rating: 5, comment: "Best couscous I've had outside Tunisia. Amel is lovely!" } },
    },
  });
  await db.booking.create({
    data: { slotId: couscous.slots[0].id, guestId: guest.id, quantity: 1, status: "REQUESTED", totalCents: 1400 },
  });

  console.log("Seeded. Demo accounts (password: password123): admin@, guest@, amel@, paul@, marine@, pending@restohouse.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
