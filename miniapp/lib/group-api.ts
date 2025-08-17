const API_BASE_URL = "http://localhost:3131";

export interface CreateGroupRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  performance?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  groups?: T[];
  group?: T;
  error?: string;
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

  async createGroup(
    groupData: CreateGroupRequest,
  ): Promise<ApiResponse<Group>> {
    return this.request<Group>("/groups/create", {
      method: "POST",
      body: JSON.stringify(groupData),
    });
  }

  async getAllGroups(): Promise<ApiResponse<Group[]>> {
    return this.request<Group[]>("/groups");
  }

  async getGroupDetails(groupId: string): Promise<ApiResponse<Group>> {
    return this.request<Group>(`/groups/${groupId}`);
  }

  async getUserGroups(address: string): Promise<ApiResponse<Group[]>> {
    return this.request<Group[]>(`/users/${address}/groups`);
  }
}

export const groupApi = new GroupApiService();
