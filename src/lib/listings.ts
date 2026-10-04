import "server-only";
import { db } from "./db";
import { averageRating } from "./domain/reviews";
import { isListingType } from "./domain/listing";

export interface SearchFilters {
  city?: string;
  type?: string;
  cuisine?: string;
}

const PUBLIC = { published: true, host: { status: "APPROVED" } } as const;

/** Published offers from approved hosts. Ranking (disclosed on /legal): soonest available slot, then newest. */
export async function searchListings(f: SearchFilters, take = 30) {
  const now = new Date();
  const listings = await db.listing.findMany({
    where: {
      ...PUBLIC,
      ...(f.city ? { city: { contains: f.city.trim(), mode: "insensitive" as const } } : {}),
      ...(f.type && isListingType(f.type) ? { type: f.type } : {}),
      ...(f.cuisine ? { cuisine: { contains: f.cuisine.trim(), mode: "insensitive" as const } } : {}),
    },
    include: {
      host: { select: { displayName: true } },
      slots: {
        where: { startsAt: { gt: now } },
        orderBy: { startsAt: "asc" },
        take: 1,
        select: { startsAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  const ratings = await ratingsByListing(listings.map((l) => l.id));
  return listings
    .map((l) => ({ ...l, nextSlot: l.slots[0]?.startsAt ?? null, rating: ratings.get(l.id) ?? null }))
    .sort((a, b) => (a.nextSlot?.getTime() ?? Infinity) - (b.nextSlot?.getTime() ?? Infinity));
}

export type ListingSummary = Awaited<ReturnType<typeof searchListings>>[number];

async function ratingsByListing(ids: string[]) {
  const reviews = await db.review.findMany({
    where: { booking: { slot: { listingId: { in: ids } } } },
    select: { rating: true, booking: { select: { slot: { select: { listingId: true } } } } },
  });
  const grouped = new Map<string, number[]>();
  for (const r of reviews) {
    const id = r.booking.slot.listingId;
    grouped.set(id, [...(grouped.get(id) ?? []), r.rating]);
  }
  return new Map([...grouped].map(([id, rs]) => [id, { average: averageRating(rs)!, count: rs.length }]));
}

/** A public offer page. Returns null when missing, unpublished or the host is not approved. */
export async function getPublicListing(id: string) {
  const listing = await db.listing.findFirst({
    where: { id, ...PUBLIC },
    include: {
      host: { select: { id: true, userId: true, displayName: true, bio: true, city: true, siret: true } },
      slots: {
        where: { startsAt: { gt: new Date() } },
        orderBy: { startsAt: "asc" },
        include: { bookings: { select: { quantity: true, status: true } } },
      },
    },
  });
  if (!listing) return null;
  const reviews = await db.review.findMany({
    where: { booking: { slot: { listingId: id } } },
    include: { booking: { select: { guest: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return { ...listing, reviews, rating: averageRating(reviews.map((r) => r.rating)) };
}

export function parseAllergens(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
