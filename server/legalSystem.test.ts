import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import * as calendar from "./calendar";
import * as legalCases from "./legalCases";

describe("Legal Case Management System", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    await db.upsertUser({
      openId: "test-legal-system",
      name: "Legal Test User",
    });

    const user = await db.getUserByOpenId("test-legal-system");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;
  });

  describe("Legal Cases", () => {
    it("should create a custody reunification case", async () => {
      const caseId = await legalCases.createLegalCase({
        userId: testUserId,
        caseType: "custody_reunification",
        title: "Reunification with Child",
        description: "Working to regain custody of my child",
        county: "Los Angeles",
      });

      expect(caseId).toBeGreaterThan(0);

      // Verify case was created
      const legalCase = await legalCases.getLegalCaseById(caseId, testUserId);
      expect(legalCase).toBeTruthy();
      expect(legalCase?.title).toBe("Reunification with Child");
      expect(legalCase?.caseType).toBe("custody_reunification");
    });

    it("should create a record expungement case", async () => {
      const caseId = await legalCases.createLegalCase({
        userId: testUserId,
        caseType: "record_expungement",
        title: "Expunge 2020 Conviction",
        description: "Seeking to expunge misdemeanor conviction",
        county: "Orange",
      });

      expect(caseId).toBeGreaterThan(0);

      const legalCase = await legalCases.getLegalCaseById(caseId, testUserId);
      expect(legalCase?.caseType).toBe("record_expungement");
    });

    it("should initialize default milestones for custody case", async () => {
      const caseId = await legalCases.createLegalCase({
        userId: testUserId,
        caseType: "custody_reunification",
        title: "Test Custody Case",
      });

      const milestones = await legalCases.getCaseMilestones(caseId);
      expect(milestones.length).toBeGreaterThan(0);
      expect(milestones[0].milestoneName).toBe("Initial Assessment");
    });

    it("should initialize default documents for expungement case", async () => {
      const caseId = await legalCases.createLegalCase({
        userId: testUserId,
        caseType: "record_expungement",
        title: "Test Expungement Case",
      });

      const documents = await legalCases.getCaseDocuments(caseId);
      expect(documents.length).toBeGreaterThan(0);
      expect(documents[0].documentName).toBe("Petition for Expungement");
    });

    it("should update case status", async () => {
      const caseId = await legalCases.createLegalCase({
        userId: testUserId,
        caseType: "custody_reunification",
        title: "Update Test Case",
      });

      await legalCases.updateLegalCase(caseId, testUserId, {
        status: "in_progress",
        currentStage: "Parenting Classes",
        completionPercentage: 25,
      });

      const updated = await legalCases.getLegalCaseById(caseId, testUserId);
      expect(updated?.status).toBe("in_progress");
      expect(updated?.completionPercentage).toBe(25);
    });

    it("should list all cases for user", async () => {
      const cases = await legalCases.getLegalCases(testUserId);
      expect(cases.length).toBeGreaterThan(0);
    });
  });

  describe("Calendar Events", () => {
    let testCaseId: number;

    beforeAll(async () => {
      testCaseId = await legalCases.createLegalCase({
        userId: testUserId,
        caseType: "custody_reunification",
        title: "Calendar Test Case",
      });
    });

    it("should create a court date event", async () => {
      const event = await calendar.createCalendarEvent({
        userId: testUserId,
        caseId: testCaseId,
        title: "Court Hearing",
        description: "Initial custody hearing",
        eventType: "court_date",
        startTime: new Date("2026-03-15T09:00:00"),
        location: "Family Court Room 3",
        reminderEnabled: true,
      });

      expect(event).toBeTruthy();
    });

    it("should create a deadline event", async () => {
      const event = await calendar.createCalendarEvent({
        userId: testUserId,
        caseId: testCaseId,
        title: "Submit Parenting Plan",
        eventType: "deadline",
        startTime: new Date("2026-03-10T17:00:00"),
        notes: "Must submit before court date",
      });

      expect(event).toBeTruthy();
    });

    it("should list events for a date range", async () => {
      const startDate = new Date("2026-03-01");
      const endDate = new Date("2026-03-31");

      const events = await calendar.getCalendarEvents(
        testUserId,
        startDate,
        endDate
      );

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].title).toBeTruthy();
    });

    it("should update event completion status", async () => {
      const event = await calendar.createCalendarEvent({
        userId: testUserId,
        title: "Complete Parenting Class",
        eventType: "appointment",
        startTime: new Date("2026-02-20T18:00:00"),
      });

      const eventId = event.insertId;

      await calendar.updateCalendarEvent(eventId, testUserId, {
        isCompleted: true,
        notes: "Completed successfully",
      });

      const updated = await calendar.getCalendarEventById(eventId, testUserId);
      expect(updated?.isCompleted).toBe(true);
    });

    it("should get upcoming reminders", async () => {
      // Create event for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await calendar.createCalendarEvent({
        userId: testUserId,
        title: "Upcoming Event",
        eventType: "reminder",
        startTime: tomorrow,
        reminderEnabled: true,
      });

      const reminders = await calendar.getUpcomingReminders(testUserId);
      expect(Array.isArray(reminders)).toBe(true);
    });
  });

  describe("Document Tracking", () => {
    let testCaseId: number;

    beforeAll(async () => {
      testCaseId = await legalCases.createLegalCase({
        userId: testUserId,
        caseType: "record_expungement",
        title: "Document Test Case",
      });
    });

    it("should update document status", async () => {
      const documents = await legalCases.getCaseDocuments(testCaseId);
      const firstDoc = documents[0];

      await legalCases.updateCaseDocument(firstDoc.id, {
        status: "in_progress",
        notes: "Started filling out form",
      });

      const updated = await legalCases.getCaseDocuments(testCaseId);
      const updatedDoc = updated.find((d) => d.id === firstDoc.id);
      expect(updatedDoc?.status).toBe("in_progress");
    });

    it("should mark document as completed with file upload", async () => {
      const documents = await legalCases.getCaseDocuments(testCaseId);
      const doc = documents[1];

      await legalCases.updateCaseDocument(doc.id, {
        status: "completed",
        fileUrl: "https://example.com/document.pdf",
        fileKey: "documents/test.pdf",
      });

      const updated = await legalCases.getCaseDocuments(testCaseId);
      const updatedDoc = updated.find((d) => d.id === doc.id);
      expect(updatedDoc?.status).toBe("completed");
      expect(updatedDoc?.fileUrl).toBeTruthy();
      expect(updatedDoc?.uploadedAt).toBeTruthy();
    });
  });

  describe("Milestone Tracking", () => {
    let testCaseId: number;

    beforeAll(async () => {
      testCaseId = await legalCases.createLegalCase({
        userId: testUserId,
        caseType: "custody_reunification",
        title: "Milestone Test Case",
      });
    });

    it("should update milestone status", async () => {
      const milestones = await legalCases.getCaseMilestones(testCaseId);
      const firstMilestone = milestones[0];

      await legalCases.updateCaseMilestone(firstMilestone.id, {
        status: "completed",
        notes: "Assessment completed with case worker",
      });

      const updated = await legalCases.getCaseMilestones(testCaseId);
      const updatedMilestone = updated.find((m) => m.id === firstMilestone.id);
      expect(updatedMilestone?.status).toBe("completed");
      expect(updatedMilestone?.completedAt).toBeTruthy();
    });

    it("should track milestone progress in order", async () => {
      const milestones = await legalCases.getCaseMilestones(testCaseId);
      
      // Milestones should be ordered by sortOrder
      for (let i = 0; i < milestones.length - 1; i++) {
        expect(milestones[i].sortOrder).toBeLessThan(milestones[i + 1].sortOrder);
      }
    });
  });
});
