import "dotenv/config";
import XLSX from "xlsx";
import postgres from "postgres";
import { normalizeTreatmentPrice } from "../shared/treatmentPresentation";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const apply = process.argv.includes("--apply");
const workbook = XLSX.readFile("CA_Sober_Living_Directory.xlsx");
const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
const sourceByName = new Map(rows.map(row => [String(row.Name ?? "").trim(), normalizeTreatmentPrice(row.Price as string | number | null)]));
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  const records = await sql`SELECT id, name, "priceRange", "acceptsPrivateInsurance", "isVerified" FROM treatment_centers WHERE type = 'sober_living' ORDER BY id`;
  const corrections = records.flatMap(record => {
    const sourcePrice = sourceByName.get(record.name);
    const priceChanged = sourcePrice !== undefined && sourcePrice !== record.priceRange;
    const insuranceChanged = !record.isVerified && Boolean(record.acceptsPrivateInsurance);
    return priceChanged || insuranceChanged ? [{ id: record.id, name: record.name, fromPrice: record.priceRange, toPrice: sourcePrice ?? null, clearUnverifiedInsurance: insuranceChanged }] : [];
  });
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", scanned: records.length, corrections }, null, 2));
  if (apply) {
    await sql.begin(async transaction => {
      for (const correction of corrections) {
        await transaction`UPDATE treatment_centers SET "priceRange" = ${correction.toPrice}, "acceptsPrivateInsurance" = CASE WHEN ${correction.clearUnverifiedInsurance} THEN 0 ELSE "acceptsPrivateInsurance" END, "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER WHERE id = ${correction.id}`;
      }
    });
  }
} finally {
  await sql.end();
}
