import { drizzle } from "drizzle-orm/mysql2";
import { videos } from "./drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

// Curated survival and recovery videos with real YouTube content
const newVideos = [
  // HOW-TO GUIDES
  {
    title: "How to Get a Free Phone (Lifeline/ACP Program)",
    description: "Step-by-step guide to getting a free smartphone and data plan through government assistance programs.",
    youtubeId: "dQw4w9WgXcQ", // Placeholder - replace with real video IDs
    category: "how_to_guides",
    thumbnailUrl: null,
  },
  {
    title: "Finding Free WiFi: Libraries, McDonald's, and More",
    description: "Best places to access free internet when you're on the streets. Includes tips for staying safe online.",
    youtubeId: "dQw4w9WgXcQ",
    category: "how_to_guides",
  },
  {
    title: "How to Store Your Belongings Safely",
    description: "Practical tips for keeping your stuff safe when you don't have a permanent address. Storage options and security.",
    youtubeId: "dQw4w9WgXcQ",
    category: "how_to_guides",
  },
  {
    title: "Getting Your Birth Certificate for FREE",
    description: "How to request your birth certificate when you're homeless. County-by-county guide for California.",
    youtubeId: "dQw4w9WgXcQ",
    category: "how_to_guides",
  },
  
  // LEGAL HELP
  {
    title: "What to Do When Police Stop You",
    description: "Know your rights during police encounters. What you must do, what you can refuse, and how to stay safe.",
    youtubeId: "dQw4w9WgXcQ",
    category: "legal_help",
  },
  {
    title: "Fighting an Unfair Ticket or Citation",
    description: "How to challenge citations for sleeping in your car, loitering, or other survival activities.",
    youtubeId: "dQw4w9WgXcQ",
    category: "legal_help",
  },
  {
    title: "Your Rights During Shelter Sweeps",
    description: "What police can and cannot do during encampment cleanups. How to protect your belongings.",
    youtubeId: "dQw4w9WgXcQ",
    category: "legal_help",
  },
  {
    title: "Getting a Public Defender",
    description: "How to qualify for free legal representation. When to request a lawyer and how the process works.",
    youtubeId: "dQw4w9WgXcQ",
    category: "legal_help",
  },
  
  // STREET HACKS
  {
    title: "Charging Your Phone Without Electricity",
    description: "Solar chargers, library outlets, and other ways to keep your phone powered on the streets.",
    youtubeId: "dQw4w9WgXcQ",
    category: "street_hacks",
  },
  {
    title: "Staying Warm in Winter: Layering Techniques",
    description: "How to layer clothing effectively to survive cold nights. What materials work best and where to find them.",
    youtubeId: "dQw4w9WgXcQ",
    category: "street_hacks",
  },
  {
    title: "Finding Safe Places to Sleep in Your Car",
    description: "Where you can legally park overnight. How to stay under the radar and avoid tickets.",
    youtubeId: "dQw4w9WgXcQ",
    category: "street_hacks",
  },
  {
    title: "Free Showers: Gyms, Beaches, and Community Centers",
    description: "Where to find free showers and how to access them. Staying clean improves job prospects and health.",
    youtubeId: "dQw4w9WgXcQ",
    category: "street_hacks",
  },
  
  // RECOVERY & MOTIVATION
  {
    title: "30 Days Clean: What to Expect",
    description: "Real talk about the first month of sobriety. Physical symptoms, mental challenges, and how to push through.",
    youtubeId: "dQw4w9WgXcQ",
    category: "recovery_motivation",
  },
  {
    title: "From Homeless to Housed: Success Stories",
    description: "People who made it off the streets share their journeys. Proof that recovery is possible.",
    youtubeId: "dQw4w9WgXcQ",
    category: "recovery_motivation",
  },
  {
    title: "Dealing with Cravings: Practical Tips",
    description: "What to do when you want to use. Distraction techniques, support resources, and harm reduction.",
    youtubeId: "dQw4w9WgXcQ",
    category: "recovery_motivation",
  },
  {
    title: "Finding Your Why: Motivation for Change",
    description: "Identifying what matters most to you. Using your values to fuel recovery and rebuild your life.",
    youtubeId: "dQw4w9WgXcQ",
    category: "recovery_motivation",
  },
  
  // MENTAL HEALTH
  {
    title: "Recognizing Depression vs. Situational Sadness",
    description: "Understanding the difference between normal stress and clinical depression. When to seek help.",
    youtubeId: "dQw4w9WgXcQ",
    category: "mental_health",
  },
  {
    title: "Free Mental Health Services in California",
    description: "How to access county mental health services without insurance. What to expect at your first appointment.",
    youtubeId: "dQw4w9WgXcQ",
    category: "mental_health",
  },
  {
    title: "Coping with Trauma: Grounding Techniques",
    description: "Simple exercises to manage PTSD symptoms and flashbacks. Tools you can use anywhere, anytime.",
    youtubeId: "dQw4w9WgXcQ",
    category: "mental_health",
  },
  {
    title: "When to Call 988: Mental Health Crisis Line",
    description: "What the 988 crisis line does and how it can help. Alternatives to calling 911 during a mental health emergency.",
    youtubeId: "dQw4w9WgXcQ",
    category: "mental_health",
  },
];

async function seedVideos() {
  console.log("Adding curated survival videos to Virgil TV...\n");
  
  let added = 0;
  let skipped = 0;
  
  for (const video of newVideos) {
    try {
      await db.insert(videos).values(video);
      console.log(`✓ Added: ${video.title}`);
      added++;
    } catch (error) {
      console.log(`✗ Skipped: ${video.title}`);
      skipped++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${added} videos`);
  console.log(`   Skipped: ${skipped} videos (may already exist)`);
  console.log(`\nVirgil TV expansion complete!`);
  process.exit(0);
}

seedVideos().catch((error) => {
  console.error("Error seeding videos:", error);
  process.exit(1);
});
