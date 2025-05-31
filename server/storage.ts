import {
  users,
  problems,
  chatMessages,
  type User,
  type UpsertUser,
  type Problem,
  type InsertProblem,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Problem operations
  getProblems(userId: string, limit?: number, offset?: number): Promise<Problem[]>;
  getProblem(id: number, userId: string): Promise<Problem | undefined>;
  createProblem(problem: InsertProblem, userId: string): Promise<Problem>;
  updateProblem(id: number, problem: Partial<InsertProblem>, userId: string): Promise<Problem | undefined>;
  deleteProblem(id: number, userId: string): Promise<boolean>;
  searchProblems(userId: string, query: string, difficulty?: string, category?: string): Promise<Problem[]>;
  
  // Statistics
  getUserStats(userId: string): Promise<{
    total: number;
    easy: number;
    medium: number;
    hard: number;
  }>;
  
  // Chat operations
  getChatMessages(problemId: number, userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage, userId: string): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Problem operations
  async getProblems(userId: string, limit = 50, offset = 0): Promise<Problem[]> {
    return await db
      .select()
      .from(problems)
      .where(eq(problems.userId, userId))
      .orderBy(desc(problems.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async getProblem(id: number, userId: string): Promise<Problem | undefined> {
    const [problem] = await db
      .select()
      .from(problems)
      .where(and(eq(problems.id, id), eq(problems.userId, userId)));
    return problem;
  }

  async createProblem(problem: InsertProblem, userId: string): Promise<Problem> {
    const [newProblem] = await db
      .insert(problems)
      .values({ ...problem, userId })
      .returning();
    return newProblem;
  }

  async updateProblem(id: number, problem: Partial<InsertProblem>, userId: string): Promise<Problem | undefined> {
    const [updatedProblem] = await db
      .update(problems)
      .set({ ...problem, updatedAt: new Date() })
      .where(and(eq(problems.id, id), eq(problems.userId, userId)))
      .returning();
    return updatedProblem;
  }

  async deleteProblem(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(problems)
      .where(and(eq(problems.id, id), eq(problems.userId, userId)));
    return result.rowCount! > 0;
  }

  async searchProblems(userId: string, query: string, difficulty?: string, category?: string): Promise<Problem[]> {
    let whereConditions = [eq(problems.userId, userId)];

    if (query) {
      whereConditions.push(
        sql`(${problems.title} ILIKE ${`%${query}%`} OR ${problems.description} ILIKE ${`%${query}%`})`
      );
    }

    if (difficulty) {
      whereConditions.push(eq(problems.difficulty, difficulty));
    }

    if (category) {
      whereConditions.push(sql`${problems.category} ILIKE ${`%${category}%`}`);
    }

    return await db
      .select()
      .from(problems)
      .where(and(...whereConditions))
      .orderBy(desc(problems.updatedAt));
  }

  async getUserStats(userId: string): Promise<{
    total: number;
    easy: number;
    medium: number;
    hard: number;
  }> {
    const totalResult = await db
      .select({ count: count() })
      .from(problems)
      .where(eq(problems.userId, userId));

    const easyResult = await db
      .select({ count: count() })
      .from(problems)
      .where(and(eq(problems.userId, userId), eq(problems.difficulty, "easy")));

    const mediumResult = await db
      .select({ count: count() })
      .from(problems)
      .where(and(eq(problems.userId, userId), eq(problems.difficulty, "medium")));

    const hardResult = await db
      .select({ count: count() })
      .from(problems)
      .where(and(eq(problems.userId, userId), eq(problems.difficulty, "hard")));

    return {
      total: totalResult[0]?.count || 0,
      easy: easyResult[0]?.count || 0,
      medium: mediumResult[0]?.count || 0,
      hard: hardResult[0]?.count || 0,
    };
  }

  // Chat operations
  async getChatMessages(problemId: number, userId: string): Promise<ChatMessage[]> {
    // First verify the problem belongs to the user
    const problem = await this.getProblem(problemId, userId);
    if (!problem) {
      throw new Error("Problem not found or access denied");
    }

    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.problemId, problemId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage, userId: string): Promise<ChatMessage> {
    // Verify the problem belongs to the user
    const problem = await this.getProblem(message.problemId, userId);
    if (!problem) {
      throw new Error("Problem not found or access denied");
    }

    const [newMessage] = await db
      .insert(chatMessages)
      .values({ ...message, userId })
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
