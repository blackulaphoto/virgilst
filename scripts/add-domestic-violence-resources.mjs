import postgres from 'postgres';
import { readFileSync } from 'fs';

function resolveDatabaseUrl() {
  const privateUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;

  if (!privateUrl && !publicUrl) {
    throw new Error('DATABASE_URL or DATABASE_PUBLIC_URL is required');
  }

  if (!privateUrl) return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };

  try {
    const hostname = new URL(privateUrl).hostname.toLowerCase();
    const usesInternalHost =
      hostname.endsWith('.railway.internal') || hostname === 'postgres.railway.internal';

    if (usesInternalHost && publicUrl) {
      return { url: publicUrl, source: "DATABASE_PUBLIC_URL" };
    }
  } catch {
    // If URL parsing fails, fall back to private URL.
  }

  return { url: privateUrl, source: "DATABASE_URL" };
}

const resolvedDb = resolveDatabaseUrl();
const sql = postgres(resolvedDb.url);

// Read the markdown file
const articleContent = readFileSync('C:\\Users\\brandon\\Downloads\\virgil-st-mvp\\virgil-st\\knowledge_files\\Domestic Violence resources.md', 'utf-8');

// Article to add to resource library
const article = {
  title: 'Domestic Violence Resources & Safety Guide',
  slug: 'domestic-violence-resources-safety-guide',
  content: articleContent,
  category: 'safety',
  tags: JSON.stringify(['domestic violence', 'crisis support', 'safety planning', 'legal help', 'emergency']),
  summary: 'Comprehensive guide to domestic violence resources including global directories, 24/7 crisis hotlines, legal information, and step-by-step safety planning for survivors.',
  isPublished: 1,
};

// Resources to add to resources table
const resources = [
  {
    name: 'National Domestic Violence Hotline (NDVH)',
    description: '24/7 free, confidential support for domestic violence. Safety planning, crisis counseling, emotional support, finding local shelters and legal help.',
    type: 'crisis_hotline',
    phone: '1-800-799-7233',
    website: 'https://www.thehotline.org',
    hours: '24/7',
    filters: JSON.stringify({ crisis24_7: true, confidential: true, noIdRequired: true }),
    isVerified: 1,
  },
  {
    name: 'Love Is Respect (National Dating Abuse Helpline)',
    description: 'For teens and young adults in dating relationships experiencing abuse.',
    type: 'crisis_hotline',
    phone: '1-866-331-9474',
    website: 'https://www.loveisrespect.org',
    hours: '24/7',
    filters: JSON.stringify({ crisis24_7: true, confidential: true, teensYoungAdults: true }),
    isVerified: 1,
  },
  {
    name: 'RAINN – National Sexual Assault Hotline',
    description: 'Sexual assault and rape crisis support (often overlaps with domestic violence). Anonymous 24/7 support.',
    type: 'crisis_hotline',
    phone: '1-800-656-4673',
    website: 'https://www.rainn.org',
    hours: '24/7',
    filters: JSON.stringify({ crisis24_7: true, confidential: true, anonymous: true }),
    isVerified: 1,
  },
  {
    name: 'StrongHearts Native Helpline',
    description: 'For American Indians, Alaska Natives, and Native Hawaiians experiencing domestic or dating violence.',
    type: 'crisis_hotline',
    phone: '1-844-762-8483',
    website: 'https://strongheartshelpline.org',
    hours: '24/7',
    filters: JSON.stringify({ crisis24_7: true, culturallySpecific: true, nativeAmerican: true }),
    isVerified: 1,
  },
  {
    name: 'The Deaf Hotline',
    description: 'For Deaf, DeafBlind, DeafDisabled, and hard-of-hearing survivors of domestic and sexual violence. Video phone and chat support.',
    type: 'crisis_hotline',
    phone: 'See website for VP',
    website: 'https://thedeafhotline.org',
    hours: '24/7',
    filters: JSON.stringify({ crisis24_7: true, accessibilityFocused: true, deaf: true }),
    isVerified: 1,
  },
  {
    name: 'Pathways to Safety International',
    description: 'For U.S. citizens experiencing abuse while living or traveling abroad (domestic violence, dating violence, sexual assault, stalking, forced marriage).',
    type: 'crisis_hotline',
    phone: '833-723-3833',
    website: 'https://www.pathwaystosafety.org',
    hours: '24/7',
    filters: JSON.stringify({ crisis24_7: true, international: true, americansAbroad: true }),
    isVerified: 1,
  },
  {
    name: 'WomensLaw.org',
    description: 'Plain-language legal information on domestic violence, sexual assault, restraining orders, custody, and more. State-by-state U.S. info plus federal immigration and protective order content.',
    type: 'legal_aid',
    phone: null,
    website: 'https://www.womenslaw.org',
    hours: 'Online resource',
    filters: JSON.stringify({ legalInfo: true, online: true }),
    isVerified: 1,
  },
  {
    name: 'DomesticShelters.org',
    description: 'Searchable database of shelters and domestic violence organizations across many countries, plus education articles and checklists.',
    type: 'shelter',
    phone: null,
    website: 'https://www.domesticshelters.org',
    hours: 'Online resource',
    filters: JSON.stringify({ shelterDatabase: true, international: true }),
    isVerified: 1,
  },
  {
    name: 'NO MORE Global Directory',
    description: 'International directory of domestic and sexual violence helplines, shelters, and support organizations in almost every UN-recognized country.',
    type: 'crisis_hotline',
    phone: null,
    website: 'https://nomoredirectory.org',
    hours: 'Online directory',
    filters: JSON.stringify({ international: true, directory: true }),
    isVerified: 1,
  },
  {
    name: 'Hot Peach Pages / International Directory',
    description: 'Global directory of hotlines, shelters, crisis centers, and women\'s organizations, with information in over 80-110 languages.',
    type: 'crisis_hotline',
    phone: null,
    website: 'http://www.hotpeachpages.net',
    hours: 'Online directory',
    filters: JSON.stringify({ international: true, directory: true, multiLanguage: true }),
    isVerified: 1,
  },
];

async function addDomesticViolenceResources() {
  console.log('Adding Domestic Violence article and resources...\n');
  try {
    const dbHost = new URL(resolvedDb.url).hostname;
    console.log(`Using ${resolvedDb.source} (${dbHost})\n`);
  } catch {
    console.log(`Using ${resolvedDb.source}\n`);
  }

  // 1. Add the article
  console.log('=== ADDING ARTICLE ===\n');
  try {
    const existingArticle = await sql`
      SELECT id FROM articles WHERE slug = ${article.slug} LIMIT 1
    `;

    if (existingArticle.length > 0) {
      console.log(`[SKIP] Article "${article.title}" already exists\n`);
    } else {
      const result = await sql`
        INSERT INTO articles (
          title, slug, content, category, tags, summary, "isPublished"
        ) VALUES (
          ${article.title},
          ${article.slug},
          ${article.content},
          ${article.category},
          ${article.tags},
          ${article.summary},
          ${article.isPublished}
        )
        RETURNING id
      `;
      console.log(`[ADDED] Article: ${article.title} (ID: ${result[0].id})\n`);
    }
  } catch (error) {
    console.error(`[ERROR] Article: ${error.message}\n`);
  }

  // 2. Add the resources
  console.log('=== ADDING RESOURCES ===\n');
  let added = 0;
  let skipped = 0;

  for (const resource of resources) {
    try {
      const existingByName = await sql`
        SELECT id FROM resources WHERE name = ${resource.name} LIMIT 1
      `;

      if (existingByName.length > 0) {
        console.log(`[SKIP] ${resource.name}`);
        skipped++;
        continue;
      }

      const result = await sql`
        INSERT INTO resources (
          name, description, type, phone, website, hours, filters, "isVerified"
        ) VALUES (
          ${resource.name},
          ${resource.description},
          ${resource.type},
          ${resource.phone},
          ${resource.website},
          ${resource.hours},
          ${resource.filters},
          ${resource.isVerified}
        )
        RETURNING id
      `;

      console.log(`[ADDED] ${resource.name}`);
      added++;
    } catch (error) {
      console.error(`[ERROR] ${resource.name}: ${error.message}`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Resources: ${added} added, ${skipped} skipped`);
  await sql.end();
}

addDomesticViolenceResources().catch(console.error);
