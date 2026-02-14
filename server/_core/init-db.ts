/**
 * Database initialization for production deployments
 * Automatically imports snapshot data if database is empty
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";

type SnapshotTable = {
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

type SnapshotFile = {
  version: number;
  sourceUrl: string;
  createdAt: string;
  tables: SnapshotTable[];
};

function quoteIdent(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function tableExists(client: ReturnType<typeof createClient>, tableName: string) {
  const result = await client.execute({
    sql: "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
    args: [tableName],
  });
  return result.rows.length > 0;
}

async function getResourceCount(client: ReturnType<typeof createClient>) {
  try {
    const result = await client.execute("SELECT COUNT(*) AS c FROM resources");
    const raw = result.rows[0]?.c;
    if (typeof raw === "number") return raw;
    return Number(raw ?? 0);
  } catch (error) {
    // Table might not exist yet
    return 0;
  }
}

async function insertTableRows(
  client: ReturnType<typeof createClient>,
  table: SnapshotTable,
  batchSize: number = 100
) {
  if (table.rows.length === 0) return;

  const colList = table.columns.map(quoteIdent).join(", ");
  const placeholders = table.columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${quoteIdent(table.name)} (${colList}) VALUES (${placeholders})`;

  for (let i = 0; i < table.rows.length; i += batchSize) {
    const batch = table.rows.slice(i, i + batchSize);
    for (const row of batch) {
      const args = table.columns.map(col => (row[col] ?? null) as any);
      try {
        await client.execute({ sql, args });
      } catch (error) {
        console.error(`[init-db] Error inserting row in ${table.name}:`, error);
      }
    }
  }
}

/**
 * Initialize database with snapshot data if empty
 * Returns true if initialization was performed, false if skipped
 */
export async function initializeDatabaseIfEmpty(): Promise<boolean> {
  console.log("[init-db] Starting initialization check...");
  console.log("[init-db] Working directory:", process.cwd());
  console.log("[init-db] NODE_ENV:", process.env.NODE_ENV);
  console.log("[init-db] DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn("[init-db] DATABASE_URL not set, skipping initialization");
    return false;
  }

  const snapshotPath = path.resolve(process.cwd(), "data", "db-snapshot.json");
  console.log("[init-db] Looking for snapshot at:", snapshotPath);

  try {
    // Check if snapshot file exists
    await fs.access(snapshotPath);
  } catch (error) {
    console.warn("[init-db] No snapshot file found at:", snapshotPath);
    return false;
  }

  const client = createClient({ url: databaseUrl });

  try {
    // Check if resources table exists
    const resourcesExists = await tableExists(client, "resources");
    if (!resourcesExists) {
      console.log("[init-db] Database schema not initialized yet, skipping snapshot import");
      console.log("[init-db] Run 'pnpm run db:push' to create tables first");
      return false;
    }

    // Check if database is already populated
    const resourceCount = await getResourceCount(client);

    if (resourceCount > 0) {
      console.log(`[init-db] Database already populated with ${resourceCount} resources`);
      return false;
    }

    console.log("[init-db] Database is empty, importing snapshot...");

    // Load snapshot
    const raw = await fs.readFile(snapshotPath, "utf8");
    const snapshot = JSON.parse(raw) as SnapshotFile;

    if (snapshot.version !== 1) {
      console.error(`[init-db] Unsupported snapshot version: ${snapshot.version}`);
      return false;
    }

    // Import data
    await client.execute("PRAGMA foreign_keys = OFF");
    await client.execute("BEGIN");
    let transactionStarted = true;

    try {
      for (const table of snapshot.tables) {
        const exists = await tableExists(client, table.name);
        if (!exists) {
          console.warn(`[init-db] Skipping missing table: ${table.name}`);
          continue;
        }

        await insertTableRows(client, table);
        console.log(`[init-db] ✓ ${table.name}: ${table.rows.length} rows`);
      }

      await client.execute("COMMIT");
      await client.execute("PRAGMA foreign_keys = ON");

      const afterCount = await getResourceCount(client);
      console.log(`[init-db] ✅ Snapshot imported successfully! (${afterCount} resources)`);

      return true;
    } catch (error) {
      if (transactionStarted) {
        await client.execute("ROLLBACK");
      }
      console.error("[init-db] Import failed, rolled back:", error);
      return false;
    }
  } catch (error) {
    console.error("[init-db] Initialization error:", error);
    return false;
  } finally {
    await client.close();
  }
}
