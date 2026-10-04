import { fail, ok, type Result } from "./result";

export const BOOKING_STATUSES = ["REQUESTED", "CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const ACTIVE = new Set<string>(["REQUESTED", "CONFIRMED", "COMPLETED"]);

export function remainingCapacity(capacity: number, bookings: { quantity: number; status: string }[]): number {
  const taken = bookings.filter((b) => ACTIVE.has(b.status)).reduce((sum, b) => sum + b.quantity, 0);
  return Math.max(0, capacity - taken);
}

export interface BookingRequest {
  guestId: string;
  hostUserId: string;
  listingType: string;
  priceCents: number;
  deliveryFeeCents: number;
  slotStartsAt: Date;
  slotCapacity: number;
  existingBookings: { quantity: number; status: string }[];
  quantity: number;
  deliveryAddress?: string | null;
  now: Date;
}

export function validateBookingRequest(r: BookingRequest): Result<{ totalCents: number }> {
  const errors: string[] = [];
  if (r.guestId === r.hostUserId) errors.push("You cannot book your own offer.");
  if (r.slotStartsAt <= r.now) errors.push("This slot is in the past.");
  if (!Number.isInteger(r.quantity) || r.quantity < 1) errors.push("Quantity must be a whole number of at least 1.");
  else {
    const left = remainingCapacity(r.slotCapacity, r.existingBookings);
    if (r.quantity > left) errors.push(left ? `Only ${left} left for this slot.` : "This slot is full.");
  }
  if (r.listingType === "DELIVERY" && !r.deliveryAddress?.trim()) errors.push("A delivery address is required.");
  if (errors.length) return fail(errors);

  const fee = r.listingType === "DELIVERY" ? r.deliveryFeeCents : 0;
  return ok({ totalCents: r.priceCents * r.quantity + fee });
}

type Actor = "HOST" | "GUEST";

const TRANSITIONS: Record<string, Partial<Record<string, Actor[]>>> = {
  REQUESTED: { CONFIRMED: ["HOST"], DECLINED: ["HOST"], CANCELLED: ["GUEST", "HOST"] },
  CONFIRMED: { COMPLETED: ["HOST"], CANCELLED: ["GUEST", "HOST"] },
};

export function canTransition(from: string, to: string, actor: Actor): boolean {
  return TRANSITIONS[from]?.[to]?.includes(actor) ?? false;
}
