# Cloudflare Deployment Guide

This guide walks you through deploying your LeetCode Solution Tracker to Cloudflare Workers with D1 database.

## Prerequisites

1. **Cloudflare Account**: Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Wrangler CLI**: Already installed in your project
3. **Node.js 18+**: For building the application

## Step 1: Setup Cloudflare Authentication

```bash
# Login to Cloudflare
npx wrangler login

# Verify authentication
npx wrangler whoami
```

## Step 2: Create D1 Database

```bash
# Create the database
npx wrangler d1 create leetcode-tracker-db

# The output will show your database ID - copy it for later
# Database created! Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Step 3: Create KV Namespace for Sessions

```bash
# Create KV namespace for production
npx wrangler kv:namespace create SESSIONS

# Create KV namespace for preview/staging
npx wrangler kv:namespace create SESSIONS --preview

# Copy the namespace IDs from the output
```

## Step 4: Update wrangler.toml

Edit `wrangler.toml` and replace the placeholder IDs:

```toml
# Replace with your actual database ID
database_id = "your-actual-database-id"

# Replace with your actual KV namespace IDs
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"
```

## Step 5: Run Database Migrations

```bash
# Execute the migration
npx wrangler d1 execute leetcode-tracker-db --file=./migrations/0001_initial_schema.sql

# Verify tables were created
npx wrangler d1 execute leetcode-tracker-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Step 6: Set Environment Variables

```bash
# Set production secrets
npx wrangler secret put SESSION_SECRET
# Enter a strong random string when prompted

# Optional: Set other secrets if needed
npx wrangler secret put OPENAI_API_KEY
```

## Step 7: Build and Deploy

```bash
# Build for Cloudflare Workers
npm run build:cloudflare

# Deploy to Cloudflare
npx wrangler deploy
```

## Step 8: Test Your Deployment

Your application will be available at: `https://leetcode-tracker.your-subdomain.workers.dev`

Test the endpoints:
- `GET /health` - Health check
- `GET /api/auth/user` - User authentication (currently returns demo user)
- `GET /api/problems` - List problems

## Database Management

### View Data
```bash
# List all problems
npx wrangler d1 execute leetcode-tracker-db --command="SELECT * FROM problems;"

# List all users
npx wrangler d1 execute leetcode-tracker-db --command="SELECT * FROM users;"
```

### Backup Data
```bash
# Export database
npx wrangler d1 export leetcode-tracker-db --output=backup.sql
```

### Local Development
```bash
# Start local development server
npx wrangler dev

# This will start a local server with access to your remote D1 database
```

## Authentication Setup

Currently, the application uses a demo user. To implement real authentication:

1. **Cloudflare Access**: Use Cloudflare Access for enterprise SSO
2. **OAuth Providers**: Implement OAuth with GitHub, Google, etc.
3. **Custom Auth**: Build custom authentication with JWT tokens

Example OAuth implementation would require:
```bash
# Set OAuth secrets
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

## Performance Optimization

### Caching Strategy
- Static assets cached at edge
- API responses cached in KV for frequently accessed data
- Database queries optimized with proper indexing

### Monitoring
```bash
# View logs
npx wrangler tail

# View analytics in Cloudflare dashboard
# Go to Workers & Pages > Your Worker > Analytics
```

## Costs and Limits

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- 10ms CPU time per request
- 1GB D1 database storage

**D1 Database Free Tier:**
- 5GB storage
- 25 million reads/month
- 50,000 writes/month

**KV Storage Free Tier:**
- 100,000 reads/day
- 1,000 writes/day
- 1GB storage

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   ```bash
   # Check database exists
   npx wrangler d1 list
   
   # Verify tables
   npx wrangler d1 execute leetcode-tracker-db --command="PRAGMA table_info(users);"
   ```

2. **KV namespace not found:**
   ```bash
   # List KV namespaces
   npx wrangler kv:namespace list
   ```

3. **Build errors:**
   ```bash
   # Clear cache and rebuild
   rm -rf dist
   npm run build:cloudflare
   ```

### Logs and Debugging
```bash
# Real-time logs
npx wrangler tail

# Specific error debugging
npx wrangler tail --format=pretty
```

## Production Checklist

- [ ] Database migrated successfully
- [ ] KV namespaces created
- [ ] Environment secrets set
- [ ] Custom domain configured (optional)
- [ ] Authentication implemented
- [ ] Error monitoring setup
- [ ] Backup strategy in place

## Custom Domain (Optional)

1. Add domain to Cloudflare DNS
2. Configure route in `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "leetcode-tracker.yourdomain.com/*", zone_name = "yourdomain.com" }
   ]
   ```
3. Deploy with custom domain

## Security Considerations

- Use strong session secrets
- Implement proper CORS policies
- Add rate limiting for API endpoints
- Validate all user inputs
- Use HTTPS only (automatic with Cloudflare)

Your LeetCode tracker is now ready for global deployment on Cloudflare's edge network!