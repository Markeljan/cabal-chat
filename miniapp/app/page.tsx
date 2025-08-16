"use client";

import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from "@coinbase/onchainkit/identity";
import {
  useAddFrame,
  useMiniKit,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useXMTP } from "../lib/hooks/useXMTP";
import { Button, Features, Home, Icon } from "./components/DemoComponents";
import { XMTPInfoCard } from "./components/XMTPInfoCard";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const { isConnected } = useAccount();
  const {
    client,
    isLoading: xmtpLoading,
    error: xmtpError,
    showInfoCard,
    isRegistered,
    initializeClient,
  } = useXMTP();

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  const xmtpStatusDisplay = useMemo(() => {
    if (!isConnected) return null;

    if (xmtpLoading) {
      return (
        <div className="text-xs text-[var(--app-accent)] animate-pulse">
          Initializing XMTP...
        </div>
      );
    }

    if (xmtpError) {
      return (
        <div className="text-xs text-red-500">XMTP Error: {xmtpError}</div>
      );
    }

    if (client && isRegistered) {
      return (
        <div className="text-xs text-green-500 flex items-center space-x-1">
          <Icon name="check" size="sm" />
          <span>XMTP Ready</span>
        </div>
      );
    }

    return (
      <div className="text-xs text-[var(--app-text-muted)]">
        XMTP Setup Required
      </div>
    );
  }, [isConnected, xmtpLoading, xmtpError, client, isRegistered]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            <div className="flex items-center space-x-2">
              <Wallet className="z-10">
                <ConnectWallet>
                  <Name className="text-inherit" />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
            {xmtpStatusDisplay}
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          {activeTab === "home" && <Home setActiveTab={setActiveTab} />}
          {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>

        <XMTPInfoCard isOpen={showInfoCard} onContinue={initializeClient} />
      </div>
    </div>
  );
}
