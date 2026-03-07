import postgres from "postgres";

function resolveDatabaseUrl() {
  const privateUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;

  if (!privateUrl && !publicUrl) {
    throw new Error("DATABASE_URL or DATABASE_PUBLIC_URL is required");
  }
  if (!privateUrl) return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };

  try {
    const host = new URL(privateUrl).hostname.toLowerCase();
    if ((host.endsWith(".railway.internal") || host === "postgres.railway.internal") && publicUrl) {
      return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };
    }
  } catch {
    // Fall through.
  }

  return { url: privateUrl, source: "DATABASE_URL" };
}

const resolvedDb = resolveDatabaseUrl();
const sql = postgres(resolvedDb.url);

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
  const rows = await sql`
    SELECT id
    FROM resources
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(${name}))
      AND COALESCE(LOWER(TRIM(address)), '') = COALESCE(LOWER(TRIM(${address || ""})), '')
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function existsInMeetings(name, city) {
  const rows = await sql`
    SELECT id
    FROM meetings
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(${name}))
      AND COALESCE(LOWER(TRIM(city)), '') = COALESCE(LOWER(TRIM(${city || ""})), '')
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function moveToHousingResource(row) {
  const existingId = await existsInResources(row.name, row.address);
  if (existingId) {
    console.log(`- [skip insert] resource already exists for "${row.name}" (resource id: ${existingId})`);
  } else {
    await sql`
      INSERT INTO resources (
        name, description, type, address, phone, website, hours, filters,
        "zipCode", latitude, longitude, "isVerified", "isFeatured", "createdAt", "updatedAt"
      ) VALUES (
        ${row.name},
        ${row.description || "Transitional housing program migrated from treatment centers module."},
        'housing',
        ${row.address || null},
        ${row.phone || null},
        ${row.website || null},
        NULL,
        '{}',
        ${row.zipCode || null},
        ${row.latitude ?? null},
        ${row.longitude ?? null},
        ${row.isVerified ?? 0},
        0,
        EXTRACT(EPOCH FROM NOW())::INTEGER,
        EXTRACT(EPOCH FROM NOW())::INTEGER
      )
    `;
    console.log(`- [insert] resources.housing <= treatment_centers#${row.id} "${row.name}"`);
  }

  await sql`DELETE FROM treatment_centers WHERE id = ${row.id}`;
  console.log(`- [delete] treatment_centers#${row.id}`);
}

async function moveToMeeting(row) {
  const existingId = await existsInMeetings(row.name, row.city);
  if (existingId) {
    console.log(`- [skip insert] meeting already exists for "${row.name}" (meeting id: ${existingId})`);
  } else {
    await sql`
      INSERT INTO meetings (
        name, type, "dayOfWeek", time, duration, "venueName", address, city, "zipCode",
        latitude, longitude, format, "meetingMode", "zoomId", "zoomPassword", tags,
        language, description, notes, "isVerified", "isPublished", "createdAt", "updatedAt"
      ) VALUES (
        ${row.name},
        'aa',
        'monday',
        '7:00 PM',
        NULL,
        NULL,
        ${row.address || null},
        ${row.city || null},
        ${row.zipCode || null},
        ${row.latitude ?? null},
        ${row.longitude ?? null},
        'discussion',
        'in_person',
        NULL,
        NULL,
        ${toJsonArray(row.servicesOffered)},
        'en',
        ${row.description || "AA support group migrated from treatment centers module."},
        'Schedule details were not available in the original source row. Please verify day/time by phone.',
        ${row.isVerified ?? 0},
        1,
        EXTRACT(EPOCH FROM NOW())::INTEGER,
        EXTRACT(EPOCH FROM NOW())::INTEGER
      )
    `;
    console.log(`- [insert] meetings.aa <= treatment_centers#${row.id} "${row.name}"`);
  }

  await sql`DELETE FROM treatment_centers WHERE id = ${row.id}`;
  console.log(`- [delete] treatment_centers#${row.id}`);
}

async function run() {
  console.log("=======================================================");
  console.log(" RECLASSIFY MISFILED TREATMENT ENTRIES (RAILWAY POSTGRES)");
  console.log("=======================================================\n");

  try {
    console.log(`Database source: ${resolvedDb.source} (${new URL(resolvedDb.url).hostname})\n`);
  } catch {
    console.log(`Database source: ${resolvedDb.source}\n`);
  }

  const candidates = await sql`
    SELECT
      id, name, type, description, address, city, "zipCode", phone, website,
      latitude, longitude, "servicesOffered", "isVerified", "isPublished"
    FROM treatment_centers
    WHERE "isPublished" = 1
    ORDER BY id
  `;

  const misfiled = candidates.filter((row) => !ALLOWED_TREATMENT_TYPES.has(normalize(row.type)));
  console.log(`Found ${misfiled.length} misfiled published rows in treatment_centers.\n`);

  let movedToResources = 0;
  let movedToMeetings = 0;
  let normalizedType = 0;
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

    if (type === "treatment_facility") {
      await sql`
        UPDATE treatment_centers
        SET type = 'residential',
            "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
        WHERE id = ${row.id}
      `;
      normalizedType += 1;
      console.log(`- [normalize] treatment_centers#${row.id} "${row.name}" type: treatment_facility -> residential`);
      continue;
    }

    if (type === "virtual_iop") {
      await sql`
        UPDATE treatment_centers
        SET type = 'iop_php',
            "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
        WHERE id = ${row.id}
      `;
      normalizedType += 1;
      console.log(`- [normalize] treatment_centers#${row.id} "${row.name}" type: virtual_iop -> iop_php`);
      continue;
    }
    skipped += 1;
    console.log(`- [skip] treatment_centers#${row.id} "${row.name}" (type="${row.type}") has no mapping rule`);
  }

  const remaining = await sql`
    SELECT COUNT(*)::int AS count
    FROM treatment_centers
    WHERE "isPublished" = 1
      AND LOWER(TRIM(type)) NOT IN ('sober_living', 'detox', 'residential', 'outpatient', 'iop_php', 'dual_diagnosis')
  `;

  console.log("\nSummary:");
  console.log(`- moved to resources.housing: ${movedToResources}`);
  console.log(`- moved to meetings.aa: ${movedToMeetings}`);
  console.log(`- normalized to valid treatment type: ${normalizedType}`);
  console.log(`- skipped (unmapped): ${skipped}`);
  console.log(`- remaining non-standard published treatment rows: ${remaining[0]?.count ?? 0}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
