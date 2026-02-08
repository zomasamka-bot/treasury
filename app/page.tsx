"use client";

import { useState } from "react";
import { useTreasuryStore } from "@/lib/treasury-store";
import { CreateActionForm } from "@/components/create-action-form";
import { TreasuryActionCard } from "@/components/treasury-action-card";
import { ActionDetailDialog } from "@/components/action-detail-dialog";
import { TreasurySyncListener } from "@/components/treasury-sync-listener";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, History, PlusCircle, AlertTriangle } from "lucide-react";
import type { TreasuryAction } from "@/lib/treasury-types";
import { isTestnetMode } from "@/lib/testnet-config";

export default function HomePage() {
  const { userData } = usePiAuth();
  const actions = useTreasuryStore((state) => state.actions);
  const [selectedAction, setSelectedAction] = useState<TreasuryAction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleActionClick = (action: TreasuryAction) => {
    setSelectedAction(action);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cross-tab Sync Listener */}
      <TreasurySyncListener />
      
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {'Treasury Action'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {'<90s Flow | treasury.pi | Unified Core Engine'}
              </p>
            </div>
            {userData && (
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {userData.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {'treasury.pi'}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Testnet Mode Banner */}
        {isTestnetMode() && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <strong className="text-warning">Testnet Mode Active:</strong> This app is running in Testnet mode with simulated wallet approvals. No Pi payment backend is required. All actions will be auto-approved after a short delay to simulate the wallet flow.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              {'Create Action'}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              {'History'}
              {actions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  {actions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <CreateActionForm />

            {/* Info Card */}
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {'Unified Core Engine • Non-Custodial Interface'}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {'Treasury action ticket system for institutional review on Pi Testnet. All actions use a single reusable Core Engine with unified status flow (Created → Approved → Submitted → Failed).'}
                  </p>
                  <div className="pt-1 border-t border-border/50">
                    <p className="text-xs font-medium text-foreground/70">
                      {'Wallet signature required for approval only. No fund transfers, custody, private keys, or investment promises.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {actions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {'No Actions Yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {'Create your first treasury action ticket to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <TreasuryActionCard
                    key={action.id}
                    action={action}
                    onClick={() => handleActionClick(action)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Action Detail Dialog */}
      <ActionDetailDialog
        action={selectedAction}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
