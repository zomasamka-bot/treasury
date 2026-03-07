/**
 * Pi Network Payment Integration Module
 *
 * Provides a global payment system for Pi Network transactions with:
 * - Automatic payment approval and completion
 * - On-chain validation
 * - Reward processing
 * - Incomplete payment recovery
 */

import { api } from "@/lib/api";
import { PI_BLOCKCHAIN_URLS } from "@/lib/system-config";
import { LOCAL_BACKEND_URLS, LOCAL_PI_BLOCKCHAIN_URLS } from "@/lib/local-backend-config";

// ============================================================================
// Type Definitions
// ============================================================================

export type PaymentMetadata = {
  [key: string]: any;
};

export type PaymentOptions = {
  amount: number;
  memo?: string;
  metadata: PaymentMetadata;
  onComplete?: (metadata: PaymentMetadata) => void;
  onError?: (error: Error, payment?: PiPayment) => void;
};

export type PiPaymentData = {
  amount: number;
  memo: string;
  metadata: PaymentMetadata;
};

export type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PiPayment) => void;
};

export type PiPayment = {
  identifier: string;
  amount: number;
  metadata: PaymentMetadata;
  transaction: {
    txid: string;
  };
};

export type BlockchainTransactionResponse = {
  _embedded: {
    records: Array<{ amount: string }>;
  };
};

// ============================================================================
// Global Window Declaration
// ============================================================================

declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate: (
        scopes: string[],
        checkIncompletePayments: (payment: PiPayment) => Promise<void>
      ) => Promise<{
        accessToken: string;
        user: { uid: string; username: string };
      }>;
      createPayment: (
        paymentData: PiPaymentData,
        callbacks: PiPaymentCallbacks
      ) => void;
      getIncompletePayments: () => Promise<PiPayment[]>;
    };
    pay: (options: PaymentOptions) => Promise<void>;
  }
}

// ============================================================================
// Configuration
// ============================================================================

let rewardHandler: ((metadata: PaymentMetadata) => void) | null = null;

export const setPaymentRewardHandler = (
  handler: (metadata: PaymentMetadata) => void
): void => {
  rewardHandler = handler;
};

// ============================================================================
// Payment Validation
// ============================================================================

const checkPaymentValid = async (
  txid: string,
  expectedAmount: number
): Promise<boolean> => {
  try {
    const { data, status } = await api.get<string>(
      PI_BLOCKCHAIN_URLS.GET_TRANSACTION(txid)
    );
    const parsedData: BlockchainTransactionResponse =
      typeof data === "string" ? JSON.parse(data) : data;

    if (status !== 200) return false;

    const records = parsedData._embedded?.records;
    if (!records || records.length === 0) return false;

    const onchainAmount = parseFloat(records[0].amount);
    const isValid = onchainAmount >= expectedAmount;

    if (!isValid) {
      console.log("Payment validation failed:", {
        onchainAmount,
        expectedAmount,
      });
    }

    return isValid;
  } catch (error) {
    console.error("Failed to validate payment on blockchain:", error);
    return false;
  }
};

// ============================================================================
// Payment Completion
// ============================================================================

const completePaymentWithReward = async (
  payment: PiPayment,
  txidFromUser: string
): Promise<void> => {
  try {
    const isPaymentValid = await checkPaymentValid(
      txidFromUser,
      payment.amount
    );

    if (!isPaymentValid) {
      console.error("Payment validation failed: amount mismatch");
      return;
    }

    if (!payment?.transaction?.txid) {
      console.error("Cannot complete payment — transaction not found on chain yet");
      return;
    }

    const { status } = await api.post(
      LOCAL_BACKEND_URLS.COMPLETE_PAYMENT(payment.identifier),
      { txid: payment.transaction.txid }
    );

    if (status === 200) {
      if (rewardHandler) {
        rewardHandler(payment.metadata);
      }
    }
  } catch (error) {
    console.error("Failed to complete payment:", error);
    throw error;
  }
};

// ============================================================================
// Payment Callbacks
// ============================================================================

const createPaymentCallbacks = (
  options: PaymentOptions
): PiPaymentCallbacks => {
  const onReadyForServerApproval = async (paymentId: string): Promise<void> => {
    try {
      await fetch(LOCAL_BACKEND_URLS.APPROVE_PAYMENT(paymentId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
    } catch (error) {
      console.error("Failed to approve payment:", error);
    }
  };

  const onReadyForServerCompletion = async (
    paymentId: string,
    txid: string
  ): Promise<void> => {
    try {
      await fetch(LOCAL_BACKEND_URLS.COMPLETE_PAYMENT(paymentId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, txid }),
      });

      if (options.onComplete) {
        options.onComplete(options.metadata);
      }
    } catch (error) {
      console.error("Failed to complete payment:", error);
      if (options.onError) {
        options.onError(
          error instanceof Error
            ? error
            : new Error("Payment completion failed")
        );
      }
    }
  };

  const onCancel = (paymentId: string): void => {
    console.log("Payment cancelled:", paymentId);
  };

  const onError = (error: Error, payment?: PiPayment): void => {
    console.error("Payment error:", error, payment);
    if (options.onError) {
      options.onError(error, payment);
    }
  };

  return {
    onReadyForServerApproval,
    onReadyForServerCompletion,
    onCancel,
    onError,
  };
};

// ============================================================================
// Core Payment Function
// ============================================================================

export const pay = async (options: PaymentOptions): Promise<void> => {
  const paymentData: PiPaymentData = {
    amount: options.amount,
    memo: options.memo || `Payment of ${options.amount} Pi`,
    metadata: options.metadata,
  };

  const callbacks = createPaymentCallbacks(options);

  try {
    window.Pi.createPayment(paymentData, callbacks);
  } catch (error) {
    console.error("Failed to create payment:", error);
    if (options.onError) {
      options.onError(
        error instanceof Error ? error : new Error("Failed to create payment")
      );
    }
    throw error;
  }
};

// ============================================================================
// Incomplete Payment Recovery
// ============================================================================

export const checkIncompletePayments = async (
  payment: PiPayment
): Promise<void> => {
  try {
    // payment.transaction is null for incomplete payments that never reached
    // the blockchain. Guard against this to prevent a crash that propagates
    // through Pi.authenticate() and surfaces as "app wallet not set up".
    if (!payment?.transaction?.txid) {
      console.log("Incomplete payment has no transaction yet, skipping:", payment.identifier);
      return;
    }

    await api.post(LOCAL_BACKEND_URLS.COMPLETE_PAYMENT(payment.identifier), {
      txid: payment.transaction.txid,
    });
  } catch (error) {
    console.error("Failed to notify incomplete payment:", error);
  }
};

// ============================================================================
// Initialize Global Payment Function
// ============================================================================

export const initializeGlobalPayment = (): void => {
  if (typeof window !== "undefined") {
    window.pay = pay;
  }
};
