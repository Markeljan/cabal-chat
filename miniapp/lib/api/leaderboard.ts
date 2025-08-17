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

export interface GlobalStats {
  totalUsers: number;
  totalGroups: number;
  totalSwaps: number;
  totalVolume: string;
  totalPnl: string;
}

export type LeaderboardSortBy = "volume" | "pnl" | "pnlPercent" | "swaps";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class LeaderboardAPI {
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  async getUserLeaderboard(
    sortBy: LeaderboardSortBy = "volume",
    limit: number = 100,
    offset: number = 0,
  ): Promise<UserLeaderboardEntry[]> {
    const params = new URLSearchParams({
      sortBy,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.fetch<UserLeaderboardEntry[]>(
      `/api/leaderboard/users?${params}`,
    );
  }

  async getGroupLeaderboard(
    sortBy: LeaderboardSortBy = "volume",
    limit: number = 100,
    offset: number = 0,
  ): Promise<GroupLeaderboardEntry[]> {
    const params = new URLSearchParams({
      sortBy,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.fetch<GroupLeaderboardEntry[]>(
      `/api/leaderboard/groups?${params}`,
    );
  }

  async getGroupMemberLeaderboard(
    groupId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<GroupMemberLeaderboardEntry[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.fetch<GroupMemberLeaderboardEntry[]>(
      `/api/leaderboard/groups/${groupId}/members?${params}`,
    );
  }

  async getUserStats(address: string) {
    return this.fetch(`/api/stats/users/${address}`);
  }

  async getGroupStats(groupId: string) {
    return this.fetch(`/api/stats/groups/${groupId}`);
  }

  async getGlobalStats(): Promise<GlobalStats> {
    return this.fetch<GlobalStats>("/api/stats/global");
  }

  async recordSwap(swapData: {
    userAddress: string;
    groupId?: string;
    fromToken: string;
    toToken: string;
    fromAmount: string | number;
    toAmount: string | number;
    fromAmountUsd: string | number;
    toAmountUsd: string | number;
    txHash?: string;
  }) {
    return this.fetch("/api/swaps/record", {
      method: "POST",
      body: JSON.stringify(swapData),
    });
  }

  async completeSwap(swapId: string, txHash: string, currentValueUsd?: number) {
    return this.fetch("/api/swaps/complete", {
      method: "POST",
      body: JSON.stringify({ swapId, txHash, currentValueUsd }),
    });
  }
}

export const leaderboardAPI = new LeaderboardAPI();
