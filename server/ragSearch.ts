import { getDb } from "./db";
import { knowledgeChunks, knowledgeDocuments } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * Generate embedding vector for text using LLM
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Use LLM to generate embeddings
  // For now, we'll use a simple approach - in production you'd use a dedicated embedding model
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Generate a semantic embedding for the following text. Return only a JSON array of 384 numbers between -1 and 1.",
      },
      {
        role: "user",
        content: text.substring(0, 8000), // Limit text length
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "embedding",
        strict: true,
        schema: {
          type: "object",
          properties: {
            embedding: {
              type: "array",
              items: { type: "number" },
              description: "Array of 384 floating point numbers",
            },
          },
          required: ["embedding"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== "string") {
    throw new Error("Expected string content from LLM");
  }
  const result = JSON.parse(content);
  return result.embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SearchResult {
  chunkId: number;
  documentId: number;
  documentTitle: string;
  filename: string;
  category: string;
  content: string;
  similarity: number;
}

export function rankSearchResults(results: SearchResult[], limit: number = 5): SearchResult[] {
  return results
    .slice()
    .sort((a, b) => {
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }
      if (a.documentId !== b.documentId) {
        return a.documentId - b.documentId;
      }
      return a.chunkId - b.chunkId;
    })
    .slice(0, limit);
}

/**
 * Search knowledge base using semantic similarity
 */
export async function searchKnowledge(query: string, limit: number = 5): Promise<SearchResult[]> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Get all chunks with embeddings
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const chunks = await db
    .select({
      chunkId: knowledgeChunks.id,
      documentId: knowledgeChunks.documentId,
      content: knowledgeChunks.content,
      embedding: knowledgeChunks.embedding,
      documentTitle: knowledgeDocuments.title,
      filename: knowledgeDocuments.filename,
      category: knowledgeDocuments.category,
    })
    .from(knowledgeChunks)
    .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
    .where(sql`${knowledgeChunks.embedding} IS NOT NULL`);

  // Calculate similarity for each chunk
  const results: SearchResult[] = [];
  for (const chunk of chunks) {
    if (!chunk.embedding) continue;

    const chunkEmbedding = JSON.parse(chunk.embedding as string);
    const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

    results.push({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      filename: chunk.filename,
      category: chunk.category,
      content: chunk.content,
      similarity,
    });
  }

  // Deterministic ordering: similarity desc, then doc/chunk ids asc.
  return rankSearchResults(results, limit);
}

/**
 * Format search results for LLM context
 */
export function formatSearchResults(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      return `[Source ${index + 1}: ${result.documentTitle}]\n${result.content}\n`;
    })
    .join("\n---\n\n");
}

/**
 * Get citations from search results
 */
export function getCitations(results: SearchResult[]): Array<{
  title: string;
  filename: string;
  category: string;
}> {
  const seen = new Set<number>();
  const citations: Array<{ title: string; filename: string; category: string }> = [];

  for (const result of rankSearchResults(results, results.length)) {
    if (!seen.has(result.documentId)) {
      seen.add(result.documentId);
      citations.push({
        title: result.documentTitle,
        filename: result.filename,
        category: result.category,
      });
    }
  }

  return citations;
}
