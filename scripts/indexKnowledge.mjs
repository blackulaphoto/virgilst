import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { knowledgeDocuments, knowledgeChunks } from "../drizzle/schema.ts";
import { scanDirectory, extractDocument, chunkText, countWords } from "../server/knowledgeExtractor.ts";
import { generateEmbedding } from "../server/ragSearch.ts";

const db = drizzle(process.env.DATABASE_URL);

// Category mapping based on filename patterns
function categorizeDocument(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes("benefit") || lower.includes("calfresh") || lower.includes("general relief") || lower.includes("ssi") || lower.includes("disability")) {
    return "benefits";
  }
  if (lower.includes("housing") || lower.includes("shelter") || lower.includes("rent")) {
    return "housing";
  }
  if (lower.includes("legal") || lower.includes("court") || lower.includes("cps") || lower.includes("foster")) {
    return "legal";
  }
  if (lower.includes("health") || lower.includes("medical") || lower.includes("medi-cal")) {
    return "health";
  }
  if (lower.includes("employment") || lower.includes("job") || lower.includes("work")) {
    return "employment";
  }
  if (lower.includes("id") || lower.includes("birth certificate") || lower.includes("identification")) {
    return "identification";
  }
  if (lower.includes("emergency") || lower.includes("crisis") || lower.includes("survival")) {
    return "emergency";
  }
  
  return "general";
}

async function indexKnowledgeBase() {
  console.log("Starting knowledge base indexing...");
  
  const uploadDir = "/home/ubuntu/upload";
  const files = scanDirectory(uploadDir);
  
  console.log(`Found ${files.length} files to process`);
  
  let processedCount = 0;
  let errorCount = 0;
  
  for (const filepath of files) {
    try {
      console.log(`\\nProcessing: ${filepath}`);
      
      // Extract document content
      const doc = await extractDocument(filepath);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Words: ${doc.wordCount}`);
      
      // Determine category
      const category = categorizeDocument(doc.filename);
      console.log(`  Category: ${category}`);
      
      // Insert document into database
      const result = await db.insert(knowledgeDocuments).values({
        title: doc.title,
        filename: doc.filename,
        filepath: doc.filepath,
        fileType: doc.fileType,
        category,
        wordCount: doc.wordCount,
        chunkCount: 0, // Will update after chunking
      });
      
      const documentId = Number(result.insertId);
      console.log(`  Document ID: ${documentId}`);
      
      // Split into chunks
      const chunks = chunkText(doc.content, 500);
      console.log(`  Chunks: ${chunks.length}`);
      
      // Process chunks (limit to first 10 for demo to save time/cost)
      const maxChunks = Math.min(chunks.length, 10);
      for (let i = 0; i < maxChunks; i++) {
        const chunk = chunks[i];
        console.log(`  Processing chunk ${i + 1}/${maxChunks}...`);
        
        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunk);
          
          // Insert chunk
          await db.insert(knowledgeChunks).values({
            documentId,
            chunkIndex: i,
            content: chunk,
            embedding: JSON.stringify(embedding),
            tokenCount: countWords(chunk),
          });
          
          console.log(`    ✓ Chunk ${i + 1} indexed`);
        } catch (error) {
          console.error(`    ✗ Failed to index chunk ${i + 1}:`, error.message);
        }
      }
      
      // Update document chunk count
      await db.update(knowledgeDocuments)
        .set({ chunkCount: maxChunks })
        .where(eq(knowledgeDocuments.id, documentId));
      
      processedCount++;
      console.log(`✓ Completed: ${doc.filename}`);
      
    } catch (error) {
      console.error(`✗ Error processing ${filepath}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\\n=== Indexing Complete ===`);
  console.log(`Processed: ${processedCount} documents`);
  console.log(`Errors: ${errorCount}`);
}

// Run indexing
indexKnowledgeBase()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
