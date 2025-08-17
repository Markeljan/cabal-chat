"use client";

import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from "@coinbase/onchainkit/identity";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useXMTP } from "../lib/hooks/useXMTP";
import {
  BottomNavigation,
  CabalDetails,
  GroupCreation,
  GroupLeaderboard,
  ProfileTab,
} from "./components/DemoComponents";
import { XMTPInfoCard } from "./components/XMTPInfoCard";

export default function App() {
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCabalId, setSelectedCabalId] = useState<string | null>(null);

  const { setFrameReady, isFrameReady } = useMiniKit();
  const { isConnected } = useAccount();
  const {
    client,
    isLoading: xmtpLoading,
    error: xmtpError,
    showInfoCard,
    isRegistered,
    initializeClient,
  } = useXMTP();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

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
          {/*<Icon name="check" size="sm" />*/}
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
        </header>

        <main className="flex-1">
          {selectedCabalId ? (
            <CabalDetails
              cabalId={selectedCabalId}
              onBack={() => setSelectedCabalId(null)}
            />
          ) : (
            <>
              {activeTab === "leaderboard" && (
                <GroupLeaderboard
                  refreshTrigger={refreshTrigger}
                  onCabalClick={setSelectedCabalId}
                />
              )}
              {activeTab === "create" && (
                <GroupCreation
                  onGroupCreated={() => {
                    setRefreshTrigger((prev) => prev + 1);
                    setActiveTab("leaderboard");
                  }}
                />
              )}
              {activeTab === "profile" && <ProfileTab />}
            </>
          )}
        </main>

        {!selectedCabalId && (
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        <XMTPInfoCard isOpen={showInfoCard} onContinue={initializeClient} />
      </div>
    </div>
  );
}
