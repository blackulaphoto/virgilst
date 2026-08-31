export type ResourceGeography = "los_angeles" | "statewide" | "outside_los_angeles" | "unknown";

type ResourceLocation = {
  name?: string | null;
  description?: string | null;
  address?: string | null;
  zipCode?: string | null;
};

const LA_ZIP_PREFIXES = new Set(Array.from({ length: 19 }, (_, index) => String(900 + index)));

export function classifyResourceGeography(resource: ResourceLocation): ResourceGeography {
  const zip = resource.zipCode?.match(/\b(\d{5})\b/)?.[1] ?? resource.address?.match(/\b(\d{5})\b/)?.[1];
  const text = [resource.name, resource.description, resource.address].filter(Boolean).join(" ").toLowerCase();

  if (
    text.includes("los angeles") ||
    text.includes("la county") ||
    text.includes("l.a. county") ||
    (zip && LA_ZIP_PREFIXES.has(zip.slice(0, 3)))
  ) {
    return "los_angeles";
  }

  if (text.includes("statewide") || text.includes("all california") || (!resource.address && text.includes("california"))) {
    return "statewide";
  }

  if (resource.address || zip) return "outside_los_angeles";
  return "unknown";
}

export function sortResourcesForLosAngeles<T extends ResourceLocation>(items: T[]): T[] {
  const rank: Record<ResourceGeography, number> = {
    los_angeles: 0,
    statewide: 1,
    unknown: 2,
    outside_los_angeles: 3,
  };
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank[classifyResourceGeography(a.item)] - rank[classifyResourceGeography(b.item)] || a.index - b.index)
    .map(({ item }) => item);
}

export function resourceGeographyLabel(resource: ResourceLocation): string | null {
  switch (classifyResourceGeography(resource)) {
    case "los_angeles": return "Los Angeles area";
    case "statewide": return "California statewide";
    case "outside_los_angeles": return "Outside Los Angeles area";
    default: return null;
  }
}
