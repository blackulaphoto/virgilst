import fs from "node:fs/promises";
import path from "node:path";
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
const sql = postgres(resolvedDb.url, { max: 1 });

const outDir = path.resolve(process.cwd(), "data", "tag-audit-postgres");

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

async function tableExists(tableName) {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
  `;
  return rows[0]?.count > 0;
}

async function columnExists(tableName, columnName) {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name = ${columnName}
  `;
  return rows[0]?.count > 0;
}

async function writeCsv(filename, rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => csvEscape(row[c])).join(","));
  }
  await fs.writeFile(path.join(outDir, filename), `${lines.join("\n")}\n`, "utf8");
}

async function normalizeTextEnum(tableName, columnName) {
  await sql.unsafe(`
    UPDATE "${tableName}"
    SET "${columnName}" = LOWER(REPLACE(TRIM("${columnName}"), ' ', '_'))
    WHERE "${columnName}" IS NOT NULL
      AND "${columnName}" <> LOWER(REPLACE(TRIM("${columnName}"), ' ', '_'))
  `);
}

async function setJsonDefault(tableName, columnName, fallback) {
  await sql.unsafe(`
    UPDATE "${tableName}"
    SET "${columnName}" = '${fallback}'
    WHERE "${columnName}" IS NULL OR TRIM("${columnName}") = ''
  `);
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const summary = [];

  console.log("=======================================================");
  console.log("  SITEWIDE TAG PASS (RAILWAY POSTGRES)");
  console.log("=======================================================\n");
  try {
    console.log(`Database source: ${resolvedDb.source} (${new URL(resolvedDb.url).hostname})`);
  } catch {
    console.log(`Database source: ${resolvedDb.source}`);
  }
  console.log(`Output: ${outDir}\n`);

  // -------------------- SAFE NORMALIZATIONS --------------------
  if (await tableExists("treatment_centers")) {
    await normalizeTextEnum("treatment_centers", "servesPopulation");
    await normalizeTextEnum("treatment_centers", "type");
    await sql`
      UPDATE treatment_centers
      SET "servesPopulation" = 'coed',
          "acceptsCouples" = CASE WHEN "servesPopulation" = 'couples' THEN 1 ELSE "acceptsCouples" END,
          "updatedAt" = EXTRACT(EPOCH FROM NOW())::INTEGER
      WHERE "servesPopulation" IN ('all', 'couples')
    `;
    await setJsonDefault("treatment_centers", "servicesOffered", "[]");
    await setJsonDefault("treatment_centers", "amenities", "[]");
  }

  if (await tableExists("resources")) {
    await normalizeTextEnum("resources", "type");
    await setJsonDefault("resources", "filters", "{}");
  }

  if (await tableExists("articles")) {
    await normalizeTextEnum("articles", "category");
    await setJsonDefault("articles", "tags", "[]");
    await sql`
      UPDATE articles
      SET tags = TO_JSON(ARRAY[category])::text
      WHERE (tags IS NULL OR TRIM(tags) = '' OR TRIM(tags) = '[]')
        AND category IS NOT NULL
        AND TRIM(category) <> ''
    `;
  }

  if (await tableExists("forum_posts")) {
    await normalizeTextEnum("forum_posts", "category");
  }

  if (await tableExists("knowledge_documents")) {
    await normalizeTextEnum("knowledge_documents", "category");
    await normalizeTextEnum("knowledge_documents", "fileType");
  }

  if (await tableExists("meetings")) {
    await normalizeTextEnum("meetings", "type");
    await normalizeTextEnum("meetings", "dayOfWeek");
    await normalizeTextEnum("meetings", "meetingMode");
    await normalizeTextEnum("meetings", "format");
    await setJsonDefault("meetings", "tags", "[]");
  }

  if (await tableExists("events")) {
    await normalizeTextEnum("events", "eventType");
    await normalizeTextEnum("events", "category");
    await setJsonDefault("events", "tags", "[]");
    await setJsonDefault("events", "servicesOffered", "[]");
  }

  if (await tableExists("map_pins")) {
    await normalizeTextEnum("map_pins", "type");
  }

  if (await tableExists("videos")) {
    await normalizeTextEnum("videos", "category");
  }

  if (await tableExists("jobs")) {
    await normalizeTextEnum("jobs", "category");
    await setJsonDefault("jobs", "tags", "[]");
    await sql`
      UPDATE jobs
      SET tags = TO_JSON(
        ARRAY_REMOVE(
          ARRAY[
            NULLIF(TRIM(category), ''),
            NULLIF(TRIM("employmentType"), ''),
            NULLIF(TRIM(location), '')
          ],
          NULL
        )
      )::text
      WHERE tags IS NULL OR TRIM(tags) = '' OR TRIM(tags) = '[]'
    `;
  }

  if (await tableExists("medi_cal_providers")) {
    if (await columnExists("medi_cal_providers", "normalizedSpecialties")) {
      await sql`
        UPDATE medi_cal_providers
        SET "normalizedSpecialties" = COALESCE(NULLIF("normalizedSpecialties", ''), "specialties", '[]')
        WHERE "normalizedSpecialties" IS NULL
           OR TRIM("normalizedSpecialties") = ''
           OR TRIM("normalizedSpecialties") = '[]'
      `;
      await sql`
        UPDATE medi_cal_providers
        SET "normalizedSpecialties" = LOWER("specialties")
        WHERE ("normalizedSpecialties" IS NULL OR TRIM("normalizedSpecialties") = '' OR TRIM("normalizedSpecialties") = '[]')
          AND specialties IS NOT NULL
          AND TRIM(specialties) <> ''
          AND TRIM(specialties) <> '[]'
      `;
      await sql`
        UPDATE medi_cal_providers
        SET "normalizedSpecialties" = '["unspecified"]'
        WHERE ("normalizedSpecialties" IS NULL OR TRIM("normalizedSpecialties") = '' OR TRIM("normalizedSpecialties") = '[]')
          AND (specialties IS NULL OR TRIM(specialties) = '' OR TRIM(specialties) = '[]')
      `;
    }
    if (await columnExists("medi_cal_providers", "searchTerms")) {
      await sql`
        UPDATE medi_cal_providers
        SET "searchTerms" = TRIM(CONCAT_WS(' ',
          COALESCE("providerName", ''),
          COALESCE("facilityName", ''),
          COALESCE(city, ''),
          COALESCE("specialties", '')
        ))
        WHERE "searchTerms" IS NULL OR TRIM("searchTerms") = ''
      `;
    }
  }

  // -------------------- EXPORT REMEDIATION LISTS --------------------
  if (await tableExists("treatment_centers")) {
    const missingPhone = await sql`
      SELECT id, name, type, "servesPopulation", city, phone, address
      FROM treatment_centers
      WHERE "isPublished" = 1 AND (phone IS NULL OR TRIM(phone) = '')
      ORDER BY name
    `;
    await writeCsv("treatment_centers_missing_phone.csv", missingPhone, ["id", "name", "type", "servesPopulation", "city", "phone", "address"]);
    summary.push(`Treatment centers missing phone: ${missingPhone.length}`);

    const invalidPopulation = await sql`
      SELECT "servesPopulation", COUNT(*)::int AS count
      FROM treatment_centers
      WHERE "isPublished" = 1
        AND "servesPopulation" NOT IN ('men', 'women', 'coed', 'lgbtq', 'women_with_children')
      GROUP BY "servesPopulation"
      ORDER BY count DESC
    `;
    await writeCsv("treatment_centers_invalid_population.csv", invalidPopulation, ["servesPopulation", "count"]);
    summary.push(`Treatment centers invalid servesPopulation: ${invalidPopulation.length}`);
  }

  if (await tableExists("resources")) {
    const missingPhone = await sql`
      SELECT id, name, type, phone, address, website
      FROM resources
      WHERE phone IS NULL OR TRIM(phone) = ''
      ORDER BY type, name
    `;
    await writeCsv("resources_missing_phone.csv", missingPhone, ["id", "name", "type", "phone", "address", "website"]);
    summary.push(`Resources missing phone: ${missingPhone.length}`);

    const invalidFilters = await sql`
      SELECT id, name, type, filters
      FROM resources
      WHERE filters IS NULL OR TRIM(filters) = '' OR LEFT(TRIM(filters), 1) <> '{'
      ORDER BY type, name
    `;
    await writeCsv("resources_invalid_filters.csv", invalidFilters, ["id", "name", "type", "filters"]);
    summary.push(`Resources invalid filters: ${invalidFilters.length}`);
  }

  if (await tableExists("medi_cal_providers")) {
    if (await columnExists("medi_cal_providers", "searchTerms")) {
      const missingSearchTerms = await sql`
        SELECT id, "providerName", "facilityName", city, specialties, "searchTerms"
        FROM medi_cal_providers
        WHERE "searchTerms" IS NULL OR TRIM("searchTerms") = ''
        ORDER BY "providerName"
      `;
      await writeCsv("medi_cal_providers_missing_search_terms.csv", missingSearchTerms, ["id", "providerName", "facilityName", "city", "specialties", "searchTerms"]);
      summary.push(`Medi-Cal providers missing searchTerms: ${missingSearchTerms.length}`);
    } else {
      summary.push("Medi-Cal providers missing searchTerms: column not present");
    }

    if (await columnExists("medi_cal_providers", "normalizedSpecialties")) {
      const missingNormalized = await sql`
        SELECT id, "providerName", "facilityName", city, specialties, "normalizedSpecialties"
        FROM medi_cal_providers
        WHERE "normalizedSpecialties" IS NULL OR TRIM("normalizedSpecialties") = '' OR TRIM("normalizedSpecialties") = '[]'
        ORDER BY "providerName"
      `;
      await writeCsv("medi_cal_providers_missing_normalized_specialties.csv", missingNormalized, ["id", "providerName", "facilityName", "city", "specialties", "normalizedSpecialties"]);
      summary.push(`Medi-Cal providers missing normalizedSpecialties: ${missingNormalized.length}`);
    } else {
      summary.push("Medi-Cal providers missing normalizedSpecialties: column not present");
    }
  }

  if (await tableExists("meetings")) {
    const invalidType = await sql`
      SELECT type, COUNT(*)::int AS count
      FROM meetings
      WHERE type NOT IN ('aa', 'na', 'cma', 'smart', 'other')
      GROUP BY type
      ORDER BY count DESC
    `;
    await writeCsv("meetings_invalid_type.csv", invalidType, ["type", "count"]);
    summary.push(`Meetings invalid type values: ${invalidType.length}`);

    const invalidMode = await sql`
      SELECT "meetingMode", COUNT(*)::int AS count
      FROM meetings
      WHERE "meetingMode" NOT IN ('in_person', 'online', 'hybrid')
      GROUP BY "meetingMode"
      ORDER BY count DESC
    `;
    await writeCsv("meetings_invalid_mode.csv", invalidMode, ["meetingMode", "count"]);
    summary.push(`Meetings invalid meetingMode values: ${invalidMode.length}`);
  }

  if (await tableExists("events")) {
    const invalidEventType = await sql`
      SELECT "eventType", COUNT(*)::int AS count
      FROM events
      WHERE "eventType" NOT IN ('resource_fair', 'workshop', 'support_group', 'community_event')
      GROUP BY "eventType"
      ORDER BY count DESC
    `;
    await writeCsv("events_invalid_event_type.csv", invalidEventType, ["eventType", "count"]);
    summary.push(`Events invalid eventType values: ${invalidEventType.length}`);
  }

  if (await tableExists("articles")) {
    const missingTags = await sql`
      SELECT id, title, category, tags
      FROM articles
      WHERE tags IS NULL OR TRIM(tags) = '' OR TRIM(tags) = '[]'
      ORDER BY title
    `;
    await writeCsv("articles_missing_tags.csv", missingTags, ["id", "title", "category", "tags"]);
    summary.push(`Articles missing tags: ${missingTags.length}`);
  }

  if (await tableExists("forum_posts")) {
    const missingCategory = await sql`
      SELECT id, title, category
      FROM forum_posts
      WHERE category IS NULL OR TRIM(category) = ''
      ORDER BY id
    `;
    await writeCsv("forum_posts_missing_category.csv", missingCategory, ["id", "title", "category"]);
    summary.push(`Forum posts missing category: ${missingCategory.length}`);
  }

  if (await tableExists("map_pins")) {
    const unapproved = await sql`
      SELECT id, title, type, "isApproved"
      FROM map_pins
      WHERE "isApproved" = 0
      ORDER BY "createdAt" DESC
    `;
    await writeCsv("map_pins_unapproved.csv", unapproved, ["id", "title", "type", "isApproved"]);
    summary.push(`Map pins unapproved: ${unapproved.length}`);
  }

  if (await tableExists("videos")) {
    const missingCategory = await sql`
      SELECT id, title, category, "youtubeId"
      FROM videos
      WHERE category IS NULL OR TRIM(category) = ''
      ORDER BY title
    `;
    await writeCsv("videos_missing_category.csv", missingCategory, ["id", "title", "category", "youtubeId"]);
    summary.push(`Videos missing category: ${missingCategory.length}`);
  }

  if (await tableExists("knowledge_documents")) {
    const missingCategory = await sql`
      SELECT id, title, category, "fileType", filename
      FROM knowledge_documents
      WHERE category IS NULL OR TRIM(category) = ''
      ORDER BY title
    `;
    await writeCsv("knowledge_documents_missing_category.csv", missingCategory, ["id", "title", "category", "fileType", "filename"]);
    summary.push(`Knowledge documents missing category: ${missingCategory.length}`);
  }

  if (await tableExists("jobs")) {
    const missingTags = await sql`
      SELECT id, title, company, category, tags, location
      FROM jobs
      WHERE tags IS NULL OR TRIM(tags) = '' OR TRIM(tags) = '[]'
      ORDER BY "createdAt" DESC
    `;
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
    await sql.end({ timeout: 5 });
  });
