# Surge.sh Deployment Guide for D&D Journal App

This guide explains how to deploy your D&D Journal static app using Surge.sh with automated deployment from GitHub Actions.

## 🚀 Why Surge.sh?

Surge.sh is perfect for this static D&D journal app because:

- ✅ **Completely FREE** for static sites
- ✅ **Custom domain support** - Use your own domain
- ✅ **Fast CDN** - Global content delivery
- ✅ **Simple setup** - Just a few commands
- ✅ **HTTPS by default** - Secure hosting
- ✅ **Works with private repos** - No GitHub Pages limitations

## 🎯 Quick Setup (5 minutes)

### Step 1: Create Surge.sh Account
1. Go to [surge.sh](https://surge.sh) and create a free account
2. Install Surge CLI locally:
   ```bash
   npm install -g surge
   ```
3. Login to get your credentials:
   ```bash
   surge login
   # Enter your email and password
   
   surge whoami
   # Shows your login email
   
   surge token
   # Shows your authentication token (save this!)
   ```

### Step 2: Configure GitHub Secrets
1. Go to your GitHub repository: `https://github.com/pekka-poukamo/dnd-journal`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets by clicking **"New repository secret"**:
   - **`SURGE_LOGIN`**: Your Surge.sh email
   - **`SURGE_TOKEN`**: Your token from `surge token` command

> **Note:** The domain (`dnd-journal.surge.sh`) is configured in the workflow file, not as a secret.

### Step 3: Deploy Your App
```bash
# Make sure your changes are committed and pushed
git add .
git commit -m "Enable Surge.sh deployment"
git push origin main
```

### Step 4: Access Your App
- Go to the **Actions** tab in your GitHub repository
- Watch the "Deploy D&D Journal to Surge.sh" workflow complete (takes 1-2 minutes)
- Your app will be live at your chosen domain (e.g., `https://dnd-journal.surge.sh`)

## 🔄 How Automatic Deployment Works

The GitHub Actions workflow (`.github/workflows/deploy-surge.yml`) automatically:

1. **Triggers** on every push to the `main` branch
2. **Checks out** your latest code
3. **Checks for credentials** - if missing, skips deployment gracefully
4. **Installs** Surge CLI (if credentials found)
5. **Deploys** to your Surge.sh domain using stored credentials
6. **Reports** the deployment URL

### **Conditional Deployment:**
- **✅ With secrets**: Full automatic deployment
- **⏭️ Without secrets**: Deployment skipped, helpful instructions shown
- **🚫 Never fails**: Missing secrets won't break your workflow

**Deployment time:** Usually 1-2 minutes
**Monitoring:** Watch progress in the "Actions" tab

## 🛠 Local Development & Manual Deployment

### Local Development
```bash
# Start local development server
npm start
# Opens http://localhost:3000

# Test all functionality before pushing to main
```

### Manual Deployment (Alternative)
If you prefer to deploy manually instead of using GitHub Actions:

```bash
# Install Surge globally
npm install -g surge

# Deploy from your project directory
npm run deploy

# Or deploy to a specific domain
npm run deploy:domain
# Uses SURGE_DOMAIN environment variable or defaults to dnd-journal.surge.sh

# Or use Surge directly
surge . your-custom-domain.surge.sh
```

## 🌐 Custom Domain Setup

### Using Surge Subdomain (Free)
Choose any available subdomain like:
- `your-dnd-journal.surge.sh`
- `epic-adventures.surge.sh`
- `dungeon-master-notes.surge.sh`

### Using Your Own Domain
1. **Set up domain in Surge:**
   ```bash
   surge . yourdomain.com
   ```

2. **Configure DNS with your domain provider:**
   - **A Record**: Point to `45.55.110.124`
   - **CNAME**: Point `www` to `na-west1.surge.sh`

3. **Update the workflow configuration:**
   - Edit `.github/workflows/deploy-surge.yml`
   - Change the `SURGE_DOMAIN` environment variable to your custom domain

## 🔧 Advanced Configuration

### Manual Deployment Trigger
You can manually trigger deployment without pushing code:
1. Go to Actions tab
2. Click "Deploy D&D Journal to Surge.sh"
3. Click "Run workflow"

### Environment Variables
If you need to add environment variables (like API keys):
1. Go to Settings → Secrets and variables → Actions
2. Add your secrets (e.g., `OPENAI_API_KEY`)
3. Reference in your workflow if needed

### Deployment Status Badge
Add this to your README.md to show deployment status:
```markdown
[![Deploy to Surge.sh](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml/badge.svg)](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml)
```

### Multiple Environments
You can set up different domains for different branches by modifying the `SURGE_DOMAIN` environment variable in the workflow:
- `main` → `dnd-journal.surge.sh` (production)
- `develop` → `dnd-journal-dev.surge.sh` (staging)

### Changing the Domain
To change the deployment domain:
1. Edit `.github/workflows/deploy-surge.yml`
2. Update the `SURGE_DOMAIN` environment variable:
   ```yaml
   env:
     SURGE_DOMAIN: your-new-domain.surge.sh
   ```
3. Commit and push the changes

## 🐛 Troubleshooting

### Common Issues

**Authentication fails:**
- Verify `SURGE_LOGIN` and `SURGE_TOKEN` secrets are correct
- Make sure you ran `surge login` locally first
- Check that your Surge.sh account is active

**Domain already taken:**
- Choose a different subdomain
- Check if you already own the domain with `surge list`

**Deployment fails:**
- Check the Actions tab for error messages
- Ensure `index.html` exists in the repository root
- Verify all file paths are correct (case-sensitive)

**404 Page Not Found:**
- Make sure you have an `index.html` file
- Check that the domain is correctly configured
- Wait a few minutes for DNS propagation (custom domains)

### Getting Help
- Check the [Surge.sh documentation](https://surge.sh/help)
- View deployment logs in the Actions tab
- Run `surge --help` for CLI commands
- Open an issue in your repository for specific problems

## 💰 Pricing

- **Free tier**: Perfect for static sites like this D&D journal
- **Custom domains**: Free with basic setup
- **Bandwidth**: Generous free allowance
- **SSL**: Included automatically

## ✅ Final Checklist

- [ ] Surge.sh account created
- [ ] Surge CLI installed locally (`npm install -g surge`)
- [ ] GitHub secrets configured (`SURGE_LOGIN`, `SURGE_TOKEN`)
- [ ] `index.html` file exists in repository root
- [ ] Latest code pushed to `main` branch
- [ ] Workflow completed successfully in Actions tab
- [ ] App accessible at your Surge.sh domain

Your D&D Journal app is now automatically deployed to Surge.sh and will update every time you push changes to the main branch! 🎲✨

## 🚀 Next Steps

1. **Set up the GitHub secrets** (`SURGE_LOGIN`, `SURGE_TOKEN`)
2. **Optionally change the domain** in the workflow file
3. **Push to main branch**
4. **Start managing your D&D adventures!**