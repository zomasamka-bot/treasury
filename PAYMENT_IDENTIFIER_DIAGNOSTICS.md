# Payment Identifier Diagnostics Guide

## Problem Statement
Payment stays on "Preparing payment..." in Pi Browser with "payment_not_found" 404 error. The paymentId from Pi doesn't match the actual payment created by Pi Network.

## Comprehensive Logging Added

### Client-Side Logging (Browser Console)
All client logs prefixed with `[v0] CLIENT:` in browser DevTools console:

1. **onReadyForServerApproval callback**
   ```
   [v0] CLIENT: onReadyForServerApproval fired
   [v0] CLIENT: paymentId from Pi: <actual-payment-id>
   [v0] CLIENT: paymentId type: string
   [v0] CLIENT: paymentId length: <length>
   [v0] CLIENT: sending paymentId in body: <actual-payment-id>
   ```

2. **Approval request details**
   ```
   [v0] CLIENT: calling approve endpoint: https://treasury-action.vercel.app/api/payments/approve
   [v0] CLIENT: Approve response status: <status>
   [v0] CLIENT: Approve response data: {success: true/false, ...}
   ```

3. **onReadyForServerCompletion callback**
   ```
   [v0] CLIENT: onReadyForServerCompletion fired
   [v0] CLIENT: paymentId from Pi: <actual-payment-id>
   [v0] CLIENT: txid from Pi: <blockchain-txid>
   [v0] CLIENT: sending paymentId: <actual-payment-id> txid: <txid>
   ```

### Server-Side Logging (Vercel Logs)
All server logs prefixed with `[v0] APPROVE ENDPOINT:` or `[v0] COMPLETE ENDPOINT:`:

1. **Approval endpoint**
   ```
   [v0] APPROVE ENDPOINT: request received
   [v0] APPROVE ENDPOINT: request body: {"paymentId":"..."}
   [v0] APPROVE ENDPOINT: extracted paymentId: <payment-id> type: string
   [v0] APPROVE ENDPOINT: calling Pi API endpoint: https://api.minepi.com/v2/payments/<payment-id>/approve
   [v0] APPROVE ENDPOINT: Pi API response status: <200|404|401|...>
   ```

2. **Completion endpoint**
   ```
   [v0] COMPLETE ENDPOINT: request received
   [v0] COMPLETE ENDPOINT: request body: {"paymentId":"...","txid":"..."}
   [v0] COMPLETE ENDPOINT: extracted paymentId: <id> txid: <txid>
   [v0] COMPLETE ENDPOINT: calling Pi API endpoint: https://api.minepi.com/v2/payments/<payment-id>/complete
   ```

## Troubleshooting Steps

### Step 1: Verify paymentId Flow
1. Open Pi Browser
2. Open DevTools (F12 → Console)
3. Create a Treasury Action and trigger payment
4. Look for `[v0] CLIENT: onReadyForServerApproval fired`
5. Note the exact paymentId value shown

**Expected**: paymentId should be a string like `PAYMENT-abc123...`

### Step 2: Verify Server Receives Same paymentId
1. Check Vercel logs for the same request
2. Look for `[v0] APPROVE ENDPOINT: request body:`
3. Verify the paymentId matches what was sent from client

**Expected**: Server receives the EXACT same paymentId as client sent

### Step 3: Verify Pi API Call
1. In Vercel logs, find `[v0] APPROVE ENDPOINT: calling Pi API endpoint:`
2. Verify the URL contains the correct paymentId
3. Check the response status: `[v0] APPROVE ENDPOINT: Pi API response status:`

**Expected**: 
- Status 200: Success
- Status 404: Payment not found (paymentId is wrong)
- Status 401: API key not authorized
- Status 400: Bad request

### Step 4: Identify Mismatch
If you see `404 payment_not_found`:

**Possible causes:**
1. **Wrong environment**: Payment created in testnet, but approving in mainnet (or vice versa)
2. **API key mismatch**: Using an API key from wrong app
3. **PaymentId corruption**: paymentId being modified during transmission
4. **Wrong domain**: Using wrong domain when calling approve endpoint

## Key Variables to Check

### From Browser Console (`[v0] CLIENT:`):
- ✓ `onReadyForServerApproval fired` - confirms callback is triggered
- ✓ `paymentId from Pi` - the actual value from Pi
- ✓ `paymentId type: string` - should always be string
- ✓ `sending paymentId in body` - verify it's not modified

### From Vercel Logs (`[v0] APPROVE ENDPOINT:`):
- ✓ `request body:` - what server actually received
- ✓ `extracted paymentId:` - parsed from request
- ✓ `calling Pi API endpoint:` - verify URL is correct
- ✓ `Pi API response status:` - what Pi Network returned

## Environment Configuration

Make sure these are set in Vercel:

```env
PI_API_KEY=<your-api-key>
NEXT_PUBLIC_APP_URL=https://treasury-action.vercel.app
```

The API key must be:
- From the same app in Pi Network admin panel
- For the same environment (testnet or mainnet)
- Still valid and not expired

## Treasury and Payment Flow
- Treasury logic: UNCHANGED
- History tracking: UNCHANGED
- Wallet behavior: UNCHANGED
- Unified payment system: UNCHANGED
- Only diagnostics added for troubleshooting

All changes are read-only logging statements. No functional changes to payment processing.
