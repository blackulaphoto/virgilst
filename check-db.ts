import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client, { schema });

async function checkDatabase() {
  console.log("Checking database contents...\n");

  // Check videos
  const videos = await db.select().from(schema.videos);
  console.log(`Videos: ${videos.length} rows`);
  if (videos.length > 0) {
    console.log(`  Sample: ${videos[0].title}`);
  }

  // Check resources
  const resources = await db.select().from(schema.resources);
  console.log(`Resources: ${resources.length} rows`);
  if (resources.length > 0) {
    console.log(`  Sample: ${resources[0].name}`);
  }

  // Check treatment centers
  const treatmentCenters = await db.select().from(schema.treatmentCenters);
  console.log(`Treatment Centers: ${treatmentCenters.length} rows`);
  if (treatmentCenters.length > 0) {
    console.log(`  Sample: ${treatmentCenters[0].name}`);
  }

  // Check articles (knowledge)
  const articles = await db.select().from(schema.articles);
  console.log(`Articles: ${articles.length} rows`);
  if (articles.length > 0) {
    console.log(`  Sample: ${articles[0].title}`);
  }

  // Check knowledge documents
  const knowledgeDocs = await db.select().from(schema.knowledgeDocuments);
  console.log(`Knowledge Documents: ${knowledgeDocs.length} rows`);
  if (knowledgeDocs.length > 0) {
    console.log(`  Sample: ${knowledgeDocs[0].title}`);
  }

  // Check knowledge chunks
  const knowledgeChunks = await db.select().from(schema.knowledgeChunks);
  console.log(`Knowledge Chunks: ${knowledgeChunks.length} rows`);

  // Check users
  const users = await db.select().from(schema.users);
  console.log(`Users: ${users.length} rows`);

  client.close();
}

checkDatabase().catch(console.error);
