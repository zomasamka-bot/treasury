/**
 * Testnet Configuration
 * Handles Testnet-specific behavior and fallbacks
 */

export const TESTNET_CONFIG = {
  // Enable Testnet mode (set to true for testing without payment backend)
  enabled: typeof window !== "undefined" && 
    (window.location.hostname.includes("localhost") || 
     window.location.hostname.includes("vercel.app") ||
     window.location.hostname.includes("treasury.pi")),
  
  // Simulate approval delay (in milliseconds)
  approvalDelay: 2000,
  
  // Simulate completion delay (in milliseconds)  
  completionDelay: 3000,
};

/**
 * Check if app is running in Testnet mode
 */
export function isTestnetMode(): boolean {
  return TESTNET_CONFIG.enabled;
}

/**
 * Simulate wallet approval for Testnet
 * Returns mock payment ID and transaction ID
 */
export async function simulateTestnetApproval(): Promise<{
  paymentId: string;
  txId: string;
}> {
  // Simulate user approval time
  await new Promise(resolve => setTimeout(resolve, TESTNET_CONFIG.approvalDelay));
  
  const mockPaymentId = `TESTNET-PAY-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  
  // Simulate blockchain confirmation
  await new Promise(resolve => setTimeout(resolve, TESTNET_CONFIG.completionDelay));
  
  const mockTxId = `TESTNET-TX-${Date.now()}-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  
  return {
    paymentId: mockPaymentId,
    txId: mockTxId,
  };
}
