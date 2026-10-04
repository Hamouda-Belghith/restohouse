import { fail, ok, type Result } from "./result";

export function canReview(
  booking: { guestId: string; status: string; hasReview: boolean },
  userId: string,
  rating: number,
): Result<true> {
  if (booking.guestId !== userId) return fail(["Only the guest can review this booking."]);
  if (booking.status !== "COMPLETED") return fail(["You can review once the booking is completed."]);
  if (booking.hasReview) return fail(["You already reviewed this booking."]);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(["Rating must be between 1 and 5."]);
  return ok(true);
}

export function averageRating(ratings: number[]): number | null {
  if (!ratings.length) return null;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}
