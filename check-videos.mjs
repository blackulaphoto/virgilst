import { drizzle } from "drizzle-orm/mysql2";
import { videos } from "./drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function checkVideos() {
  const result = await db.select().from(videos);
  console.log(`Total videos in database: ${result.length}`);
  
  if (result.length > 0) {
    console.log("\nSample videos:");
    result.slice(0, 3).forEach(v => {
      console.log(`- ${v.title} (${v.category})`);
    });
  }
  
  process.exit(0);
}

checkVideos().catch(console.error);
