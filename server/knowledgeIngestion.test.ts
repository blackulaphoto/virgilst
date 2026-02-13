import { describe, expect, it } from "vitest";
import {
  MAX_KNOWLEDGE_UPLOAD_BYTES,
  categorizeKnowledgeFilename,
  detectKnowledgeFileType,
  extractUploadContent,
  isAllowedKnowledgeMimeType,
  normalizeMimeType,
} from "./knowledgeIngestion";

describe("Knowledge upload validation helpers", () => {
  it("normalizes and validates allowed MIME types", () => {
    expect(normalizeMimeType(" Text/Markdown ")).toBe("text/markdown");
    expect(isAllowedKnowledgeMimeType("application/pdf")).toBe(true);
    expect(isAllowedKnowledgeMimeType("text/markdown")).toBe(true);
    expect(isAllowedKnowledgeMimeType("text/plain")).toBe(true);
    expect(isAllowedKnowledgeMimeType("application/msword")).toBe(false);
  });

  it("detects knowledge file type from MIME", () => {
    expect(detectKnowledgeFileType("application/pdf")).toBe("pdf");
    expect(detectKnowledgeFileType("text/markdown")).toBe("markdown");
    expect(detectKnowledgeFileType("text/plain")).toBe("text");
  });

  it("extracts non-PDF content from upload buffer", async () => {
    const text = "# Title\n\nThis is test markdown.";
    const content = await extractUploadContent(Buffer.from(text, "utf-8"), "markdown");
    expect(content).toContain("Title");
    expect(content).toContain("test markdown");
  });

  it("categorizes filenames deterministically", () => {
    expect(categorizeKnowledgeFilename("Medi-Cal Medical Guide.pdf")).toBe("health");
    expect(categorizeKnowledgeFilename("Emergency shelter quickstart.md")).toBe("housing");
    expect(categorizeKnowledgeFilename("Unknown Notes.txt")).toBe("general");
  });

  it("documents max upload size guard", () => {
    expect(MAX_KNOWLEDGE_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });
});
