# ADR-0008: Surge.sh Deployment Only

## Status
Accepted

## Context
Static sites can be deployed to many platforms including Netlify, Vercel, GitHub Pages, AWS S3, traditional web hosts, or specialized static hosting services. We need to choose a deployment strategy that matches our simplicity goals.

## Decision
We will use **Surge.sh only** for deployment with manual deployment as fallback.

## Rationale
- **Zero Configuration**: No build step or complex deployment configs
- **Single Command**: `surge .` deploys the entire site
- **Static-First**: Designed specifically for static HTML/CSS/JS sites
- **AI Agent Prevention**: Stops agents from adding complex CI/CD pipelines
- **Cost**: Free tier sufficient for personal projects
- **Speed**: Direct file upload, no build process
- **Simplicity**: Matches the project's minimal philosophy

## Consequences
### Positive
- Instant deployment from any directory
- No configuration files needed
- Works perfectly with static HTML/CSS/JS files
- Simple automation with GitHub Actions
- No vendor lock-in (can copy files anywhere)

### Negative
- Limited to static sites only (perfect for our use case)
- Basic analytics compared to other platforms
- No advanced features like form handling or edge functions
- Manual domain management

## Compliance
**Required deployment method:**
- Primary: Surge.sh with `surge .` or `npm run deploy`
- GitHub Actions: Automated deployment on push to main
- Fallback: Manual deployment with `surge . custom-domain.surge.sh`

**Forbidden deployment additions:**
- Docker containers or containerization
- Server-side rendering platforms (Next.js, Nuxt, etc.)
- Complex CI/CD pipelines with multiple stages
- Database-dependent hosting (Heroku, Railway, etc.)
- CDN configuration beyond Surge's defaults
- Custom server configurations
- Serverless functions or edge computing
- Build step deployment (since we have no build step)

## Implementation
```bash
# ✅ Allowed deployment
npm install -g surge
surge .                          # Manual deployment
npm run deploy                   # Package.json script
surge . custom-domain.surge.sh   # Custom domain

# ❌ Forbidden
docker build -t app .           # No containers
vercel --prod                   # No complex platforms
aws s3 sync                     # No cloud complexity
```

**GitHub Actions:**
- Simple workflow that runs `surge .`
- Only on push to main branch
- No complex build matrices or environments
- Fail gracefully if credentials missing

**Package.json scripts:**
```json
{
  "deploy": "surge .",
  "deploy:domain": "surge . dnd-journal.surge.sh"
}
```

## Domain Management
- Use Surge's free `.surge.sh` subdomains
- Custom domains via Surge's simple CNAME setup
- No complex DNS management or SSL certificate handling
- Keep domain configuration minimal and documented
