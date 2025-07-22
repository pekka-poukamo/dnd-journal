# Automated Deployment Guide for D&D Journal App

This guide explains how to set up automated deployment for your D&D Journal static app from GitHub. I've created three different deployment options for you to choose from.

## 🚀 Deployment Options

### Option 1: GitHub Pages (Recommended - FREE & Easy)

**Advantages:**
- ✅ Completely free
- ✅ No external setup required
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ Built into GitHub

**Setup Steps:**
1. Go to your GitHub repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow file `.github/workflows/deploy-pages.yml` is already created
5. Push your code to the `main` branch and it will automatically deploy

**Access your app at:** `https://your-username.github.io/dnd-journal`

### Option 2: Surge.sh (Original Plan)

**Advantages:**
- ✅ Free for static sites
- ✅ Custom domain support
- ✅ Simple and fast
- ✅ Good for static sites

**Setup Steps:**
1. Create a Surge.sh account at [surge.sh](https://surge.sh)
2. Install Surge CLI locally: `npm install -g surge`
3. Run `surge login` and `surge whoami` to get your login email
4. Get your Surge token by running: `surge token`
5. Add these secrets to your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add `SURGE_LOGIN` (your email)
   - Add `SURGE_TOKEN` (from step 4)
   - Add `SURGE_DOMAIN` (e.g., `your-dnd-journal.surge.sh`)
6. Push to `main` branch to trigger deployment

### Option 3: Netlify

**Advantages:**
- ✅ Free tier available
- ✅ Excellent performance
- ✅ Advanced features (forms, functions)
- ✅ Custom domain support

**Setup Steps:**
1. Create a Netlify account at [netlify.com](https://netlify.com)
2. Create a new site (you can do this manually first)
3. Get your Site ID from Site settings → General → Site details
4. Generate a Personal Access Token from User settings → Applications
5. Add these secrets to your GitHub repository:
   - `NETLIFY_AUTH_TOKEN` (your personal access token)
   - `NETLIFY_SITE_ID` (your site ID)
6. Push to `main` branch to trigger deployment

## 🔧 Current Workflow Files

I've created three workflow files in `.github/workflows/`:

1. **`deploy-pages.yml`** - For GitHub Pages deployment
2. **`deploy.yml`** - For Surge.sh deployment  
3. **`deploy-netlify.yml`** - For Netlify deployment

## 🎯 Quick Start (GitHub Pages - Recommended)

Since GitHub Pages requires no external setup and is completely free, here's the fastest way to get started:

1. **Enable GitHub Pages:**
   - Go to your repo settings
   - Click "Pages" in sidebar
   - Under "Source", select "GitHub Actions"

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Add automated deployment workflows"
   git push origin main
   ```

3. **Access your app:**
   - Go to the "Actions" tab in your GitHub repo
   - Watch the deployment process
   - Once complete, your app will be available at:
     `https://pekka-poukamo.github.io/dnd-journal`

## 🔄 How It Works

- **Trigger:** Every push to the `main` branch automatically triggers deployment
- **Process:** GitHub Actions runs the workflow, builds (if needed), and deploys your static files
- **Time:** Usually takes 1-3 minutes for deployment to complete
- **Monitoring:** You can watch progress in the "Actions" tab of your GitHub repository

## 🛠 Customization

### Custom Domain (GitHub Pages)
1. Add a `CNAME` file to your repository root with your domain
2. Configure DNS settings with your domain provider
3. Enable custom domain in GitHub Pages settings

### Environment Variables
If your app needs environment variables (like API keys), you can add them as GitHub Secrets:
1. Go to Settings → Secrets and variables → Actions
2. Add your secrets (e.g., `OPENAI_API_KEY`)
3. Reference them in the workflow files as `${{ secrets.SECRET_NAME }}`

## 📝 Notes

- All three options support custom domains
- GitHub Pages is the most straightforward for personal projects
- Surge.sh is great if you prefer the original plan from your architecture
- Netlify offers more advanced features if you need them later

Choose the option that best fits your needs. GitHub Pages is recommended for simplicity and zero cost!