import { GroupPermissionsOptions, IdentifierKind } from "@xmtp/node-sdk";
import type { XMTPClient } from "@/helpers/get-client";
import { type CreateGroupData, DatabaseService } from "@/lib/database";

export class GroupService {
  private db: DatabaseService;
  private xmtpClient: XMTPClient;

  constructor(xmtpClient: XMTPClient) {
    this.db = new DatabaseService();
    this.xmtpClient = xmtpClient;
  }

  async createGroupWithAgent(data: CreateGroupData) {
    try {
      try {
        await this.xmtpClient.conversations.sync();
      } catch (syncError) {
        console.log("Sync completed with messages:", syncError);
      }

      const inboxId = await this.xmtpClient.getInboxIdByIdentifier({
        identifier: data.createdBy,
        identifierKind: IdentifierKind.Ethereum,
      });

      if (!inboxId)
        throw new Error(`Invalid or unregistered address: ${data.createdBy}`);

      const groupConversation = await this.xmtpClient.conversations.newGroup(
        [inboxId],
        {
          permissions: GroupPermissionsOptions.AdminOnly,
          groupName: data.name,
          groupImageUrlSquare: data.imageUrl,
          groupDescription: data.description,
        },
      );

      const savedGroup = await this.db.createGroup(groupConversation.id, data);
      await groupConversation.send(
        `Welcome to ${data.name}! This group has been created with an AI agent. You can interact with the agent by sending messages here.`,
      );

      return {
        success: true,
        group: savedGroup,
        xmtpGroupId: groupConversation.id,
        message: "Group created successfully with agent",
      };
    } catch (error) {
      console.error("Error creating group:", error);
      throw new Error(
        `Failed to create group: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getGroupDetails(groupId: string) {
    return await this.db.getGroupByGroupId(groupId);
  }

  async getUserGroups(userAddress: string) {
    return await this.db.getGroupsByCreator(userAddress);
  }

  async getAllGroups() {
    return await this.db.getAllActiveGroups();
  }
}
