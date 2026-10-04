"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireApprovedHost, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canPublish, missingComplianceItems } from "@/lib/domain/compliance";
import { validateListingInput, validateSlotCapacity } from "@/lib/domain/listing";
import { parseLocalDateTime } from "@/lib/domain/time";
import { dateOrNull, eurosToCents, str, type FormState } from "@/lib/form";

export async function saveHostProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/host");
  const current = user.hostProfile;
  if (current && (current.status === "PENDING" || current.status === "APPROVED")) {
    return { errors: ["Your profile is under review or approved. Contact support to change verified details."] };
  }

  const data = {
    displayName: str(form, "displayName"),
    bio: str(form, "bio").slice(0, 1000),
    phone: str(form, "phone"),
    addressLine: str(form, "addressLine"),
    postalCode: str(form, "postalCode"),
    city: str(form, "city"),
    siret: str(form, "siret").replace(/\s/g, ""),
    ddppDeclarationDate: dateOrNull(str(form, "ddppDeclarationDate")),
    hygieneTrainingDate: dateOrNull(str(form, "hygieneTrainingDate")),
    insurer: str(form, "insurer"),
    insurancePolicyNumber: str(form, "insurancePolicyNumber"),
    housingConsent: form.get("housingConsent") === "on",
    charterAccepted: form.get("charterAccepted") === "on",
  };

  const submit = form.get("intent") === "submit";
  const missing = submit ? missingComplianceItems(data, new Date()) : [];
  const status = submit && !missing.length ? "PENDING" : "DRAFT";

  await db.hostProfile.upsert({
    where: { userId: user.id },
    create: { ...data, userId: user.id, status },
    update: { ...data, status, rejectionReason: null, ...(status === "PENDING" ? { submittedAt: new Date() } : {}) },
  });
  if (user.role === "GUEST") await db.user.update({ where: { id: user.id }, data: { role: "HOST" } });

  revalidatePath("/host");
  if (missing.length) return { errors: missing.map((m) => m.split(": ")[1]) };
  return { message: status === "PENDING" ? "Submitted! We'll review your profile shortly." : "Draft saved." };
}

function listingFromForm(form: FormData) {
  return {
    title: str(form, "title"),
    description: str(form, "description"),
    cuisine: str(form, "cuisine"),
    type: str(form, "type"),
    priceCents: eurosToCents(str(form, "price")),
    allergens: form.getAll("allergens").map(String),
    allergensConfirmedNone: form.get("allergensNone") === "on",
    city: str(form, "city"),
    deliveryRadiusKm: str(form, "deliveryRadiusKm") ? Number(str(form, "deliveryRadiusKm")) : null,
    deliveryFeeCents: str(form, "deliveryFee") ? eurosToCents(str(form, "deliveryFee")) : null,
    imageUrl: str(form, "imageUrl") || null,
  };
}

export async function createListing(_: FormState, form: FormData): Promise<FormState> {
  const { profile } = await requireApprovedHost();
  const input = listingFromForm(form);
  const check = validateListingInput(input);
  if (!check.ok) return { errors: check.errors };

  const isDelivery = input.type === "DELIVERY";
  const listing = await db.listing.create({
    data: {
      hostId: profile.id,
      title: input.title,
      description: input.description,
      cuisine: input.cuisine,
      type: input.type,
      priceCents: input.priceCents,
      allergens: JSON.stringify([...new Set(input.allergens)]),
      deliveryRadiusKm: isDelivery ? input.deliveryRadiusKm : null,
      deliveryFeeCents: isDelivery ? (input.deliveryFeeCents ?? 0) : null,
      imageUrl: input.imageUrl,
      city: input.city,
    },
  });
  redirect(`/host/listings/${listing.id}`);
}

/** Loads a listing owned by the current approved host, or 404s. */
async function ownedListing(listingId: string) {
  const { profile } = await requireApprovedHost();
  const listing = await db.listing.findFirst({ where: { id: listingId, hostId: profile.id } });
  if (!listing) notFound();
  return { listing, profile };
}

export async function setPublished(_: FormState, form: FormData): Promise<FormState> {
  const { listing, profile } = await ownedListing(str(form, "listingId"));
  const published = form.get("published") === "true";
  if (published && !canPublish(profile.status)) return { errors: ["Only approved hosts can publish."] };
  await db.listing.update({ where: { id: listing.id }, data: { published } });
  revalidatePath(`/host/listings/${listing.id}`);
  return { message: published ? "Published: guests can now book it." : "Unpublished." };
}

export async function addSlot(_: FormState, form: FormData): Promise<FormState> {
  const { listing } = await ownedListing(str(form, "listingId"));
  const startsAt = parseLocalDateTime(str(form, "startsAt"));
  const capacity = Number(str(form, "capacity"));
  const errors: string[] = [];
  if (!startsAt || startsAt <= new Date()) errors.push("Pick a date and time in the future.");
  const cap = validateSlotCapacity(listing.type, capacity);
  if (!cap.ok) errors.push(...cap.errors);
  if (errors.length) return { errors };

  await db.slot.create({ data: { listingId: listing.id, startsAt: startsAt!, capacity } });
  revalidatePath(`/host/listings/${listing.id}`);
  return { message: "Slot added." };
}

export async function deleteSlot(_: FormState, form: FormData): Promise<FormState> {
  const { listing } = await ownedListing(str(form, "listingId"));
  const slot = await db.slot.findFirst({
    where: { id: str(form, "slotId"), listingId: listing.id },
    include: { _count: { select: { bookings: true } } },
  });
  if (!slot) return { errors: ["Slot not found."] };
  if (slot._count.bookings) return { errors: ["This slot already has bookings, so it is kept for the record."] };
  await db.slot.delete({ where: { id: slot.id } });
  revalidatePath(`/host/listings/${listing.id}`);
  return { message: "Slot removed." };
}
