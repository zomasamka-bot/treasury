# Payment App Context Mismatch - Diagnostic & Fix Guide

## Problem Identified

**404 payment_not_found** error when approving payments in Pi Browser.

The paymentId is correctly created by Pi Browser and sent to the backend, but the Pi API responds with `payment_not_found`. This indicates an **app context mismatch**:

- **Payment created in**: Pi Browser with App A (or your live app)
- **Payment approval via**: Backend using PI_API_KEY from App B (or different credentials)

Pi Network validates payments against the app credentials used to approve them. When they don't match, the payment cannot be found.

## Root Cause

The `PI_API_KEY` environment variable on your backend must come from the **exact same app** that is running in Pi Browser. If they're from different apps, Pi's API will reject the approval.

## Diagnostic Output

Both `/api/payments/approve` and `/api/payments/complete` endpoints now provide enhanced diagnostics:

```
[v0] APPROVE ENDPOINT: using PI_API_KEY: xxxxxxxx...
[v0] APPROVE ENDPOINT: calling Pi API endpoint: https://api.minepi.com/v2/payments/{paymentId}/approve
[v0] APPROVE ENDPOINT: Pi API error response: 404 {
  "error": "payment_not_found",
  "detail": "No payment found with this identifier"
}
[v0] APPROVE ENDPOINT: DIAGNOSTIC INFO:
[v0]   - This 404 payment_not_found error typically means:
[v0]   - 1. PI_API_KEY belongs to a different app than the one in Pi Browser
[v0]   - 2. The payment was created in one app context, but backend is using a different app's credentials
[v0]   - 3. Verify PI_API_KEY matches the app ID running in Pi Browser
```

## How to Fix

### Step 1: Identify Your App in Pi Browser

When you open the app in Pi Browser, it runs **within a specific app context**. To find your app ID:

1. Open Pi Browser
2. Open your app → F12 Developer Console
3. Look for Pi SDK initialization messages
4. Or check your app registration in Pi Developer Portal

Your app will have a **unique App ID** in Pi Developer Portal.

### Step 2: Get the Correct PI_API_KEY

1. Go to **Pi Developer Portal** (https://pi.dev/develop)
2. Find your app (the one you see in Pi Browser)
3. Go to **Settings** → **API Keys** or **Credentials**
4. Copy the **Server API Key** (not client key)

### Step 3: Update Environment Variable

Set `PI_API_KEY` to the key from Step 2:

```bash
# In Vercel Environment Variables or .env.production
PI_API_KEY=your_actual_server_api_key_from_step_2
```

### Step 4: Verify the Alignment

After updating PI_API_KEY:

1. Redeploy to Vercel
2. Open app in Pi Browser
3. Create a new Treasury Action
4. Check Vercel logs for the key prefix:
   - `[v0] APPROVE ENDPOINT: using PI_API_KEY: xxxxxxxx...`
5. If the key prefix matches your app's credentials, it should work

## Client-Side Logging

The browser console also logs the payment flow:

```
[v0] CLIENT: onReadyForServerApproval fired
[v0] CLIENT: paymentId from Pi: yLjH4ndOOruFwgR4SxC6ZLXVD5p9
[v0] CLIENT: calling approve endpoint: https://your-app.vercel.app/api/payments/approve
[v0] CLIENT: Approve response data: {
  success: false,
  error: "Pi Network approval failed (404)",
  diagnostic: "Payment not found - check if PI_API_KEY belongs to correct app"
}
```

## Unchanged Systems

✓ Treasury Action logic  
✓ Action history & records  
✓ Wallet approval flow  
✓ Unified payment system  
✓ Reference ID generation  

## Next Steps

1. Verify your PI_API_KEY is from the correct app
2. Ensure it's the **Server API Key**, not client key
3. Redeploy with correct credentials
4. Test payment creation in Pi Browser
5. Monitor Vercel logs for confirmation

If the issue persists after updating, check:
- Is the app running in Pi Browser the **same app** registered in Pi Developer Portal?
- Are you using Production or Testnet? (Ensure PI_API_KEY matches the same environment)
- Has the PI_API_KEY expired or been revoked?
