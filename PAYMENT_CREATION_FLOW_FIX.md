# Payment Creation Flow Fix

## Problem
Payment was created in Pi Browser via `window.Pi.createPayment()` AFTER the payment didn't exist on Pi's backend, causing `404 payment_not_found` during approval.

## Root Cause
Pi Network requires **server-side payment creation first** via `POST /v2/payments` with the `PI_API_KEY`. The backend-created paymentId must then be passed to `window.Pi.createPayment()` on the client. This ensures Pi recognizes the payment when approval is attempted.

The previous flow (client creates, then server approves) violated Pi's payment lifecycle - the payment didn't exist in Pi's system until created via the backend API.

## Solution Implemented

### New File: `/app/api/payments/create/route.ts`
- Receives: `{ amount, memo, metadata }`  
- Calls: `POST https://api.minepi.com/v2/payments`
- Returns: `{ success: true, paymentId }`
- Logs all steps with `[v0] CREATE PAYMENT ENDPOINT:` prefix

### Updated: `/lib/local-backend-config.ts`
- Added `CREATE_PAYMENT: () => /api/payments/create` to `LOCAL_BACKEND_URLS`

### Updated: `/components/create-action-form.tsx`
- **Step 1:** Call `/api/payments/create` with amount, memo, metadata
- **Step 2:** Receive and store `paymentId` from backend
- **Step 3:** Pass that `paymentId` to `window.Pi.createPayment()`
- **Step 4:** When `onReadyForServerApproval` fires, it has the correct paymentId that exists in Pi

## Payment Lifecycle (Correct Order)
```
1. Backend: POST /v2/payments → creates payment → returns paymentId
2. Client: window.Pi.createPayment(paymentId) → shows wallet UI
3. Wallet: User signs → onReadyForServerApproval(paymentId)
4. Backend: POST /v2/payments/{paymentId}/approve → works ✓
5. Blockchain: Transaction confirmed → onReadyForServerCompletion(txid)
6. Backend: POST /v2/payments/{paymentId}/complete → works ✓
```

## Unchanged
✓ Treasury logic & records  
✓ History & status tracking  
✓ Wallet behavior  
✓ Unified payment system  
✓ Approval flow  

## Testing
- In Pi Browser, create a Treasury Action
- Watch backend create payment first (check Vercel logs)
- Verify `[v0] CREATE PAYMENT ENDPOINT:` logs show successful paymentId creation
- Then wallet should open and payment should succeed through to completion
