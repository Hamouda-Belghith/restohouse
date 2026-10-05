import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { CheckField, Field } from "@/components/FormField";
import { requireHost } from "@/lib/auth";
import { saveLegalDetails } from "../actions";
import { Section, TaxNotice } from "../Section";

export const dynamic = "force-dynamic";

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export default async function VerificationPage() {
  const { profile } = await requireHost();
  const locked = profile.status === "PENDING" || profile.status === "APPROVED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/host" className="text-sm underline">← Dashboard</Link>
      <div>
        <h1 className="h1">Legal & hygiene verification</h1>
        <p className="mt-2 text-muted">
          Selling food you cook at home is a regulated activity in France. We check the essentials once, so guests can
          trust every kitchen on RestoHouse. Save your progress anytime; your offers can be published once we have
          verified these details. <Link href="/legal#hosts" className="underline">Why we ask for this</Link>.
        </p>
      </div>

      {profile.status === "PENDING" && (
        <p role="status" className="rounded-xl border border-saffron/50 bg-saffron/10 p-4 text-sm">
          Your details are <strong>under review</strong>. We usually answer within 48 hours.
        </p>
      )}
      {profile.status === "APPROVED" && (
        <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ✔ Your details are verified. You can publish your offers.
        </p>
      )}
      {profile.status === "REJECTED" && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Your verification was not approved: {profile.rejectionReason || "no reason given"}. Update it and submit again.
        </p>
      )}

      <ActionForm action={saveLegalDetails} className="space-y-6">
        <fieldset disabled={locked}>
          <Section title="Legal & hygiene">
            <p className="text-sm text-muted">
              Fields marked <span className="text-red-600">*</span> are required to submit for review.
            </p>
            <Field
              label="SIRET (14 digits, micro-entreprise registration)"
              name="siret"
              required
              inputMode="numeric"
              defaultValue={profile.siret}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="DDPP declaration date (Cerfa 13984)"
                name="ddppDeclarationDate"
                type="date"
                required
                defaultValue={iso(profile.ddppDeclarationDate)}
              />
              <Field
                label="14h food-hygiene training date"
                name="hygieneTrainingDate"
                type="date"
                required
                defaultValue={iso(profile.hygieneTrainingDate)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Liability insurer (RC Pro)" name="insurer" required defaultValue={profile.insurer} />
              <Field label="Policy number" name="insurancePolicyNumber" required defaultValue={profile.insurancePolicyNumber} />
            </div>
            <CheckField name="housingConsent" required defaultChecked={profile.housingConsent}>
              My lease / co-ownership rules allow me to run this activity from my home, and I have any change-of-use
              authorisation required in my city.
            </CheckField>
            <CheckField name="charterAccepted" required defaultChecked={profile.charterAccepted}>
              I accept the RestoHouse charter: EU hygiene rules (Reg. 852/2004), cold chain ≤ 3°C / hot holding ≥ 63°C,
              honest allergen declaration, no alcohol sales, traceability of ingredients.
            </CheckField>
          </Section>
        </fieldset>

        {!locked && (
          <div className="flex flex-wrap gap-3">
            <button className="btn-ghost" name="intent" value="save">Save draft</button>
            <button className="btn" name="intent" value="submit">Submit for review</button>
          </div>
        )}
      </ActionForm>
      <TaxNotice />
    </div>
  );
}
