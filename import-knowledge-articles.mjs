import { drizzle } from "drizzle-orm/mysql2";
import { articles } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const knowledgeArticles = [
  {
    title: "Emergency Shelter Tonight - LA County Quick Start",
    slug: "emergency-shelter-tonight-la-2026",
    category: "Housing",
    content: `# Emergency Shelter Tonight - LA County Quick Start

## The Point
You need a place to sleep tonight. Here's how to get a bed in LA County.

## What to Do TODAY (Start Here)

1. **Call 211 right now** - Available 24/7, free call from any phone
   - Dial: **211** or **(800) 339-6993**
   - Ask: "I need emergency shelter tonight in [your area]"

2. **Write this down when they answer:**
   - Shelter name and address
   - Check-in time (usually 4-7 PM)
   - What you can bring (bags, pets, etc.)
   - Any ID or documents needed

3. **If beds are full**, ask: "What time should I call back?" (Lists often reset at 6 AM)

## Winter Shelter (October - March)
Extra beds open during winter months. Same process as above.

**LA County Winter Shelter Hotline:** Call **211**
- Available: October through March
- Best time to call: 6 AM - 9 AM
- Most shelters check-in between 4 PM - 7 PM

## Emergency Shelters (Year-Round Options)

### The Midnight Mission
- **Address:** 601 S. San Pedro St, Los Angeles, CA 90014
- **Phone:** (213) 624-9258
- **Hours:** Walk-ins accepted 24/7
- **What they offer:** Meals, showers, beds (men and women)

### Union Rescue Mission
- **Address:** 545 S. San Pedro St, Los Angeles, CA 90013
- **Phone:** (213) 347-6300
- **For:** Men, women, and families
- **Intake:** Walk in or call ahead

### PATH (People Assisting The Homeless)
- **Phone:** (323) 644-2200
- **Services:** Housing placement, case management
- **Locations:** Multiple across LA County

## Safe Parking Programs (If You Have a Vehicle)

### Safe Parking LA
- **Phone:** (818) 847-3200
- **What you need:** Working vehicle, valid license/ID
- **How it works:** Park overnight in supervised lots with security and bathrooms
- **Cost:** Free
- **To apply:** Call 211 and ask for "Safe Parking LA intake"

## If That Fails (Backup Options)
1. **LA Family Housing**: (818) 246-7900 - Families with children
2. **Volunteers of America**: (626) 442-4357 - Veterans priority
3. **LAHSA Crisis Response**: (213) 683-1243 - After hours emergency

## What to Say (Phone Script)
"Hi, I need emergency shelter tonight in [your neighborhood/city]. I'm currently unhoused and need a place to sleep. What shelters have beds available, and what's the check-in process?"`,
    excerpt: "Need a place to sleep tonight? Call 211 right now for emergency shelter in LA County. This guide shows you exactly what to say and where to go.",
    authorId: 1,
    published: true,
    featured: true,
  },
  {
    title: "Get Food Today - LA County Free Meals & Food Banks",
    slug: "get-food-today-la-2026",
    category: "Benefits",
    content: `# Get Food Today - LA County Free Meals & Food Banks

## The Point
Get food today - no ID, no proof of income, no questions. Here's where to go right now.

## What to Do THIS HOUR (Immediate Food)

### Call 211 First
- Dial: **211** or **(800) 339-6993**
- Say: "I need food today in [your neighborhood]. What's closest to me?"
- They'll tell you which food banks are open TODAY with current hours

### Or Text for Food Locations
- Text your ZIP CODE to **877-877**
- Get list of nearby food pantries texted to you

## Hot Meals (Free, Walk Up, No ID Required)

### Downtown LA / Skid Row

**The Midnight Mission**
- **Address:** 601 S. San Pedro St, Los Angeles 90014
- **Meals:** Breakfast 5:30-6:30 AM, Lunch 11-12:30 PM, Dinner 5-6 PM
- **Every day** including holidays
- Walk up, no questions asked

**Union Rescue Mission**
- **Address:** 545 S. San Pedro St, Los Angeles 90013
- **Meals:** Breakfast, Lunch, Dinner daily
- **Phone:** (213) 347-6300

**Los Angeles Mission**
- **Address:** 303 E 5th St, Los Angeles 90013
- **Meals:** Breakfast 7 AM, Lunch 12 PM, Dinner 4:30 PM
- No ID needed

### Hollywood / East Hollywood

**Hollywood Food Coalition**
- **Address:** 5939 Hollywood Blvd (parking lot behind Baptist Church)
- **Dinner:** Every night 8 PM - 10 PM
- **Phone:** (323) 462-1200

### San Fernando Valley

**Hope of the Valley**
- **Multiple locations** serving meals
- **Phone:** (818) 392-0020
- Call for nearest meal site

## Food Boxes / Groceries (Take Home Food)

### LA Regional Food Bank
- **Phone:** (323) 234-3030
- **Website:** lafoodbank.org/find-food
- **70+ distribution sites** across LA County
- Most open weekly - call for schedule
- Get box of groceries to take home
- No ID required at most sites

### Food Pantries (Walk-in, Get Groceries)

**St. Joseph Center** (Venice/Santa Monica)
- **Address:** 204 Hampton Dr, Venice 90291
- **Food:** Tuesdays 11 AM - 1 PM
- **Phone:** (310) 399-6878

**Para Los Niños** (Downtown)
- **Address:** 1617 E 7th St, Los Angeles 90021
- **Hours:** Call for current schedule
- **Phone:** (213) 250-4800

**Westside Food Bank** (West LA)
- **Address:** 1710 22nd St, Santa Monica 90404
- **Hours:** Mon-Fri 10 AM - 1 PM
- **Phone:** (310) 828-6016

## What to Say (When You Walk In)
"Hi, I need food. Is this a good time?"

That's it. They'll tell you what to do. Most places will just hand you food or give you a box.

## What to Bring
- Bags/backpack for groceries
- ID if you have it (but most places don't require it)
- Nothing else needed

## If That Fails (Backup Options)
- **211:** Always current on what's open today
- **LA Food Bank:** (323) 234-3030 - Ask where closest pantry is
- **Any church:** Walk in and ask "Do you have a food pantry or know who does?"
- **Emergency food:** Many 7-Eleven and gas stations will give free hot dog or food if you explain you're hungry`,
    excerpt: "Hungry right now? Call 211 or text your ZIP to 877-877 for immediate food locations. Free hot meals served daily across LA with no ID required.",
    authorId: 1,
    published: true,
    featured: true,
  },
  {
    title: "Crisis Help 24/7 - Mental Health & Substance Use Support",
    slug: "crisis-help-247-la-2026",
    category: "Health",
    content: `# Crisis Help 24/7 - Mental Health & Substance Use Support

## The Point
This is the "I can't wait until Monday" sheet.

If you're in **immediate danger** or someone is overdosing: **call 911**.

## 24/7 Mental Health Help (Los Angeles County)

### LA County DMH ACCESS Center
- 24/7 entry point for mental health services in LA County.
- Can do crisis evaluation team deployment, referrals, and more.

**Call the ACCESS line:** 1-800-854-7771

### 988 Suicide & Crisis Lifeline
- 24/7 suicide & crisis lifeline (call/text/chat).
- Works anywhere in the U.S.

**Call or text:** 988

## 24/7 Substance Use Treatment Help (Los Angeles County)

### Substance Abuse Service Helpline (SASH)
- 24/7 screening + linkage to treatment providers.
- They can help connect you to an appointment.

**Call:** 1-844-804-7500

## "I'm Not Suicidal, But I Don't Feel Safe"

Say this on the phone:
"I'm not trying to die, but I do not feel safe right now and I need crisis support and options tonight."

If someone dismisses you, repeat:
"I'm asking for crisis support and a safe plan for tonight."

## Overdose / Medical Danger

If someone is not waking up, breathing weird, turning blue, or you suspect overdose:
- **Call 911**
- If you have naloxone (Narcan), use it and keep monitoring breathing.
- Stay with the person if safe.

## What to Do in the Next 10 Minutes

1) Pick one: **ACCESS line** (mental health) or **SASH** (substance use), or **988** (crisis support).
2) Tell them: where you are, if you're alone, and what you need *tonight*.
3) Ask: "What is my next step after this call? Who do I call if the plan falls apart?"`,
    excerpt: "In crisis right now? Call 988 for suicide/crisis support, 1-800-854-7771 for mental health, or 1-844-804-7500 for substance use help. All lines open 24/7.",
    authorId: 1,
    published: true,
    featured: true,
  },
  {
    title: "Apply for CalFresh, Medi-Cal & Cash Aid - California Benefits Fast Start",
    slug: "california-benefits-fast-start-2026",
    category: "Benefits",
    content: `# Apply for CalFresh, Medi-Cal & Cash Aid - California Benefits Fast Start

## The Point
Get food stamps (CalFresh), free health insurance (Medi-Cal), and cash assistance. One application covers all three.

## What to Do TODAY

### Option 1: Apply Online (Fastest)
1. Go to **BenefitsCal.com** on any computer/phone
2. Create account and fill out application
3. Takes 20-30 minutes
4. Upload photos of ID if you have one (optional but speeds things up)

### Option 2: Apply by Phone
Call your county's social services office (numbers below) and ask: "I want to apply for CalFresh and Medi-Cal over the phone"

### Option 3: Apply in Person
Walk into your county DPSS office (addresses below) and say: "I need to apply for food stamps and health insurance today"

## LA County (Los Angeles)
- **DPSS Phone:** (866) 613-3777
- **Office:** 12715 Van Nuys Blvd, Pacoima, CA 91331 (and 15 other locations)
- **Hours:** Mon-Fri 7:30 AM - 5:30 PM
- **Online:** BenefitsCal.com

## San Diego County
- **DPSS Phone:** (866) 262-9881
- **Office:** 3989 Ruffin Rd, San Diego, CA 92123
- **Hours:** Mon-Fri 8:00 AM - 5:00 PM
- **Online:** BenefitsCal.com

## Orange County
- **DPSS Phone:** (714) 541-7700
- **Office:** 1300 S Grand Ave, Santa Ana, CA 92705
- **Hours:** Mon-Fri 8:00 AM - 5:00 PM
- **Online:** BenefitsCal.com

## Alameda County (Oakland)
- **Phone:** (510) 267-8800
- **Office:** 401 Broadway, Oakland, CA 94607
- **Online:** BenefitsCal.com

## Sacramento County
- **Phone:** (916) 874-2072
- **Office:** 2450 Florin Rd, Sacramento, CA 95822
- **Online:** BenefitsCal.com

**All other counties:** Call **211** and ask for your county's DPSS phone number

## What You'll Get

### CalFresh (Food Stamps)
- **Amount:** $200-$500+/month loaded on EBT card
- **Timeline:** Emergency approval in 3 days if you qualify, otherwise 30 days
- **Who qualifies:** Low/no income - they'll calculate based on your situation

### Medi-Cal (Free Health Insurance)
- **What's covered:** Doctor visits, hospital, prescriptions, dental, vision
- **Cost:** $0
- **Who qualifies:** Most people with low income

### General Relief / Cash Aid
- **Amount:** Varies by county ($200-$400/month typical)
- **Who qualifies:** Depends on county - some require work search

## What to Say (Phone Script)
"Hi, I need to apply for CalFresh food stamps and Medi-Cal health insurance. I have very little money right now, so I think I qualify for emergency CalFresh. Can you help me apply over the phone or tell me the fastest way to apply? Also, I don't have a stable address right now - how can I receive notices and my EBT card?"

## If That Fails
- **CalFresh Hotline:** (877) 847-3663 - Ask about application help
- **Call 211:** They can connect you with application assistance programs
- **Walk into any county welfare office** - They MUST help you apply even if you're not from that county`,
    excerpt: "Apply for CalFresh food stamps, Medi-Cal health insurance, and cash aid with one application. Get emergency food stamps in 3 days. Apply online at BenefitsCal.com.",
    authorId: 1,
    published: true,
    featured: true,
  },
  {
    title: "Get Your California ID from Scratch - FREE for Homeless",
    slug: "california-id-rebuild-kit-2026",
    category: "Legal",
    content: `# Get Your California ID from Scratch - FREE for Homeless

## The Point
No ID = locked out of everything. Here's how to get your California ID from scratch, even with zero documents.

### The Order That Works
1. **Birth certificate** (proves who you are)
2. **Social Security card** (proves your Social Security number)
3. **California ID card** (opens all doors - get it FREE if you're homeless)

**Total time:** 2-6 weeks if you start today  
**Total cost:** $0-60 (or $0 if you qualify for free ID)

## Step 1: Get Your Birth Certificate

### If You Were Born in California:

**California Department of Public Health**
- **Phone:** (916) 445-2684
- **Website:** cdph.ca.gov/Programs/CHSI/Pages/Vital-Records.aspx
- **Cost:** $35 per copy
- **How to order:**
  1. Download application form from website OR call and request by phone
  2. Mail application with money order to: Office of Vital Records, PO Box 997410, Sacramento, CA 95899-7410
  3. Takes 4-8 weeks by mail

**Faster option - Order from your birth county:**
- Los Angeles: (213) 240-7812 - cdph.lacounty.gov
- San Diego: (619) 692-5733
- Orange County: (714) 834-3600
- Sacramento: (916) 874-6334

**No stable address?** Ask if you can pick up in person, or have it sent to:
- A shelter you're staying at
- General Delivery: [Your Name], General Delivery, [City], CA [ZIP] (pick up at post office with any ID)
- Friends/family address

### If You Were Born Outside California:
Call **VitalChek** at (877) 817-7363 to order from any state

## Step 2: Get Your Social Security Card

**Social Security Administration (SSA)**
- **National number:** (800) 772-1213
- **Hours:** Mon-Fri 8 AM - 5:30 PM
- **Cost:** FREE

### How to Get It:
1. **Find your nearest SSA office:** ssa.gov/locator
   - LA Downtown: 888 S Figueroa St #1001, Los Angeles
   - San Diego: 550 W C St, San Diego
   - Oakland: 1404 Franklin St, Oakland

2. **What to bring:**
   - Your birth certificate (from Step 1)
   - Any old ID you have (even expired helps)
   - Proof of identity: School ID, medical records, shelter letter

3. **Walk in** (no appointment needed for replacement cards)
   - Tell them: "I need to replace my Social Security card"
   - Fill out Form SS-5 (they'll give it to you)
   - Card arrives in mail in 7-10 days

**No ID at all?** Bring anything with your name: prescription bottle, mail, medical paperwork, shelter intake form

## Step 3: Get California ID Card - FREE for Homeless

**Department of Motor Vehicles (DMV)**
- **Phone:** (800) 777-0133
- **Cost:** $37 regular OR **$0 if you're homeless**

### How to Get FREE ID if You're Homeless:

1. **Find a partner organization** that helps with DMV no-fee ID:
   - LA: PATH - (323) 644-2200
   - LA: Midnight Mission - (213) 624-9258
   - SD: Father Joe's Villages - (619) 699-1000
   - Oakland: St. Mary's Center - (510) 923-9600
   - Sacramento: Loaves & Fishes - (916) 446-0874

2. **Ask them:** "Can you help me get a no-fee California ID card? I'm experiencing homelessness."

3. **They will:**
   - Fill out DMV fee waiver form
   - Give you a letter proving you're homeless
   - Sometimes take you to DMV

4. **Go to DMV with:**
   - Birth certificate (from Step 1)
   - Social Security card (from Step 2)
   - Homeless verification letter (from org)
   - Fee waiver form (from org)

**Timeline:** Walk out with temporary paper ID same day, plastic card arrives in 2-4 weeks

## What to Say (Scripts)

### Calling for Birth Certificate:
"Hi, I was born in [county] on [date]. I need a certified birth certificate to get an ID. Can I order one by phone and pay with a money order? Also, I don't have a stable address - can I pick it up in person or use General Delivery?"

### At Social Security Office:
"Hi, I need to replace my Social Security card. I have my birth certificate but no current ID. What else can I use to prove my identity?"

### Calling Homeless Service Organization:
"Hi, I'm experiencing homelessness and need help getting a California ID. Do you provide DMV fee waiver forms and homeless verification letters for no-fee IDs?"

## If That Fails

**Can't afford birth certificate?** Some counties waive fees - call and ask about fee waivers for homeless individuals

**SSA won't accept your documents?** Bring anything else with your name: jail release papers, hospital bracelet, old mail

**No homeless service nearby?** Call **211** and ask: "Who can help me get a DMV fee waiver for a no-fee California ID?"`,
    excerpt: "Lost all your ID? Get it back step-by-step: birth certificate → Social Security card → California ID. FREE ID available for homeless individuals through partner organizations.",
    authorId: 1,
    published: true,
    featured: true,
  },
];

console.log("Importing 5 knowledge articles into Virgil St. resource library...\n");

for (const article of knowledgeArticles) {
  try {
    await db.insert(articles).values(article);
    console.log(`✓ Added: ${article.title}`);
  } catch (error) {
    console.error(`✗ Failed to add: ${article.title}`);
    console.error(`  Error: ${error.message}`);
  }
}

console.log("\n✅ Import complete! All articles are now available in the resource library.");
process.exit(0);
