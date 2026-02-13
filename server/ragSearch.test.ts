import { describe, expect, it } from "vitest";
import { getCitations, rankSearchResults, type SearchResult } from "./ragSearch";

const baseResult = (overrides: Partial<SearchResult>): SearchResult => ({
  chunkId: 1,
  documentId: 1,
  documentTitle: "Doc 1",
  filename: "doc-1.md",
  category: "general",
  content: "content",
  similarity: 0.5,
  ...overrides,
});

describe("RAG deterministic ordering", () => {
  it("ranks by similarity then document/chunk IDs", () => {
    const results: SearchResult[] = [
      baseResult({ chunkId: 4, documentId: 2, similarity: 0.7, documentTitle: "Doc 2", filename: "doc-2.md" }),
      baseResult({ chunkId: 2, documentId: 1, similarity: 0.7, documentTitle: "Doc 1", filename: "doc-1.md" }),
      baseResult({ chunkId: 1, documentId: 1, similarity: 0.9, documentTitle: "Doc 1", filename: "doc-1.md" }),
    ];

    const ranked = rankSearchResults(results, 3);
    expect(ranked.map(r => [r.documentId, r.chunkId])).toEqual([
      [1, 1],
      [1, 2],
      [2, 4],
    ]);
  });

  it("returns deterministic, de-duplicated citations", () => {
    const results: SearchResult[] = [
      baseResult({ documentId: 3, chunkId: 9, similarity: 0.6, documentTitle: "Doc 3", filename: "doc-3.md", category: "housing" }),
      baseResult({ documentId: 2, chunkId: 8, similarity: 0.6, documentTitle: "Doc 2", filename: "doc-2.md", category: "legal" }),
      baseResult({ documentId: 2, chunkId: 3, similarity: 0.7, documentTitle: "Doc 2", filename: "doc-2.md", category: "legal" }),
      baseResult({ documentId: 1, chunkId: 1, similarity: 0.8, documentTitle: "Doc 1", filename: "doc-1.md", category: "benefits" }),
      baseResult({ documentId: 1, chunkId: 2, similarity: 0.2, documentTitle: "Doc 1", filename: "doc-1.md", category: "benefits" }),
    ];

    const citations = getCitations(results);
    expect(citations).toEqual([
      { title: "Doc 1", filename: "doc-1.md", category: "benefits" },
      { title: "Doc 2", filename: "doc-2.md", category: "legal" },
      { title: "Doc 3", filename: "doc-3.md", category: "housing" },
    ]);
  });
});
