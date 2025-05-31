# LeetCode Solution Tracker

A comprehensive LeetCode solution tracker with AI-powered code analysis, featuring user authentication, solution management, and intelligent code assistance.

## Features

- **Solution Management**: Track your LeetCode solutions with detailed metadata
- **AI Code Analysis**: Get intelligent insights about your code complexity and optimization suggestions
- **Interactive Chat**: Ask questions about your solutions and get AI assistance
- **Progress Tracking**: Monitor your solving progress across different difficulty levels
- **Search & Filter**: Find solutions by difficulty, category, or keywords
- **User Authentication**: Secure user sessions and data management

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query for state management
- Wouter for routing
- Framer Motion for animations

### Backend
- Node.js with Express (local development)
- Hono framework (Cloudflare Workers)
- PostgreSQL (local) / D1 SQLite (Cloudflare)
- Drizzle ORM
- Session-based authentication

### AI Features
- Pattern-based code analysis
- Complexity detection
- Optimization suggestions
- Interactive code explanation

## Deployment Options

### Option 1: Local Development
```bash
npm install
npm run dev
```

### Option 2: Docker
```bash
docker-compose up --build
```

### Option 3: Cloudflare Workers (Recommended for Production)
See [Cloudflare Deployment Guide](./README.Cloudflare.md)

## API Documentation

Complete API documentation available in [OpenAPI specification](./openapi.yaml).

Key endpoints:
- `GET /api/problems` - List user problems
- `POST /api/problems` - Create new solution
- `GET /api/problems/:id/chat` - Get chat history
- `POST /api/problems/:id/chat` - Send message to AI

## Local Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd leetcode-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database migrations**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.