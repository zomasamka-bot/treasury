"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import { LOCAL_BACKEND_URLS } from "@/lib/local-backend-config";
import { api, setApiAuthToken } from "@/lib/api";
import {
  initializeGlobalPayment,
  checkIncompletePayments,
} from "@/lib/pi-payment";

/**
 * Determines the sandbox flag for Pi.init().
 *
 * sandbox: false is correct for ALL real Pi Browser environments — both the
 * production Pi Browser and the Testnet page inside Pi Browser. Both run real
 * payment flows and require sandbox: false.
 *
 * sandbox: true is only required inside the Pi Developer Portal preview iframe,
 * which handles that itself — the app does not need to set it.
 *
 * NEXT_PUBLIC_SANDBOX in Vercel env vars must be "false" or unset.
 * If it is set to "true", payments on the Testnet Pi Browser page will fail
 * with "app wallet not set up" because sandbox mode is incompatible with the
 * real testnet payment flow.
 */
const getSandboxMode = (): boolean => {
  // sandbox: true  → Testnet Pi Browser page and Pi Developer Portal preview.
  //                  The Pi SDK routes its internal payment verification calls
  //                  through api.testnet.minepi.com when sandbox is true.
  //                  Without this, createPayment() returns 404 internally on
  //                  testnet because the SDK calls api.minepi.com (mainnet).
  // sandbox: false → Production mainnet Pi Browser only.
  //
  // NEXT_PUBLIC_SANDBOX must be "true" in Vercel when running on testnet.
  return process.env.NEXT_PUBLIC_SANDBOX === "true";
};

export type LoginDTO = {
  id: string;
  username: string;
  credits_balance: number;
  terms_accepted: boolean;
  app_id: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price_in_pi: number;
  total_quantity: number;
  is_active: boolean;
  created_at: string;
};

export type ProductList = {
  products: Product[];
};

interface PiAuthContextType {
  isAuthenticated: boolean;
  authMessage: string;
  hasError: boolean;
  piAccessToken: string | null;
  userData: LoginDTO | null;
  reinitialize: () => Promise<void>;
  appId: string | null;
  products: Product[] | null;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

const loadPiSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    if (!PI_NETWORK_CONFIG.SDK_URL) {
      throw new Error("SDK URL is not set");
    }
    script.src = PI_NETWORK_CONFIG.SDK_URL;
    script.async = true;

    script.onload = () => {
      console.log("✅ Pi SDK script loaded successfully");
      resolve();
    };

    script.onerror = () => {
      console.error("❌ Failed to load Pi SDK script");
      reject(new Error("Failed to load Pi SDK script"));
    };

    document.head.appendChild(script);
  });
};

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [piAccessToken, setPiAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<LoginDTO | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const fetchProducts = async (currentAppId: string): Promise<void> => {
    try {
      const { data } = await api.get<ProductList>(
        LOCAL_BACKEND_URLS.GET_PRODUCTS(currentAppId)
      );
      setProducts(data?.products ?? []);
    } catch (e) {
      console.error("Failed to load products:", e);
    }
  };

  const initializePiSDK = async (): Promise<void> => {
    if (isSdkReady) return;
    
    try {
      if (typeof window.Pi === "undefined") {
        await loadPiSDK();
      }

      if (typeof window.Pi === "undefined") {
        throw new Error("Pi SDK failed to load");
      }

      const sandbox = getSandboxMode();
      await window.Pi.init({
        version: "2.0",
        sandbox,
      });

      setIsSdkReady(true);
      initializeGlobalPayment();
    } catch (err) {
      console.error("Failed to initialize Pi SDK:", err);
      throw err;
    }
  };

  const connectWallet = async (): Promise<void> => {
    if (isAuthenticated) {
      console.log("Already authenticated");
      return;
    }

    if (isAuthenticating) {
      console.log("Authentication already in progress");
      return;
    }

    setIsAuthenticating(true);
    setHasError(false);
    setAuthMessage("Connecting wallet...");

    try {
      if (!isSdkReady) {
        await initializePiSDK();
      }

      const scopes = ["username", "payments"];
      const piAuthResult = await window.Pi.authenticate(
        scopes,
        async (payment) => {
          // Only attempt recovery if the payment has a blockchain transaction.
          // Accessing payment.transaction.txid when transaction is null causes
          // an unhandled crash that the Pi SDK surfaces as "app wallet not set up".
          if (payment?.transaction?.txid) {
            await checkIncompletePayments(payment);
          }
        }
      );

      if (!piAuthResult?.accessToken) {
        throw new Error("No access token received from Pi Network");
      }

      setPiAccessToken(piAuthResult.accessToken);
      setApiAuthToken(piAuthResult.accessToken);

      // Use the Pi user data returned directly from authenticate() to build
      // the session. This avoids a separate backend login call that can fail
      // when the Pi API rejects the token, while still establishing a valid
      // authenticated session for createPayment() to proceed.
      const sessionUser: LoginDTO = {
        id: piAuthResult.user?.uid || "",
        username: piAuthResult.user?.username || "",
        credits_balance: 0,
        terms_accepted: true,
        app_id: process.env.NEXT_PUBLIC_PI_APP_ID || "treasury-action",
      };

      setUserData(sessionUser);
      setAppId(sessionUser.app_id);
      setAuthMessage("Connected");
      setIsAuthenticated(true);

      // Fire-and-forget backend login — used only for server-side session
      // persistence. Failure here does NOT block the payment flow.
      api.post<LoginDTO>(LOCAL_BACKEND_URLS.LOGIN(), {
        pi_auth_token: piAuthResult.accessToken,
      }).then(res => {
        setUserData(res.data);
      }).catch(err => {
        console.error("Backend login failed (non-blocking):", err);
      });
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setHasError(true);
      setAuthMessage(getErrorMessage(err));
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error))
      return "An unexpected error occurred. Please try again.";

    const errorMessage = error.message;

    if (errorMessage.includes("SDK failed to load"))
      return "Failed to load Pi Network SDK. Please check your internet connection.";

    if (errorMessage.includes("authenticate"))
      return "Pi Network authentication failed. Please try again.";

    if (errorMessage.includes("login"))
      return "Failed to connect to backend server. Please try again later.";

    return `Authentication error: ${errorMessage}`;
  };

  useEffect(() => {
    initializePiSDK().catch(err => {
      console.error("SDK initialization failed:", err);
    });
  }, []);

  useEffect(() => {
    if (!appId) return;
    fetchProducts(appId);
  }, [appId]);

  const value: PiAuthContextType = {
    isAuthenticated,
    authMessage,
    hasError,
    piAccessToken,
    userData,
    reinitialize: connectWallet,
    appId,
    products,
  };

  return (
    <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>
  );
}

/**
 * Hook to access Pi Network authentication state and user data
 *
 * Must be used within a component wrapped by PiAuthProvider.
 * Provides read-only access to authentication state and user data.
 *
 * @returns {PiAuthContextType} Authentication state and methods
 * @throws {Error} If used outside of PiAuthProvider
 *
 * @example
 * const { piAccessToken, userData, isAuthenticated, reinitialize } = usePiAuth();
 */
export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthProvider");
  }
  return context;
}
