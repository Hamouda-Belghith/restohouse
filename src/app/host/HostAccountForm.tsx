import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Field } from "@/components/FormField";
import type { CurrentUser } from "@/lib/auth";
import { saveHostAccount } from "./actions";
import { Section } from "./Section";

/** Host page + kitchen address: the only things needed to open a host account. */
export function HostAccountForm({
  profile,
  submitLabel,
}: {
  profile: CurrentUser["hostProfile"];
  submitLabel: string;
}) {
  return (
    <ActionForm action={saveHostAccount} className="space-y-6">
      <p className="text-sm text-muted">
        Fields marked <span className="text-red-600">*</span> are required.
      </p>
      <Section title="1. Your host page">
        <Field label="Public name (e.g. “Chez Amel”)" name="displayName" required defaultValue={profile?.displayName} />
        <Field label="About you and your cooking" name="bio" multiline rows={3} defaultValue={profile?.bio} />
        <Field label="Phone (shared with confirmed guests)" name="phone" type="tel" defaultValue={profile?.phone} />
      </Section>

      <Section title="2. Kitchen address" hint="Only the city is public. The full address goes to guests after you confirm a booking.">
        <Field label="Street address" name="addressLine" required defaultValue={profile?.addressLine} />
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Postal code" name="postalCode" required inputMode="numeric" defaultValue={profile?.postalCode} />
          <Field label="City" name="city" required defaultValue={profile?.city} />
        </div>
      </Section>

      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
