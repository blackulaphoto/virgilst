import "dotenv/config";
import postgres from "postgres";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "mediCal_providerName_trgm_idx"
      ON medi_cal_providers USING gin ("providerName" gin_trgm_ops)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "mediCal_facilityName_trgm_idx"
      ON medi_cal_providers USING gin ("facilityName" gin_trgm_ops)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "mediCal_searchTerms_trgm_idx"
      ON medi_cal_providers USING gin ("searchTerms" gin_trgm_ops)
    `);
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "mediCal_normalizedSpecialties_trgm_idx"
      ON medi_cal_providers USING gin ("normalizedSpecialties" gin_trgm_ops)
    `);

    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "providerCategories_category_idx"
      ON provider_categories ("categoryKey")
    `);

    console.log("[medi-cal indexes] ensured");
  } finally {
    await sql.end();
  }
}

main().catch(error => {
  console.error("[medi-cal indexes] failed:", error);
  process.exit(1);
});
