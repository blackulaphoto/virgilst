import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Note: resources table uses 'medical' type for dental services
const dentalClinics = [
  {
    name: "St. John's Community Health - Dental Services",
    type: "medical",
    address: "Multiple locations in LA County",
    phone: "(323) 541-1411",
    website: "https://www.sjch.org/dental-services",
    description: "FQHC offering sliding scale dental care including exams, cleanings, fillings, extractions, and emergency dental care. Accepts Medi-Cal/Denti-Cal. No one turned away for inability to pay.",
    hours: "Call for appointment availability",
    filters: JSON.stringify({ dental: true, emergency: true, slidingScale: true, mediCal: true, fqhc: true })
  },
  {
    name: "Saban Community Clinic - Dental",
    type: "medical",
    address: "5205 Melrose Ave, Los Angeles, CA 90038",
    phone: "(323) 653-1990",
    website: "https://www.sabancommunityclinic.org",
    description: "Affordable dental clinic with real clinic infrastructure. Offers same-week urgent openings for dental pain and infections. Full dental services available.",
    hours: "Mon-Fri 8:00am-4:30pm, Sat 8:00am-4:00pm",
    filters: JSON.stringify({ dental: true, urgent: true, slidingScale: true, weekend: true })
  },
  {
    name: "Venice Family Clinic - Dental",
    type: "medical",
    address: "Multiple locations: 2509 Pico Blvd Santa Monica, 4700 Inglewood Blvd Culver City",
    phone: "(310) 392-8636",
    website: "https://venicefamilyclinic.org/care/dental/",
    description: "UCLA-affiliated comprehensive dental care with urgent care access. Offers exams, X-rays, cleanings, fillings, extractions, and urgent care for dental pain/infections.",
    hours: "Call for location-specific hours",
    filters: JSON.stringify({ dental: true, emergency: true, slidingScale: true, mediCal: true })
  },
  {
    name: "JWCH Institute / Wesley Health Centers - Dental",
    type: "medical",
    address: "522 S. San Pedro St, Los Angeles, CA 90013",
    phone: "(213) 285-4266",
    website: "https://jwchinstitute.org/services/dental-oral-health-care/",
    description: "Skid Row/DTLA dental clinic with sliding fee scale. Accepts Medi-Cal Dental and uses 'no one turned away' policy. Urgent appointments available. Call (866) 733-5924 for appointment center hotline.",
    hours: "Call for appointment hours",
    filters: JSON.stringify({ dental: true, emergency: true, slidingScale: true, mediCal: true })
  },
  {
    name: "UCLA School of Dentistry - Student Clinics",
    type: "medical",
    address: "714 Tiverton Dr, Westwood, CA 90095 (also 323 S. Lincoln Blvd, Venice)",
    phone: "(310) 206-3904",
    website: "https://dentistry.ucla.edu/patient-care/clinic-locations",
    description: "Lower-cost dental care through student/resident clinics. Capable of specialty work including root canals and oral surgery at reduced fees compared to private sector.",
    hours: "Call for clinic hours",
    filters: JSON.stringify({ dental: true, lowCost: true, specialty: true, studentClinic: true })
  },
  {
    name: "USC Ostrow School of Dentistry - Urgent Care",
    type: "medical",
    address: "925 W 34th St, Los Angeles, CA 90089",
    phone: "(213) 740-2800",
    website: "https://dentistry.usc.edu/patient-care/urgent-care/",
    description: "Dental trauma and urgent care center with transparent emergency pricing ($59-$350). Accepts Denti-Cal for certain limited/emergency treatment. Call (213) 740-1576 for urgent care line.",
    hours: "Call for urgent care hours",
    filters: JSON.stringify({ dental: true, emergency: true, trauma: true, dentiCal: true, studentClinic: true })
  },
  {
    name: "Angeles Community Health Center - Dental",
    type: "medical",
    address: "1919 W 7th St, 2nd & 3rd Floors, Los Angeles, CA 90057",
    phone: "(866) 981-3002",
    website: "https://www.angelescommunity.org",
    description: "FQHC offering affordable general dentistry including emergency services. Sliding scale available with Medi-Cal acceptance.",
    hours: "Mon-Fri 8:30am-5:00pm, Sat 9:00am-3:00pm",
    filters: JSON.stringify({ dental: true, emergency: true, slidingScale: true, mediCal: true, fqhc: true, weekend: true })
  },
  {
    name: "APLA Health Dental Clinic",
    type: "medical",
    address: "1127 Wilshire Blvd., Suite 1504, Los Angeles, CA 90017",
    phone: "(213) 201-1388",
    website: "https://aplahealth.org/locations/apla-health-dental-clinic-downtown-los-angeles/",
    description: "Dental clinic serving underserved communities with sliding scale options. Structured clinic with after-hours phone support.",
    hours: "Mon-Fri 8am-12pm / 1pm-5pm",
    filters: JSON.stringify({ dental: true, slidingScale: true })
  },
  {
    name: "Union Rescue Mission - USC Dental Clinic Program",
    type: "medical",
    address: "545 S. San Pedro St, Los Angeles, CA 90013",
    phone: "(213) 347-6300",
    website: "https://urm.org/support-services/",
    description: "Truly FREE dental care provided by USC faculty and students through Union Rescue Mission. Appointment/referral-based program. Call intake to ask how to get scheduled.",
    hours: "Call for intake and scheduling",
    filters: JSON.stringify({ dental: true, free: true, referralRequired: true })
  },
  {
    name: "Emergency Dental Relief 24/7",
    type: "medical",
    address: "10458 Vermont Ave, Los Angeles, CA 90044",
    phone: "(213) 212-5046",
    website: "https://about.me/relief247losangeles",
    description: "Emergency dentist with payment plan options. Fast placement for urgent dental pain. Phone line available 24/7.",
    hours: "6am-8pm (24/7 phone line)",
    filters: JSON.stringify({ dental: true, emergency: true, twentyFourSeven: true, paymentPlan: true })
  }
];

async function importDentalResources() {
  console.log("Importing 10 dental clinics...");
  
  for (const clinic of dentalClinics) {
    try {
      await db.insert(resources).values(clinic);
      console.log(`✓ Added: ${clinic.name}`);
    } catch (error) {
      console.error(`✗ Failed to add ${clinic.name}:`, error.message);
    }
  }
  
  console.log("\nDental resources import complete!");
  process.exit(0);
}

importDentalResources();
