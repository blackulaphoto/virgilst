import fs from "node:fs";
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
    const hostname = new URL(privateUrl).hostname.toLowerCase();
    const usesInternalHost =
      hostname.endsWith(".railway.internal") || hostname === "postgres.railway.internal";
    if (usesInternalHost && publicUrl) {
      return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };
    }
  } catch {
    // Fall back to DATABASE_URL
  }
  return { url: privateUrl, source: "DATABASE_URL" };
}

function sanitizeText(input) {
  if (!input) return "";
  return input
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/â€‘|‑|–|—/g, "-")
    .replace(/â€™|’/g, "'")
    .replace(/Ã±/g, "n")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEntries(text) {
  const rows = [];
  const blockRegex = /(\d+)\.\s+\*\*(.+?)\*\*([\s\S]*?)(?=\n\d+\.\s+\*\*|\n\*\*\*|$)/g;
  let blockMatch;

  while ((blockMatch = blockRegex.exec(text)) !== null) {
    const body = blockMatch[3];
    const name = sanitizeText(blockMatch[2]);

    const addressMatch = body.match(/- Address:\s*(.+)/i);
    const phoneMatch = body.match(/- Phone:\s*(.+)/i);
    const websiteMatch = body.match(/- Website:\s*(.+)/i);
    const typeMatch = body.match(/- Type\/specialty:\s*(.+)/i);
    const paymentMatch = body.match(/- Payment:\s*(.+)/i);

    if (!name || !addressMatch || !websiteMatch) {
      continue;
    }

    const address = sanitizeText(addressMatch[1]);
    const phone = phoneMatch ? sanitizeText(phoneMatch[1]) : "";
    const website = sanitizeText(websiteMatch[1]).replace(/\s/g, "");
    const type = typeMatch ? sanitizeText(typeMatch[1]) : "Urgent care";
    const payment = paymentMatch ? sanitizeText(paymentMatch[1]) : "Call to confirm";

    const cityZipMatch = address.match(/,\s*([^,]+),\s*CA\s*(\d{5})/i);
    const city = cityZipMatch ? sanitizeText(cityZipMatch[1]) : "";
    const zipCode = cityZipMatch ? cityZipMatch[2] : "";

    rows.push({
      name,
      facilityName: name,
      address,
      city,
      zipCode,
      phone,
      website,
      type,
      payment,
    });
  }

  return rows;
}

function buildSpecialties(type) {
  const base = ["Urgent Care", "Primary Care", "Community Health"];
  const extra = sanitizeText(type)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set([...base, ...extra]));
}

async function addUrgentCares() {
  const inputPath = process.argv[2] || path.join(process.cwd(), "knowledge files", "Urgent cares.txt");
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const clinics = parseEntries(raw);

  if (clinics.length === 0) {
    throw new Error("No clinic entries parsed from urgent care file.");
  }

  const resolvedDb = resolveDatabaseUrl();
  const sql = postgres(resolvedDb.url);

  console.log(`Adding urgent care providers from ${inputPath}`);
  console.log(`Using ${resolvedDb.source}`);
  console.log(`Parsed entries: ${clinics.length}\n`);

  let added = 0;
  let skipped = 0;
  let categorized = 0;

  for (const clinic of clinics) {
    try {
      const existing = await sql`
        SELECT id
        FROM medi_cal_providers
        WHERE (
          ${clinic.phone} <> '' AND phone = ${clinic.phone}
        )
        OR (
          "providerName" = ${clinic.name}
          AND address = ${clinic.address}
        )
        LIMIT 1
      `;

      let providerId;
      const specialties = buildSpecialties(clinic.type);
      const normalizedSpecialties = specialties.map((s) => s.toLowerCase());
      const searchTerms = [
        clinic.name,
        clinic.city,
        clinic.address,
        "urgent care",
        "walk in clinic",
        ...specialties,
      ]
        .join(" ")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (existing.length > 0) {
        providerId = existing[0].id;
        skipped++;
      } else {
        const inserted = await sql`
          INSERT INTO medi_cal_providers (
            "providerName",
            "facilityName",
            address,
            city,
            state,
            "zipCode",
            phone,
            specialties,
            "normalizedSpecialties",
            "searchTerms",
            networks,
            "medicalGroups",
            "isVerified"
          ) VALUES (
            ${clinic.name},
            ${clinic.facilityName},
            ${clinic.address},
            ${clinic.city || null},
            'CA',
            ${clinic.zipCode || null},
            ${clinic.phone || null},
            ${JSON.stringify(specialties)},
            ${JSON.stringify(normalizedSpecialties)},
            ${searchTerms},
            ${JSON.stringify([clinic.payment])},
            ${JSON.stringify([clinic.website])},
            1
          )
          RETURNING id
        `;
        providerId = inserted[0].id;
        added++;
      }

      await sql`
        INSERT INTO provider_categories ("providerId", "categoryKey")
        VALUES (${providerId}, 'urgent_care')
        ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO provider_categories ("providerId", "categoryKey")
        VALUES (${providerId}, 'primary_care')
        ON CONFLICT DO NOTHING
      `;
      categorized++;
      console.log(`[OK] ${clinic.name}`);
    } catch (error) {
      console.error(`[ERROR] ${clinic.name}: ${error.message}`);
    }
  }

  console.log("\nSummary:");
  console.log(`- Added providers: ${added}`);
  console.log(`- Existing providers skipped: ${skipped}`);
  console.log(`- Category tags applied: ${categorized}`);

  await sql.end();
}

addUrgentCares().catch((error) => {
  console.error(error);
  process.exit(1);
});
