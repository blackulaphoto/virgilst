import axios from 'axios';
import crypto from 'crypto';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const CACHE_DURATION_HOURS = 24;
const MEMORY_CACHE_MAX_SIZE = 100; // Max number of searches to cache in memory
const PREWARM_ON_STARTUP = true; // Pre-warm popular searches

interface SerpAPIJobResult {
  title: string;
  company_name: string;
  location: string;
  description?: string;
  job_id?: string;
  apply_link?: string;
  share_link?: string;
  related_links?: Array<{
    link?: string;
  }>;
  apply_options?: Array<{
    link?: string;
  }>;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
  };
}

interface SerpAPIJobsResponse {
  jobs_results?: SerpAPIJobResult[];
  serpapi_pagination?: {
    next_page_token?: string;
  };
}

interface JobSearchParams {
  query: string;
  location?: string;
  employmentType?: string;
  limit?: number;
}

export interface JobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType: string | null;
  salary: string | null;
  externalId: string;
  applyLink: string | null;
  postedDate: string | null;
  searchQuery: string;
  searchLocation: string | null;
  sourceUrl?: string | null;
}

interface CachedJobSearch {
  jobs: JobListing[];
  timestamp: number;
  expiresAt: number;
}

/**
 * In-memory LRU cache for job searches
 */
class JobSearchCache {
  private cache = new Map<string, CachedJobSearch>();
  private accessOrder: string[] = [];

  set(key: string, jobs: JobListing[]): void {
    const now = Date.now();
    const expiresAt = now + (CACHE_DURATION_HOURS * 60 * 60 * 1000);

    // Remove if already exists to update access order
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    // Add to cache
    this.cache.set(key, { jobs, timestamp: now, expiresAt });
    this.accessOrder.push(key);

    // Evict oldest if over capacity
    if (this.cache.size > MEMORY_CACHE_MAX_SIZE) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }
  }

  get(key: string): JobListing[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return null;
    }

    // Update access order (move to end)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return cached.jobs;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }
}

// Global in-memory cache
const jobSearchCache = new JobSearchCache();

/**
 * Generate cache key for job search
 */
export function generateCacheKey(params: JobSearchParams): string {
  const normalized = {
    query: params.query.toLowerCase().trim(),
    location: params.location?.toLowerCase().trim() || '',
    employmentType: params.employmentType || '',
  };
  return crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
}

/**
 * Fetch a single page of jobs from SerpAPI
 */
async function fetchJobPage(
  query: string,
  location: string,
  employmentType: string | undefined,
  nextPageToken?: string
): Promise<{ jobs: SerpAPIJobResult[]; nextToken?: string }> {
  const serpParams: Record<string, string | number> = {
    engine: 'google_jobs',
    q: query,
    location,
    api_key: SERPAPI_KEY!,
  };

  if (employmentType) {
    serpParams.chips = `employment_type:${employmentType}`;
  }

  if (nextPageToken) {
    serpParams.next_page_token = nextPageToken;
  }

  const response = await axios.get<SerpAPIJobsResponse>('https://serpapi.com/search', {
    params: serpParams,
    timeout: 15000,
  });

  return {
    jobs: response.data.jobs_results || [],
    nextToken: response.data.serpapi_pagination?.next_page_token,
  };
}

/**
 * Search jobs using SerpAPI Google Jobs with parallel fetching and in-memory cache
 */
export async function searchJobs(params: JobSearchParams): Promise<JobListing[]> {
  if (!SERPAPI_KEY) {
    throw new Error('SERPAPI_KEY not configured');
  }

  const {
    query,
    location = 'Los Angeles, CA',
    employmentType,
    limit = 100,
  } = params;

  // Check in-memory cache first
  const cacheKey = generateCacheKey(params);
  const cached = jobSearchCache.get(cacheKey);
  if (cached) {
    console.log(`[Jobs] Cache HIT for "${query}" (${cached.length} jobs)`);
    return cached.slice(0, limit);
  }

  console.log(`[Jobs] Cache MISS for "${query}", fetching from SerpAPI...`);

  try {
    const requestedLimit = Math.min(Math.max(limit, 1), 100);
    const seenIds = new Set<string>();

    // Fetch first page to get initial results and next_page_token
    const firstPage = await fetchJobPage(query, location, employmentType, undefined);
    let listings: JobListing[] = [];

    // Process first page jobs
    for (const job of firstPage.jobs) {
      const stableId = job.job_id || `${job.title}-${job.company_name}-${job.location}`;
      if (seenIds.has(stableId)) continue;

      const applyOptionLink = job.apply_options?.find((opt) => !!opt.link)?.link || null;
      const relatedLink = job.related_links?.find((item) => !!item.link)?.link || null;
      const sourceUrl = job.share_link || relatedLink || null;
      const applyLink = job.apply_link || applyOptionLink || sourceUrl || null;

      seenIds.add(stableId);
      listings.push({
        title: job.title,
        company: job.company_name,
        location: job.location,
        description: job.description || '',
        employmentType: job.detected_extensions?.schedule_type || null,
        salary: job.detected_extensions?.salary || null,
        externalId: job.job_id || `serp-${Date.now()}-${Math.random()}`,
        applyLink,
        postedDate: job.detected_extensions?.posted_at || null,
        searchQuery: query,
        searchLocation: location,
        sourceUrl,
      });
    }

    // If we need more results and have a next token, fetch remaining pages
    if (listings.length < requestedLimit && firstPage.nextToken) {
      const remainingPages = Math.ceil((requestedLimit - listings.length) / 10);
      let currentToken: string | undefined = firstPage.nextToken;

      // We can't truly parallelize all pages since each needs the previous token,
      // but we can fetch 2-3 pages at a time in batches
      const BATCH_SIZE = 3;

      for (let batch = 0; batch < Math.ceil(remainingPages / BATCH_SIZE); batch++) {
        const batchPromises: Promise<{ jobs: SerpAPIJobResult[]; nextToken?: string }>[] = [];

        // Fetch current batch sequentially to get tokens, but await them together
        for (let i = 0; i < BATCH_SIZE && currentToken && listings.length < requestedLimit; i++) {
          const promise = fetchJobPage(query, location, employmentType, currentToken);
          batchPromises.push(promise);

          // Wait for this page to get the next token for the next iteration
          const result = await promise;
          currentToken = result.nextToken;

          if (result.jobs.length === 0) break;
        }

        // Process all results from this batch
        const batchResults = await Promise.all(batchPromises);

        for (const pageResult of batchResults) {
          for (const job of pageResult.jobs) {
            if (listings.length >= requestedLimit) break;

            const stableId = job.job_id || `${job.title}-${job.company_name}-${job.location}`;
            if (seenIds.has(stableId)) continue;

            const applyOptionLink = job.apply_options?.find((opt) => !!opt.link)?.link || null;
            const relatedLink = job.related_links?.find((item) => !!item.link)?.link || null;
            const sourceUrl = job.share_link || relatedLink || null;
            const applyLink = job.apply_link || applyOptionLink || sourceUrl || null;

            seenIds.add(stableId);
            listings.push({
              title: job.title,
              company: job.company_name,
              location: job.location,
              description: job.description || '',
              employmentType: job.detected_extensions?.schedule_type || null,
              salary: job.detected_extensions?.salary || null,
              externalId: job.job_id || `serp-${Date.now()}-${Math.random()}`,
              applyLink,
              postedDate: job.detected_extensions?.posted_at || null,
              searchQuery: query,
              searchLocation: location,
              sourceUrl,
            });
          }
        }

        if (!currentToken) break;
      }
    }

    // Store in cache
    jobSearchCache.set(cacheKey, listings);
    console.log(`[Jobs] Cached ${listings.length} jobs for "${query}"`);

    return listings.slice(0, requestedLimit);
  } catch (error: any) {
    console.error('[Jobs] SerpAPI error:', error.message);
    throw new Error(`Failed to search jobs: ${error.message}`);
  }
}

/**
 * Get popular job searches for specific audiences
 */
export function getPopularSearches() {
  return [
    { query: 'entry level jobs no experience', location: 'Los Angeles, CA', category: 'entry-level' },
    { query: 'warehouse jobs hiring immediately', location: 'Los Angeles, CA', category: 'warehouse' },
    { query: 'retail jobs', location: 'Los Angeles, CA', category: 'retail' },
    { query: 'food service jobs', location: 'Los Angeles, CA', category: 'food-service' },
    { query: 'customer service remote', location: 'Los Angeles, CA', category: 'remote' },
    { query: 'construction laborer', location: 'Los Angeles, CA', category: 'construction' },
    { query: 'delivery driver', location: 'Los Angeles, CA', category: 'delivery' },
    { query: 'security guard', location: 'Los Angeles, CA', category: 'security' },
    { query: 'janitorial custodian', location: 'Los Angeles, CA', category: 'janitorial' },
    { query: 'part time jobs', location: 'Los Angeles, CA', category: 'part-time' },
  ];
}

/**
 * Generate SEO-friendly slug for job listing
 */
export function generateJobSlug(job: JobListing): string {
  const parts = [
    job.title,
    job.company,
    job.location,
  ];

  const slug = parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200);

  // Add unique suffix to prevent collisions
  const hash = crypto.createHash('md5')
    .update(job.externalId)
    .digest('hex')
    .substring(0, 8);

  return `${slug}-${hash}`;
}

/**
 * Pre-warm the cache with popular job searches
 * This runs on server startup to make common searches instant
 */
export async function prewarmJobCache(): Promise<void> {
  if (!PREWARM_ON_STARTUP || !SERPAPI_KEY) {
    console.log('[Jobs] Pre-warming disabled or no API key');
    return;
  }

  console.log('[Jobs] Starting cache pre-warm for popular searches...');
  const popularSearches = getPopularSearches();

  // Pre-warm first 5 most popular searches to avoid API rate limits
  const searchesToPrewarm = popularSearches.slice(0, 5);

  for (const search of searchesToPrewarm) {
    try {
      await searchJobs({
        query: search.query,
        location: search.location,
        limit: 50, // Fewer jobs for pre-warming to save API credits
      });
      console.log(`[Jobs] Pre-warmed: "${search.query}"`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`[Jobs] Failed to pre-warm "${search.query}":`, error.message);
    }
  }

  console.log(`[Jobs] Cache pre-warm complete. Cache size: ${jobSearchCache.size()}`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: jobSearchCache.size(),
    maxSize: MEMORY_CACHE_MAX_SIZE,
  };
}

/**
 * Clear the job search cache (useful for testing/debugging)
 */
export function clearJobCache(): void {
  jobSearchCache.clear();
  console.log('[Jobs] Cache cleared');
}
