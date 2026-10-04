import { ListingCard } from "@/components/ListingCard";
import { SearchForm } from "@/components/SearchForm";
import { searchListings, type SearchFilters } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchFilters> }) {
  const filters = await searchParams;
  const listings = await searchListings(filters);
  return (
    <div className="space-y-6">
      <h1 className="h1">Explore home cooking</h1>
      <SearchForm filters={filters} />
      <p className="text-sm text-muted">
        {listings.length} offer{listings.length === 1 ? "" : "s"} · sorted by soonest availability
      </p>
      {listings.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <p className="card p-8 text-center text-muted">No offers match yet. Try another city or type.</p>
      )}
    </div>
  );
}
