import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { TypeBadge } from "@/components/ListingCard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatEuros } from "@/lib/form";
import { saveHostProfile } from "./actions";

export const dynamic = "force-dynamic";

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export default async function HostPage() {
  const user = await requireUser("/host");
  const profile = user.hostProfile;

  if (profile?.status === "APPROVED") {
    const [listings, pending] = await Promise.all([
      db.listing.findMany({ where: { hostId: profile.id }, orderBy: { createdAt: "desc" } }),
      db.booking.count({ where: { status: "REQUESTED", slot: { listing: { hostId: profile.id } } } }),
    ]);
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-olive">✔ Verified host</p>
            <h1 className="h1">{profile.displayName}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/host/bookings" className="btn-ghost">
              Bookings{pending ? ` (${pending} to confirm)` : ""}
            </Link>
            <Link href="/host/listings/new" className="btn">New offer</Link>
          </div>
        </div>
        {listings.length === 0 ? (
          <p className="card p-8 text-center text-muted">No offers yet. Create your first one!</p>
        ) : (
          <div className="card divide-y divide-line">
            {listings.map((l) => (
              <Link key={l.id} href={`/host/listings/${l.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-cream">
                <TypeBadge type={l.type} />
                <span className="font-medium">{l.title}</span>
                <span className="text-sm text-muted">{formatEuros(l.priceCents)}</span>
                <span className={`ml-auto text-xs font-semibold ${l.published ? "text-olive" : "text-muted"}`}>
                  {l.published ? "Published" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        )}
        <TaxNotice />
      </div>
    );
  }

  const locked = profile?.status === "PENDING";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="h1">Become a RestoHouse host</h1>
        <p className="mt-2 text-muted">
          Selling food you cook at home is a regulated activity in France. We check the essentials once, so guests can
          trust every kitchen on RestoHouse. <Link href="/legal#hosts" className="underline">Why we ask for this</Link>.
        </p>
      </div>

      {locked && (
        <p role="status" className="rounded-xl border border-saffron/50 bg-saffron/10 p-4 text-sm">
          Your profile is <strong>under review</strong>. We usually answer within 48 hours.
        </p>
      )}
      {profile?.status === "REJECTED" && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Your profile was not approved: {profile.rejectionReason || "no reason given"}. Update it and submit again.
        </p>
      )}

      <ActionForm action={saveHostProfile} className="space-y-6">
        <fieldset disabled={locked} className="space-y-6">
          <Section title="1. Your host page">
            <Field label="Public name (e.g. “Chez Amel”)" name="displayName" defaultValue={profile?.displayName} />
            <div>
              <label className="label" htmlFor="bio">About you and your cooking</label>
              <textarea className="input" id="bio" name="bio" rows={3} defaultValue={profile?.bio} />
            </div>
            <Field label="Phone (shared with confirmed guests)" name="phone" defaultValue={profile?.phone} />
          </Section>

          <Section title="2. Kitchen address" hint="Only the city is public. The full address goes to guests after you confirm a booking.">
            <Field label="Street address" name="addressLine" defaultValue={profile?.addressLine} />
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <Field label="Postal code" name="postalCode" defaultValue={profile?.postalCode} pattern="\d{5}" />
              <Field label="City" name="city" defaultValue={profile?.city} />
            </div>
          </Section>

          <Section title="3. Legal & hygiene">
            <Field
              label="SIRET (14 digits, micro-entreprise registration)"
              name="siret"
              defaultValue={profile?.siret}
              inputMode="numeric"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="DDPP declaration date (Cerfa 13984)"
                name="ddppDeclarationDate"
                type="date"
                defaultValue={iso(profile?.ddppDeclarationDate)}
              />
              <Field
                label="14h food-hygiene training date"
                name="hygieneTrainingDate"
                type="date"
                defaultValue={iso(profile?.hygieneTrainingDate)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Liability insurer (RC Pro)" name="insurer" defaultValue={profile?.insurer} />
              <Field label="Policy number" name="insurancePolicyNumber" defaultValue={profile?.insurancePolicyNumber} />
            </div>
            <Check name="housingConsent" defaultChecked={profile?.housingConsent}>
              My lease / co-ownership rules allow me to run this activity from my home, and I have any change-of-use
              authorisation required in my city.
            </Check>
            <Check name="charterAccepted" defaultChecked={profile?.charterAccepted}>
              I accept the RestoHouse charter: EU hygiene rules (Reg. 852/2004), cold chain ≤ 3°C / hot holding ≥ 63°C,
              honest allergen declaration, no alcohol sales, traceability of ingredients.
            </Check>
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

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="h2">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input className="input" id={name} name={name} {...rest} defaultValue={rest.defaultValue ?? ""} />
    </div>
  );
}

function Check({ name, defaultChecked, children }: { name: string; defaultChecked?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 accent-terracotta" />
      <span>{children}</span>
    </label>
  );
}

function TaxNotice() {
  return (
    <p className="text-xs text-muted">
      Tax & social obligations: income from RestoHouse must be declared (URSSAF for micro-entrepreneurs, and your income
      tax return). Under EU DAC7 rules RestoHouse will report hosts&apos; earnings to the tax authorities and send you an
      annual statement (art. 242 bis CGI). See impots.gouv.fr and urssaf.fr.
    </p>
  );
}
