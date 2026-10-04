import { validateAllergens } from "./allergens";
import { fail, ok, type Result } from "./result";

export const LISTING_TYPES = ["PICKUP", "DELIVERY", "DINE_IN"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  PICKUP: "Pickup",
  DELIVERY: "Delivery",
  DINE_IN: "Dine-in experience",
};

export const MAX_DINE_IN_SEATS = 12;
export const MAX_DELIVERY_RADIUS_KM = 15;

export interface ListingInput {
  title: string;
  description: string;
  cuisine: string;
  type: string;
  priceCents: number;
  allergens: string[];
  allergensConfirmedNone: boolean;
  city: string;
  deliveryRadiusKm?: number | null;
  deliveryFeeCents?: number | null;
  imageUrl?: string | null;
}

export function isListingType(t: string): t is ListingType {
  return (LISTING_TYPES as readonly string[]).includes(t);
}

export function validateListingInput(i: ListingInput): Result<ListingInput> {
  const errors: string[] = [];
  if (!i.title.trim()) errors.push("Title is required.");
  if (!i.description.trim()) errors.push("Description is required.");
  if (!i.cuisine.trim()) errors.push("Cuisine is required.");
  if (!i.city.trim()) errors.push("City is required.");
  if (!isListingType(i.type)) errors.push("Type must be pickup, delivery or dine-in.");
  if (!Number.isInteger(i.priceCents) || i.priceCents <= 0) errors.push("Price must be greater than 0.");
  if (i.type === "DELIVERY") {
    const r = i.deliveryRadiusKm ?? 0;
    if (!(r >= 1 && r <= MAX_DELIVERY_RADIUS_KM)) {
      errors.push(`Delivery radius must be between 1 and ${MAX_DELIVERY_RADIUS_KM} km (cold/hot chain).`);
    }
    if (i.deliveryFeeCents != null && (!Number.isInteger(i.deliveryFeeCents) || i.deliveryFeeCents < 0)) {
      errors.push("Delivery fee cannot be negative.");
    }
  }
  if (i.imageUrl && !/^https:\/\//.test(i.imageUrl)) errors.push("Image URL must start with https://");
  const allergens = validateAllergens(i.allergens, i.allergensConfirmedNone);
  if (!allergens.ok) errors.push(...allergens.errors);
  return errors.length ? fail(errors) : ok(i);
}

export function validateSlotCapacity(type: string, capacity: number): Result<number> {
  if (!Number.isInteger(capacity) || capacity < 1) return fail(["Capacity must be at least 1."]);
  if (type === "DINE_IN" && capacity > MAX_DINE_IN_SEATS) {
    return fail([`Dine-in experiences are limited to ${MAX_DINE_IN_SEATS} guests per slot.`]);
  }
  return ok(capacity);
}
