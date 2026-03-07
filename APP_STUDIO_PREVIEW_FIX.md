# App Studio Preview - Authentication Failed Fix

## The Exact Problem

When you open your app in **App Studio → Preview**, it immediately shows:
```
Authentication Failed – Failed to connect to backend server
```

## What's Happening Behind the Scenes

### Step 1: App Loads
```
App Studio Preview → Opens https://your-app.vercel.app
```

### Step 2: Pi SDK Authenticates (SUCCEEDS)
```javascript
// In /contexts/pi-auth-context.tsx line 99-105
window.Pi.authenticate(['username', 'payments']) 
→ Returns: { accessToken: "xxx", user: { uid, username } }
```
✅ This step works

### Step 3: Backend Login (FAILS HERE)
```javascript
// In /contexts/pi-auth-context.tsx line 116-119
POST https://your-app.vercel.app/api/auth/login
Body: { pi_auth_token: "xxx" }
```
❌ This is where it fails with "Failed to connect to backend server"

### Step 4: Backend Verifies Token
```javascript
// In /app/api/auth/login/route.ts line 27-32
fetch("https://api.minepi.com/v2/me", {
  headers: { Authorization: `Bearer ${pi_auth_token}` }
})
```
⏸️ Never reached because Step 3 fails

## The Root Cause

The `/api/auth/login` endpoint exists but fails for one of these reasons:

### Most Likely: Missing PI_API_KEY
```bash
# The endpoint checks for this at line 16:
const piApiKey = process.env.PI_API_KEY;

if (!piApiKey) {
  return { error: "Server configuration error - PI_API_KEY missing" }
}
```

### Also Check: Wrong App URL
The Pi SDK needs to know your deployment URL. If it's calling the wrong domain, authentication will fail.

## How to Fix It

### Option 1: Set Environment Variable in Vercel (RECOMMENDED)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
Key: PI_API_KEY
Value: [Your Pi API Key from Developer Portal]

Key: NEXT_PUBLIC_PI_APP_ID  
Value: [Your App ID from Developer Portal]

Key: NEXT_PUBLIC_APP_URL
Value: https://your-app.vercel.app
```

5. **Redeploy** the app (important!)

### Option 2: Verify Backend is Working

Test the endpoint directly:

```bash
# 1. Test if endpoint is reachable
curl https://your-app.vercel.app/api/test-auth

# Should return:
{
  "status": "ok",
  "config": {
    "hasApiKey": true,  ← MUST BE TRUE
    "apiKeyLength": 64,
    "appId": "your-app-id"
  }
}

# 2. If hasApiKey is false, the PI_API_KEY is not set
```

### Option 3: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment → **Function Logs**
3. Look for lines starting with `[v0] /api/auth/login`
4. If you see "PI_API_KEY not configured" → Environment variable missing

## Where to Get PI_API_KEY

1. Go to https://develop.pi/developer-portal
2. Click on your **Treasury Action** app
3. Go to **Settings** → **API Keys**
4. Copy the **Production API Key** (or Sandbox for Testnet)
5. Paste it into Vercel Environment Variables

## Verify the Fix

After setting environment variables and redeploying:

1. Open **App Studio → Preview**
2. Open browser console (F12)
3. Look for these logs:
```
[v0] Starting Pi.authenticate()
[v0] Pi.authenticate() successful, token received
[v0] Calling backend login at: /api/auth/login
[v0] Backend login successful
```

If you see all 4 logs → Authentication is working ✅

If it stops at "Calling backend login" → Check Vercel Function Logs for the error

## Still Not Working?

The error message "Failed to connect to backend server" is generic. Check:

1. ✅ PI_API_KEY is set in Vercel
2. ✅ NEXT_PUBLIC_PI_APP_ID is set
3. ✅ App has been redeployed after adding variables
4. ✅ Vercel Function Logs show "[v0] /api/auth/login - Request received"
5. ✅ No CORS errors in browser console

If all above are ✅ and it still fails, the issue is likely:
- Pi Developer Portal hasn't approved your app for Testnet yet
- App URL in Developer Portal doesn't match your Vercel deployment URL
- Network/firewall blocking Pi Browser from reaching Vercel

## Summary

**The exact endpoint being called:** `POST https://your-app.vercel.app/api/auth/login`

**What it expects:** `{ pi_auth_token: "xxx" }` in request body

**What it needs to work:** `PI_API_KEY` environment variable set in Vercel

**How to verify:** Check Vercel Function Logs for `[v0]` prefixed messages
