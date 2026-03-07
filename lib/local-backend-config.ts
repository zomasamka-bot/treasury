/**
 * Local Backend Configuration Override
 *
 * The production backend always lives on Vercel. All Pi payment API calls
 * (approve / complete / incomplete) MUST be sent to the absolute production
 * URL so they reach the real backend regardless of whether the app is opened
 * from PiNet, the Pi Developer Portal preview, or the Testnet Preview iframe.
 *
 * Using relative URLs ("/api/...") in those contexts resolves to the preview
 * iframe origin instead of the real backend, which causes the Pi SDK to
 * report "developer has not set up the app wallet".
 */

// The canonical production backend — never changes.
const PRODUCTION_BACKEND = "https://treasury-action.vercel.app";

/**
 * Resolves the absolute backend base URL at call time (never frozen at module load).
 *
 * Priority order (both SSR and client):
 *  1. NEXT_PUBLIC_APP_URL  — explicitly set to https://treasury-action.vercel.app
 *  2. NEXT_PUBLIC_BACKEND_URL — optional override for staging environments
 *  3. Current origin when hostname ends with .vercel.app (direct Vercel access)
 *  4. Hardcoded PRODUCTION_BACKEND constant for all other hosts
 *     (PiNet, Pi Developer Portal, Testnet Preview, localhost, etc.)
 *
 * Calling this function lazily (at fetch time, not at module import time) is
 * critical for Pi SDK callbacks — they fire in the browser after SSR has
 * completed, so a value frozen during SSR (when window is undefined) would
 * resolve to the wrong origin.
 */
const getBackendBaseUrl = (): string => {
  // NEXT_PUBLIC_APP_URL is the canonical production URL — always prefer it.
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  // Client-side fallback: use current origin only when on a Vercel deployment.
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname.endsWith(".vercel.app")) {
      return window.location.origin;
    }
  }

  // All other environments (PiNet, Pi Portal preview, Testnet Preview, localhost)
  // route to the hardcoded production backend.
  return PRODUCTION_BACKEND;
};

export const LOCAL_BACKEND_CONFIG = {
  BASE_URL: getBackendBaseUrl(),
  BLOCKCHAIN_BASE_URL: "https://api.testnet.minepi.com",
} as const;

/**
 * All URL helpers are functions that call getBackendBaseUrl() lazily at
 * invocation time — never frozen at module load.
 *
 * This is critical for Pi SDK callbacks (onReadyForServerApproval,
 * onReadyForServerCompletion) which fire in the browser after the module was
 * first imported. Using functions guarantees the correct absolute production
 * URL is resolved at the exact moment each fetch is made.
 */
export const LOCAL_BACKEND_URLS = {
  LOGIN: () => `${getBackendBaseUrl()}/api/auth/login`,
  LOGIN_PREVIEW: () => `${getBackendBaseUrl()}/api/auth/login/preview`,
  GET_PRODUCTS: (_appId: string) => `${getBackendBaseUrl()}/api/products`,
  GET_PAYMENT: (paymentId: string) => `${getBackendBaseUrl()}/api/payments/${paymentId}`,
  APPROVE_PAYMENT: (_paymentId: string) => `${getBackendBaseUrl()}/api/payments/approve`,
  COMPLETE_PAYMENT: (_paymentId: string) => `${getBackendBaseUrl()}/api/payments/complete`,
  INCOMPLETE_PAYMENT: (_paymentId: string) => `${getBackendBaseUrl()}/api/payments/incomplete`,
};

export const LOCAL_PI_BLOCKCHAIN_URLS = {
  GET_TRANSACTION: (txid: string) =>
    `${LOCAL_BACKEND_CONFIG.BLOCKCHAIN_BASE_URL}/transactions/${txid}/effects`,
} as const;
