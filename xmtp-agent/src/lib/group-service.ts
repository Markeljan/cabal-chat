import { Group, GroupPermissionsOptions, IdentifierKind } from "@xmtp/node-sdk";
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
    const createdGroups = await this.db.getGroupsByCreator(userAddress);
    const joinedGroups = await this.db.getUserJoinedGroups(userAddress);

    const allGroups = [...createdGroups, ...joinedGroups];
    const uniqueGroups = allGroups.filter(
      (group, index, self) =>
        index === self.findIndex((g) => g.id === group.id),
    );

    return uniqueGroups;
  }

  async getAllGroups() {
    return await this.db.getAllActiveGroups();
  }

  async joinGroup(groupId: string, userWallet: string) {
    try {
      await this.xmtpClient.conversations.sync();

      const inboxId = await this.xmtpClient.getInboxIdByIdentifier({
        identifier: userWallet,
        identifierKind: IdentifierKind.Ethereum,
      });

      if (!inboxId) {
        throw new Error(`Invalid or unregistered address: ${userWallet}`);
      }

      const conversation =
        await this.xmtpClient.conversations.getConversationById(groupId);
      if (!conversation) {
        throw new Error(`Group not found: ${groupId}`);
      }

      if (!(conversation instanceof Group)) {
        throw new Error(`Conversation is not a group: ${groupId}`);
      }

      await conversation.addMembers([inboxId]);

      await this.db.addGroupMember(groupId, userWallet);

      return {
        success: true,
        message: `Successfully added ${userWallet} to the group`,
      };
    } catch (error) {
      console.error("Error joining group:", error);
      throw new Error(
        `Failed to join group: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getGroupMember(groupId: string, address: string) {
    const member = await this.db.getGroupMember(groupId, address);
    console.log(member);
    return member;
  }

  async getGroupMembers(groupId: string) {
    return await this.db.getGroupMembers(groupId);
  }
}
