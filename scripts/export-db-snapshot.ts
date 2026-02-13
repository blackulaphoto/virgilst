import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";

type SnapshotTable = {
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

type SnapshotFile = {
  version: 1;
  sourceUrl: string;
  createdAt: string;
  tables: SnapshotTable[];
};

const sourceUrl = process.env.SOURCE_DB_URL || "file:./virgil_st_dev.db";
const outputPath = process.env.SNAPSHOT_OUTPUT || path.resolve(process.cwd(), "data", "db-snapshot.json");

async function ensureOutputDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function getTableNames(client: ReturnType<typeof createClient>) {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  return result.rows.map(row => String(row.name));
}

async function getColumns(client: ReturnType<typeof createClient>, tableName: string) {
  const result = await client.execute(`PRAGMA table_info("${tableName.replaceAll("\"", "\"\"")}")`);
  return result.rows.map(row => String(row.name));
}

async function getRows(client: ReturnType<typeof createClient>, tableName: string) {
  const result = await client.execute(`SELECT * FROM "${tableName.replaceAll("\"", "\"\"")}"`);
  return result.rows.map(row => ({ ...row })) as Record<string, unknown>[];
}

async function main() {
  const client = createClient({ url: sourceUrl });
  try {
    const tableNames = await getTableNames(client);
    const tables: SnapshotTable[] = [];
    let totalRows = 0;

    for (const tableName of tableNames) {
      const [columns, rows] = await Promise.all([
        getColumns(client, tableName),
        getRows(client, tableName),
      ]);
      totalRows += rows.length;
      console.log(`[export] ${tableName}: ${rows.length} rows`);
      tables.push({
        name: tableName,
        columns,
        rows,
      });
    }

    const snapshot: SnapshotFile = {
      version: 1,
      sourceUrl,
      createdAt: new Date().toISOString(),
      tables,
    };

    await ensureOutputDir(outputPath);
    await fs.writeFile(outputPath, JSON.stringify(snapshot));

    console.log(`[export] wrote snapshot: ${outputPath}`);
    console.log(`[export] tables: ${tables.length}, total rows: ${totalRows}`);
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error("[export] failed:", error);
  process.exit(1);
});

