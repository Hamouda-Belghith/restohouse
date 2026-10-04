const LA_POSTE_SIREN = "356000000";

/** Validates a French SIRET (14 digits, Luhn checksum, La Poste exception). Spaces are ignored. */
export function isValidSiret(raw: string): boolean {
  const siret = raw.replace(/\s/g, "");
  if (!/^\d{14}$/.test(siret)) return false;

  const digits = [...siret].map(Number);
  if (siret.startsWith(LA_POSTE_SIREN)) {
    return digits.reduce((a, b) => a + b, 0) % 5 === 0;
  }

  const sum = digits.reduce((acc, d, i) => {
    // From the right, double every second digit: index 0 of 14 digits is doubled.
    if (i % 2 === 0) {
      const doubled = d * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + d;
  }, 0);
  return sum % 10 === 0;
}
