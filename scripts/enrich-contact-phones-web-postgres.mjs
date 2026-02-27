import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import postgres from "postgres";

function resolveDatabaseUrl() {
  const privateUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;
  if (!privateUrl && !publicUrl) throw new Error("DATABASE_URL or DATABASE_PUBLIC_URL is required");
  if (!privateUrl) return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };
  try {
    const host = new URL(privateUrl).hostname.toLowerCase();
    if ((host.endsWith(".railway.internal") || host === "postgres.railway.internal") && publicUrl) {
      return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };
    }
  } catch {
    // Fall through.
  }
  return { url: privateUrl, source: "DATABASE_URL" };
}

const SERPAPI_KEY = process.env.SERPAPI_KEY;
if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY is required");

const resolvedDb = resolveDatabaseUrl();
const sql = postgres(resolvedDb.url, { max: 1 });
const outDir = path.resolve(process.cwd(), "data", "tag-audit-postgres");

const PHONE_REGEX = /(?:\+?1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?)\d{3}[\s.\-]?\d{4}/g;

function normalizeText(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function digitsOnly(v) {
  return String(v || "").replace(/\D/g, "");
}

function canonicalPhone(raw) {
  const d = digitsOnly(raw);
  const last10 = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (last10.length !== 10) return null;
  return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
}

function websiteHost(value) {
  if (!value) return "";
  try {
    const url = String(value).startsWith("http") ? String(value) : `https://${value}`;
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function extractPhones(text) {
  const out = new Set();
  const matches = String(text || "").match(PHONE_REGEX) || [];
  for (const m of matches) {
    const c = canonicalPhone(m);
    if (c) out.add(c);
  }
  return Array.from(out);
}

async function fetchUrlText(url) {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 4,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VirgilDataAudit/1.0)",
      },
      validateStatus: (s) => s >= 200 && s < 400,
    });
    return String(res.data || "");
  } catch {
    return "";
  }
}

async function websitePhones(website) {
  const host = websiteHost(website);
  if (!host) return { host: "", phones: [], evidence: [] };
  const base = website.startsWith("http") ? website : `https://${website}`;
  const urls = [
    base,
    `${base.replace(/\/+$/, "")}/contact`,
    `${base.replace(/\/+$/, "")}/contact-us`,
    `${base.replace(/\/+$/, "")}/about`,
  ];

  const evidence = [];
  const all = new Set();
  for (const url of urls) {
    const html = await fetchUrlText(url);
    if (!html) continue;
    const phones = extractPhones(html);
    if (phones.length > 0) {
      phones.forEach((p) => all.add(p));
      evidence.push(`${url} -> ${phones.join("; ")}`);
    }
  }
  return { host, phones: Array.from(all), evidence };
}

async function serpPhones(query, expectedHost = "") {
  try {
    const res = await axios.get("https://serpapi.com/search", {
      timeout: 12000,
      params: {
        q: query,
        engine: "google",
        num: 10,
        api_key: SERPAPI_KEY,
      },
    });
    const data = res.data || {};
    const candidates = new Map(); // phone -> score
    const reasons = new Map(); // phone -> reasons[]

    const add = (phone, score, why) => {
      const curr = candidates.get(phone) || 0;
      candidates.set(phone, curr + score);
      const r = reasons.get(phone) || [];
      r.push(why);
      reasons.set(phone, r);
    };

    const kgPhone = canonicalPhone(data?.knowledge_graph?.phone || "");
    if (kgPhone) add(kgPhone, 5, "knowledge_graph.phone");

    const local = data?.local_results?.places || [];
    for (const place of local) {
      const p = canonicalPhone(place.phone || "");
      if (p) add(p, 5, "local_results.phone");
    }

    const organic = data?.organic_results || [];
    for (const r of organic) {
      const text = `${r.title || ""} ${r.snippet || ""}`;
      const phones = extractPhones(text);
      const linkHost = websiteHost(r.link || "");
      for (const p of phones) {
        let score = 2;
        if (expectedHost && linkHost && linkHost === expectedHost) score += 3;
        add(p, score, `organic:${linkHost || "nohost"}`);
      }
    }

    return {
      candidates,
      reasons,
    };
  } catch {
    return {
      candidates: new Map(),
      reasons: new Map(),
    };
  }
}

function pickHighConfidence(record, websiteResult, serpResult) {
  const all = new Map();
  const why = new Map();
  const add = (phone, score, reason) => {
    all.set(phone, (all.get(phone) || 0) + score);
    const arr = why.get(phone) || [];
    arr.push(reason);
    why.set(phone, arr);
  };

  for (const p of websiteResult.phones) add(p, 7, "website");
  for (const [p, s] of serpResult.candidates) add(p, s, "serp");

  const ranked = Array.from(all.entries()).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;
  const [topPhone, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] || 0;

  // strict threshold: either strong website evidence or clear score margin
  const hasWebsiteEvidence = websiteResult.phones.includes(topPhone);
  const confident = hasWebsiteEvidence || (topScore >= 7 && topScore - secondScore >= 2);
  if (!confident) return null;

  return {
    phone: topPhone,
    score: topScore,
    reasons: (why.get(topPhone) || []).concat(serpResult.reasons.get(topPhone) || []),
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

async function writeCsv(filename, rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvEscape(row[c])).join(","));
  await fs.writeFile(path.join(outDir, filename), `${lines.join("\n")}\n`, "utf8");
}

async function processList(list, tableName) {
  const applied = [];
  const unresolved = [];

  for (const row of list) {
    const website = row.website || "";
    const host = websiteHost(website);
    const web = await websitePhones(website);

    const searchBits = [
      row.name,
      row.city || "",
      row.address || "",
      "phone",
      "California",
    ].filter(Boolean);
    const serp = await serpPhones(searchBits.join(" "), host);

    const pick = pickHighConfidence(row, web, serp);
    if (pick) {
      await sql.unsafe(
        `UPDATE "${tableName}" SET phone = $1, "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER WHERE id = $2 AND (phone IS NULL OR TRIM(phone) = '')`,
        [pick.phone, row.id]
      );
      applied.push({
        id: row.id,
        name: row.name,
        phone: pick.phone,
        score: pick.score,
        evidence: pick.reasons.join(" | "),
      });
    } else {
      unresolved.push({
        id: row.id,
        name: row.name,
        city: row.city || "",
        address: row.address || "",
        website: row.website || "",
      });
    }
  }

  return { applied, unresolved };
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });

  console.log("=======================================================");
  console.log("  WEB PHONE ENRICHMENT (RAILWAY POSTGRES)");
  console.log("=======================================================\n");

  const missingTreatment = await sql`
    SELECT id, name, city, address, website
    FROM treatment_centers
    WHERE "isPublished" = 1 AND (phone IS NULL OR TRIM(phone) = '')
    ORDER BY name
  `;
  const missingResources = await sql`
    SELECT id, name, type, NULL::text AS city, address, website
    FROM resources
    WHERE phone IS NULL OR TRIM(phone) = ''
    ORDER BY type, name
  `;

  console.log(`Targets: treatment=${missingTreatment.length}, resources=${missingResources.length}`);

  const treatmentResult = await processList(missingTreatment, "treatment_centers");
  const resourceResult = await processList(missingResources, "resources");

  const remainingTreatment = await sql`
    SELECT COUNT(*)::int AS count
    FROM treatment_centers
    WHERE "isPublished" = 1 AND (phone IS NULL OR TRIM(phone) = '')
  `;
  const remainingResources = await sql`
    SELECT COUNT(*)::int AS count
    FROM resources
    WHERE phone IS NULL OR TRIM(phone) = ''
  `;

  await writeCsv(
    "web_enrichment_applied_treatment.csv",
    treatmentResult.applied,
    ["id", "name", "phone", "score", "evidence"]
  );
  await writeCsv(
    "web_enrichment_applied_resources.csv",
    resourceResult.applied,
    ["id", "name", "phone", "score", "evidence"]
  );
  await writeCsv(
    "web_enrichment_unresolved_treatment.csv",
    treatmentResult.unresolved,
    ["id", "name", "city", "address", "website"]
  );
  await writeCsv(
    "web_enrichment_unresolved_resources.csv",
    resourceResult.unresolved,
    ["id", "name", "city", "address", "website"]
  );

  const summary = [
    `Treatment phones web-filled: ${treatmentResult.applied.length}`,
    `Resources phones web-filled: ${resourceResult.applied.length}`,
    `Treatment phones still missing: ${remainingTreatment[0]?.count || 0}`,
    `Resources phones still missing: ${remainingResources[0]?.count || 0}`,
  ].join("\n");

  await fs.writeFile(path.join(outDir, "web_enrichment_summary.txt"), `${summary}\n`, "utf8");
  console.log(summary);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });

