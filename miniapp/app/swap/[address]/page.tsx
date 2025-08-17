"use client";

import { Buy, useBuyContext } from "@coinbase/onchainkit/buy";
import type { SwapError } from "@coinbase/onchainkit/swap";
import type { Token } from "@coinbase/onchainkit/token";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import type { TransactionReceipt } from "viem";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { dbAdapter, type Swap } from "@/lib/db-adapter";
import { useTokenData } from "@/lib/hooks/useTokenData";

function BuyWithSwapTracking({ token }: { token: Token }) {
	const { toast } = useToast();
	const { address } = useAccount();
	const searchParams = useSearchParams();
	const buyContext = useBuyContext();
	const groupId = searchParams.get("group") || undefined;

	const handleSuccess = useCallback(
		async (receipt?: TransactionReceipt) => {
			if (!receipt || !address) {
				console.error("No receipt or address available");
				return;
			}

			try {
				// Get swap details from buy context
				const { from, to, transactionHash } = buyContext;

				if (!from || !to) {
					console.error("Missing swap details from buy context");
					return;
				}

				// Create swap record
				const swapData: Omit<Swap, "id" | "createdAt"> = {
					userAddress: address.toLowerCase(),
					groupId,
					fromToken:
						from.token?.address || "0x0000000000000000000000000000000000000000", // ETH address
					toToken: to.token?.address || token.address,
					fromAmount: from.amount || "0",
					toAmount: to.amount || "0",
					fromAmountUsd: Number(from.amountUSD) || 0,
					toAmountUsd: Number(to.amountUSD) || 0,
					txHash: transactionHash || receipt.transactionHash,
					status: "COMPLETED",
					completedAt: new Date().toISOString(),
				};

				const response = await dbAdapter.recordSwap(swapData);

				if (response.success) {
					toast({
						title: "Swap Recorded",
						description: `Successfully swapped to ${token.symbol}`,
					});
				} else {
					console.error("Failed to record swap:", response.error);
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
		[address, buyContext, groupId, token, toast],
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
