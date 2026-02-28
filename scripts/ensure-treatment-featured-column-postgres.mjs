import postgres from "postgres";

const dbUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required");
}

const sql = postgres(dbUrl, { max: 1 });

async function run() {
  await sql`
    ALTER TABLE treatment_centers
    ADD COLUMN IF NOT EXISTS "isFeatured" INTEGER NOT NULL DEFAULT 0
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "treatmentCenters_featured_idx"
    ON treatment_centers ("isFeatured")
  `;

  const featuredCount = await sql`
    SELECT COUNT(*)::int AS count
    FROM treatment_centers
    WHERE "isFeatured" = 1
  `;

  console.log(`featured_treatment_centers=${featuredCount[0]?.count || 0}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });

