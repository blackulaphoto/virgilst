const normalizeBaseUrl = (value: string | undefined) => {
  if (!value) return "";
  return value.replace(/\/+$/, "");
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const buildApiUrl = (path: string) => {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
};

