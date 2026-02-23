import type { SeoConfig } from "./seo";

const BASE_URL = "https://www.virgilst.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

const RESOURCE_CATEGORIES = new Set(["food", "housing", "transportation", "dental", "legal", "shelter"]);
const MEETING_PROGRAMS = new Set(["aa", "na", "cma", "smart"]);
const TREATMENT_PROGRAMS = new Set([
  "sober-living",
  "detox",
  "residential",
  "outpatient",
  "dual-diagnosis",
]);

const NOINDEX_PREFIXES = [
  "/chat",
  "/forum/new",
  "/treatment/wizard",
  "/favorites",
  "/profile",
  "/onboarding",
  "/calendar",
  "/admin",
  "/404",
  "/resources/map",
];

function titleCaseSegment(input: string) {
  return input
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toCanonical(pathname: string) {
  if (pathname === "/library") return `${BASE_URL}/articles`;
  if (pathname.startsWith("/library/")) {
    return `${BASE_URL}/articles/${pathname.replace("/library/", "")}`;
  }
  return `${BASE_URL}${pathname}`;
}

function sharedJsonLd(pathname: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Virgil St",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      url: `${BASE_URL}${pathname}`,
      description:
        "AI-assisted navigation for housing, benefits, treatment, crisis response, and community resources.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Virgil St",
      url: BASE_URL,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Virgil St",
      url: BASE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ] as Record<string, unknown>[];
}

function isNoindex(pathname: string) {
  if (NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return false;
}

export function buildSeoConfig(pathname: string): SeoConfig {
  const canonical = toCanonical(pathname);
  const robots = isNoindex(pathname) ? "noindex,follow" : "index,follow";
  const base: SeoConfig = {
    title: "Virgil St | Housing, Benefits, Treatment, Crisis and Community Resources",
    description:
      "Virgil St helps people navigate housing, benefits, treatment, healthcare, and crisis resources across Los Angeles, California, and expanding cities.",
    canonical,
    robots,
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: sharedJsonLd(pathname),
  };

  if (pathname === "/" || pathname === "") return base;
  if (pathname === "/articles" || pathname === "/library") {
    return {
      ...base,
      title: "Articles and Survival Guides in California | Virgil St",
      description:
        "Browse practical guides for housing, benefits, emergency support, legal help, healthcare, and documentation in California.",
      canonical: `${BASE_URL}/articles`,
      jsonLd: [
        ...(base.jsonLd || []),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Virgil St Articles",
          url: `${BASE_URL}/articles`,
        },
      ],
    };
  }
  if (pathname.startsWith("/articles/") || pathname.startsWith("/library/")) {
    return {
      ...base,
      title: "Article | Virgil St",
      description: "Read a Virgil St guide for social services, benefits, treatment, and crisis navigation.",
      canonical: toCanonical(pathname),
      ogType: "article",
    };
  }
  if (pathname === "/resources") {
    return {
      ...base,
      title: "Resource Directory in California | Virgil St",
      description:
        "Find verified food, housing, transportation, dental, legal, and shelter resources across Los Angeles County and California.",
    };
  }
  if (pathname.startsWith("/resources/")) {
    const category = pathname.split("/")[2];
    if (category && RESOURCE_CATEGORIES.has(category)) {
      const label = titleCaseSegment(category);
      return {
        ...base,
        title: `${label} Resources in California | Virgil St`,
        description: `Browse ${label.toLowerCase()} programs and verified support services across Los Angeles County and expanding California cities.`,
        jsonLd: [
          ...(base.jsonLd || []),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${label} Resources`,
            url: `${BASE_URL}/resources/${category}`,
          },
        ],
      };
    }
  }
  if (pathname === "/treatment") {
    return {
      ...base,
      title: "Treatment Programs in California | Virgil St",
      description:
        "Search sober living, detox, residential, outpatient, and dual diagnosis treatment options in California.",
    };
  }
  if (pathname.startsWith("/treatment/")) {
    const program = pathname.split("/")[2];
    if (program && TREATMENT_PROGRAMS.has(program)) {
      const label = titleCaseSegment(program);
      return {
        ...base,
        title: `${label} Treatment in California | Virgil St`,
        description: `Find ${label.toLowerCase()} treatment options, filters, and support pathways across California.`,
      };
    }
  }
  if (pathname === "/meetings") {
    return {
      ...base,
      title: "Recovery Meetings in California | Virgil St",
      description:
        "Find AA, NA, CMA, and SMART recovery meetings by day, city, and format across Los Angeles and California.",
    };
  }
  if (pathname.startsWith("/meetings/")) {
    const program = pathname.split("/")[2];
    if (program && MEETING_PROGRAMS.has(program)) {
      const label = program.toUpperCase();
      return {
        ...base,
        title: `${label} Meetings in California | Virgil St`,
        description: `Browse ${label} recovery meetings by city, schedule, and meeting format.`,
      };
    }
  }
  if (pathname === "/medical-providers") {
    return {
      ...base,
      title: "Medi-Cal Providers in California | Virgil St",
      description:
        "Search Medi-Cal providers by city, specialty, and network across Los Angeles County and California.",
    };
  }
  if (pathname === "/healthcare") {
    return {
      ...base,
      title: "Healthcare Access in California | Virgil St",
      description:
        "Find Medi-Cal providers, private-insurance clinics, urgent care, suboxone options, and harm-reduction services.",
    };
  }
  if (pathname.startsWith("/medical-providers/")) {
    const city = pathname.split("/")[2];
    if (city) {
      const cityLabel = titleCaseSegment(city);
      return {
        ...base,
        title: `Medi-Cal Providers in ${cityLabel} | Virgil St`,
        description: `Find Medi-Cal doctors and clinics in ${cityLabel} by specialty, network, and contact details.`,
      };
    }
  }
  if (pathname === "/events") {
    return {
      ...base,
      title: "Community Events in California | Virgil St",
      description: "Discover resource fairs, workshops, and support events for housing, health, and recovery.",
    };
  }
  if (pathname === "/videos") {
    return {
      ...base,
      title: "Video Guides in California | Virgil St",
      description: "Watch practical videos covering social services, treatment, legal help, and recovery support.",
    };
  }
  if (pathname === "/search") {
    return {
      ...base,
      title: "Search Social Services Resources | Virgil St",
      description: "Search articles, resources, forum posts, treatment programs, and more across Virgil St.",
    };
  }
  if (pathname === "/forum") {
    return {
      ...base,
      title: "Community Forum in California | Virgil St",
      description: "Read and share community guidance on survival tips, legal help, shelter, and urgent needs.",
    };
  }
  if (pathname.startsWith("/forum/")) {
    return {
      ...base,
      title: "Forum Discussion | Virgil St Community",
      description: "Read a community discussion and related replies on Virgil St.",
      jsonLd: [
        ...(base.jsonLd || []),
        {
          "@context": "https://schema.org",
          "@type": "DiscussionForumPosting",
          headline: "Community Discussion",
          url: `${BASE_URL}${pathname}`,
        },
      ],
    };
  }
  if (pathname === "/map") {
    return {
      ...base,
      title: "Community Resource Map in California | Virgil St",
      description: "Explore safe zones, warnings, and resource locations shared by the community.",
    };
  }
  return base;
}
