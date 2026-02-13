import { drizzle } from "drizzle-orm/mysql2";
import { articles, resources, videos } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding database...");

  // Sample articles
  const sampleArticles = [
    {
      title: "How to Apply for General Relief (GR)",
      slug: "how-to-apply-for-general-relief",
      content: `# How to Apply for General Relief (GR)

General Relief (GR) is a cash aid program for adults without children who need temporary financial help.

## Who Qualifies?

- Adults 18+ without minor children
- Los Angeles County residents
- Limited or no income
- U.S. citizens or qualified non-citizens

## What You'll Need

1. Valid ID (or explanation if you don't have one)
2. Proof of LA County residency
3. Social Security card or number
4. Bank statements (if applicable)

## Application Process

### Step 1: Visit Your Local DPSS Office
Find your nearest Department of Public Social Services (DPSS) office. Walk-ins are accepted, but expect wait times.

### Step 2: Complete the Application
Fill out form GR-1. Staff can help you if needed.

### Step 3: Interview
You'll have a brief interview about your situation and needs.

### Step 4: Wait for Approval
Processing typically takes 30-45 days. You may get emergency aid while waiting.

## How Much Can You Get?

- Single adults: $221/month
- Couples: $389/month

## Important Notes

- GR is temporary (usually 3-9 months)
- You must look for work or participate in job programs
- Benefits are loaded onto an EBT card
- Reapply if denied - many denials are overturned on appeal`,
      category: "benefits",
      summary: "Step-by-step guide to applying for General Relief cash assistance in Los Angeles County.",
      isPublished: true,
    },
    {
      title: "Getting Your Medi-Cal Card Without ID",
      slug: "getting-medi-cal-without-id",
      content: `# Getting Your Medi-Cal Card Without ID

You can still qualify for Medi-Cal even if you don't have identification.

## The Good News

California law says you can't be denied Medi-Cal just because you lack ID. The county must help you get documentation.

## What to Do

### 1. Apply Anyway
Go to your local DPSS office or apply online at BenefitsCal.com. When asked for ID, explain that you don't have it.

### 2. Request Help
Tell the worker you need help obtaining ID. They're required to assist you.

### 3. Use Alternative Proof
You can use:
- Homeless shelter records
- Letter from a social worker
- Medical records
- School records
- Church records

### 4. Get Emergency Coverage
If you need immediate medical care, ask for presumptive eligibility. This gives you temporary coverage while your application is processed.

## Timeline

- Emergency coverage: Same day
- Full approval: 45 days maximum

## Your Rights

- You cannot be denied for lack of ID
- The county must help you get documents
- You can appeal any denial

## Need Help?

Contact a legal aid organization if you're having trouble. They can advocate for you.`,
      category: "health",
      summary: "Learn how to get Medi-Cal coverage even without identification documents.",
      isPublished: true,
    },
    {
      title: "How to Avoid a Shelter Sweep",
      slug: "how-to-avoid-shelter-sweep",
      content: `# How to Avoid a Shelter Sweep

Shelter sweeps are stressful and dangerous. Here's what you need to know to protect yourself.

## Know Your Rights

- Police must give 72-hour notice before a sweep
- You have the right to retrieve your belongings
- They must store your property for 90 days
- You can't be arrested just for being homeless

## Warning Signs

Watch for:
- Orange notices posted in the area
- Increased police presence
- Outreach workers offering shelter
- Cleanup crews surveying the area

## What to Do

### Before a Sweep

1. **Document Everything**
   - Take photos of your camp
   - List all your belongings
   - Get names of outreach workers

2. **Pack Important Items**
   - ID and documents
   - Medications
   - Phone and charger
   - Money and cards

3. **Know Your Options**
   - Accept shelter if offered
   - Move to a safer location
   - Store valuables with friends

### During a Sweep

- Stay calm and cooperative
- Ask for a property receipt
- Get badge numbers if items are taken
- Request shelter placement

### After a Sweep

- Retrieve your property within 90 days
- File a claim if items were damaged
- Contact legal aid if your rights were violated

## Safe Zones

Some areas are less likely to be swept:
- Near churches offering protection
- Established encampments with services
- Areas with community support

## Get Alerts

Join community groups that share sweep warnings. Many areas have text alert systems.`,
      category: "housing",
      summary: "Protect yourself and your belongings from shelter sweeps with this survival guide.",
      isPublished: true,
    },
  ];

  for (const article of sampleArticles) {
    await db.insert(articles).values(article);
  }

  // Sample resources
  const sampleResources = [
    {
      name: "Los Angeles Mission",
      description: "Emergency shelter, meals, and recovery programs for men and women.",
      type: "shelter",
      address: "303 E 5th St, Los Angeles, CA 90013",
      phone: "(213) 629-1227",
      hours: "24/7",
      zipCode: "90013",
      isVerified: true,
    },
    {
      name: "St. Francis Center",
      description: "Day center with showers, laundry, mail services, and meals.",
      type: "hygiene",
      address: "2323 E 1st St, Los Angeles, CA 90033",
      phone: "(323) 267-0310",
      hours: "Mon-Fri 7am-3pm",
      zipCode: "90033",
      isVerified: true,
    },
    {
      name: "LA Family Housing",
      description: "Transitional housing and support services for families.",
      type: "shelter",
      address: "7843 Lankershim Blvd, North Hollywood, CA 91605",
      phone: "(818) 982-3333",
      hours: "Mon-Fri 9am-5pm",
      zipCode: "91605",
      isVerified: true,
    },
  ];

  for (const resource of sampleResources) {
    await db.insert(resources).values(resource);
  }

  // Sample videos
  const sampleVideos = [
    {
      title: "How to Apply for CalFresh (Food Stamps)",
      description: "Step-by-step walkthrough of the CalFresh application process.",
      youtubeId: "dQw4w9WgXcQ",
      category: "how_to_guides",
    },
    {
      title: "Know Your Rights: Dealing with Police",
      description: "Legal advice for homeless individuals interacting with law enforcement.",
      youtubeId: "dQw4w9WgXcQ",
      category: "legal_help",
    },
    {
      title: "Recovery Stories: From Streets to Stability",
      description: "Inspiring stories from people who overcame homelessness.",
      youtubeId: "dQw4w9WgXcQ",
      category: "recovery_motivation",
    },
  ];

  for (const video of sampleVideos) {
    await db.insert(videos).values(video);
  }

  console.log("✅ Database seeded successfully!");
}

seed().catch(console.error);
