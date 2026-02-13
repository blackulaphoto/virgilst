import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { knowledgeChunks, knowledgeDocuments } from "../../drizzle/schema";
import { getDb } from "../db";
import { scanDirectory, extractDocument, chunkText, countWords } from "../knowledgeExtractor";
import { generateEmbedding } from "../ragSearch";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(__dirname, "../../.env") });

interface IndexStats {
  filesProcessed: number;
  filesSkipped: number;
  filesFailed: number;
  chunksCreated: number;
  embeddingsFailed: number;
}

/**
 * Categorize document based on filename and content
 */
function categorizeDocument(filename: string, content: string): string {
  const lower = filename.toLowerCase() + " " + content.toLowerCase().substring(0, 500);

  if (lower.includes("benefit") || lower.includes("calfresh") || lower.includes("general relief") || lower.includes("ssi") || lower.includes("disability")) {
    return "benefits";
  }
  if (lower.includes("housing") || lower.includes("shelter") || lower.includes("rent") || lower.includes("sleep")) {
    return "housing";
  }
  if (lower.includes("legal") || lower.includes("court") || lower.includes("cps") || lower.includes("foster")) {
    return "legal";
  }
  if (lower.includes("health") || lower.includes("medical") || lower.includes("medi-cal")) {
    return "health";
  }
  if (lower.includes("employment") || lower.includes("job") || lower.includes("work") || lower.includes("career")) {
    return "employment";
  }
  if (lower.includes("id") || lower.includes("birth certificate") || lower.includes("identification")) {
    return "identification";
  }
  if (lower.includes("emergency") || lower.includes("crisis") || lower.includes("survival") || lower.includes("24")) {
    return "emergency";
  }
  if (lower.includes("treatment") || lower.includes("substance") || lower.includes("recovery") || lower.includes("sober") || lower.includes("aa") || lower.includes("detox")) {
    return "treatment";
  }

  return "general";
}

/**
 * Index a single document into the knowledge base
 */
async function indexDocument(filepath: string, db: any): Promise<{ chunks: number; embeddingsFailed: number }> {
  console.log(`\n📄 Processing: ${path.basename(filepath)}`);

  // Check if document already exists
  const filename = path.basename(filepath);
  const existing = await db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.filename, filename))
    .limit(1);

  if (existing.length > 0) {
    console.log(`   ⏭️  Already indexed, skipping...`);
    return { chunks: 0, embeddingsFailed: 0 };
  }

  // Extract document content
  const doc = await extractDocument(filepath);

  if (doc.wordCount < 50) {
    console.log(`   ⚠️  Too short (${doc.wordCount} words), skipping...`);
    throw new Error("Document too short");
  }

  console.log(`   📝 Extracted ${doc.wordCount} words`);

  // Chunk the content
  const chunks = chunkText(doc.content, 500);
  console.log(`   ✂️  Created ${chunks.length} chunks`);

  // Determine category
  const category = categorizeDocument(doc.filename, doc.content);
  console.log(`   🏷️  Category: ${category}`);

  // Insert document record
  const insertResult = await db.insert(knowledgeDocuments).values({
    title: doc.title,
    filename: doc.filename,
    filepath: doc.filepath,
    fileType: doc.fileType,
    category,
    summary: doc.content.substring(0, 500).trim(),
    wordCount: doc.wordCount,
    chunkCount: chunks.length,
  });

  const documentId = Number(insertResult[0].insertId);
  console.log(`   💾 Saved document ID: ${documentId}`);

  // Insert chunks with embeddings
  let embeddingsFailed = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let embedding: string | null = null;

    try {
      const vector = await generateEmbedding(chunk);
      embedding = JSON.stringify(vector);
      process.stdout.write(`   🔢 Embedding ${i + 1}/${chunks.length}\r`);
    } catch (error) {
      embeddingsFailed++;
      console.log(`   ⚠️  Embedding ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    await db.insert(knowledgeChunks).values({
      documentId,
      chunkIndex: i,
      content: chunk,
      embedding,
      tokenCount: countWords(chunk),
    });
  }

  console.log(`   ✅ Indexed ${chunks.length} chunks (${embeddingsFailed} embeddings failed)`);

  return { chunks: chunks.length, embeddingsFailed };
}

/**
 * Main indexing function
 */
async function indexAllKnowledge() {
  console.log("🚀 Starting Knowledge Base Indexing\n");
  console.log("=" .repeat(60));

  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  // Scan knowledge_files directory
  const knowledgeDir = path.resolve(__dirname, "../../knowledge_files");
  console.log(`📂 Scanning directory: ${knowledgeDir}\n`);

  const files = scanDirectory(knowledgeDir);
  console.log(`📚 Found ${files.length} knowledge files\n`);
  console.log("=" .repeat(60));

  const stats: IndexStats = {
    filesProcessed: 0,
    filesSkipped: 0,
    filesFailed: 0,
    chunksCreated: 0,
    embeddingsFailed: 0,
  };

  // Process each file
  for (const filepath of files) {
    try {
      const result = await indexDocument(filepath, db);

      if (result.chunks === 0) {
        stats.filesSkipped++;
      } else {
        stats.filesProcessed++;
        stats.chunksCreated += result.chunks;
        stats.embeddingsFailed += result.embeddingsFailed;
      }
    } catch (error) {
      stats.filesFailed++;
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Print summary
  console.log("\n" + "=" .repeat(60));
  console.log("\n📊 Indexing Summary:");
  console.log(`   ✅ Files processed: ${stats.filesProcessed}`);
  console.log(`   ⏭️  Files skipped (already indexed): ${stats.filesSkipped}`);
  console.log(`   ❌ Files failed: ${stats.filesFailed}`);
  console.log(`   📦 Total chunks created: ${stats.chunksCreated}`);
  console.log(`   ⚠️  Embeddings failed: ${stats.embeddingsFailed}`);
  console.log("\n✨ Indexing complete!");

  process.exit(0);
}

// Run indexing
indexAllKnowledge().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
