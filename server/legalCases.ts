import { getDb } from "./db";
import { legalCases, caseDocuments, caseMilestones } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export interface CreateLegalCaseInput {
  userId: number;
  caseType: "custody_reunification" | "record_expungement";
  title: string;
  description?: string;
  county?: string;
  caseNumber?: string;
  targetCompletionDate?: Date;
}

export interface UpdateLegalCaseInput {
  title?: string;
  description?: string;
  status?: "not_started" | "in_progress" | "completed" | "on_hold";
  county?: string;
  caseNumber?: string;
  currentStage?: string;
  completionPercentage?: number;
  targetCompletionDate?: Date;
  completedAt?: Date;
  notes?: string;
}

/**
 * Create a new legal case
 */
export async function createLegalCase(input: CreateLegalCaseInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [legalCase] = await db.insert(legalCases).values({
    userId: input.userId,
    caseType: input.caseType,
    title: input.title,
    description: input.description,
    county: input.county,
    caseNumber: input.caseNumber,
    targetCompletionDate: input.targetCompletionDate ? Math.floor(input.targetCompletionDate.getTime() / 1000) : undefined,
    startedAt: Math.floor(Date.now() / 1000),
  });

  // Initialize default milestones based on case type
  await initializeCaseMilestones(legalCase.insertId, input.caseType);
  
  // Initialize default documents based on case type
  await initializeCaseDocuments(legalCase.insertId, input.caseType);

  return legalCase.insertId;
}

/**
 * Get all legal cases for a user
 */
export async function getLegalCases(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cases = await db
    .select()
    .from(legalCases)
    .where(eq(legalCases.userId, userId))
    .orderBy(desc(legalCases.createdAt));

  return cases;
}

/**
 * Get a single legal case by ID
 */
export async function getLegalCaseById(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [legalCase] = await db
    .select()
    .from(legalCases)
    .where(
      and(
        eq(legalCases.id, caseId),
        eq(legalCases.userId, userId)
      )
    )
    .limit(1);

  return legalCase || null;
}

/**
 * Update a legal case
 */
export async function updateLegalCase(
  caseId: number,
  userId: number,
  input: UpdateLegalCaseInput
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert Date objects to Unix timestamps
  const updates: any = { ...input };
  if (input.targetCompletionDate instanceof Date) {
    updates.targetCompletionDate = Math.floor(input.targetCompletionDate.getTime() / 1000);
  }
  if (input.completedAt instanceof Date) {
    updates.completedAt = Math.floor(input.completedAt.getTime() / 1000);
  }

  await db
    .update(legalCases)
    .set(updates)
    .where(
      and(
        eq(legalCases.id, caseId),
        eq(legalCases.userId, userId)
      )
    );
}

/**
 * Delete a legal case
 */
export async function deleteLegalCase(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete related documents and milestones first
  await db.delete(caseDocuments).where(eq(caseDocuments.caseId, caseId));
  await db.delete(caseMilestones).where(eq(caseMilestones.caseId, caseId));
  
  // Delete the case
  await db
    .delete(legalCases)
    .where(
      and(
        eq(legalCases.id, caseId),
        eq(legalCases.userId, userId)
      )
    );
}

/**
 * Initialize default milestones for a case type
 */
async function initializeCaseMilestones(
  caseId: number,
  caseType: "custody_reunification" | "record_expungement"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let milestones: Array<{ name: string; description: string; order: number }> = [];

  if (caseType === "custody_reunification") {
    milestones = [
      {
        name: "Initial Assessment",
        description: "Complete initial assessment with case worker to understand requirements",
        order: 1,
      },
      {
        name: "Complete Parenting Classes",
        description: "Attend and complete required parenting education classes",
        order: 2,
      },
      {
        name: "Home Study",
        description: "Pass home study evaluation showing safe living environment",
        order: 3,
      },
      {
        name: "Supervised Visits",
        description: "Complete required supervised visitation sessions",
        order: 4,
      },
      {
        name: "Court Hearing",
        description: "Attend court hearing for custody evaluation",
        order: 5,
      },
      {
        name: "Reunification",
        description: "Successfully reunify with child",
        order: 6,
      },
    ];
  } else if (caseType === "record_expungement") {
    milestones = [
      {
        name: "Eligibility Check",
        description: "Verify eligibility for record expungement",
        order: 1,
      },
      {
        name: "Obtain Records",
        description: "Request and obtain criminal records from court",
        order: 2,
      },
      {
        name: "Complete Forms",
        description: "Fill out all required expungement petition forms",
        order: 3,
      },
      {
        name: "File Petition",
        description: "File petition with court and pay filing fees",
        order: 4,
      },
      {
        name: "Court Hearing",
        description: "Attend court hearing for expungement decision",
        order: 5,
      },
      {
        name: "Record Cleared",
        description: "Receive confirmation that record has been expunged",
        order: 6,
      },
    ];
  }

  for (const milestone of milestones) {
    await db.insert(caseMilestones).values({
      caseId,
      milestoneName: milestone.name,
      description: milestone.description,
      sortOrder: milestone.order,
    });
  }
}

/**
 * Initialize default documents for a case type
 */
async function initializeCaseDocuments(
  caseId: number,
  caseType: "custody_reunification" | "record_expungement"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let documents: Array<{
    name: string;
    type: string;
    description: string;
    instructions: string;
    order: number;
    required: boolean;
  }> = [];

  if (caseType === "custody_reunification") {
    documents = [
      {
        name: "Parenting Plan",
        type: "parenting_plan",
        description: "Detailed plan for child care, visitation schedule, and decision-making",
        instructions: "Create a comprehensive parenting plan showing how you will care for the child",
        order: 1,
        required: true,
      },
      {
        name: "Proof of Income",
        type: "financial",
        description: "Pay stubs, tax returns, or employment verification",
        instructions: "Provide recent pay stubs or proof of stable income",
        order: 2,
        required: true,
      },
      {
        name: "Proof of Housing",
        type: "housing",
        description: "Lease agreement or proof of stable housing",
        instructions: "Show you have safe, stable housing for the child",
        order: 3,
        required: true,
      },
      {
        name: "Parenting Class Certificate",
        type: "certificate",
        description: "Certificate of completion from court-approved parenting class",
        instructions: "Complete required parenting education and submit certificate",
        order: 4,
        required: true,
      },
      {
        name: "Character References",
        type: "reference",
        description: "Letters from employers, counselors, or community members",
        instructions: "Obtain 2-3 character reference letters",
        order: 5,
        required: false,
      },
    ];
  } else if (caseType === "record_expungement") {
    documents = [
      {
        name: "Petition for Expungement",
        type: "petition",
        description: "Official court form requesting record expungement",
        instructions: "Complete petition form with case details and conviction information",
        order: 1,
        required: true,
      },
      {
        name: "Declaration",
        type: "declaration",
        description: "Written statement explaining why you deserve expungement",
        instructions: "Write declaration showing rehabilitation and reasons for expungement",
        order: 2,
        required: true,
      },
      {
        name: "Criminal Record",
        type: "record",
        description: "Official copy of criminal record from court",
        instructions: "Request certified copy of your criminal record",
        order: 3,
        required: true,
      },
      {
        name: "Proof of Completion",
        type: "completion",
        description: "Evidence of sentence completion (probation, fines, etc.)",
        instructions: "Obtain proof that all sentence requirements have been met",
        order: 4,
        required: true,
      },
      {
        name: "Order for Expungement",
        type: "order",
        description: "Proposed order for judge to sign",
        instructions: "Prepare proposed order granting expungement",
        order: 5,
        required: true,
      },
    ];
  }

  for (const doc of documents) {
    await db.insert(caseDocuments).values({
      caseId,
      documentName: doc.name,
      documentType: doc.type,
      description: doc.description,
      instructions: doc.instructions,
      sortOrder: doc.order,
      isRequired: doc.required ? 1 : 0,
    });
  }
}

/**
 * Get case documents for a case
 */
export async function getCaseDocuments(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const documents = await db
    .select()
    .from(caseDocuments)
    .where(eq(caseDocuments.caseId, caseId))
    .orderBy(caseDocuments.sortOrder);

  return documents;
}

/**
 * Get case milestones for a case
 */
export async function getCaseMilestones(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const milestones = await db
    .select()
    .from(caseMilestones)
    .where(eq(caseMilestones.caseId, caseId))
    .orderBy(caseMilestones.sortOrder);

  return milestones;
}

/**
 * Update case document status
 */
export async function updateCaseDocument(
  documentId: number,
  input: {
    status?: "not_started" | "in_progress" | "completed" | "needs_revision";
    fileUrl?: string;
    fileKey?: string;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { ...input };
  if (input.fileUrl) {
    updateData.uploadedAt = new Date();
  }

  await db
    .update(caseDocuments)
    .set(updateData)
    .where(eq(caseDocuments.id, documentId));
}

/**
 * Update case milestone status
 */
export async function updateCaseMilestone(
  milestoneId: number,
  input: {
    status?: "not_started" | "in_progress" | "completed" | "skipped";
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { ...input };
  if (input.status === "completed") {
    updateData.completedAt = new Date();
  }

  await db
    .update(caseMilestones)
    .set(updateData)
    .where(eq(caseMilestones.id, milestoneId));
}
