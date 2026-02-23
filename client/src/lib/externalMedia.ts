export function normalizeExternalUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getFaviconUrl(rawUrl?: string | null): string | null {
  const normalized = normalizeExternalUrl(rawUrl);
  if (!normalized) return null;
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(normalized)}`;
}

export function getDisplayDomain(rawUrl?: string | null): string | null {
  const normalized = normalizeExternalUrl(rawUrl);
  if (!normalized) return null;

  try {
    const hostname = new URL(normalized).hostname;
    return hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}
