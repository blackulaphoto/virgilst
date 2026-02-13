import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { videos } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

// Categorize based on video content
function categorizeVideo(title: string): string {
  const lower = title.toLowerCase();

  if (lower.includes("gear") || lower.includes("backpack") || lower.includes("edc") || lower.includes("carry")) {
    return "street_hacks";
  }
  if (lower.includes("women") || lower.includes("beauty") || lower.includes("period")) {
    return "women_specific";
  }
  if (lower.includes("shelter") || lower.includes("tent") || lower.includes("car") || lower.includes("storage") || lower.includes("sleep")) {
    return "shelter_survival";
  }
  if (lower.includes("tips") || lower.includes("advice") || lower.includes("lessons") || lower.includes("secrets")) {
    return "street_hacks";
  }
  if (lower.includes("guide") || lower.includes("beginners") || lower.includes("how to")) {
    return "how_to_guides";
  }
  if (lower.includes("documentary") || lower.includes("day in the life") || lower.includes("story")) {
    return "real_stories";
  }

  return "survival_basics";
}

const playlistVideos = [
  {
    title: "How to be comfortable when homeless- PART 1- Shelter",
    youtubeId: "CnzwvX4NgUU",
    duration: 528, // 8:48 in seconds
    thumbnailUrl: "https://i.ytimg.com/vi/CnzwvX4NgUU/hqdefault.jpg"
  },
  {
    title: "if your homeless or about to be watch this Tips and tricks!",
    youtubeId: "RKoqafP1StA",
    duration: 832, // 13:52
    thumbnailUrl: "https://i.ytimg.com/vi/RKoqafP1StA/hqdefault.jpg"
  },
  {
    title: "Long-Term Homeless Advice",
    youtubeId: "gml0yg1K-bs",
    duration: 859, // 14:19
    thumbnailUrl: "https://i.ytimg.com/vi/gml0yg1K-bs/hqdefault.jpg"
  },
  {
    title: "Prepping For Homelessness ( Homeless Tips & Tricks ) Survival On The Streets",
    youtubeId: "f0KkC8AqkRo",
    duration: 1091, // 18:11
    thumbnailUrl: "https://i.ytimg.com/vi/f0KkC8AqkRo/hqdefault.jpg"
  },
  {
    title: "Survival Lessons and Tips from the Homeless",
    youtubeId: "WKPpVDItfvQ",
    duration: 1061, // 17:41
    thumbnailUrl: "https://i.ytimg.com/vi/WKPpVDItfvQ/hqdefault.jpg"
  },
  {
    title: "Beginners Guide To Being Homeless - How To Be Homeless",
    youtubeId: "eoU2O5ZEM38",
    duration: 736, // 12:16
    thumbnailUrl: "https://i.ytimg.com/vi/eoU2O5ZEM38/hqdefault.jpg"
  },
  {
    title: "Tips for if you're going to be homeless",
    youtubeId: "LhSVy7PCokI",
    duration: 1265, // 21:05
    thumbnailUrl: "https://i.ytimg.com/vi/LhSVy7PCokI/hqdefault.jpg"
  },
  {
    title: "5 Homeless Survival Secrets You Need",
    youtubeId: "zTkOByKcguc",
    duration: 1035, // 17:15
    thumbnailUrl: "https://i.ytimg.com/vi/zTkOByKcguc/hqdefault.jpg"
  },
  {
    title: "HOMELESS BACKPACKER GEAR LOADOUT/WHAT I CARRY DAILY TO SURVIVE THE STREETS",
    youtubeId: "pB5WCFDU-XM",
    duration: 2167, // 36:07
    thumbnailUrl: "https://i.ytimg.com/vi/pB5WCFDU-XM/hqdefault.jpg"
  },
  {
    title: "Homeless by choice: How this guy survives on the NYC streets | Extraordinary People | New York Post",
    youtubeId: "KvRTWr73lHc",
    duration: 220, // 3:40
    thumbnailUrl: "https://i.ytimg.com/vi/KvRTWr73lHc/hqdefault.jpg"
  },
  {
    title: "How I Live In My Tent Without ANYONE Knowing | Tent Living",
    youtubeId: "mAlDAdrBzHA",
    duration: 346, // 5:46
    thumbnailUrl: "https://i.ytimg.com/vi/mAlDAdrBzHA/hqdefault.jpg"
  },
  {
    title: "How I Get By As a Homeless Person In the Woods",
    youtubeId: "mqs5JcvV6Xw",
    duration: 756, // 12:36
    thumbnailUrl: "https://i.ytimg.com/vi/mqs5JcvV6Xw/hqdefault.jpg"
  },
  {
    title: "Finding Shelter for Urban Homeless Survival",
    youtubeId: "LfYej1a3-Zc",
    duration: 565, // 9:25
    thumbnailUrl: "https://i.ytimg.com/vi/LfYej1a3-Zc/hqdefault.jpg"
  },
  {
    title: "Living in a Car: Top 10 Places to Sleep 😴 | Hobo Ahle",
    youtubeId: "7379aanKuZE",
    duration: 607, // 10:07
    thumbnailUrl: "https://i.ytimg.com/vi/7379aanKuZE/hqdefault.jpg"
  },
  {
    title: "$0 Costs 0 Friends, my life as a Silicon Valley Software Engineer living in a car | Hannah's Diaries",
    youtubeId: "zYSkM3x0hlc",
    duration: 386, // 6:26
    thumbnailUrl: "https://i.ytimg.com/vi/zYSkM3x0hlc/hqdefault.jpg"
  },
  {
    title: "How to Handle Being Homeless 🐺",
    youtubeId: "EWxUEhTrucQ",
    duration: 2225, // 37:05
    thumbnailUrl: "https://i.ytimg.com/vi/EWxUEhTrucQ/hqdefault.jpg"
  },
  {
    title: "Street survival, EDC, everyday carry , how to survive on the street.",
    youtubeId: "VHB5dkDt-Iw",
    duration: 1220, // 20:20
    thumbnailUrl: "https://i.ytimg.com/vi/VHB5dkDt-Iw/hqdefault.jpg"
  },
  {
    title: "Survival Tips And Lessons While Homeless On The Streets",
    youtubeId: "QinaNBvdf68",
    duration: 709, // 11:49
    thumbnailUrl: "https://i.ytimg.com/vi/QinaNBvdf68/hqdefault.jpg"
  },
  {
    title: "Living out of a storage locker for 2 months, in style!",
    youtubeId: "HPVCTLPNUzo",
    duration: 530, // 8:50
    thumbnailUrl: "https://i.ytimg.com/vi/HPVCTLPNUzo/hqdefault.jpg"
  },
  {
    title: "Trapped in paradise: how we got the homeless situation (part 1)",
    youtubeId: "b5XIljwl5hI",
    duration: 2115, // 35:15
    thumbnailUrl: "https://i.ytimg.com/vi/b5XIljwl5hI/hqdefault.jpg"
  },
  {
    title: "A Day In The Life of a Homeless Person",
    youtubeId: "uRp_4_QZKTU",
    duration: 415, // 6:55
    thumbnailUrl: "https://i.ytimg.com/vi/uRp_4_QZKTU/hqdefault.jpg"
  },
  {
    title: "What happens when you lose your home at 72 in Amesbury, Massachusetts?",
    youtubeId: "wXigmmgo1kA",
    duration: 403, // 6:43
    thumbnailUrl: "https://i.ytimg.com/vi/wXigmmgo1kA/hqdefault.jpg"
  },
  {
    title: "How Finland Found A Solution To Homelessness",
    youtubeId: "DPh4PN8e0ds",
    duration: 534, // 8:54
    thumbnailUrl: "https://i.ytimg.com/vi/DPh4PN8e0ds/hqdefault.jpg"
  },
  {
    title: "What Beauty Is Like For Homeless Women On The Streets | Shady | Refinery29",
    youtubeId: "Q0rDBz7EOVw",
    duration: 888, // 14:48
    thumbnailUrl: "https://i.ytimg.com/vi/Q0rDBz7EOVw/hqdefault.jpg"
  },
  {
    title: "How Do Homeless Women Cope With Their Periods? | Bustle",
    youtubeId: "ABch4VYOJZ0",
    duration: 404, // 6:44
    thumbnailUrl: "https://i.ytimg.com/vi/ABch4VYOJZ0/hqdefault.jpg"
  },
  {
    title: "Two Homeless Women Explain Why It's So Hard To Get Off The Streets",
    youtubeId: "d5vmzW_m-6w",
    duration: 208, // 3:28
    thumbnailUrl: "https://i.ytimg.com/vi/d5vmzW_m-6w/hqdefault.jpg"
  },
  {
    title: "12 Survival Tips From The Homeless",
    youtubeId: "7ZtCu1qEOK0",
    duration: 967, // 16:07
    thumbnailUrl: "https://i.ytimg.com/vi/7ZtCu1qEOK0/hqdefault.jpg"
  }
];

async function importVideos() {
  console.log("🎥 Importing Homeless Survival Videos\n");
  console.log(`Total videos to import: ${playlistVideos.length}\n`);

  let imported = 0;
  let skipped = 0;

  for (const video of playlistVideos) {
    try {
      const category = categorizeVideo(video.title);

      await db.insert(videos).values({
        title: video.title,
        youtubeId: video.youtubeId,
        category: category,
        duration: video.duration,
        thumbnailUrl: video.thumbnailUrl,
        description: `Homeless survival guide: ${video.title}`,
        viewCount: 0
      });

      console.log(`✅ ${video.title}`);
      console.log(`   Category: ${category} | Duration: ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}\n`);
      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${video.title}\n`);
        skipped++;
      } else {
        console.error(`❌ Error importing ${video.title}:`, error.message);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📦 Total: ${playlistVideos.length}`);
  console.log("\n✨ Video import complete!");

  client.close();
}

importVideos();
