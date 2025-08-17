import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";
    const metric = searchParams.get("metric") || "pnl";
    const limit = parseInt(searchParams.get("limit") || "100");

    // Calculate date filter based on period
    let dateFilter = {};
    const now = new Date();
    switch (period) {
      case "daily":
        dateFilter = {
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "weekly":
        dateFilter = {
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "monthly":
        dateFilter = {
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        };
        break;
    }

    // Get all completed swaps for the period
    const swaps = await prisma.swap.findMany({
      where: {
        status: "COMPLETED",
        ...dateFilter,
      },
    });

    // Group by user and calculate stats
    const userStatsMap = new Map<string, any>();

    swaps.forEach((swap) => {
      const address = swap.userAddress.toLowerCase();
      if (!userStatsMap.has(address)) {
        userStatsMap.set(address, {
          address: swap.userAddress,
          totalSwaps: 0,
          totalVolume: 0,
          totalPnl: 0,
          winningSwaps: 0,
        });
      }

      const stats = userStatsMap.get(address);
      stats.totalSwaps++;
      stats.totalVolume += swap.fromAmountUsd;
      stats.totalPnl += Number(swap.pnlUsd) || 0;
      if (Number(swap.pnlUsd) > 0) stats.winningSwaps++;
    });

    // Convert to array and calculate additional metrics
    const leaderboard = Array.from(userStatsMap.values()).map((stats) => ({
      ...stats,
      avgPnlPercentage:
        stats.totalSwaps > 0 ? (stats.totalPnl / stats.totalVolume) * 100 : 0,
      winRate:
        stats.totalSwaps > 0
          ? (stats.winningSwaps / stats.totalSwaps) * 100
          : 0,
    }));

    // Sort by selected metric
    leaderboard.sort((a, b) => {
      switch (metric) {
        case "volume":
          return b.totalVolume - a.totalVolume;
        case "swaps":
          return b.totalSwaps - a.totalSwaps;
        default:
          return b.totalPnl - a.totalPnl;
      }
    });

    // Add rank and limit results
    const rankedLeaderboard = leaderboard
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return NextResponse.json({
      success: true,
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
