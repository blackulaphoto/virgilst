import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

async function createResourceFeedbackTable() {
  console.log("🔧 Creating resource_feedback table...\n");

  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS resource_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resourceId INTEGER NOT NULL REFERENCES resources(id),
        userId INTEGER REFERENCES users(id),

        feedbackType TEXT NOT NULL,
        isStillOpen INTEGER,
        visitedAt INTEGER,

        comment TEXT,
        updatedInfo TEXT,

        helpfulCount INTEGER NOT NULL DEFAULT 0,
        notHelpfulCount INTEGER NOT NULL DEFAULT 0,

        isVerified INTEGER NOT NULL DEFAULT 0,
        verifiedBy INTEGER REFERENCES users(id),
        verifiedAt INTEGER,

        createdAt INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    // Create indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS resourceFeedback_resource_idx ON resource_feedback(resourceId)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS resourceFeedback_type_idx ON resource_feedback(feedbackType)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS resourceFeedback_status_idx ON resource_feedback(isStillOpen)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS resourceFeedback_verified_idx ON resource_feedback(isVerified)`);

    console.log("✅ resource_feedback table created successfully!");
    console.log("\n📋 Table structure:");
    console.log("   • resourceId - Links to resources table");
    console.log("   • feedbackType - still_open, closed, incorrect_info, updated_info");
    console.log("   • isStillOpen - 1=open, 0=closed, null=unknown");
    console.log("   • visitedAt - When user visited");
    console.log("   • comment - User feedback text");
    console.log("   • updatedInfo - JSON with corrections");
    console.log("   • helpfulCount - Community voting");
    console.log("   • isVerified - Admin verification");

  } catch (error: any) {
    console.error("❌ Error creating table:", error.message);
  } finally {
    client.close();
  }
}

createResourceFeedbackTable();
