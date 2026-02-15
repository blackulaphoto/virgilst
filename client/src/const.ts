export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { buildApiUrl } from "./lib/api";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const isDevelopment = import.meta.env.DEV;

  // In development, use dev login for quick testing
  // In production, use Google OAuth
  const authEndpoint = isDevelopment ? "/api/auth/dev-login" : "/api/auth/google";

  const authUrl = buildApiUrl(authEndpoint);
  const url = authUrl.startsWith("http")
    ? new URL(authUrl)
    : new URL(authUrl, window.location.origin);
  url.searchParams.set("next", currentPath || "/");

  return url.toString();
};
