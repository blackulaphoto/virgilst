import { normalizeTreatmentPrice } from "./treatmentPresentation";

export type QualityIssue = { id: number | string; name: string; field: string; value: unknown; reason: string };

type ResourceLike = {
  id: number | string;
  name?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: number | string | null;
  updatedAt?: number | string | null;
};

type TreatmentLike = ResourceLike & {
  priceRange?: string | null;
  acceptsPrivateInsurance?: number | boolean | null;
  isVerified?: number | boolean | null;
};

function baseIssues(item: ResourceLike): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const name = item.name?.trim() || "(missing name)";
  if (!item.name?.trim()) issues.push({ id: item.id, name, field: "name", value: item.name, reason: "missing name" });
  if (/^(test|todo|tbd|placeholder|lorem ipsum)$/i.test(name)) issues.push({ id: item.id, name, field: "name", value: item.name, reason: "suspicious placeholder" });
  if (item.website) {
    try { new URL(/^https?:\/\//i.test(item.website) ? item.website : `https://${item.website}`); }
    catch { issues.push({ id: item.id, name, field: "website", value: item.website, reason: "invalid URL" }); }
  }
  if (item.latitude != null && (item.latitude < -90 || item.latitude > 90)) issues.push({ id: item.id, name, field: "latitude", value: item.latitude, reason: "invalid coordinate" });
  if (item.longitude != null && (item.longitude < -180 || item.longitude > 180)) issues.push({ id: item.id, name, field: "longitude", value: item.longitude, reason: "invalid coordinate" });
  for (const field of ["createdAt", "updatedAt"] as const) {
    const value = item[field];
    if (typeof value === "number" && value > 0 && value < 946684800) issues.push({ id: item.id, name, field, value, reason: "timestamp predates 2000" });
  }
  return issues;
}

export function auditResourceRecords(records: ResourceLike[]): QualityIssue[] {
  const issues = records.flatMap(baseIssues);
  const ids = new Set<number | string>();
  for (const record of records) {
    if (ids.has(record.id)) issues.push({ id: record.id, name: record.name || "(missing name)", field: "id", value: record.id, reason: "duplicate ID" });
    ids.add(record.id);
  }
  return issues;
}

export function auditTreatmentRecords(records: TreatmentLike[]): QualityIssue[] {
  const issues = records.flatMap(record => {
    const recordIssues = baseIssues(record);
    if (record.priceRange && normalizeTreatmentPrice(record.priceRange) === null) {
      recordIssues.push({ id: record.id, name: record.name || "(missing name)", field: "priceRange", value: record.priceRange, reason: "malformed or implausibly low price" });
    }
    if (record.acceptsPrivateInsurance && !record.isVerified) {
      recordIssues.push({ id: record.id, name: record.name || "(missing name)", field: "acceptsPrivateInsurance", value: record.acceptsPrivateInsurance, reason: "unverified insurance claim" });
    }
    return recordIssues;
  });
  const ids = new Set<number | string>();
  for (const record of records) {
    if (ids.has(record.id)) issues.push({ id: record.id, name: record.name || "(missing name)", field: "id", value: record.id, reason: "duplicate ID" });
    ids.add(record.id);
  }
  return issues;
}

export function summarizePrivateInsurance(records: TreatmentLike[]) {
  const claimed = records.filter(record => Boolean(record.acceptsPrivateInsurance)).length;
  return { total: records.length, claimed, share: records.length ? claimed / records.length : 0 };
}
