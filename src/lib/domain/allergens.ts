import { fail, ok, type Result } from "./result";

/** The 14 allergens of EU Regulation 1169/2011, Annex II. */
export const ALLERGENS = [
  { code: "gluten", label: "Cereals containing gluten" },
  { code: "crustaceans", label: "Crustaceans" },
  { code: "eggs", label: "Eggs" },
  { code: "fish", label: "Fish" },
  { code: "peanuts", label: "Peanuts" },
  { code: "soybeans", label: "Soybeans" },
  { code: "milk", label: "Milk (incl. lactose)" },
  { code: "nuts", label: "Tree nuts" },
  { code: "celery", label: "Celery" },
  { code: "mustard", label: "Mustard" },
  { code: "sesame", label: "Sesame" },
  { code: "sulphites", label: "Sulphites (> 10 mg/kg)" },
  { code: "lupin", label: "Lupin" },
  { code: "molluscs", label: "Molluscs" },
] as const;

const CODES = new Set<string>(ALLERGENS.map((a) => a.code));

export function allergenLabel(code: string): string {
  return ALLERGENS.find((a) => a.code === code)?.label ?? code;
}

/** Every offer must declare its allergens explicitly: a list, or a confirmed "none of the 14". */
export function validateAllergens(codes: string[], confirmedNone: boolean): Result<string[]> {
  const unique = [...new Set(codes)];
  const unknown = unique.filter((c) => !CODES.has(c));
  if (unknown.length) return fail([`Unknown allergen code(s): ${unknown.join(", ")}`]);
  if (confirmedNone && unique.length) return fail(["You selected allergens but also confirmed the dish contains none."]);
  if (!confirmedNone && !unique.length) {
    return fail(["Declare the allergens (EU 1169/2011) or confirm the dish contains none of the 14."]);
  }
  return ok(unique);
}
