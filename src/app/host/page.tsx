import Link from "next/link";
import { TypeBadge } from "@/components/ListingCard";
import { hasHostAccount, requireUser, type CurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatEuros } from "@/lib/form";
import { HostAccountForm } from "./HostAccountForm";
import { TaxNotice } from "./Section";

export const dynamic = "force-dynamic";

export default async function HostPage() {
  const user = await requireUser("/host");
  const profile = user.hostProfile;

  if (!hasHostAccount(profile)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="h1">Become a RestoHouse host</h1>
          <p className="mt-2 text-muted">
            Start with your host page and kitchen address. You can then prepare your offers right away, and complete
            the legal & hygiene checks in parallel: they are only needed before your offers go live.{" "}
            <Link href="/legal#hosts" className="underline">Why we ask for this</Link>.
          </p>
        </div>
        <HostAccountForm profile={profile} submitLabel="Create my host account" />
        <TaxNotice />
      </div>
    );
  }

  const [listings, pending] = await Promise.all([
    db.listing.findMany({ where: { hostId: profile.id }, orderBy: { createdAt: "desc" } }),
    db.booking.count({ where: { status: "REQUESTED", slot: { listing: { hostId: profile.id } } } }),
  ]);
  const verified = profile.status === "APPROVED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {verified && <p className="text-sm text-olive">✔ Verified host</p>}
          <h1 className="h1">{profile.displayName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {!verified && profile.status !== "PENDING" && (
            <Link href="/host/profile" className="btn-ghost">Edit host page</Link>
          )}
          <Link href="/host/bookings" className="btn-ghost">
            Bookings{pending ? ` (${pending} to confirm)` : ""}
          </Link>
          <Link href="/host/listings/new" className="btn">New offer</Link>
        </div>
      </div>

      {!verified && <VerificationCard profile={profile} />}

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

function VerificationCard({ profile }: { profile: NonNullable<CurrentUser["hostProfile"]> }) {
  if (profile.status === "PENDING") {
    return (
      <p role="status" className="rounded-xl border border-saffron/50 bg-saffron/10 p-4 text-sm">
        Your legal & hygiene details are <strong>under review</strong>. We usually answer within 48 hours. Meanwhile
        you can keep preparing offers and slots; you can publish them once you are verified.
      </p>
    );
  }
  const rejected = profile.status === "REJECTED";
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
        rejected ? "border-red-200 bg-red-50 text-red-800" : "border-saffron/50 bg-saffron/10"
      }`}
    >
      <p>
        {rejected ? (
          <>Your verification was not approved: {profile.rejectionReason || "no reason given"}. Update your details and submit again.</>
        ) : (
          <>
            <strong>Next step: legal & hygiene verification.</strong> You can create offers now, but they can only be
            published once we have verified your SIRET, DDPP declaration, hygiene training and insurance.
          </>
        )}
      </p>
      <Link href="/host/verification" className="btn">
        {rejected ? "Update my details" : "Complete verification"}
      </Link>
    </div>
  );
}
