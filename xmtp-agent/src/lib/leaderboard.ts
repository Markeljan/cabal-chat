import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export interface UserLeaderboardEntry {
  rank: number;
  address: string;
  username?: string | null;
  avatarUrl?: string | null;
  totalVolume: string;
  totalSwaps: number;
  totalPnlUsd: string;
  totalPnlPercent: string;
  avgSwapSize: string;
}

export interface GroupLeaderboardEntry {
  rank: number;
  groupId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  totalVolume: string;
  totalSwaps: number;
  totalPnlUsd: string;
  totalPnlPercent: string;
  memberCount: number;
  avgSwapSize: string;
}

export interface GroupMemberLeaderboardEntry {
  rank: number;
  address: string;
  username?: string | null;
  volumeInGroup: string;
  swapsInGroup: number;
  pnlInGroupUsd: string;
}

export type LeaderboardSortBy = "volume" | "pnl" | "pnlPercent" | "swaps";

export class LeaderboardService {
  /**
   * Get user leaderboard
   */
  async getUserLeaderboard(
    sortBy: LeaderboardSortBy = "volume",
    limit: number = 100,
    offset: number = 0,
  ): Promise<UserLeaderboardEntry[]> {
    const orderByField = this.getOrderByField(sortBy, "user");

    const users = await prisma.user.findMany({
      orderBy: { [orderByField]: "desc" },
      take: limit,
      skip: offset,
      where: {
        totalSwaps: { gt: 0 },
      },
    });

    return users.map((user, index) => ({
      rank: offset + index + 1,
      address: user.address,
      username: user.username,
      avatarUrl: user.avatarUrl,
      totalVolume: user.totalVolume.toString(),
      totalSwaps: user.totalSwaps,
      totalPnlUsd: user.totalPnlUsd.toString(),
      totalPnlPercent: user.totalPnlPercent.toString(),
      avgSwapSize:
        user.totalSwaps > 0
          ? user.totalVolume.dividedBy(user.totalSwaps).toString()
          : "0",
    }));
  }

  /**
   * Get group leaderboard
   */
  async getGroupLeaderboard(
    sortBy: LeaderboardSortBy = "volume",
    limit: number = 100,
    offset: number = 0,
  ): Promise<GroupLeaderboardEntry[]> {
    const orderByField = this.getOrderByField(sortBy, "group");

    const groups = await prisma.group.findMany({
      orderBy: { [orderByField]: "desc" },
      take: limit,
      skip: offset,
      where: {
        totalSwaps: { gt: 0 },
        isActive: true,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return groups.map((group, index) => ({
      rank: offset + index + 1,
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      totalVolume: group.totalVolume.toString(),
      totalSwaps: group.totalSwaps,
      totalPnlUsd: group.totalPnlUsd.toString(),
      totalPnlPercent: group.totalPnlPercent.toString(),
      memberCount: group._count.members,
      avgSwapSize:
        group.totalSwaps > 0
          ? group.totalVolume.dividedBy(group.totalSwaps).toString()
          : "0",
    }));
  }

  /**
   * Get leaderboard for members within a specific group
   */
  async getGroupMemberLeaderboard(
    groupId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<GroupMemberLeaderboardEntry[]> {
    // Derive per-user stats within the group from swaps
    const userAgg = await prisma.swap.groupBy({
      by: ["userAddress"],
      where: { groupId, status: "COMPLETED" },
      _sum: { fromAmountUsd: true, pnlUsd: true },
      _count: { _all: true },
    });

    // Sort by volume desc, apply pagination
    const sorted = userAgg
      .map((u) => ({
        address: u.userAddress,
        volumeInGroup: u._sum.fromAmountUsd ?? new Decimal(0),
        swapsInGroup: u._count._all,
        pnlInGroupUsd: u._sum.pnlUsd ?? new Decimal(0),
      }))
      .sort((a, b) => b.volumeInGroup.minus(a.volumeInGroup).toNumber())
      .slice(offset, offset + limit);

    // Fetch usernames for the page
    const addresses = sorted.map((s) => s.address);
    const users = await prisma.user.findMany({
      where: { address: { in: addresses } },
      select: { address: true, username: true },
    });
    const userMap = new Map(users.map((u) => [u.address, u.username] as const));

    return sorted.map((entry, index) => ({
      rank: offset + index + 1,
      address: entry.address,
      username: userMap.get(entry.address) ?? null,
      volumeInGroup: entry.volumeInGroup.toString(),
      swapsInGroup: entry.swapsInGroup,
      pnlInGroupUsd: entry.pnlInGroupUsd.toString(),
    }));
  }

  /**
   * Get user statistics
   */
  async getUserStats(address: string) {
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        swaps: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        groups: true,
      },
    });

    if (!user) {
      return null;
    }

    // Calculate user rank
    const userRank =
      (await prisma.user.count({
        where: {
          totalVolume: { gt: user.totalVolume },
        },
      })) + 1;

    // Get best and worst swaps
    const swaps = await prisma.swap.findMany({
      where: {
        userAddress: address,
        status: "COMPLETED",
      },
      orderBy: { pnlPercent: "desc" },
    });

    const bestSwap = swaps[0];
    const worstSwap = swaps[swaps.length - 1];

    return {
      user: {
        ...user,
        totalVolume: user.totalVolume.toString(),
        totalPnlUsd: user.totalPnlUsd.toString(),
        totalPnlPercent: user.totalPnlPercent.toString(),
      },
      rank: userRank,
      recentSwaps: user.swaps.map((swap) => ({
        ...swap,
        fromAmount: swap.fromAmount.toString(),
        toAmount: swap.toAmount.toString(),
        fromAmountUsd: swap.fromAmountUsd.toString(),
        toAmountUsd: swap.toAmountUsd.toString(),
        currentValueUsd: swap.currentValueUsd.toString(),
        pnlUsd: swap.pnlUsd.toString(),
        pnlPercent: swap.pnlPercent.toString(),
      })),
      bestSwap: bestSwap
        ? {
            ...bestSwap,
            pnlUsd: bestSwap.pnlUsd.toString(),
            pnlPercent: bestSwap.pnlPercent.toString(),
          }
        : null,
      worstSwap: worstSwap
        ? {
            ...worstSwap,
            pnlUsd: worstSwap.pnlUsd.toString(),
            pnlPercent: worstSwap.pnlPercent.toString(),
          }
        : null,
      groups: user.groups,
    };
  }

  /**
   * Get group statistics
   */
  async getGroupStats(groupId: string) {
    const group = await prisma.group.findUnique({
      where: { groupId },
      include: {
        swaps: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      return null;
    }

    // Calculate group rank
    const groupRank =
      (await prisma.group.count({
        where: {
          totalVolume: { gt: group.totalVolume },
        },
      })) + 1;

    // Get time series data for charts
    const dailyVolume = await this.getGroupDailyVolume(groupId, 30);

    return {
      group: {
        ...group,
        totalVolume: group.totalVolume.toString(),
        totalPnlUsd: group.totalPnlUsd.toString(),
        totalPnlPercent: group.totalPnlPercent.toString(),
      },
      rank: groupRank,
      memberCount: group._count.members,
      topMembers: await (async () => {
        const leaderboard = await this.getGroupMemberLeaderboard(
          groupId,
          10,
          0,
        );
        return leaderboard.map((m) => ({
          address: m.address,
          username: m.username || null,
          avatarUrl: null,
          volumeInGroup: m.volumeInGroup,
          swapsInGroup: m.swapsInGroup,
          pnlInGroupUsd: m.pnlInGroupUsd,
        }));
      })(),
      recentSwaps: group.swaps.map((swap) => ({
        ...swap,
        fromAmount: swap.fromAmount.toString(),
        toAmount: swap.toAmount.toString(),
        fromAmountUsd: swap.fromAmountUsd.toString(),
        toAmountUsd: swap.toAmountUsd.toString(),
        currentValueUsd: swap.currentValueUsd.toString(),
        pnlUsd: swap.pnlUsd.toString(),
        pnlPercent: swap.pnlPercent.toString(),
        username: swap.user.username,
      })),
      dailyVolume,
    };
  }

  /**
   * Get daily volume for a group
   */
  private async getGroupDailyVolume(groupId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const swaps = await prisma.swap.findMany({
      where: {
        groupId,
        createdAt: { gte: startDate },
      },
      select: {
        fromAmountUsd: true,
        createdAt: true,
      },
    });

    // Group by day
    const volumeByDay = new Map<string, Decimal>();

    swaps.forEach((swap) => {
      const day = swap.createdAt.toISOString().split("T")[0];
      const current = volumeByDay.get(day) || new Decimal(0);
      volumeByDay.set(day, current.plus(swap.fromAmountUsd));
    });

    // Convert to array and fill missing days
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const volume = volumeByDay.get(dateStr) || new Decimal(0);
      result.unshift({
        date: dateStr,
        volume: volume.toString(),
      });
    }

    return result;
  }

  /**
   * Get global statistics
   */
  async getGlobalStats() {
    const [totalUsers, totalGroups, totalSwaps] = await Promise.all([
      prisma.user.count(),
      prisma.group.count({ where: { isActive: true } }),
      prisma.swap.count({ where: { status: "COMPLETED" } }),
    ]);

    const volumeResult = await prisma.swap.aggregate({
      where: { status: "COMPLETED" },
      _sum: {
        fromAmountUsd: true,
        pnlUsd: true,
      },
    });

    return {
      totalUsers,
      totalGroups,
      totalSwaps,
      totalVolume: volumeResult._sum.fromAmountUsd?.toString() || "0",
      totalPnl: volumeResult._sum.pnlUsd?.toString() || "0",
    };
  }

  private getOrderByField(
    sortBy: LeaderboardSortBy,
    _type: "user" | "group",
  ): string {
    switch (sortBy) {
      case "volume":
        return "totalVolume";
      case "pnl":
        return "totalPnlUsd";
      case "pnlPercent":
        return "totalPnlPercent";
      case "swaps":
        return "totalSwaps";
      default:
        return "totalVolume";
    }
  }
}

export const leaderboardService = new LeaderboardService();
