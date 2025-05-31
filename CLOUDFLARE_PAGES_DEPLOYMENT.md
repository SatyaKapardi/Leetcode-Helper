# Cloudflare Pages Deployment Guide

Deploy your LeetCode tracker to Cloudflare Pages with automatic GitHub integration.

## Step 1: Push to GitHub

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Repository name: `leetcode-tracker` (or your preferred name)
   - Set to Public or Private (your choice)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Push your code**
   ```bash
   git add .
   git commit -m "Initial commit: LeetCode tracker ready for Cloudflare Pages"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

## Step 2: Create Cloudflare D1 Database

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Navigate to "Workers & Pages" in the left sidebar

2. **Create D1 Database**
   - Click on "D1 SQL Database"
   - Click "Create database"
   - Database name: `leetcode-tracker-db`
   - Click "Create"
   - **Copy the Database ID** - you'll need this later

3. **Run Database Migration**
   - In your project directory, run:
   ```bash
   npx wrangler d1 execute leetcode-tracker-db --file=./migrations/0001_initial_schema.sql
   ```

## Step 3: Create KV Namespace

1. **Create KV Namespace**
   - In Cloudflare dashboard, go to "Workers & Pages" → "KV"
   - Click "Create a namespace"
   - Namespace name: `leetcode-tracker-sessions`
   - Click "Add"
   - **Copy the Namespace ID** - you'll need this later

## Step 4: Deploy to Cloudflare Pages

1. **Go to Cloudflare Pages**
   - In Cloudflare dashboard, click "Workers & Pages"
   - Click "Create application"
   - Choose "Pages" tab
   - Click "Connect to Git"

2. **Connect GitHub Repository**
   - Sign in to GitHub if prompted
   - Select your repository: `YOUR_USERNAME/leetcode-tracker`
   - Click "Begin setup"

3. **Configure Build Settings**
   - **Project name**: `leetcode-tracker` (or your preferred name)
   - **Production branch**: `main`
   - **Build command**: `node build-pages.js`
   - **Build output directory**: `dist`
   - Click "Save and Deploy"

## Step 5: Configure Environment Variables

1. **Add Database Binding**
   - In your Pages project, go to "Settings" → "Functions"
   - Scroll to "D1 database bindings"
   - Click "Add binding"
   - Variable name: `DB`
   - D1 database: Select `leetcode-tracker-db`
   - Click "Save"

2. **Add KV Binding**
   - Still in "Settings" → "Functions"
   - Scroll to "KV namespace bindings"
   - Click "Add binding"
   - Variable name: `SESSIONS`
   - KV namespace: Select `leetcode-tracker-sessions`
   - Click "Save"

3. **Add Environment Variables**
   - Go to "Settings" → "Environment variables"
   - Add these variables for Production:
     - `NODE_ENV`: `production`
     - `SESSION_SECRET`: `your-strong-random-secret-key`
   - Click "Save and Deploy"

## Step 6: Update wrangler.toml (Important!)

In your local project, update `wrangler.toml` with your actual IDs:

```toml
name = "leetcode-tracker"
pages_build_output_dir = "dist"
compatibility_date = "2024-01-15"
compatibility_flags = ["nodejs_compat"]

[build]
command = "node build-pages.js"

[env.production]
name = "leetcode-tracker-prod"

[[env.production.d1_databases]]
binding = "DB"
database_name = "leetcode-tracker-db"
database_id = "YOUR_ACTUAL_DATABASE_ID"  # Replace with your D1 database ID

[[env.production.kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_ACTUAL_KV_NAMESPACE_ID"  # Replace with your KV namespace ID
```

Then commit and push:
```bash
git add wrangler.toml
git commit -m "Update Cloudflare configuration with actual IDs"
git push
```

## Step 7: Verify Deployment

1. **Check Build Status**
   - In Cloudflare Pages, go to your project
   - Check the "Deployments" tab
   - Wait for the build to complete (usually 2-5 minutes)

2. **Test Your Application**
   - Your app will be available at: `https://leetcode-tracker.pages.dev` (or your custom project name)
   - Test these endpoints:
     - Visit the main page
     - Check `/api/health` for API status
     - Try adding a new problem solution

## Step 8: Automatic Deployments

Now every time you push to your main branch:
1. GitHub triggers Cloudflare Pages
2. Pages automatically builds your project
3. Deploys the new version instantly
4. Your changes are live globally

## Troubleshooting

### Build Fails
- Check the build logs in Cloudflare Pages → Deployments
- Ensure all dependencies are in `package.json`
- Verify build command: `node build-pages.js`

### Database Errors
- Verify D1 database binding is configured correctly
- Check that migration ran successfully:
  ```bash
  npx wrangler d1 execute leetcode-tracker-db --command="SELECT name FROM sqlite_master WHERE type='table';"
  ```

### API Not Working
- Ensure KV namespace binding is configured
- Check environment variables are set
- Verify `functions/_middleware.ts` is in your repository

### 404 Errors for Routes
- Make sure your build output includes `index.html`
- Verify SPA routing is working (all routes should serve index.html)

## Custom Domain (Optional)

1. **Add Custom Domain**
   - In Pages project, go to "Custom domains"
   - Click "Set up a custom domain"
   - Enter your domain name
   - Follow DNS configuration instructions

## Benefits

- **Global CDN**: Your app loads instantly worldwide
- **Automatic HTTPS**: SSL certificates managed automatically
- **Zero Downtime**: Deployments are instant with rollback capability
- **Free Tier**: 500 builds/month, unlimited bandwidth
- **Git Integration**: Deploy on every push automatically

Your LeetCode tracker is now deployed on Cloudflare's global network with automatic deployments from GitHub!