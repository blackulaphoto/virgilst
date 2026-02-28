import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  success: boolean;
  error?: string;
}

export interface WebsiteMetadata {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
  success: boolean;
  error?: string;
}

/**
 * Extract main content from HTML using cheerio
 */
function extractContent($: cheerio.CheerioAPI): { title: string; content: string } {
  // Remove script, style, nav, footer, header elements
  $("script, style, nav, footer, header, aside, .ad, .advertisement").remove();

  // Try to find title
  let title =
    $("h1").first().text() ||
    $("title").text() ||
    $('meta[property="og:title"]').attr("content") ||
    "";

  // Try to find main content area
  let content = "";
  const contentSelectors = [
    "article",
    'main',
    '[role="main"]',
    ".content",
    ".post-content",
    ".entry-content",
    "#content",
    ".article-body",
    ".post-body",
  ];

  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      content = element.text();
      break;
    }
  }

  // Fallback to body if no content found
  if (!content) {
    content = $("body").text();
  }

  // Clean up whitespace
  content = content
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  return { title: title.trim(), content };
}

/**
 * Scrape content from a URL
 */
export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  try {
    // Fetch the page
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Parse HTML
    const $ = cheerio.load(response.data);
    const { title, content } = extractContent($);

    // Create excerpt (first 300 characters)
    const excerpt = content.substring(0, 300) + (content.length > 300 ? "..." : "");

    return {
      url,
      title,
      content,
      excerpt,
      success: true,
    };
  } catch (error) {
    return {
      url,
      title: "",
      content: "",
      excerpt: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Scrape multiple URLs in parallel
 */
export async function scrapeUrls(urls: string[]): Promise<ScrapedContent[]> {
  const promises = urls.map((url) => scrapeUrl(url));
  return Promise.all(promises);
}

function resolveUrl(rawUrl: string | undefined, baseUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Fetch lightweight page metadata for cards/previews.
 */
export async function scrapeWebsiteMetadata(url: string): Promise<WebsiteMetadata> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    const finalUrl = response.request?.res?.responseUrl || url;
    const $ = cheerio.load(response.data);
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").first().text() ||
      null;
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      null;
    const imageUrl = resolveUrl(
      $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        $('meta[property="og:image:url"]').attr("content"),
      finalUrl
    );
    const faviconUrl = resolveUrl(
      $('link[rel="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href") ||
        $('link[rel="apple-touch-icon"]').attr("href"),
      finalUrl
    );

    return {
      url: finalUrl,
      title: title?.trim() || null,
      description: description?.trim() || null,
      imageUrl,
      faviconUrl,
      success: true,
    };
  } catch (error) {
    return {
      url,
      title: null,
      description: null,
      imageUrl: null,
      faviconUrl: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
