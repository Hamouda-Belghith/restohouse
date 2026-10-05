"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireHost, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canPublish, complianceErrors, hostBasicsErrors } from "@/lib/domain/compliance";
import { validateListingInput, validateSlotCapacity } from "@/lib/domain/listing";
import { parseLocalDateTime } from "@/lib/domain/time";
import { dateOrNull, eurosToCents, str, type FormState } from "@/lib/form";

const LOCKED_MESSAGE = "Your verification is under review or approved. Contact support to change verified details.";
const isLocked = (status?: string) => status === "PENDING" || status === "APPROVED";

/** Opens the host account (or edits it). Only the public page and kitchen address are needed. */
export async function saveHostAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/host");
  const current = user.hostProfile;
  if (isLocked(current?.status)) return { errors: [LOCKED_MESSAGE] };

  const data = {
    displayName: str(form, "displayName"),
    bio: str(form, "bio").slice(0, 1000),
    phone: str(form, "phone"),
    addressLine: str(form, "addressLine"),
    postalCode: str(form, "postalCode").replace(/\s/g, ""),
    city: str(form, "city"),
  };
  const fieldErrors = hostBasicsErrors(data);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  await db.hostProfile.upsert({ where: { userId: user.id }, create: { ...data, userId: user.id }, update: data });
  if (user.role === "GUEST") await db.user.update({ where: { id: user.id }, data: { role: "HOST" } });

  revalidatePath("/", "layout");
  redirect("/host");
}

/**
 * Saves the legal & hygiene details, and submits them for verification when intent=submit.
 * Hosts can do this at any time after opening their account; publishing waits for approval.
 */
export async function saveLegalDetails(_: FormState, form: FormData): Promise<FormState> {
  const { user, profile } = await requireHost();
  if (isLocked(profile.status)) return { errors: [LOCKED_MESSAGE] };

  const data = {
    siret: str(form, "siret").replace(/\s/g, ""),
    ddppDeclarationDate: dateOrNull(str(form, "ddppDeclarationDate")),
    hygieneTrainingDate: dateOrNull(str(form, "hygieneTrainingDate")),
    insurer: str(form, "insurer"),
    insurancePolicyNumber: str(form, "insurancePolicyNumber"),
    housingConsent: form.get("housingConsent") === "on",
    charterAccepted: form.get("charterAccepted") === "on",
  };

  const submit = form.get("intent") === "submit";
  const fieldErrors = submit ? complianceErrors({ ...profile, ...data }, new Date()) : {};
  const submitted = submit && !Object.keys(fieldErrors).length;

  await db.hostProfile.update({
    where: { userId: user.id },
    data: submitted ? { ...data, status: "PENDING", rejectionReason: null, submittedAt: new Date() } : data,
  });

  revalidatePath("/host", "layout");
  if (!submitted && submit) return { fieldErrors };
  return { message: submitted ? "Submitted! We'll review your details shortly." : "Draft saved." };
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
  const { profile } = await requireHost();
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
  const { profile } = await requireHost();
  const listing = await db.listing.findFirst({ where: { id: listingId, hostId: profile.id } });
  if (!listing) notFound();
  return { listing, profile };
}

export async function setPublished(_: FormState, form: FormData): Promise<FormState> {
  const { listing, profile } = await ownedListing(str(form, "listingId"));
  const published = form.get("published") === "true";
  if (published && !canPublish(profile.status)) {
    return { errors: ["Your legal & hygiene details must be verified before you can publish. Finish them from your dashboard."] };
  }
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
