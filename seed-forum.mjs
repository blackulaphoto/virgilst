import { drizzle } from "drizzle-orm/mysql2";
import { forumPosts, forumReplies } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seedForum() {
  console.log("Seeding forum data...");

  // Sample forum posts
  const samplePosts = [
    {
      title: "Best places to charge your phone in downtown LA?",
      content: "Looking for safe spots with outlets where I can charge my phone during the day. Libraries close too early. Any suggestions?",
      category: "survival_tips",
      authorId: 1,
      isAnonymous: false,
      upvotes: 12,
      viewCount: 45,
      replyCount: 0,
    },
    {
      title: "Shelter on 5th St - My Experience",
      content: "Stayed at the shelter on 5th St last week. Staff was respectful, beds were clean, but they have a strict 6pm check-in. If you're late, you lose your spot. Also, they don't allow pets which was hard for me.",
      category: "shelter_reviews",
      authorId: 1,
      isAnonymous: true,
      upvotes: 8,
      viewCount: 67,
      replyCount: 0,
    },
    {
      title: "How do I appeal a GR denial?",
      content: "Got denied for General Relief because they said I didn't provide enough proof of residency. I gave them a letter from the shelter. What else can I do? Has anyone successfully appealed?",
      category: "legal_help",
      authorId: 1,
      isAnonymous: false,
      upvotes: 15,
      viewCount: 89,
      replyCount: 0,
    },
    {
      title: "Feeling hopeless today",
      content: "Just need to vent. Been trying to get housing for 6 months. Every time I get close, something falls through. I'm tired. Anyone else going through this?",
      category: "emotional_support",
      authorId: 1,
      isAnonymous: true,
      upvotes: 23,
      viewCount: 102,
      replyCount: 0,
    },
  ];

  for (const post of samplePosts) {
    const result = await db.insert(forumPosts).values(post);
    console.log(`Created post: ${post.title}`);
    console.log('Result:', result);
    
    // Add some sample replies to the first post
    if (post.title.includes("charge your phone")) {
      // Get the last inserted ID from the result
      const postId = result[0].insertId;
      
      await db.insert(forumReplies).values({
        postId,
        content: "Public library on Grand Ave has outlets and wifi. Just be respectful and they won't bother you.",
        authorId: 1,
        isAnonymous: false,
        upvotes: 5,
      });
      
      await db.insert(forumReplies).values({
        postId,
        content: "Starbucks usually lets you sit for a while if you buy something small. The one on Spring St is pretty chill.",
        authorId: 1,
        isAnonymous: true,
        upvotes: 3,
      });
      
      // Update reply count
      await db.update(forumPosts).set({ replyCount: 2 }).where({ id: postId });
    }
  }

  console.log("✅ Forum data seeded successfully!");
}

seedForum().catch(console.error);
