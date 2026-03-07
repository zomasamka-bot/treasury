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

      if (typeof window.Pi === "undefined") {
        addLog(newAction.id, "Pi SDK not available — open this app inside Pi Browser");
        updateActionStatus(newAction.id, "Failed", new Date());
        setErrorMessage("Pi Browser required. Please open this app inside Pi Browser.");
        return;
      }

      // Real Pi payment flow — Pi.init() has already been called with the
      // correct sandbox flag (true in Developer Portal / App Studio Preview,
      // false in production), so createPayment() resolves through the right
      // Pi Platform payment routing in both environments.
      context.onLog("Opening Pi Wallet for payment...");

      await window.Pi.createPayment(
        {
          amount: 0.01,
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
              const approveRes = await fetch(LOCAL_BACKEND_URLS.APPROVE_PAYMENT(paymentId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              });

              const approveData = await approveRes.json().catch(() => ({}));

              if (!approveRes.ok || approveData.success === false) {
                const errMsg = approveData.error || approveData.detail || `HTTP ${approveRes.status}`;
                context.onLog(`Approval failed: ${errMsg}`);
                updateActionStatus(newAction.id, "Failed", new Date());
                setErrorMessage(`Approval failed: ${errMsg}`);
                return;
              }
            } catch (fetchErr) {
              const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
              context.onLog(`Approval network error: ${errMsg}`);
              updateActionStatus(newAction.id, "Failed", new Date());
              setErrorMessage("Network error during approval");
              return;
            }

            context.onLog(`Approved. Reference: ${newAction.referenceId}`);
            updateActionStatus(newAction.id, "Approved", new Date());
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            context.onLog("On-chain confirmed. Completing...");
            updateEvidence(newAction.id, { blockchainTxId: txid });

            try {
              const completeRes = await fetch(LOCAL_BACKEND_URLS.COMPLETE_PAYMENT(paymentId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
              });

              if (!completeRes.ok) {
                const errBody = await completeRes.json().catch(() => ({}));
                context.onLog(`Completion failed: ${errBody.error || completeRes.status}`);
                updateActionStatus(newAction.id, "Failed", new Date());
                return;
              }
            } catch (fetchErr) {
              const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
              context.onLog(`Completion network error: ${errMsg}`);
              updateActionStatus(newAction.id, "Failed", new Date());
              return;
            }

            updateActionStatus(newAction.id, "Submitted", new Date());
            context.onLog("Submitted to institutional review queue.");
            setSuccessMessage(`${newAction.referenceId} approved and submitted.`);
            setSelectedType("");
            setAmount("");
            setNote("");
          },

          onCancel: () => {
            context.onLog("Payment cancelled by user.");
            updateActionStatus(newAction.id, "Failed", new Date());
            setErrorMessage("Payment was cancelled.");
          },

          onError: (error: Error) => {
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
          {'Create Treasury Action Ticket'}
        </CardTitle>
        <CardDescription>
          {'<90s Flow: Create Action → Pi Wallet Payment → Approved → Submitted'}
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
