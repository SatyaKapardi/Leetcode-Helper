import { Hono } from 'hono';
import { createDB, type CloudflareEnv } from './db-cloudflare';
import { CloudflareStorage } from './storage-cloudflare';
import { getChatResponse, analyzeCode } from './openai';
import { insertProblemSchema, insertChatMessageSchema } from '../shared/schema-d1';
import { zValidator } from '@hono/zod-validator';

const app = new Hono<{ Bindings: CloudflareEnv }>();

// Initialize storage with Cloudflare bindings
function getStorage(env: CloudflareEnv) {
  const db = createDB(env.DB);
  return new CloudflareStorage(db, env.SESSIONS);
}

// CORS middleware
app.use('*', async (c, next) => {
  await next();
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static files (built frontend)
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/api/')) {
    return c.notFound();
  }
  
  // Serve index.html for all non-API routes (SPA routing)
  return c.html(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LeetCode Tracker</title>
        <script type="module" crossorigin src="/assets/index.js"></script>
        <link rel="stylesheet" href="/assets/index.css">
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>`
  );
});

// Authentication routes
app.get('/api/auth/user', async (c) => {
  const storage = getStorage(c.env);
  // For now, return a mock user - you'll need to implement proper auth
  return c.json({
    id: "demo-user",
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
});

// Problems routes
app.get('/api/problems', async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  
  const problems = await storage.getProblems(userId, limit, offset);
  return c.json(problems);
});

app.post('/api/problems', zValidator('json', insertProblemSchema), async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  const problemData = c.req.valid('json');
  
  const problem = await storage.createProblem(problemData, userId);
  return c.json(problem, 201);
});

app.get('/api/problems/:id', async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  const id = parseInt(c.req.param('id'));
  
  const problem = await storage.getProblem(id, userId);
  if (!problem) {
    return c.json({ message: 'Problem not found' }, 404);
  }
  
  return c.json(problem);
});

app.put('/api/problems/:id', zValidator('json', insertProblemSchema), async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  const id = parseInt(c.req.param('id'));
  const problemData = c.req.valid('json');
  
  const problem = await storage.updateProblem(id, problemData, userId);
  if (!problem) {
    return c.json({ message: 'Problem not found' }, 404);
  }
  
  return c.json(problem);
});

app.delete('/api/problems/:id', async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  const id = parseInt(c.req.param('id'));
  
  const deleted = await storage.deleteProblem(id, userId);
  if (!deleted) {
    return c.json({ message: 'Problem not found' }, 404);
  }
  
  return c.json({ message: 'Problem deleted' }, 204);
});

// Statistics route
app.get('/api/stats', async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  
  const stats = await storage.getUserStats(userId);
  return c.json(stats);
});

// Code analysis route
app.get('/api/problems/:id/analyze', async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  const id = parseInt(c.req.param('id'));
  
  const problem = await storage.getProblem(id, userId);
  if (!problem) {
    return c.json({ message: 'Problem not found' }, 404);
  }
  
  const analysis = await analyzeCode(problem.solution, problem.description);
  return c.json(analysis);
});

// Chat routes
app.get('/api/problems/:id/chat', async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  const id = parseInt(c.req.param('id'));
  
  const messages = await storage.getChatMessages(id, userId);
  return c.json(messages);
});

app.post('/api/problems/:id/chat', zValidator('json', insertChatMessageSchema), async (c) => {
  const storage = getStorage(c.env);
  const userId = "demo-user"; // Replace with actual user ID from auth
  const problemId = parseInt(c.req.param('id'));
  const { message } = c.req.valid('json');
  
  const problem = await storage.getProblem(problemId, userId);
  if (!problem) {
    return c.json({ message: 'Problem not found' }, 404);
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
  
  return c.json({
    userMessage,
    aiResponse: aiMessage
  });
});

export default app;