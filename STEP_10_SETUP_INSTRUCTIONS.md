# Step 10 Setup Instructions - Treasury Action App

## Current Issue

You're experiencing two errors during Step 10:
1. "Authentication Failed – Failed to connect to backend server"
2. "The developer of this app has not set up the app wallet"

## Root Cause

The app was configured to use an external backend that doesn't exist for your deployment. I've updated the configuration to use local Vercel API routes instead.

## What I Fixed

1. **Created Local Backend Configuration** (`/lib/local-backend-config.ts`)
   - Overrides external backend URLs
   - Uses local API routes (`/api/auth/login`, `/api/payments/*`)
   - Automatically detects your Vercel deployment URL

2. **Updated Pi Auth Context** (`/contexts/pi-auth-context.tsx`)
   - Now uses `LOCAL_BACKEND_URLS` instead of external backend
   - All authentication flows now route to your local API endpoints

3. **Backend Endpoints Already Created**
   - `/app/api/auth/login/route.ts` - Handles Pi authentication
   - `/app/api/auth/signin/route.ts` - Alternative auth endpoint
   - `/app/api/payments/approve/route.ts` - Approves wallet signatures
   - `/app/api/payments/complete/route.ts` - Completes approval flow
   - `/app/api/payments/incomplete/route.ts` - Handles incomplete flows
   - `/app/api/products/route.ts` - Returns product list
   - `/app/api/health/route.ts` - Health check endpoint

## Required Environment Variables

Add these to your Vercel project (Settings > Environment Variables):

```env
# REQUIRED - Get from Pi Developer Portal > Your App > Settings
PI_API_KEY=your_actual_pi_api_key_here

# Your Pi App ID (found in Developer Portal URL or app settings)
NEXT_PUBLIC_PI_APP_ID=your_app_id_here

# Set to true for Testnet
NEXT_PUBLIC_PI_SANDBOX=true

# Your Vercel deployment URL (e.g., treasury-action.vercel.app)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Step-by-Step Setup

### 1. Add Environment Variables in Vercel

1. Go to Vercel Dashboard
2. Select your Treasury Action project
3. Navigate to Settings > Environment Variables
4. Add each variable listed above
5. Select all environments (Production, Preview, Development)
6. Click "Save"

### 2. Get Your Pi API Key

1. Go to https://develop.pi/developer-portal
2. Select your Treasury Action app
3. Navigate to Settings or API Keys section
4. Copy your API Key
5. Add it to Vercel as `PI_API_KEY`

### 3. Redeploy Your App

After adding environment variables:
1. Go to Deployments tab in Vercel
2. Click the three dots on the latest deployment
3. Select "Redeploy"
4. OR push a new commit to trigger deployment

### 4. Test the Endpoints

Before testing in Pi Browser, verify your endpoints work:

**Health Check:**
```
https://your-app.vercel.app/api/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-14T...",
  "environment": "production",
  "pi_integration": "enabled"
}
```

**Products Endpoint:**
```
https://your-app.vercel.app/api/products
```
Expected response:
```json
{
  "products": []
}
```

### 5. Test in Pi Browser

1. Open Pi Browser app on your phone
2. Navigate to your app URL
3. The app should now authenticate successfully
4. Try creating a Treasury Action
5. The wallet signature should work without "app wallet not set up" error

## Understanding the Flow

### Without Fix (BROKEN):
```
Pi Browser → Your App → External Backend (doesn't exist) → ERROR
```

### With Fix (WORKING):
```
Pi Browser → Your App → Local Vercel API → Pi Network API → SUCCESS
```

## What Happens During Step 10

1. **Pi Browser loads your app**
2. **Authentication flow:**
   - App calls `Pi.authenticate()` (client-side)
   - Gets access token from Pi Network
   - Sends token to `/api/auth/login` (your Vercel backend)
   - Your backend validates with Pi Network API using `PI_API_KEY`
   - Returns user data to frontend

3. **Approval flow (Treasury Action):**
   - User creates Treasury Action
   - App calls `Pi.createPayment()` for wallet signature
   - Pi Wallet shows approval screen
   - User approves (no funds transferred)
   - Pi SDK calls `/api/payments/approve` (your backend)
   - Your backend approves instantly
   - Pi SDK calls `/api/payments/complete` (your backend)
   - Action status updates to "Submitted"

## Important Notes for Step 10

**Q: Do I need to process actual payments?**
A: No. Your `/api/payments/approve` endpoint approves instantly without any payment processing.

**Q: Do I need a database?**
A: No. For Step 10 testing, the in-memory state management is sufficient.

**Q: Will this work on Testnet?**
A: Yes. Set `NEXT_PUBLIC_PI_SANDBOX=true` and use your Testnet API key.

**Q: What about the "app wallet not set up" error?**
A: This happens when Pi SDK can't reach your backend endpoints. With the local configuration, your endpoints are now accessible.

## Troubleshooting

### Still seeing "Failed to connect to backend server"?

1. **Check environment variables are set in Vercel**
   - Go to Vercel > Settings > Environment Variables
   - Verify `PI_API_KEY` is present and correct

2. **Check deployment includes new code**
   - Ensure you've deployed after my changes
   - Check deployment logs for any errors

3. **Test endpoints directly**
   ```
   curl https://your-app.vercel.app/api/health
   ```

4. **Check browser console**
   - Open Pi Browser
   - Enable developer tools if possible
   - Look for network errors

### Still seeing "app wallet not set up"?

1. **Verify Pi API Key is correct**
   - The key must match your Testnet app
   - Check it's not expired or revoked

2. **Verify App ID is correct**
   - Set `NEXT_PUBLIC_PI_APP_ID` to your actual app ID
   - Find it in Developer Portal URL

3. **Check sandbox mode**
   - For Testnet: `NEXT_PUBLIC_PI_SANDBOX=true`
   - For Mainnet: `NEXT_PUBLIC_PI_SANDBOX=false`

## After Step 10 is Approved

Once Step 10 is complete, you can:
1. Continue with remaining review steps
2. Add database persistence (optional)
3. Add more features
4. Deploy to production with `treasury.pi` domain

## Support

If you continue experiencing issues after following these steps, the problem may be:
1. Pi API Key is invalid or expired
2. App ID mismatch
3. Vercel deployment issue
4. Pi Network Testnet connectivity issue

Check the Vercel deployment logs and browser console for specific error messages.
