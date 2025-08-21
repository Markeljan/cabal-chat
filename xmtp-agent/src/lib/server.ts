import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { GroupService } from "@/lib/group-service";
import { createLeaderboardRoutes } from "@/lib/leaderboard-routes";
import type { XMTPHandler } from "@/lib/xmtp";
export function createServer(xmtpHandler: XMTPHandler) {
  const groupService = new GroupService(xmtpHandler.getClient());

  const app = new Elysia()
    .use(cors())
    .use(createLeaderboardRoutes())
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
        console.log("LOOKING FOR GROUP", params.groupId);
        const group = await groupService.getGroupDetails(params.groupId);
        if (!group) {
          throw new Error("Group not found");
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
        const isMember =
          group.createdBy === params.address
            ? true
            : !!(await groupService.getGroupMember(
                group.groupId,
                params.address,
              ));
        return { success: true, member: { isActive: isMember } };
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
