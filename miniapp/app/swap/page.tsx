"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { SwapInterface } from "@/app/components/SwapInterface";

function SwapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fromToken = searchParams.get("from") || undefined;
  const toToken = searchParams.get("to") || undefined;
  const tokenAddress = searchParams.get("token") || undefined;
  const amount = searchParams.get("amount") || undefined;
  const address = searchParams.get("address") || undefined;
  const groupId = searchParams.get("group") || undefined;

  // If a specific token address is provided, redirect to the new route
  useEffect(() => {
    if (tokenAddress) {
      const params = new URLSearchParams();
      if (groupId) params.set("group", groupId);
      if (address) params.set("address", address);
      const queryString = params.toString();
      router.replace(
        `/swap/${tokenAddress}${queryString ? `?${queryString}` : ""}`,
      );
    }
  }, [tokenAddress, groupId, address, router]);

  // Show the old interface for general swapping
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Swap Tokens</h1>
      <SwapInterface
        initialFromToken={fromToken}
        initialToToken={toToken}
        initialAmount={amount}
        userAddress={address}
        groupId={groupId}
      />
    </div>
  );
}

export default function SwapPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    >
      <SwapContent />
    </Suspense>
  );
}
