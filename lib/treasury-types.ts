export type TreasuryActionStatus = 
  | "Created"
  | "Approved" 
  | "Reserved"
  | "Failed";

export type TreasuryActionType = 
  | "Reserve Allocation"
  | "Budget Transfer"
  | "Operational Expense"
  | "Emergency Fund"
  | "Strategic Reserve";

export type TreasuryAction = {
  id: string;
  referenceId: string;
  type: TreasuryActionType;
  amount: number;
  note: string;
  targetWallet?: string;
  status: TreasuryActionStatus;
  createdAt: Date;
  approvedAt?: Date;
  submittedAt?: Date;
  failedAt?: Date;
  apiLog: string[];
  runtimeEvidence: {
    freezeId?: string;
    releaseId?: string;
    walletSignature?: string;
    blockchainTxId?: string;
  };
  manifest: {
    limitCheck: boolean;
    approvalRequired: boolean;
    reportingEnabled: boolean;
  };
};

export type ActionConfiguration = {
  type: TreasuryActionType;
  requiresApproval: boolean;
  description: string;
  category: string;
};

/**
 * Future Beneficiary Release Policy Structure
 * Prepared for Phase 2 implementation - NO RELEASE LOGIC YET
 * These are policy templates only, not active in current flow
 */
export type ReleasePolicyTemplate = {
  type: TreasuryActionType;
  releaseMode: "standard" | "review-oriented" | "faster" | "extra-confirmation" | "controlled";
  description: string;
};

export const RELEASE_POLICY_TEMPLATES: ReleasePolicyTemplate[] = [
  {
    type: "Reserve Allocation",
    releaseMode: "standard",
    description: "Standard release policy structure - ready for Phase 2 implementation"
  },
  {
    type: "Budget Transfer",
    releaseMode: "review-oriented",
    description: "Review-oriented release policy structure - ready for Phase 2 implementation"
  },
  {
    type: "Operational Expense",
    releaseMode: "faster",
    description: "Faster release policy structure - ready for Phase 2 implementation"
  },
  {
    type: "Emergency Fund",
    releaseMode: "extra-confirmation",
    description: "Extra confirmation release policy structure - ready for Phase 2 implementation"
  },
  {
    type: "Strategic Reserve",
    releaseMode: "controlled",
    description: "More controlled release policy structure - ready for Phase 2 implementation"
  }
];

// Unified Core Engine: All action types use the same configuration schema
export const ACTION_CONFIGS: ActionConfiguration[] = [
  {
    type: "Reserve Allocation",
    requiresApproval: true,
    description: "Operational data entry for reserve allocation tracking",
    category: "Reserve Management"
  },
  {
    type: "Budget Transfer",
    requiresApproval: true,
    description: "Operational data entry for budget transfer tracking",
    category: "Budget Operations"
  },
  {
    type: "Operational Expense",
    requiresApproval: true,
    description: "Operational data entry for expense tracking",
    category: "Daily Operations"
  },
  {
    type: "Emergency Fund",
    requiresApproval: true,
    description: "Operational data entry for emergency fund tracking",
    category: "Emergency Response"
  },
  {
    type: "Strategic Reserve",
    requiresApproval: true,
    description: "Operational data entry for strategic reserve tracking",
    category: "Strategic Planning"
  }
];

export function generateReferenceId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TRX-TREASURY-${year}${month}${day}-${random}`;
}

export function getStatusColor(status: TreasuryActionStatus): string {
  switch (status) {
    case "Created":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "Approved":
      return "bg-accent/10 text-accent-foreground";
    case "Reserved":
      return "bg-primary/10 text-primary";
    case "Failed":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}
