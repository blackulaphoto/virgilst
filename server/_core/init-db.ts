/**
 * Database initialization for production deployments.
 * Automatically imports snapshot data if database is empty.
 */
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

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

const TABLE_IMPORT_PRIORITY: Record<string, number> = {
  users: 10,
  legalCases: 20,
  calendarEvents: 30,
  caseDocuments: 30,
  caseMilestones: 30,
  articles: 40,
  resources: 40,
  map_pins: 40,
  forum_posts: 40,
  treatment_centers: 40,
  meetings: 40,
  events: 40,
  medi_cal_providers: 40,
  videos: 40,
  knowledge_documents: 50,
  chat_conversations: 60,
  forum_replies: 60,
  pin_comments: 60,
  resource_feedback: 60,
  favorite_articles: 70,
  favorite_map_pins: 70,
  followed_threads: 70,
  chat_messages: 80,
  knowledge_chunks: 90,
};

function sortTablesForImport(tables: SnapshotTable[]): SnapshotTable[] {
  return [...tables].sort((a, b) => {
    const pa = TABLE_IMPORT_PRIORITY[a.name] ?? 1000;
    const pb = TABLE_IMPORT_PRIORITY[b.name] ?? 1000;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });
}

function quoteIdent(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function normalizeValueForInsert(column: string, value: unknown): unknown {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 2147483647 &&
    (/(At|Time|Date)$/i.test(column) || column === "lastSignedIn")
  ) {
    return Math.floor(value / 1000);
  }
  return value;
}

async function tableExists(client: ReturnType<typeof postgres>, tableName: string) {
  const result = await client`SELECT 1 FROM information_schema.tables WHERE table_name = ${tableName} LIMIT 1`;
  return result.length > 0;
}

async function getResourceCount(client: ReturnType<typeof postgres>) {
  try {
    const result = await client`SELECT COUNT(*) AS c FROM resources`;
    return Number(result[0]?.c ?? 0);
  } catch {
    return 0;
  }
}

async function getImportSummary(client: ReturnType<typeof postgres>) {
  const result = await client`
    SELECT
      (SELECT COUNT(*) FROM resources) AS resources,
      (SELECT COUNT(*) FROM articles) AS articles,
      (SELECT COUNT(*) FROM medi_cal_providers) AS medi_cal_providers,
      (SELECT COUNT(*) FROM treatment_centers) AS treatment_centers,
      (SELECT COUNT(*) FROM meetings) AS meetings
  `;
  return result[0];
}

async function insertTableRows(
  client: ReturnType<typeof postgres>,
  table: SnapshotTable,
  batchSize: number = 100
) {
  if (table.rows.length === 0) return;

  const columns = table.columns.map(quoteIdent).join(", ");
  const placeholders = table.columns.map((_, idx) => `$${idx + 1}`).join(", ");
  const sql = `INSERT INTO ${quoteIdent(table.name)} (${columns}) VALUES (${placeholders})`;

  for (let i = 0; i < table.rows.length; i += batchSize) {
    const batch = table.rows.slice(i, i + batchSize);
    for (const row of batch) {
      const values = table.columns.map(col => normalizeValueForInsert(col, row[col] ?? null)) as any[];
      await client.unsafe(sql, values);
    }
  }
}

/**
 * Initialize database with snapshot data if empty.
 * Returns true if initialization was performed, false if skipped.
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
    await fs.access(snapshotPath);
  } catch {
    console.warn("[init-db] No snapshot file found at:", snapshotPath);
    return false;
  }

  const client = postgres(databaseUrl);

  try {
    const resourcesExists = await tableExists(client, "resources");
    if (!resourcesExists) {
      console.log("[init-db] Database schema not initialized yet, skipping snapshot import");
      console.log("[init-db] Run 'pnpm run db:push' to create tables first");
      return false;
    }

    const resourceCount = await getResourceCount(client);
    if (resourceCount > 0) {
      console.log(`[init-db] Database already populated with ${resourceCount} resources`);
      return false;
    }

    console.log("[init-db] Database is empty, importing snapshot...");
    const raw = await fs.readFile(snapshotPath, "utf8");
    const snapshot = JSON.parse(raw) as SnapshotFile;

    if (snapshot.version !== 1) {
      console.error(`[init-db] Unsupported snapshot version: ${snapshot.version}`);
      return false;
    }

    await client.begin(async tx => {
      await tx.unsafe("SET CONSTRAINTS ALL DEFERRED");

      const orderedTables = sortTablesForImport(snapshot.tables);
      for (const table of orderedTables) {
        const exists = await tableExists(tx as any, table.name);
        if (!exists) {
          console.warn(`[init-db] Skipping missing table: ${table.name}`);
          continue;
        }

        await insertTableRows(tx as any, table);
        console.log(`[init-db] Imported ${table.name}: ${table.rows.length} rows`);
      }
    });

    const afterCount = await getResourceCount(client);
    console.log(`[init-db] Snapshot imported successfully (${afterCount} resources)`);
    const summary = await getImportSummary(client);
    console.log("[init-db] Import summary:", summary);
    await client.end();
    return true;
  } catch (error) {
    console.error("[init-db] Initialization error:", error);
    try {
      await client.end();
    } catch {
      // no-op
    }
    return false;
  }
}
