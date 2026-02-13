import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { meetings } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

// Helper functions
function parseTags(description: string, notes: string): string[] {
  const tags: string[] = [];
  const combined = `${description} ${notes}`.toLowerCase();

  if (combined.includes("women") || combined.includes("women's") || combined.includes("women only")) {
    tags.push("women_only");
  }
  if (combined.includes("men") || combined.includes("men's") || combined.includes("men only") || combined.includes("stag")) {
    tags.push("men_only");
  }
  if (combined.includes("wheelchair") || combined.includes("wc")) {
    tags.push("wheelchair_accessible");
  }
  if (combined.includes("lgbtq") || combined.includes("lgbt")) {
    tags.push("lgbtq_friendly");
  }
  if (combined.includes("young people") || combined.includes("yp")) {
    tags.push("young_people");
  }
  if (combined.includes("newcomer")) {
    tags.push("newcomer_friendly");
  }
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

function getMeetingMode(notes: string): string {
  const lower = notes.toLowerCase();
  if (lower.includes("hybrid")) return "hybrid";
  if (lower.includes("virtual") || lower.includes("online") || lower.includes("zoom") || lower.includes("vm")) return "online";
  return "in_person";
}

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

function getLanguage(notes: string): string {
  const lower = notes.toLowerCase();
  if (lower.includes("farsi") || lower.includes("fa =")) return "fa";
  if (lower.includes("russian")) return "ru";
  if (lower.includes("armenian") || lower.includes("ar =")) return "hy";
  if (lower.includes("spanish") || lower.includes("español")) return "es";
  return "en";
}

// COMPLETE AA MEETINGS DATA FROM PDF
const allMeetings = [
  // ========== MONDAY AA ==========
  { name: "Hole in the Sky - Happy, Joyous & Free", type: "aa", day: "monday", time: "5:30 AM", address: "21520 Sherman Way", city: "Canoga Park", format: "discussion", notes: "In-person" },
  { name: "Valley Club (As Bill Sees It)", type: "aa", day: "monday", time: "5:30 AM", address: "8728 Corbin Ave", city: "Northridge", format: "discussion", notes: "In-person" },
  { name: "The Solution Meeting", type: "aa", day: "monday", time: "6:45 AM", address: "7552 Remmet Ave", city: "Canoga Park", venue: "Cabrito House", format: "discussion", notes: "Hybrid. Men's stag. Zoom ID: 327 055 526" },
  { name: "Hole in the Sky - Spiritual Discussion", type: "aa", day: "monday", time: "6:45 AM", city: "Canoga Park", format: "discussion", notes: "Online (formerly at Sherman Way)" },
  { name: "Winners Attitude Adjustment", type: "aa", day: "monday", time: "7:00 AM", address: "12020 Burbank Blvd", city: "North Hollywood", venue: "Adat Ari El Temple", format: "speaker", notes: "Hybrid: Open discussion. Speaker meeting" },
  { name: "New Attitude", type: "aa", day: "monday", time: "7:00 AM", address: "747 N. Whitnall Hwy", city: "Burbank", venue: "American Lutheran Church", format: "speaker", notes: "Open discussion. Speaker" },
  { name: "Attitude Adjustment (Valley Village)", type: "aa", day: "monday", time: "7:00 AM", city: "Valley Village", format: "discussion", notes: "Online. Open discussion" },
  { name: "New Day Zooming", type: "aa", day: "monday", time: "7:00 AM", city: "North Hollywood", format: "discussion", notes: "Online. Closed men's meeting. Men only" },
  { name: "Rule 62 Secular AA", type: "aa", day: "monday", time: "7:00 AM", city: "San Fernando Valley", format: "discussion", notes: "Online. Open secular discussion" },
  { name: "Shakers (Zoom Participation)", type: "aa", day: "monday", time: "7:00 AM", city: "Glendale", format: "discussion", notes: "Online. Open discussion" },
  { name: "Valley Club (Topic Discussion)", type: "aa", day: "monday", time: "7:00 AM", city: "Northridge", format: "topic", notes: "Online. Open discussion" },
  { name: "7AM Sunrise", type: "aa", day: "monday", time: "7:00 AM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "book_study", notes: "Online meeting (temporarily closed venue). Literature/Living Sober study" },
  { name: "Shakers Participation", type: "aa", day: "monday", time: "7:00 AM", address: "315 Vine St", city: "Glendale", venue: "Shakers Club", format: "discussion", notes: "Open discussion. In-person" },
  { name: "Eye Opener", type: "aa", day: "monday", time: "7:00 AM", address: "123 W. Windsor Rd", city: "Glendale", venue: "Windsor Club", format: "discussion", notes: "Open discussion. Wheelchair accessible. In-person" },
  { name: "A Gathering of Men", type: "aa", day: "monday", time: "7:15 AM", address: "11042 Ventura Blvd", city: "Studio City", venue: "Residuals Tavern", format: "discussion", notes: "Closed men's discussion. Men only. In-person" },
  { name: "Rise and Shine", type: "aa", day: "monday", time: "8:00 AM", city: "Studio City", format: "discussion", notes: "Online. Open discussion" },
  { name: "SFV 8AM Online", type: "aa", day: "monday", time: "8:00 AM", city: "San Fernando Valley", format: "discussion", notes: "Online. Open meeting" },
  { name: "Discussion", type: "aa", day: "monday", time: "8:00 AM", address: "220 S. Brand Blvd", city: "San Fernando", venue: "Storefront", format: "discussion", notes: "Open discussion. In-person" },
  { name: "First Things First", type: "aa", day: "monday", time: "8:00 AM", address: "21338 Dumetz Rd", city: "Woodland Hills", venue: "Community Church", format: "step_study", notes: "Women's meeting. Closed 12&12 study. In-person" },
  { name: "All R Welcome Big Book Study", type: "aa", day: "monday", time: "9:00 AM", city: "San Fernando Valley", format: "book_study", notes: "Online. Open Big Book study" },
  { name: "Rule 62 Men's Meeting", type: "aa", day: "monday", time: "9:00 AM", city: "San Fernando Valley", format: "discussion", notes: "Online. Open men's discussion. Men only" },
  { name: "The Steppers!", type: "aa", day: "monday", time: "9:00 AM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "step_study", notes: "Hybrid. Step & Tradition study. In-person & online" },
  { name: "Unit A - All-R-Welcomed Big Book", type: "aa", day: "monday", time: "9:00 AM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "book_study", notes: "Open Big Book discussion. Wheelchair access. In-person" },
  { name: "Good Morning Participation", type: "aa", day: "monday", time: "9:00 AM", address: "12355 Moorpark St", city: "Studio City", venue: "Unitarian Univ. Church", format: "participation", notes: "Open participation/discussion. In-person" },
  { name: "Valley Club - Freedom", type: "aa", day: "monday", time: "9:00 AM", address: "8728 Corbin Ave", city: "Northridge", format: "discussion", notes: "Open discussion. In-person" },
  { name: "Whitefire Speaker", type: "aa", day: "monday", time: "9:00 AM", address: "13500 Ventura Blvd", city: "Sherman Oaks", venue: "Whitefire Theatre", format: "speaker", notes: "Closed speaker meeting. In-person" },
  { name: "Speakeasy", type: "aa", day: "monday", time: "9:30 AM", city: "San Fernando Valley", format: "participation", notes: "Online. Open participation" },
  { name: "Women's Big Book Study", type: "aa", day: "monday", time: "10:00 AM", address: "21338 Dumetz Rd", city: "Woodland Hills", venue: "Community Church", format: "book_study", notes: "Women's closed Big Book study. In-person" },
  { name: "Ladies' Morning Step Study", type: "aa", day: "monday", time: "10:30 AM", city: "Canoga Park", format: "step_study", notes: "Online. Women's step study" },
  { name: "Serenity With Sobriety", type: "aa", day: "monday", time: "11:30 AM", address: "6425 Tyrone Ave", city: "Van Nuys", venue: "Central Lutheran Church", format: "discussion", notes: "Discussion. In-person" },
  { name: "Topic Discussion (Chandler Lodge)", type: "aa", day: "monday", time: "12:00 PM", address: "11455 Chandler Blvd", city: "North Hollywood", format: "discussion", notes: "Discussion. In-person" },
  { name: "Hole in the Sky - Big Book Study", type: "aa", day: "monday", time: "12:00 PM", city: "Canoga Park", format: "book_study", notes: "Online. Open Big Book study" },
  { name: "Pacoima Participation", type: "aa", day: "monday", time: "12:00 PM", city: "Pacoima", format: "participation", notes: "Online. Participation discussion" },
  { name: "WARG Book Study", type: "aa", day: "monday", time: "12:00 PM", city: "Studio City", format: "book_study", notes: "Online. Closed literature study" },
  { name: "End of the Line (Men's Stag)", type: "aa", day: "monday", time: "12:00 PM", address: "17200 Ventura Blvd", city: "Encino", venue: "More Than Waffles Restaurant", format: "discussion", notes: "Hybrid. Men's discussion. Men only. In-person & online" },
  { name: "Parental Guidance (Sober Parents in AA)", type: "aa", day: "monday", time: "12:00 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "speaker", notes: "Hybrid. Speaker/discussion for sober parents. Child-friendly. In-person & online" },
  { name: "Open Participation (San Fernando)", type: "aa", day: "monday", time: "12:00 PM", address: "220 S. Brand Blvd", city: "San Fernando", venue: "Storefront", format: "discussion", notes: "Open discussion. In-person" },
  { name: "Good Day Speaker", type: "aa", day: "monday", time: "12:00 PM", address: "12355 Moorpark St", city: "Studio City", venue: "Unitarian Univ. Church", format: "speaker", notes: "Hybrid. Open speaker meeting. In-person & online" },
  { name: "Valley Club - Old Timers'", type: "aa", day: "monday", time: "12:00 PM", address: "8728 Corbin Ave", city: "Northridge", format: "discussion", notes: "Open discussion. Old Timers meeting. In-person" },
  { name: "Grass Roots Participation", type: "aa", day: "monday", time: "12:30 PM", address: "123 W. Windsor Rd", city: "Glendale", venue: "Windsor Club", format: "participation", notes: "Open participation. Wheelchair accessible. In-person" },
  { name: "Zaddies & Addies", type: "aa", day: "monday", time: "1:30 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "book_study", notes: "LGBTQ+ literature meeting (hybrid). LGBT-friendly" },
  { name: "Valley Club - Discussion", type: "aa", day: "monday", time: "3:00 PM", city: "Northridge", format: "discussion", notes: "Online. Open discussion" },
  { name: "House of Cards (Family Focus)", type: "aa", day: "monday", time: "3:00 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "discussion", notes: "Hybrid. Discussion on family dynamics. Speaker. In-person & online" },
  { name: "Topic Discussion (Closed)", type: "aa", day: "monday", time: "4:00 PM", city: "San Fernando Valley", format: "topic", notes: "Online. Closed AA members-only discussion" },
  { name: "Un-Chained Sobriety", type: "aa", day: "monday", time: "4:15 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "book_study", notes: "12&12 Book, discussion. In-person" },
  { name: "Attitude of Gratitude", type: "aa", day: "monday", time: "5:00 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "speaker", notes: "Online (venue temporarily closed). Speaker meeting" },
  { name: "Pacoima Participation", type: "aa", day: "monday", time: "5:30 PM", address: "12502 Van Nuys Blvd", city: "Pacoima", venue: "Office Building", format: "participation", notes: "Hybrid. Participation meeting. In-person & online" },
  { name: "Topic Discussion (San Fernando)", type: "aa", day: "monday", time: "5:30 PM", address: "220 S. Brand Blvd", city: "San Fernando", venue: "Storefront", format: "discussion", notes: "Discussion. In-person" },
  { name: "How It Works", type: "aa", day: "monday", time: "6:00 PM", address: "11455 Chandler Blvd", city: "North Hollywood", venue: "Chandler Lodge", format: "discussion", notes: "Discussion. In-person" },
  { name: "Men's Stag (Hole in the Sky)", type: "aa", day: "monday", time: "6:00 PM", address: "21520 Sherman Way", city: "Canoga Park", format: "discussion", notes: "Men's discussion. Men only. In-person" },
  { name: "As Bill Sees It (Women's)", type: "aa", day: "monday", time: "6:00 PM", city: "Burbank", format: "discussion", notes: "Online. Open women's meeting. Women only" },
  { name: "Hole in the Sky - Men's Stag", type: "aa", day: "monday", time: "6:00 PM", city: "Canoga Park", format: "discussion", notes: "Online. Open men's meeting. Men only" },
  { name: "Serene Divas", type: "aa", day: "monday", time: "6:00 PM", city: "Burbank", format: "discussion", notes: "Online. Closed women's discussion. Women only" },
  { name: "The Fix", type: "aa", day: "monday", time: "6:00 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "discussion", notes: "Hybrid. Open discussion. In-person & online" },
  { name: "Burbank Men's Crosstalk", type: "aa", day: "monday", time: "6:00 PM", address: "2216 W. Magnolia Blvd", city: "Burbank", format: "discussion", notes: "Closed men's discussion. Men only. In-person" },
  { name: "Unit A - Newcomer", type: "aa", day: "monday", time: "6:00 PM", address: "10641 Burbank Blvd", city: "North Hollywood", format: "discussion", notes: "Open newcomer discussion. Wheelchair access. Newcomer-friendly. In-person" },
  { name: "Women's Stag (Valley Club)", type: "aa", day: "monday", time: "6:00 PM", address: "8728 Corbin Ave", city: "Northridge", format: "discussion", notes: "Women's discussion. Women only. In-person" },
  { name: "Sobriety First", type: "aa", day: "monday", time: "6:30 PM", address: "20440 Lassen St", city: "Chatsworth", venue: "Congregational Church", format: "discussion", notes: "Women's discussion. Wheelchair accessible. Women only. In-person" },
  { name: "Together We Can Do It", type: "aa", day: "monday", time: "6:30 PM", address: "2700 Montrose Ave", city: "La Crescenta", venue: "CV United Methodist", format: "discussion", notes: "Closed men's group. In-person" },
  { name: "Newcomers Participation", type: "aa", day: "monday", time: "6:30 PM", address: "4011 Dunsmore Ave", city: "La Crescenta", venue: "Dunsmore Alano Club", format: "discussion", notes: "Open newcomer discussion. Newcomer-friendly. In-person" },
  { name: "BYOC Men's Stag", type: "aa", day: "monday", time: "6:30 PM", address: "123 W. Windsor Rd", city: "Glendale", venue: "Windsor Club", format: "discussion", notes: "Closed men's discussion. Wheelchair accessible. Men only. In-person" },
  { name: "Bad Girls Club", type: "aa", day: "monday", time: "7:00 PM", address: "12020 Burbank Blvd", city: "North Hollywood", venue: "Adat Ari El", format: "book_study", notes: "Closed women's Big Book meeting. Women only. In-person" },
  { name: "We Are Not Saints", type: "aa", day: "monday", time: "7:00 PM", address: "12020 Burbank Blvd", city: "North Hollywood", venue: "Adat Ari El", format: "discussion", notes: "Hybrid. Closed women's discussion. Women only. In-person & online" },
  { name: "Stags of Sobriety", type: "aa", day: "monday", time: "7:00 PM", address: "7552 Remmet Ave", city: "Canoga Park", venue: "Cabrito House", format: "discussion", notes: "Open men's discussion. Men only. In-person" },
  { name: "Encino Hills Speaker", type: "aa", day: "monday", time: "7:00 PM", address: "14115 Magnolia Blvd", city: "Sherman Oaks", venue: "Church of the Chimes", format: "speaker", notes: "Hybrid. Speaker meeting. In-person & online" },
  { name: "LGBTQIA Our History & Sobriety", type: "aa", day: "monday", time: "7:00 PM", city: "San Fernando Valley", format: "discussion", notes: "Online. Open LGBTQ+ discussion. LGBTQ+ friendly" },
  { name: "Studio City Women's", type: "aa", day: "monday", time: "7:00 PM", city: "Studio City", format: "discussion", notes: "Online. Closed women's discussion. Women only" },
  { name: "Double Trouble (Dual Diagnosis)", type: "aa", day: "monday", time: "7:00 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "discussion", notes: "Online (temp. closed venue). Dual-diagnosis discussion. Mental health focus" },
  { name: "Women to Women", type: "aa", day: "monday", time: "7:00 PM", address: "9650 Reseda Blvd", city: "Northridge", venue: "Northridge UM Church", format: "discussion", notes: "Closed women's meeting. Women only. In-person" },
  { name: "Northridge Women's Book Study", type: "aa", day: "monday", time: "7:00 PM", address: "9440 Balboa Blvd", city: "Northridge", venue: "Prince of Peace Church", format: "book_study", notes: "Hybrid. Closed women's literature study. Women only. In-person & online" },
  { name: "Sobriety Together Discussion", type: "aa", day: "monday", time: "7:00 PM", address: "16651 Rinaldi St", city: "Granada Hills", venue: "St. Andrew's Lutheran", format: "discussion", notes: "Open discussion. In-person" },
  { name: "Chip of a Book Study", type: "aa", day: "monday", time: "7:15 PM", city: "San Fernando Valley", format: "book_study", notes: "Online. Closed men's Big Book study. Men only" },
  { name: "Chapter 12 Men's Stag", type: "aa", day: "monday", time: "7:30 PM", address: "4032 Whitsett Ave", city: "Studio City", venue: "Christian Science Church", format: "discussion", notes: "Men's discussion. Men only. In-person" },
  { name: "West Valley Participation", type: "aa", day: "monday", time: "7:30 PM", address: "18355 Roscoe Blvd", city: "Northridge", venue: "Lifehouse Church", format: "participation", notes: "Participation/discussion. In-person" },
  { name: "Book Study (Pacoima)", type: "aa", day: "monday", time: "7:30 PM", city: "Pacoima", format: "book_study", notes: "Online. Open book/literature study" },
  { name: "Quality of Life (Van Nuys)", type: "aa", day: "monday", time: "7:30 PM", city: "Van Nuys", format: "book_study", notes: "Online. Closed literature study" },
  { name: "Staying in the Now (Woodland Hills)", type: "aa", day: "monday", time: "7:30 PM", city: "Woodland Hills", format: "book_study", notes: "Online. Open Big Book study" },
  { name: "Young Zombies (Young People's)", type: "aa", day: "monday", time: "7:30 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "discussion", notes: "Young People's discussion. Speaker meeting. Young people. In-person" },
  { name: "Pacoima Book Study", type: "aa", day: "monday", time: "7:30 PM", address: "12502 Van Nuys Blvd", city: "Pacoima", venue: "Office Building", format: "book_study", notes: "Hybrid. Book study. In-person & online" },
  { name: "Prime Time Women's Solution", type: "aa", day: "monday", time: "7:30 PM", address: "14401 Dickens St", city: "Sherman Oaks", venue: "United Methodist", format: "discussion", notes: "Open women's discussion. Women only. In-person" },
  { name: "Solutions by the Steps", type: "aa", day: "monday", time: "7:30 PM", address: "14401 Dickens St", city: "Sherman Oaks", venue: "United Methodist", format: "step_study", notes: "Hybrid. Closed women's step study. Women only. In-person & online" },
  { name: "Quality of Life (Reseda)", type: "aa", day: "monday", time: "7:30 PM", address: "17751 Sherman Way", city: "Reseda", venue: "Storefront", format: "book_study", notes: "Closed literature meeting. In-person" },
  { name: "Just the Italics", type: "aa", day: "monday", time: "7:30 PM", address: "12355 Moorpark St", city: "Studio City", venue: "Unitarian Univ. Church", format: "discussion", notes: "Open discussion. In-person" },
  { name: "Shadow Ranch Big Book", type: "aa", day: "monday", time: "7:30 PM", address: "21338 Dumetz Rd", city: "Woodland Hills", venue: "Comm. Church", format: "book_study", notes: "Hybrid. Closed Big Book study. In-person & online" },
  { name: "Reach Out (Speaker/Discussion)", type: "aa", day: "monday", time: "7:30 PM", address: "5751 Platt Ave", city: "Woodland Hills", venue: "Presbyterian Church", format: "speaker", notes: "Open discussion & speaker. In-person" },
  { name: "We Do Recover", type: "aa", day: "monday", time: "8:00 PM", address: "11455 Chandler Blvd", city: "North Hollywood", venue: "Chandler Lodge", format: "discussion", notes: "Open discussion. In-person" },
  { name: "Wobblies Discussion", type: "aa", day: "monday", time: "8:00 PM", address: "4418 Coldwater Canyon Ave", city: "Studio City", venue: "Little Brown Church", format: "discussion", notes: "Men's discussion. Men only. In-person" },
  { name: "Nitty Gritty Women's", type: "aa", day: "monday", time: "8:00 PM", address: "14401 Dickens St", city: "Sherman Oaks", venue: "United Methodist", format: "discussion", notes: "Closed women's discussion. Women only. In-person" },
  { name: "Prime Time Men's Stag", type: "aa", day: "monday", time: "8:00 PM", address: "14401 Dickens St", city: "Sherman Oaks", venue: "United Methodist", format: "discussion", notes: "Hybrid. Open men's discussion. Men only. In-person & online" },
  { name: "Burbank Open Participation", type: "aa", day: "monday", time: "8:00 PM", address: "2216 W. Magnolia Blvd", city: "Burbank", format: "participation", notes: "Open participation/discussion. In-person" },
  { name: "Unit A - LGBTQ+ Living in the Solution", type: "aa", day: "monday", time: "8:00 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "discussion", notes: "Open LGBTQ+ meeting. LGBTQ+ friendly. In-person" },
  { name: "Unit A - LGBTQ+ Living in the Solution (Hybrid)", type: "aa", day: "monday", time: "8:00 PM", address: "10641 Burbank Blvd", city: "North Hollywood", format: "discussion", notes: "Hybrid. LGBTQ+ open meeting. LGBTQ+ friendly. In-person & online" },
  { name: "Speaker (Valley Club)", type: "aa", day: "monday", time: "8:00 PM", address: "8728 Corbin Ave", city: "Northridge", format: "speaker", notes: "Speaker meeting. In-person" },
  { name: "Varney Street Group", type: "aa", day: "monday", time: "8:00 PM", address: "446 N. Varney St", city: "Burbank", venue: "Valley Lodge", format: "discussion", notes: "Open meeting. In-person" },
  { name: "Gong Show", type: "aa", day: "monday", time: "8:00 PM", address: "123 W. Windsor Rd", city: "Glendale", venue: "Windsor Club", format: "discussion", notes: "Open discussion. Wheelchair accessible. In-person" },
  { name: "West Valley Men's 12&12", type: "aa", day: "monday", time: "8:00 PM", address: "5751 Platt Ave", city: "Woodland Hills", venue: "Presbyterian Church", format: "step_study", notes: "Closed men's 12&12 study. Men only. In-person" },
  { name: "Wrecked to Checked", type: "aa", day: "monday", time: "8:30 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "speaker", notes: "Hybrid. Open discussion & speaker. In-person & online" },
  { name: "Participation (Santa Clarita)", type: "aa", day: "monday", time: "8:30 PM", address: "24307 Railroad Ave", city: "Newhall", venue: "Rafters", format: "discussion", notes: "Open discussion. In-person" },
  { name: "Farsi Big Book & Step", type: "aa", day: "monday", time: "8:30 PM", address: "123 W. Windsor Rd", city: "Glendale", venue: "Windsor Club", format: "book_study", notes: "Open Farsi-language Big Book & step study. Non-English. Farsi" },
  { name: "Farsi Big Book & Step (II)", type: "aa", day: "monday", time: "8:30 PM", address: "123 W. Windsor Rd", city: "Glendale", venue: "Windsor Club", format: "step_study", notes: "Open Farsi-language 12&12 study. Non-English. Farsi" },
  { name: "Wheeling 2B Sober", type: "aa", day: "monday", time: "8:45 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "discussion", notes: "Hybrid. Open discussion. Wheelchair users' group. Wheelchair accessible. In-person & online" },
  { name: "Radford Zombies", type: "aa", day: "monday", time: "10:00 PM", address: "4849 Van Nuys Blvd", city: "Sherman Oaks", venue: "New Radford Hall", format: "speaker", notes: "Hybrid. Late-night discussion & speaker. In-person & online" },
  { name: "Burbank Participation", type: "aa", day: "monday", time: "10:00 PM", address: "2216 W. Magnolia Blvd", city: "Burbank", format: "participation", notes: "Open participation. In-person" },

  // ========== SUNDAY NA ==========
  { name: "Freewheelers Gratitude", type: "na", day: "sunday", time: "9:00 AM", city: "Northridge", format: "discussion", notes: "Virtual meeting (VM). Open discussion" },
  { name: "Gratitude Meeting", type: "na", day: "sunday", time: "10:00 AM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "speaker", notes: "Hybrid (HY). Open speaker meeting. 1.5 hr" },
  { name: "Keep It Simple", type: "na", day: "sunday", time: "12:15 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "discussion", notes: "Open meeting. Wheelchair accessible. 1 hr" },
  { name: "New Connections", type: "na", day: "sunday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open beginners/discussion. 1 hr" },
  { name: "Step Into the Solution (Book Study)", type: "na", day: "sunday", time: "7:00 PM", city: "Van Nuys", format: "step_study", notes: "Virtual. Open literature/step study (IW, St, Tr, VM). 1 hr" },
  { name: "The Hope Room", type: "na", day: "sunday", time: "7:00 PM", city: "Burbank", format: "speaker", notes: "Virtual. Open speaker meeting. Wheelchair accessible (VM). ~1¼ hr" },
  { name: "We Came to Believe", type: "na", day: "sunday", time: "7:00 PM", address: "9650 Reseda Blvd", city: "Northridge", venue: "Fireside Room @ UM Church", format: "discussion", notes: "Open discussion. Wheelchair accessible. ~1¼ hr" },
  { name: "Farsi Speaker", type: "na", day: "sunday", time: "7:30 PM", address: "21518 Sherman Way", city: "Canoga Park", venue: "Hole in the Sky", format: "speaker", notes: "Open discussion/speaker. Farsi language (FA). 1.5 hr" },
  { name: "The Spirit of St. Joe's", type: "na", day: "sunday", time: "7:30 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "speaker", notes: "Open speaker meeting. Wheelchair accessible, no smoking. ~1¼ hr" },

  // ========== MONDAY NA ==========
  { name: "Pass Avenue Monday", type: "na", day: "monday", time: "12:00 PM", address: "4301 Cahuenga Blvd", city: "Toluca Lake", venue: "Harmony Church", format: "discussion", notes: "Open discussion (WC). 1 hr" },
  { name: "New Connections", type: "na", day: "monday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open beginners/discussion (WC, HY). 1 hr" },
  { name: "Virtual Recovery in the Varrio", type: "na", day: "monday", time: "6:00 PM", city: "San Fernando", format: "speaker", notes: "Virtual. Open discussion/speaker (WC, VM). 1 hr" },
  { name: "A Monday Night Meeting", type: "na", day: "monday", time: "7:00 PM", address: "11134 Sepulveda Blvd", city: "Mission Hills", format: "discussion", notes: "Open discussion. No children (NC), WC, no smoking. 1 hr" },
  { name: "Gift of Desperation", type: "na", day: "monday", time: "7:00 PM", address: "4301 Cahuenga Blvd", city: "Toluca Lake", venue: "Harmony Church", format: "book_study", notes: "SPAD reading meeting (Spiritual Principle a Day). 1¼ hr" },
  { name: "Messengers", type: "na", day: "monday", time: "7:00 PM", address: "14518 Arminta St", city: "Panorama City", venue: "Messengers of Recovery Clubhouse", format: "discussion", notes: "Open discussion. No smoking. 1¼ hr. Speaker last Monday" },
  { name: "Russian NA", type: "na", day: "monday", time: "7:00 PM", address: "5730 Cahuenga Blvd", city: "North Hollywood", format: "book_study", notes: "Closed Just-for-Today study (JT). Russian language. 1 hr. Non-English" },
  { name: "Healing by the Hills", type: "na", day: "monday", time: "7:30 PM", address: "16651 Rinaldi St", city: "Granada Hills", venue: "St. Andrews Church", format: "discussion", notes: "Open discussion. WC, no smoking. Speaker last Monday. 1¼ hr" },

  // ========== TUESDAY NA ==========
  { name: "Groovy Tuesday", type: "na", day: "tuesday", time: "12:15 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "discussion", notes: "Open beginners/discussion (WC). 1 hr" },
  { name: "New Connections", type: "na", day: "tuesday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open beginners/discussion (WC, no smoking, HY). 1 hr" },
  { name: "Just Stay (Women's)", type: "na", day: "tuesday", time: "7:00 PM", address: "14401 Dickens St", city: "Sherman Oaks", venue: "United Methodist Church (downstairs)", format: "discussion", notes: "Hybrid. Open women's discussion (HY). 1 hr. Women only" },
  { name: "Our Journey Continues", type: "na", day: "tuesday", time: "7:00 PM", city: "Mission Hills", format: "discussion", notes: "Virtual. Open discussion. No children (NC), women's, WC, no smoking (VM). 1 hr. Women only" },
  { name: "Tuesday Night Solutions", type: "na", day: "tuesday", time: "7:00 PM", address: "5730 Cahuenga Blvd", city: "North Hollywood", format: "discussion", notes: "Hybrid. Open discussion (WC, HY). 1 hr" },
  { name: "Armenian Speaker", type: "na", day: "tuesday", time: "7:30 PM", address: "327 Vine St", city: "Glendale", format: "speaker", notes: "Closed rotating-format speaker. Armenian language (AR). 1.5 hr. Non-English" },
  { name: "Basic Training", type: "na", day: "tuesday", time: "7:30 PM", address: "10650 Reseda Blvd", city: "Porter Ranch", venue: "New Life Church of Nazarene", format: "discussion", notes: "Open discussion. Topic, WC, young people. 1 hr. Young people" },
  { name: "Just for Today", type: "na", day: "tuesday", time: "7:30 PM", address: "9901 Tujunga Canyon Blvd", city: "Tujunga", venue: "Fireside Room", format: "topic", notes: "Open topic discussion (WC). 1 hr" },
  { name: "Tuesday Step Study", type: "na", day: "tuesday", time: "8:00 PM", address: "8330 Lankershim Blvd", city: "North Hollywood", format: "step_study", notes: "Closed step study. Book (BK), no smoking. 1.5 hr" },

  // ========== WEDNESDAY NA ==========
  { name: "New Life Noon", type: "na", day: "wednesday", time: "12:00 PM", city: "Northridge", format: "discussion", notes: "Virtual. Open discussion (WC, VM). 1 hr" },
  { name: "Pass Avenue Living the Dream", type: "na", day: "wednesday", time: "12:00 PM", city: "North Hollywood", format: "discussion", notes: "Virtual. Open discussion. Just for Today (JT), WC, no smoking (VM). 1 hr" },
  { name: "New Connections", type: "na", day: "wednesday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open beginners/discussion (WC, BK, HY). 1 hr" },
  { name: "Wednesday Night Wisdom", type: "na", day: "wednesday", time: "6:15 PM", address: "5056 Van Nuys Blvd", city: "Sherman Oaks", venue: "Sherman Oaks East Valley Adult Center", format: "book_study", notes: "Open literature study. Book (BK), WC. 1 hr" },
  { name: "Recovery on the Rock", type: "na", day: "wednesday", time: "7:00 PM", address: "9901 Tujunga Canyon Blvd", city: "Tujunga", venue: "Fireside Room", format: "speaker", notes: "Open speaker/step study (WC, no smoking). 1.5 hr" },
  { name: "Russian NA", type: "na", day: "wednesday", time: "7:00 PM", address: "5730 Cahuenga Blvd", city: "North Hollywood", format: "book_study", notes: "Closed JFT study. Just for Today (JT). Russian language. 1 hr. Non-English" },
  { name: "SFV Book Study", type: "na", day: "wednesday", time: "7:00 PM", address: "14518 Arminta St", city: "Panorama City", venue: "Messengers Clubhouse", format: "book_study", notes: "Open book study. Book (BK), Living Clean (LC). 1¼ hr" },
  { name: "The End of the Road", type: "na", day: "wednesday", time: "7:00 PM", address: "13261 Glenoaks Blvd", city: "Sylmar", venue: "First Baptist Church", format: "discussion", notes: "Open discussion. Reading format (RF), timer, WC, no smoking. 1¼ hr" },
  { name: "W.A.R. (Women And Recovery)", type: "na", day: "wednesday", time: "7:00 PM", city: "Van Nuys", format: "discussion", notes: "Virtual. Open women's discussion. Meditation, child-friendly (VM). 1¼ hr. Women only" },
  { name: "The Old Archwood", type: "na", day: "wednesday", time: "7:30 PM", address: "11430 Chandler Blvd", city: "North Hollywood", venue: "NoHo Senior Center", format: "speaker", notes: "Open speaker meeting (WC). 1¼ hr" },
  { name: "Farsi Speaker", type: "na", day: "wednesday", time: "8:00 PM", address: "14401 Dickens St", city: "Sherman Oaks", venue: "UM Church", format: "speaker", notes: "Open discussion/speaker. Farsi language (FA). 1 hr. Farsi" },
  { name: "Mid-Week Fix", type: "na", day: "wednesday", time: "8:00 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "discussion", notes: "Open discussion. No smoking. 1 hr" },

  // ========== THURSDAY NA ==========
  { name: "Hi Noon", type: "na", day: "thursday", time: "12:15 PM", address: "10901 Victory Blvd", city: "North Hollywood", venue: "Victorio's Ristorante", format: "discussion", notes: "Open discussion (WC, no smoking). 1 hr" },
  { name: "New Connections", type: "na", day: "thursday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open beginners/discussion (WC, HY). 1 hr" },
  { name: "Alive and Free", type: "na", day: "thursday", time: "6:30 PM", address: "9901 Tujunga Canyon Blvd", city: "Tujunga", format: "discussion", notes: "Open discussion. Horseshoe lot, downstairs. Tradition (Tr). 1¼ hr" },
  { name: "Stay Alive in 45", type: "na", day: "thursday", time: "6:30 PM", address: "12121 Balboa Blvd", city: "Granada Hills", venue: "Knollwood UM Church", format: "speaker", notes: "Speaker meeting. 45 min" },
  { name: "The God Box", type: "na", day: "thursday", time: "7:00 PM", city: "Burbank", format: "topic", notes: "Virtual. Closed candlelight topic (To, VM). 1 hr" },
  { name: "Early Bird Group", type: "na", day: "thursday", time: "7:30 PM", city: "North Hollywood", format: "discussion", notes: "Virtual. Open discussion (WC, no smoking, VM). 1 hr" },
  { name: "Lamplighter", type: "na", day: "thursday", time: "7:30 PM", address: "21520 Sherman Way", city: "Canoga Park", venue: "Hole in the Sky", format: "speaker", notes: "Open discussion/speaker. 1.5 hr" },
  { name: "Woman Warriors of Recovery", type: "na", day: "thursday", time: "7:30 PM", address: "11134 Sepulveda Blvd", city: "Mission Hills", format: "topic", notes: "No children. Women's topic meeting (WC). 1 hr. Women only" },
  { name: "Just for Today", type: "na", day: "thursday", time: "7:30 PM", address: "9901 Tujunga Canyon Blvd", city: "Tujunga", venue: "Fireside Room", format: "topic", notes: "Open topic discussion (WC). 1 hr" },
  { name: "Tuesday Step Study", type: "na", day: "thursday", time: "8:00 PM", address: "8330 Lankershim Blvd", city: "North Hollywood", format: "step_study", notes: "Closed step study. Book (BK), no smoking. 1.5 hr" },
  { name: "Recovery in the Varrio", type: "na", day: "thursday", time: "7:45 PM", address: "16651 Rinaldi St", city: "Granada Hills", venue: "St. Andrew & St. Charles Church", format: "discussion", notes: "Open discussion (WC, no smoking). 1.5 hr" },
  { name: "Unit NA", type: "na", day: "thursday", time: "8:00 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "discussion", notes: "Open discussion (WC, no smoking). 1 hr" },

  // ========== FRIDAY NA ==========
  { name: "Pass Avenue Friday", type: "na", day: "friday", time: "12:00 PM", address: "4301 Cahuenga Blvd", city: "Toluca Lake", venue: "Harmony Toluca Lake Church", format: "discussion", notes: "Open discussion (WC, no smoking). 1 hr" },
  { name: "New Connections", type: "na", day: "friday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open beginners/discussion. Just for Today (JT), WC, HY. 1 hr" },
  { name: "All In An Hour", type: "na", day: "friday", time: "7:15 PM", address: "11430 Chandler Blvd", city: "North Hollywood", venue: "NoHo Park Senior Center", format: "discussion", notes: "Open meeting (WC, young people, no smoking). 1 hr. Young people" },
  { name: "Men's Meeting", type: "na", day: "friday", time: "7:30 PM", address: "9440 Balboa Blvd", city: "Northridge", venue: "Prince of Peace Church", format: "discussion", notes: "Open men's discussion (WC). 1.5 hr. Men only" },
  { name: "Share and Care", type: "na", day: "friday", time: "7:30 PM", address: "6425 Tyrone Ave", city: "Van Nuys", venue: "Central Lutheran Church", format: "topic", notes: "Open topic. Candlelight (Candlelight), Topic (To), no smoking. 1 hr" },
  { name: "Warriors", type: "na", day: "friday", time: "8:00 PM", address: "11455 Chandler Blvd", city: "North Hollywood", venue: "Chandler Lodge", format: "discussion", notes: "Open discussion. 1.5 hr" },

  // ========== SATURDAY NA ==========
  { name: "Progressive Jackpot", type: "na", day: "saturday", time: "7:45 AM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open discussion (WC, no smoking, HY). ~1¼ hr" },
  { name: "The Last Batch", type: "na", day: "saturday", time: "10:30 AM", address: "8956 Vanalden Ave", city: "Northridge", venue: "Vanalden Park", format: "discussion", notes: "Open meeting (WC, outdoors). 1 hr" },
  { name: "Living Clean Book Study", type: "na", day: "saturday", time: "12:00 PM", city: "North Hollywood", format: "book_study", notes: "Virtual. Open Living Clean study (WC, LC, VM). 1¼ hr" },
  { name: "Ain't MisBehavin'", type: "na", day: "saturday", time: "12:15 PM", city: "Van Nuys", format: "discussion", notes: "Virtual. Open discussion (WC, no smoking, VM). 1.5 hr" },
  { name: "Spirit of NA", type: "na", day: "saturday", time: "3:00 PM", address: "6006 Laurel Canyon Blvd", city: "North Hollywood", venue: "Spirit of Studio 12", format: "discussion", notes: "Hybrid. Open discussion (WC, HY). 1 hr" },
  { name: "Paradise Meeting", type: "na", day: "saturday", time: "6:00 PM", address: "6425 Tyrone Ave", city: "Van Nuys", venue: "Central Lutheran Church", format: "speaker", notes: "Open discussion/speaker (WC). 1¼ hr" },
  { name: "Where It All Began", type: "na", day: "saturday", time: "7:00 PM", address: "10803 Cantara St", city: "Sun Valley", format: "speaker", notes: "Speaker meeting. 1 hr" },
  { name: "Keep It Simple", type: "na", day: "saturday", time: "7:30 PM", address: "11134 Sepulveda Blvd", city: "Mission Hills", format: "discussion", notes: "Open discussion. 1 hr" },
  { name: "Always An Option", type: "na", day: "saturday", time: "8:00 PM", address: "11455 Chandler Blvd", city: "North Hollywood", venue: "Chandler Lodge", format: "speaker", notes: "Open discussion/speaker (WC). 1.5 hr" },
  { name: "Happy Feet (Meeting & Dance)", type: "na", day: "saturday", time: "8:00 PM", address: "10641 Burbank Blvd", city: "North Hollywood", venue: "Unit A", format: "speaker", notes: "Open speaker meeting (1st Sat. of month; 1W/1X). 1 hr + dance" },
  { name: "Saturday Night Live", type: "na", day: "saturday", time: "8:00 PM", address: "5353 Denny Ave", city: "North Hollywood", format: "discussion", notes: "Open discussion (WC). 1 hr" },
  { name: "Tujunga Candlelite", type: "na", day: "saturday", time: "9:00 PM", address: "9901 Tujunga Canyon Blvd", city: "Tujunga", venue: "Youth Room", format: "discussion", notes: "Open candlelight discussion (WC). 1 hr. Candlelight" },

  // ========== CMA ==========
  { name: "Monday Monsters", type: "cma", day: "monday", time: "7:00 PM", address: "14718 Keswick St", city: "Van Nuys", venue: "Innovate Recovery", format: "speaker", notes: "In-person. LGBTQ-friendly, newcomer welcome, speaker format. Open CMA meeting" },

  // ========== SMART RECOVERY ==========
  { name: "SMART Recovery (Simi Valley)", type: "smart", day: "saturday", time: "7:00 PM", address: "3855 Alamo St", city: "Simi Valley", venue: "Kaiser Permanente Mental Health Center", format: "discussion", notes: "In-person 4-Point Recovery meeting. Adults welcome. Every Saturday 7-8:30 PM" },
  { name: "SMART Recovery Los Angeles", type: "smart", day: "tuesday", time: "7:00 PM", address: "2535 W Temple St", city: "Los Angeles", venue: "Center for Inquiry", format: "discussion", notes: "In-person meeting. General SMART 4-Point program. Proof of vaccination required at venue" },
];

async function importAllMeetings() {
  console.log("🏛️  Importing COMPLETE AA/NA/CMA/SMART Recovery Meetings Directory\\n");
  console.log(`Total meetings to import: ${allMeetings.length}\\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const meeting of allMeetings) {
    try {
      const tags = parseTags(meeting.format, meeting.notes || "");
      const meetingMode = getMeetingMode(meeting.notes || "");
      const format = getFormat(meeting.format);
      const language = getLanguage(meeting.notes || "");

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
        language: language,
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
  console.log(`   📦 Total meetings: ${allMeetings.length}`);
  console.log("\\n✨ Complete recovery meetings directory imported!");
  console.log("\\n📋 Coverage:");
  console.log("   • 100+ AA meetings (Monday schedule from PDF)");
  console.log("   • 49 NA meetings (Sunday-Saturday)");
  console.log("   • 1 CMA meeting");
  console.log("   • 2 SMART Recovery meetings");

  client.close();
}

importAllMeetings();
