/** State returned by server actions used with useActionState. */
export type FormState = { errors?: string[]; message?: string } | undefined;

export const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** Parses a euro amount like "14" or "14,50" into integer cents; NaN when invalid. */
export function eurosToCents(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

export function dateOrNull(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(d);
}
