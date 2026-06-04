# Authentication Flow Diagnosis

## Error Message
"Authentication Failed – Failed to connect to backend server"

## Authentication Flow

### Step 1: Pi SDK Authentication
**Trigger:** App loads in Pi Browser  
**Action:** `window.Pi.authenticate(['username', 'payments'], callback)`  
**Success:** Returns `{ accessToken, user: { uid, username } }`  
**Frontend Location:** `/contexts/pi-auth-context.tsx` line 116

### Step 2: Backend Login
**Trigger:** After Pi.authenticate() succeeds  
**Endpoint:** `POST /api/auth/login`  
**Request Body:** `{ pi_auth_token: "<Pi access token>" }`  
**Backend Location:** `/app/api/auth/login/route.ts`

**Backend Process:**
1. Receives `pi_auth_token` from frontend
2. Checks for `PI_API_KEY` environment variable
3. Verifies token with Pi Network API: `https://api.minepi.com/v2/me`
4. Returns user data: `{ id, username, credits_balance, terms_accepted, app_id }`

### Step 3: Set Authentication State
**Action:** Frontend stores user data and sets `isAuthenticated = true`  
**Result:** User can now interact with the app

## Common Failure Points

### 1. PI_API_KEY Not Set (Most Common)
**Symptom:** "Server configuration error - PI_API_KEY missing"  
**Solution:** Add `PI_API_KEY` in Vercel Environment Variables

**Steps to Fix:**
1. Go to https://develop.pi/developer-portal
2. Navigate to your app > Settings > API Key
3. Copy your API key
4. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
5. Add: `PI_API_KEY = <your_api_key>`
6. Redeploy the app

### 2. CORS Issues
**Symptom:** Request blocked in browser console  
**Solution:** API routes should automatically handle CORS in Next.js

### 3. Network Request Fails
**Symptom:** Cannot reach `/api/auth/login`  
**Possible Causes:**
- Vercel deployment not complete
- API route not deployed
- Network connectivity issues

### 4. Pi Network API Down
**Symptom:** "Invalid Pi authentication token" even with valid token  
**Solution:** Check Pi Network status at https://status.minepi.com

## Debug Logs Added

I've added debug logs throughout the authentication flow with `[v0]` prefix:

**Frontend (Console):**
- `[v0] Starting Pi.authenticate()`
- `[v0] Pi.authenticate() successful, token received`
- `[v0] Calling backend login at: /api/auth/login`
- `[v0] Backend login successful`

**Backend (Server Logs):**
- `[v0] /api/auth/login - Request received`
- `[v0] /api/auth/login - Token received, checking PI_API_KEY`
- `[v0] /api/auth/login - Verifying token with Pi Network API`
- `[v0] /api/auth/login - Pi API verification successful`
- `[v0] /api/auth/login - Returning user data`

## How to Debug

1. **Check Browser Console** in Pi Browser developer tools
   - Look for `[v0]` logs to see where the flow stops
   - Check for network errors on `/api/auth/login` request

2. **Check Vercel Logs**
   - Go to Vercel Dashboard > Your Project > Logs
   - Filter by `/api/auth/login`
   - Look for `[v0]` server logs

3. **Verify Environment Variables**
   - Vercel Dashboard > Settings > Environment Variables
   - Ensure `PI_API_KEY` is set
   - Ensure `NEXT_PUBLIC_PI_APP_ID` matches your app ID
   - Ensure `NEXT_PUBLIC_PI_SANDBOX=true` for Testnet

## Expected Behavior

**Successful Flow:**
```
[v0] Starting Pi.authenticate()
[v0] Pi.authenticate() successful, token received
[v0] Calling backend login at: /api/auth/login
[Server] [v0] /api/auth/login - Request received
[Server] [v0] /api/auth/login - Token received, checking PI_API_KEY
[Server] [v0] /api/auth/login - Verifying token with Pi Network API
[Server] [v0] /api/auth/login - Pi API verification successful, user: alice
[Server] [v0] /api/auth/login - Returning user data
[v0] Backend login successful
```

After this, the app should show the main interface.

## Next Steps

1. Deploy the updated code with debug logs
2. Test in Pi Browser from App Studio Preview
3. Check browser console and Vercel logs
4. Share the logs to identify exact failure point
5. Apply the appropriate fix based on where it fails
