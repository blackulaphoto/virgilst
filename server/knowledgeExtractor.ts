import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ExtractedDocument {
  filename: string;
  filepath: string;
  title: string;
  content: string;
  fileType: "pdf" | "markdown" | "text";
  wordCount: number;
}

/**
 * Extract text content from PDF file using pdftotext (pre-installed in sandbox)
 */
export async function extractPDF(filepath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`pdftotext "${filepath}" -`);
    return stdout;
  } catch (error) {
    throw new Error(`Failed to extract PDF: ${error}`);
  }
}

/**
 * Extract text content from markdown or text file
 */
export function extractText(filepath: string): string {
  return fs.readFileSync(filepath, "utf-8");
}

/**
 * Determine file type from extension
 */
export function getFileType(filename: string): "pdf" | "markdown" | "text" | null {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".md" || ext === ".markdown") return "markdown";
  if (ext === ".txt") return "text";
  return null;
}

/**
 * Generate title from filename
 */
export function generateTitle(filename: string): string {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  // Clean up common patterns
  return nameWithoutExt
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Split text into chunks for embedding
 * Each chunk should be ~500-1000 tokens (roughly 375-750 words)
 */
export function chunkText(text: string, maxWords: number = 500): string[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  
  const chunks: string[] = [];
  let currentChunk = "";
  let currentWordCount = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);
    
    // If adding this paragraph would exceed max, save current chunk
    if (currentWordCount + paragraphWords > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
      currentWordCount = paragraphWords;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      currentWordCount += paragraphWords;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Extract document from file
 */
export async function extractDocument(filepath: string): Promise<ExtractedDocument> {
  const filename = path.basename(filepath);
  const fileType = getFileType(filename);
  
  if (!fileType) {
    throw new Error(`Unsupported file type: ${filename}`);
  }
  
  let content: string;
  if (fileType === "pdf") {
    content = await extractPDF(filepath);
  } else {
    content = extractText(filepath);
  }
  
  const title = generateTitle(filename);
  const wordCount = countWords(content);
  
  return {
    filename,
    filepath,
    title,
    content,
    fileType,
    wordCount,
  };
}

/**
 * Scan directory for processable documents
 */
export function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];
  
  function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        const fileType = getFileType(entry.name);
        if (fileType) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scan(dirPath);
  return files;
}
