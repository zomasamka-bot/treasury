# Package Manager Cleanup - NPM Only Setup

## Changes Made

### 1. Removed pnpm Configuration
- Deleted unsupported npm config values from `.npmrc` (prefer-stable, strict-peer-dependencies)
- Replaced corrupted `pnpm-lock.yaml` with a note file

### 2. Switched to NPM
- Created `package-lock.json` - clean npm lock file
- `.npmrc` now contains only valid npm settings:
  - `legacy-peer-deps=true`
  - `save-exact=false`

### 3. Added Explicit Vercel Configuration
- Created `vercel.json` to explicitly tell Vercel to use npm:
  ```json
  {
    "buildCommand": "npm run build",
    "devCommand": "npm run dev", 
    "installCommand": "npm ci",
    "framework": "nextjs"
  }
  ```

## Package Manager Setup

**Single Package Manager**: npm  
**Lock File**: package-lock.json (only)  
**Configuration**: .npmrc (npm only, no pnpm references)  
**Vercel Config**: vercel.json (forces npm)

## What Stays Unchanged
- All Treasury logic
- Payment creation flow
- Payment approval flow
- Wallet behavior
- History and records
- Unified payment system
- All application code

## Next Deployment
Vercel will now:
1. Detect only npm configuration
2. Use `npm ci` to install dependencies
3. Run `npm run build` to build the app
4. Show no pnpm warnings or parsing errors
