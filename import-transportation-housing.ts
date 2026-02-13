import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { resources } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

const transportationAndHousingResources = [
  // ============ TRANSPORTATION RESOURCES ============
  {
    name: "Metro LIFE Program (Low-Income Fare is Easy)",
    type: "transportation",
    description: "LA County residents age 18+ who are head-of-household with household income below limits qualify for up to 20 free rides every month or discounted monthly pass on Metro. New participants receive a free 90-day pass; unused rides roll over for up to 8 months.",
    website: "https://taptogo.net",
    phone: "(866) 827-8646",
    hours: "LIFE team: (213) 922-2378, email: lifeinfo@metro.net",
    filters: JSON.stringify({
      free: true,
      lowCost: false,
      incomeBased: true,
      noIdRequired: false,
      transportation: true,
      metroAccess: true,
      age18Plus: true,
    })
  },
  {
    name: "LADOT Cityride",
    type: "transportation",
    description: "For LA residents age 65+ or qualified persons with disabilities. Participants receive a Cityride card loaded with $84 of fare value per quarter for $21 ($9 for low-income). Can be used for discounted taxi rides, dial-a-ride trips and free DASH bus rides.",
    phone: "213/310/323/818-808-7433, TDD: (800) 559-1950",
    filters: JSON.stringify({
      free: false,
      lowCost: true,
      seniors: true,
      disabilityServices: true,
      transportation: true,
      taxiAccess: true,
      dashBus: true,
    })
  },
  {
    name: "GoPass - LA Metro K-12 & Community College",
    type: "transportation",
    description: "K-12 and community college students attending participating schools can ride Metro buses and trains for free. A special GoPass TAP card provides unlimited rides throughout the school year.",
    website: "https://taptogo.net/gopass",
    phone: "(213) 922-6235",
    filters: JSON.stringify({
      free: true,
      students: true,
      k12: true,
      communityCollege: true,
      transportation: true,
      unlimitedRides: true,
    })
  },
  {
    name: "Access Services Free-Fare Program",
    type: "transportation",
    description: "People who qualify for ADA paratransit can ride most bus and rail lines in LA County for free by showing their Access ID card. Eligibility based on ability to use accessible buses and trains; applicants undergo an in-person transit evaluation.",
    phone: "(800) 827-0829, TDD: (800) 827-1359",
    filters: JSON.stringify({
      free: true,
      adaAccessible: true,
      disabilityServices: true,
      paratransit: true,
      transportation: true,
      evaluationRequired: true,
    })
  },
  {
    name: "DPSS GROW/START Transportation Assistance",
    type: "transportation",
    description: "Participants in the General Relief Opportunities for Work (GROW)/START program can receive bus passes or gas vouchers to attend orientation, training and job search appointments.",
    phone: "(866) 613-3777",
    filters: JSON.stringify({
      free: true,
      generalRelief: true,
      jobTraining: true,
      transportation: true,
      busPass: true,
      gasVoucher: true,
    })
  },

  // ============ HOUSING RESOURCES ============
  {
    name: "Section 8 Housing Choice Voucher - LACDA",
    type: "housing",
    description: "Helps very-low-income families, older adults and people with disabilities pay for rental housing. Participants pay 30-40% of income, voucher covers the rest. Waiting list currently closed; new vouchers issued through LA County Coordinated Entry System (CES) for homeless individuals.",
    website: "https://lacda.org",
    phone: "(626) 262-4510 (option 2), TDD: (626) 943-3898",
    city: "Los Angeles",
    filters: JSON.stringify({
      housingVoucher: true,
      section8: true,
      veryLowIncome: true,
      seniors: true,
      disabilityServices: true,
      homelessPriority: true,
      waitlistClosed: true,
    })
  },
  {
    name: "Housing Choice Voucher - HACLA (City of LA)",
    type: "housing",
    description: "HACLA administers Section 8 vouchers for City of L.A. General waiting list not always open. Also administers project-based vouchers and Emergency Housing Vouchers.",
    website: "https://hacla.hcvlist.org",
    phone: "(213) 523-7328, toll-free: (877) 621-7328",
    city: "Los Angeles",
    filters: JSON.stringify({
      housingVoucher: true,
      section8: true,
      projectBased: true,
      emergencyVoucher: true,
      waitlistVaries: true,
    })
  },
  {
    name: "Emergency Housing Vouchers (EHVs)",
    type: "housing",
    description: "HUD-funded vouchers for people who are homeless, at risk of homelessness, fleeing domestic violence or recently homeless. EHVs cover rent similarly to Section 8 but are time-limited. Access only through LA's Coordinated Entry System referrals.",
    phone: "2-1-1 or LAHSA: (800) 548-6047",
    filters: JSON.stringify({
      housingVoucher: true,
      homeless: true,
      domesticViolence: true,
      timeLimited: true,
      referralOnly: true,
      hudFunded: true,
    })
  },
  {
    name: "CalWORKs Homeless Assistance Programs - DPSS",
    type: "housing",
    description: "Programs for homeless CalWORKs families: Temporary Homeless Assistance (16 days motel/shelter), Permanent Homeless Assistance (security deposit, last month's rent), Moving Assistance ($2,500), Arrearage/EAPE (past-due rent up to $5,000), Four-Month Rental Assistance ($500/month for 4-8 months).",
    phone: "(866) 613-3777",
    filters: JSON.stringify({
      calworks: true,
      familiesWithChildren: true,
      emergencyShelter: true,
      securityDeposit: true,
      movingAssistance: true,
      rentalAssistance: true,
      evictionPrevention: true,
    })
  },
  {
    name: "Housing for Health - LA County DHS",
    type: "housing",
    description: "Provides Permanent Supportive Housing with intensive case-management for individuals experiencing chronic homelessness and facing complex health/behavioral-health conditions. Services include in-home caregiving, mental-health and substance-use treatment. Manages Flexible Housing Subsidy Pool.",
    phone: "(323) 274-3600, LAHSA hotline: (800) 548-6047",
    filters: JSON.stringify({
      permanentSupportiveHousing: true,
      chronicHomeless: true,
      mentalHealth: true,
      substanceUse: true,
      caseManagement: true,
      healthServices: true,
      referralOnly: true,
    })
  },
  {
    name: "HOPWA (Housing Opportunities for Persons with AIDS)",
    type: "housing",
    description: "Housing subsidies and supportive services for low-income persons living with HIV/AIDS. Services include Short-Term Rent/Mortgage/Utility assistance, move-in grants, Tenant-Based and Project-Based rental assistance. Priority given to those homeless, at risk or unstably housed.",
    website: "https://chirpla.org",
    phone: "1-877-7-CHIRPLA, email: lahd.hopwa@lacity.org",
    city: "Los Angeles",
    filters: JSON.stringify({
      hivAids: true,
      lowIncome: true,
      rentalAssistance: true,
      utilityAssistance: true,
      homelessPriority: true,
      moveInGrants: true,
    })
  },
  {
    name: "LA County Housing Resource Center",
    type: "housing",
    description: "Online database of affordable, special-needs and emergency housing listings across LA County. Provides phone assistance for those without internet access.",
    website: "https://housing.lacounty.gov",
    phone: "(877) 428-8844",
    filters: JSON.stringify({
      affordableHousing: true,
      specialNeeds: true,
      emergencyHousing: true,
      searchDatabase: true,
      phoneAssistance: true,
    })
  },
  {
    name: "Project Roomkey - LAHSA & LA County",
    type: "housing",
    description: "Temporary hotel or motel rooms for people experiencing homelessness who are high-risk for severe illness (over 65 or with certain medical conditions). Availability limited and determined by risk factors.",
    phone: "LAHSA: (800) 548-6047 or 2-1-1",
    filters: JSON.stringify({
      emergencyShelter: true,
      homeless: true,
      seniors: true,
      highRiskMedical: true,
      temporaryHousing: true,
      screeningRequired: true,
    })
  },
  {
    name: "Stay Housed LA",
    type: "housing",
    description: "Free legal services, mediation and rental-assistance referrals for tenants facing eviction or harassment.",
    website: "https://stayhousedla.org",
    phone: "(833) 223-7368",
    city: "Los Angeles",
    filters: JSON.stringify({
      free: true,
      legalServices: true,
      evictionPrevention: true,
      mediation: true,
      rentalAssistance: true,
      tenantRights: true,
    })
  },
  {
    name: "LA County Development Authority (LACDA) - General Housing",
    type: "housing",
    description: "Oversees affordable-housing developments, landlord incentive programs and home-improvement loans in addition to Section 8.",
    phone: "(626) 262-4511",
    filters: JSON.stringify({
      affordableHousing: true,
      landlordIncentives: true,
      homeImprovement: true,
      developmentAuthority: true,
    })
  },
  {
    name: "LA County Housing Resource Center - LAHD",
    type: "housing",
    description: "Online resource to list affordable rentals with 'Ask Housing' feature to connect with LAHD staff for assistance.",
    website: "https://housing.lacity.org",
    phone: "(866) 557-7368",
    city: "Los Angeles",
    filters: JSON.stringify({
      affordableHousing: true,
      rentalListings: true,
      staffAssistance: true,
      searchDatabase: true,
    })
  },
];

async function importTransportationHousing() {
  console.log("🚌🏠 Importing Transportation & Housing Resources\n");
  console.log(`Total resources to import: ${transportationAndHousingResources.length}\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const resource of transportationAndHousingResources) {
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
      console.log(`   Type: ${resource.type} | ${resource.phone || 'See website'}\n`);
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
  console.log(`   📦 Total: ${transportationAndHousingResources.length}`);
  console.log("\n📋 Breakdown:");
  console.log("   🚌 5 Transportation programs");
  console.log("      • Metro LIFE (20 free rides/month)");
  console.log("      • LADOT Cityride (seniors & disabled)");
  console.log("      • GoPass (students)");
  console.log("      • Access Services (ADA paratransit)");
  console.log("      • DPSS GROW/START (job training transit)");
  console.log("\n   🏠 11 Housing programs");
  console.log("      • Section 8 (LACDA & HACLA)");
  console.log("      • Emergency Housing Vouchers");
  console.log("      • CalWORKs Homeless Assistance");
  console.log("      • Housing for Health (PSH)");
  console.log("      • HOPWA (HIV/AIDS housing)");
  console.log("      • Project Roomkey (emergency)");
  console.log("      • Stay Housed LA (eviction prevention)");
  console.log("      • Housing Resource Centers");
  console.log("\n✨ Transportation & housing resources import complete!");
  console.log("\nℹ️  Key contacts:");
  console.log("   • 2-1-1: General homeless services & housing");
  console.log("   • (800) 548-6047: LAHSA hotline");
  console.log("   • (866) 613-3777: DPSS (CalWORKs, General Relief)");

  client.close();
}

importTransportationHousing();
