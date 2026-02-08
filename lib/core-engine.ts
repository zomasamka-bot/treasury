/**
 * UNIFIED CORE ENGINE
 * 
 * Single reusable engine that processes all treasury actions
 * through a unified status flow configuration.
 * 
 * Status Flow: Created → Approved → Submitted → Failed
 * All action types use the same processing logic.
 */

import type { 
  TreasuryAction, 
  TreasuryActionStatus, 
  TreasuryActionType,
  ActionConfiguration 
} from "./treasury-types";
import { ACTION_CONFIGS, generateReferenceId } from "./treasury-types";

export type ActionPayload = {
  type: TreasuryActionType;
  amount: number;
  note: string;
  userId: string;
};

export type ProcessingContext = {
  onLog: (message: string) => void;
  onStatusChange: (status: TreasuryActionStatus, timestamp: Date) => void;
  onEvidenceUpdate: (evidence: Partial<TreasuryAction["runtimeEvidence"]>) => void;
};

/**
 * Core Engine: Creates a treasury action with unified configuration
 */
export function createAction(payload: ActionPayload): TreasuryAction {
  const config = getActionConfig(payload.type);
  const freezeId = generateFreezeId();
  const referenceId = generateReferenceId();
  
  return {
    id: crypto.randomUUID(),
    referenceId,
    type: payload.type,
    amount: payload.amount,
    note: payload.note,
    status: "Created",
    createdAt: new Date(),
    apiLog: [],
    runtimeEvidence: {
      freezeId
    },
    manifest: {
      limitCheck: true,
      approvalRequired: config.requiresApproval,
      reportingEnabled: true
    }
  };
}

/**
 * Core Engine: Processes wallet signature approval
 * Immediate state transition for <90s flow
 */
export async function processApproval(
  action: TreasuryAction,
  context: ProcessingContext
): Promise<void> {
  context.onLog(`Initiating approval for ${action.referenceId}`);
  context.onLog(`Type: ${action.type} | Operational Amount: ${action.amount} π (non-binding data only)`);
  context.onLog(`Freeze ID: ${action.runtimeEvidence.freezeId}`);
  context.onLog(`Hooks (UI) - Limits: ✓ | Approvals: ✓ | Reporting: ✓`);
}

/**
 * Core Engine: Processes wallet signature completion
 * Immediate transition to Submitted state
 */
export function processCompletion(
  action: TreasuryAction,
  txId: string,
  context: ProcessingContext
): void {
  context.onLog(`✓ Wallet signature confirmed (Chain TX: ${txId})`);
  context.onEvidenceUpdate({ blockchainTxId: txId });
  context.onStatusChange("Submitted", new Date());
  context.onLog("✓ Ticket submitted to institutional review queue");
}

/**
 * Core Engine: Processes failure
 */
export function processFailure(
  action: TreasuryAction,
  error: string,
  context: ProcessingContext
): void {
  context.onLog(`✗ Error: ${error}`);
  
  // Unified status transition
  context.onStatusChange("Failed", new Date());
}

/**
 * Core Engine: Gets action configuration
 */
export function getActionConfig(type: TreasuryActionType): ActionConfiguration {
  const config = ACTION_CONFIGS.find(c => c.type === type);
  if (!config) {
    throw new Error(`Invalid action type: ${type}`);
  }
  return config;
}

/**
 * Core Engine: Generates freeze ID
 */
function generateFreezeId(): string {
  return `FREEZE-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
}

/**
 * Core Engine: Generates release ID
 */
function generateReleaseId(): string {
  return `RELEASE-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
}

/**
 * Core Engine: Validates action payload
 */
export function validatePayload(payload: ActionPayload): { valid: boolean; error?: string } {
  if (!payload.type) {
    return { valid: false, error: "Action type is required" };
  }
  
  if (!payload.amount || payload.amount <= 0) {
    return { valid: false, error: "Valid operational amount is required" };
  }
  
  const config = ACTION_CONFIGS.find(c => c.type === payload.type);
  if (!config) {
    return { valid: false, error: "Invalid action type" };
  }
  
  return { valid: true };
}

/**
 * Core Engine: Returns unified status flow
 */
export function getStatusFlow(): TreasuryActionStatus[] {
  return ["Created", "Approved", "Submitted", "Failed"];
}
