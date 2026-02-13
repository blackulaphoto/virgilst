import { getDb } from "./db";
import { calendarEvents, legalCases } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface CreateCalendarEventInput {
  userId: number;
  caseId?: number;
  title: string;
  description?: string;
  eventType: "court_date" | "deadline" | "appointment" | "reminder" | "other";
  startTime: Date;
  endTime?: Date;
  location?: string;
  reminderEnabled?: boolean;
  reminderTime?: Date;
  notes?: string;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string;
  eventType?: "court_date" | "deadline" | "appointment" | "reminder" | "other";
  startTime?: Date;
  endTime?: Date;
  location?: string;
  reminderEnabled?: boolean;
  reminderTime?: Date;
  isCompleted?: boolean;
  notes?: string;
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(input: CreateCalendarEventInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [event] = await db.insert(calendarEvents).values({
    userId: input.userId,
    caseId: input.caseId,
    title: input.title,
    description: input.description,
    eventType: input.eventType,
    startTime: input.startTime,
    endTime: input.endTime,
    location: input.location,
    reminderEnabled: input.reminderEnabled ?? true,
    reminderTime: input.reminderTime,
    notes: input.notes,
  });

  return event;
}

/**
 * Get calendar events for a user within a date range
 */
export async function getCalendarEvents(
  userId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build where conditions
  const conditions = [eq(calendarEvents.userId, userId)];
  
  if (startDate && endDate) {
    conditions.push(gte(calendarEvents.startTime, startDate));
    conditions.push(lte(calendarEvents.startTime, endDate));
  } else if (startDate) {
    conditions.push(gte(calendarEvents.startTime, startDate));
  } else if (endDate) {
    conditions.push(lte(calendarEvents.startTime, endDate));
  }

  const events = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      description: calendarEvents.description,
      eventType: calendarEvents.eventType,
      startTime: calendarEvents.startTime,
      endTime: calendarEvents.endTime,
      location: calendarEvents.location,
      reminderEnabled: calendarEvents.reminderEnabled,
      reminderTime: calendarEvents.reminderTime,
      reminderSent: calendarEvents.reminderSent,
      isCompleted: calendarEvents.isCompleted,
      notes: calendarEvents.notes,
      caseId: calendarEvents.caseId,
      createdAt: calendarEvents.createdAt,
      updatedAt: calendarEvents.updatedAt,
      // Join with case info if exists
      caseTitle: legalCases.title,
      caseType: legalCases.caseType,
    })
    .from(calendarEvents)
    .leftJoin(legalCases, eq(calendarEvents.caseId, legalCases.id))
    .where(and(...conditions))
    .orderBy(desc(calendarEvents.startTime));
  return events;
}

/**
 * Get a single calendar event by ID
 */
export async function getCalendarEventById(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [event] = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.userId, userId)
      )
    )
    .limit(1);

  return event || null;
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  eventId: number,
  userId: number,
  input: UpdateCalendarEventInput
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(calendarEvents)
    .set(input)
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.userId, userId)
      )
    );
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.userId, userId)
      )
    );
}

/**
 * Get upcoming events that need reminders
 */
export async function getUpcomingReminders(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        eq(calendarEvents.reminderEnabled, true),
        eq(calendarEvents.reminderSent, false),
        gte(calendarEvents.startTime, now),
        lte(calendarEvents.startTime, next24Hours)
      )
    )
    .orderBy(calendarEvents.startTime);

  return events;
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(calendarEvents)
    .set({ reminderSent: true })
    .where(eq(calendarEvents.id, eventId));
}
