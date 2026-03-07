"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TreasuryAction } from "@/lib/treasury-types";
import { getStatusColor } from "@/lib/treasury-types";
import { CheckCircle2, Clock, FileText, XCircle, Shield, Link2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type ActionDetailDialogProps = {
  action: TreasuryAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ActionDetailDialog({ action, open, onOpenChange }: ActionDetailDialogProps) {
  if (!action) return null;

  const statusSteps = [
    { status: "Created", time: action.createdAt, icon: Clock },
    { status: "Approved", time: action.approvedAt, icon: CheckCircle2 },
    { status: "Submitted", time: action.submittedAt, icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{'Action Details'}</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {action.referenceId}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {/* Status */}
            <div>
              <h4 className="text-sm font-medium mb-2">{'Status'}</h4>
              <Badge className={getStatusColor(action.status)}>
                {action.status}
              </Badge>
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">{'Action Type'}</h4>
                <p className="text-sm text-muted-foreground">{action.type}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">{'Operational Amount'}</h4>
                <p className="text-lg font-bold text-foreground">
                  {action.amount.toLocaleString()} π
                </p>
                <div className="mt-2 p-2 bg-muted/30 rounded border border-border/50">
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{'Non-binding operational data entry. No fund transfer, custody, or investment promise.'}</span>
                  </p>
                </div>
              </div>

              {action.note && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{'Note'}</h4>
                  <p className="text-sm text-muted-foreground">{action.note}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium mb-3">{'Timeline'}</h4>
              <div className="space-y-3">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = step.time !== undefined;
                  const isFailed = action.status === "Failed" && !isCompleted;
                  
                  return (
                    <div key={step.status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`
                          rounded-full p-1.5
                          ${isCompleted ? 'bg-accent text-accent-foreground' : ''}
                          ${!isCompleted && !isFailed ? 'bg-muted text-muted-foreground' : ''}
                          ${isFailed ? 'bg-destructive/10 text-destructive' : ''}
                        `}>
                          {isFailed ? <XCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div className={`w-0.5 h-6 ${isCompleted ? 'bg-accent' : 'bg-border'}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.status}
                        </p>
                        {step.time && (
                          <p className="text-xs text-muted-foreground">
                            {step.time.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {action.status === "Failed" && action.failedAt && (
                  <div className="flex gap-3">
                    <div className="rounded-full p-1.5 bg-destructive/10 text-destructive">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">{'Failed'}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.failedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Runtime Evidence */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
                <Link2 className="w-4 h-4 text-primary" />
                {'Runtime Evidence & Audit Trail'}
              </h4>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between text-sm">
                  <span className="text-muted-foreground">{'Reference ID'}</span>
                  <span className="font-mono text-xs text-foreground break-all text-right max-w-[60%]">
                    {action.referenceId}
                  </span>
                </div>
                {action.runtimeEvidence.freezeId && (
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-muted-foreground">{'Freeze ID'}</span>
                    <span className="font-mono text-xs text-foreground break-all text-right max-w-[60%]">
                      {action.runtimeEvidence.freezeId}
                    </span>
                  </div>
                )}
                {action.runtimeEvidence.releaseId && (
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-muted-foreground">{'Release ID'}</span>
                    <span className="font-mono text-xs text-accent break-all text-right max-w-[60%]">
                      {action.runtimeEvidence.releaseId}
                    </span>
                  </div>
                )}
                {action.runtimeEvidence.walletSignature && (
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-muted-foreground">{'Wallet Signature'}</span>
                    <span className="font-mono text-xs text-primary break-all text-right max-w-[60%]">
                      {action.runtimeEvidence.walletSignature}
                    </span>
                  </div>
                )}
                {action.runtimeEvidence.blockchainTxId && (
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-muted-foreground">{'Blockchain TX'}</span>
                    <span className="font-mono text-xs text-primary break-all text-right max-w-[60%]">
                      {action.runtimeEvidence.blockchainTxId}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between text-sm pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">{'Created At'}</span>
                  <span className="text-xs text-foreground">
                    {action.createdAt.toLocaleString()}
                  </span>
                </div>
                {action.status === "Approved" && action.approvedAt && (
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-muted-foreground">{'Approved At'}</span>
                    <span className="text-xs text-accent">
                      {action.approvedAt.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Manifest */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">{'Manifest Hooks (UI Display Only)'}</h4>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {'Display-only configuration for institutional review reference. Not enforced programmatically.'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{'Limits'}</span>
                  <Badge variant={action.manifest.limitCheck ? "default" : "outline"} className="text-xs">
                    {action.manifest.limitCheck ? '✓ Checked' : '✗ Unchecked'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{'Approvals'}</span>
                  <Badge variant={action.manifest.approvalRequired ? "default" : "outline"} className="text-xs">
                    {action.manifest.approvalRequired ? '✓ Required' : '✗ Optional'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{'Reporting'}</span>
                  <Badge variant={action.manifest.reportingEnabled ? "default" : "outline"} className="text-xs">
                    {action.manifest.reportingEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* API Log */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">{'Runtime API Log'}</h4>
              {action.apiLog.length > 0 ? (
                <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {action.apiLog.map((log, index) => (
                    <p key={index} className="text-xs font-mono text-foreground/80 break-all leading-relaxed">
                      {log}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{'No runtime logs recorded'}</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
