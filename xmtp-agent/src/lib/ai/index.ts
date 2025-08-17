import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { BalanceService } from "@/lib/balance";

const balanceService = new BalanceService();

const getBalance = tool({
  description: "Fetch a token balance using Coinbase Developer Platform",
  inputSchema: z.object({
    address: z.string().describe("Wallet address"),
    tokenAddress: z
      .string()
      .optional()
      .describe("Token contract address; defaults to USDC"),
  }),
  execute: async ({
    address,
    tokenAddress,
  }: {
    address: string;
    tokenAddress?: string;
  }) => {
    try {
      const { amount, symbol } = await balanceService.getTokenBalance(
        address as `0x${string}`,
        tokenAddress as `0x${string}`,
      );
      return `${amount} ${symbol}`;
    } catch (error) {
      console.error("Error fetching balance", error);
      return "Error fetching balance";
    }
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
