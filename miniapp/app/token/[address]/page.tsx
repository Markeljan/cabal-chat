"use client";

import { Buy } from "@coinbase/onchainkit/buy";
import { useParams } from "next/navigation";
import { useTokenData } from "@/lib/hooks/useTokenData";

export default function TokenPage() {
  const params = useParams();
  const tokenAddress = params.address as string;

  const { data, isLoading, error } = useTokenData(tokenAddress);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading token details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-red-500">
            <div className="text-xl mb-2">❌</div>
            <div>Error loading token details</div>
            <div className="text-sm mt-2 text-gray-500">
              {error || "Unknown error occurred"}
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
        <button className="p-2" type="button">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Back</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <div className="font-semibold text-lg">{data?.symbol || "TOKEN"}</div>
        </div>
        <div className="flex space-x-2">
          {data?.image && (
            <img
              src={data.image}
              alt={data.symbol}
              className="w-8 h-8 rounded-full"
            />
          )}
        </div>
      </div>

      {data && (
        <div className="px-4">
          {/* Token Info Section */}
          <div className="py-6">
            <div className="text-center mb-6">
              {data.image && (
                <img
                  src={data.image}
                  alt={data.name}
                  className="w-24 h-24 mx-auto rounded-full mb-4"
                />
              )}
              <div className="text-2xl font-bold text-black mb-2">
                {data.name}
              </div>
              <div className="text-lg font-medium text-gray-600">
                {data.symbol}
              </div>
            </div>
          </div>

          {/* Token Details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 text-gray-400">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <title>Symbol</title>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-600">Symbol</span>
              </div>
              <span className="font-medium">{data.symbol}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 text-gray-400">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <title>Decimals</title>
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-gray-600">Decimals</span>
              </div>
              <span className="font-medium">{data.decimals}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 text-gray-400">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <title>Chain ID</title>
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-gray-600">Chain ID</span>
              </div>
              <span className="font-medium">{data.chainId}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 text-gray-400">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <title>Address</title>
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-gray-600">Address</span>
              </div>
              <span className="font-mono text-xs font-medium break-all max-w-32">
                {data.address}
              </span>
            </div>
          </div>

          {/* Trade Button */}
          <div className="pb-8">
            <Buy toToken={data} isSponsored={true} />
          </div>
        </div>
      )}
    </div>
  );
}
