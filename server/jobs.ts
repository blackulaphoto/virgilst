import axios from 'axios';
import crypto from 'crypto';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const CACHE_DURATION_HOURS = 24;

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

/**
 * Generate cache key for job search
 */
function generateCacheKey(params: JobSearchParams): string {
  const normalized = {
    query: params.query.toLowerCase().trim(),
    location: params.location?.toLowerCase().trim() || '',
    employmentType: params.employmentType || '',
  };
  return crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
}

/**
 * Search jobs using SerpAPI Google Jobs
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

  try {
    const requestedLimit = Math.min(Math.max(limit, 1), 100);
    const listings: JobListing[] = [];
    const seenIds = new Set<string>();
    let nextPageToken: string | undefined;
    let pageRequests = 0;
    const maxPageRequests = Math.max(1, Math.ceil(requestedLimit / 10));

    while (listings.length < requestedLimit && pageRequests < maxPageRequests) {
      // Google Jobs is paged via next_page_token and returns up to 10 jobs per page.
      const serpParams: Record<string, string | number> = {
        engine: 'google_jobs',
        q: query,
        location,
        api_key: SERPAPI_KEY,
      };

      if (employmentType) {
        serpParams.chips = `employment_type:${employmentType}`;
      }

      if (nextPageToken) {
        serpParams.next_page_token = nextPageToken;
      }

      const response = await axios.get<SerpAPIJobsResponse>('https://serpapi.com/search', {
        params: serpParams,
        timeout: 10000,
      });

      const jobs = response.data.jobs_results || [];
      if (jobs.length === 0) {
        break;
      }

      for (const job of jobs) {
        const stableId = job.job_id || `${job.title}-${job.company_name}-${job.location}`;
        if (seenIds.has(stableId)) {
          continue;
        }

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

        if (listings.length >= requestedLimit) {
          break;
        }
      }

      nextPageToken = response.data.serpapi_pagination?.next_page_token;
      pageRequests += 1;

      if (!nextPageToken) {
        break;
      }
    }

    return listings;
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
