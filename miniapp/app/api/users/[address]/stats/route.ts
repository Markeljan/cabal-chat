import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  try {
    const userAddress = address.toLowerCase();

    // Get all user swaps
    const swaps = await prisma.swap.findMany({
      where: {
        userAddress: {
          equals: userAddress,
          mode: "insensitive",
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const completedSwaps = swaps.filter((s) => s.status === "COMPLETED");
    const totalSwaps = swaps.length;
    const totalVolume = completedSwaps.reduce(
      (sum, swap) => sum + Number(swap.fromAmountUsd),
      0,
    );
    const totalPnl = completedSwaps.reduce(
      (sum, swap) => sum + Number(swap.pnlUsd || 0),
      0,
    );

    const avgPnlPercentage =
      completedSwaps.length > 0
        ? completedSwaps.reduce(
            (sum, swap) => sum + Number(swap.pnlPercent || 0),
            0,
          ) / completedSwaps.length
        : 0;

    const successRate =
      totalSwaps > 0 ? (completedSwaps.length / totalSwaps) * 100 : 0;

    // Find best and worst swaps
    const bestSwap = completedSwaps.reduce(
      (best, swap) => {
        if (!best || Number(swap.pnlUsd || 0) > Number(best.pnlUsd || 0))
          return swap;
        return best;
      },
      null as (typeof swaps)[0] | null,
    );

    const worstSwap = completedSwaps.reduce(
      (worst, swap) => {
        if (!worst || Number(swap.pnlUsd || 0) < Number(worst.pnlUsd || 0))
          return swap;
        return worst;
      },
      null as (typeof swaps)[0] | null,
    );

    // Calculate favorite tokens
    const tokenCounts = new Map<string, number>();
    swaps.forEach((swap) => {
      tokenCounts.set(
        swap.fromToken,
        (tokenCounts.get(swap.fromToken) || 0) + 1,
      );
      tokenCounts.set(swap.toToken, (tokenCounts.get(swap.toToken) || 0) + 1);
    });

    const favoriteTokens = Array.from(tokenCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([token, count]) => ({ token, count }));

    const stats = {
      address,
      totalSwaps,
      totalVolume,
      totalPnl,
      avgPnlPercentage,
      successRate,
      bestSwap: bestSwap
        ? {
            ...bestSwap,
            fromAmount: bestSwap.fromAmount.toString(),
            toAmount: bestSwap.toAmount.toString(),
          }
        : null,
      worstSwap: worstSwap
        ? {
            ...worstSwap,
            fromAmount: worstSwap.fromAmount.toString(),
            toAmount: worstSwap.toAmount.toString(),
          }
        : null,
      favoriteTokens,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user stats" },
      { status: 500 },
    );
  }
}
