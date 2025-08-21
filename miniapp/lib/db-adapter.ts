const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.cabalchat.xyz";

export interface CreateGroupRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  members?: number;
  performance?: number;
}

export interface Swap {
  id: string;
  userAddress: string;
  groupId?: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromAmountUsd: number;
  toAmountUsd: number;
  txHash?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  completedAt?: string;
  pnl?: number;
  pnlPercentage?: number;
}

export interface UserStats {
  address: string;
  totalSwaps: number;
  totalVolume: number;
  totalPnl: number;
  avgPnlPercentage: number;
  successRate: number;
  bestSwap?: Swap;
  worstSwap?: Swap;
  favoriteTokens: Array<{ token: string; count: number }>;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  totalSwaps: number;
  totalVolume: number;
  totalPnl: number;
  avgPnlPercentage: number;
  winRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GroupsResponse extends ApiResponse<Group[]> {
  groups: Group[];
}

export interface GroupResponse extends ApiResponse<Group> {
  group: Group;
}

export interface SwapResponse extends ApiResponse<Swap> {
  swap: Swap;
}

export interface SwapsResponse extends ApiResponse<Swap[]> {
  swaps: Swap[];
}

export interface StatsResponse extends ApiResponse<UserStats> {
  stats: UserStats;
}

export interface LeaderboardResponse extends ApiResponse<LeaderboardEntry[]> {
  leaderboard: LeaderboardEntry[];
}

class DatabaseAdapter {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // Group operations

  async createGroup(groupData: CreateGroupRequest): Promise<GroupResponse> {
    return this.request<Group>("/groups/create", {
      method: "POST",
      body: JSON.stringify(groupData),
    }) as Promise<GroupResponse>;
  }

  async getAllGroups(): Promise<GroupsResponse> {
    return this.request<Group[]>("/groups") as Promise<GroupsResponse>;
  }

  async getGroupDetails(groupId: string): Promise<GroupResponse> {
    return this.request<Group>(`/groups/${groupId}`) as Promise<GroupResponse>;
  }

  async getUserGroups(address: string): Promise<GroupsResponse> {
    return this.request<Group[]>(
      `/users/${address}/groups`,
    ) as Promise<GroupsResponse>;
  }

  async joinGroup(
    groupId: string,
    userWallet: string,
  ): Promise<ApiResponse<null>> {
    return this.request<null>(`/groups/${groupId}/join`, {
      method: "POST",
      body: JSON.stringify({ userWallet }),
    });
  }

  async checkMembership(
    groupId: string,
    userWallet: string,
  ): Promise<{ success: boolean; member?: { isActive: boolean } }> {
    return this.request<{ member: { isActive: boolean } }>(
      `/groups/${groupId}/members/${userWallet}`,
    ) as Promise<{ success: boolean; member?: { isActive: boolean } }>;
  }

  // Swap operations
  async recordSwap(
    swap: Omit<Swap, "id" | "createdAt">,
  ): Promise<SwapResponse> {
    return this.request<Swap>("/swaps", {
      method: "POST",
      body: JSON.stringify(swap),
    }) as Promise<SwapResponse>;
  }

  async updateSwap(
    swapId: string,
    update: Partial<Swap>,
  ): Promise<SwapResponse> {
    return this.request<Swap>(`/swaps/${swapId}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    }) as Promise<SwapResponse>;
  }

  async getSwap(swapId: string): Promise<SwapResponse> {
    return this.request<Swap>(`/swaps/${swapId}`) as Promise<SwapResponse>;
  }

  async getUserSwaps(
    address: string,
    limit?: number,
    offset?: number,
  ): Promise<SwapsResponse> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    return this.request<Swap[]>(
      `/users/${address}/swaps?${params}`,
    ) as Promise<SwapsResponse>;
  }

  async getGroupSwaps(
    groupId: string,
    limit?: number,
    offset?: number,
  ): Promise<SwapsResponse> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    return this.request<Swap[]>(
      `/groups/${groupId}/swaps?${params}`,
    ) as Promise<SwapsResponse>;
  }

  // Stats and leaderboard operations
  async getUserStats(address: string): Promise<StatsResponse> {
    return this.request<UserStats>(
      `/users/${address}/stats`,
    ) as Promise<StatsResponse>;
  }

  async getLeaderboard(
    period: "all" | "daily" | "weekly" | "monthly" = "all",
    metric: "volume" | "pnl" | "swaps" = "pnl",
    limit: number = 100,
  ): Promise<LeaderboardResponse> {
    const params = new URLSearchParams({
      period,
      metric,
      limit: limit.toString(),
    });
    return this.request<LeaderboardEntry[]>(
      `/leaderboard?${params}`,
    ) as Promise<LeaderboardResponse>;
  }

  async getGroupLeaderboard(
    groupId: string,
    period: "all" | "daily" | "weekly" | "monthly" = "all",
    metric: "volume" | "pnl" | "swaps" = "pnl",
    limit: number = 100,
  ): Promise<LeaderboardResponse> {
    const params = new URLSearchParams({
      period,
      metric,
      limit: limit.toString(),
    });
    return this.request<LeaderboardEntry[]>(
      `/groups/${groupId}/leaderboard?${params}`,
    ) as Promise<LeaderboardResponse>;
  }

  // Token price operations
  async getTokenPrice(
    tokenAddress: string,
  ): Promise<ApiResponse<{ price: number }>> {
    return this.request<{ price: number }>(`/tokens/${tokenAddress}/price`);
  }

  async getTokenPrices(
    tokenAddresses: string[],
  ): Promise<ApiResponse<Record<string, number>>> {
    return this.request<Record<string, number>>("/tokens/prices", {
      method: "POST",
      body: JSON.stringify({ addresses: tokenAddresses }),
    });
  }
}

export const dbAdapter = new DatabaseAdapter();
