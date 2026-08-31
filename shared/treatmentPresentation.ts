const KNOWN_UNKNOWN_VALUES = new Set(["", "unknown", "n/a", "na", "none", "varies", "contact"]);

export function normalizeTreatmentPrice(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (KNOWN_UNKNOWN_VALUES.has(raw.toLowerCase())) return null;
  if (/^free$/i.test(raw)) return "Free";

  const amounts = raw.match(/\d[\d,]*(?:\.\d{1,2})?/g)?.map(part => Number(part.replace(/,/g, ""))) ?? [];
  if (amounts.length === 0 || amounts.some(amount => !Number.isFinite(amount) || amount < 100)) return null;

  const hasRange = amounts.length > 1;
  const formatted = amounts.slice(0, 2).map(amount => `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
  return hasRange ? `${formatted[0]}–${formatted[1]}` : formatted[0];
}

export function formatTreatmentPrice(value: string | number | null | undefined): string {
  const normalized = normalizeTreatmentPrice(value);
  if (!normalized) return "Contact for pricing";
  return normalized === "Free" ? normalized : `${normalized}/month`;
}

export function isDatabaseTrue(value: number | string | boolean | null | undefined): boolean {
  return value === true || value === 1 || value === "1";
}

export function shouldShowInsuranceClaim(value: number | string | boolean | null | undefined, isVerified: number | string | boolean | null | undefined): boolean {
  return isDatabaseTrue(value) && isDatabaseTrue(isVerified);
}
