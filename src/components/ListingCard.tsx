import Link from "next/link";
import { LISTING_TYPE_LABELS, type ListingType } from "@/lib/domain/listing";
import { formatDateTime, formatEuros } from "@/lib/form";
import type { ListingSummary } from "@/lib/listings";

export function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    PICKUP: "bg-saffron/20 text-[#8a5a00]",
    DELIVERY: "bg-olive/15 text-olive",
    DINE_IN: "bg-terracotta/15 text-terracotta-dark",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[type] ?? ""}`}>
      {LISTING_TYPE_LABELS[type as ListingType] ?? type}
    </span>
  );
}

export function ListingImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- host-provided URLs, any domain
    <img src={src} alt={alt} className={`object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center bg-line font-serif text-4xl text-muted ${className}`} aria-hidden>
      🍲
    </div>
  );
}

export function ListingCard({ listing }: { listing: ListingSummary }) {
  return (
    <Link href={`/listings/${listing.id}`} className="card group overflow-hidden transition hover:shadow-lg">
      <ListingImage src={listing.imageUrl} alt={listing.title} className="aspect-[4/3] w-full" />
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <TypeBadge type={listing.type} />
          {listing.rating && (
            <span className="text-xs text-muted">
              ★ {listing.rating.average} ({listing.rating.count})
            </span>
          )}
        </div>
        <h3 className="font-serif text-lg leading-snug font-semibold group-hover:text-terracotta">{listing.title}</h3>
        <p className="text-sm text-muted">
          {listing.host.displayName} · {listing.cuisine} · {listing.city}
        </p>
        <div className="flex items-baseline justify-between pt-1 text-sm">
          <span className="font-semibold">
            {formatEuros(listing.priceCents)}
            <span className="font-normal text-muted"> / {listing.type === "DINE_IN" ? "guest" : "portion"}</span>
          </span>
          <span className="text-xs text-muted">
            {listing.nextSlot ? `Next: ${formatDateTime(listing.nextSlot)}` : "No upcoming slot"}
          </span>
        </div>
      </div>
    </Link>
  );
}
