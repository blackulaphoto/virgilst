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

const targetUrl = process.env.DATABASE_URL;
const snapshotPath = process.env.SNAPSHOT_INPUT || path.resolve(process.cwd(), "data", "db-snapshot.json");
const truncateFirst = (process.env.SNAPSHOT_TRUNCATE ?? "false").toLowerCase() === "true";
const forceImport = (process.env.SNAPSHOT_FORCE_IMPORT ?? "false").toLowerCase() === "true";

if (!targetUrl) {
  console.error("[import] DATABASE_URL is required");
  process.exit(1);
}

function quoteIdent(identifier: string) {
  return `"${identifier.replaceAll("\"", "\"\"")}"`;
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

async function insertTableRows(
  client: ReturnType<typeof postgres>,
  table: SnapshotTable,
  batchSize: number = 100
) {
  if (table.rows.length === 0) return;

  for (let i = 0; i < table.rows.length; i += batchSize) {
    const batch = table.rows.slice(i, i + batchSize);
    for (const row of batch) {
      const columns = table.columns.map(quoteIdent).join(", ");
      const placeholders = table.columns.map((_, idx) => `$${idx + 1}`).join(", ");
      const values = table.columns.map(col => normalizeValueForInsert(col, row[col] ?? null)) as any[];
      await client.unsafe(`INSERT INTO ${quoteIdent(table.name)} (${columns}) VALUES (${placeholders})`, values);
    }
  }
}

async function getResourceCount(client: ReturnType<typeof postgres>) {
  const result = await client`SELECT COUNT(*) AS c FROM resources`;
  return Number(result[0]?.c ?? 0);
}

async function main() {
  const raw = await fs.readFile(snapshotPath, "utf8");
  const snapshot = JSON.parse(raw) as SnapshotFile;

  if (snapshot.version !== 1) {
    throw new Error(`Unsupported snapshot version: ${snapshot.version}`);
  }

  const client = postgres(targetUrl);
  try {
    const resourcesTableExists = await tableExists(client, "resources");
    if (!resourcesTableExists) {
      throw new Error("[import] resources table does not exist. Run db:push before import.");
    }

    const beforeCount = await getResourceCount(client);
    console.log(`[import] resources before import: ${beforeCount}`);

    if (beforeCount > 0 && !forceImport) {
      console.log("[import] Database already populated");
      return;
    }

    await client.begin(async tx => {
      await tx.unsafe("SET CONSTRAINTS ALL DEFERRED");

      const orderedTables = sortTablesForImport(snapshot.tables);
      for (const table of orderedTables) {
        const exists = await tableExists(tx as any, table.name);
        if (!exists) {
          console.warn(`[import] skipping missing table: ${table.name}`);
          continue;
        }

        if (truncateFirst) {
          await tx.unsafe(`TRUNCATE TABLE ${quoteIdent(table.name)} RESTART IDENTITY CASCADE`);
        }

        await insertTableRows(tx as any, table);
        console.log(`[import] ${table.name}: ${table.rows.length} rows`);
      }
    });

    const afterCount = await getResourceCount(client);
    console.log("[import] Snapshot imported successfully");
    console.log(`[import] resources after import: ${afterCount}`);
  } catch (error) {
    console.error("[import] failed, rolled back:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error("[import] fatal error:", error);
  process.exit(1);
});
