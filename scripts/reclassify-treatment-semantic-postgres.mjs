import postgres from "postgres";

function resolveDatabaseUrl() {
  const privateUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;

  if (!privateUrl && !publicUrl) {
    throw new Error("DATABASE_URL or DATABASE_PUBLIC_URL is required");
  }
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
const sql = postgres(resolvedDb.url);
const apply = process.env.APPLY === "1";

const TRANSPORT_RE =
  /\b(bus|metro|tap card|transit|transport(?:ation)?|ride pass|bus pass|free rides?)\b/i;
const SUBOXONE_RE =
  /\b(suboxone|sublocade|buprenorphine|mat\b|medication[-\s]?assisted)\b/i;
const THERAPY_RE =
  /\b(therapy clinic|therap(?:y|ist)|behavioral health|mental health clinic|counseling (?:center|clinic)|psychotherapy)\b/i;

function toCategory(row) {
  const blob = `${row.name || ""} ${row.description || ""} ${row.servicesOffered || ""} ${row.type || ""} ${row.city || ""}`;
  const normalizedType = String(row.type || "").trim().toLowerCase();
  const outpatientLike = normalizedType === "outpatient" || normalizedType === "iop_php";
  const clinicLike = /\b(clinic|medical|health|telehealth)\b/i.test(blob);

  if (TRANSPORT_RE.test(blob)) {
    return {
      targetType: "transportation",
      reason: "transport/bus-pass keyword",
    };
  }
  if (SUBOXONE_RE.test(blob)) {
    if (normalizedType === "detox" || normalizedType === "residential" || normalizedType === "sober_living") {
      return null;
    }
    if (!(outpatientLike || clinicLike)) return null;
    return {
      targetType: "medical",
      reason: "suboxone/MAT keyword",
    };
  }
  if (THERAPY_RE.test(blob)) {
    if (!outpatientLike) return null;
    return {
      targetType: "medical",
      reason: "therapy/behavioral-health keyword",
    };
  }
  return null;
}

async function findExistingResource(name, address) {
  const rows = await sql`
    SELECT id
    FROM resources
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(${name}))
      AND COALESCE(LOWER(TRIM(address)), '') = COALESCE(LOWER(TRIM(${address || ""})), '')
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function migrateRow(row, mapping) {
  const existingResourceId = await findExistingResource(row.name, row.address);
  if (!existingResourceId) {
    await sql`
      INSERT INTO resources (
        name, description, type, address, phone, website, "websiteTitle", "websiteDescription",
        "websiteImage", "websiteFavicon", hours, filters, "zipCode", latitude, longitude,
        "isVerified", "isFeatured", "createdAt", "updatedAt"
      ) VALUES (
        ${row.name},
        ${row.description || "Migrated from treatment centers due to semantic category mismatch."},
        ${mapping.targetType},
        ${row.address || null},
        ${row.phone || null},
        ${row.website || null},
        ${row.websiteTitle || null},
        ${row.websiteDescription || null},
        ${row.websiteImage || null},
        ${row.websiteFavicon || null},
        null,
        '{}',
        ${row.zipCode || null},
        ${row.latitude ?? null},
        ${row.longitude ?? null},
        ${row.isVerified ?? 0},
        ${row.isFeatured ?? 0},
        EXTRACT(EPOCH FROM NOW())::INTEGER,
        EXTRACT(EPOCH FROM NOW())::INTEGER
      )
    `;
  }

  await sql`DELETE FROM treatment_centers WHERE id = ${row.id}`;
}

async function run() {
  console.log("=======================================================");
  console.log(" SEMANTIC TREATMENT RECLASSIFICATION (RAILWAY POSTGRES)");
  console.log("=======================================================\n");
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}\n`);

  const rows = await sql`
    SELECT
      id, name, type, description, address, city, "zipCode", phone, website,
      "websiteTitle", "websiteDescription", "websiteImage", "websiteFavicon",
      latitude, longitude, "servicesOffered", "isVerified", "isFeatured"
    FROM treatment_centers
    WHERE "isPublished" = 1
    ORDER BY id
  `;

  const candidates = [];
  for (const row of rows) {
    const mapping = toCategory(row);
    if (mapping) candidates.push({ row, mapping });
  }

  console.log(`Published treatment rows scanned: ${rows.length}`);
  console.log(`Semantic move candidates: ${candidates.length}\n`);

  const counts = {};
  for (const item of candidates) {
    const key = `${item.mapping.targetType} | ${item.mapping.reason}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  console.log("Candidate breakdown:");
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, count]) => console.log(`- ${key}: ${count}`));

  console.log("\nCandidates:");
  candidates.forEach((item) => {
    console.log(`- ${item.row.id}\t${item.row.type}\t${item.row.name}\t=> resources.${item.mapping.targetType} (${item.mapping.reason})`);
  });

  if (!apply) {
    return;
  }

  let moved = 0;
  for (const item of candidates) {
    await migrateRow(item.row, item.mapping);
    moved += 1;
  }

  console.log(`\nApplied moves: ${moved}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
