import { isValidSiret } from "./siret";

export type HostStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export interface ComplianceInput {
  displayName?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  siret?: string | null;
  ddppDeclarationDate?: Date | null;
  hygieneTrainingDate?: Date | null;
  insurer?: string | null;
  insurancePolicyNumber?: string | null;
  housingConsent?: boolean | null;
  charterAccepted?: boolean | null;
}

const blank = (s?: string | null) => !s || !s.trim();

/**
 * Items blocking submission for review. Each entry is "key: human message";
 * the key prefix is stable so the UI and tests can rely on it.
 */
export function missingComplianceItems(p: ComplianceInput, now: Date): string[] {
  const missing: string[] = [];
  if (blank(p.displayName)) missing.push("displayName: Public host name is required.");
  if (blank(p.addressLine) || blank(p.city) || !/^\d{5}$/.test(p.postalCode ?? "")) {
    missing.push("address: A full French address (street, 5-digit postal code, city) is required.");
  }
  if (!p.siret || !isValidSiret(p.siret)) missing.push("siret: A valid 14-digit SIRET is required (register as micro-entrepreneur).");
  if (!p.ddppDeclarationDate || p.ddppDeclarationDate > now) {
    missing.push("ddpp: Date of your food-activity declaration to the DDPP (Cerfa 13984) is required.");
  }
  if (!p.hygieneTrainingDate || p.hygieneTrainingDate > now) {
    missing.push("hygieneTraining: Date of your completed 14h food-hygiene (HACCP) training is required.");
  }
  if (blank(p.insurer) || blank(p.insurancePolicyNumber)) {
    missing.push("insurance: Professional civil liability insurance (insurer + policy number) is required.");
  }
  if (!p.housingConsent) missing.push("housingConsent: Confirm your lease / co-ownership rules allow this activity.");
  if (!p.charterAccepted) missing.push("charter: Accept the RestoHouse hygiene & safety charter.");
  return missing;
}

export function canPublish(status: string): boolean {
  return status === "APPROVED";
}
