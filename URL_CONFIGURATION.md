# Treasury Action - URL Configuration

## Overview

The Treasury Action app operates with two distinct URLs:

### 1. Primary Frontend (PiNet URL)
**URL:** `https://treasuryaction4016.pinet.com`

- Official internal Pi Network identity
- Where users access the app within the Pi ecosystem
- Integrated with Pi Browser and Pi SDK
- This is the URL shown in the Pi Developer Portal

### 2. Backend Host (Vercel URL)
**URL:** `https://treasury-action.vercel.app`

- Hosts the serverless API endpoints
- Processes authentication and payment approvals
- Handles backend logic and Pi API verification
- Not directly accessed by users

## How It Works

```
User Flow:
1. User opens: https://treasuryaction4016.pinet.com
2. Frontend loads from PiNet
3. API calls route to: https://treasury-action.vercel.app/api/*
4. Backend processes and returns data
5. User sees results on PiNet frontend
```

## Configuration Steps

### Step 1: Set Environment Variables in Vercel

Go to: Vercel Dashboard → Treasury Action Project → Settings → Environment Variables

Add the following:

```env
PI_API_KEY=your_pi_api_key_from_developer_portal
NEXT_PUBLIC_PINET_URL=https://treasuryaction4016.pinet.com
NEXT_PUBLIC_BACKEND_URL=https://treasury-action.vercel.app
ALLOWED_ORIGINS=https://treasuryaction4016.pinet.com,https://treasury-action.vercel.app,https://develop.pi
NODE_ENV=production
```

### Step 2: Redeploy

After adding environment variables:
1. Go to Deployments tab in Vercel
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

### Step 3: Verify Configuration

Test the health endpoint:
```bash
curl https://treasury-action.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "piApiConfigured": true
}
```

## CORS Configuration

The app is configured to accept requests from:
- `https://treasuryaction4016.pinet.com` (PiNet frontend)
- `https://treasury-action.vercel.app` (Vercel backend)
- `https://develop.pi` (Developer Portal preview)

CORS headers are automatically set in:
- `/next.config.mjs` - Global API route headers
- `/app/api/auth/login/route.ts` - Authentication endpoint
- All payment endpoints

## API Endpoints

All endpoints are hosted at: `https://treasury-action.vercel.app/api/`

### Authentication
- `POST /api/auth/login` - Pi user authentication
- `GET /api/health` - Health check

### Payments (Approval Only)
- `POST /api/payments/approve` - Approve signature
- `POST /api/payments/complete` - Complete signature
- `POST /api/payments/incomplete` - Handle incomplete signatures

### Products
- `GET /api/products` - Get action types (mock endpoint)

## Testing

### Test from PiNet URL
1. Open: `https://treasuryaction4016.pinet.com` in Pi Browser
2. App should load without errors
3. Authentication should work
4. Action creation should work

### Test from Vercel URL
1. Open: `https://treasury-action.vercel.app` in any browser
2. App should load (may show preview mode)
3. Check browser console for any CORS errors

### Test Backend Endpoints
```bash
# Health check
curl https://treasury-action.vercel.app/api/health

# Should return 200 OK with status
```

## Troubleshooting

### Issue: "Failed to connect to backend server"
**Solution:**
1. Verify PI_API_KEY is set in Vercel environment variables
2. Check NEXT_PUBLIC_BACKEND_URL is correct
3. Redeploy after adding variables

### Issue: CORS errors
**Solution:**
1. Verify ALLOWED_ORIGINS includes both URLs
2. Check next.config.mjs has CORS headers
3. Redeploy after changes

### Issue: Authentication fails on PiNet
**Solution:**
1. Check that backend URL is accessible from PiNet
2. Verify Pi API key is valid
3. Check browser console for specific error messages

## Domain Binding Verification

The app references the correct domains in:
- `/app/page.tsx` - Header shows "treasury.pi"
- `/lib/local-backend-config.ts` - Backend URL configuration
- `/.env.example` - Environment variable template
- `/next.config.mjs` - CORS configuration

All references to "treasury.pi" in the codebase are consistent with the PiNet URL structure.

## Security Notes

1. **Never commit `.env` files** with real API keys to version control
2. **PI_API_KEY** should only be set in Vercel environment variables
3. **CORS** is configured to allow only specific origins
4. **No fund transfers** - All payment endpoints are approval-only
5. **No private keys** - Pi SDK handles wallet signing

## Production Checklist

- [ ] PI_API_KEY set in Vercel
- [ ] Both URLs added to environment variables
- [ ] ALLOWED_ORIGINS configured
- [ ] Application redeployed after configuration
- [ ] Health endpoint returns 200 OK
- [ ] PiNet URL accessible in Pi Browser
- [ ] Authentication works from PiNet
- [ ] Action creation and approval flow works
- [ ] No CORS errors in browser console
- [ ] Step 10 completed in Pi Developer Portal

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console errors
3. Test health endpoint
4. Verify environment variables are set
5. Ensure redeployment after variable changes
