"use client";

import { useEffect } from "react";
import { useTreasuryStore } from "@/lib/treasury-store";

/**
 * Treasury Sync Listener Component
 * 
 * Enables real-time cross-tab browser synchronization for treasury actions.
 * Listens to localStorage changes and updates the store when other tabs
 * modify treasury data, preventing conflicts and ensuring consistency.
 * 
 * This is critical for Testnet readiness where users may have multiple
 * Pi Browser tabs open simultaneously.
 */
export function TreasurySyncListener() {
  const syncFromStorage = useTreasuryStore((state) => state.syncFromStorage);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only sync when the treasury-sync event is triggered
      if (e.key === "treasury-sync" && e.newValue !== e.oldValue) {
        console.log("[Treasury] Cross-tab sync triggered");
        syncFromStorage();
      }
    };

    // Listen for storage changes from other tabs
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [syncFromStorage]);

  return null;
}
