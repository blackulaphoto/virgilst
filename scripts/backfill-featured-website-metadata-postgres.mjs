import axios from "axios";
import * as cheerio from "cheerio";
import postgres from "postgres";

const dbUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required");
}

const sql = postgres(dbUrl, { max: 1 });

function normalizeUrl(rawUrl) {
  if (!rawUrl) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function resolveUrl(rawUrl, baseUrl) {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

async function scrapeMetadata(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  const finalUrl = response.request?.res?.responseUrl || url;
  const $ = cheerio.load(response.data);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").first().text() ||
    null;
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;
  const imageUrl = resolveUrl(
    $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content"),
    finalUrl
  );
  const faviconUrl = resolveUrl(
    $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href"),
    finalUrl
  );

  return {
    title: title?.trim() || null,
    description: description?.trim() || null,
    imageUrl,
    faviconUrl,
  };
}

async function updateFeaturedResources() {
  const rows = await sql`
    SELECT id, website
    FROM resources
    WHERE "isFeatured" = 1
      AND website IS NOT NULL
      AND TRIM(website) <> ''
  `;

  let updated = 0;
  for (const row of rows) {
    const url = normalizeUrl(row.website);
    if (!url) continue;
    try {
      const metadata = await scrapeMetadata(url);
      await sql`
        UPDATE resources
        SET "websiteTitle" = ${metadata.title},
            "websiteDescription" = ${metadata.description},
            "websiteImage" = ${metadata.imageUrl},
            "websiteFavicon" = ${metadata.faviconUrl},
            "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
        WHERE id = ${row.id}
      `;
      updated += 1;
    } catch {
      // Best-effort; skip failed domains.
    }
  }
  return { total: rows.length, updated };
}

async function updateFeaturedTreatment() {
  const rows = await sql`
    SELECT id, website
    FROM treatment_centers
    WHERE "isFeatured" = 1
      AND website IS NOT NULL
      AND TRIM(website) <> ''
  `;

  let updated = 0;
  for (const row of rows) {
    const url = normalizeUrl(row.website);
    if (!url) continue;
    try {
      const metadata = await scrapeMetadata(url);
      await sql`
        UPDATE treatment_centers
        SET "websiteTitle" = ${metadata.title},
            "websiteDescription" = ${metadata.description},
            "websiteImage" = ${metadata.imageUrl},
            "websiteFavicon" = ${metadata.faviconUrl},
            "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
        WHERE id = ${row.id}
      `;
      updated += 1;
    } catch {
      // Best-effort; skip failed domains.
    }
  }
  return { total: rows.length, updated };
}

async function run() {
  const resources = await updateFeaturedResources();
  const treatment = await updateFeaturedTreatment();
  console.log(`featured_resources_checked=${resources.total}`);
  console.log(`featured_resources_updated=${resources.updated}`);
  console.log(`featured_treatment_checked=${treatment.total}`);
  console.log(`featured_treatment_updated=${treatment.updated}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
