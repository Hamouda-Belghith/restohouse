import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { TypeBadge } from "@/components/ListingCard";
import { requireApprovedHost } from "@/lib/auth";
import { db } from "@/lib/db";
import { allergenLabel } from "@/lib/domain/allergens";
import { remainingCapacity } from "@/lib/domain/booking";
import { MAX_DINE_IN_SEATS } from "@/lib/domain/listing";
import { formatDateTime, formatEuros } from "@/lib/form";
import { parseAllergens } from "@/lib/listings";
import { addSlot, deleteSlot, setPublished } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ManageListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireApprovedHost();
  const listing = await db.listing.findFirst({
    where: { id, hostId: profile.id },
    include: {
      slots: { orderBy: { startsAt: "asc" }, include: { bookings: { select: { quantity: true, status: true } } } },
    },
  });
  if (!listing) notFound();

  const now = new Date();
  const upcoming = listing.slots.filter((s) => s.startsAt > now);
  const allergens = parseAllergens(listing.allergens);

  return (
    <div className="space-y-6">
      <Link href="/host" className="text-sm underline">← Dashboard</Link>
      <div className="flex flex-wrap items-center gap-3">
        <TypeBadge type={listing.type} />
        <h1 className="h1">{listing.title}</h1>
      </div>
      <p className="text-muted">
        {formatEuros(listing.priceCents)} · {listing.cuisine} · {listing.city} · Allergens:{" "}
        {allergens.length ? allergens.map(allergenLabel).join(", ") : "none of the 14"}
      </p>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm">
          Status: <strong>{listing.published ? "Published" : "Draft (not visible to guests)"}</strong>
          {listing.published && (
            <> · <Link className="underline" href={`/listings/${listing.id}`}>View public page</Link></>
          )}
        </p>
        <ActionForm action={setPublished}>
          <input type="hidden" name="listingId" value={listing.id} />
          <input type="hidden" name="published" value={String(!listing.published)} />
          <SubmitButton className={listing.published ? "btn-ghost" : "btn"}>
            {listing.published ? "Unpublish" : "Publish"}
          </SubmitButton>
        </ActionForm>
      </div>

      <section className="card space-y-4 p-5">
        <h2 className="h2">Time slots</h2>
        {upcoming.length === 0 && <p className="text-sm text-muted">No upcoming slots. Guests can only book a slot.</p>}
        <ul className="divide-y divide-line">
          {upcoming.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <span className="font-medium">{formatDateTime(s.startsAt)}</span>
              <span className="text-muted">
                {remainingCapacity(s.capacity, s.bookings)} / {s.capacity} left
              </span>
              <ActionForm action={deleteSlot} className="ml-auto">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="slotId" value={s.id} />
                <SubmitButton className="btn-ghost">Remove</SubmitButton>
              </ActionForm>
            </li>
          ))}
        </ul>
        <ActionForm action={addSlot} className="grid items-end gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_10rem_auto]">
          <input type="hidden" name="listingId" value={listing.id} />
          <div>
            <label className="label" htmlFor="startsAt">Date & time (Paris time)</label>
            <input className="input" id="startsAt" name="startsAt" type="datetime-local" required />
          </div>
          <div>
            <label className="label" htmlFor="capacity">{listing.type === "DINE_IN" ? "Seats" : "Portions"}</label>
            <input className="input" id="capacity" name="capacity" type="number" min={1}
              max={listing.type === "DINE_IN" ? MAX_DINE_IN_SEATS : undefined} defaultValue={listing.type === "DINE_IN" ? 6 : 10} required />
          </div>
          <SubmitButton>Add slot</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
