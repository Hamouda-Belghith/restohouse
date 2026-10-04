import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { requireApprovedHost } from "@/lib/auth";
import { ALLERGENS } from "@/lib/domain/allergens";
import { LISTING_TYPES, LISTING_TYPE_LABELS, MAX_DELIVERY_RADIUS_KM, MAX_DINE_IN_SEATS } from "@/lib/domain/listing";
import { createListing } from "../../actions";

export default async function NewListingPage() {
  const { profile } = await requireApprovedHost();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="h1">New offer</h1>
      <ActionForm action={createListing} className="space-y-6">
        <section className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="input" id="title" name="title" required placeholder="Fish couscous from Djerba" />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea className="input" id="description" name="description" rows={4} required
              placeholder="What's on the plate, the story behind it, portion size, the setting for dine-in…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cuisine">Cuisine</label>
              <input className="input" id="cuisine" name="cuisine" required placeholder="Tunisian" />
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input className="input" id="city" name="city" required defaultValue={profile.city} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="imageUrl">Photo URL (https://…)</label>
            <input className="input" id="imageUrl" name="imageUrl" type="url" />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="h2">How guests enjoy it</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {LISTING_TYPES.map((t, i) => (
              <label key={t} className="card flex cursor-pointer items-center gap-2 p-3 has-[:checked]:border-terracotta">
                <input type="radio" name="type" value={t} defaultChecked={i === 0} className="accent-terracotta" />
                {LISTING_TYPE_LABELS[t]}
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="price">Price (€ per portion / guest)</label>
              <input className="input" id="price" name="price" inputMode="decimal" required placeholder="14,00" />
            </div>
            <div>
              <label className="label" htmlFor="deliveryRadiusKm">Delivery radius (km)</label>
              <input className="input" id="deliveryRadiusKm" name="deliveryRadiusKm" type="number" min={1} max={MAX_DELIVERY_RADIUS_KM} />
            </div>
            <div>
              <label className="label" htmlFor="deliveryFee">Delivery fee (€)</label>
              <input className="input" id="deliveryFee" name="deliveryFee" inputMode="decimal" />
            </div>
          </div>
          <p className="text-xs text-muted">
            Delivery fields apply to delivery offers only (max {MAX_DELIVERY_RADIUS_KM} km to keep food at a safe
            temperature). Dine-in experiences are limited to {MAX_DINE_IN_SEATS} guests per slot. No alcohol may be sold.
          </p>
        </section>

        <section className="card space-y-4 p-6">
          <div>
            <h2 className="h2">Allergens (required)</h2>
            <p className="text-sm text-muted">Tick every one of the 14 EU regulated allergens present in the dish.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALLERGENS.map((a) => (
              <label key={a.code} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="allergens" value={a.code} className="accent-terracotta" />
                {a.label}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 border-t border-line pt-3 text-sm font-medium">
            <input type="checkbox" name="allergensNone" className="accent-terracotta" />
            This dish contains none of the 14 allergens.
          </label>
        </section>

        <SubmitButton>Create offer</SubmitButton>
        <p className="text-xs text-muted">Your offer is saved as a draft. Add time slots, then publish it.</p>
      </ActionForm>
    </div>
  );
}
