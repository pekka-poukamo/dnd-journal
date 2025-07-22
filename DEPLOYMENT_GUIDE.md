# GitHub Pages Deployment Guide for D&D Journal App

This guide explains how to deploy your D&D Journal static app using GitHub Pages with automated deployment from GitHub Actions.

## 🚀 Why GitHub Pages?

GitHub Pages is the perfect choice for this static D&D journal app because:

- ✅ **Completely FREE** - No hosting costs
- ✅ **Zero external setup** - Built into GitHub
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **Custom domain support** - Use your own domain if desired
- ✅ **Fast CDN** - Global content delivery
- ✅ **Automatic deployment** - Deploy on every push to main

## 🎯 Quick Setup (2 minutes)

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository: `https://github.com/pekka-poukamo/dnd-journal`
2. Click **Settings** (in the repository menu)
3. Scroll down and click **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. That's it! 🎉

### Step 2: Deploy Your App
```bash
# Make sure your changes are committed and pushed
git add .
git commit -m "Enable GitHub Pages deployment"
git push origin main
```

### Step 3: Access Your App
- Go to the **Actions** tab in your GitHub repository
- Watch the "Deploy D&D Journal to GitHub Pages" workflow complete (takes 1-2 minutes)
- Your app will be live at: **`https://pekka-poukamo.github.io/dnd-journal`**

## 🔄 How Automatic Deployment Works

The GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) automatically:

1. **Triggers** on every push to the `main` branch
2. **Checks out** your latest code
3. **Configures** GitHub Pages settings
4. **Uploads** all your static files (HTML, CSS, JS)
5. **Deploys** to the GitHub Pages CDN
6. **Reports** the deployment URL

**Deployment time:** Usually 1-3 minutes
**Monitoring:** Watch progress in the "Actions" tab

## 🛠 Local Development

Test your app locally before deploying:

```bash
# Start local development server
npm start

# This opens http://localhost:3000
# Test all functionality before pushing to main
```

## 🌐 Custom Domain (Optional)

To use your own domain instead of `pekka-poukamo.github.io/dnd-journal`:

### Step 1: Add CNAME file
Create a file named `CNAME` (no extension) in your repository root:
```
your-dnd-journal.com
```

### Step 2: Configure DNS
Add a CNAME record with your domain provider:
```
Type: CNAME
Name: www (or @)
Value: pekka-poukamo.github.io
```

### Step 3: Enable in GitHub
1. Go to Settings → Pages
2. Enter your custom domain
3. Enable "Enforce HTTPS"

## 🔧 Advanced Configuration

### Manual Deployment Trigger
You can manually trigger deployment without pushing code:
1. Go to Actions tab
2. Click "Deploy D&D Journal to GitHub Pages"
3. Click "Run workflow"

### Environment Variables
If you need to add environment variables (like API keys):
1. Go to Settings → Secrets and variables → Actions
2. Add your secrets (e.g., `OPENAI_API_KEY`)
3. Reference in your JavaScript: `process.env.OPENAI_API_KEY`

### Deployment Status Badge
Add this to your README.md to show deployment status:
```markdown
[![Deploy to GitHub Pages](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-pages.yml)
```

## 🐛 Troubleshooting

### Common Issues

**Deployment fails:**
- Check the Actions tab for error messages
- Ensure `index.html` exists in the repository root
- Verify all file paths are correct (case-sensitive)

**404 Page Not Found:**
- Make sure you have an `index.html` file
- Check that GitHub Pages is enabled with "GitHub Actions" source
- Wait a few minutes for DNS propagation

**JavaScript/CSS not loading:**
- Use relative paths: `./css/main.css` instead of `/css/main.css`
- Check browser console for 404 errors
- Verify file names match exactly (case-sensitive)

### Getting Help
- Check the [GitHub Pages documentation](https://docs.github.com/en/pages)
- View deployment logs in the Actions tab
- Open an issue in your repository for specific problems

## ✅ Final Checklist

- [ ] GitHub Pages enabled with "GitHub Actions" source
- [ ] `index.html` file exists in repository root
- [ ] All assets use relative paths
- [ ] Latest code pushed to `main` branch
- [ ] Workflow completed successfully in Actions tab
- [ ] App accessible at `https://pekka-poukamo.github.io/dnd-journal`

Your D&D Journal app is now automatically deployed and will update every time you push changes to the main branch! 🎲✨