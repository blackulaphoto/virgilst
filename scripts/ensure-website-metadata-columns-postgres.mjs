import postgres from "postgres";

const dbUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required");
}

const sql = postgres(dbUrl, { max: 1 });

async function run() {
  await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS "websiteTitle" TEXT`;
  await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS "websiteDescription" TEXT`;
  await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS "websiteImage" TEXT`;
  await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS "websiteFavicon" TEXT`;

  await sql`ALTER TABLE treatment_centers ADD COLUMN IF NOT EXISTS "websiteTitle" TEXT`;
  await sql`ALTER TABLE treatment_centers ADD COLUMN IF NOT EXISTS "websiteDescription" TEXT`;
  await sql`ALTER TABLE treatment_centers ADD COLUMN IF NOT EXISTS "websiteImage" TEXT`;
  await sql`ALTER TABLE treatment_centers ADD COLUMN IF NOT EXISTS "websiteFavicon" TEXT`;

  console.log("website_metadata_columns=ok");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
