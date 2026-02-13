import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { mediCalProviders } from "./drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

interface Provider {
  providerName: string;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zipCode: string | null;
  phone: string | null;
  npi: string | null;
  stateLicense: string | null;
  distance: string | null;
  specialties: string[];
  gender: string | null;
  languagesSpoken: string[];
  boardCertifications: string[];
  networks: string[];
  hospitalAffiliations: string[];
  medicalGroups: string[];
}

function parseProviders(content: string): Provider[] {
  const providers: Provider[] = [];
  const lines = content.split('\n');

  let currentProvider: Partial<Provider> | null = null;
  let currentField: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip header and empty lines
    if (!line || line.startsWith('Provider Search Results') || line.startsWith('Within')) continue;
    if (line.startsWith('Page ')) continue;

    // Detect new provider (usually starts with a name in all caps or a facility name)
    // Look for NPI as a more reliable indicator of provider start
    if (line.startsWith('NPI:')) {
      // Save previous provider if exists
      if (currentProvider && currentProvider.providerName) {
        providers.push(completeProvider(currentProvider));
      }

      // Start new provider
      currentProvider = {
        specialties: [],
        languagesSpoken: [],
        boardCertifications: [],
        networks: [],
        hospitalAffiliations: [],
        medicalGroups: [],
        state: 'CA'
      };

      const npi = line.replace('NPI:', '').trim();
      currentProvider.npi = npi || null;
      currentField = 'npi';
      continue;
    }

    if (!currentProvider) continue;

    // Parse fields
    if (line.startsWith('State License Number:')) {
      const license = line.replace('State License Number:', '').trim();
      currentProvider.stateLicense = license || null;
      currentField = 'license';
    } else if (line.startsWith('Distance:')) {
      currentProvider.distance = line.replace('Distance:', '').trim();
      currentField = 'distance';
    } else if (line.startsWith('Specialties:')) {
      const specs = line.replace('Specialties:', '').trim();
      if (specs) {
        currentProvider.specialties = specs.split(',').map(s => s.trim()).filter(s => s);
      }
      currentField = 'specialties';
    } else if (line.startsWith('Gender:')) {
      currentProvider.gender = line.replace('Gender:', '').trim() || null;
      currentField = 'gender';
    } else if (line.startsWith('Languages Spoken:')) {
      const langs = line.replace('Languages Spoken:', '').trim();
      if (langs) {
        currentProvider.languagesSpoken = langs.split(',').map(l => l.trim()).filter(l => l);
      }
      currentField = 'languages';
    } else if (line.startsWith('Board Certifications:')) {
      currentField = 'certifications';
    } else if (line.startsWith('Networks:')) {
      currentField = 'networks';
    } else if (line.startsWith('Hospital Affiliations:')) {
      currentField = 'hospitals';
    } else if (line.startsWith('Medical Groups:')) {
      currentField = 'medicalGroups';
    } else if (line.match(/^\(\d{3}\)\s*\d{3}-\d{4}/)) {
      // Phone number
      currentProvider.phone = line;
    } else if (line.match(/^[A-Z\s]{3,}$/)) {
      // Could be provider name or facility name (all caps)
      if (!currentProvider.providerName) {
        currentProvider.providerName = line;
      } else if (!currentProvider.facilityName && currentField === null) {
        currentProvider.facilityName = line;
      }
    } else if (line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/)) {
      // Proper case name (likely provider name)
      if (!currentProvider.providerName) {
        currentProvider.providerName = line;
      }
    } else if (line.match(/^\d+\s+/)) {
      // Street address
      if (!currentProvider.address) {
        currentProvider.address = line;
      }
    } else if (line.match(/^[A-Z\s]+,\s*CA\s+\d{5}/)) {
      // City, State Zip
      const parts = line.split(',');
      currentProvider.city = parts[0].trim();
      const stateZip = parts[1].trim().split(/\s+/);
      currentProvider.zipCode = stateZip[stateZip.length - 1];
    } else {
      // Continuation of current field
      if (currentField === 'networks' && line !== 'None Reported' && line.length > 2) {
        currentProvider.networks!.push(line);
      } else if (currentField === 'hospitals' && line !== 'None Reported' && line.length > 2) {
        currentProvider.hospitalAffiliations!.push(line);
      } else if (currentField === 'medicalGroups' && line.length > 2) {
        currentProvider.medicalGroups!.push(line);
      }
    }
  }

  // Save last provider
  if (currentProvider && currentProvider.providerName) {
    providers.push(completeProvider(currentProvider));
  }

  return providers;
}

function completeProvider(partial: Partial<Provider>): Provider {
  return {
    providerName: partial.providerName || 'Unknown Provider',
    facilityName: partial.facilityName || null,
    address: partial.address || null,
    city: partial.city || null,
    state: partial.state || 'CA',
    zipCode: partial.zipCode || null,
    phone: partial.phone || null,
    npi: partial.npi || null,
    stateLicense: partial.stateLicense || null,
    distance: partial.distance || null,
    specialties: partial.specialties || [],
    gender: partial.gender || null,
    languagesSpoken: partial.languagesSpoken || [],
    boardCertifications: partial.boardCertifications || [],
    networks: partial.networks || [],
    hospitalAffiliations: partial.hospitalAffiliations || [],
    medicalGroups: partial.medicalGroups || [],
  };
}

async function importProviders() {
  console.log("🏥 Importing Medi-Cal Providers\n");

  const filePath = path.join(__dirname, "knowledge files", "Provider Search Results - Medi-cal.txt");
  const content = fs.readFileSync(filePath, 'utf-8');

  console.log("📄 Parsing provider data...");
  const providers = parseProviders(content);

  console.log(`✅ Parsed ${providers.length} providers\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const cityCount: Record<string, number> = {};
  const specialtyCount: Record<string, number> = {};

  for (const provider of providers) {
    try {
      await db.insert(mediCalProviders).values({
        providerName: provider.providerName,
        facilityName: provider.facilityName,
        address: provider.address,
        city: provider.city,
        state: provider.state,
        zipCode: provider.zipCode,
        phone: provider.phone,
        npi: provider.npi,
        stateLicense: provider.stateLicense,
        distance: provider.distance,
        specialties: JSON.stringify(provider.specialties),
        gender: provider.gender,
        languagesSpoken: JSON.stringify(provider.languagesSpoken),
        boardCertifications: JSON.stringify(provider.boardCertifications),
        networks: JSON.stringify(provider.networks),
        hospitalAffiliations: JSON.stringify(provider.hospitalAffiliations),
        medicalGroups: JSON.stringify(provider.medicalGroups),
        isVerified: 1,
      });

      if (provider.city) {
        cityCount[provider.city] = (cityCount[provider.city] || 0) + 1;
      }

      provider.specialties.forEach(spec => {
        specialtyCount[spec] = (specialtyCount[spec] || 0) + 1;
      });

      imported++;

      if (imported % 100 === 0) {
        console.log(`✅ Imported ${imported} providers...`);
      }

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        skipped++;
      } else {
        console.error(`❌ Error importing provider:`, error.message);
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${providers.length}`);

  console.log("\n📍 Top 10 Cities:");
  Object.entries(cityCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count} providers`);
    });

  console.log("\n🏥 Top 10 Specialties:");
  Object.entries(specialtyCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([specialty, count]) => {
      console.log(`   ${specialty}: ${count} providers`);
    });

  console.log("\n✨ Medi-Cal providers import complete!");

  client.close();
}

importProviders();
