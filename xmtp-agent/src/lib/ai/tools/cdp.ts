import { CdpClient } from "@coinbase/cdp-sdk";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { tool } from "ai";
import { toHex } from "viem";
import { base } from "viem/chains";
import { z } from "zod";

const cdp = new CdpClient();

// Type inference
const SwapToolInputSchema = z.object({
  fromToken: z.string(),
  toToken: z.string(),
  fromAmount: z.string(),
  taker: z.string(),
});

const WalletSendCallsOutputSchema = z.object({
  version: z.string(),
  chainId: z.string(),
  from: z.string(),
  calls: z.array(
    z.object({
      to: z.string().optional(),
      data: z.string().optional(),
      value: z.string().optional(),
      gas: z.string().optional(),
      metadata: z
        .object({
          description: z.string(),
          transactionType: z.string(),
        })
        .optional(),
    }),
  ),
  capabilities: z.record(z.string(), z.string()).optional(),
});

export const createSwapQuoteTool = tool({
  name: "createSwapQuote",
  description: "Create a swap quote for a given token pair and amount",
  inputSchema: SwapToolInputSchema,
  outputSchema: z.union([
    WalletSendCallsOutputSchema,
    z.literal("liquidity not available"),
  ]),
  execute: async ({ fromToken, toToken, fromAmount, taker }) => {
    const swapQuote = await cdp.evm.createSwapQuote({
      fromToken: fromToken as `0x${string}`,
      toToken: toToken as `0x${string}`,
      fromAmount: BigInt(fromAmount),
      taker: taker as `0x${string}`,
      network: "base",
    });

    if (!swapQuote) throw new Error("Failed to create swap quote");

    // remove the execute property from the swapQuote
    const result = {
      ...swapQuote,
      execute: undefined,
    };

    if (!result.liquidityAvailable) {
      return "liquidity not available";
    }

    // convert to wallet send calls
    const walletSendCalls: WalletSendCallsParams = {
      version: "1.0",
      chainId: toHex(base.id),
      from: "0x", // dynamic sender
      calls: [
        {
          data: result.transaction?.data,
          to: result.transaction?.to,
          value: toHex(result.transaction?.value ?? 0n),
        },
      ],
    };

    return walletSendCalls;
  },
});
