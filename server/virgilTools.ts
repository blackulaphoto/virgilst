/**
 * Virgil AI Tool Definitions
 * Shared between regular and streaming chat endpoints
 */

export const virgilTools = [
  {
    type: "function" as const,
    function: {
      name: "search_knowledge",
      description: "Search the knowledge base of guides, PDFs, and documents about benefits, housing, legal issues, healthcare, employment, and other survival resources. Use this when the user asks about programs, rights, or processes.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant information in the knowledge base",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_local_resources",
      description: "Search our verified database of LOCAL treatment centers, shelters, food banks, medical providers, and LA County resources. CRITICAL: ALWAYS use this FIRST when users ask about: treatment, rehab, detox, sober living, maternity homes, couples treatment, shelters, housing, food banks, medical care, doctors, clinics, or any LOCAL services/places. Our database includes: treatment centers that accept Medi-Cal, centers that accept COUPLES, maternity homes for pregnant women, and all have VERIFIED phone numbers and addresses. Returns REAL contact info from our internal database.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query. Include relevant details like 'treatment center couples', 'treatment center pregnant', 'treatment center medi-cal', 'shelter koreatown', etc.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "scrape_url",
      description: "Fetch and extract text content from a specific URL. Use this when the user provides a URL or asks about a specific website.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to scrape content from",
          },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_google",
      description: "Search Google for current general information. ONLY use this as a FALLBACK after trying search_local_resources and search_knowledge. Our internal database has verified LA resources with real contact info.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for Google",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];
