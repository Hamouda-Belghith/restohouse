import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ListingImage, TypeBadge } from "@/components/ListingCard";
import { getCurrentUser } from "@/lib/auth";
import { allergenLabel } from "@/lib/domain/allergens";
import { remainingCapacity } from "@/lib/domain/booking";
import { formatDateTime, formatEuros } from "@/lib/form";
import { getPublicListing, parseAllergens } from "@/lib/listings";
import { bookSlot } from "./actions";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, user] = await Promise.all([getPublicListing(id), getCurrentUser()]);
  if (!listing) notFound();

  const allergens = parseAllergens(listing.allergens);
  const unit = listing.type === "DINE_IN" ? "guest" : "portion";
  const slots = listing.slots
    .map((s) => ({ ...s, left: remainingCapacity(s.capacity, s.bookings) }))
    .filter((s) => s.left > 0);
  const isOwner = user?.id === listing.host.userId;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <article className="space-y-6">
        <ListingImage src={listing.imageUrl} alt={listing.title} className="aspect-[16/9] w-full rounded-2xl" />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <TypeBadge type={listing.type} />
            <span>{listing.cuisine}</span>·<span>{listing.city}</span>
            {listing.rating && <span>· ★ {listing.rating} ({listing.reviews.length})</span>}
          </div>
          <h1 className="h1">{listing.title}</h1>
          <p className="whitespace-pre-line text-muted">{listing.description}</p>
        </div>

        <section className="card p-5">
          <h2 className="h2 mb-2">Allergens</h2>
          {allergens.length ? (
            <ul className="flex flex-wrap gap-2">
              {allergens.map((a) => (
                <li key={a} className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-800">
                  {allergenLabel(a)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">The host declares this offer contains none of the 14 regulated allergens.</p>
          )}
          <p className="mt-3 text-xs text-muted">
            Declared by the host (EU Reg. 1169/2011). Ask the host about traces before booking if you have a severe allergy.
          </p>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="h2">Your host: {listing.host.displayName}</h2>
          <p className="text-sm text-muted">{listing.host.bio}</p>
          <p className="text-xs text-olive">
            ✔ Professional seller · SIRET {listing.host.siret.slice(0, 9)}… · hygiene training & DDPP declaration verified
            by RestoHouse
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="h2">Reviews</h2>
          {listing.reviews.length ? (
            listing.reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <p className="text-sm font-semibold">
                  {"★".repeat(r.rating)}
                  <span className="text-line">{"★".repeat(5 - r.rating)}</span> · {r.booking.guest.name}
                </p>
                {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No reviews yet.</p>
          )}
        </section>
      </article>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card space-y-4 p-5">
          <p className="text-2xl font-semibold">
            {formatEuros(listing.priceCents)} <span className="text-base font-normal text-muted">/ {unit}</span>
          </p>
          {listing.type === "DELIVERY" && (
            <p className="text-sm text-muted">
              Delivery within {listing.deliveryRadiusKm} km of {listing.city} · fee{" "}
              {formatEuros(listing.deliveryFeeCents ?? 0)}
            </p>
          )}
          {listing.type !== "DELIVERY" && (
            <p className="text-sm text-muted">
              {listing.city}. The exact address is shared once the host confirms your booking.
            </p>
          )}

          {isOwner ? (
            <p className="text-sm text-muted">This is your offer. Manage it from your host dashboard.</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted">No available slots right now.</p>
          ) : (
            <ActionForm action={bookSlot} className="space-y-3">
              <input type="hidden" name="listingId" value={listing.id} />
              <div>
                <label className="label" htmlFor="slotId">When</label>
                <select className="input" id="slotId" name="slotId" required>
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDateTime(s.startsAt)} ({s.left} left)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="quantity">{listing.type === "DINE_IN" ? "Guests" : "Portions"}</label>
                <input className="input" id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
              </div>
              {listing.type === "DELIVERY" && (
                <div>
                  <label className="label" htmlFor="deliveryAddress">Delivery address</label>
                  <input className="input" id="deliveryAddress" name="deliveryAddress" required />
                </div>
              )}
              <div>
                <label className="label" htmlFor="note">Note for the host (optional)</label>
                <textarea className="input" id="note" name="note" rows={2} maxLength={500} placeholder="Allergies, arrival time…" />
              </div>
              <SubmitButton className="btn w-full">{user ? "Request booking" : "Log in to book"}</SubmitButton>
              <p className="text-xs text-muted">
                No payment is taken in this version. Food and dated experiences are not covered by the 14-day withdrawal
                right (Code de la consommation L221-28). You can cancel from “My bookings” before the meal.
              </p>
            </ActionForm>
          )}
        </div>
      </aside>
    </div>
  );
}
