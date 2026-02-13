import axios from "axios";

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerpSearchResponse {
  query: string;
  results: SearchResult[];
  success: boolean;
  error?: string;
}

/**
 * Search Google using SerpAPI
 * Requires SERPAPI_KEY environment variable
 */
export async function searchGoogle(query: string, numResults: number = 5): Promise<SerpSearchResponse> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return {
      query,
      results: [],
      success: false,
      error: "SerpAPI key not configured. Please add SERPAPI_KEY environment variable.",
    };
  }

  try {
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        q: query,
        api_key: apiKey,
        engine: "google",
        num: numResults,
      },
      timeout: 10000,
    });

    const results: SearchResult[] = [];
    const organicResults = response.data.organic_results || [];

    for (let i = 0; i < Math.min(organicResults.length, numResults); i++) {
      const result = organicResults[i];
      results.push({
        title: result.title || "",
        link: result.link || "",
        snippet: result.snippet || "",
        position: result.position || i + 1,
      });
    }

    return {
      query,
      results,
      success: true,
    };
  } catch (error) {
    return {
      query,
      results: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format search results for LLM context
 */
export function formatSearchResults(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      return `[${index + 1}] ${result.title}\n${result.snippet}\nURL: ${result.link}\n`;
    })
    .join("\n");
}
