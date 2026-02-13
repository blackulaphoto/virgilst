import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

async function createMediCalProvidersTable() {
  console.log("🏥 Creating medi_cal_providers table...\n");

  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS medi_cal_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        providerName TEXT NOT NULL,
        facilityName TEXT,
        npi TEXT,
        stateLicense TEXT,

        address TEXT,
        city TEXT,
        state TEXT DEFAULT 'CA',
        zipCode TEXT,
        distance TEXT,

        phone TEXT,

        specialties TEXT,
        gender TEXT,
        languagesSpoken TEXT,
        boardCertifications TEXT,

        networks TEXT,
        hospitalAffiliations TEXT,
        medicalGroups TEXT,

        isVerified INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    await db.run(sql`CREATE INDEX IF NOT EXISTS mediCal_city_idx ON medi_cal_providers(city)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS mediCal_zip_idx ON medi_cal_providers(zipCode)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS mediCal_npi_idx ON medi_cal_providers(npi)`);

    console.log("✅ medi_cal_providers table created successfully!");

  } catch (error: any) {
    console.error("❌ Error creating table:", error.message);
  } finally {
    client.close();
  }
}

createMediCalProvidersTable();
