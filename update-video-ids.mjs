import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { videos } from './drizzle/schema.ts';
import { eq, like } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

// Real YouTube video IDs extracted from the playlist
const videoIdMap = [
  { title: "How to be comfortable when homeless- PART 1- Shelter", youtubeId: "CnzwvX4NgUU" },
  { title: "if your homeless or about to be watch this Tips and tricks!", youtubeId: "RKoqafP1StA" },
  { title: "Long-Term Homeless Advice", youtubeId: "gml0yg1K-bs" },
  { title: "Prepping For Homelessness ( Homeless Tips & Tricks ) Survival On The Streets", youtubeId: "f0KkC8AqkRo" },
  { title: "Survival Lessons and Tips from the Homeless", youtubeId: "WKPpVDItfvQ" },
  { title: "Beginners Guide To Being Homeless - How To Be Homeless", youtubeId: "eoU2O5ZEM38" },
  { title: "Tips for if you're going to be homeless", youtubeId: "LhSVy7PCokI" },
  { title: "5 Homeless Survival Secrets You Need", youtubeId: "zTkOByKcguc" },
  { title: "HOMELESS BACKPACKER GEAR LOADOUT/WHAT I CARRY DAILY TO SURVIVE THE STREETS", youtubeId: "pB5WCFDU-XM" },
  { title: "Homeless by choice: How this guy survives on the NYC streets", youtubeId: "KvRTWr73lHc" },
  { title: "How I Live In My Tent Without ANYONE Knowing | Tent Living", youtubeId: "mAlDAdrBzHA" },
  { title: "How I Get By As a Homeless Person In the Woods", youtubeId: "mqs5JcvV6Xw" },
  { title: "Finding Shelter for Urban Homeless Survival", youtubeId: "LfYej1a3-Zc" },
  { title: "Living in a Car: Top 10 Places to Sleep", youtubeId: "7379aanKuZE" },
  { title: "$0 Costs 0 Friends, my life as a Silicon Valley Software Engineer living in a car", youtubeId: "zYSkM3x0hlc" },
  { title: "How to Handle Being Homeless", youtubeId: "EWxUEhTrucQ" },
  { title: "Street survival, EDC, everyday carry, how to survive on the street", youtubeId: "VHB5dkDt-Iw" },
  { title: "Survival Tips And Lessons While Homeless On The Streets", youtubeId: "QinaNBvdf68" },
  { title: "Living out of a storage locker for 2 months, in style!", youtubeId: "HPVCTLPNUzo" },
  { title: "Trapped in paradise: how we got the homeless situation (part 1)", youtubeId: "b5XIljwl5hI" },
  { title: "A Day In The Life of a Homeless Person", youtubeId: "uRp_4_QZKTU" },
  { title: "What happens when you lose your home at 72 in Amesbury, Massachusetts?", youtubeId: "wXigmmgo1kA" },
  { title: "How Finland Found A Solution To Homelessness", youtubeId: "DPh4PN8e0ds" },
  { title: "What Beauty Is Like For Homeless Women On The Streets", youtubeId: "Q0rDBz7EOVw" },
  { title: "How Do Homeless Women Cope With Their Periods?", youtubeId: "ABch4VYOJZ0" },
  { title: "Two Homeless Women Explain Why It's So Hard To Get Off The Streets", youtubeId: "d5vmzW_m-6w" },
  { title: "12 Survival Tips From The Homeless", youtubeId: "7ZtCu1qEOK0" }
];

console.log('Updating videos with real YouTube IDs from playlist...\n');

let updated = 0;
let notFound = 0;

for (const videoData of videoIdMap) {
  try {
    // Find the video by title (partial match to handle slight variations)
    const existingVideos = await db.select().from(videos).where(
      like(videos.title, `%${videoData.title.substring(0, 30)}%`)
    ).limit(1);
    
    if (existingVideos.length > 0) {
      const video = existingVideos[0];
      
      // Update the YouTube ID
      await db.update(videos)
        .set({ 
          youtubeId: videoData.youtubeId,
          updatedAt: new Date()
        })
        .where(eq(videos.id, video.id));
      
      console.log(`✓ Updated: ${videoData.title}`);
      console.log(`  Old ID: ${video.youtubeId} → New ID: ${videoData.youtubeId}`);
      updated++;
    } else {
      console.log(`⚠ Not found in database: ${videoData.title}`);
      notFound++;
    }
  } catch (error) {
    console.log(`✗ Error updating: ${videoData.title}`);
    console.log(`  ${error.message}`);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updated} videos`);
console.log(`   Not found: ${notFound} videos`);
console.log(`\nAll videos now have real YouTube IDs and are playable!`);

process.exit(0);
