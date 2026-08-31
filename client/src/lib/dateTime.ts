const SECONDS_CUTOFF = 100_000_000_000;

export function toValidDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number") {
    const milliseconds = Math.abs(value) < SECONDS_CUTOFF ? value * 1000 : value;
    const parsed = new Date(milliseconds);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const numeric = Number(value);
  if (/^-?\d+(?:\.\d+)?$/.test(value.trim()) && Number.isFinite(numeric)) {
    return toValidDate(numeric);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value: Date | string | number | null | undefined, fallback = "Date unavailable"): string {
  return toValidDate(value)?.toLocaleDateString() ?? fallback;
}

export function toIsoDate(value: Date | string | number | null | undefined): string | undefined {
  return toValidDate(value)?.toISOString();
}
