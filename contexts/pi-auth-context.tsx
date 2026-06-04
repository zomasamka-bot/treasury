"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { LOCAL_BACKEND_URLS } from "@/lib/local-backend-config";
import { api, setApiAuthToken } from "@/lib/api";
import { initPiSDK } from "@/lib/pi-sdk";



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
  userUid: string | null;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);



export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [piAccessToken, setPiAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<LoginDTO | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [userUid, setUserUid] = useState<string | null>(null);
  // Use a ref (not state) so isSdkReady is read synchronously.
  // React state updates are async — if connectWallet() is called before
  // the state update from useEffect completes, Pi.init() gets called twice.
  // Calling Pi.init() twice resets the Pi SDK's internal payment session,
  // causing createPayment() to fail with 404 before reaching onReadyForServerApproval.
  const isSdkReadyRef = React.useRef(false);

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
    try {
      await initPiSDK();
      isSdkReadyRef.current = true;
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
      await initializePiSDK();

      const scopes = ["username", "payments"];
      const piAuthResult = await window.Pi.authenticate(
        scopes,
        // onIncompletePaymentFound: called when a previous payment was
        // created but never approved or completed. The Pi SDK requires this
        // callback to resolve the payment by calling the approve or complete
        // endpoint — otherwise it blocks any new createPayment() call.
        async (payment) => {
          try {
            const paymentId = payment?.identifier;
            if (!paymentId) return;
            const txid = payment?.transaction?.txid;
            if (txid) {
              // Payment reached the blockchain but server completion failed.
              await fetch(LOCAL_BACKEND_URLS.COMPLETE_PAYMENT(paymentId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
              });
            } else {
              // Payment was created but never approved — approve it now.
              await fetch(LOCAL_BACKEND_URLS.APPROVE_PAYMENT(paymentId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              });
            }
          } catch {
            // Never throw from this callback — a thrown error blocks
            // createPayment() with "app wallet not set up".
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
      const piUserUid = piAuthResult.user?.uid || "";
      console.log("[v0] AUTH CONTEXT: Pi user UID:", piUserUid);
      
      const sessionUser: LoginDTO = {
        id: piUserUid,
        username: piAuthResult.user?.username || "",
        credits_balance: 0,
        terms_accepted: true,
        app_id: process.env.NEXT_PUBLIC_PI_APP_ID || "treasury-action",
      };

      setUserData(sessionUser);
      setUserUid(piUserUid);
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
    userUid,
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
