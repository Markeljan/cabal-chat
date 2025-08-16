"use client";

import type { Client } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { xmtpService } from "../xmtp";

interface UseXMTPReturn {
  client: Client | null;
  isLoading: boolean;
  error: string | null;
  showInfoCard: boolean;
  isRegistered: boolean;
  initializeClient: () => Promise<void>;
}

export function useXMTP(): UseXMTPReturn {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasCheckedIdentity, setHasCheckedIdentity] = useState(false);

  const initializeClient = useCallback(async () => {
    if (!walletClient || !address || !walletClient.account) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowInfoCard(false);

    try {
      const xmtpClient = await xmtpService.createClient(walletClient);
      setClient(xmtpClient);
      setIsRegistered(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create XMTP client",
      );
      setClient(null);
      setIsRegistered(false);
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address]);

  useEffect(() => {
    const checkAndSetupXMTP = async () => {
      if (
        !isConnected ||
        !walletClient ||
        !walletClient.account ||
        client ||
        isLoading ||
        hasCheckedIdentity
      ) {
        return;
      }

      setHasCheckedIdentity(true);

      try {
        const hasIdentity = await xmtpService.hasExistingIdentity(walletClient);
        if (hasIdentity) {
          // User has existing identity, create client directly
          const xmtpClient = await xmtpService.createClient(walletClient);
          setClient(xmtpClient);
          setIsRegistered(true);
        } else {
          // No existing identity, show info card first
          setShowInfoCard(true);
        }
      } catch (err) {
        console.error("Error checking XMTP identity:", err);
        setShowInfoCard(true);
      }
    };

    checkAndSetupXMTP();
  }, [isConnected, walletClient, client, isLoading, hasCheckedIdentity]);

  useEffect(() => {
    if (!isConnected) {
      setClient(null);
      setError(null);
      setShowInfoCard(false);
      setIsRegistered(false);
      setHasCheckedIdentity(false);
      xmtpService.disconnect();
    }
  }, [isConnected]);

  return {
    client,
    isLoading,
    error,
    showInfoCard,
    isRegistered,
    initializeClient,
  };
}
