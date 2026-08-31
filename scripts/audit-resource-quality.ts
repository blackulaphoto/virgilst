import "dotenv/config";
import fs from "node:fs";
import postgres from "postgres";
import { auditResourceRecords, auditTreatmentRecords, summarizePrivateInsurance } from "../shared/resourceQuality";

async function loadRecords() {
  if (process.env.DATABASE_URL) {
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    try {
      return {
        treatment: await sql`SELECT * FROM treatment_centers ORDER BY id`,
        resources: await sql`SELECT * FROM resources ORDER BY id`,
      };
    }
    finally { await sql.end(); }
  }
  const snapshot = JSON.parse(fs.readFileSync("data/db-snapshot.json", "utf8"));
  const table = (name: string) => snapshot.tables.find((entry: { name: string }) => entry.name === name)?.rows ?? [];
  return { treatment: table("treatment_centers"), resources: table("resources") };
}

const records = await loadRecords();
const treatmentIssues = auditTreatmentRecords(records.treatment);
const resourceIssues = auditResourceRecords(records.resources);
const insurance = summarizePrivateInsurance(records.treatment);
const includeDetails = process.argv.includes("--details");
console.log(JSON.stringify({
  treatmentRecords: records.treatment.length,
  resourceRecords: records.resources.length,
  treatmentIssueCount: treatmentIssues.length,
  resourceIssueCount: resourceIssues.length,
  insurance,
  ...(includeDetails ? { treatmentIssues, resourceIssues } : {}),
}, null, 2));
if (insurance.total >= 20 && insurance.share > 0.9) process.exitCode = 2;
