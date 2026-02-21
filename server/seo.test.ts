import { describe, expect, it } from "vitest";
import { buildRobotsTxt, buildSitemapIndex, buildUrlSet } from "./seo";

describe("SEO server helpers", () => {
  it("builds a sitemap index with child sitemap URLs", () => {
    const xml = buildSitemapIndex(["/sitemaps/core.xml", "/sitemaps/articles.xml"]);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("https://www.virgilst.com/sitemaps/core.xml");
    expect(xml).toContain("https://www.virgilst.com/sitemaps/articles.xml");
  });

  it("builds a urlset with loc and lastmod", () => {
    const xml = buildUrlSet([
      {
        loc: "https://www.virgilst.com/articles/test",
        lastmod: "2026-02-13T01:35:59.000Z",
        changefreq: "weekly",
        priority: "0.8",
      },
    ]);
    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://www.virgilst.com/articles/test</loc>");
    expect(xml).toContain("<lastmod>2026-02-13T01:35:59.000Z</lastmod>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("builds robots rules including sitemap", () => {
    const robots = buildRobotsTxt();
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: https://www.virgilst.com/sitemap.xml");
  });
});

