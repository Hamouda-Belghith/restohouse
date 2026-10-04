import { LISTING_TYPES, LISTING_TYPE_LABELS } from "@/lib/domain/listing";
import type { SearchFilters } from "@/lib/listings";

export function SearchForm({ filters = {} }: { filters?: SearchFilters }) {
  return (
    <form action="/listings" className="card grid gap-3 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <input className="input" name="city" placeholder="City (Paris, Lyon…)" defaultValue={filters.city} aria-label="City" />
      <input className="input" name="cuisine" placeholder="Cuisine (Tunisian…)" defaultValue={filters.cuisine} aria-label="Cuisine" />
      <select className="input" name="type" defaultValue={filters.type ?? ""} aria-label="Type">
        <option value="">Pickup, delivery or dine-in</option>
        {LISTING_TYPES.map((t) => (
          <option key={t} value={t}>
            {LISTING_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      <button className="btn">Search</button>
    </form>
  );
}
