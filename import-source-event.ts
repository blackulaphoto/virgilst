import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { events } from "./drizzle/schema";

const client = createClient({
  url: "file:./virgil_st_dev.db"
});

const db = drizzle(client);

const sourceEvent = {
  title: "The Source: Monthly Resource Fair",
  description: "The Source offers a one-stop-shop of resources and services to help homeless Angelenos transition to independent and supported living. Services are also available for eligible low-income residents. All services are free of charge.",
  eventType: "resource_fair",
  category: "general",

  // Recurring monthly event - last Tuesday of every month
  isRecurring: 1,
  recurrencePattern: "monthly",
  recurrenceDetails: JSON.stringify({
    dayOfWeek: "tuesday",
    weekOfMonth: "last", // last Tuesday of the month
    interval: 1 // every month
  }),

  // Time
  startTime: "12:30 PM",
  endTime: "3:00 PM",

  // Location - Central Library
  venueName: "Central Library",
  address: "630 W Fifth St",
  city: "Los Angeles",
  zipCode: "90071",
  latitude: 34.0504,
  longitude: -118.2549,

  // Contact
  phone: "213-228-7000",

  // Services offered at the event
  servicesOffered: JSON.stringify([
    "free_california_id_vouchers",
    "birth_certificate_services",
    "free_cell_phones",
    "medi_cal_enrollment",
    "calfresh_enrollment",
    "housing_assessment_coordinated_entry",
    "employment_assistance",
    "mental_health_services",
    "hiv_education_resources",
    "child_support_services",
    "expert_provider_referrals"
  ]),

  // Tags
  tags: JSON.stringify([
    "free",
    "no_id_required",
    "homeless_services",
    "low_income_eligible",
    "downtown_la",
    "monthly_event"
  ]),

  // Eligibility
  eligibility: "Homeless Angelenos and eligible low-income residents",
  registrationRequired: 0,
  cost: "Free",

  // Organizer
  organizerName: "Los Angeles County",

  // Metadata
  isPublished: 1,
  isFeatured: 1, // Featured event
};

async function importSourceEvent() {
  console.log("📅 Importing The Source Monthly Resource Fair\n");

  try {
    await db.insert(events).values(sourceEvent);

    console.log("✅ Successfully imported The Source event!");
    console.log("\n📋 Event Details:");
    console.log(`   Title: ${sourceEvent.title}`);
    console.log(`   Type: ${sourceEvent.eventType}`);
    console.log(`   Schedule: Last Tuesday of every month, ${sourceEvent.startTime} - ${sourceEvent.endTime}`);
    console.log(`   Location: ${sourceEvent.venueName}, ${sourceEvent.address}`);
    console.log(`   Services: ${JSON.parse(sourceEvent.servicesOffered).length} different services offered`);
    console.log(`   Cost: ${sourceEvent.cost}`);
    console.log(`   Eligibility: ${sourceEvent.eligibility}`);
    console.log("\n🎯 Services Offered:");

    const services = JSON.parse(sourceEvent.servicesOffered);
    services.forEach((service: string) => {
      const displayName = service.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      console.log(`   • ${displayName}`);
    });

    console.log("\n✨ Event import complete!");

  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      console.log("⏭️  Event already exists in database");
    } else {
      console.error("❌ Error importing event:", error.message);
    }
  }

  client.close();
}

importSourceEvent();
