"use client";

import { TreasuryAction } from "@/lib/treasury-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusColor } from "@/lib/treasury-types";
import { Copy, Download, Share2, CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";

type PaymentReceiptProps = {
  action: TreasuryAction;
  onDismiss: () => void;
};

export function PaymentReceipt({ action, onDismiss }: PaymentReceiptProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [exported, setExported] = useState(false);

  const handleCopyFullRecord = () => {
    const fullRecord = `
RESERVE RECORD
==============
Reserve ID: ${action.referenceId}
Amount: ${action.amount.toLocaleString()} π
Target Wallet: ${action.targetWallet || "N/A"}
Purpose: ${action.type}
Notes: ${action.note || "N/A"}
Status: ${action.status}
Created: ${action.createdAt.toLocaleString()}
Timestamp: ${new Date().toLocaleString()}
    `.trim();
    
    navigator.clipboard.writeText(fullRecord);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportReceipt = () => {
    const receiptText = `
RESERVE RECORD
==============

Reserve ID: ${action.referenceId}
Amount: ${action.amount.toLocaleString()} π
Target Wallet: ${action.targetWallet || "N/A"}
Purpose: ${action.type}
Notes: ${action.note || "N/A"}
Status: ${action.status}
Created: ${action.createdAt.toLocaleString()}

Wallet Signature: ${action.runtimeEvidence.walletSignature || "N/A"}
${action.runtimeEvidence.blockchainTxId ? `Transaction ID: ${action.runtimeEvidence.blockchainTxId}\n` : ""}
==============
Exported: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reserve-${action.referenceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleShareReceipt = () => {
    const shareText = `Reserve Created\n\nID: ${action.referenceId}\nAmount: ${action.amount.toLocaleString()} π\nTarget: ${action.targetWallet || "N/A"}\nStatus: ${action.status}`;
    
    if (navigator.share) {
      navigator.share({
        title: "Treasury Reserve Record",
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
    
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <Card className="border-accent bg-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
            <div>
              <CardTitle className="text-lg">Reserve Created</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Action Signed via Pi Wallet
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(action.status)}>
            {action.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Receipt Details */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Reserve ID</p>
              <p className="text-sm font-mono text-foreground break-all">{action.referenceId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Amount</p>
              <p className="text-sm font-bold text-foreground">{action.amount.toLocaleString()} π</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Target Wallet</p>
              <p className="text-sm text-foreground break-all">{action.targetWallet || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Purpose</p>
              <p className="text-sm text-foreground">{action.type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Status</p>
              <p className="text-sm font-medium text-foreground">{action.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Timestamp</p>
              <p className="text-sm text-foreground">{action.createdAt.toLocaleString()}</p>
            </div>
            {action.runtimeEvidence.walletSignature && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground font-medium">Wallet Signature</p>
                <p className="text-sm font-mono text-primary break-all">
                  {action.runtimeEvidence.walletSignature.substring(0, 16)}...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyFullRecord}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copied" : "Copy Reserve ID"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyFullRecord}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copied" : "Copy Full Record"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareReceipt}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            {shared ? "Shared" : "Share"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportReceipt}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {exported ? "Exported" : "Export"}
          </Button>
        </div>

        {/* Release to Beneficiary Placeholder Button */}
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          disabled
          title="Release functionality coming soon"
        >
          <Lock className="w-4 h-4" />
          Release to Beneficiary (Coming Soon)
        </Button>

        {/* Action Info */}
        <div className="bg-muted/50 border border-border/50 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Used by:</strong> Pi Network users managing treasury reserves
            </p>
          </div>
          <div className="flex items-start gap-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Executed by:</strong> Pi Testnet reserve signing and recording
            </p>
          </div>
        </div>

        {/* Dismiss Button */}
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </CardContent>
    </Card>
  );
}
