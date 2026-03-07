# Treasury Action - Deployment Checklist

## URL Configuration Summary

Your app is configured with a dual-URL architecture:

- **Primary Frontend (PiNet)**: https://treasuryaction4016.pinet.com
- **Backend API (Vercel)**: https://treasury-action.vercel.app

## Pre-Deployment Configuration

### Step 1: Set Environment Variables in Vercel

Navigate to: Vercel Dashboard → treasury-action → Settings → Environment Variables

Add these variables:

```env
# Required for Pi Network API communication
PI_API_KEY=your_actual_pi_api_key_here

# Official PiNet URL (Primary frontend)
NEXT_PUBLIC_PINET_URL=https://treasuryaction4016.pinet.com

# Backend/Hosting URL (Vercel API endpoints)
NEXT_PUBLIC_BACKEND_URL=https://treasury-action.vercel.app

# Production environment
NODE_ENV=production
```

**To get your PI_API_KEY:**
1. Go to https://develop.pi
2. Open Treasury Action app
3. Navigate to Settings → API Keys
4. Copy the key (starts with 'pi_')

### Step 2: Deploy to Vercel

After setting environment variables:

```bash
# From your local repository
git add .
git commit -m "Configure dual-URL setup for PiNet and Vercel"
git push

# Or trigger manual deploy in Vercel Dashboard
```

### Step 3: Verify Backend Endpoints

Test that your Vercel backend is responding:

```bash
# Health check
curl https://treasury-action.vercel.app/api/health

# Should return:
# { "status": "ok", "timestamp": "...", "environment": "production" }
```

### Step 4: Configure Pi Developer Portal

In Pi Developer Portal (https://develop.pi):

1. **App Settings**:
   - App URL: `https://treasuryaction4016.pinet.com`
   - Backend URL: `https://treasury-action.vercel.app`

2. **Sandbox Mode**: Enable for Testnet

3. **App Wallet**: Verify it shows "Connected"

## How the Dual-URL Setup Works

### Architecture Flow

```
User accesses PiNet URL (treasuryaction4016.pinet.com)
         ↓
Frontend loads from PiNet
         ↓
Pi Browser provides authentication
         ↓
Frontend makes API calls to Vercel (treasury-action.vercel.app)
         ↓
Vercel backend validates with Pi Network API
         ↓
Response returns to PiNet frontend
```

### Automatic URL Detection

The app automatically detects where it's running:

```typescript
// When accessed from treasuryaction4016.pinet.com
→ API calls route to: https://treasury-action.vercel.app/api/*

// When accessed from treasury-action.vercel.app  
→ API calls route to: https://treasury-action.vercel.app/api/*

// When running locally
→ API calls route to: http://localhost:3000/api/*
```

## Verification Steps

### 1. Test PiNet Frontend Access

1. Open Pi Browser
2. Navigate to: https://treasuryaction4016.pinet.com
3. **Expected**: App loads without "Authentication Failed" error
4. **Expected**: Pi authentication popup appears
5. **Expected**: After approval, main app interface loads

### 2. Test Backend API Connection

From browser console on PiNet URL:

```javascript
// Test health endpoint
fetch('https://treasury-action.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log)

// Should return: { status: "ok", ... }
```

### 3. Test Complete Flow

1. Access app from PiNet URL
2. Authenticate with Pi Network
3. Create a Treasury Action ticket
4. Verify signature request appears
5. Approve in Pi Wallet
6. Check action appears in History tab

## CORS Configuration

CORS is configured in `next.config.mjs` to allow:

- PiNet URL: `https://treasuryaction4016.pinet.com`
- Vercel URL: `https://treasury-action.vercel.app`
- Pi Developer Portal: `https://develop.pi`
- App Studio Preview: Various subdomains

All API endpoints (`/api/*`) have proper CORS headers set.

## Troubleshooting

### Issue: "Failed to connect to backend server"

**Check**:
1. Environment variables are set in Vercel
2. `PI_API_KEY` is correct and active
3. Vercel deployment succeeded
4. `/api/health` endpoint returns 200 OK

**Solution**:
```bash
# Verify deployment
vercel logs --follow

# Check environment variables
vercel env ls
```

### Issue: "App wallet not set up"

**Check**:
1. App Wallet is "Connected" in Pi Developer Portal
2. Backend URL is configured in Portal settings
3. Payment endpoints are accessible:
   - `/api/payments/approve`
   - `/api/payments/complete`
   - `/api/payments/incomplete`

### Issue: CORS errors in browser console

**Check**:
1. `next.config.mjs` has CORS headers
2. API routes include CORS headers in responses
3. Vercel deployment has latest code

**Solution**: Redeploy to Vercel to ensure CORS configuration is active

## Production Readiness Checklist

- [ ] PI_API_KEY set in Vercel environment variables
- [ ] NEXT_PUBLIC_PINET_URL configured
- [ ] NEXT_PUBLIC_BACKEND_URL configured
- [ ] Vercel deployment successful
- [ ] `/api/health` returns 200 OK
- [ ] Pi Developer Portal configured with correct URLs
- [ ] App Wallet shows "Connected" status
- [ ] Tested on Pi Browser from PiNet URL
- [ ] Pi authentication works
- [ ] Create action flow completes
- [ ] Wallet signature request appears
- [ ] Actions persist in History tab
- [ ] Cross-tab sync works (open in 2 tabs)

## Support & Documentation

- **URL Configuration**: See `/URL_CONFIGURATION.md`
- **Backend Setup**: See `/BACKEND_SETUP_GUIDE.md`
- **Step 10 Guide**: See `/STEP_10_SETUP_INSTRUCTIONS.md`
- **Testnet Testing**: See `/TESTNET_SETUP_GUIDE.md`

## Quick Command Reference

```bash
# Deploy to Vercel
git push

# View deployment logs
vercel logs

# Check environment variables
vercel env ls

# Test health endpoint
curl https://treasury-action.vercel.app/api/health

# Test from PiNet (in Pi Browser)
# Navigate to: https://treasuryaction4016.pinet.com
```

## Success Criteria

Your deployment is successful when:

1. PiNet URL loads app without errors
2. Pi authentication completes successfully
3. Backend API calls succeed
4. Treasury actions can be created
5. Wallet signatures work
6. Actions persist and sync across tabs
7. All Step 10 requirements are met

## Next Steps After Deployment

1. Complete Step 10 in Pi Developer Portal
2. Submit for Pi Network review
3. Monitor Vercel logs for any issues
4. Test with multiple users on Testnet
5. Prepare for Mainnet deployment
