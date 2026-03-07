import { createClient } from "@libsql/client";

const dbUrl = process.env.DATABASE_URL || "file:./virgil_st_dev.db";
const db = createClient({ url: dbUrl });

const ALLOWED_TREATMENT_TYPES = new Set([
  "sober_living",
  "detox",
  "residential",
  "outpatient",
  "iop_php",
  "dual_diagnosis",
]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function toJsonArray(value) {
  if (!value) return "[]";
  const text = String(value).trim();
  return text.startsWith("[") ? text : "[]";
}

async function existsInResources(name, address) {
  const res = await db.execute({
    sql: `
      SELECT id
      FROM resources
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
        AND COALESCE(LOWER(TRIM(address)), '') = COALESCE(LOWER(TRIM(?)), '')
      LIMIT 1
    `,
    args: [name, address || ""],
  });
  return res.rows[0]?.id ?? null;
}

async function existsInMeetings(name, city) {
  const res = await db.execute({
    sql: `
      SELECT id
      FROM meetings
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
        AND COALESCE(LOWER(TRIM(city)), '') = COALESCE(LOWER(TRIM(?)), '')
      LIMIT 1
    `,
    args: [name, city || ""],
  });
  return res.rows[0]?.id ?? null;
}

async function moveToHousingResource(row) {
  const existingId = await existsInResources(row.name, row.address);
  if (existingId) {
    console.log(`- [skip insert] resource already exists for "${row.name}" (resource id: ${existingId})`);
  } else {
    await db.execute({
      sql: `
        INSERT INTO resources (
          name, description, type, address, phone, website, hours, filters,
          zipCode, latitude, longitude, isVerified, createdAt, updatedAt
        ) VALUES (?, ?, 'housing', ?, ?, ?, NULL, '{}', ?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER))
      `,
      args: [
        row.name,
        row.description || "Transitional housing program migrated from treatment centers module.",
        row.address || null,
        row.phone || null,
        row.website || null,
        row.zipCode || null,
        row.latitude ?? null,
        row.longitude ?? null,
        row.isVerified ?? 0,
      ],
    });
    console.log(`- [insert] resources.housing <= treatment_centers#${row.id} "${row.name}"`);
  }

  await db.execute({
    sql: `DELETE FROM treatment_centers WHERE id = ?`,
    args: [row.id],
  });
  console.log(`- [delete] treatment_centers#${row.id}`);
}

async function moveToMeeting(row) {
  const existingId = await existsInMeetings(row.name, row.city);
  if (existingId) {
    console.log(`- [skip insert] meeting already exists for "${row.name}" (meeting id: ${existingId})`);
  } else {
    await db.execute({
      sql: `
        INSERT INTO meetings (
          name, type, dayOfWeek, time, duration, venueName, address, city, zipCode,
          latitude, longitude, format, meetingMode, zoomId, zoomPassword, tags,
          language, description, notes, isVerified, isPublished, createdAt, updatedAt
        ) VALUES (
          ?, 'aa', 'monday', '7:00 PM', NULL, NULL, ?, ?, ?, ?, ?, 'discussion', 'in_person', NULL, NULL, ?,
          'en', ?, ?, ?, 1, CAST(strftime('%s', 'now') AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER)
        )
      `,
      args: [
        row.name,
        row.address || null,
        row.city || null,
        row.zipCode || null,
        row.latitude ?? null,
        row.longitude ?? null,
        toJsonArray(row.servicesOffered),
        row.description || "AA support group migrated from treatment centers module.",
        "Schedule details were not available in the original source row. Please verify day/time by phone.",
        row.isVerified ?? 0,
      ],
    });
    console.log(`- [insert] meetings.aa <= treatment_centers#${row.id} "${row.name}"`);
  }

  await db.execute({
    sql: `DELETE FROM treatment_centers WHERE id = ?`,
    args: [row.id],
  });
  console.log(`- [delete] treatment_centers#${row.id}`);
}

async function run() {
  console.log("=======================================================");
  console.log("  RECLASSIFY MISFILED TREATMENT ENTRIES (LOCAL SQLITE)");
  console.log("=======================================================\n");
  console.log(`Database: ${dbUrl}\n`);

  const candidates = await db.execute(`
    SELECT
      id, name, type, description, address, city, zipCode, phone, website,
      latitude, longitude, servicesOffered, isVerified, isPublished
    FROM treatment_centers
    WHERE isPublished = 1
    ORDER BY id
  `);

  const misfiled = candidates.rows.filter((row) => !ALLOWED_TREATMENT_TYPES.has(normalize(row.type)));
  console.log(`Found ${misfiled.length} misfiled published rows in treatment_centers.\n`);

  let movedToResources = 0;
  let movedToMeetings = 0;
  let skipped = 0;

  for (const row of misfiled) {
    const type = normalize(row.type);
    if (type === "transitional") {
      await moveToHousingResource(row);
      movedToResources += 1;
      continue;
    }

    if (type === "support_group") {
      await moveToMeeting(row);
      movedToMeetings += 1;
      continue;
    }

    skipped += 1;
    console.log(`- [skip] treatment_centers#${row.id} "${row.name}" (type="${row.type}") has no mapping rule`);
  }

  const remaining = await db.execute(`
    SELECT COUNT(*) AS count
    FROM treatment_centers
    WHERE isPublished = 1
      AND LOWER(TRIM(type)) NOT IN ('sober_living', 'detox', 'residential', 'outpatient', 'iop_php', 'dual_diagnosis')
  `);

  console.log("\nSummary:");
  console.log(`- moved to resources.housing: ${movedToResources}`);
  console.log(`- moved to meetings.aa: ${movedToMeetings}`);
  console.log(`- skipped (unmapped): ${skipped}`);
  console.log(`- remaining non-standard published treatment rows: ${Number(remaining.rows[0]?.count || 0)}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
