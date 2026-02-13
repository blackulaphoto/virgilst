import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { videos } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

// Videos from the "ruby st" YouTube playlist
// Note: These use placeholder YouTube IDs - admin should update with real IDs through the dashboard
const playlistVideos = [
  {
    title: "How to be comfortable when homeless- PART 1- Shelter",
    youtubeId: "placeholder1",
    category: "How-To Guides",
    description: "Practical advice on finding and securing shelter when experiencing homelessness. Part 1 of a comprehensive survival series.",
    duration: "8:48"
  },
  {
    title: "if your homeless or about to be watch this Tips and tricks!",
    youtubeId: "placeholder2",
    category: "Street Hacks",
    description: "Essential tips and tricks for surviving on the streets. Real-world advice from someone who's been there.",
    duration: "13:52"
  },
  {
    title: "Long-Term Homeless Advice",
    youtubeId: "placeholder3",
    category: "Street Hacks",
    description: "Strategies for long-term survival and maintaining dignity while experiencing extended homelessness.",
    duration: "14:19"
  },
  {
    title: "Prepping For Homelessness ( Homeless Tips & Tricks ) Survival On The Streets",
    youtubeId: "placeholder4",
    category: "How-To Guides",
    description: "How to prepare if you're about to become homeless. Practical gear, mindset, and survival strategies.",
    duration: "18:11"
  },
  {
    title: "Survival Lessons and Tips from the Homeless",
    youtubeId: "placeholder5",
    category: "Street Hacks",
    description: "Real survival lessons learned from people experiencing homelessness. Practical knowledge that could save your life.",
    duration: "17:41"
  },
  {
    title: "Beginners Guide To Being Homeless - How To Be Homeless",
    youtubeId: "placeholder6",
    category: "How-To Guides",
    description: "A comprehensive beginner's guide to surviving homelessness. Covers basics of shelter, food, safety, and resources.",
    duration: "12:16"
  },
  {
    title: "Tips for if you're going to be homeless",
    youtubeId: "placeholder7",
    category: "How-To Guides",
    description: "Practical preparation tips if you know homelessness is coming. How to protect yourself and your belongings.",
    duration: "21:05"
  },
  {
    title: "5 Homeless Survival Secrets You Need",
    youtubeId: "placeholder8",
    category: "Street Hacks",
    description: "Five critical survival secrets that every unhoused person should know. Could make the difference in a crisis.",
    duration: "17:15"
  },
  {
    title: "HOMELESS BACKPACKER GEAR LOADOUT/WHAT I CARRY DAILY TO SURVIVE THE STREETS",
    youtubeId: "placeholder9",
    category: "Street Hacks",
    description: "Complete gear loadout for street survival. What to carry, how to pack it, and why each item matters.",
    duration: "36:07"
  },
  {
    title: "Homeless by choice: How this guy survives on the NYC streets",
    youtubeId: "placeholder10",
    category: "Recovery & Motivation",
    description: "Profile of someone who chose street life in NYC. Extraordinary survival strategies and life philosophy.",
    duration: "3:40"
  },
  {
    title: "How I Live In My Tent Without ANYONE Knowing | Tent Living",
    youtubeId: "placeholder11",
    category: "Street Hacks",
    description: "Stealth camping techniques for living in a tent without detection. Privacy and safety strategies.",
    duration: "5:46"
  },
  {
    title: "How I Get By As a Homeless Person In the Woods",
    youtubeId: "placeholder12",
    category: "Street Hacks",
    description: "Living in the woods while homeless. Finding food, water, shelter, and maintaining sanity in nature.",
    duration: "12:36"
  },
  {
    title: "Finding Shelter for Urban Homeless Survival",
    youtubeId: "placeholder13",
    category: "How-To Guides",
    description: "Urban shelter strategies for city survival. Where to sleep safely, how to stay hidden, and avoiding trouble.",
    duration: "9:25"
  },
  {
    title: "Living in a Car: Top 10 Places to Sleep",
    youtubeId: "placeholder14",
    category: "Street Hacks",
    description: "Best places to park and sleep in your car without getting hassled. Safety tips for vehicle dwelling.",
    duration: "10:07"
  },
  {
    title: "$0 Costs 0 Friends, my life as a Silicon Valley Software Engineer living in a car",
    youtubeId: "placeholder15",
    category: "Recovery & Motivation",
    description: "Tech worker's experience living in a car in Silicon Valley. Unique perspective on housing crisis.",
    duration: "6:26"
  },
  {
    title: "How to Handle Being Homeless",
    youtubeId: "placeholder16",
    category: "Mental Health",
    description: "Mental and emotional strategies for coping with homelessness. Maintaining hope and dignity.",
    duration: "37:05"
  },
  {
    title: "Street survival, EDC, everyday carry, how to survive on the street",
    youtubeId: "placeholder17",
    category: "Street Hacks",
    description: "Essential everyday carry items for street survival. What to keep on you at all times.",
    duration: "Unknown"
  },
  {
    title: "Survival Tips And Lessons While Homeless On The Streets",
    youtubeId: "placeholder18",
    category: "Street Hacks",
    description: "Real lessons learned from living on the streets. Practical survival wisdom.",
    duration: "Unknown"
  },
  {
    title: "Living out of a storage locker for 2 months, in style!",
    youtubeId: "placeholder19",
    category: "Street Hacks",
    description: "Creative solution: living in a storage unit. How to make it work and stay comfortable.",
    duration: "Unknown"
  },
  {
    title: "Trapped in paradise: how we got the homeless situation (part 1)",
    youtubeId: "placeholder20",
    category: "Recovery & Motivation",
    description: "Documentary exploring how the homelessness crisis developed. Understanding the system.",
    duration: "Unknown"
  },
  {
    title: "A Day In The Life of a Homeless Person",
    youtubeId: "placeholder21",
    category: "Recovery & Motivation",
    description: "24-hour look at what daily life is really like when you're homeless. Eye-opening perspective.",
    duration: "Unknown"
  },
  {
    title: "What happens when you lose your home at 72 in Amesbury, Massachusetts?",
    youtubeId: "placeholder22",
    category: "Recovery & Motivation",
    description: "Senior citizen's experience becoming homeless at 72. Challenges facing older unhoused individuals.",
    duration: "Unknown"
  },
  {
    title: "How Finland Found A Solution To Homelessness",
    youtubeId: "placeholder23",
    category: "Recovery & Motivation",
    description: "Finland's successful approach to ending homelessness. Proof that solutions exist.",
    duration: "Unknown"
  },
  {
    title: "What Beauty Is Like For Homeless Women On The Streets",
    youtubeId: "placeholder24",
    category: "How-To Guides",
    description: "Unique challenges homeless women face with hygiene and personal care. Practical solutions.",
    duration: "Unknown"
  },
  {
    title: "How Do Homeless Women Cope With Their Periods?",
    youtubeId: "placeholder25",
    category: "How-To Guides",
    description: "Critical information for women experiencing homelessness. Managing menstruation without resources.",
    duration: "Unknown"
  },
  {
    title: "Two Homeless Women Explain Why It's So Hard To Get Off The Streets",
    youtubeId: "placeholder26",
    category: "Recovery & Motivation",
    description: "Two women share the real barriers to escaping homelessness. Understanding the cycle.",
    duration: "Unknown"
  },
  {
    title: "12 Survival Tips From The Homeless",
    youtubeId: "placeholder27",
    category: "Street Hacks",
    description: "Dozen essential survival tips learned from people living on the streets. Practical wisdom.",
    duration: "Unknown"
  }
];

console.log('Importing videos from "ruby st" YouTube playlist...\n');

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
    added++;
  } catch (error) {
    console.log(`⚠ Skipped: ${video.title} (may already exist)`);
    skipped++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Added: ${added} videos`);
console.log(`   Skipped: ${skipped} videos`);
console.log(`\n⚠️  NOTE: These videos use placeholder YouTube IDs.`);
console.log(`   Admin should update with real video IDs through the dashboard at /admin`);
console.log(`   Or provide the actual video IDs to replace placeholders.`);
console.log(`\nPlaylist import complete!`);

process.exit(0);
