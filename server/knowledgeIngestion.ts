import { eq } from "drizzle-orm";
import { createRequire } from "module";
import { knowledgeChunks, knowledgeDocuments } from "../drizzle/schema";
import { getDb } from "./db";
import { chunkText, countWords, generateTitle } from "./knowledgeExtractor";
import { generateEmbedding } from "./ragSearch";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;

export const MAX_KNOWLEDGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/markdown",
  "text/plain",
]);

type KnowledgeFileType = "pdf" | "markdown" | "text";
type KnowledgeCategory =
  | "benefits"
  | "housing"
  | "legal"
  | "health"
  | "employment"
  | "identification"
  | "emergency"
  | "general";

export interface KnowledgeUploadInput {
  filename: string;
  mimeType: string;
  base64Data: string;
  category?: KnowledgeCategory;
}

export interface KnowledgeUploadResult {
  documentId: number;
  title: string;
  chunkCount: number;
  wordCount: number;
  chunksWithoutEmbeddings: number;
}

export function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}

export function isAllowedKnowledgeMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeType(mimeType);
  return ALLOWED_MIME_TYPES.has(normalized);
}

export function detectKnowledgeFileType(mimeType: string): KnowledgeFileType {
  const normalized = normalizeMimeType(mimeType);
  if (normalized === "application/pdf") return "pdf";
  if (normalized === "text/markdown") return "markdown";
  return "text";
}

export function categorizeKnowledgeFilename(filename: string): KnowledgeCategory {
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

export async function extractUploadContent(buffer: Buffer, fileType: KnowledgeFileType): Promise<string> {
  if (fileType === "pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }
  return buffer.toString("utf-8");
}

export async function ingestKnowledgeUpload(input: KnowledgeUploadInput): Promise<KnowledgeUploadResult> {
  if (!input.filename.trim()) {
    throw new Error("filename is required");
  }

  if (!isAllowedKnowledgeMimeType(input.mimeType)) {
    throw new Error(`Unsupported file type '${input.mimeType}'. Allowed types: application/pdf, text/markdown, text/plain`);
  }

  const buffer = Buffer.from(input.base64Data, "base64");
  if (buffer.length === 0) {
    throw new Error("Uploaded file was empty or invalid base64 data");
  }
  if (buffer.length > MAX_KNOWLEDGE_UPLOAD_BYTES) {
    throw new Error(`File too large (${buffer.length} bytes). Max allowed: ${MAX_KNOWLEDGE_UPLOAD_BYTES} bytes`);
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available for knowledge ingestion");
  }

  const fileType = detectKnowledgeFileType(input.mimeType);
  const content = await extractUploadContent(buffer, fileType);
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error("No extractable text content found in upload");
  }

  const title = generateTitle(input.filename);
  const chunks = chunkText(trimmedContent, 500);
  const category = input.category ?? categorizeKnowledgeFilename(input.filename);

  const insertResult = await db.insert(knowledgeDocuments).values({
    title,
    filename: input.filename,
    filepath: `uploaded://${input.filename}`,
    fileType,
    category,
    summary: trimmedContent.slice(0, 500),
    wordCount: countWords(trimmedContent),
    chunkCount: 0,
  });
  const documentId = Number(insertResult[0].insertId);

  let chunksWithoutEmbeddings = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let embedding: string | null = null;
    try {
      const vector = await generateEmbedding(chunk);
      embedding = JSON.stringify(vector);
    } catch (error) {
      chunksWithoutEmbeddings++;
      console.error("[KnowledgeUpload] Failed to generate embedding", {
        filename: input.filename,
        chunkIndex: i,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await db.insert(knowledgeChunks).values({
      documentId,
      chunkIndex: i,
      content: chunk,
      embedding,
      tokenCount: countWords(chunk),
    });
  }

  await db
    .update(knowledgeDocuments)
    .set({ chunkCount: chunks.length })
    .where(eq(knowledgeDocuments.id, documentId));

  return {
    documentId,
    title,
    chunkCount: chunks.length,
    wordCount: countWords(trimmedContent),
    chunksWithoutEmbeddings,
  };
}
