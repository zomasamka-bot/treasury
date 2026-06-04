"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TreasuryAction } from "./treasury-types";

const STORAGE_KEY = "treasury-action-store";
const SYNC_EVENT = "treasury-sync";

type TreasuryStore = {
  actions: TreasuryAction[];
  addAction: (action: TreasuryAction) => void;
  updateActionStatus: (
    id: string,
    status: TreasuryAction["status"],
    timestamp: Date
  ) => void;
  addLog: (id: string, log: string) => void;
  updateEvidence: (
    id: string,
    evidence: Partial<TreasuryAction["runtimeEvidence"]>
  ) => void;
  getActionById: (id: string) => TreasuryAction | undefined;
  syncFromStorage: () => void;
};

// Helper to broadcast changes to other tabs
const broadcastSync = () => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SYNC_EVENT, Date.now().toString());
  }
};

export const useTreasuryStore = create<TreasuryStore>()(
  persist(
    (set, get) => ({
      actions: [],
      addAction: (action) => {
        set((state) => ({
          actions: [action, ...state.actions]
        }));
        broadcastSync();
      },
      updateActionStatus: (id, status, timestamp) => {
        set((state) => ({
          actions: state.actions.map((action) => {
            if (action.id !== id) return action;
            
            const updates: Partial<TreasuryAction> = { status };
            
            switch (status) {
              case "Approved":
                updates.approvedAt = timestamp;
                break;
              case "Submitted":
                updates.submittedAt = timestamp;
                break;
              case "Failed":
                updates.failedAt = timestamp;
                break;
            }
            
            return { ...action, ...updates };
          })
        }));
        broadcastSync();
      },
      addLog: (id, log) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${log}`;
        
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === id
              ? { ...action, apiLog: [...action.apiLog, logEntry] }
              : action
          )
        }));
        broadcastSync();
      },
      updateEvidence: (id, evidence) => {
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === id
              ? { ...action, runtimeEvidence: { ...action.runtimeEvidence, ...evidence } }
              : action
          )
        }));
        broadcastSync();
      },
      getActionById: (id) => {
        return get().actions.find((action) => action.id === id);
      },
      syncFromStorage: () => {
        // Rehydrate from storage to sync across tabs
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const { state } = JSON.parse(stored);
            set({ actions: state.actions || [] });
          } catch (e) {
            console.error("Failed to sync from storage:", e);
          }
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
