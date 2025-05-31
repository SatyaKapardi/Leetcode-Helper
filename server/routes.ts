import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProblemSchema, insertChatMessageSchema } from "@shared/schema";
import { getChatResponse, analyzeCode } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Problem routes
  app.get("/api/problems", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = "50", offset = "0", search, difficulty, category } = req.query;

      let problems;
      if (search || difficulty || category) {
        problems = await storage.searchProblems(
          userId,
          search as string || "",
          difficulty as string,
          category as string
        );
      } else {
        problems = await storage.getProblems(
          userId,
          parseInt(limit as string),
          parseInt(offset as string)
        );
      }

      res.json(problems);
    } catch (error) {
      console.error("Error fetching problems:", error);
      res.status(500).json({ message: "Failed to fetch problems" });
    }
  });

  app.get("/api/problems/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const problemId = parseInt(req.params.id);
      
      const problem = await storage.getProblem(problemId, userId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      res.json(problem);
    } catch (error) {
      console.error("Error fetching problem:", error);
      res.status(500).json({ message: "Failed to fetch problem" });
    }
  });

  app.post("/api/problems", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProblemSchema.parse(req.body);
      
      const problem = await storage.createProblem(validatedData, userId);
      res.status(201).json(problem);
    } catch (error) {
      console.error("Error creating problem:", error);
      res.status(400).json({ message: "Failed to create problem" });
    }
  });

  app.put("/api/problems/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const problemId = parseInt(req.params.id);
      const validatedData = insertProblemSchema.partial().parse(req.body);
      
      const problem = await storage.updateProblem(problemId, validatedData, userId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      res.json(problem);
    } catch (error) {
      console.error("Error updating problem:", error);
      res.status(400).json({ message: "Failed to update problem" });
    }
  });

  app.delete("/api/problems/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const problemId = parseInt(req.params.id);
      
      const success = await storage.deleteProblem(problemId, userId);
      if (!success) {
        return res.status(404).json({ message: "Problem not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting problem:", error);
      res.status(500).json({ message: "Failed to delete problem" });
    }
  });

  // Statistics route
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Chat routes
  app.get("/api/problems/:id/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const problemId = parseInt(req.params.id);
      
      const messages = await storage.getChatMessages(problemId, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/problems/:id/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const problemId = parseInt(req.params.id);
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get problem details for AI context
      const problem = await storage.getProblem(problemId, userId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Get chat history for context
      const chatHistory = await storage.getChatMessages(problemId, userId);

      // Save user message
      const userMessage = await storage.createChatMessage({
        problemId,
        message,
        isAi: "false",
      }, userId);

      // Get AI response
      const aiResponse = await getChatResponse(
        message,
        problem.title,
        problem.description || "",
        problem.solution,
        chatHistory.map(msg => ({ message: msg.message, isAi: msg.isAi === "true" }))
      );

      // Save AI message
      const aiMessage = await storage.createChatMessage({
        problemId,
        message: aiResponse,
        isAi: "true",
      }, userId);

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Code analysis route
  app.post("/api/problems/:id/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const problemId = parseInt(req.params.id);
      
      const problem = await storage.getProblem(problemId, userId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      const analysis = await analyzeCode(problem.solution, problem.description || "");
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing code:", error);
      res.status(500).json({ message: "Failed to analyze code" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
