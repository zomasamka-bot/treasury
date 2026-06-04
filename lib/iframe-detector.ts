/**
 * Detects whether the app is running inside an iframe.
 * If so, attempts to break out or logs the context for debugging.
 */

export const detectAndHandleIframeContext = (): {
  isInIframe: boolean;
  isTopWindow: boolean;
  parentOrigin?: string;
} => {
  if (typeof window === "undefined") {
    return { isInIframe: false, isTopWindow: true };
  }

  const isInIframe = window.self !== window.top;
  const isTopWindow = window.self === window.top;

  if (isInIframe) {
    console.log("[v0] App detected inside iframe context");
    console.log("[v0] window.self === window.top:", isTopWindow);
    
    try {
      // Attempt to read parent origin for logging
      const parentOrigin = window.parent.location.origin;
      console.log("[v0] Parent window origin:", parentOrigin);
      
      // Attempt to break out of iframe by setting window.top location
      // This will only work if the parent allows it (cross-origin policy)
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = window.location.href;
          console.log("[v0] Attempted to break out of iframe");
        }
      } catch (err) {
        console.log("[v0] Cannot break out of iframe (cross-origin restriction):", err);
      }
    } catch (err) {
      console.log("[v0] Cannot read parent origin (cross-origin restriction)");
    }
  } else {
    console.log("[v0] App running as top-level window (not in iframe)");
  }

  return {
    isInIframe,
    isTopWindow,
  };
};
