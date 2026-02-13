import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { resources } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

const housingResources = [
  // ============ EMERGENCY & GENERAL REFERRALS ============
  {
    name: "211 California - Statewide",
    type: "housing",
    description: "Free, confidential, 24/7 service connecting you to local rental assistance, emergency shelter, food, utilities, employment, health and human services. Available in multiple languages.",
    phone: "2-1-1 (24/7) or Text ZIP to 898211",
    website: "https://211ca.org",
    filters: JSON.stringify({
      free: true,
      available24_7: true,
      multilingual: true,
      emergencyShelter: true,
      rentalAssistance: true,
      referralService: true,
    })
  },
  {
    name: "211 Sacramento",
    type: "housing",
    description: "24/7 information and referral for homeless services, rental assistance, emergency shelter, and community resources in Sacramento County.",
    city: "Sacramento",
    phone: "2-1-1 or (916) 498-1000 or (844) 546-1464",
    website: "https://www.211sacramento.org",
    filters: JSON.stringify({
      free: true,
      available24_7: true,
      homelessServices: true,
      rentalAssistance: true,
      emergencyShelter: true,
    })
  },
  {
    name: "211 Los Angeles",
    type: "housing",
    description: "24/7 helpline and referral service for housing, food, health services, and emergency assistance in LA County.",
    city: "Los Angeles",
    phone: "2-1-1 or Text 898211",
    website: "https://211la.org",
    filters: JSON.stringify({
      free: true,
      available24_7: true,
      multilingual: true,
      emergencyShelter: true,
      rentalAssistance: true,
    })
  },
  {
    name: "HUD Resource Locator",
    type: "housing",
    description: "Find affordable housing properties, Public Housing Authorities, HUD-approved housing counselors, and FHA-approved lenders nationwide. Interactive map tool.",
    phone: "(800) 955-2232 (PHA Locator) or (800) 569-4287 (Main)",
    website: "https://resources.hud.gov",
    filters: JSON.stringify({
      free: true,
      affordableHousing: true,
      publicHousing: true,
      housingCounseling: true,
      section8: true,
    })
  },

  // ============ RENTAL ASSISTANCE & SECTION 8 ============
  {
    name: "Housing Authority of the City of Los Angeles (HACLA)",
    type: "housing",
    description: "Section 8 Housing Choice Vouchers, project-based vouchers, and Emergency Housing Vouchers for LA City residents.",
    city: "Los Angeles",
    address: "2600 Wilshire Blvd, Los Angeles, CA 90057",
    phone: "(213) 252-2850",
    website: "https://www.hacla.org",
    filters: JSON.stringify({
      section8: true,
      housingVoucher: true,
      emergencyVoucher: true,
      projectBased: true,
    })
  },
  {
    name: "San Francisco Housing Authority",
    type: "housing",
    description: "Public housing and Section 8 vouchers for San Francisco residents.",
    city: "San Francisco",
    address: "1815 Egbert Ave, San Francisco, CA 94124",
    phone: "(415) 715-3300",
    website: "https://www.sfha.org",
    filters: JSON.stringify({
      section8: true,
      housingVoucher: true,
      publicHousing: true,
    })
  },
  {
    name: "Sacramento Housing & Redevelopment Agency (SHRA)",
    type: "housing",
    description: "Affordable housing, Section 8 vouchers, and redevelopment services for Sacramento residents.",
    city: "Sacramento",
    address: "630 I Street, Sacramento, CA 95814",
    phone: "(916) 440-1390",
    website: "https://www.shra.org",
    filters: JSON.stringify({
      section8: true,
      housingVoucher: true,
      affordableHousing: true,
    })
  },
  {
    name: "San Diego Housing Commission",
    type: "housing",
    description: "Housing vouchers, affordable housing, and homeless services for San Diego residents.",
    city: "San Diego",
    address: "1122 Broadway, Suite 300, San Diego, CA 92101",
    phone: "(619) 578-7550",
    website: "https://www.sdhc.org",
    filters: JSON.stringify({
      section8: true,
      housingVoucher: true,
      affordableHousing: true,
      homelessServices: true,
    })
  },
  {
    name: "Oakland Housing Authority",
    type: "housing",
    description: "Public housing and rental assistance programs for Oakland residents.",
    city: "Oakland",
    address: "1619 Harrison Street, Oakland, CA 94612",
    phone: "(510) 874-1555",
    website: "https://www.oakha.org",
    filters: JSON.stringify({
      section8: true,
      housingVoucher: true,
      publicHousing: true,
    })
  },

  // ============ DIRECT RENTAL ASSISTANCE ============
  {
    name: "LifeSTEPS",
    type: "housing",
    description: "Direct rental assistance, eviction prevention, security deposits, housing navigation, and case management. 93% housing retention rate. Serves Sacramento County, veterans, and Cal AIM participants.",
    city: "Sacramento",
    address: "3247 Ramos Circle, Sacramento, CA 95827",
    phone: "(916) 965-0110",
    website: "https://lifestepsusa.org",
    filters: JSON.stringify({
      rentalAssistance: true,
      evictionPrevention: true,
      securityDeposit: true,
      caseManagement: true,
      veterans: true,
      seniors: true,
    })
  },
  {
    name: "Catholic Charities of Los Angeles",
    type: "housing",
    description: "Emergency rent assistance, utility bills, eviction prevention, and food pantry. One-time emergency aid for families in crisis.",
    city: "Los Angeles",
    address: "1531 James M Wood Blvd, Los Angeles, CA 90015",
    phone: "(213) 251-3400",
    website: "https://catholiccharitiesca.org/region/los-angeles/",
    hours: "Monday-Friday, 12pm-1pm (lunch break varies)",
    filters: JSON.stringify({
      free: true,
      emergencyAssistance: true,
      rentalAssistance: true,
      utilityAssistance: true,
      evictionPrevention: true,
      foodPantry: true,
    })
  },
  {
    name: "Catholic Charities of San Francisco",
    type: "housing",
    description: "Rental assistance, eviction prevention, housing counseling. FEPCO partner. Services in English, Spanish, Vietnamese.",
    city: "San Francisco",
    address: "2871 Mission St, San Francisco, CA 94110",
    phone: "(415) 972-1200 or (415) 972-1301 (assistance)",
    website: "https://catholiccharitiessf.org",
    filters: JSON.stringify({
      free: true,
      rentalAssistance: true,
      evictionPrevention: true,
      housingCounseling: true,
      multilingual: true,
    })
  },
  {
    name: "Catholic Charities of Sacramento",
    type: "housing",
    description: "Emergency assistance, rent help, and utility payments for Sacramento residents.",
    city: "Sacramento",
    phone: "(916) 706-1539",
    website: "https://www.ccdosa.org",
    filters: JSON.stringify({
      free: true,
      emergencyAssistance: true,
      rentalAssistance: true,
      utilityAssistance: true,
    })
  },
  {
    name: "Catholic Charities of San Diego",
    type: "housing",
    description: "Emergency financial assistance and housing support for San Diego residents.",
    city: "San Diego",
    phone: "(619) 231-2828",
    website: "https://www.ccdsd.org",
    filters: JSON.stringify({
      free: true,
      emergencyAssistance: true,
      rentalAssistance: true,
    })
  },

  // ============ STATE PROGRAMS (CalWORKs, etc.) ============
  {
    name: "CalWORKs Housing Support Program (HSP)",
    type: "housing",
    description: "Housing assistance for CalWORKs families experiencing or at risk of homelessness. Rental assistance, security deposits, moving costs, hotel vouchers, case management, credit repair.",
    phone: "(916) 651-5155 (State), (866) 613-3777 (LA County)",
    website: "https://www.cdss.ca.gov/inforesources/cdss-programs/housing-programs/calworks-housing-support-program",
    filters: JSON.stringify({
      calworks: true,
      rentalAssistance: true,
      securityDeposit: true,
      movingAssistance: true,
      emergencyShelter: true,
      caseManagement: true,
      familiesWithChildren: true,
    })
  },
  {
    name: "CalWORKs Homeless Assistance (HA)",
    type: "housing",
    description: "Emergency motel vouchers (16 days, 32 for domestic violence), security deposits, last month's rent, moving assistance up to $2,500 for CalWORKs families.",
    phone: "(866) 613-3777 (LA County) or contact county CalWORKs office",
    website: "https://www.cdss.ca.gov/inforesources/cdss-programs/housing-programs/calworks-homeless-assistance",
    filters: JSON.stringify({
      calworks: true,
      emergencyShelter: true,
      securityDeposit: true,
      movingAssistance: true,
      domesticViolence: true,
      familiesWithChildren: true,
    })
  },
  {
    name: "Housing and Disability Advocacy Program (HDAP)",
    type: "housing",
    description: "Assistance for homeless disabled individuals with benefits applications (SSI/SSP, SSDI), case management, and housing supports while awaiting benefits approval.",
    phone: "(916) 651-8848 or contact county social services",
    website: "https://www.cdss.ca.gov/inforesources/cdss-programs/housing-programs/housing-and-disability-advocacy-program",
    filters: JSON.stringify({
      disabilityServices: true,
      homeless: true,
      benefitsAssistance: true,
      caseManagement: true,
      ssi: true,
      ssdi: true,
    })
  },
  {
    name: "Bringing Families Home (BFH)",
    type: "housing",
    description: "Housing stability for families in child welfare system. Prevents foster care placements due to homelessness and supports family reunification.",
    phone: "(916) 651-8848 or contact county child welfare services",
    website: "https://www.cdss.ca.gov/inforesources/cdss-programs/housing-programs/bringing-families-home",
    filters: JSON.stringify({
      familiesWithChildren: true,
      childWelfare: true,
      fosterCare: true,
      familyReunification: true,
      homeless: true,
    })
  },

  // ============ LEGAL SERVICES & RIGHTS PROTECTION ============
  {
    name: "California Civil Rights Department (CRD)",
    type: "legal",
    description: "Enforces fair housing laws, investigates discrimination complaints. File within 1 year. Protects against source of income discrimination (including Section 8).",
    phone: "(800) 884-1684 or TTY (800) 700-2320",
    website: "https://calcivilrights.ca.gov",
    filters: JSON.stringify({
      free: true,
      legalServices: true,
      fairHousing: true,
      discriminationProtection: true,
      section8Protection: true,
      complaintProcess: true,
    })
  },
  {
    name: "Stay Housed LA",
    type: "legal",
    description: "Free legal representation for LA County tenants facing eviction. Know Your Rights workshops, legal clinics, self-help resources. CRITICAL: 5 business days to respond to eviction lawsuit.",
    city: "Los Angeles",
    phone: "(888) 694-0040",
    website: "https://www.stayhousedla.org",
    filters: JSON.stringify({
      free: true,
      legalServices: true,
      evictionDefense: true,
      tenantRights: true,
      workshops: true,
      lowIncome: true,
    })
  },
  {
    name: "Legal Aid Foundation of Los Angeles (LAFLA)",
    type: "legal",
    description: "Free civil legal services for low-income LA County residents. Housing, eviction defense, domestic violence, public benefits.",
    city: "Los Angeles",
    phone: "(800) 399-4529",
    website: "https://lafla.org/get-help/housing-and-eviction/",
    filters: JSON.stringify({
      free: true,
      legalServices: true,
      evictionDefense: true,
      housingLaw: true,
      lowIncome: true,
    })
  },
  {
    name: "LawHelpCA",
    type: "legal",
    description: "Statewide directory of 100+ free and low-cost legal aid organizations. Self-help info on housing, evictions, foreclosure, landlord-tenant law, Section 8, discrimination.",
    phone: "See website for local providers",
    website: "https://www.lawhelpca.org",
    filters: JSON.stringify({
      free: true,
      legalServices: true,
      evictionDefense: true,
      housingLaw: true,
      tenantRights: true,
      referralService: true,
    })
  },

  // ============ VETERAN SERVICES ============
  {
    name: "VA Housing Services - National Hotline",
    type: "housing",
    description: "HUD-VASH vouchers, Grant and Per Diem transitional housing, SSVF rapid re-housing, Veterans Justice Outreach, Healthcare for Homeless Veterans.",
    phone: "(877) 424-3838 or Veterans Crisis Line (800) 273-8255 Press 1",
    website: "https://www.va.gov/homeless",
    filters: JSON.stringify({
      veterans: true,
      housingVoucher: true,
      transitionalHousing: true,
      rapidRehousing: true,
      caseManagement: true,
      healthServices: true,
    })
  },
  {
    name: "VA Greater Los Angeles - Homeless Veterans Services",
    type: "housing",
    description: "Veterans housing assistance, transitional housing hotline (text 'Unhoused Veteran' to (213) 563-7979), comprehensive homeless services.",
    city: "Los Angeles",
    address: "11301 Wilshire Blvd, Los Angeles, CA 90073",
    phone: "(310) 268-4347 or (310) 268-3350 (homeless)",
    filters: JSON.stringify({
      veterans: true,
      emergencyShelter: true,
      transitionalHousing: true,
      housingAssistance: true,
      textService: true,
    })
  },
  {
    name: "LifeSTEPS Veterans Services",
    type: "housing",
    description: "Veteran-specific rent assistance, eviction prevention for veterans in Sacramento area.",
    city: "Sacramento",
    phone: "(916) 965-0110",
    website: "https://lifestepsusa.org",
    filters: JSON.stringify({
      veterans: true,
      rentalAssistance: true,
      evictionPrevention: true,
    })
  },

  // ============ SPECIALIZED SERVICES ============
  {
    name: "HCD Mobilehome Ombudsman",
    type: "housing",
    description: "Registration, titling, Mobilehome Residency Law protections, dispute resolution, park violations, health and safety complaints.",
    phone: "(800) 952-5275 or (916) 445-4782",
    website: "https://www.hcd.ca.gov",
    filters: JSON.stringify({
      mobilehome: true,
      tenantRights: true,
      disputeResolution: true,
      complaintProcess: true,
    })
  },
  {
    name: "Homekey Program",
    type: "housing",
    description: "State initiative converting buildings into permanent supportive housing for homeless individuals. 16,000 homes funded statewide. Contact local Continuum of Care or dial 211 to access.",
    phone: "(916) 445-4728 or Dial 211",
    website: "https://www.hcd.ca.gov/grants-and-funding/programs-active/homekey",
    filters: JSON.stringify({
      permanentSupportiveHousing: true,
      homeless: true,
      affordableHousing: true,
      referralOnly: true,
    })
  },
  {
    name: "National Domestic Violence Hotline",
    type: "housing",
    description: "24/7 crisis support, emergency shelter referrals, safety planning, legal advocacy for domestic violence survivors.",
    phone: "(800) 799-7233",
    website: "https://www.thehotline.org",
    filters: JSON.stringify({
      free: true,
      available24_7: true,
      domesticViolence: true,
      emergencyShelter: true,
      crisisSupport: true,
      confidential: true,
    })
  },
  {
    name: "FEMA Disaster Assistance",
    type: "housing",
    description: "Temporary housing assistance, home repair grants, replacement of essential items after federally declared disasters. Apply within 60 days.",
    phone: "(800) 621-3362 or TTY (800) 462-7585",
    website: "https://www.disasterassistance.gov",
    filters: JSON.stringify({
      disasterRelief: true,
      temporaryHousing: true,
      homeRepair: true,
      emergencyAssistance: true,
    })
  },
];

async function importHousingServices() {
  console.log("🏠 Importing California Housing Services Directory\n");
  console.log(`Total resources to import: ${housingResources.length}\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const byType: Record<string, number> = {};

  for (const resource of housingResources) {
    try {
      await db.insert(resources).values({
        name: resource.name,
        type: resource.type,
        description: resource.description,
        address: resource.address || null,
        city: resource.city || null,
        phone: resource.phone || null,
        website: resource.website || null,
        hours: resource.hours || null,
        filters: resource.filters,
        isVerified: 1,
      });

      console.log(`✅ ${resource.name}`);
      if (resource.city) console.log(`   📍 ${resource.city}`);
      console.log(`   📞 ${resource.phone || 'See website'}\n`);

      byType[resource.type] = (byType[resource.type] || 0) + 1;
      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${resource.name}\n`);
        skipped++;
      } else {
        console.error(`❌ Error importing ${resource.name}:`, error.message);
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${housingResources.length}`);

  console.log("\n📋 By Category:");
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} resources`);
  });

  console.log("\n📚 Categories Covered:");
  console.log("   🆘 Emergency Services (211, hotlines)");
  console.log("   🏘️ Section 8 & Housing Authorities");
  console.log("   💰 Direct Rental Assistance (LifeSTEPS, Catholic Charities)");
  console.log("   👨‍👩‍👧 CalWORKs Programs (HSP, HA, BFH, HDAP)");
  console.log("   ⚖️ Legal Services & Rights Protection");
  console.log("   🎖️ Veteran Services (VA, LifeSTEPS Veterans)");
  console.log("   🏕️ Specialized Services (Mobilehomes, Homekey, Disaster)");

  console.log("\n✨ Housing services import complete!");
  console.log("\nℹ️  Key Emergency Contacts:");
  console.log("   • 211: General housing & emergency services");
  console.log("   • (800) 799-7233: Domestic Violence Hotline");
  console.log("   • (877) 424-3838: VA Homeless Hotline");
  console.log("   • (888) 694-0040: Stay Housed LA (eviction defense)");

  client.close();
}

importHousingServices();
