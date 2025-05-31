import { createDB, type CloudflareEnv } from '../server/db-cloudflare';
import { CloudflareStorage } from '../server/storage-cloudflare';
import { getChatResponse, analyzeCode } from '../server/openai';
import { insertProblemSchema, insertChatMessageSchema } from '../shared/schema-d1';

interface Env extends CloudflareEnv {
  ASSETS: Fetcher;
}

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }) {
  const url = new URL(context.request.url);
  
  // Serve API routes
  if (url.pathname.startsWith('/api/')) {
    return handleAPI(context);
  }
  
  // Serve static assets or fall back to index.html for SPA routing
  return context.next();
}

async function handleAPI(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Initialize storage
  const db = createDB(env.DB);
  const storage = new CloudflareStorage(db, env.SESSIONS);
  
  // For demo purposes, using a fixed user ID
  // In production, you'd extract this from authentication
  const userId = "demo-user";
  
  try {
    // Health check
    if (pathname === '/api/health') {
      return Response.json({ status: 'healthy', timestamp: new Date().toISOString() });
    }
    
    // Auth routes
    if (pathname === '/api/auth/user') {
      return Response.json({
        id: userId,
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Problems routes
    if (pathname === '/api/problems' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const problems = await storage.getProblems(userId, limit, offset);
      return Response.json(problems);
    }
    
    if (pathname === '/api/problems' && request.method === 'POST') {
      const body = await request.json();
      const validatedData = insertProblemSchema.parse(body);
      const problem = await storage.createProblem(validatedData, userId);
      return Response.json(problem, { status: 201 });
    }
    
    if (pathname.match(/^\/api\/problems\/(\d+)$/) && request.method === 'GET') {
      const id = parseInt(pathname.split('/')[3]);
      const problem = await storage.getProblem(id, userId);
      if (!problem) {
        return Response.json({ message: 'Problem not found' }, { status: 404 });
      }
      return Response.json(problem);
    }
    
    // Statistics
    if (pathname === '/api/stats') {
      const stats = await storage.getUserStats(userId);
      return Response.json(stats);
    }
    
    // Chat routes
    if (pathname.match(/^\/api\/problems\/(\d+)\/chat$/) && request.method === 'GET') {
      const id = parseInt(pathname.split('/')[3]);
      const messages = await storage.getChatMessages(id, userId);
      return Response.json(messages);
    }
    
    if (pathname.match(/^\/api\/problems\/(\d+)\/chat$/) && request.method === 'POST') {
      const problemId = parseInt(pathname.split('/')[3]);
      const body = await request.json();
      const { message } = insertChatMessageSchema.parse(body);
      
      const problem = await storage.getProblem(problemId, userId);
      if (!problem) {
        return Response.json({ message: 'Problem not found' }, { status: 404 });
      }
      
      // Create user message
      const userMessage = await storage.createChatMessage(
        { message, problemId },
        userId
      );
      
      // Get AI response
      const chatHistory = await storage.getChatMessages(problemId, userId);
      const aiResponseText = await getChatResponse(
        message,
        problem.title,
        problem.description,
        problem.solution,
        chatHistory.map(m => ({ message: m.message, isAi: m.isAi }))
      );
      
      // Create AI message
      const aiMessage = await storage.createChatMessage(
        { message: aiResponseText, problemId, isAi: true },
        userId
      );
      
      return Response.json({
        userMessage,
        aiResponse: aiMessage
      });
    }
    
    return Response.json({ message: 'Not found' }, { status: 404 });
    
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}