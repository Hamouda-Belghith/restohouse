"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BOOKING_STATUSES, canTransition } from "@/lib/domain/booking";
import { canReview } from "@/lib/domain/reviews";
import { str, type FormState } from "@/lib/form";

/** Used by both guests (cancel) and hosts (confirm / decline / complete / cancel). */
export async function updateBookingStatus(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const to = str(form, "status");
  if (!(BOOKING_STATUSES as readonly string[]).includes(to)) return { errors: ["Unknown status."] };

  const booking = await db.booking.findUnique({
    where: { id: str(form, "bookingId") },
    include: { slot: { include: { listing: { include: { host: { select: { userId: true } } } } } } },
  });
  const actor =
    booking?.slot.listing.host.userId === user.id ? "HOST" : booking?.guestId === user.id ? "GUEST" : null;
  if (!booking || !actor) return { errors: ["Booking not found."] };
  if (!canTransition(booking.status, to, actor)) {
    return { errors: [`A ${actor.toLowerCase()} cannot change a ${booking.status.toLowerCase()} booking to ${to.toLowerCase()}.`] };
  }

  // Conditional update guards against a concurrent change of status.
  const { count } = await db.booking.updateMany({ where: { id: booking.id, status: booking.status }, data: { status: to } });
  if (!count) return { errors: ["This booking was just updated. Refresh the page."] };

  revalidatePath("/bookings");
  revalidatePath("/host/bookings");
  return { message: `Booking ${to.toLowerCase()}.` };
}

export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const rating = Number(str(form, "rating"));
  const booking = await db.booking.findUnique({ where: { id: str(form, "bookingId") }, include: { review: true } });
  if (!booking) return { errors: ["Booking not found."] };

  const check = canReview({ guestId: booking.guestId, status: booking.status, hasReview: !!booking.review }, user.id, rating);
  if (!check.ok) return { errors: check.errors };

  await db.review.create({ data: { bookingId: booking.id, rating, comment: str(form, "comment").slice(0, 1000) } });
  revalidatePath("/bookings");
  return { message: "Thanks for your review!" };
}
