import postgres from "postgres";

const dbUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required");
}

const sql = postgres(dbUrl, { max: 1 });

async function run() {
  await sql`
    ALTER TABLE resources
    ADD COLUMN IF NOT EXISTS "isFeatured" INTEGER NOT NULL DEFAULT 0
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "resources_featured_idx"
    ON resources ("isFeatured")
  `;

  const featuredCount = await sql`
    SELECT COUNT(*)::int AS count
    FROM resources
    WHERE "isFeatured" = 1
  `;

  console.log(`featured_resources=${featuredCount[0]?.count || 0}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });

