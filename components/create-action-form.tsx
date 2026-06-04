"use client";

import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_CONFIGS } from "@/lib/treasury-types";
import type { TreasuryActionType } from "@/lib/treasury-types";
import { useTreasuryStore } from "@/lib/treasury-store";
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { createAction, processApproval, validatePayload } from "@/lib/core-engine";
import { TreasuryAction } from "@/lib/treasury-types";
import { LOCAL_BACKEND_URLS } from "@/lib/local-backend-config";
import { PaymentReceipt } from "@/components/payment-receipt";

export function CreateActionForm() {
  const { userData } = usePiAuth();
  const addAction = useTreasuryStore((state) => state.addAction);
  const addLog = useTreasuryStore((state) => state.addLog);
  const updateActionStatus = useTreasuryStore((state) => state.updateActionStatus);
  const updateEvidence = useTreasuryStore((state) => state.updateEvidence);
  
  const [selectedType, setSelectedType] = useState<TreasuryActionType | "">("");
  const [amount, setAmount] = useState("");
  const [targetWallet, setTargetWallet] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [completedAction, setCompletedAction] = useState<TreasuryAction | null>(null);


  const selectedConfig = ACTION_CONFIGS.find(c => c.type === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !amount || !targetWallet) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    const numAmount = parseFloat(amount);
    
    // Validate using Core Engine
    const validation = validatePayload({
      type: selectedType,
      amount: numAmount,
      note: note.trim(),
      userId: userData?.username || 'user'
    });
    
    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid input");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Create action using Unified Core Engine
      const newAction = createAction({
        type: selectedType,
        amount: numAmount,
        note: note.trim(),
        targetWallet: targetWallet.trim(),
        userId: userData?.username || 'user'
      });

      addAction(newAction);
      addLog(newAction.id, `Action created by ${userData?.username || 'user'}`);

      // Processing context for Core Engine
      const context = {
        onLog: (message: string) => addLog(newAction.id, message),
        onStatusChange: (status: typeof newAction.status, timestamp: Date) => 
          updateActionStatus(newAction.id, status, timestamp),
        onEvidenceUpdate: (evidence: Partial<typeof newAction.runtimeEvidence>) =>
          updateEvidence(newAction.id, evidence)
      };

      // Process approval using Core Engine
      await processApproval(newAction, context);

      if (typeof window.Pi === "undefined") {
        addLog(newAction.id, "Pi SDK not available — open this app inside Pi Browser");
        updateActionStatus(newAction.id, "Failed", new Date());
        setErrorMessage("Pi Browser required. Please open this app inside Pi Browser.");
        return;
      }

      context.onLog("Opening Pi Wallet for payment...");

      // Call Pi SDK directly for User-to-App payment
      // Pi SDK handles user authentication and payment creation
      await window.Pi.createPayment(
        {
          amount: 1,
          memo: `Treasury Approval: ${newAction.referenceId}`,
          metadata: {
            treasuryActionId: newAction.id,
            referenceId: newAction.referenceId,
            actionType: newAction.type,
            operationalAmount: numAmount,
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("[v0] CLIENT: onReadyForServerApproval fired");
            console.log("[v0] CLIENT: paymentId from Pi:", paymentId);
            console.log("[v0] CLIENT: paymentId type:", typeof paymentId);
            console.log("[v0] CLIENT: paymentId length:", paymentId?.length);
            
            context.onLog(`Wallet signed. Approving on server...`);

            const releaseId = `RELEASE-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 11)
              .toUpperCase()}`;

            updateEvidence(newAction.id, {
              releaseId,
              walletSignature: paymentId,
            });

            try {
              const approveUrl = LOCAL_BACKEND_URLS.APPROVE_PAYMENT(paymentId);
              console.log("[v0] CLIENT: calling approve endpoint:", approveUrl);
              console.log("[v0] CLIENT: sending paymentId in body:", paymentId);
              
              const approveRes = await fetch(approveUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              });

              console.log("[v0] CLIENT: Approve response status:", approveRes.status);
              
              let approveData: any;
              try {
                approveData = await approveRes.json();
              } catch (parseErr) {
                console.error("[v0] CLIENT: Failed to parse approve response:", parseErr);
                approveData = { success: false, error: "Invalid server response" };
              }
              
              console.log("[v0] CLIENT: Approve response data:", approveData);

              // Check both HTTP status and the success flag from response
              if (!approveRes.ok || approveData.success === false) {
                const errMsg = approveData.error || approveData.detail || `HTTP ${approveRes.status}`;
                console.log("[v0] CLIENT: Approval failed:", errMsg);
                context.onLog(`Approval failed: ${errMsg}`);
                updateActionStatus(newAction.id, "Failed", new Date());
                setErrorMessage(`Approval failed: ${errMsg}`);
                return;
              }
              
              console.log("[v0] CLIENT: Approval successful");
              context.onLog(`Approved. Reference: ${newAction.referenceId}`);
              updateActionStatus(newAction.id, "Approved", new Date());
            } catch (fetchErr) {
              const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
              console.log("[v0] CLIENT: Approval network error:", errMsg);
              context.onLog(`Approval network error: ${errMsg}`);
              updateActionStatus(newAction.id, "Failed", new Date());
              setErrorMessage("Network error during approval");
              return;
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("[v0] CLIENT: onReadyForServerCompletion fired");
            console.log("[v0] CLIENT: paymentId from Pi:", paymentId);
            console.log("[v0] CLIENT: txid from Pi:", txid);
            console.log("[v0] CLIENT: paymentId type:", typeof paymentId);
            console.log("[v0] CLIENT: txid type:", typeof txid);
            
            context.onLog("On-chain confirmed. Completing...");
            updateEvidence(newAction.id, { blockchainTxId: txid });

            try {
              const completeUrl = LOCAL_BACKEND_URLS.COMPLETE_PAYMENT(paymentId);
              console.log("[v0] CLIENT: calling complete endpoint:", completeUrl);
              console.log("[v0] CLIENT: sending paymentId:", paymentId, "txid:", txid);
              
              const completeRes = await fetch(completeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
              });

              console.log("[v0] CLIENT: Complete response status:", completeRes.status);

              let completeData: any;
              try {
                completeData = await completeRes.json();
              } catch (parseErr) {
                console.error("[v0] CLIENT: Failed to parse complete response:", parseErr);
                completeData = { success: false, error: "Invalid server response" };
              }
              
              console.log("[v0] CLIENT: Complete response data:", completeData);

              // Check both HTTP status and the success flag from response
              if (!completeRes.ok || completeData.success === false) {
                const errMsg = completeData.error || completeData.detail || `HTTP ${completeRes.status}`;
                console.log("[v0] CLIENT: Completion failed:", errMsg);
                context.onLog(`Completion failed: ${errMsg}`);
                updateActionStatus(newAction.id, "Failed", new Date());
                setErrorMessage(`Completion failed: ${errMsg}`);
                return;
              }
              
              console.log("[v0] CLIENT: Completion successful");
              updateActionStatus(newAction.id, "Reserved", new Date());
              context.onLog("Reserved in system.");
              setCompletedAction({ ...newAction, status: "Reserved" });
              setSelectedType("");
              setAmount("");
              setTargetWallet("");
              setNote("");
            } catch (fetchErr) {
              const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
              console.log("[v0] CLIENT: Completion network error:", errMsg);
              context.onLog(`Completion network error: ${errMsg}`);
              updateActionStatus(newAction.id, "Failed", new Date());
              setErrorMessage(`Completion network error: ${errMsg}`);
              return;
            }
          },

          onCancel: () => {
            console.log("[v0] Payment cancelled by user");
            context.onLog("Payment cancelled by user.");
            updateActionStatus(newAction.id, "Failed", new Date());
            setErrorMessage("Payment was cancelled. Please try again.");
          },

          onError: (error: Error) => {
            console.log("[v0] Payment error:", error.message);
            context.onLog(`Payment error: ${error.message}`);
            updateActionStatus(newAction.id, "Failed", new Date());
            setErrorMessage(`Wallet error: ${error.message}`);
          },
        }
      );

      setSuccessMessage(`${newAction.referenceId} created — approve in Pi Wallet.`);
    } catch (error) {
      console.error("[v0] Error creating action:", error);
      setErrorMessage("Failed to create treasury action");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {'Create Treasury Reserve'}
        </CardTitle>
        <CardDescription>
          {'All actions require Pi Wallet approval. Transactions are executed on Pi Testnet.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show Receipt after successful completion */}
        {completedAction && (
          <PaymentReceipt 
            action={completedAction} 
            onDismiss={() => setCompletedAction(null)}
          />
        )}

        {/* Show form unless receipt is displayed */}
        {!completedAction && (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Reserve Type</Label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as TreasuryActionType)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_CONFIGS.map((config) => (
                  <SelectItem key={config.type} value={config.type}>
                    <div className="flex flex-col">
                      <span>{config.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {config.category}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedConfig && (
              <p className="text-xs text-muted-foreground">
                {selectedConfig.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              {'Reserve Amount (π)'}
            </Label>
            <Input
              id="amount"
              type="number"
              step="1"
              min="1"
              placeholder="Enter reserve amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 leading-relaxed">
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              {'This payment creates a directed reserve inside Treasury. Funds are not sent to the beneficiary at this step. Release happens later by approval.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetWallet">
              {'Target Pi Wallet'}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="targetWallet"
              type="text"
              placeholder="Enter target Pi Wallet address (beneficiary)"
              value={targetWallet}
              onChange={(e) => setTargetWallet(e.target.value)}
              disabled={isProcessing}
              required
            />
            <p className="text-xs text-muted-foreground">
              {'Designated beneficiary for this reserve'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Enter details about this treasury action..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isProcessing}
              rows={3}
            />
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => {
                      setErrorMessage("");
                      setIsProcessing(false);
                    }}
                  >
                    {'Retry'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-accent bg-accent/10">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <AlertDescription className="text-accent-foreground">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing || !selectedType || !amount || !targetWallet}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {'Processing...'}
              </>
            ) : (
              '→ Reserve & Sign'
            )}
          </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
