import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  // Redirect URI will be set dynamically based on request origin
);

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getRedirectUri(req: Request): string {
  const forwardedProtoHeader = req.headers["x-forwarded-proto"];
  const protoList = Array.isArray(forwardedProtoHeader)
    ? forwardedProtoHeader
    : (forwardedProtoHeader || "").split(",");
  const forwardedProtoIsHttps = protoList.some(proto => proto.trim().toLowerCase() === "https");
  const protocol = req.secure || forwardedProtoIsHttps ? "https" : "http";
  const host = req.headers.host || "localhost:3000";
  return `${protocol}://${host}/api/auth/google/callback`;
}

function resolveFrontendRedirect(nextPath: string): string {
  const safePath = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  if (!FRONTEND_ORIGIN) return safePath;

  try {
    return new URL(safePath, FRONTEND_ORIGIN).toString();
  } catch {
    return safePath;
  }
}

export function registerOAuthRoutes(app: Express) {
  // ====================
  // DEV LOGIN (Local Development Only)
  // ====================
  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    if (IS_PRODUCTION) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const nextRaw = getQueryParam(req, "next") ?? "/";
    const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

    const openId = process.env.OWNER_OPEN_ID || "local-admin";
    const name = "Local Dev User";

    try {
      await db.upsertUser({
        openId,
        name,
        email: "dev@localhost",
        loginMethod: "dev",
        lastSignedIn: Date.now(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, next);
    } catch (error) {
      console.error("[OAuth] Dev login failed", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });

  // ====================
  // GOOGLE OAUTH - INITIATE
  // ====================
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(500).json({ error: "Google OAuth not configured" });
      return;
    }

    const nextRaw = getQueryParam(req, "next") ?? "/";
    const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
    const redirectUri = getRedirectUri(req);

    // Generate authorization URL
    const authorizeUrl = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      state: Buffer.from(JSON.stringify({ next, redirectUri })).toString("base64"),
      redirect_uri: redirectUri,
      prompt: "select_account", // Force account selection for security
    });

    res.redirect(302, authorizeUrl);
  });

  // ====================
  // GOOGLE OAUTH - CALLBACK
  // ====================
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const stateParam = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");

    // Handle user cancellation
    if (error === "access_denied") {
      res.redirect(302, "/?error=auth_cancelled");
      return;
    }

    if (!code || !stateParam) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // Decode state to get redirect path
      const state = JSON.parse(Buffer.from(stateParam, "base64").toString());
      const next = state.next || "/";
      const redirectTarget = resolveFrontendRedirect(next);
      const redirectUri = state.redirectUri || getRedirectUri(req);

      // Exchange authorization code for tokens
      const { tokens } = await googleClient.getToken({
        code,
        redirect_uri: redirectUri,
      });

      if (!tokens.id_token) {
        throw new Error("No ID token received from Google");
      }

      // Verify the ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error("Invalid token payload");
      }

      // Extract user information
      const googleId = payload.sub; // Google's unique user ID
      const email = payload.email || null;
      const name = payload.name || payload.email || "User";
      const picture = payload.picture || null;

      console.log("[OAuth] Google login:", { email, name, googleId });

      // Upsert user in database
      await db.upsertUser({
        openId: `google:${googleId}`, // Prefix to indicate Google OAuth
        name,
        email,
        avatarUrl: picture,
        loginMethod: "google",
        lastSignedIn: Date.now(),
      });

      // Create session token using your existing SDK
      const sessionToken = await sdk.createSessionToken(`google:${googleId}`, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set HTTP-only cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log("[OAuth] Login successful, redirecting to:", redirectTarget);
      res.redirect(302, redirectTarget);
    } catch (error) {
      console.error("[OAuth] Google callback failed:", error);
      res.redirect(302, "/?error=auth_failed");
    }
  });

  // ====================
  // LOGOUT
  // ====================
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
    res.json({ success: true });
  });

  app.get("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
    res.redirect(302, "/");
  });

  // ====================
  // LEGACY: Old OAuth callback (for backwards compatibility)
  // ====================
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    // Redirect to Google OAuth flow
    const next = getQueryParam(req, "next") || "/";
    res.redirect(302, `/api/auth/google?next=${encodeURIComponent(next)}`);
  });

  // ====================
  // LEGACY: App auth (for backwards compatibility)
  // ====================
  app.get("/app-auth", (req: Request, res: Response) => {
    if (IS_PRODUCTION) {
      // In production, use Google OAuth
      const next = getQueryParam(req, "next") || "/";
      res.redirect(302, `/api/auth/google?next=${encodeURIComponent(next)}`);
    } else {
      // In development, use dev login
      const next = getQueryParam(req, "next") || "/";
      res.redirect(302, `/api/auth/dev-login?next=${encodeURIComponent(next)}`);
    }
  });
}
