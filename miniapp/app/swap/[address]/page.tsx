"use client";

import { Buy } from "@coinbase/onchainkit/buy";
import type { SwapError } from "@coinbase/onchainkit/swap";
import type { Token } from "@coinbase/onchainkit/token";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import type { TransactionReceipt } from "viem";
import { decodeEventLog, parseAbiItem } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { leaderboardAPI } from "@/lib/api/leaderboard";
import { useTokenData } from "@/lib/hooks/useTokenData";

// Transfer event for tracking token movements
const TRANSFER_EVENT_ABI = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

function BuyWithSwapTracking({ token }: { token: Token }) {
  const { toast } = useToast();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const searchParams = useSearchParams();

  const groupId = searchParams.get("group") || undefined;

  const handleSuccess = useCallback(
    async (receipt?: TransactionReceipt) => {
      if (!receipt || !address || !publicClient) {
        console.error("No receipt, address, or publicClient available");
        return;
      }

      try {
        // Get the full transaction details
        const transaction = await publicClient.getTransaction({
          hash: receipt.transactionHash,
        });

        // Parse logs to find swap details
        let fromToken: string | undefined;
        let toToken: string | undefined;
        let fromAmount = "0";
        let toAmount = "0";

        // Look for Transfer events to determine token movements
        const transferLogs = receipt.logs.filter((log) => {
          try {
            const decoded = decodeEventLog({
              abi: [TRANSFER_EVENT_ABI],
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === "Transfer";
          } catch {
            return false;
          }
        });

        // Analyze transfer logs to determine swap details
        // Typically, in a swap:
        // 1. User transfers tokenA to the pool (from user to pool)
        // 2. Pool transfers tokenB to the user (from pool to user)

        const userAddress = address.toLowerCase();
        const incomingTransfers: Array<{ token: string; amount: bigint }> = [];
        const outgoingTransfers: Array<{ token: string; amount: bigint }> = [];

        for (const log of transferLogs) {
          try {
            const decoded = decodeEventLog({
              abi: [TRANSFER_EVENT_ABI],
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "Transfer") {
              const from = decoded.args.from.toLowerCase();
              const to = decoded.args.to.toLowerCase();
              const value = decoded.args.value;

              // If it's an incoming transfer to the user
              if (to === userAddress && from !== userAddress) {
                incomingTransfers.push({
                  token: log.address.toLowerCase(),
                  amount: value,
                });
              }
              // If it's an outgoing transfer from the user
              else if (from === userAddress && to !== userAddress) {
                outgoingTransfers.push({
                  token: log.address.toLowerCase(),
                  amount: value,
                });
              }
            }
          } catch (error) {
            console.error("Error decoding transfer log:", error);
          }
        }

        // For ETH swaps, check the transaction value
        if (transaction.value > BigInt(0)) {
          // User sent ETH
          outgoingTransfers.push({
            token: "0x0000000000000000000000000000000000000000",
            amount: transaction.value,
          });
        }

        // Determine from and to tokens
        if (outgoingTransfers.length > 0) {
          fromToken = outgoingTransfers[0].token;
          fromAmount = outgoingTransfers[0].amount.toString();
        }

        if (incomingTransfers.length > 0) {
          // The incoming transfer should be the token we're buying
          const targetTokenTransfer =
            incomingTransfers.find(
              (t) => t.token.toLowerCase() === token.address.toLowerCase(),
            ) || incomingTransfers[0];

          toToken = targetTokenTransfer.token;
          toAmount = targetTokenTransfer.amount.toString();
        } else {
          // Fallback to the token we intended to buy
          toToken = token.address.toLowerCase();
        }

        // Create swap record via agent API, then mark as completed
        const created = (await leaderboardAPI.recordSwap({
          userAddress: userAddress,
          groupId,
          fromToken: fromToken || "0x0000000000000000000000000000000000000000",
          toToken: toToken || token.address.toLowerCase(),
          fromAmount: fromAmount,
          toAmount: toAmount,
          fromAmountUsd: 0,
          toAmountUsd: 0,
          txHash: receipt.transactionHash,
        })) as { id: string };

        if (created?.id) {
          await leaderboardAPI.completeSwap(
            created.id,
            receipt.transactionHash,
          );
          toast({
            title: "Swap Recorded",
            description: `Successfully swapped to ${token.symbol}`,
          });
        } else {
          console.error("Failed to record swap via agent API", created);
          toast({
            title: "Warning",
            description: "Swap completed but failed to record in database",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error recording swap:", error);
        toast({
          title: "Warning",
          description: "Swap completed but failed to record in database",
          variant: "destructive",
        });
      }
    },
    [address, groupId, token, toast, publicClient],
  );

  const handleError = useCallback(
    (error: SwapError) => {
      console.error("Buy error:", error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to complete swap",
        variant: "destructive",
      });
    },
    [toast],
  );

  return (
    <Buy
      toToken={token}
      onSuccess={handleSuccess}
      onError={handleError}
      className="w-full"
    />
  );
}

function SwapContent() {
  const params = useParams();
  const tokenAddress = params.address as string;
  const { data: tokenData, isLoading, error } = useTokenData(tokenAddress);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
            <div className="text-gray-600">Loading token details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-red-500">
            <div className="text-xl mb-2">❌</div>
            <div>Error loading token details</div>
            <div className="text-sm mt-2 text-gray-500">
              {error || "Token not found"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="text-center flex-1">
          <div className="font-semibold text-lg">{tokenData.symbol}</div>
        </div>
      </div>

      <div className="px-4">
        {/* Token Info Section */}
        <div className="py-6">
          <div className="text-center mb-6">
            {tokenData.image && (
              <img
                src={tokenData.image}
                alt={tokenData.name}
                className="w-24 h-24 mx-auto rounded-full mb-4"
              />
            )}
            <div className="text-2xl font-bold text-black mb-2">
              {tokenData.name}
            </div>
            <div className="text-lg font-medium text-gray-600">
              {tokenData.symbol}
            </div>
          </div>
        </div>

        {/* Buy Component */}
        <div className="pb-8">
          <BuyWithSwapTracking token={tokenData} />
        </div>
      </div>
    </div>
  );
}

export default function SwapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-32 mb-4" />
              <div className="h-96 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      }
    >
      <SwapContent />
    </Suspense>
  );
}
