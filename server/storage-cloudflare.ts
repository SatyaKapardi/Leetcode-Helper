import { eq, and, desc, asc, like, or } from "drizzle-orm";
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
} from "../shared/schema-d1";

export interface ICloudflareStorage {
  // User operations
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
  createChatMessage(message: InsertChatMessage & { problemId: number; isAi?: boolean }, userId: string): Promise<ChatMessage>;
}

export class CloudflareStorage implements ICloudflareStorage {
  constructor(
    private db: any, // Drizzle D1 instance
    private kv: any  // KV namespace for sessions
  ) {}

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await this.db
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

  async getProblems(userId: string, limit = 50, offset = 0): Promise<Problem[]> {
    return await this.db
      .select()
      .from(problems)
      .where(eq(problems.userId, userId))
      .orderBy(desc(problems.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProblem(id: number, userId: string): Promise<Problem | undefined> {
    const [problem] = await this.db
      .select()
      .from(problems)
      .where(and(eq(problems.id, id), eq(problems.userId, userId)));
    return problem;
  }

  async createProblem(problem: InsertProblem, userId: string): Promise<Problem> {
    const [newProblem] = await this.db
      .insert(problems)
      .values({
        ...problem,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newProblem;
  }

  async updateProblem(id: number, problem: Partial<InsertProblem>, userId: string): Promise<Problem | undefined> {
    const [updatedProblem] = await this.db
      .update(problems)
      .set({
        ...problem,
        updatedAt: new Date(),
      })
      .where(and(eq(problems.id, id), eq(problems.userId, userId)))
      .returning();
    return updatedProblem;
  }

  async deleteProblem(id: number, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(problems)
      .where(and(eq(problems.id, id), eq(problems.userId, userId)));
    return result.changes > 0;
  }

  async searchProblems(userId: string, query: string, difficulty?: string, category?: string): Promise<Problem[]> {
    let whereCondition = eq(problems.userId, userId);

    if (query) {
      whereCondition = and(
        whereCondition,
        or(
          like(problems.title, `%${query}%`),
          like(problems.description, `%${query}%`)
        )
      );
    }

    if (difficulty) {
      whereCondition = and(whereCondition, eq(problems.difficulty, difficulty));
    }

    if (category) {
      whereCondition = and(whereCondition, eq(problems.category, category));
    }

    return await this.db
      .select()
      .from(problems)
      .where(whereCondition)
      .orderBy(desc(problems.createdAt));
  }

  async getUserStats(userId: string): Promise<{
    total: number;
    easy: number;
    medium: number;
    hard: number;
  }> {
    const allProblems = await this.db
      .select()
      .from(problems)
      .where(eq(problems.userId, userId));

    const stats = {
      total: allProblems.length,
      easy: allProblems.filter((p: Problem) => p.difficulty === 'easy').length,
      medium: allProblems.filter((p: Problem) => p.difficulty === 'medium').length,
      hard: allProblems.filter((p: Problem) => p.difficulty === 'hard').length,
    };

    return stats;
  }

  async getChatMessages(problemId: number, userId: string): Promise<ChatMessage[]> {
    return await this.db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.problemId, problemId), eq(chatMessages.userId, userId)))
      .orderBy(asc(chatMessages.createdAt));
  }

  async createChatMessage(messageData: InsertChatMessage & { problemId: number; isAi?: boolean }, userId: string): Promise<ChatMessage> {
    const [newMessage] = await this.db
      .insert(chatMessages)
      .values({
        ...messageData,
        userId,
        isAi: messageData.isAi || false,
        createdAt: new Date(),
      })
      .returning();
    return newMessage;
  }
}