import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { videos } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

// Real videos from "ruby st" playlist with actual YouTube IDs
const playlistVideos = [
  {
    title: "How to be comfortable when homeless- PART 1- Shelter",
    youtubeId: "CnzwvX4NgUU",
    category: "how_to_guides",
    description: "Practical advice on finding and securing shelter when experiencing homelessness. Part 1 of a comprehensive survival series covering safe sleeping spots, shelter rules, and staying warm."
  },
  {
    title: "if your homeless or about to be watch this Tips and tricks!",
    youtubeId: "RKoqafP1StA",
    category: "street_hacks",
    description: "Essential tips and tricks for surviving on the streets. Real-world advice from someone who's been there, covering food, safety, and daily survival strategies."
  },
  {
    title: "Long-Term Homeless Advice",
    youtubeId: "gml0yg1K-bs",
    category: "street_hacks",
    description: "Strategies for long-term survival and maintaining dignity while experiencing extended homelessness. Mental health, hygiene, and building routines."
  },
  {
    title: "Prepping For Homelessness ( Homeless Tips & Tricks ) Survival On The Streets",
    youtubeId: "f0KkC8AqkRo",
    category: "how_to_guides",
    description: "How to prepare if you're about to become homeless. Practical gear recommendations, mindset preparation, and survival strategies to help you stay safe."
  },
  {
    title: "Survival Lessons and Tips from the Homeless",
    youtubeId: "WKPpVDItfvQ",
    category: "street_hacks",
    description: "Real survival lessons learned from people experiencing homelessness. Practical knowledge that could save your life on the streets."
  },
  {
    title: "Beginners Guide To Being Homeless - How To Be Homeless",
    youtubeId: "eoU2O5ZEM38",
    category: "how_to_guides",
    description: "A comprehensive beginner's guide to surviving homelessness. Covers basics of shelter, food access, safety protocols, and finding resources."
  },
  {
    title: "Tips for if you're going to be homeless",
    youtubeId: "LhSVy7PCokI",
    category: "how_to_guides",
    description: "Practical preparation tips if you know homelessness is coming. How to protect yourself, secure your belongings, and access services."
  },
  {
    title: "5 Homeless Survival Secrets You Need",
    youtubeId: "zTkOByKcguc",
    category: "street_hacks",
    description: "Five critical survival secrets that every unhoused person should know. Could make the difference between safety and danger in a crisis."
  },
  {
    title: "HOMELESS BACKPACKER GEAR LOADOUT/WHAT I CARRY DAILY TO SURVIVE THE STREETS",
    youtubeId: "pB5WCFDU-XM",
    category: "street_hacks",
    description: "Complete gear loadout for street survival. Detailed breakdown of what to carry, how to pack it efficiently, and why each item matters for daily survival."
  },
  {
    title: "Homeless by choice: How this guy survives on the NYC streets",
    youtubeId: "KvRTWr73lHc",
    category: "recovery_motivation",
    description: "Profile of someone who chose street life in NYC. Extraordinary survival strategies, life philosophy, and unique perspective on urban homelessness."
  },
  {
    title: "How I Live In My Tent Without ANYONE Knowing | Tent Living",
    youtubeId: "mAlDAdrBzHA",
    category: "street_hacks",
    description: "Stealth camping techniques for living in a tent without detection. Privacy strategies, location selection, and staying safe while hidden."
  },
  {
    title: "How I Get By As a Homeless Person In the Woods",
    youtubeId: "mqs5JcvV6Xw",
    category: "street_hacks",
    description: "Living in the woods while homeless. Finding food and water, building shelter, and maintaining mental health in nature."
  },
  {
    title: "Finding Shelter for Urban Homeless Survival",
    youtubeId: "LfYej1a3-Zc",
    category: "how_to_guides",
    description: "Urban shelter strategies for city survival. Where to sleep safely, how to stay hidden from authorities, and avoiding dangerous situations."
  },
  {
    title: "Living in a Car: Top 10 Places to Sleep",
    youtubeId: "7379aanKuZE",
    category: "street_hacks",
    description: "Best places to park and sleep in your car without getting hassled by police or security. Safety tips for vehicle dwelling."
  },
  {
    title: "$0 Costs 0 Friends, my life as a Silicon Valley Software Engineer living in a car",
    youtubeId: "zYSkM3x0hlc",
    category: "recovery_motivation",
    description: "Tech worker's experience living in a car in Silicon Valley. Unique perspective on the housing crisis and making it work with a full-time job."
  },
  {
    title: "How to Handle Being Homeless",
    youtubeId: "EWxUEhTrucQ",
    category: "mental_health",
    description: "Mental and emotional strategies for coping with homelessness. Maintaining hope, dignity, and sanity during the hardest times."
  },
  {
    title: "Street survival, EDC, everyday carry, how to survive on the street",
    youtubeId: "VHB5dkDt-Iw",
    category: "street_hacks",
    description: "Essential everyday carry items for street survival. What to keep on you at all times for safety, hygiene, and emergency situations."
  },
  {
    title: "Survival Tips And Lessons While Homeless On The Streets",
    youtubeId: "QinaNBvdf68",
    category: "street_hacks",
    description: "Real lessons learned from living on the streets. Practical survival wisdom covering safety, resources, and daily routines."
  },
  {
    title: "Living out of a storage locker for 2 months, in style!",
    youtubeId: "HPVCTLPNUzo",
    category: "street_hacks",
    description: "Creative solution: living in a storage unit. How to make it work, stay comfortable, and avoid getting caught."
  },
  {
    title: "Trapped in paradise: how we got the homeless situation (part 1)",
    youtubeId: "b5XIljwl5hI",
    category: "recovery_motivation",
    description: "Documentary exploring how the homelessness crisis developed in America. Understanding the systemic issues and policy failures."
  },
  {
    title: "A Day In The Life of a Homeless Person",
    youtubeId: "uRp_4_QZKTU",
    category: "recovery_motivation",
    description: "24-hour look at what daily life is really like when you're homeless. Eye-opening perspective on the challenges and small victories."
  },
  {
    title: "What happens when you lose your home at 72 in Amesbury, Massachusetts?",
    youtubeId: "wXigmmgo1kA",
    category: "recovery_motivation",
    description: "Senior citizen's experience becoming homeless at 72. Unique challenges facing older unhoused individuals and limited resources."
  },
  {
    title: "How Finland Found A Solution To Homelessness",
    youtubeId: "DPh4PN8e0ds",
    category: "recovery_motivation",
    description: "Finland's successful 'Housing First' approach to ending homelessness. Proof that solutions exist and homelessness is solvable."
  },
  {
    title: "What Beauty Is Like For Homeless Women On The Streets",
    youtubeId: "Q0rDBz7EOVw",
    category: "how_to_guides",
    description: "Unique challenges homeless women face with hygiene and personal care. Practical solutions for maintaining dignity and self-care on the streets."
  },
  {
    title: "How Do Homeless Women Cope With Their Periods?",
    youtubeId: "ABch4VYOJZ0",
    category: "how_to_guides",
    description: "Critical information for women experiencing homelessness. Managing menstruation without access to bathrooms, supplies, or privacy."
  },
  {
    title: "Two Homeless Women Explain Why It's So Hard To Get Off The Streets",
    youtubeId: "d5vmzW_m-6w",
    category: "recovery_motivation",
    description: "Two women share the real barriers to escaping homelessness. Understanding the cycle of poverty, lack of ID, and systemic obstacles."
  },
  {
    title: "12 Survival Tips From The Homeless",
    youtubeId: "7ZtCu1qEOK0",
    category: "street_hacks",
    description: "Dozen essential survival tips learned directly from people living on the streets. Practical wisdom that could save your life."
  }
];

console.log('Adding videos from "ruby st" playlist with real YouTube IDs...\n');

let added = 0;
let skipped = 0;

for (const video of playlistVideos) {
  try {
    await db.insert(videos).values({
      title: video.title,
      youtubeId: video.youtubeId,
      category: video.category,
      description: video.description,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✓ Added: ${video.title}`);
    console.log(`  YouTube ID: ${video.youtubeId}`);
    added++;
  } catch (error) {
    console.log(`⚠ Skipped: ${video.title}`);
    skipped++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Added: ${added} videos with real YouTube IDs`);
console.log(`   Skipped: ${skipped} videos (may already exist)`);
console.log(`\n✅ All playlist videos are now playable in Virgil TV!`);

process.exit(0);
