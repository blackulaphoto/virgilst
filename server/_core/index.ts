import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeDatabaseIfEmpty } from "./init-db";

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
}

function buildAllowedOrigins() {
  const envOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);
  const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim();
  const defaults =
    process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : [];
  const combined = [
    ...envOrigins,
    ...(frontendOrigin ? [frontendOrigin] : []),
    ...defaults,
  ];
  return Array.from(new Set(combined));
}

function createCorsMiddleware() {
  const allowedOrigins = buildAllowedOrigins();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Vary", "Origin");
    }

    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  };
}

async function startServer() {
  // Initialize database with snapshot data if empty (production auto-setup)
  if (process.env.NODE_ENV === "production") {
    await initializeDatabaseIfEmpty();
  }

  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  app.use(createCorsMiddleware());
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("[server] startup failed", error);
  process.exit(1);
});
