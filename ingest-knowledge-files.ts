import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { knowledgeDocuments, knowledgeChunks } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

// Simple text chunking function (splits by paragraphs/sentences)
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function categorizeByFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("dental")) return "health";
  if (lower.includes("parenting") || lower.includes("couples") || lower.includes("family")) return "family";
  if (lower.includes("aa") || lower.includes("na") || lower.includes("meeting") || lower.includes("recovery")) return "recovery";
  if (lower.includes("housing") || lower.includes("shelter")) return "housing";
  if (lower.includes("legal") || lower.includes("court")) return "legal";
  if (lower.includes("benefits") || lower.includes("snap") || lower.includes("calfresh")) return "benefits";
  if (lower.includes("employment") || lower.includes("job")) return "employment";
  return "general";
}

async function ingestKnowledgeFiles() {
  console.log("📚 Ingesting Knowledge Files into Database\n");

  const knowledgeDir = path.join(__dirname, "knowledge files");
  const files = fs.readdirSync(knowledgeDir);

  console.log(`Found ${files.length} files in knowledge directory\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of files) {
    try {
      const filePath = path.join(knowledgeDir, filename);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        console.log(`⏭️  Skipping directory: ${filename}\n`);
        skipped++;
        continue;
      }

      const fileType = path.extname(filename).toLowerCase();

      // Process .txt and .md files (PDFs need special handling)
      if (fileType !== ".txt" && fileType !== ".md") {
        console.log(`⏭️  Skipping non-text file: ${filename} (will process PDFs separately)\n`);
        skipped++;
        continue;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const category = categorizeByFilename(filename);
      const wordCount = content.split(/\s+/).length;

      // Extract title from first line or filename
      const title = content.split("\n")[0].trim() || filename.replace(/\.txt$/i, "");

      console.log(`📄 Processing: ${filename}`);
      console.log(`   Category: ${category} | Words: ${wordCount}`);

      // Insert document
      const docResult = await db.insert(knowledgeDocuments).values({
        title: title,
        filename: filename,
        filepath: filePath,
        fileType: fileType,
        category: category,
        summary: content.substring(0, 200) + "...",
        wordCount: wordCount,
        chunkCount: 0, // Will update after chunking
      }).returning({ id: knowledgeDocuments.id });

      const documentId = docResult[0].id;

      // Chunk the content
      const chunks = chunkText(content, 800);
      console.log(`   Creating ${chunks.length} chunks...`);

      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        await db.insert(knowledgeChunks).values({
          documentId: documentId,
          chunkIndex: i,
          content: chunks[i],
          embedding: null, // Embeddings can be added later with AI
          tokenCount: chunks[i].split(/\s+/).length,
        });
      }

      // Update chunk count
      await db.update(knowledgeDocuments)
        .set({ chunkCount: chunks.length })
        .where(eq(knowledgeDocuments.id, documentId));

      console.log(`✅ Imported: ${title}\n`);
      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${filename}\n`);
        skipped++;
      } else {
        console.error(`❌ Error processing ${filename}:`, error.message, "\n");
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Ingestion Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total files: ${files.length}`);
  console.log("\n✨ Knowledge ingestion complete!");
  console.log("\nℹ️  These documents are now searchable by the AI assistant.");
  console.log("   Users can ask questions and get answers from this knowledge base.");

  client.close();
}

ingestKnowledgeFiles();
