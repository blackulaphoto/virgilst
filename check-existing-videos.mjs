import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { videos } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const allVideos = await db.select().from(videos);

console.log(`Total videos in database: ${allVideos.length}\n`);
console.log('Sample titles:');
allVideos.slice(0, 10).forEach((v, i) => {
  console.log(`${i + 1}. "${v.title}" (ID: ${v.youtubeId})`);
});

process.exit(0);
