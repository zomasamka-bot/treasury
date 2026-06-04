// Pi SDK singleton initializer.
//
// The init guard is stored on `window.__piSdkInitPromise` — NOT in a module
// variable. Module-level variables are reset on Next.js hot reloads and
// re-evaluations, which causes Pi.init() to be called multiple times in the
// same browser session. Calling Pi.init() more than once resets the SDK's
// internal messaging session, which causes the postMessage bridge to
// app-cdn.minepi.com to fail and surfaces as "app wallet not set up".
//
// Storing the promise on `window` survives module re-evaluation and
// guarantees Pi.init() runs exactly once per browser session.

import { detectAndHandleIframeContext } from "./iframe-detector";

declare global {
  interface Window {
    __piSdkInitPromise?: Promise<void>;
  }
}

const PI_SDK_URL = "https://sdk.minepi.com/pi-sdk.js";

const loadScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if (typeof window.Pi !== "undefined") {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PI_SDK_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Pi SDK script failed to load"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = PI_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Pi SDK script failed to load"));
    document.head.appendChild(script);
  });

export const initPiSDK = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  // Detect iframe context — if the app is running inside an iframe
  // (e.g. from Testnet environment), the Pi SDK messaging may fail.
  detectAndHandleIframeContext();

  // Return the existing promise if Pi.init() has already been called or
  // is in progress — this is the critical guard that prevents double-init.
  if (window.__piSdkInitPromise) {
    return window.__piSdkInitPromise;
  }

  window.__piSdkInitPromise = (async () => {
    await loadScript();

    if (typeof window.Pi === "undefined") {
      // Script loaded but window.Pi is still not set — clear the promise so
      // the next call retries, and throw so callers know init did not complete.
      // This prevents authenticate() and createPayment() from being called on
      // an uninitialised SDK, which causes "app wallet not set up".
      window.__piSdkInitPromise = undefined;
      throw new Error("Pi SDK loaded but window.Pi is not available. Open this app inside Pi Browser.");
    }

    // sandbox: false is required for ALL real Pi Browser environments.
    // sandbox: true routes the SDK through the app-cdn.minepi.com iframe
    // postMessage bridge, which rejects messages from non-whitelisted origins.
    // The real Pi Browser uses a native webview bridge that requires sandbox: false.
    await window.Pi.init({ version: "2.0", sandbox: false });
  })();

  return window.__piSdkInitPromise;
};
