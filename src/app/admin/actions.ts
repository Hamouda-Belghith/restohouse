"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { complianceErrors } from "@/lib/domain/compliance";
import { str, type FormState } from "@/lib/form";

export async function reviewHost(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const decision = str(form, "decision");
  const reason = str(form, "reason");
  const profile = await db.hostProfile.findUnique({ where: { id: str(form, "profileId") } });
  if (!profile || profile.status !== "PENDING") return { errors: ["This profile is not waiting for review."] };

  if (decision === "approve") {
    const missing = Object.values(complianceErrors(profile, new Date()));
    if (missing.length) return { errors: missing };
    await db.hostProfile.update({ where: { id: profile.id }, data: { status: "APPROVED", rejectionReason: null } });
  } else if (decision === "reject") {
    if (!reason) return { errors: ["Give the host a reason so they can fix their profile."] };
    await db.hostProfile.update({ where: { id: profile.id }, data: { status: "REJECTED", rejectionReason: reason } });
  } else {
    return { errors: ["Unknown decision."] };
  }
  revalidatePath("/admin");
  return { message: decision === "approve" ? "Host approved." : "Host rejected." };
}
