import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { StatusButton, StatusPill } from "@/components/BookingStatus";
import { TypeBadge } from "@/components/ListingCard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canTransition } from "@/lib/domain/booking";
import { visibleAddress } from "@/lib/domain/privacy";
import { formatDateTime, formatEuros } from "@/lib/form";
import { submitReview } from "./actions";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage({ searchParams }: { searchParams: Promise<{ requested?: string }> }) {
  const user = await requireUser("/bookings");
  const { requested } = await searchParams;
  const bookings = await db.booking.findMany({
    where: { guestId: user.id },
    include: { review: true, slot: { include: { listing: { include: { host: true } } } } },
    orderBy: { slot: { startsAt: "desc" } },
  });

  return (
    <div className="space-y-6">
      <h1 className="h1">My bookings</h1>
      {requested && (
        <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Request sent! The host will confirm shortly. The exact address appears here once confirmed.
        </p>
      )}
      {bookings.length === 0 && (
        <p className="card p-8 text-center text-muted">
          No bookings yet. <Link href="/listings" className="underline">Find something delicious</Link>.
        </p>
      )}
      <div className="space-y-4">
        {bookings.map((b) => {
          const { listing } = b.slot;
          return (
            <div key={b.id} className="card space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={b.status} />
                <TypeBadge type={listing.type} />
                <span className="text-sm text-muted">{formatDateTime(b.slot.startsAt)}</span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/listings/${listing.id}`} className="font-serif text-lg font-semibold hover:text-terracotta">
                  {listing.title}
                </Link>
                <span className="font-semibold">{formatEuros(b.totalCents)}</span>
              </div>
              <p className="text-sm text-muted">
                {listing.host.displayName} · {b.quantity} {listing.type === "DINE_IN" ? "guest(s)" : "portion(s)"} ·{" "}
                {listing.type === "DELIVERY"
                  ? `Delivered to: ${b.deliveryAddress}`
                  : `Address: ${visibleAddress({ host: listing.host, viewerIsHost: false, bookingStatus: b.status })}`}
              </p>
              {(b.status === "CONFIRMED" || b.status === "COMPLETED") && listing.host.phone && (
                <p className="text-sm">Host phone: {listing.host.phone}</p>
              )}

              {canTransition(b.status, "CANCELLED", "GUEST") && (
                <StatusButton bookingId={b.id} status="CANCELLED" label="Cancel booking" />
              )}

              {b.status === "COMPLETED" &&
                (b.review ? (
                  <p className="text-sm text-muted">Your review: {"★".repeat(b.review.rating)} {b.review.comment}</p>
                ) : (
                  <ActionForm action={submitReview} className="grid gap-2 border-t border-line pt-3 sm:grid-cols-[auto_1fr_auto]">
                    <input type="hidden" name="bookingId" value={b.id} />
                    <select name="rating" className="input" defaultValue="5" aria-label="Rating">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {"★".repeat(n)}
                        </option>
                      ))}
                    </select>
                    <input name="comment" className="input" placeholder="How was it?" maxLength={1000} aria-label="Comment" />
                    <SubmitButton>Leave review</SubmitButton>
                  </ActionForm>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
