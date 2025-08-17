const API_BASE_URL = "https://api.cabalchat.xyz";

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

class GroupApiService {
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
  ): Promise<ApiResponse<{ isMember: boolean }>> {
    return this.request<{ isMember: boolean }>(
      `/groups/${groupId}/members/${userWallet}`,
    );
  }
}

export const groupApi = new GroupApiService();
