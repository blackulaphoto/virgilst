import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { meetings } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

// Helper function to parse tags from meeting description
function parseTags(description: string, notes: string): string[] {
  const tags: string[] = [];
  const combined = `${description} ${notes}`.toLowerCase();

  // Gender-specific
  if (combined.includes("women") || combined.includes("women's") || combined.includes("women only")) {
    tags.push("women_only");
  }
  if (combined.includes("men") || combined.includes("men's") || combined.includes("men only") || combined.includes("stag")) {
    tags.push("men_only");
  }

  // Accessibility
  if (combined.includes("wheelchair") || combined.includes("wc")) {
    tags.push("wheelchair_accessible");
  }

  // Special populations
  if (combined.includes("lgbtq") || combined.includes("lgbt")) {
    tags.push("lgbtq_friendly");
  }
  if (combined.includes("young people") || combined.includes("yp")) {
    tags.push("young_people");
  }
  if (combined.includes("newcomer")) {
    tags.push("newcomer_friendly");
  }

  // Meeting types
  if (combined.includes("speaker")) {
    tags.push("speaker");
  }
  if (combined.includes("candlelight") || combined.includes("cl")) {
    tags.push("candlelight");
  }
  if (combined.includes("dual diagnosis") || combined.includes("mental health")) {
    tags.push("dual_diagnosis");
  }

  return tags;
}

// Helper to determine meeting mode
function getMeetingMode(notes: string): string {
  const lower = notes.toLowerCase();
  if (lower.includes("hybrid")) return "hybrid";
  if (lower.includes("virtual") || lower.includes("online") || lower.includes("zoom") || lower.includes("vm")) return "online";
  return "in_person";
}

// Helper to parse format
function getFormat(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("speaker")) return "speaker";
  if (lower.includes("step study") || lower.includes("12&12") || lower.includes("step &")) return "step_study";
  if (lower.includes("big book")) return "book_study";
  if (lower.includes("literature") || lower.includes("book study")) return "book_study";
  if (lower.includes("topic")) return "topic";
  if (lower.includes("participation")) return "participation";
  return "discussion";
}

const aaMeetings = [
  // Monday AA
  { name: "Hole in the Sky - Happy, Joyous & Free", type: "aa", day: "monday", time: "5:30 AM", address: "21520 Sherman Way", city: "Canoga Park", format: "discussion", notes: "In-person" },
  { name: "Valley Club (As Bill Sees It)", type: "aa", day: "monday", time: "5:30 AM", address: "8728 Corbin Ave", city: "Northridge", format: "discussion", notes: "In-person" },
  { name: "The Solution Meeting", type: "aa", day: "monday", time: "6:45 AM", address: "7552 Remmet Ave", city: "Canoga Park", venue: "Cabrito House", format: "discussion", notes: "Hybrid. Men's stag. Zoom ID: 327 055 526" },
  { name: "Hole in the Sky - Spiritual Discussion", type: "aa", day: "monday", time: "6:45 AM", city: "Canoga Park", format: "discussion", notes: "Online (virtual)" },
  { name: "Winners Attitude Adjustment", type: "aa", day: "monday", time: "7:00 AM", address: "12020 Burbank Blvd", city: "North Hollywood", venue: "Adat Ari El Temple", format: "speaker", notes: "Hybrid: Open discussion" },
  { name: "New Attitude", type: "aa", day: "monday", time: "7:00 AM", address: "747 N. Whitnall Hwy", city: "Burbank", venue: "American Lutheran Church", format: "speaker", notes: "In-person. Open discussion" },
  { name: "Attitude Adjustment (Valley Village)", type: "aa", day: "monday", time: "7:00 AM", city: "Valley Village", format: "discussion", notes: "Online (virtual)" },
  { name: "New Day Zooming", type: "aa", day: "monday", time: "7:00 AM", city: "North Hollywood", format: "discussion", notes: "Online. Closed men's meeting" },
  { name: "Rule 62 Secular AA", type: "aa", day: "monday", time: "7:00 AM", city: "San Fernando Valley", format: "discussion", notes: "Online. Open secular discussion" },
  { name: "Valley Club (Topic Discussion)", type: "aa", day: "monday", time: "7:00 AM", city: "Northridge", format: "topic", notes: "Online (virtual)" },
  { name: "Eye Opener", type: "aa", day: "monday", time: "7:00 AM", address: "123 W. Windsor Rd", city: "Glendale", venue: "Windsor Club", format: "discussion", notes: "In-person. Wheelchair accessible" },
  { name: "A Gathering of Men", type: "aa", day: "monday", time: "7:15 AM", address: "11042 Ventura Blvd", city: "Studio City", venue: "Residuals Tavern", format: "discussion", notes: "In-person. Closed men's discussion" },
  { name: "First Things First", type: "aa", day: "monday", time: "8:00 AM", address: "21338 Dumetz Rd", city: "Woodland Hills", venue: "Community Church", format: "book_study", notes: "Women's meeting. Closed 12&12 study" },
  { name: "The Steppers!", type: "aa", day: "monday", time: "9:00 AM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "step_study", notes: "Hybrid. Step & Tradition study" },
  { name: "Good Morning Participation", type: "aa", day: "monday", time: "9:00 AM", address: "12355 Moorpark St", city: "Studio City", venue: "Unitarian Univ. Church", format: "participation", notes: "Open participation/discussion" },
  { name: "Zaddies & Addies", type: "aa", day: "monday", time: "1:30 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "book_study", notes: "LGBTQ+ literature meeting (hybrid)" },
  { name: "Men's Stag (Hole in the Sky)", type: "aa", day: "monday", time: "6:00 PM", address: "21520 Sherman Way", city: "Canoga Park", format: "discussion", notes: "Men's discussion. Men only" },
  { name: "The Fix", type: "aa", day: "monday", time: "6:00 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "discussion", notes: "Hybrid. Open discussion" },
  { name: "Bad Girls Club", type: "aa", day: "monday", time: "7:00 PM", address: "12020 Burbank Blvd", city: "North Hollywood", venue: "Adat Ari El", format: "book_study", notes: "Closed women's Big Book meeting. Women only" },
  { name: "Encino Hills Speaker", type: "aa", day: "monday", time: "7:00 PM", address: "14115 Magnolia Blvd", city: "Sherman Oaks", venue: "Church of the Chimes", format: "speaker", notes: "Hybrid. Speaker meeting" },
  { name: "LGBTQIA Our History & Sobriety", type: "aa", day: "monday", time: "7:00 PM", city: "San Fernando Valley", format: "discussion", notes: "Online. LGBTQ+ discussion" },
  { name: "Young Zombies (Young People's)", type: "aa", day: "monday", time: "7:30 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "discussion", notes: "Young People's discussion. Speaker meeting" },
  { name: "Prime Time Women's Solution", type: "aa", day: "monday", time: "7:30 PM", address: "14401 Dickens St", city: "Sherman Oaks", venue: "United Methodist", format: "discussion", notes: "Open women's discussion. Women only" },
  { name: "Unit A - LGBTQ+ Living in the Solution", type: "aa", day: "monday", time: "8:00 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "discussion", notes: "Open LGBTQ+ meeting. Hybrid" },
  { name: "Wrecked to Checked", type: "aa", day: "monday", time: "8:30 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "speaker", notes: "Hybrid. Open discussion & speaker" },
  { name: "Radford Zombies", type: "aa", day: "monday", time: "10:00 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "speaker", notes: "Hybrid. Late-night discussion & speaker" },
];

const naMeetings = [
  // Sunday NA
  { name: "Freewheelers Gratitude", type: "na", day: "sunday", time: "9:00 AM", city: "Northridge", format: "discussion", notes: "Virtual meeting" },
  { name: "Gratitude Meeting", type: "na", day: "sunday", time: "10:00 AM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "speaker", notes: "Hybrid. 1.5 hr" },
  { name: "Keep It Simple", type: "na", day: "sunday", time: "12:15 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "discussion", notes: "Open meeting. Wheelchair accessible" },
  { name: "New Connections", type: "na", day: "sunday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open beginners/discussion" },
  { name: "Step Into the Solution", type: "na", day: "sunday", time: "7:00 PM", city: "Van Nuys", format: "step_study", notes: "Virtual. Open literature/step study" },
  { name: "The Hope Room", type: "na", day: "sunday", time: "7:00 PM", city: "Burbank", format: "speaker", notes: "Virtual. Open speaker meeting. Wheelchair accessible" },
  { name: "We Came to Believe", type: "na", day: "sunday", time: "7:00 PM", address: "9650 Reseda Blvd", city: "Northridge", venue: "UM Church", format: "discussion", notes: "Fireside Room. Open discussion. Wheelchair accessible" },
  { name: "The Spirit of St. Joe's", type: "na", day: "sunday", time: "7:30 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "speaker", notes: "Open speaker meeting. Wheelchair accessible, no smoking" },

  // Monday NA
  { name: "Pass Avenue Monday", type: "na", day: "monday", time: "12:00 PM", address: "4301 Cahuenga Blvd", city: "Toluca Lake", venue: "Harmony Church", format: "discussion", notes: "Open discussion. WC" },
  { name: "New Connections", type: "na", day: "monday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open beginners/discussion" },
  { name: "Virtual Recovery in the Varrio", type: "na", day: "monday", time: "6:00 PM", city: "San Fernando", format: "speaker", notes: "Virtual. Open discussion/speaker. WC" },
  { name: "A Monday Night Meeting", type: "na", day: "monday", time: "7:00 PM", address: "11134 Sepulveda Blvd", city: "Mission Hills", format: "discussion", notes: "Open discussion. No children, WC, no smoking" },
  { name: "Gift of Desperation", type: "na", day: "monday", time: "7:00 PM", address: "4301 Cahuenga Blvd", city: "Toluca Lake", venue: "Harmony Church", format: "book_study", notes: "SPAD reading meeting (Spiritual Principle a Day)" },
  { name: "Messengers", type: "na", day: "monday", time: "7:00 PM", address: "14518 Arminta St", city: "Panorama City", venue: "Messengers of Recovery Clubhouse", format: "discussion", notes: "Open discussion. No smoking. Speaker last Monday" },
  { name: "Healing by the Hills", type: "na", day: "monday", time: "7:30 PM", address: "16651 Rinaldi St", city: "Granada Hills", venue: "St. Andrews Church", format: "discussion", notes: "Open discussion. WC, no smoking; speaker last Monday" },

  // Tuesday NA
  { name: "Groovy Tuesday", type: "na", day: "tuesday", time: "12:15 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "discussion", notes: "Open beginners/discussion. WC" },
  { name: "Just Stay (Women's)", type: "na", day: "tuesday", time: "7:00 PM", address: "14401 Dickens St", city: "Sherman Oaks", venue: "United Methodist Church", format: "discussion", notes: "Hybrid. Open women's discussion. Women only" },
  { name: "Our Journey Continues", type: "na", day: "tuesday", time: "7:00 PM", city: "Mission Hills", format: "discussion", notes: "Virtual. Open discussion. Women only, no children, WC" },
  { name: "Tuesday Night Solutions", type: "na", day: "tuesday", time: "7:00 PM", address: "5730 Cahuenga Blvd", city: "North Hollywood", format: "discussion", notes: "Hybrid. Open discussion. WC" },
  { name: "Basic Training", type: "na", day: "tuesday", time: "7:30 PM", address: "10650 Reseda Blvd", city: "Porter Ranch", venue: "New Life Church of Nazarene", format: "discussion", notes: "Open discussion. Young people" },

  // Wednesday NA
  { name: "New Life Noon", type: "na", day: "wednesday", time: "12:00 PM", city: "Northridge", format: "discussion", notes: "Virtual. Open discussion. WC" },
  { name: "Pass Avenue Living the Dream", type: "na", day: "wednesday", time: "12:00 PM", city: "North Hollywood", format: "discussion", notes: "Virtual. Open discussion. Just for Today, WC, no smoking" },
  { name: "Wednesday Night Wisdom", type: "na", day: "wednesday", time: "6:15 PM", address: "5056 Van Nuys Blvd", city: "Sherman Oaks", venue: "East Valley Adult Center", format: "book_study", notes: "Open literature study. BK, WC" },
  { name: "Recovery on the Rock", type: "na", day: "wednesday", time: "7:00 PM", address: "9901 Tujunga Canyon Blvd", city: "Tujunga", venue: "Fireside Room", format: "speaker", notes: "Open speaker/step study. WC, no smoking" },
  { name: "SFV Book Study", type: "na", day: "wednesday", time: "7:00 PM", address: "14518 Arminta St", city: "Panorama City", venue: "Messengers Clubhouse", format: "book_study", notes: "Open book study. BK, LC" },
  { name: "W.A.R. (Women And Recovery)", type: "na", day: "wednesday", time: "7:00 PM", city: "Van Nuys", format: "discussion", notes: "Virtual. Open women's discussion. Meditation, child-friendly. Women only" },
  { name: "The Old Archwood", type: "na", day: "wednesday", time: "7:30 PM", address: "11430 Chandler Blvd", city: "North Hollywood", venue: "NoHo Senior Center", format: "speaker", notes: "Open speaker meeting. WC" },

  // Thursday NA
  { name: "Hi Noon", type: "na", day: "thursday", time: "12:15 PM", address: "10901 Victory Blvd", city: "North Hollywood", venue: "Victorio's Ristorante", format: "discussion", notes: "Open discussion. WC, no smoking" },
  { name: "Alive and Free", type: "na", day: "thursday", time: "6:30 PM", address: "9901 Tujunga Canyon Blvd", city: "Tujunga", format: "discussion", notes: "Open discussion. Horseshoe lot, downstairs. Tr" },
  { name: "Stay Alive in 45", type: "na", day: "thursday", time: "6:30 PM", address: "12121 Balboa Blvd", city: "Granada Hills", venue: "Knollwood UM Church", format: "speaker", notes: "Speaker meeting. 45 min" },
  { name: "Lamplighter", type: "na", day: "thursday", time: "7:30 PM", address: "21520 Sherman Way", city: "Canoga Park", venue: "Hole in the Sky", format: "speaker", notes: "Open discussion/speaker" },
  { name: "Woman Warriors of Recovery", type: "na", day: "thursday", time: "7:30 PM", address: "11134 Sepulveda Blvd", city: "Mission Hills", format: "topic", notes: "No children. Women's topic meeting. WC. Women only" },
  { name: "Recovery in the Varrio", type: "na", day: "thursday", time: "7:45 PM", address: "16651 Rinaldi St", city: "Granada Hills", venue: "St. Andrew & St. Charles Church", format: "discussion", notes: "Open discussion. WC, no smoking" },

  // Friday NA
  { name: "Pass Avenue Friday", type: "na", day: "friday", time: "12:00 PM", address: "4301 Cahuenga Blvd", city: "Toluca Lake", venue: "Harmony Toluca Lake Church", format: "discussion", notes: "Open discussion. WC, no smoking" },
  { name: "All In An Hour", type: "na", day: "friday", time: "7:15 PM", address: "11430 Chandler Blvd", city: "North Hollywood", venue: "NoHo Park Senior Center", format: "discussion", notes: "Open meeting. WC, young people, no smoking" },
  { name: "Men's Meeting", type: "na", day: "friday", time: "7:30 PM", address: "9440 Balboa Blvd", city: "Northridge", venue: "Prince of Peace Church", format: "discussion", notes: "Open men's discussion. WC. Men only" },
  { name: "Share and Care", type: "na", day: "friday", time: "7:30 PM", address: "6425 Tyrone Ave", city: "Van Nuys", venue: "Central Lutheran Church", format: "topic", notes: "Open topic. Candlelight, no smoking" },
  { name: "Warriors", type: "na", day: "friday", time: "8:00 PM", address: "11455 Chandler Blvd", city: "North Hollywood", venue: "Chandler Lodge", format: "discussion", notes: "Open discussion" },

  // Saturday NA
  { name: "Progressive Jackpot", type: "na", day: "saturday", time: "7:45 AM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open discussion. WC, no smoking" },
  { name: "The Last Batch", type: "na", day: "saturday", time: "10:30 AM", address: "8956 Vanalden Ave", city: "Northridge", venue: "Vanalden Park", format: "discussion", notes: "Open meeting. WC, outdoors" },
  { name: "Living Clean Book Study", type: "na", day: "saturday", time: "12:00 PM", city: "North Hollywood", format: "book_study", notes: "Virtual. Open Living Clean study. WC, LC" },
  { name: "Ain't MisBehavin'", type: "na", day: "saturday", time: "12:15 PM", city: "Van Nuys", format: "discussion", notes: "Virtual. Open discussion. WC, no smoking" },
  { name: "Spirit of NA", type: "na", day: "saturday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open discussion. WC" },
  { name: "Paradise Meeting", type: "na", day: "saturday", time: "6:00 PM", address: "6425 Tyrone Ave", city: "Van Nuys", venue: "Central Lutheran Church", format: "speaker", notes: "Open discussion/speaker. WC" },
  { name: "Where It All Began", type: "na", day: "saturday", time: "7:00 PM", address: "10803 Cantara St", city: "Sun Valley", format: "speaker", notes: "Speaker meeting" },
  { name: "Keep It Simple", type: "na", day: "saturday", time: "7:30 PM", address: "11134 Sepulveda Blvd", city: "Mission Hills", format: "discussion", notes: "Open discussion" },
  { name: "Always An Option", type: "na", day: "saturday", time: "8:00 PM", address: "11455 Chandler Blvd", city: "North Hollywood", venue: "Chandler Lodge", format: "speaker", notes: "Open discussion/speaker. WC" },
  { name: "Saturday Night Live", type: "na", day: "saturday", time: "8:00 PM", address: "5353 Denny Ave", city: "North Hollywood", format: "discussion", notes: "Open discussion. WC" },
  { name: "Tujunga Candlelite", type: "na", day: "saturday", time: "9:00 PM", address: "9901 Tujunga Canyon Blvd", city: "Tujunga", venue: "Youth Room", format: "discussion", notes: "Open candlelight discussion. WC" },
];

const cmaMeetings = [
  { name: "Monday Monsters", type: "cma", day: "monday", time: "7:00 PM", address: "14718 Keswick St", city: "Van Nuys", venue: "Innovate Recovery", format: "speaker", notes: "In-person. LGBTQ-friendly, newcomer welcome, speaker format" },
];

const smartMeetings = [
  { name: "SMART Recovery (Simi Valley)", type: "smart", day: "saturday", time: "7:00 PM", address: "3855 Alamo St", city: "Simi Valley", venue: "Kaiser Permanente Mental Health Center", format: "discussion", notes: "In-person 4-Point Recovery meeting. Adults welcome. 7-8:30 PM" },
  { name: "SMART Recovery Los Angeles", type: "smart", day: "tuesday", time: "7:00 PM", address: "2535 W Temple St", city: "Los Angeles", venue: "Center for Inquiry", format: "discussion", notes: "In-person meeting. General SMART 4-Point program. Proof of vaccination required" },
];

async function importMeetings() {
  console.log("🏛️  Importing AA/NA/CMA/SMART Recovery Meetings\\n");

  const allMeetings = [...aaMeetings, ...naMeetings, ...cmaMeetings, ...smartMeetings];
  console.log(`Total meetings to import: ${allMeetings.length}\\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const meeting of allMeetings) {
    try {
      const tags = parseTags(meeting.format, meeting.notes || "");
      const meetingMode = getMeetingMode(meeting.notes || "");
      const format = getFormat(meeting.format);

      await db.insert(meetings).values({
        name: meeting.name,
        type: meeting.type,
        dayOfWeek: meeting.day,
        time: meeting.time,
        venueName: (meeting as any).venue || null,
        address: (meeting as any).address || null,
        city: meeting.city,
        format: format,
        meetingMode: meetingMode,
        tags: JSON.stringify(tags),
        language: "en",
        description: `${meeting.type.toUpperCase()} ${format} meeting`,
        notes: meeting.notes,
        isVerified: 1,
        isPublished: 1,
      });

      console.log(`✅ ${meeting.name}`);
      console.log(`   ${meeting.day} ${meeting.time} | ${meeting.city} | ${meeting.type.toUpperCase()}\\n`);
      imported++;

    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`⏭️  Skipped (already exists): ${meeting.name}\\n`);
        skipped++;
      } else {
        console.error(`❌ Error importing ${meeting.name}:`, error.message);
        errors++;
      }
    }
  }

  console.log("\\n" + "=".repeat(60));
  console.log(`\\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${allMeetings.length}`);
  console.log("\\n✨ Recovery meetings import complete!");
  console.log("\\nℹ️  Note: This is a sample of meetings from the PDF.");
  console.log("   Full dataset contains 200+ AA meetings + 60+ NA meetings.");

  client.close();
}

importMeetings();
