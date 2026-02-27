import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";

const dbUrl = process.env.DATABASE_URL || "file:./virgil_st_dev.db";
const db = createClient({ url: dbUrl });
const outDir = path.resolve(process.cwd(), "data", "tag-audit");

const TAXONOMY = {
  treatmentPopulation: new Set(["men", "women", "coed", "lgbtq", "women_with_children"]),
  meetingType: new Set(["aa", "na", "cma", "smart", "other"]),
  meetingMode: new Set(["in_person", "online", "hybrid"]),
  eventType: new Set(["resource_fair", "workshop", "support_group", "community_event"]),
};

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

async function tableExists(name) {
  const res = await db.execute({
    sql: "SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name = ?",
    args: [name],
  });
  return Number(res.rows[0]?.c || 0) > 0;
}

async function scalar(sql, args = []) {
  const res = await db.execute({ sql, args });
  return Number(res.rows?.[0]?.count ?? res.rows?.[0]?.c ?? 0);
}

async function getColumns(tableName) {
  const res = await db.execute(`PRAGMA table_info(${tableName})`);
  return new Set(res.rows.map((r) => String(r.name)));
}

async function writeCsv(filename, rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => csvEscape(row[c])).join(","));
  }
  await fs.writeFile(path.join(outDir, filename), `${lines.join("\n")}\n`, "utf8");
}

async function normalizeEnumColumn(tableName, columnName) {
  await db.execute(`
    UPDATE ${tableName}
    SET ${columnName} = LOWER(REPLACE(TRIM(${columnName}), ' ', '_'))
    WHERE ${columnName} IS NOT NULL
      AND ${columnName} <> LOWER(REPLACE(TRIM(${columnName}), ' ', '_'))
  `);
}

async function ensureJsonDefault(tableName, columnName, fallback) {
  await db.execute(`
    UPDATE ${tableName}
    SET ${columnName} = '${fallback}'
    WHERE ${columnName} IS NULL OR TRIM(${columnName}) = ''
  `);
}

async function fetchRows(sql, args = []) {
  const res = await db.execute({ sql, args });
  return res.rows;
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const summary = [];

  console.log("=======================================================");
  console.log("  SITEWIDE TAG PASS (LOCAL SQLITE)");
  console.log("=======================================================\n");
  console.log(`Database: ${dbUrl}`);
  console.log(`Output: ${outDir}\n`);

  // ---- Safe normalizations across modules ----
  if (await tableExists("treatment_centers")) {
    await normalizeEnumColumn("treatment_centers", "servesPopulation");
    await normalizeEnumColumn("treatment_centers", "type");
    await db.execute(`
      UPDATE treatment_centers
      SET servesPopulation = 'coed',
          acceptsCouples = CASE WHEN servesPopulation = 'couples' THEN 1 ELSE acceptsCouples END,
          updatedAt = CAST(strftime('%s', 'now') AS INTEGER)
      WHERE servesPopulation IN ('all', 'couples')
    `);
    await ensureJsonDefault("treatment_centers", "servicesOffered", "[]");
    await ensureJsonDefault("treatment_centers", "amenities", "[]");
  }

  if (await tableExists("resources")) {
    await normalizeEnumColumn("resources", "type");
    await ensureJsonDefault("resources", "filters", "{}");
  }

  if (await tableExists("articles")) {
    await normalizeEnumColumn("articles", "category");
    await ensureJsonDefault("articles", "tags", "[]");
  }

  if (await tableExists("forum_posts")) {
    await normalizeEnumColumn("forum_posts", "category");
  }

  if (await tableExists("knowledge_documents")) {
    await normalizeEnumColumn("knowledge_documents", "category");
    await normalizeEnumColumn("knowledge_documents", "fileType");
  }

  if (await tableExists("meetings")) {
    await normalizeEnumColumn("meetings", "type");
    await normalizeEnumColumn("meetings", "dayOfWeek");
    await normalizeEnumColumn("meetings", "meetingMode");
    await normalizeEnumColumn("meetings", "format");
    await ensureJsonDefault("meetings", "tags", "[]");
  }

  if (await tableExists("events")) {
    await normalizeEnumColumn("events", "eventType");
    await normalizeEnumColumn("events", "category");
    await ensureJsonDefault("events", "tags", "[]");
    await ensureJsonDefault("events", "servicesOffered", "[]");
  }

  if (await tableExists("map_pins")) {
    await normalizeEnumColumn("map_pins", "type");
  }

  if (await tableExists("videos")) {
    await normalizeEnumColumn("videos", "category");
  }

  // ---- Remediation exports (all modules) ----
  if (await tableExists("treatment_centers")) {
    const missingPhone = await fetchRows(`
      SELECT id, name, type, servesPopulation, city, phone, address
      FROM treatment_centers
      WHERE isPublished = 1 AND (phone IS NULL OR TRIM(phone) = '')
      ORDER BY name
    `);
    await writeCsv("treatment_centers_missing_phone.csv", missingPhone, ["id", "name", "type", "servesPopulation", "city", "phone", "address"]);
    summary.push(`Treatment centers missing phone: ${missingPhone.length}`);

    const invalidPopulation = await fetchRows(`
      SELECT servesPopulation, COUNT(*) AS count
      FROM treatment_centers
      WHERE isPublished = 1
        AND servesPopulation NOT IN ('men', 'women', 'coed', 'lgbtq', 'women_with_children')
      GROUP BY servesPopulation
      ORDER BY count DESC
    `);
    await writeCsv("treatment_centers_invalid_population.csv", invalidPopulation, ["servesPopulation", "count"]);
    summary.push(`Treatment centers invalid servesPopulation: ${invalidPopulation.length}`);
  }

  if (await tableExists("resources")) {
    const missingPhone = await fetchRows(`
      SELECT id, name, type, phone, address, website
      FROM resources
      WHERE phone IS NULL OR TRIM(phone) = ''
      ORDER BY type, name
    `);
    await writeCsv("resources_missing_phone.csv", missingPhone, ["id", "name", "type", "phone", "address", "website"]);
    summary.push(`Resources missing phone: ${missingPhone.length}`);

    const missingFilters = await fetchRows(`
      SELECT id, name, type, filters
      FROM resources
      WHERE filters IS NULL OR TRIM(filters) = '' OR SUBSTR(TRIM(filters), 1, 1) <> '{'
      ORDER BY type, name
    `);
    await writeCsv("resources_invalid_filters.csv", missingFilters, ["id", "name", "type", "filters"]);
    summary.push(`Resources invalid filters: ${missingFilters.length}`);
  }

  if (await tableExists("medi_cal_providers")) {
    const cols = await getColumns("medi_cal_providers");

    if (cols.has("searchTerms")) {
      const missingSearchTerms = await fetchRows(`
        SELECT id, providerName, facilityName, city, specialties, searchTerms
        FROM medi_cal_providers
        WHERE searchTerms IS NULL OR TRIM(searchTerms) = ''
        ORDER BY providerName
      `);
      await writeCsv("medi_cal_providers_missing_search_terms.csv", missingSearchTerms, ["id", "providerName", "facilityName", "city", "specialties", "searchTerms"]);
      summary.push(`Medi-Cal providers missing searchTerms: ${missingSearchTerms.length}`);
    } else {
      summary.push("Medi-Cal providers missing searchTerms: column not present in this local schema");
    }

    if (cols.has("normalizedSpecialties")) {
      const missingNormalized = await fetchRows(`
        SELECT id, providerName, facilityName, city, specialties, normalizedSpecialties
        FROM medi_cal_providers
        WHERE normalizedSpecialties IS NULL OR TRIM(normalizedSpecialties) = '' OR TRIM(normalizedSpecialties) = '[]'
        ORDER BY providerName
      `);
      await writeCsv("medi_cal_providers_missing_normalized_specialties.csv", missingNormalized, ["id", "providerName", "facilityName", "city", "specialties", "normalizedSpecialties"]);
      summary.push(`Medi-Cal providers missing normalizedSpecialties: ${missingNormalized.length}`);
    } else {
      summary.push("Medi-Cal providers missing normalizedSpecialties: column not present in this local schema");
    }
  }

  if (await tableExists("meetings")) {
    const invalidType = await fetchRows(`
      SELECT type, COUNT(*) AS count
      FROM meetings
      WHERE type NOT IN ('aa', 'na', 'cma', 'smart', 'other')
      GROUP BY type
      ORDER BY count DESC
    `);
    await writeCsv("meetings_invalid_type.csv", invalidType, ["type", "count"]);
    summary.push(`Meetings invalid type values: ${invalidType.length}`);

    const invalidMode = await fetchRows(`
      SELECT meetingMode, COUNT(*) AS count
      FROM meetings
      WHERE meetingMode NOT IN ('in_person', 'online', 'hybrid')
      GROUP BY meetingMode
      ORDER BY count DESC
    `);
    await writeCsv("meetings_invalid_mode.csv", invalidMode, ["meetingMode", "count"]);
    summary.push(`Meetings invalid meetingMode values: ${invalidMode.length}`);
  }

  if (await tableExists("events")) {
    const invalidEventType = await fetchRows(`
      SELECT eventType, COUNT(*) AS count
      FROM events
      WHERE eventType NOT IN ('resource_fair', 'workshop', 'support_group', 'community_event')
      GROUP BY eventType
      ORDER BY count DESC
    `);
    await writeCsv("events_invalid_event_type.csv", invalidEventType, ["eventType", "count"]);
    summary.push(`Events invalid eventType values: ${invalidEventType.length}`);
  }

  if (await tableExists("articles")) {
    const missingTags = await fetchRows(`
      SELECT id, title, category, tags
      FROM articles
      WHERE tags IS NULL OR TRIM(tags) = '' OR TRIM(tags) = '[]'
      ORDER BY title
    `);
    await writeCsv("articles_missing_tags.csv", missingTags, ["id", "title", "category", "tags"]);
    summary.push(`Articles missing tags: ${missingTags.length}`);
  }

  if (await tableExists("forum_posts")) {
    const missingCategory = await fetchRows(`
      SELECT id, title, category
      FROM forum_posts
      WHERE category IS NULL OR TRIM(category) = ''
      ORDER BY id
    `);
    await writeCsv("forum_posts_missing_category.csv", missingCategory, ["id", "title", "category"]);
    summary.push(`Forum posts missing category: ${missingCategory.length}`);
  }

  if (await tableExists("map_pins")) {
    const unapprovedPins = await fetchRows(`
      SELECT id, title, type, isApproved
      FROM map_pins
      WHERE isApproved = 0
      ORDER BY createdAt DESC
    `);
    await writeCsv("map_pins_unapproved.csv", unapprovedPins, ["id", "title", "type", "isApproved"]);
    summary.push(`Map pins unapproved: ${unapprovedPins.length}`);
  }

  if (await tableExists("videos")) {
    const missingCategory = await fetchRows(`
      SELECT id, title, category, youtubeId
      FROM videos
      WHERE category IS NULL OR TRIM(category) = ''
      ORDER BY title
    `);
    await writeCsv("videos_missing_category.csv", missingCategory, ["id", "title", "category", "youtubeId"]);
    summary.push(`Videos missing category: ${missingCategory.length}`);
  }

  if (await tableExists("knowledge_documents")) {
    const missingCategory = await fetchRows(`
      SELECT id, title, category, fileType, filename
      FROM knowledge_documents
      WHERE category IS NULL OR TRIM(category) = ''
      ORDER BY title
    `);
    await writeCsv("knowledge_documents_missing_category.csv", missingCategory, ["id", "title", "category", "fileType", "filename"]);
    summary.push(`Knowledge documents missing category: ${missingCategory.length}`);
  }

  if (await tableExists("jobs")) {
    const missingTags = await fetchRows(`
      SELECT id, title, company, category, tags, location
      FROM jobs
      WHERE tags IS NULL OR TRIM(tags) = '' OR TRIM(tags) = '[]'
      ORDER BY createdAt DESC
    `);
    await writeCsv("jobs_missing_tags.csv", missingTags, ["id", "title", "company", "category", "tags", "location"]);
    summary.push(`Jobs missing tags: ${missingTags.length}`);
  }

  const summaryPath = path.join(outDir, "sitewide_tag_pass_summary.txt");
  await fs.writeFile(summaryPath, `${summary.join("\n")}\n`, "utf8");

  console.log("Summary:");
  summary.forEach((line) => console.log(`- ${line}`));
  console.log(`\nWrote report: ${summaryPath}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
