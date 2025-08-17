import type { Swap } from "../../../miniapp/lib/db-adapter";

const MINIAPP_BASE_URL = process.env.MINIAPP_URL || "https://app.cabalchat.xyz";

export class SwapHandler {
  /**
   * Generate a link to the miniapp swap interface
   */
  generateSwapLink(params: {
    fromToken?: string;
    toToken?: string;
    amount?: string;
    userAddress: string;
    groupId?: string;
  }): string {
    const url = new URL(`${MINIAPP_BASE_URL}/swap`);

    if (params.fromToken) url.searchParams.append("from", params.fromToken);
    if (params.toToken) url.searchParams.append("to", params.toToken);
    if (params.amount) url.searchParams.append("amount", params.amount);
    url.searchParams.append("address", params.userAddress);
    if (params.groupId) url.searchParams.append("group", params.groupId);

    return url.toString();
  }

  /**
   * Generate a link to user stats page
   */
  generateStatsLink(userAddress: string): string {
    return `${MINIAPP_BASE_URL}/user/${userAddress}`;
  }

  /**
   * Generate a link to the leaderboard
   */
  generateLeaderboardLink(params?: {
    period?: "all" | "daily" | "weekly" | "monthly";
    metric?: "volume" | "pnl" | "swaps";
    groupId?: string;
  }): string {
    const url = new URL(`${MINIAPP_BASE_URL}/leaderboard`);

    if (params?.period) url.searchParams.append("period", params.period);
    if (params?.metric) url.searchParams.append("metric", params.metric);
    if (params?.groupId) url.searchParams.append("group", params.groupId);

    return url.toString();
  }

  /**
   * Generate a link to a specific swap details
   */
  generateSwapDetailsLink(swapId: string): string {
    return `${MINIAPP_BASE_URL}/swap/${swapId}`;
  }

  /**
   * Parse swap command and generate appropriate link
   */
  parseSwapCommand(
    command: string,
    userAddress: string,
    groupId?: string,
  ): {
    link: string;
    message: string;
  } {
    // Parse command like "swap 100 USDC to ETH"
    const swapRegex = /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i;
    const match = command.match(swapRegex);

    if (match) {
      const [, amount, fromToken, toToken] = match;
      const link = this.generateSwapLink({
        fromToken: fromToken.toUpperCase(),
        toToken: toToken.toUpperCase(),
        amount,
        userAddress,
        groupId,
      });

      return {
        link,
        message: `Ready to swap ${amount} ${fromToken.toUpperCase()} for ${toToken.toUpperCase()}! Click the link below to complete your swap:`,
      };
    }

    // Default swap link without parameters
    const link = this.generateSwapLink({ userAddress, groupId });
    return {
      link,
      message: "Click the link below to start swapping:",
    };
  }

  /**
   * Format swap confirmation message
   */
  formatSwapConfirmation(swap: Swap): string {
    const pnlDisplay = swap.pnl
      ? `${swap.pnl > 0 ? "+" : ""}${swap.pnl.toFixed(2)} USD (${swap.pnlPercentage?.toFixed(2)}%)`
      : "Calculating...";

    return [
      `✅ Swap completed successfully!`,
      ``,
      `From: ${swap.fromAmount} ${swap.fromToken}`,
      `To: ${swap.toAmount} ${swap.toToken}`,
      `Value: $${swap.toAmountUsd.toFixed(2)}`,
      `PnL: ${pnlDisplay}`,
      ``,
      `View details: ${this.generateSwapDetailsLink(swap.id)}`,
    ].join("\n");
  }
}

export const swapHandler = new SwapHandler();
