"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TreasuryAction } from "@/lib/treasury-types";
import { getStatusColor } from "@/lib/treasury-types";
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TreasuryActionCardProps = {
  action: TreasuryAction;
  onClick?: () => void;
};

export function TreasuryActionCard({ action, onClick }: TreasuryActionCardProps) {
  const StatusIcon = () => {
    switch (action.status) {
      case "Created":
        return <Clock className="w-4 h-4" />;
      case "Approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Submitted":
        return <FileText className="w-4 h-4" />;
      case "Failed":
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-l-4",
        action.status === "Created" && "border-l-blue-500",
        action.status === "Approved" && "border-l-accent",
        action.status === "Submitted" && "border-l-primary",
        action.status === "Failed" && "border-l-destructive"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon />
              <Badge className={getStatusColor(action.status)}>
                {action.status}
              </Badge>
            </div>
            <h3 className="font-semibold text-base text-foreground leading-tight">
              {action.type}
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {action.referenceId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              {action.amount.toLocaleString()} π
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {action.note && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {action.note}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{action.createdAt.toLocaleString()}</span>
          <div className="flex gap-2">
            {action.manifest.limitCheck && (
              <Badge variant="outline" className="text-xs">{'Limit ✓'}</Badge>
            )}
            {action.manifest.approvalRequired && (
              <Badge variant="outline" className="text-xs">{'Approval ✓'}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
