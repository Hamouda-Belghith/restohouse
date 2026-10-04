import { ActionForm, SubmitButton } from "./ActionForm";
import { updateBookingStatus } from "@/app/bookings/actions";

const STYLES: Record<string, string> = {
  REQUESTED: "bg-saffron/20 text-[#8a5a00]",
  CONFIRMED: "bg-olive/15 text-olive",
  COMPLETED: "bg-ink/10 text-ink",
  DECLINED: "bg-red-50 text-red-800",
  CANCELLED: "bg-red-50 text-red-800",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? ""}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

/** A small form posting one status change for a booking. */
export function StatusButton({
  bookingId,
  status,
  label,
  primary = false,
}: {
  bookingId: string;
  status: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <ActionForm action={updateBookingStatus} className="inline-block">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={primary ? "btn" : "btn-ghost"}>{label}</SubmitButton>
    </ActionForm>
  );
}
