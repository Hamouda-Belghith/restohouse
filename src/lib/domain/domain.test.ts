import { describe, expect, it } from "vitest";
import { isValidSiret } from "./siret";
import { ALLERGENS, validateAllergens } from "./allergens";
import { canPublish, missingComplianceItems, type ComplianceInput } from "./compliance";
import { validateListingInput, validateSlotCapacity, type ListingInput } from "./listing";
import { canTransition, remainingCapacity, validateBookingRequest, type BookingRequest } from "./booking";
import { visibleAddress } from "./privacy";
import { averageRating, canReview } from "./reviews";

const NOW = new Date("2026-10-04T12:00:00Z");

describe("siret", () => {
  it("accepts a Luhn-valid 14-digit SIRET", () => {
    expect(isValidSiret("73282932000074")).toBe(true);
    expect(isValidSiret("732 829 320 00074")).toBe(true);
  });
  it("rejects bad checksum, wrong length and letters", () => {
    expect(isValidSiret("73282932000075")).toBe(false);
    expect(isValidSiret("123")).toBe(false);
    expect(isValidSiret("7328293200007A")).toBe(false);
  });
  it("applies the La Poste exception (digit sum % 5)", () => {
    expect(isValidSiret("35600000000001")).toBe(true);
    expect(isValidSiret("35600000000002")).toBe(false);
  });
});

describe("allergens", () => {
  it("lists the 14 EU allergens", () => {
    expect(ALLERGENS).toHaveLength(14);
  });
  it("requires an explicit declaration", () => {
    expect(validateAllergens([], false).ok).toBe(false);
    expect(validateAllergens([], true)).toEqual({ ok: true, value: [] });
  });
  it("rejects unknown codes and contradictions", () => {
    const unknown = validateAllergens(["gluten", "xyz"], false);
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.errors.join()).toContain("xyz");
    expect(validateAllergens(["gluten"], true).ok).toBe(false);
  });
  it("deduplicates valid codes", () => {
    expect(validateAllergens(["milk", "milk", "eggs"], false)).toEqual({ ok: true, value: ["milk", "eggs"] });
  });
});

describe("compliance", () => {
  const complete: ComplianceInput = {
    displayName: "Chez Amel",
    addressLine: "12 rue des Lilas",
    postalCode: "75011",
    city: "Paris",
    siret: "73282932000074",
    ddppDeclarationDate: new Date("2026-01-10"),
    hygieneTrainingDate: new Date("2025-11-02"),
    insurer: "MAIF",
    insurancePolicyNumber: "RC-123",
    housingConsent: true,
    charterAccepted: true,
  };
  it("returns nothing missing for a complete profile", () => {
    expect(missingComplianceItems(complete, NOW)).toEqual([]);
  });
  it("lists every missing item for an empty profile", () => {
    const missing = missingComplianceItems({}, NOW);
    for (const key of ["displayName", "address", "siret", "ddpp", "hygieneTraining", "insurance", "housingConsent", "charter"]) {
      expect(missing.some((m) => m.startsWith(key))).toBe(true);
    }
  });
  it("rejects an invalid SIRET and a hygiene training in the future", () => {
    const missing = missingComplianceItems(
      { ...complete, siret: "123", hygieneTrainingDate: new Date("2027-01-01") },
      NOW,
    );
    expect(missing.some((m) => m.startsWith("siret"))).toBe(true);
    expect(missing.some((m) => m.startsWith("hygieneTraining"))).toBe(true);
  });
  it("only approved hosts can publish", () => {
    expect(canPublish("APPROVED")).toBe(true);
    for (const s of ["DRAFT", "PENDING", "REJECTED"]) expect(canPublish(s)).toBe(false);
  });
});

describe("listing", () => {
  const base: ListingInput = {
    title: "Couscous au poisson de Djerba",
    description: "Family recipe, served with harissa.",
    cuisine: "Tunisian",
    type: "PICKUP",
    priceCents: 1400,
    allergens: ["fish", "gluten"],
    allergensConfirmedNone: false,
    city: "Paris",
  };
  it("accepts a valid pickup listing", () => {
    expect(validateListingInput(base).ok).toBe(true);
  });
  it("rejects non-positive price and missing title", () => {
    expect(validateListingInput({ ...base, priceCents: 0 }).ok).toBe(false);
    expect(validateListingInput({ ...base, title: "  " }).ok).toBe(false);
  });
  it("requires a 1-15 km radius for delivery", () => {
    expect(validateListingInput({ ...base, type: "DELIVERY", deliveryRadiusKm: 0 }).ok).toBe(false);
    expect(validateListingInput({ ...base, type: "DELIVERY", deliveryRadiusKm: 16 }).ok).toBe(false);
    expect(validateListingInput({ ...base, type: "DELIVERY", deliveryRadiusKm: 5, deliveryFeeCents: 300 }).ok).toBe(true);
  });
  it("rejects unknown types and missing allergen declaration", () => {
    expect(validateListingInput({ ...base, type: "CATERING" }).ok).toBe(false);
    expect(validateListingInput({ ...base, allergens: [] }).ok).toBe(false);
  });
  it("caps dine-in seats at 12 per slot", () => {
    expect(validateSlotCapacity("DINE_IN", 12).ok).toBe(true);
    expect(validateSlotCapacity("DINE_IN", 13).ok).toBe(false);
    expect(validateSlotCapacity("PICKUP", 0).ok).toBe(false);
    expect(validateSlotCapacity("PICKUP", 40).ok).toBe(true);
  });
});

describe("booking", () => {
  const req: BookingRequest = {
    guestId: "g1",
    hostUserId: "h1",
    listingType: "PICKUP",
    priceCents: 1200,
    deliveryFeeCents: 0,
    slotStartsAt: new Date("2026-10-05T19:00:00Z"),
    slotCapacity: 10,
    existingBookings: [
      { quantity: 4, status: "CONFIRMED" },
      { quantity: 3, status: "DECLINED" },
      { quantity: 2, status: "REQUESTED" },
    ],
    quantity: 2,
    now: NOW,
  };
  it("counts only active bookings against capacity", () => {
    expect(remainingCapacity(10, req.existingBookings)).toBe(4);
  });
  it("computes the total", () => {
    expect(validateBookingRequest(req)).toEqual({ ok: true, value: { totalCents: 2400 } });
  });
  it("adds the delivery fee once for delivery", () => {
    const r = validateBookingRequest({ ...req, listingType: "DELIVERY", deliveryFeeCents: 350, deliveryAddress: "3 quai X, Lyon" });
    expect(r).toEqual({ ok: true, value: { totalCents: 2750 } });
  });
  it("rejects overbooking, past slots, own listing, bad quantity", () => {
    expect(validateBookingRequest({ ...req, quantity: 5 }).ok).toBe(false);
    expect(validateBookingRequest({ ...req, slotStartsAt: new Date("2026-10-04T11:00:00Z") }).ok).toBe(false);
    expect(validateBookingRequest({ ...req, guestId: "h1" }).ok).toBe(false);
    expect(validateBookingRequest({ ...req, quantity: 0 }).ok).toBe(false);
    expect(validateBookingRequest({ ...req, quantity: 1.5 }).ok).toBe(false);
  });
  it("requires an address for delivery", () => {
    expect(validateBookingRequest({ ...req, listingType: "DELIVERY", deliveryAddress: " " }).ok).toBe(false);
  });
  it("enforces status transitions per actor", () => {
    expect(canTransition("REQUESTED", "CONFIRMED", "HOST")).toBe(true);
    expect(canTransition("REQUESTED", "DECLINED", "HOST")).toBe(true);
    expect(canTransition("REQUESTED", "CONFIRMED", "GUEST")).toBe(false);
    expect(canTransition("REQUESTED", "CANCELLED", "GUEST")).toBe(true);
    expect(canTransition("CONFIRMED", "COMPLETED", "HOST")).toBe(true);
    expect(canTransition("CONFIRMED", "COMPLETED", "GUEST")).toBe(false);
    expect(canTransition("CONFIRMED", "CANCELLED", "GUEST")).toBe(true);
    expect(canTransition("COMPLETED", "CANCELLED", "HOST")).toBe(false);
    expect(canTransition("DECLINED", "CONFIRMED", "HOST")).toBe(false);
  });
});

describe("privacy", () => {
  const host = { addressLine: "12 rue des Lilas", postalCode: "75011", city: "Paris" };
  it("hides the exact address from guests until confirmed", () => {
    expect(visibleAddress({ host, viewerIsHost: false, bookingStatus: "REQUESTED" })).toBe("Paris");
    expect(visibleAddress({ host, viewerIsHost: false, bookingStatus: null })).toBe("Paris");
    expect(visibleAddress({ host, viewerIsHost: false, bookingStatus: "CONFIRMED" })).toBe("12 rue des Lilas, 75011 Paris");
    expect(visibleAddress({ host, viewerIsHost: true, bookingStatus: null })).toBe("12 rue des Lilas, 75011 Paris");
  });
});

describe("reviews", () => {
  const booking = { guestId: "g1", status: "COMPLETED", hasReview: false };
  it("only the guest of a completed, unreviewed booking can review", () => {
    expect(canReview(booking, "g1", 5).ok).toBe(true);
    expect(canReview(booking, "x", 5).ok).toBe(false);
    expect(canReview({ ...booking, status: "CONFIRMED" }, "g1", 5).ok).toBe(false);
    expect(canReview({ ...booking, hasReview: true }, "g1", 5).ok).toBe(false);
    expect(canReview(booking, "g1", 6).ok).toBe(false);
    expect(canReview(booking, "g1", 0).ok).toBe(false);
  });
  it("averages ratings to one decimal", () => {
    expect(averageRating([])).toBeNull();
    expect(averageRating([5, 4, 4])).toBe(4.3);
  });
});
