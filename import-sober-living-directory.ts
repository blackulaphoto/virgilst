import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { treatmentCenters } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

// Helper function to extract city from address
function extractCity(address: string, county: string): string {
  if (!address) return county.replace(" County", "");

  const parts = address.split(",");
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return county.replace(" County", "");
}

// Helper function to extract zip from address
function extractZip(address: string): string | null {
  const zipMatch = address.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
}

// Helper function to determine population served
function determinePopulation(services: string, notes: string): string {
  const combined = (services + " " + notes).toLowerCase();

  if (combined.includes("women") && !combined.includes("men")) return "women";
  if (combined.includes("men") && !combined.includes("women")) return "men";
  if (combined.includes("youth") || combined.includes("teen")) return "youth";
  if (combined.includes("family") || combined.includes("families")) return "families";
  if (combined.includes("couple")) return "couples";

  return "all";
}

const facilities = [
  // Los Angeles Sober Living
  {
    name: "The Loft - Torrance",
    type: "sober_living",
    address: "1663 Santa Ynez Blvd, Torrance, CA 90505",
    phone: "(877) 864-0207",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living, peer support",
    notes: "Structured sober living environment"
  },
  {
    name: "Sober Living Network",
    type: "sober_living",
    address: "12411 Ventura Blvd, Studio City, CA 91604",
    phone: "(818) 508-1296",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living network, multiple locations",
    notes: "Network of sober living homes"
  },
  {
    name: "Warner Park Recovery",
    type: "sober_living",
    address: "6855 CA-27 #135, Woodland Hills, CA 91367",
    phone: "(866) 228-9095",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living, recovery support",
    notes: "Woodland Hills location"
  },
  {
    name: "The Loft House",
    type: "sober_living",
    address: "2452 Hillcrest Ave, Los Angeles, CA 90034",
    phone: "(424) 256-8762",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living",
    notes: "Los Angeles sober living"
  },
  {
    name: "Little House Sober Living",
    type: "sober_living",
    address: "5718 Harvard St, Bellflower, CA 90706",
    phone: "(562) 925-3777",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living",
    notes: "Bellflower sober living"
  },
  {
    name: "Ladder House Recovery",
    type: "sober_living",
    address: "14443 Hurontie St, Northridge, CA 91367",
    phone: "(818) 314-2139",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living",
    notes: "Northridge sober living"
  },
  {
    name: "Westwind Recovery",
    type: "sober_living",
    address: "Los Angeles, CA",
    phone: "(855) 340-9952",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: true,
    services: "Luxury sober living, may coordinate couples",
    notes: "Luxury amenities, private rooms, 24/7 support. May accommodate couples through male/female house coordination"
  },
  {
    name: "The Nook Sober Living",
    type: "sober_living",
    address: "West Los Angeles, CA",
    phone: "",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: true,
    services: "Flexible sober living, may work with couples",
    notes: "Customized approach, may coordinate couples through separate gender programs"
  },

  // Orange County Sober Living
  {
    name: "Impact Sober Living",
    type: "sober_living",
    address: "Orange County, CA",
    phone: "(714) 555-1882",
    county: "Orange",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living",
    notes: "Orange County sober living"
  },
  {
    name: "Sober Living by the Sea - Costa Mesa",
    type: "sober_living",
    address: "Costa Mesa, CA 92627",
    phone: "(949) 677-3002",
    county: "Orange",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living near beach",
    notes: "Coastal sober living facility"
  },
  {
    name: "Beachfront Sober Living",
    type: "sober_living",
    address: "Orange County, CA",
    phone: "",
    county: "Orange",
    acceptsMediCal: false,
    acceptsCouples: true,
    services: "Sober living for couples",
    notes: "One of few facilities accepting couples"
  },
  {
    name: "Footprints Recovery House LLC",
    type: "sober_living",
    address: "2300 Kettner Blvd, San Diego, CA 92101",
    phone: "(12) 294-1-1212",
    county: "San Diego",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Sober living, recovery support",
    notes: "San Diego sober living facility"
  },

  // RESIDENTIAL TREATMENT FACILITIES
  {
    name: "Muirne Treatment Center",
    type: "residential",
    address: "2370 S Robertson Blvd, Los Angeles, CA 90034",
    phone: "(323) 207-7937",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment, detox",
    notes: "Full residential treatment program"
  },
  {
    name: "Yemeg Recovery",
    type: "residential",
    address: "1400 E Thousand Oaks Blvd, Thousand Oaks, CA 91362",
    phone: "(805) 371-8222",
    county: "Ventura",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment",
    notes: "Thousand Oaks residential facility"
  },
  {
    name: "Arise Recovery Center",
    type: "residential",
    address: "11574 E Thousand Oaks Blvd Suite 108, Thousand Oaks, CA 91362",
    phone: "(805) 301-1298",
    county: "Ventura",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment, outpatient",
    notes: "Comprehensive treatment services"
  },
  {
    name: "Linka Recovery",
    type: "residential",
    address: "181 W Wilbur Rd #115, Thousand Oaks, CA 91360",
    phone: "(805) 371-8222",
    county: "Ventura",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment",
    notes: "Thousand Oaks area facility"
  },
  {
    name: "Exodus Recovery",
    type: "residential",
    address: "Los Angeles, CA",
    phone: "",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Residential treatment, faith-based",
    notes: "Faith-based recovery program"
  },
  {
    name: "Pacifica Recovery",
    type: "residential",
    address: "Los Angeles, CA",
    phone: "",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment, luxury",
    notes: "Upscale treatment facility"
  },
  {
    name: "Salvation Army - Pasadena",
    type: "residential",
    address: "1680 19th St, Santa Monica, CA 90404",
    phone: "",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Residential treatment, free/low-cost",
    notes: "Free or low-cost treatment services"
  },
  {
    name: "New Life Youth",
    type: "residential",
    address: "742 Cloverdale Ave, Los Angeles, CA 90036",
    phone: "(888) 321-7217",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Youth treatment, residential",
    notes: "Youth-focused treatment program"
  },
  {
    name: "Westwood Recovery",
    type: "residential",
    address: "7960 Beverly Blvd, Los Angeles, CA 90048",
    phone: "(866) 221-5787",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment",
    notes: "Beverly Hills area treatment"
  },
  {
    name: "Safe Haven Recovery - Beverly Hills",
    type: "residential",
    address: "1660 Coliseum Canyon Dr, Beverly Hills, CA 90210",
    phone: "(424) 255-3260",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Luxury residential treatment",
    notes: "High-end Beverly Hills facility"
  },
  {
    name: "His Healing Retreat - Woodland Hills",
    type: "residential",
    address: "29655 Glamour Dr, Woodland Hills, CA 91367",
    phone: "(818) 677-4477",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment, faith-based",
    notes: "Faith-based treatment program"
  },
  {
    name: "Clare Foundation",
    type: "residential",
    address: "1524 Lincoln Blvd, Santa Monica, CA 90401",
    phone: "(310) 314-6200",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Residential treatment, outpatient, sober living",
    notes: "Comprehensive Medi-Cal accepting facility"
  },
  {
    name: "Insight Recovery - Beverly Hills",
    type: "residential",
    address: "Beverly Hills/West Hollywood, CA",
    phone: "(310) 481-3174",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment, luxury",
    notes: "Multiple upscale locations"
  },
  {
    name: "Southern California Hospital - Sherman Oaks",
    type: "residential",
    address: "3828 Delmas Terrace, Culver City, CA 90232",
    phone: "(310) 836-7000",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Hospital-based treatment, detox",
    notes: "Medical detox and treatment"
  },
  {
    name: "Forward Recovery",
    type: "residential",
    address: "8040 W Post Blvd, Los Angeles, CA 90035",
    phone: "(844) 397-8589",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment",
    notes: "Los Angeles residential facility"
  },
  {
    name: "Silverado Residential Center",
    type: "residential",
    address: "Orange County, CA",
    phone: "",
    county: "Orange",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment",
    notes: "Orange County residential treatment"
  },
  {
    name: "Gembrook Lodge Treatment Center",
    type: "residential",
    address: "Orange County, CA",
    phone: "(949) 650-5090",
    county: "Orange",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment",
    notes: "Orange County treatment center"
  },
  {
    name: "Bran Life Recovery",
    type: "residential",
    address: "Costa Mesa, CA 92627",
    phone: "",
    county: "Orange",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Residential treatment",
    notes: "Orange County residential facility"
  },
  {
    name: "Riverside Recovery LA",
    type: "residential",
    address: "Riverside, CA",
    phone: "",
    county: "Riverside",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Residential treatment",
    notes: "Riverside County treatment"
  },
  {
    name: "La Jolla Recovery",
    type: "residential",
    address: "San Diego, CA",
    phone: "",
    county: "San Diego",
    acceptsMediCal: false,
    acceptsCouples: true,
    services: "Couples rehab, residential treatment",
    notes: "Specialized couples treatment program"
  },

  // TRANSITIONAL HOUSING
  {
    name: "Art House Recovery Bridge Housing (LA CADA)",
    type: "transitional",
    address: "Los Angeles, CA",
    phone: "",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Short-term transitional housing, LGBTQIA2+ friendly",
    notes: "Currently under renovation. 16 residents max, 90 days per year. Must be in IOP or OP treatment. Free to residents."
  },
  {
    name: "Wellness Housing",
    type: "transitional",
    address: "Downtown Los Angeles, CA",
    phone: "",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: true,
    services: "Transitional housing for men and women",
    notes: "$650/month bunk bed, $750/month single bed. LGBTQ-friendly, no credit check"
  },
  {
    name: "Midnight Mission - HomeLight Family Living",
    type: "transitional",
    address: "Los Angeles, CA",
    phone: "",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: true,
    services: "Family housing, 11 furnished apartments",
    notes: "One-year program for families affected by domestic violence, trafficking, substance abuse. Mental health therapy, job prep, family reunification"
  },

  // OUTPATIENT FACILITIES
  {
    name: "Muse Treatment (Milieu/Outpatient)",
    type: "outpatient",
    address: "4111 Midas Ave, Los Angeles, CA 90210",
    phone: "(877) 628-3871",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Outpatient treatment, milieu therapy",
    notes: "Specialized outpatient programming"
  },
  {
    name: "Muse Treatment (Women's/OCD/Outpatient)",
    type: "outpatient",
    address: "1521 Westwood Blvd, Los Angeles, CA 90024",
    phone: "(877) 628-3871",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Women's treatment, OCD specialization, outpatient",
    notes: "Women-specific programming with OCD focus"
  },
  {
    name: "Montare OP",
    type: "outpatient",
    address: "17147 Ventura Blvd Suite 101, Encino, CA 91316",
    phone: "(877) 628-3871",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Outpatient treatment",
    notes: "Comprehensive outpatient services"
  },
  {
    name: "RCA Virtual OP",
    type: "outpatient",
    address: "3737 Avenida del Sol, Studio City, CA 91604",
    phone: "(877) 628-3871",
    county: "Los Angeles",
    acceptsMediCal: false,
    acceptsCouples: false,
    services: "Virtual outpatient treatment",
    notes: "Online/telehealth treatment options"
  },
  {
    name: "Craven Recovery OP Center",
    type: "outpatient",
    address: "8800 Brockman St Suite 5A, Los Angeles, CA 90003",
    phone: "(213) 267-5376",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Outpatient treatment, counseling",
    notes: "Community-based outpatient services"
  },
  {
    name: "NiCare Recovery Services",
    type: "outpatient",
    address: "11515 W Washington Blvd, Los Angeles, CA 90066",
    phone: "(310) 542-2662",
    county: "Los Angeles",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Outpatient treatment, counseling",
    notes: "Community outpatient services"
  },
  {
    name: "Action Alliance - Aliso Viejo",
    type: "outpatient",
    address: "Aliso Viejo, CA",
    phone: "(714) 381-4319",
    county: "Orange",
    acceptsMediCal: true,
    acceptsCouples: false,
    services: "Outpatient treatment, counseling",
    notes: "Orange County outpatient services"
  },

  // SUPPORT GROUPS
  {
    name: "Alcoholics Anonymous - Palm Desert",
    type: "support_group",
    address: "7725 Lemon St Suite 200, Palm Desert, CA 92211",
    phone: "(877) 864-0207",
    county: "Riverside",
    acceptsMediCal: true,
    acceptsCouples: true,
    services: "12-step meetings, peer support",
    notes: "Free AA meetings, open to all"
  }
];

async function importSoberLivingDirectory() {
  console.log("🏠 Importing Sober Living & Treatment Directory\n");
  console.log(`Total facilities to import: ${facilities.length}\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const facility of facilities) {
    try {
      const city = extractCity(facility.address, facility.county);
      const zipCode = extractZip(facility.address);
      const servesPopulation = determinePopulation(facility.services, facility.notes);

      await db.insert(treatmentCenters).values({
        name: facility.name,
        type: facility.type,
        address: facility.address,
        city: city,
        zipCode: zipCode,
        phone: facility.phone || null,
        servesPopulation: servesPopulation,
        acceptsCouples: facility.acceptsCouples ? 1 : 0,
        acceptsMediCal: facility.acceptsMediCal ? 1 : 0,
        acceptsMedicare: 0,
        acceptsPrivateInsurance: facility.acceptsMediCal ? 0 : 1,
        acceptsRBH: 0,
        servicesOffered: JSON.stringify([facility.services]),
        amenities: null,
        isJointCommission: 0,
        isVerified: 0,
        isPublished: 1,
        description: facility.notes
      });

      console.log(`✅ ${facility.name} (${facility.type})`);
      console.log(`   ${city} | ${facility.acceptsCouples ? "Accepts Couples" : "No Couples"} | ${facility.acceptsMediCal ? "Medi-Cal" : "Private Pay"}\n`);
      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${facility.name}\n`);
        skipped++;
      } else {
        console.error(`❌ Error importing ${facility.name}:`, error.message);
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${facilities.length}`);

  // Count by type
  const soberLiving = facilities.filter(f => f.type === "sober_living").length;
  const residential = facilities.filter(f => f.type === "residential").length;
  const transitional = facilities.filter(f => f.type === "transitional").length;
  const outpatient = facilities.filter(f => f.type === "outpatient").length;

  console.log(`\n🏠 Directory Breakdown:`);
  console.log(`   Sober Living: ${soberLiving}`);
  console.log(`   Residential: ${residential}`);
  console.log(`   Transitional: ${transitional}`);
  console.log(`   Outpatient: ${outpatient}`);

  console.log("\n✨ Sober Living Directory is ready for search!");

  client.close();
}

importSoberLivingDirectory();
