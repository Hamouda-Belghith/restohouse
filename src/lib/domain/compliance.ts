import { isValidSiret } from "./siret";

export type HostStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export interface HostBasicsInput {
  displayName?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
}

export interface ComplianceInput extends HostBasicsInput {
  siret?: string | null;
  ddppDeclarationDate?: Date | null;
  hygieneTrainingDate?: Date | null;
  insurer?: string | null;
  insurancePolicyNumber?: string | null;
  housingConsent?: boolean | null;
  charterAccepted?: boolean | null;
}

/** Problems keyed by form field name, so the UI can highlight each field. Empty when valid. */
export type FieldErrors = Record<string, string>;

const blank = (s?: string | null) => !s || !s.trim();

/** What a user needs to open a host account (and start preparing offers). */
export function hostBasicsErrors(p: HostBasicsInput): FieldErrors {
  const errors: FieldErrors = {};
  if (blank(p.displayName)) errors.displayName = "Public host name is required.";
  if (blank(p.addressLine)) errors.addressLine = "Street address is required.";
  if (!/^\d{5}$/.test(p.postalCode ?? "")) errors.postalCode = "A 5-digit French postal code is required.";
  if (blank(p.city)) errors.city = "City is required.";
  return errors;
}

/** Legal & hygiene items a host must provide before verification (and therefore publishing). */
export function legalErrors(p: ComplianceInput, now: Date): FieldErrors {
  const errors: FieldErrors = {};
  if (!p.siret || !isValidSiret(p.siret)) {
    errors.siret = "A valid 14-digit SIRET is required (register as micro-entrepreneur).";
  }
  if (!p.ddppDeclarationDate || p.ddppDeclarationDate > now) {
    errors.ddppDeclarationDate = "Date of your food-activity declaration to the DDPP (Cerfa 13984) is required.";
  }
  if (!p.hygieneTrainingDate || p.hygieneTrainingDate > now) {
    errors.hygieneTrainingDate = "Date of your completed 14h food-hygiene (HACCP) training is required.";
  }
  if (blank(p.insurer)) errors.insurer = "Professional civil liability insurer is required.";
  if (blank(p.insurancePolicyNumber)) errors.insurancePolicyNumber = "Insurance policy number is required.";
  if (!p.housingConsent) errors.housingConsent = "Confirm your lease / co-ownership rules allow this activity.";
  if (!p.charterAccepted) errors.charterAccepted = "Accept the RestoHouse hygiene & safety charter.";
  return errors;
}

/** Everything blocking a review submission or an approval. */
export function complianceErrors(p: ComplianceInput, now: Date): FieldErrors {
  return { ...hostBasicsErrors(p), ...legalErrors(p, now) };
}

export function canPublish(status: string): boolean {
  return status === "APPROVED";
}
