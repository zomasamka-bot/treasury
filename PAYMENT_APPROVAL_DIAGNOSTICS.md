# Payment Approval Diagnostics & Fixes

## Problem Summary
Payment approval was timing out (60-second limit) in Pi Browser because:
1. `/approve` endpoint wasn't properly communicating errors back to the client
2. Client error handling wasn't catching `success: false` responses
3. Server logs weren't visible for debugging

## Fixes Applied

### 1. Enhanced `/api/payments/approve` Route
- Added comprehensive console logging to track each step
- Returns `success: false` in response body (not just HTTP status)
- Always returns HTTP 200 with structured error data for client to handle
- Includes `PI_API_KEY` existence check with logging
- Catches Redis persistence errors without failing approval
- Error details included for debugging

### 2. Enhanced `/api/payments/complete` Route  
- Same logging and error handling as approve route
- Returns `success: false` with error details
- Ensures client always knows completion status

### 3. Improved Client-Side Handling in `CreateActionForm`
- **Approval handler** (`onReadyForServerApproval`):
  - Parses response JSON with proper error handling
  - Checks BOTH HTTP status AND `success` flag
  - Sets status to "Failed" immediately on error
  - Returns early to prevent further processing
  
- **Completion handler** (`onReadyForServerCompletion`):
  - Same improved error handling and parsing
  - Properly detects failure before updating status to "Reserved"

## Debugging Commands

If payment still times out, check server logs:

### 1. View Approval Logs
```bash
# In Vercel Dashboard → Functions → /api/payments/approve
# Look for "[v0]" prefixed logs
```

### 2. Check PI_API_KEY Configuration
```bash
# Verify in Vercel Dashboard → Settings → Environment Variables
# PI_API_KEY should be set to your production key from develop.pi
```

### 3. Test Pi Network Connectivity
```bash
# From any browser console in Pi Browser:
fetch('https://api.minepi.com/v2/payments/test', {
  method: 'GET',
  headers: { 'Authorization': 'Key YOUR_KEY' }
})
.then(r => r.text())
.then(console.log)
```

## Expected Flow in Pi Browser

1. User fills form and clicks "Reserve & Sign"
2. Pi Wallet opens (on mobile)
3. User approves the transaction
4. `onReadyForServerApproval` callback fires
5. **Client calls** `/api/payments/approve` with paymentId
6. **Server logs**: "[v0] Approving payment: {paymentId}"
7. **Server calls**: `https://api.minepi.com/v2/payments/{paymentId}/approve`
8. **Server logs**: "[v0] Pi API approval successful"
9. **Server persists** to Redis cache
10. **Server logs**: "[v0] Payment record persisted to Redis"
11. **Server returns**: `{ success: true, paymentId, status: "approved" }`
12. **Client logs**: "[v0] Approval successful"
13. Pi Network completes transaction
14. `onReadyForServerCompletion` callback fires
15. Same flow repeats for `/complete` endpoint
16. **Final status**: "Reserved" displayed with receipt

## If Timeout Still Occurs

### Check in Console (F12)
```javascript
// Look for these logs in order:
"[v0] onReadyForServerApproval called with paymentId: ..."
"[v0] Calling approve endpoint: https://treasury-action.vercel.app/api/payments/approve"
"[v0] Approve response status: 200"  // or 500 = error
"[v0] Approve response data: { success: true, ... }" // or success: false
```

### Most Common Issues

1. **HTTP 500 on approve endpoint**
   - `PI_API_KEY` is not set in Vercel environment
   - Fix: Add `PI_API_KEY` to Vercel Dashboard → Settings → Environment Variables

2. **HTTP 200 but `success: false` with "Pi Network..." error**
   - Pi API is rejecting the approval (bad paymentId, expired, etc)
   - Check server logs for detailed error from Pi API

3. **No response at all (truly times out)**
   - Network issue or server is down
   - Check Vercel deployment status dashboard

## Browser Console Logs

All diagnostics are now logged to browser console with `[v0]` prefix:
- Payment flow progress
- Endpoint URLs being called
- HTTP status codes
- Response bodies
- Network errors
- Timing information

Monitor these logs in Pi Browser (F12) to diagnose timing issues.

## Next Steps

1. Test payment flow again in Pi Browser
2. Check F12 console for `[v0]` logs
3. If still failing, check Vercel function logs
4. Verify `PI_API_KEY` is set in Vercel Dashboard
5. If needed, restart the Pi Testnet preview or Pi Browser app
