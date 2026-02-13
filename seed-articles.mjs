import { drizzle } from "drizzle-orm/mysql2";
import { articles } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const newArticles = [
  {
    title: "Emergency Shelter Tonight - LA County Quick Start",
    slug: "emergency-shelter-tonight-la",
    category: "Housing",
    content: "# Emergency Shelter Tonight\n\nCall 211 now for emergency shelter...",
    excerpt: "Need shelter tonight? Call 211 right now.",
    authorId: 1,
    published: true,
    featured: true,
  },
];

console.log("Adding articles...");
for (const article of newArticles) {
  await db.insert(articles).values(article);
  console.log("Added:", article.title);
}
console.log("Done!");
process.exit(0);
