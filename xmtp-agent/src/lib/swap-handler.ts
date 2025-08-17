import { CdpClient } from "@coinbase/cdp-sdk";
import { PrismaClient } from "@prisma/client";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { toHex } from "viem";
import { base } from "viem/chains";
import { swapTracker } from "./swap-tracker";

const cdp = new CdpClient();
const prisma = new PrismaClient();

interface SwapRequest {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  taker: string;
  groupId?: string;
}

interface TokenPrice {
  address: string;
  symbol: string;
  priceUsd: number;
}

export class SwapHandler {
  /**
   * Get current token prices from CoinGecko or another price API
   */
  private async getTokenPrices(
    tokens: string[],
  ): Promise<Map<string, TokenPrice>> {
    const prices = new Map<string, TokenPrice>();

    // Common token addresses on Base
    const tokenMap: Record<string, { symbol: string; coingeckoId: string }> = {
      "0x0000000000000000000000000000000000000000": {
        symbol: "ETH",
        coingeckoId: "ethereum",
      },
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": {
        symbol: "USDC",
        coingeckoId: "usd-coin",
      },
      "0x4200000000000000000000000000000000000006": {
        symbol: "WETH",
        coingeckoId: "ethereum",
      },
      "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": {
        symbol: "DAI",
        coingeckoId: "dai",
      },
    };

    // For demo purposes, using hardcoded prices
    // In production, you'd fetch from a price API
    const hardcodedPrices: Record<string, number> = {
      ETH: 3500,
      WETH: 3500,
      USDC: 1,
      DAI: 1,
    };

    for (const token of tokens) {
      const tokenInfo = tokenMap[token.toLowerCase()];
      if (tokenInfo) {
        prices.set(token, {
          address: token,
          symbol: tokenInfo.symbol,
          priceUsd: hardcodedPrices[tokenInfo.symbol] || 0,
        });
      }
    }

    return prices;
  }

  /**
   * Calculate USD value for a token amount
   */
  private async calculateUsdValue(
    tokenAddress: string,
    amount: bigint,
    decimals: number = 18,
  ): Promise<number> {
    const prices = await this.getTokenPrices([tokenAddress]);
    const price = prices.get(tokenAddress);

    if (!price) {
      console.warn(`Price not found for token ${tokenAddress}`);
      return 0;
    }

    const amountInUnits = Number(amount) / 10 ** decimals;
    return amountInUnits * price.priceUsd;
  }

  /**
   * Create a swap quote and record it in the database
   */
  async createSwapQuote(request: SwapRequest): Promise<{
    walletSendCalls: WalletSendCallsParams | null;
    swapId?: string;
    error?: string;
  }> {
    try {
      // Get swap quote from CDP
      const swapQuote = await cdp.evm.createSwapQuote({
        fromToken: request.fromToken as `0x${string}`,
        toToken: request.toToken as `0x${string}`,
        fromAmount: BigInt(request.fromAmount),
        taker: request.taker as `0x${string}`,
        network: "base",
      });

      if (!swapQuote) {
        throw new Error("Failed to create swap quote");
      }

      if (!swapQuote.liquidityAvailable) {
        return {
          walletSendCalls: null,
          error: "Liquidity not available for this swap",
        };
      }

      // Calculate USD values
      const fromAmountUsd = await this.calculateUsdValue(
        request.fromToken,
        BigInt(request.fromAmount),
      );

      const toAmountUsd = await this.calculateUsdValue(
        request.toToken,
        swapQuote.toAmount || 0n,
      );

      // Record the swap in database
      const swap = await swapTracker.recordSwap({
        userAddress: request.taker,
        groupId: request.groupId,
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: request.fromAmount,
        toAmount: swapQuote.toAmount?.toString() || "0",
        fromAmountUsd,
        toAmountUsd,
      });

      // Create wallet send calls
      const walletSendCalls: WalletSendCallsParams = {
        version: "1.0",
        chainId: toHex(base.id),
        from: request.taker as `0x${string}`,
        calls: [
          {
            data: swapQuote.transaction?.data,
            to: swapQuote.transaction?.to,
            value: toHex(swapQuote.transaction?.value ?? 0n),
            metadata: {
              description: `Swap ${request.fromToken} for ${request.toToken}`,
              transactionType: "swap",
            },
          },
        ],
        capabilities: {
          swapId: swap.id,
        },
      };

      return {
        walletSendCalls,
        swapId: swap.id,
      };
    } catch (error) {
      console.error("Error creating swap quote:", error);
      return {
        walletSendCalls: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle swap completion (called when transaction is confirmed)
   */
  async handleSwapCompletion(
    swapId: string,
    txHash: string,
    success: boolean = true,
  ): Promise<void> {
    try {
      const swap = await prisma.swap.findUnique({
        where: { id: swapId },
      });

      if (!swap) {
        console.error(`Swap ${swapId} not found`);
        return;
      }

      if (success) {
        // Get current value for PNL calculation
        const currentValueUsd = await this.calculateUsdValue(
          swap.toToken,
          BigInt(swap.toAmount.toString()),
        );

        await swapTracker.completeSwap(swapId, txHash, currentValueUsd);
      } else {
        // Mark swap as failed
        await prisma.swap.update({
          where: { id: swapId },
          data: {
            status: "FAILED",
            txHash,
          },
        });
      }
    } catch (error) {
      console.error("Error handling swap completion:", error);
    }
  }

  /**
   * Update PNL for all swaps periodically
   */
  async updateAllPnl(): Promise<void> {
    try {
      // Get all unique tokens from completed swaps
      const swaps = await prisma.swap.findMany({
        where: { status: "COMPLETED" },
        select: { toToken: true },
        distinct: ["toToken"],
      });

      const tokens = swaps.map((s) => s.toToken);
      const prices = await this.getTokenPrices(tokens);

      // Convert to price map with USD values
      const priceMap = new Map<string, number>();
      prices.forEach((price, token) => {
        priceMap.set(token, price.priceUsd);
      });

      await swapTracker.updateAllPnl(priceMap);
      console.log("PNL updated for all swaps");
    } catch (error) {
      console.error("Error updating PNL:", error);
    }
  }
}

export const swapHandler = new SwapHandler();
