# ADR-0018: Raspberry Pi Git-Push Deployment

## Status
Accepted

## Context
The project previously deployed to Surge.sh (ADR-0008). Deployment is now moving to a self-hosted Raspberry Pi, which exposes a bare Git repository and a post-receive hook that checks out the working tree and performs any lightweight deployment steps on the device. The app remains a static site with no build tools (ADR-0006).

## Decision
Adopt a simple git-over-SSH deployment to a Raspberry Pi:
- GitHub Actions pushes the current `main` commit to the Pi's bare repository over SSH
- The Pi's post-receive hook performs the deployment from the bare repo (e.g., checkout/update working tree, restart a static file server if needed)
- No containerization, no complex pipelines, and no build step

## Rationale
- Simplicity: mirrors the local `git push pi` workflow
- Reliability: uses plain Git and SSH
- Control: deployment logic resides in a small post-receive hook on the Pi
- Compliance: no build tools or bundlers (ADR-0006)

## Consequences
### Positive
- End-to-end deployment is a single git push from CI
- Clear separation of concerns: CI verifies and pushes, Pi hook deploys
- Works offline within local network after initial setup

### Negative
- Requires SSH key management and host key provisioning
- Post-receive hook script must be maintained on the Pi

## Compliance
Required approach:
- Deployment is performed by `git push` over SSH to the Pi bare repo
- GitHub Actions uses an SSH deploy key dedicated to the Pi
- The Pi runs a minimal post-receive hook to update the working tree and (optionally) generate metadata like version info

Forbidden additions:
- Containerization or platform-specific deploy services
- Multi-stage CI/CD pipelines beyond a single push step
- Build tools or bundlers (ADR-0006)

## Implementation
GitHub Actions (high-level):
- Add secrets: `PI_HOST`, `PI_USER`, `PI_REPO_PATH`, `PI_SSH_PRIVATE_KEY` (and optional `PI_SSH_PORT`)
- Use an SSH agent in CI, add known_hosts via `ssh-keyscan`, and `git push` to the Pi remote

Pi server (example outline, not committed here):
- Bare repo at `/home/pi/repos/dnd-journal.git`
- Working tree at `/var/www/dnd-journal`
- Post-receive hook updates working tree, e.g.:

```
#!/usr/bin/env bash
set -euo pipefail
GIT_WORK_TREE=/var/www/dnd-journal git checkout -f
# Note: version info is not generated during CI; `js/version.js` remains static
# Optional: reload static server (if using one)
```

## Supersedes
- ADR-0008: Surge.sh Deployment Only (now superseded by this ADR)