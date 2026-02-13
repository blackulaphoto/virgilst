import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

async function createEventsTable() {
  console.log("📅 Creating events table...\n");

  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,

        -- Event type and category
        eventType TEXT NOT NULL,
        category TEXT,

        -- Schedule
        startDate INTEGER,
        endDate INTEGER,
        startTime TEXT,
        endTime TEXT,

        -- Recurring event support
        isRecurring INTEGER NOT NULL DEFAULT 0,
        recurrencePattern TEXT,
        recurrenceDetails TEXT,

        -- Location
        venueName TEXT,
        address TEXT,
        city TEXT,
        zipCode TEXT,
        latitude REAL,
        longitude REAL,

        -- Online event support
        isOnline INTEGER NOT NULL DEFAULT 0,
        onlineUrl TEXT,

        -- Contact information
        phone TEXT,
        email TEXT,
        website TEXT,
        registrationUrl TEXT,

        -- Services & features offered (JSON arrays)
        servicesOffered TEXT,
        tags TEXT,

        -- Requirements & eligibility
        eligibility TEXT,
        registrationRequired INTEGER NOT NULL DEFAULT 0,
        cost TEXT DEFAULT 'Free',

        -- Organizer information
        organizerName TEXT,
        organizerId INTEGER REFERENCES users(id),

        -- Metadata
        isPublished INTEGER NOT NULL DEFAULT 1,
        isFeatured INTEGER NOT NULL DEFAULT 0,
        viewCount INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
        updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    // Create indexes
    await db.run(`CREATE INDEX IF NOT EXISTS events_type_idx ON events(eventType)`);
    await db.run(`CREATE INDEX IF NOT EXISTS events_category_idx ON events(category)`);
    await db.run(`CREATE INDEX IF NOT EXISTS events_city_idx ON events(city)`);
    await db.run(`CREATE INDEX IF NOT EXISTS events_start_date_idx ON events(startDate)`);
    await db.run(`CREATE INDEX IF NOT EXISTS events_recurring_idx ON events(isRecurring)`);
    await db.run(`CREATE INDEX IF NOT EXISTS events_published_idx ON events(isPublished)`);

    console.log("✅ Events table created successfully!");
    console.log("📋 Table supports:");
    console.log("   • One-time and recurring events");
    console.log("   • In-person and online events");
    console.log("   • Service offerings tracking");
    console.log("   • Eligibility and requirements");
    console.log("   • Geographic filtering");
    console.log("   • Event categorization\n");

  } catch (error: any) {
    console.error("❌ Error creating events table:", error.message);
  }

  client.close();
}

createEventsTable();
