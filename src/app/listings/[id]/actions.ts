"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateBookingRequest } from "@/lib/domain/booking";
import { str, type FormState } from "@/lib/form";

export async function bookSlot(_: FormState, form: FormData): Promise<FormState> {
  const listingId = str(form, "listingId");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`);

  const slotId = str(form, "slotId");
  const quantity = Number(str(form, "quantity"));
  const deliveryAddress = str(form, "deliveryAddress") || null;
  const note = str(form, "note").slice(0, 500) || null;

  // Capacity is re-checked inside the transaction so concurrent bookings cannot overbook.
  const result = await db.$transaction(async (tx) => {
    const slot = await tx.slot.findFirst({
      where: { id: slotId, listingId, listing: { published: true, host: { status: "APPROVED" } } },
      include: { listing: { include: { host: true } }, bookings: { select: { quantity: true, status: true } } },
    });
    if (!slot) return { errors: ["This slot is no longer available."] };

    const check = validateBookingRequest({
      guestId: user.id,
      hostUserId: slot.listing.host.userId,
      listingType: slot.listing.type,
      priceCents: slot.listing.priceCents,
      deliveryFeeCents: slot.listing.deliveryFeeCents ?? 0,
      slotStartsAt: slot.startsAt,
      slotCapacity: slot.capacity,
      existingBookings: slot.bookings,
      quantity,
      deliveryAddress,
      now: new Date(),
    });
    if (!check.ok) return { errors: check.errors };

    await tx.booking.create({
      data: {
        slotId,
        guestId: user.id,
        quantity,
        deliveryAddress: slot.listing.type === "DELIVERY" ? deliveryAddress : null,
        note,
        totalCents: check.value.totalCents,
      },
    });
    return null;
  });

  if (result) return result;
  revalidatePath(`/listings/${listingId}`);
  redirect("/bookings?requested=1");
}
