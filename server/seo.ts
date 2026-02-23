import type { Express } from "express";
import * as db from "./db";

const BASE_URL = "https://www.virgilst.com";

const CORE_ROUTES = [
  "/",
  "/articles",
  "/resources",
  "/treatment",
  "/meetings",
  "/events",
  "/medical-providers",
  "/healthcare",
  "/healthcare/suboxone",
  "/videos",
  "/search",
  "/forum",
  "/map",
  "/jobs",
  "/get-involved",
];

const RESOURCE_CATEGORIES = ["food", "housing", "transportation", "dental", "legal", "shelter"];
const MEETING_PROGRAMS = ["aa", "na", "cma", "smart"];
const TREATMENT_PROGRAMS = ["sober-living", "detox", "residential", "outpatient", "dual-diagnosis"];
const PROVIDER_CITIES = [
  "los-angeles",
  "van-nuys",
  "encino",
  "tarzana",
  "burbank",
  "northridge",
  "culver-city",
  "mission-hills",
];
const JOB_CATEGORIES = [
  "entry-level",
  "warehouse",
  "retail",
  "construction",
  "delivery",
  "security",
  "food-service",
  "janitorial",
];

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

function xmlEscape(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toLastmod(value: unknown) {
  const numeric = typeof value === "number" ? value : 0;
  if (!numeric) return undefined;
  return new Date(numeric * 1000).toISOString();
}

export function buildUrlSet(entries: SitemapEntry[]) {
  const body = entries
    .map((entry) => {
      const parts = [
        `<loc>${xmlEscape(entry.loc)}</loc>`,
        entry.lastmod ? `<lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : "",
        entry.changefreq ? `<changefreq>${xmlEscape(entry.changefreq)}</changefreq>` : "",
        entry.priority ? `<priority>${xmlEscape(entry.priority)}</priority>` : "",
      ]
        .filter(Boolean)
        .join("");
      return `<url>${parts}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildSitemapIndex(paths: string[]) {
  const body = paths
    .map((path) => `<sitemap><loc>${xmlEscape(`${BASE_URL}${path}`)}</loc></sitemap>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export function buildRobotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /chat",
    "Disallow: /forum/new",
    "Disallow: /treatment/wizard",
    "Disallow: /favorites",
    "Disallow: /profile",
    "Disallow: /onboarding",
    "Disallow: /calendar",
    "Disallow: /404",
    "Disallow: /resources/map",
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(buildRobotsTxt());
  });

  app.get("/sitemap.xml", (_req, res) => {
    const xml = buildSitemapIndex([
      "/sitemaps/core.xml",
      "/sitemaps/articles.xml",
      "/sitemaps/forum.xml",
      "/sitemaps/city-category.xml",
      "/sitemaps/jobs.xml",
      "/sitemaps/jobs-categories.xml",
    ]);
    res.type("application/xml").send(xml);
  });

  app.get("/sitemaps/core.xml", (_req, res) => {
    const xml = buildUrlSet(
      CORE_ROUTES.map((route) => ({
        loc: `${BASE_URL}${route}`,
        changefreq: route === "/" ? "daily" : "weekly",
        priority: route === "/" ? "1.0" : "0.7",
      }))
    );
    res.type("application/xml").send(xml);
  });

  app.get("/sitemaps/articles.xml", async (_req, res) => {
    try {
      const articles = await db.getArticles({ isPublished: true });
      const entries = articles.map((article) => ({
        loc: `${BASE_URL}/articles/${article.slug}`,
        lastmod: toLastmod(article.updatedAt || article.createdAt),
        changefreq: "monthly",
        priority: "0.8",
      }));
      res.type("application/xml").send(buildUrlSet(entries));
    } catch (error) {
      console.error("[SEO] Failed to build article sitemap", error);
      res.type("application/xml").send(buildUrlSet([]));
    }
  });

  app.get("/sitemaps/forum.xml", async (_req, res) => {
    try {
      const posts = await db.getForumPosts({});
      const entries = posts.map((post) => ({
        loc: `${BASE_URL}/forum/${post.id}`,
        lastmod: toLastmod(post.updatedAt || post.createdAt),
        changefreq: "weekly",
        priority: "0.6",
      }));
      res.type("application/xml").send(buildUrlSet(entries));
    } catch (error) {
      console.error("[SEO] Failed to build forum sitemap", error);
      res.type("application/xml").send(buildUrlSet([]));
    }
  });

  app.get("/sitemaps/city-category.xml", (_req, res) => {
    const entries: SitemapEntry[] = [
      ...RESOURCE_CATEGORIES.map((category) => ({
        loc: `${BASE_URL}/resources/${category}`,
        changefreq: "weekly",
        priority: "0.7",
      })),
      ...MEETING_PROGRAMS.map((program) => ({
        loc: `${BASE_URL}/meetings/${program}`,
        changefreq: "weekly",
        priority: "0.7",
      })),
      ...TREATMENT_PROGRAMS.map((program) => ({
        loc: `${BASE_URL}/treatment/${program}`,
        changefreq: "weekly",
        priority: "0.7",
      })),
      ...PROVIDER_CITIES.map((city) => ({
        loc: `${BASE_URL}/medical-providers/${city}`,
        changefreq: "weekly",
        priority: "0.7",
      })),
    ];

    res.type("application/xml").send(buildUrlSet(entries));
  });

  // Job categories sitemap
  app.get("/sitemaps/jobs-categories.xml", (_req, res) => {
    const entries: SitemapEntry[] = JOB_CATEGORIES.map((category) => ({
      loc: `${BASE_URL}/jobs/category/${category}`,
      changefreq: "daily",
      priority: "0.8",
    }));

    res.type("application/xml").send(buildUrlSet(entries));
  });

  // Individual job listings sitemap
  app.get("/sitemaps/jobs.xml", async (_req, res) => {
    try {
      const jobs = await db.getJobs({ limit: 1000 });
      const entries = jobs.map((job) => ({
        loc: `${BASE_URL}/jobs/${job.slug}`,
        lastmod: toLastmod(job.createdAt),
        changefreq: "daily",
        priority: "0.7",
      }));
      res.type("application/xml").send(buildUrlSet(entries));
    } catch (error) {
      console.error("[SEO] Failed to build jobs sitemap", error);
      res.type("application/xml").send(buildUrlSet([]));
    }
  });

}
