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

async function tableExists(client: ReturnType<typeof createClient>, tableName: string) {
  const result = await client.execute({
    sql: "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
    args: [tableName],
  });
  return result.rows.length > 0;
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
      await client.execute({ sql, args });
    }
  }
}

async function getResourceCount(client: ReturnType<typeof createClient>) {
  const result = await client.execute("SELECT COUNT(*) AS c FROM resources");
  const raw = result.rows[0]?.c;
  if (typeof raw === "number") return raw;
  return Number(raw ?? 0);
}

async function main() {
  const raw = await fs.readFile(snapshotPath, "utf8");
  const snapshot = JSON.parse(raw) as SnapshotFile;

  if (snapshot.version !== 1) {
    throw new Error(`Unsupported snapshot version: ${snapshot.version}`);
  }

  const client = createClient({ url: targetUrl });
  let transactionStarted = false;
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

    await client.execute("PRAGMA foreign_keys = OFF");
    await client.execute("BEGIN");
    transactionStarted = true;

    for (const table of snapshot.tables) {
      const exists = await tableExists(client, table.name);
      if (!exists) {
        console.warn(`[import] skipping missing table: ${table.name}`);
        continue;
      }

      if (truncateFirst) {
        await client.execute(`DELETE FROM ${quoteIdent(table.name)}`);
      }

      await insertTableRows(client, table);
      console.log(`[import] ${table.name}: ${table.rows.length} rows`);
    }

    await client.execute("COMMIT");
    await client.execute("PRAGMA foreign_keys = ON");
    const afterCount = await getResourceCount(client);
    console.log("[import] Snapshot imported successfully");
    console.log(`[import] resources after import: ${afterCount}`);
  } catch (error) {
    if (transactionStarted) {
      await client.execute("ROLLBACK");
    }
    console.error("[import] failed, rolled back:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error("[import] fatal error:", error);
  process.exit(1);
});
