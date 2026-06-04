"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, CheckCircle } from "lucide-react";
import { usePiAuth } from "@/contexts/pi-auth-context";

export function ConnectWalletButton() {
  const { isAuthenticated, userData, reinitialize } = usePiAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isAuthenticated || isConnecting) return;

    setIsConnecting(true);
    try {
      await reinitialize();
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (isAuthenticated && userData) {
    return (
      <Button
        disabled
        variant="default"
        size="sm"
        className="gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        {userData.username}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
