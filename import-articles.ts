import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { articles } from "./drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractSummary(content: string): string {
  // Get first paragraph or first 200 chars
  const firstPara = content.split('\n\n')[0];
  if (firstPara.length > 200) {
    return firstPara.substring(0, 197) + '...';
  }
  return firstPara;
}

const articlesToImport = [
  {
    filename: "DPSS is more than food stamps !.txt",
    title: "DPSS Is More Than Food Stamps - Complete California Benefits Guide",
    category: "benefits",
    tags: ["CalFresh", "CalWORKs", "Medi-Cal", "General Relief", "Housing", "Transportation", "DPSS"]
  },
  {
    filename: "From Shelter to a home in CA.txt",
    title: "From Shelter to a Home in California - Complete Housing Pathway",
    category: "housing",
    tags: ["Housing", "Section 8", "Coordinated Entry", "CalWORKs", "HSP", "HDAP", "Emergency Shelter"]
  },
  {
    filename: "LGBTQ + resources.txt",
    title: "LGBTQ+ Resources in California - Complete Survival Guide",
    category: "health",
    tags: ["LGBTQ+", "Housing", "HIV", "PrEP", "PEP", "Trans Resources", "Mental Health", "Legal Help"]
  },
  {
    filename: "SSI VS SSDI what you need to know.txt",
    title: "SSI vs SSDI - What You Need to Know in California",
    category: "benefits",
    tags: ["SSI", "SSDI", "Disability", "Social Security", "Medicare", "Medi-Cal"]
  },
  {
    filename: "Anger management classes in 2026.txt",
    title: "Anger Management Classes in 2026 - California Court and Community Guide",
    category: "health",
    tags: [
      "Anger Management",
      "Court-Ordered Programs",
      "Probation",
      "Mental Health",
      "California Resources",
      "Los Angeles",
      "Orange County",
      "San Diego"
    ]
  },
  {
    filename: "Documents and ID's.txt",
    title: "Documents and IDs in California - Complete Recovery and Replacement Guide",
    category: "identification",
    tags: [
      "Documents",
      "Identification",
      "California ID",
      "Birth Certificate",
      "Social Security Card",
      "DMV",
      "Proof of Identity",
      "Replacement Documents"
    ]
  },
  {
    filename: "Women\u2019s Damascus Road Recovery Progam.txt",
    title: "Women's Damascus Road Recovery Program - Union Rescue Mission Guide",
    category: "health",
    tags: [
      "Union Rescue Mission",
      "Damascus Road",
      "Womens Recovery",
      "Substance Use Recovery",
      "Trauma-Informed Care",
      "Hope Gardens",
      "Residential Program"
    ]
  },
  {
    filename: "Union Rescue Mission Learning Centers.txt",
    title: "Union Rescue Mission Learning Centers - Education and Job Skills Guide",
    category: "employment",
    tags: [
      "Union Rescue Mission",
      "Learning Centers",
      "GED",
      "ESL",
      "Job Readiness",
      "Computer Skills",
      "Adult Education"
    ]
  },
  {
    filename: "Union Rescue Mission Medical, Dental  services.txt",
    title: "Union Rescue Mission Medical and Dental Services - Access Guide",
    category: "health",
    tags: [
      "Union Rescue Mission",
      "Medical Services",
      "Dental Services",
      "Mental Health",
      "Legal Clinics",
      "UCLA",
      "USC"
    ]
  },
  {
    filename: "Union Rescue Mission Emergency Services.txt",
    title: "Union Rescue Mission Emergency Services - What You Can Access Today",
    category: "emergency",
    tags: [
      "Union Rescue Mission",
      "Emergency Shelter",
      "Meals",
      "Showers",
      "Skid Row",
      "Crisis Services",
      "Los Angeles"
    ]
  },
  {
    filename: "Union Rescue Mission Transitional Program.txt",
    title: "Union Rescue Mission Transitional Programs - SES and FES Guide",
    category: "housing",
    tags: [
      "Union Rescue Mission",
      "Transitional Housing",
      "SES",
      "FES",
      "Case Management",
      "Family Services",
      "Housing Stability"
    ]
  },
  {
    filename: "Men\u2019s Emmaus Recovery Program.txt",
    title: "Men's Emmaus Recovery Program - Union Rescue Mission Guide",
    category: "health",
    tags: [
      "Union Rescue Mission",
      "Emmaus Program",
      "Mens Recovery",
      "Substance Use Recovery",
      "Trauma-Informed Care",
      "Faith-Based Program",
      "Residential Recovery"
    ]
  }
];

async function importArticles() {
  console.log("📚 Importing Articles to Library\n");

  const articlesDir = path.join(__dirname, "knowledge files", "articles");
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const articleInfo of articlesToImport) {
    try {
      const filePath = path.join(articlesDir, articleInfo.filename);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${articleInfo.filename}`);
        errors++;
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const slug = generateSlug(articleInfo.title);
      const summary = extractSummary(content);

      await db.insert(articles).values({
        title: articleInfo.title,
        slug: slug,
        content: content,
        category: articleInfo.category,
        tags: JSON.stringify(articleInfo.tags),
        summary: summary,
        isPublished: 1,
        viewCount: 0,
      });

      console.log(`✅ ${articleInfo.title}`);
      console.log(`   Category: ${articleInfo.category}`);
      console.log(`   Tags: ${articleInfo.tags.join(', ')}`);
      console.log(`   Content length: ${content.length} characters\n`);

      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${articleInfo.title}\n`);
        skipped++;
      } else {
        console.error(`❌ Error importing ${articleInfo.title}:`, error.message);
        errors++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${articlesToImport.length}`);

  console.log("\n📖 Articles imported:");
  console.log("   1. DPSS Benefits Guide (CalFresh, CalWORKs, Medi-Cal, Housing)");
  console.log("   2. Housing Pathway (Shelter to Section 8)");
  console.log("   3. LGBTQ+ Resources (Housing, HIV, Trans care, Legal)");
  console.log("   4. SSI vs SSDI Guide (Disability benefits explained)");

  console.log("\n✨ Articles are now available in the Library!");

  client.close();
}

importArticles();
