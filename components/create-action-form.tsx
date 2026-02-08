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
import { createAction, processApproval, processCompletion, processFailure, validatePayload } from "@/lib/core-engine";
import { TreasuryAction, generateReferenceId } from "@/lib/treasury-types";
import { isTestnetMode, simulateTestnetApproval } from "@/lib/testnet-config";

export function CreateActionForm() {
  const { userData } = usePiAuth();
  const addAction = useTreasuryStore((state) => state.addAction);
  const addLog = useTreasuryStore((state) => state.addLog);
  const updateActionStatus = useTreasuryStore((state) => state.updateActionStatus);
  const updateEvidence = useTreasuryStore((state) => state.updateEvidence);
  
  const [selectedType, setSelectedType] = useState<TreasuryActionType | "">("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [freezeId, setFreezeId] = useState(""); // Declare freezeId variable

  const selectedConfig = ACTION_CONFIGS.find(c => c.type === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !amount) {
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

      // Check if running in Testnet mode (no payment backend required)
      if (isTestnetMode()) {
        try {
          context.onLog("⚙ Testnet mode: Simulating wallet approval flow...");
          context.onLog("ℹ Note: Full payment backend not required in Testnet");
          
          // Simulate wallet approval without createPayment
          const { paymentId, txId } = await simulateTestnetApproval();
          
          // Generate release ID
          const releaseId = `RELEASE-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
          
          // Simulate approval
          context.onLog(`✓ Testnet wallet signature: ${paymentId}`);
          context.onLog(`✓ Release ID generated: ${releaseId}`);
          updateEvidence(newAction.id, { 
            releaseId, 
            walletSignature: paymentId 
          });
          updateActionStatus(newAction.id, "Approved", new Date());
          
          // Simulate completion
          context.onLog(`✓ Testnet blockchain TX: ${txId}`);
          updateEvidence(newAction.id, { blockchainTxId: txId });
          updateActionStatus(newAction.id, "Submitted", new Date());
          context.onLog("✓ Submitted to institutional review queue (Testnet)");
          
          setSuccessMessage(`${newAction.referenceId} created and approved! (Testnet Mode)`);
          
          // Reset form
          setSelectedType("");
          setAmount("");
          setNote("");
          
        } catch (error) {
          context.onLog(`✗ Testnet simulation error: ${error instanceof Error ? error.message : 'Unknown'}`);
          updateActionStatus(newAction.id, "Failed", new Date());
          setErrorMessage("Testnet simulation failed");
        }
      } else if (typeof window.Pi !== "undefined") {
        // Production flow with Pi SDK payment
        try {
          context.onLog("Requesting wallet signature (approval only)...");
          
          await window.Pi.createPayment({
            amount: 0.01,
            memo: `Treasury Action Signature: ${newAction.referenceId} [APPROVAL ONLY]`,
            metadata: { 
              treasuryActionId: newAction.id,
              referenceId: newAction.referenceId,
              actionType: newAction.type,
              operationalAmount: numAmount,
              isApprovalOnly: true,
              freezeId: newAction.runtimeEvidence.freezeId
            }
          }, {
            onReadyForServerApproval: (paymentId: string) => {
              const releaseId = `RELEASE-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
              addLog(newAction.id, `✓ Wallet signature received (${paymentId.substring(0, 12)}...)`);
              addLog(newAction.id, `✓ Release ID generated: ${releaseId}`);
              updateEvidence(newAction.id, { 
                releaseId, 
                walletSignature: paymentId 
              });
              updateActionStatus(newAction.id, "Approved", new Date());
            },
            onReadyForServerCompletion: (paymentId: string, txid: string) => {
              addLog(newAction.id, `✓ Signature on-chain (TX: ${txid.substring(0, 16)}...)`);
              updateEvidence(newAction.id, { blockchainTxId: txid });
              updateActionStatus(newAction.id, "Submitted", new Date());
              addLog(newAction.id, "✓ Submitted to institutional review queue");
            },
            onCancel: () => {
              addLog(newAction.id, "✗ Signature cancelled");
              updateActionStatus(newAction.id, "Failed", new Date());
            },
            onError: (error: Error) => {
              addLog(newAction.id, `✗ ${error.message}`);
              updateActionStatus(newAction.id, "Failed", new Date());
            }
          });

          setSuccessMessage(`${newAction.referenceId} created! Approve in wallet.`);
          
          // Reset form
          setSelectedType("");
          setAmount("");
          setNote("");
          setFreezeId(""); // Reset freezeId
          
        } catch (error) {
          addLog(newAction.id, `✗ Wallet error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          updateActionStatus(newAction.id, "Failed", new Date());
          setErrorMessage("Failed to initiate wallet signature");
        }
      } else {
        // Fallback if Pi SDK not available
        addLog(newAction.id, "⚠ Pi SDK not available - action created but not signed");
        setSuccessMessage(`Action ${newAction.referenceId} created (signature pending)`);
      }
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
        <CardTitle className="flex items-center justify-between">
          <span>{'Create Treasury Action Ticket'}</span>
          {isTestnetMode() && (
            <span className="text-xs px-2 py-1 bg-warning/10 text-warning border border-warning/20 rounded">
              {'TESTNET MODE'}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {'<90s Flow: Action → Wallet Signature → Status (approval only)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Action Type</Label>
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
              {'Operational Amount (π)'}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter operational amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 leading-relaxed">
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              {'Non-binding operational data entry only. No funds transfer or custody.'}
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
              <AlertDescription>{errorMessage}</AlertDescription>
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
            disabled={isProcessing || !selectedType || !amount}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {'Processing...'}
              </>
            ) : (
              '→ Create & Request Signature'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
