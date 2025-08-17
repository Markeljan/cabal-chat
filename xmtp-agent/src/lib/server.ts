import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { getXmtpClient } from "@/helpers/get-client";
import { GroupService } from "@/lib/group-service";
import type { XMTPHandler } from "@/lib/xmtp";
export function createServer(xmtpHandler: XMTPHandler) {
  const groupService = new GroupService(xmtpHandler.getClient());

  const app = new Elysia()
    .use(cors())
    .get("/test", () => "XMTP Agent Server")
    .get("/health", () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }))
    .get("/client", () => {
      const client = xmtpHandler.getClient();
      return {
        inboxId: client.inboxId,
        installationId: client.installationId,
        accountIdentifier: client.accountIdentifier?.identifier,
      };
    })
    .post(
      "/groups/create",
      async ({ body }) => {
        const result = await groupService.createGroupWithAgent(body);
        return result;
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1, maxLength: 100 }),
          description: t.Optional(t.String({ maxLength: 500 })),
          imageUrl: t.Optional(t.String({ maxLength: 2000 })),
          createdBy: t.String({ pattern: "^0x[a-fA-F0-9]{40}$" }),
          metadata: t.Optional(t.Record(t.String(), t.Any())),
        }),
      },
    )
    .get("/groups", async () => {
      const groups = await groupService.getAllGroups();
      return { success: true, groups };
    })
    .get(
      "/groups/:groupId",
      async ({ params }) => {
        const group = await groupService.getGroupDetails(params.groupId);
        if (!group) {
          throw new Error("Group not found");
        }

        const client = await getXmtpClient();
        const conversationById = await client.conversations.getConversationById(
          group.groupId,
        );

        if (conversationById) {
          const memberList = await conversationById.members();
          group.members = memberList.length || null;
        }

        return { success: true, group };
      },
      {
        params: t.Object({
          groupId: t.String(),
        }),
      },
    )
    .get(
      "/users/:address/groups",
      async ({ params }) => {
        const groups = await groupService.getUserGroups(params.address);
        return { success: true, groups };
      },
      {
        params: t.Object({
          address: t.String(),
        }),
      },
    )
    .get(
      "/groups/:groupId/members/:address",
      async ({ params }) => {
        const group = await groupService.getGroupDetails(params.groupId);
        if (!group) {
          throw new Error("Group not found");
        }
        if (group.createdBy === params.address) {
          return { success: true, member: { isActive: true } };
        }
        const member = await groupService.getGroupMember(
          group.groupId,
          params.address,
        );
        if (!member) {
          return {
            success: false,
            member: null,
            message: "Member not found in group",
          };
        }
        return { success: true, member };
      },
      {
        params: t.Object({
          groupId: t.String(),
          address: t.String({ pattern: "^0x[a-fA-F0-9]{40}$" }),
        }),
      },
    )
    .post(
      "/groups/:groupId/join",
      async ({ params, body }) => {
        const group = await groupService.getGroupDetails(params.groupId);
        if (!group) {
          throw new Error("Group not found");
        }
        const result = await groupService.joinGroup(
          group.groupId,
          body.userWallet,
        );
        return result;
      },
      {
        params: t.Object({
          groupId: t.String(),
        }),
        body: t.Object({
          userWallet: t.String({ pattern: "^0x[a-fA-F0-9]{40}$" }),
        }),
      },
    );

  return app;
}
