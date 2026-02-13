import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { videos } from './drizzle/schema.ts';
import { like } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

// Check for one of the playlist videos
const result = await db.select().from(videos).where(like(videos.title, '%comfortable%'));

console.log(`Found ${result.length} videos matching "comfortable":`);
result.forEach(v => {
  console.log(`  Title: "${v.title}"`);
  console.log(`  YouTube ID: ${v.youtubeId}`);
  console.log(`  Category: ${v.category}\n`);
});

// Check total count
const all = await db.select().from(videos);
console.log(`\nTotal videos in database: ${all.length}`);

process.exit(0);
