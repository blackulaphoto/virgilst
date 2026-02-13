import { describe, it, expect, beforeAll } from "vitest";
import { extractDocument, chunkText, countWords, getFileType, generateTitle } from "./knowledgeExtractor";
import { scrapeUrl } from "./webScraper";
import { searchGoogle } from "./serpSearch";

describe("Knowledge Extractor", () => {
  it("should identify PDF file type", () => {
    expect(getFileType("document.pdf")).toBe("pdf");
    expect(getFileType("guide.PDF")).toBe("pdf");
  });

  it("should identify markdown file type", () => {
    expect(getFileType("readme.md")).toBe("markdown");
    expect(getFileType("guide.markdown")).toBe("markdown");
  });

  it("should identify text file type", () => {
    expect(getFileType("notes.txt")).toBe("text");
  });

  it("should return null for unsupported file types", () => {
    expect(getFileType("image.jpg")).toBe(null);
    expect(getFileType("video.mp4")).toBe(null);
  });

  it("should generate clean titles from filenames", () => {
    expect(generateTitle("2020-Survial-Guide.pdf")).toBe("2020 Survial Guide");
    expect(generateTitle("Complete_Employment_Resource_Guide.pdf")).toBe("Complete Employment Resource Guide");
    expect(generateTitle("DISABILITY - CANCER.txt")).toBe("Disability Cancer");
  });

  it("should count words correctly", () => {
    expect(countWords("Hello world")).toBe(2);
    expect(countWords("One two three four five")).toBe(5);
    expect(countWords("  Multiple   spaces   between  ")).toBe(3);
  });

  it("should chunk text into manageable pieces", () => {
    // Create text with paragraphs to trigger chunking
    const paragraph = Array(200).fill("word").join(" ");
    const longText = Array(5).fill(paragraph).join("\n\n");
    const chunks = chunkText(longText, 500);
    
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach(chunk => {
      const wordCount = countWords(chunk);
      expect(wordCount).toBeLessThanOrEqual(550); // Allow some overflow
    });
  });
});

describe("Web Scraper", () => {
  it("should handle invalid URLs gracefully", async () => {
    const result = await scrapeUrl("https://this-domain-does-not-exist-12345.com");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should return scraped content structure", async () => {
    const result = await scrapeUrl("https://example.com");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("excerpt");
    expect(result).toHaveProperty("success");
  });
});

describe("SerpAPI Search", () => {
  it("should handle missing API key gracefully", async () => {
    const originalKey = process.env.SERPAPI_KEY;
    delete process.env.SERPAPI_KEY;
    
    const result = await searchGoogle("test query");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not configured");
    
    if (originalKey) {
      process.env.SERPAPI_KEY = originalKey;
    }
  });

  it("should return search result structure", async () => {
    const result = await searchGoogle("test query");
    expect(result).toHaveProperty("query");
    expect(result).toHaveProperty("results");
    expect(result).toHaveProperty("success");
    expect(Array.isArray(result.results)).toBe(true);
  });
});
