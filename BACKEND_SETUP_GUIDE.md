# Backend Setup Guide - Treasury Action App

## Step 10 Backend Configuration for Pi Network Testnet

This guide provides step-by-step instructions to configure the backend infrastructure required to complete Step 10 and enable user testing on Pi Testnet.

---

## 🚨 Error Resolution

**Error:** "Authentication Failed – Failed to connect to backend server."

**Solution:** The backend API routes have been implemented. Follow the configuration steps below.

---

## 📋 Prerequisites

1. **Pi Network Developer Account** with access to Developer Portal
2. **App registered** in Pi Developer Portal (Steps 1-9 completed)
3. **Vercel account** for deployment
4. **Pi API Key** from Developer Portal

---

## 🔧 Configuration Steps

### Step 1: Get Your Pi API Key

1. Go to **Pi Developer Portal**: https://develop.pi
2. Navigate to your **Treasury Action** app
3. Go to **Settings** or **API Keys** section
4. Copy your **API Key** (starts with `pi_...`)

### Step 2: Configure Environment Variables in Vercel

1. Go to your **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **Treasury Action** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

```
Variable Name: PI_API_KEY
Value: [paste your Pi API key here]
Environment: Production, Preview, Development (select all)
```

5. Click **Save**

### Step 3: Redeploy Your Application

After adding the environment variable:

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** menu on the latest deployment
3. Select **Redeploy**
4. Wait for deployment to complete (~2 minutes)

### Step 4: Verify Backend is Working

Visit your deployed URL + `/api/health`:

```
https://your-app.vercel.app/api/health
```

You should see:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "environment": "production",
  "piSdkConfigured": true,
  "endpoints": {
    "auth": "/api/auth/signin",
    "paymentApprove": "/api/payments/approve",
    "paymentComplete": "/api/payments/complete",
    "paymentIncomplete": "/api/payments/incomplete"
  }
}
```

✅ If `piSdkConfigured: true`, your backend is ready.

---

## 🔌 Implemented Backend Endpoints

### 1. Authentication Endpoint

**Path:** `/api/auth/signin`  
**Method:** POST  
**Purpose:** Verify Pi user authentication tokens

**Request:**
```json
{
  "authToken": "user_auth_token_from_pi_sdk"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user_unique_id",
    "username": "piuser123"
  }
}
```

### 2. Payment Approval Endpoint

**Path:** `/api/payments/approve`  
**Method:** POST  
**Purpose:** Approve wallet signature requests (no fund transfer)

**Request:**
```json
{
  "paymentId": "payment_id_from_pi_wallet"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "payment_id_from_pi_wallet",
  "approved": true
}
```

### 3. Payment Completion Endpoint

**Path:** `/api/payments/complete`  
**Method:** POST  
**Purpose:** Complete wallet signature flow

**Request:**
```json
{
  "paymentId": "payment_id_from_pi_wallet",
  "txid": "blockchain_transaction_id"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "payment_id_from_pi_wallet",
  "txid": "blockchain_transaction_id",
  "completed": true
}
```

### 4. Payment Incomplete Check

**Path:** `/api/payments/incomplete`  
**Method:** POST  
**Purpose:** Check incomplete payment status

### 5. Health Check Endpoint

**Path:** `/api/health`  
**Method:** GET  
**Purpose:** Verify backend is operational

---

## 🧪 Testing the Backend

### Test 1: Health Check

```bash
curl https://your-app.vercel.app/api/health
```

Expected: `"status": "healthy"` and `"piSdkConfigured": true`

### Test 2: Authentication (requires valid Pi token)

```bash
curl -X POST https://your-app.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"authToken":"YOUR_TEST_TOKEN"}'
```

### Test 3: In Pi Browser

1. Open your app in **Pi Browser**
2. Go to the **Create Action** tab
3. Fill in the form
4. Click **"→ Create & Request Signature"**
5. Pi Wallet should open with approval prompt
6. Check browser console (no errors should appear)
7. Check Vercel deployment logs for successful API calls

---

## 📱 Completing Step 10 in Developer Portal

After backend configuration:

1. **Open Pi Developer Portal**
2. Go to your **Treasury Action** app
3. Navigate to **Step 10: User Testing**
4. Enter your Vercel deployment URL:
   ```
   https://your-treasury-action.vercel.app
   ```
5. Click **"Test in Pi Browser"** or **"Submit for Review"**
6. The Developer Portal will verify:
   - ✅ Frontend loads
   - ✅ Backend responds to health check
   - ✅ Authentication endpoint works
   - ✅ Payment endpoints are accessible

7. **Test the complete flow:**
   - Open app in Pi Browser
   - Authenticate with Pi account
   - Create a treasury action
   - Approve wallet signature
   - Verify action status updates

---

## 🐛 Troubleshooting

### Error: "piSdkConfigured: false"

**Solution:** 
- Check environment variable name is exactly `PI_API_KEY`
- Verify you saved and redeployed after adding the variable
- Check Vercel → Settings → Environment Variables

### Error: "Failed to connect to backend"

**Solution:**
- Verify your Vercel deployment is live
- Check `/api/health` endpoint returns 200 status
- Review Vercel deployment logs for errors
- Ensure your domain is accessible from Pi Browser

### Error: "Invalid authentication token"

**Solution:**
- Verify your Pi API Key is correct
- Check that the key is from the correct environment (Testnet/Mainnet)
- Ensure the key hasn't expired

### Error: "Payment approval failed"

**Solution:**
- Check Vercel function logs in Dashboard → Deployments → Functions
- Verify Pi SDK version compatibility
- Ensure payment flow uses correct amount (0.01 for approval-only)

---

## 🚀 Production Deployment Checklist

Before submitting for Pi Network approval:

- [ ] Pi API Key configured in Vercel environment variables
- [ ] Application redeployed after adding environment variable
- [ ] `/api/health` endpoint returns healthy status
- [ ] Authentication flow tested in Pi Browser
- [ ] Wallet signature flow tested (create action → approve)
- [ ] Complete action lifecycle tested (Created → Approved → Submitted)
- [ ] No console errors in Pi Browser
- [ ] Vercel function logs show successful API calls
- [ ] Cross-tab synchronization working
- [ ] State persistence verified after browser refresh

---

## 📊 Vercel Function Monitoring

Monitor your backend performance:

1. Go to **Vercel Dashboard** → Your Project
2. Click **Deployments** → Latest deployment
3. Click **Functions** tab
4. View execution logs, errors, and performance metrics

Key metrics to monitor:
- **Response time:** Should be < 1 second
- **Error rate:** Should be < 1%
- **Invocations:** Track API usage

---

## 🔐 Security Notes

1. **Never commit PI_API_KEY to git** - Always use environment variables
2. **Backend validates all requests** - Authentication tokens are verified
3. **No fund transfers** - Approval flow is signature-only
4. **Serverless security** - Vercel functions are isolated and secure
5. **HTTPS only** - All API communication is encrypted

---

## 📞 Support Contacts

If you continue experiencing issues:

1. **Pi Developer Support:**
   - Email: developers@minepi.com
   - Forum: https://developers.minepi.com/discussion

2. **Vercel Support:**
   - Help: https://vercel.com/help
   - Documentation: https://vercel.com/docs

3. **Include in support requests:**
   - App name: Treasury Action
   - Domain: treasury.pi
   - Vercel deployment URL
   - Error messages from browser console
   - Screenshots of Step 10 error

---

## ✅ Success Indicators

You've successfully configured the backend when:

1. ✅ Health endpoint returns `"piSdkConfigured": true`
2. ✅ No "Failed to connect to backend" errors
3. ✅ Pi Wallet opens when requesting signature
4. ✅ Actions transition through all statuses (Created → Approved → Submitted)
5. ✅ Runtime evidence is generated (Reference ID, Freeze ID, Release ID)
6. ✅ API logs show successful backend interactions
7. ✅ Developer Portal Step 10 can be marked complete

---

## 🎯 Next Steps After Step 10

Once Step 10 is approved:

1. **Domain Activation** - Pi Network will activate treasury.pi domain
2. **User Testing Period** - Limited users can test your app
3. **Feedback Collection** - Gather user feedback and iterate
4. **Final Review** - Pi Network conducts final security review
5. **Mainnet Launch** - App goes live on Pi Mainnet

---

## 📄 Additional Resources

- [Pi Developer Documentation](https://developers.minepi.com)
- [Pi SDK Reference](https://developers.minepi.com/sdk)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Step 10 Completion
