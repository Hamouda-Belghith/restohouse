import Link from "next/link";
import { StatusButton, StatusPill } from "@/components/BookingStatus";
import { TypeBadge } from "@/components/ListingCard";
import { requireApprovedHost } from "@/lib/auth";
import { db } from "@/lib/db";
import { canTransition } from "@/lib/domain/booking";
import { formatDateTime, formatEuros } from "@/lib/form";

export const dynamic = "force-dynamic";

export default async function HostBookingsPage() {
  const { profile } = await requireApprovedHost();
  const bookings = await db.booking.findMany({
    where: { slot: { listing: { hostId: profile.id } } },
    include: { guest: { select: { name: true } }, slot: { include: { listing: true } } },
    orderBy: { slot: { startsAt: "asc" } },
  });
  const can = (from: string, to: string) => canTransition(from, to, "HOST");

  return (
    <div className="space-y-6">
      <Link href="/host" className="text-sm underline">← Dashboard</Link>
      <h1 className="h1">Incoming bookings</h1>
      {bookings.length === 0 && <p className="card p-8 text-center text-muted">No bookings yet.</p>}
      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="card space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={b.status} />
              <TypeBadge type={b.slot.listing.type} />
              <span className="text-sm font-medium">{formatDateTime(b.slot.startsAt)}</span>
              <span className="ml-auto font-semibold">{formatEuros(b.totalCents)}</span>
            </div>
            <p className="text-sm">
              <strong>{b.guest.name}</strong> · {b.quantity} × {b.slot.listing.title}
            </p>
            {b.deliveryAddress && <p className="text-sm text-muted">Deliver to: {b.deliveryAddress}</p>}
            {b.note && <p className="text-sm text-muted">“{b.note}”</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {can(b.status, "CONFIRMED") && <StatusButton bookingId={b.id} status="CONFIRMED" label="Confirm" primary />}
              {can(b.status, "DECLINED") && <StatusButton bookingId={b.id} status="DECLINED" label="Decline" />}
              {can(b.status, "COMPLETED") && <StatusButton bookingId={b.id} status="COMPLETED" label="Mark completed" primary />}
              {b.status === "CONFIRMED" && can(b.status, "CANCELLED") && (
                <StatusButton bookingId={b.id} status="CANCELLED" label="Cancel" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
