import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

async function createMeetingsTable() {
  console.log("📋 Creating meetings table...\n");

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,

        -- Schedule
        dayOfWeek TEXT NOT NULL,
        time TEXT NOT NULL,
        duration INTEGER,

        -- Location
        venueName TEXT,
        address TEXT,
        city TEXT,
        zipCode TEXT,
        latitude REAL,
        longitude REAL,

        -- Meeting format
        format TEXT NOT NULL,
        meetingMode TEXT NOT NULL,
        zoomId TEXT,
        zoomPassword TEXT,

        -- Special characteristics
        tags TEXT,

        -- Language
        language TEXT DEFAULT 'en' NOT NULL,

        -- Details
        description TEXT,
        notes TEXT,

        -- Metadata
        isVerified INTEGER DEFAULT 0 NOT NULL,
        isPublished INTEGER DEFAULT 1 NOT NULL,
        createdAt INTEGER DEFAULT (unixepoch()) NOT NULL,
        updatedAt INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);

    console.log("✅ Meetings table created successfully\n");

    // Create indexes
    await client.execute(`CREATE INDEX IF NOT EXISTS meetings_type_idx ON meetings(type)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS meetings_day_idx ON meetings(dayOfWeek)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS meetings_city_idx ON meetings(city)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS meetings_mode_idx ON meetings(meetingMode)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS meetings_published_idx ON meetings(isPublished)`);

    console.log("✅ Indexes created successfully\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    client.close();
  }
}

createMeetingsTable();
