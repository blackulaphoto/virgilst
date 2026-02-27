import fs from "node:fs/promises";
import path from "node:path";
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

const resolvedDb = resolveDatabaseUrl();
const sql = postgres(resolvedDb.url, { max: 1 });
const outDir = path.resolve(process.cwd(), "data", "tag-audit-postgres");

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return raw;
}

function websiteHost(value) {
  if (!value) return "";
  try {
    const withProto = String(value).startsWith("http") ? String(value) : `https://${value}`;
    return new URL(withProto).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pushIndex(map, key, source) {
  if (!key) return;
  const curr = map.get(key) || [];
  curr.push(source);
  map.set(key, curr);
}

function uniquePhones(sources) {
  return Array.from(new Set(sources.map((s) => s.phone).filter(Boolean)));
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

function pickPhone(target, indexes, tableHint) {
  const name = normalizeText(target.name);
  const city = normalizeText(target.city);
  const address = normalizeText(target.address);
  const host = websiteHost(target.website);

  const keys = [
    { rank: 1, key: `name_city:${name}|${city}` },
    { rank: 2, key: `name_addr:${name}|${address}` },
    { rank: 3, key: `name:${name}` },
    { rank: 4, key: `host:${host}` },
  ];

  for (const { rank, key } of keys) {
    if (!key.endsWith(":") && !key.endsWith("|")) {
      const sources = indexes.get(key) || [];
      const filtered = tableHint
        ? sources.filter((s) => s.table === tableHint || rank >= 3)
        : sources;
      const phones = uniquePhones(filtered);
      if (phones.length === 1) {
        return { phone: phones[0], matchKey: key, rank, sources: filtered };
      }
    }
  }

  return null;
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });

  console.log("=======================================================");
  console.log("  CONTACT ENRICHMENT PASS (RAILWAY POSTGRES)");
  console.log("=======================================================\n");
  console.log(`Database source: ${resolvedDb.source}`);

  const sourceRows = await sql`
    WITH all_rows AS (
      SELECT 'treatment_centers'::text AS table_name, id, name, city, address, website, phone
      FROM treatment_centers
      WHERE phone IS NOT NULL AND TRIM(phone) <> ''
      UNION ALL
      SELECT 'resources'::text AS table_name, id, name, NULL::text AS city, address, website, phone
      FROM resources
      WHERE phone IS NOT NULL AND TRIM(phone) <> ''
      UNION ALL
      SELECT 'medi_cal_providers'::text AS table_name, id, "providerName" AS name, city, address, NULL::text AS website, phone
      FROM medi_cal_providers
      WHERE phone IS NOT NULL AND TRIM(phone) <> ''
    )
    SELECT * FROM all_rows
  `;

  const indexes = new Map();
  for (const row of sourceRows) {
    const phone = normalizePhone(row.phone);
    if (!phone) continue;
    const source = {
      table: row.table_name,
      id: row.id,
      phone,
    };
    const name = normalizeText(row.name);
    const city = normalizeText(row.city);
    const address = normalizeText(row.address);
    const host = websiteHost(row.website);
    pushIndex(indexes, `name_city:${name}|${city}`, source);
    pushIndex(indexes, `name_addr:${name}|${address}`, source);
    pushIndex(indexes, `name:${name}`, source);
    pushIndex(indexes, `host:${host}`, source);
  }

  const missingTreatment = await sql`
    SELECT id, name, city, address, website
    FROM treatment_centers
    WHERE "isPublished" = 1 AND (phone IS NULL OR TRIM(phone) = '')
    ORDER BY name
  `;
  const missingResources = await sql`
    SELECT id, name, type, address, website
    FROM resources
    WHERE phone IS NULL OR TRIM(phone) = ''
    ORDER BY type, name
  `;

  const treatmentUpdates = [];
  const resourceUpdates = [];
  const unresolvedTreatment = [];
  const unresolvedResources = [];

  for (const row of missingTreatment) {
    const match = pickPhone(row, indexes, "treatment_centers");
    if (match) {
      treatmentUpdates.push({ id: row.id, phone: match.phone, matchKey: match.matchKey, rank: match.rank });
    } else {
      unresolvedTreatment.push({ id: row.id, name: row.name, city: row.city || "", address: row.address || "", website: row.website || "" });
    }
  }

  for (const row of missingResources) {
    const match = pickPhone(row, indexes, "resources");
    if (match) {
      resourceUpdates.push({ id: row.id, phone: match.phone, matchKey: match.matchKey, rank: match.rank, type: row.type || "" });
    } else {
      unresolvedResources.push({ id: row.id, name: row.name, type: row.type || "", address: row.address || "", website: row.website || "" });
    }
  }

  if (treatmentUpdates.length > 0) {
    for (const u of treatmentUpdates) {
      await sql`
        UPDATE treatment_centers
        SET phone = ${u.phone},
            "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
        WHERE id = ${u.id}
          AND (phone IS NULL OR TRIM(phone) = '')
      `;
    }
  }

  if (resourceUpdates.length > 0) {
    for (const u of resourceUpdates) {
      await sql`
        UPDATE resources
        SET phone = ${u.phone},
            "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
        WHERE id = ${u.id}
          AND (phone IS NULL OR TRIM(phone) = '')
      `;
    }
  }

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
    "contact_enrichment_applied_treatment.csv",
    treatmentUpdates,
    ["id", "phone", "matchKey", "rank"]
  );
  await writeCsv(
    "contact_enrichment_applied_resources.csv",
    resourceUpdates,
    ["id", "type", "phone", "matchKey", "rank"]
  );
  await writeCsv(
    "contact_enrichment_unresolved_treatment.csv",
    unresolvedTreatment,
    ["id", "name", "city", "address", "website"]
  );
  await writeCsv(
    "contact_enrichment_unresolved_resources.csv",
    unresolvedResources,
    ["id", "name", "type", "address", "website"]
  );

  const summary = [
    `Treatment phones auto-filled: ${treatmentUpdates.length}`,
    `Resources phones auto-filled: ${resourceUpdates.length}`,
    `Treatment phones still missing: ${remainingTreatment[0]?.count || 0}`,
    `Resources phones still missing: ${remainingResources[0]?.count || 0}`,
  ].join("\n");

  await fs.writeFile(path.join(outDir, "contact_enrichment_summary.txt"), `${summary}\n`, "utf8");

  console.log(summary);
  console.log(`\nWrote enrichment artifacts to: ${outDir}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });

