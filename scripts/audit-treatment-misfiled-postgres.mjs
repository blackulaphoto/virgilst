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

const allowedTreatmentTypes = new Set([
  "sober_living",
  "detox",
  "residential",
  "outpatient",
  "iop_php",
  "dual_diagnosis",
]);

const nonTreatmentKeyword =
  /\b(housing|shelter|bridge housing|family living|domestic violence|hotline|food bank|pantry|legal aid|employment|job center|transportation|bus pass|parenting class|aa meeting|na meeting|smart recovery|support group|resource fair)\b/i;
const housingNameKeyword = /\b(housing|home|house|residence|living)\b/i;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

async function run() {
  console.log("=======================================================");
  console.log(" TREATMENT MODULE MISFILE AUDIT (RAILWAY POSTGRES)");
  console.log("=======================================================\n");

  try {
    console.log(`Database source: ${resolvedDb.source} (${new URL(resolvedDb.url).hostname})\n`);
  } catch {
    console.log(`Database source: ${resolvedDb.source}\n`);
  }

  const rows = await sql`
    SELECT id, name, type, city, description
    FROM treatment_centers
    WHERE "isPublished" = 1
    ORDER BY id
  `;

  const invalidTypeRows = rows.filter((row) => !allowedTreatmentTypes.has(normalize(row.type)));
  const keywordSuspects = rows.filter((row) =>
    nonTreatmentKeyword.test(`${row.name || ""} ${row.description || ""}`)
  );
  const housingNameMatches = rows.filter((row) => housingNameKeyword.test(row.name || ""));

  console.log(`Published treatment rows: ${rows.length}`);
  console.log(`Rows with non-standard treatment type: ${invalidTypeRows.length}`);
  console.log(`Rows matching non-treatment keywords: ${keywordSuspects.length}\n`);
  console.log(`Rows with housing-style names (housing/home/house/residence/living): ${housingNameMatches.length}\n`);

  if (invalidTypeRows.length > 0) {
    console.log("Non-standard type rows:");
    for (const row of invalidTypeRows) {
      console.log(`- ${row.id}\t${row.type}\t${row.name}`);
    }
    console.log("");
  }

  if (keywordSuspects.length > 0) {
    console.log("Keyword suspect rows:");
    for (const row of keywordSuspects) {
      console.log(`- ${row.id}\t${row.type}\t${row.name}`);
    }
  }

  if (housingNameMatches.length > 0) {
    console.log("\nHousing-style name rows:");
    for (const row of housingNameMatches) {
      console.log(`- ${row.id}\t${row.type}\t${row.name}`);
    }
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
