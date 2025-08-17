"use client";

import { CdpClient } from "@coinbase/cdp-sdk";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dbAdapter } from "@/lib/db-adapter";

interface SwapInterfaceProps {
  initialFromToken?: string;
  initialToToken?: string;
  initialAmount?: string;
  userAddress?: string;
  groupId?: string;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

interface SwapQuote {
  transaction?: {
    data?: string;
    to?: string;
    value?: bigint;
  };
  toAmount?: bigint;
  liquidityAvailable?: boolean;
}

const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoUrl: "/tokens/usdc.png",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logoUrl: "/tokens/eth.png",
  },
  {
    address: "0x4200000000000000000000000000000000000006",
    symbol: "WETH",
    name: "Wrapped Ethereum",
    decimals: 18,
    logoUrl: "/tokens/weth.png",
  },
  {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    logoUrl: "/tokens/dai.png",
  },
];

export function SwapInterface({
  initialFromToken = "USDC",
  initialToToken = "ETH",
  initialAmount = "",
  userAddress,
  groupId,
}: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState<TokenInfo>(
    SUPPORTED_TOKENS.find((t) => t.symbol === initialFromToken) ||
      SUPPORTED_TOKENS[0],
  );
  const [toToken, setToToken] = useState<TokenInfo>(
    SUPPORTED_TOKENS.find((t) => t.symbol === initialToToken) ||
      SUPPORTED_TOKENS[1],
  );
  const [fromAmount, setFromAmount] = useState(initialAmount);
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Fetch token prices on mount
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const response = await dbAdapter.getTokenPrices(
          SUPPORTED_TOKENS.map((t) => t.address),
        );
        if (response.success && response.data) {
          setPrices(response.data);
        }
      } catch (error) {
        console.error("Error fetching token prices:", error);
      }
    };
    loadPrices();
  }, []);

  const getQuote = useCallback(async () => {
    if (!fromAmount || !userAddress) return;

    setIsQuoting(true);
    try {
      const cdp = new CdpClient();
      const amountInWei = BigInt(
        Math.floor(parseFloat(fromAmount) * 10 ** fromToken.decimals),
      );

      const swapQuote = await cdp.evm.createSwapQuote({
        fromToken: fromToken.address as `0x${string}`,
        toToken: toToken.address as `0x${string}`,
        fromAmount: amountInWei,
        taker: userAddress as `0x${string}`,
        network: "base",
      });

      if (swapQuote?.liquidityAvailable) {
        setQuote(swapQuote);
        const outputAmount = swapQuote.toAmount
          ? (Number(swapQuote.toAmount) / 10 ** toToken.decimals).toFixed(6)
          : "0";
        setToAmount(outputAmount);
      } else {
        setToAmount("");
        setQuote(null);
        toast({
          title: "No liquidity available",
          description: "Try a different token pair or amount",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error getting quote:", error);
      setToAmount("");
      setQuote(null);
    } finally {
      setIsQuoting(false);
    }
  }, [fromAmount, fromToken, toToken, userAddress, toast]);

  // Get quote when inputs change
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      getQuote();
    } else {
      setToAmount("");
      setQuote(null);
    }
  }, [fromAmount, getQuote]);

  const handleSwap = async () => {
    if (!quote || !userAddress) {
      toast({
        title: "Missing information",
        description: "Please connect your wallet and enter an amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Calculate USD values
      const fromAmountUsd = prices[fromToken.address]
        ? parseFloat(fromAmount) * prices[fromToken.address]
        : 0;
      const toAmountUsd = prices[toToken.address]
        ? parseFloat(toAmount) * prices[toToken.address]
        : 0;

      // Record the swap in the database
      const swapResponse = await dbAdapter.recordSwap({
        userAddress,
        groupId,
        fromToken: fromToken.address,
        toToken: toToken.address,
        fromAmount: (
          parseFloat(fromAmount) *
          10 ** fromToken.decimals
        ).toString(),
        toAmount: (parseFloat(toAmount) * 10 ** toToken.decimals).toString(),
        fromAmountUsd,
        toAmountUsd,
        status: "PENDING",
      });

      if (!swapResponse.success || !swapResponse.swap) {
        throw new Error(swapResponse.error || "Failed to record swap");
      }

      // Reset form
      setFromAmount("");
      setToAmount("");
      setQuote(null);
    } catch (error) {
      console.error("Error executing swap:", error);
      toast({
        title: "Swap failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
  };

  const calculatePriceImpact = () => {
    if (!quote || !fromAmount || !toAmount) return null;

    const fromValue = parseFloat(fromAmount) * (prices[fromToken.address] || 0);
    const toValue = parseFloat(toAmount) * (prices[toToken.address] || 0);

    if (fromValue === 0) return null;

    const impact = ((fromValue - toValue) / fromValue) * 100;
    return impact.toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap</CardTitle>
        <CardDescription>Trade tokens instantly on Base</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label htmlFor="from-amount" className="text-sm font-medium">
            From
          </label>
          <div className="flex gap-2">
            <Input
              id="from-amount"
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Select
              value={fromToken.symbol}
              onValueChange={(value) => {
                const token = SUPPORTED_TOKENS.find((t) => t.symbol === value);
                if (token) setFromToken(token);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_TOKENS.map((token) => (
                  <SelectItem key={token.address} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {fromAmount && prices[fromToken.address] && (
            <p className="text-xs text-muted-foreground">
              ≈ $
              {(parseFloat(fromAmount) * prices[fromToken.address]).toFixed(2)}
            </p>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFlipTokens}
            disabled={isLoading || isQuoting}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label htmlFor="to-amount" className="text-sm font-medium">
            To
          </label>
          <div className="flex gap-2">
            <Input
              id="to-amount"
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="flex-1"
              disabled={isLoading}
            />
            <Select
              value={toToken.symbol}
              onValueChange={(value) => {
                const token = SUPPORTED_TOKENS.find((t) => t.symbol === value);
                if (token) setToToken(token);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_TOKENS.map((token) => (
                  <SelectItem key={token.address} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {toAmount && prices[toToken.address] && (
            <p className="text-xs text-muted-foreground">
              ≈ ${(parseFloat(toAmount) * prices[toToken.address]).toFixed(2)}
            </p>
          )}
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>
                1 {fromToken.symbol} ={" "}
                {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)}{" "}
                {toToken.symbol}
              </span>
            </div>
            {calculatePriceImpact() && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span
                  className={
                    calculatePriceImpact() &&
                    parseFloat(calculatePriceImpact() || "0") > 5
                      ? "text-destructive"
                      : ""
                  }
                >
                  {calculatePriceImpact()}%
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span>Base</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleSwap}
          disabled={!quote || isLoading || isQuoting || !userAddress}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Swapping...
            </>
          ) : isQuoting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting quote...
            </>
          ) : !userAddress ? (
            "Connect Wallet"
          ) : !quote ? (
            "Enter an amount"
          ) : (
            "Swap"
          )}
        </Button>

        {/* Warning for high price impact */}
        {calculatePriceImpact() &&
          parseFloat(calculatePriceImpact() || "0") > 5 && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              ⚠️ High price impact! Consider reducing your trade size.
            </div>
          )}
      </CardContent>
    </Card>
  );
}
