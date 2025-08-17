import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { BalanceService } from "@/lib/balance";

const balanceService = new BalanceService();

const getBalance = tool({
  description: "Fetch a token balance using Coinbase Developer Platform",
  parameters: z.object({
    address: z.string().describe("Wallet address"),
    tokenAddress: z
      .string()
      .optional()
      .describe("Token contract address; defaults to USDC"),
  }),
  execute: async ({ address, tokenAddress }) => {
    const { amount, symbol } = await balanceService.getTokenBalance(
      address,
      tokenAddress,
    );
    return `${amount} ${symbol}`;
  },
});

export const promptAgent = async (prompt: string) => {
  console.log("received prompt", prompt);

  const result = await generateText({
    system:
      "You are an agent that helps users swap tokens on the Base blockchain.",
    model: openai("gpt-4o"),
    prompt,
    tools: { getBalance },
  });

  return result;
};
