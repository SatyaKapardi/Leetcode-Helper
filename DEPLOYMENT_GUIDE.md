# GitHub + Cloudflare Deployment Guide

This guide will help you deploy your LeetCode tracker to Cloudflare via GitHub integration.

## Step 1: Push to GitHub

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Name it something like `leetcode-tracker`
   - Keep it public or private (your choice)
   - Don't initialize with README (we already have one)

2. **Push your code**
   ```bash
   git add .
   git commit -m "Initial commit: LeetCode tracker with Cloudflare support"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

## Step 2: Set up Cloudflare Resources

### Create D1 Database
1. Go to https://dash.cloudflare.com
2. Navigate to "Workers & Pages" → "D1 SQL Database"
3. Click "Create database"
4. Name: `leetcode-tracker-db`
5. Copy the database ID for later

### Create KV Namespace
1. In Cloudflare dashboard, go to "Workers & Pages" → "KV"
2. Click "Create a namespace"
3. Name: `leetcode-tracker-sessions`
4. Copy the namespace ID for later

### Get API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Custom token" with permissions:
   - Account: Cloudflare Workers:Edit
   - Account: Account:Read
   - Account: D1:Edit
   - Account: Workers KV Storage:Edit
4. Copy the token

## Step 3: Update Configuration Files

### Update wrangler.toml
Replace the placeholder IDs in `wrangler.toml`:

```toml
# Replace these with your actual IDs
[[env.production.d1_databases]]
binding = "DB"
database_name = "leetcode-tracker-db"
database_id = "YOUR_ACTUAL_DATABASE_ID"

[[env.production.kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_ACTUAL_KV_NAMESPACE_ID"
```

### Commit the changes
```bash
git add wrangler.toml
git commit -m "Update Cloudflare configuration with actual IDs"
git push
```

## Step 4: Set up GitHub Secrets

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Add these secrets:
   - `CLOUDFLARE_API_TOKEN`: Your API token from Step 2
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID (find in dashboard sidebar)

## Step 5: Run Database Migration

You'll need to run the migration manually once:

```bash
# Install wrangler globally (if not already installed)
npm install -g wrangler

# Authenticate with your API token
wrangler auth

# Run the migration
wrangler d1 execute leetcode-tracker-db --file=./migrations/0001_initial_schema.sql
```

## Step 6: Deploy

Now every time you push to the main branch, GitHub Actions will automatically deploy to Cloudflare!

### Manual Deployment (if needed)
```bash
# Build for Cloudflare
vite build && esbuild server/worker.ts --platform=browser --packages=external --bundle --format=esm --outdir=dist --outfile=dist/worker.js

# Deploy
wrangler deploy
```

## Step 7: Access Your Application

Your app will be available at:
`https://leetcode-tracker.YOUR_SUBDOMAIN.workers.dev`

## Troubleshooting

### Build Issues
- Make sure all dependencies are installed: `npm install`
- Check that TypeScript compiles: `npm run check`

### Database Issues
- Verify database exists: `wrangler d1 list`
- Check migration ran: `wrangler d1 execute leetcode-tracker-db --command="SELECT name FROM sqlite_master WHERE type='table';"`

### Authentication Issues
- Verify API token has correct permissions
- Check account ID matches your Cloudflare account

### GitHub Actions Issues
- Check the Actions tab in your GitHub repo for build logs
- Ensure secrets are properly set in repository settings

## Next Steps

Once deployed:
1. Test all functionality (add problems, use AI chat)
2. Set up custom domain (optional)
3. Configure monitoring and alerts
4. Set up backup strategy for your D1 database

Your LeetCode tracker is now deployed with automatic CI/CD!