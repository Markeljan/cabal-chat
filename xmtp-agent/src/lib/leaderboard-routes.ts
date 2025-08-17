import { Elysia, t } from "elysia";
import { type LeaderboardSortBy, leaderboardService } from "./leaderboard";
import { swapTracker } from "./swap-tracker";

export function createLeaderboardRoutes() {
  const app = new Elysia({ prefix: "/api" })
    // User leaderboard endpoint
    .get(
      "/leaderboard/users",
      async ({ query }) => {
        try {
          const leaderboard = await leaderboardService.getUserLeaderboard(
            query.sortBy as LeaderboardSortBy,
            query.limit || 100,
            query.offset || 0,
          );
          return { success: true, data: leaderboard };
        } catch (error) {
          console.error("Error fetching user leaderboard:", error);
          throw new Error("Failed to fetch user leaderboard");
        }
      },
      {
        query: t.Object({
          sortBy: t.Optional(
            t.Union([
              t.Literal("volume"),
              t.Literal("pnl"),
              t.Literal("pnlPercent"),
              t.Literal("swaps"),
            ]),
          ),
          limit: t.Optional(t.Number({ min: 1, max: 500 })),
          offset: t.Optional(t.Number({ min: 0 })),
        }),
      },
    )
    // Group leaderboard endpoint
    .get(
      "/leaderboard/groups",
      async ({ query }) => {
        try {
          const leaderboard = await leaderboardService.getGroupLeaderboard(
            query.sortBy as LeaderboardSortBy,
            query.limit || 100,
            query.offset || 0,
          );
          return { success: true, data: leaderboard };
        } catch (error) {
          console.error("Error fetching group leaderboard:", error);
          throw new Error("Failed to fetch group leaderboard");
        }
      },
      {
        query: t.Object({
          sortBy: t.Optional(
            t.Union([
              t.Literal("volume"),
              t.Literal("pnl"),
              t.Literal("pnlPercent"),
              t.Literal("swaps"),
            ]),
          ),
          limit: t.Optional(t.Number({ min: 1, max: 500 })),
          offset: t.Optional(t.Number({ min: 0 })),
        }),
      },
    )
    // Group member leaderboard endpoint
    .get(
      "/leaderboard/groups/:groupId/members",
      async ({ params, query }) => {
        try {
          const leaderboard =
            await leaderboardService.getGroupMemberLeaderboard(
              params.groupId,
              query.limit || 50,
              query.offset || 0,
            );
          return { success: true, data: leaderboard };
        } catch (error) {
          console.error("Error fetching group member leaderboard:", error);
          throw new Error("Failed to fetch group member leaderboard");
        }
      },
      {
        params: t.Object({
          groupId: t.String(),
        }),
        query: t.Object({
          limit: t.Optional(t.Number({ min: 1, max: 200 })),
          offset: t.Optional(t.Number({ min: 0 })),
        }),
      },
    )
    // User stats endpoint
    .get(
      "/stats/users/:address",
      async ({ params }) => {
        try {
          const stats = await leaderboardService.getUserStats(params.address);
          if (!stats) {
            throw new Error("User not found");
          }
          return { success: true, data: stats };
        } catch (error) {
          console.error("Error fetching user stats:", error);
          throw new Error("Failed to fetch user stats");
        }
      },
      {
        params: t.Object({
          address: t.String({ pattern: "^0x[a-fA-F0-9]{40}$" }),
        }),
      },
    )
    // Group stats endpoint
    .get(
      "/stats/groups/:groupId",
      async ({ params }) => {
        try {
          const stats = await leaderboardService.getGroupStats(params.groupId);
          if (!stats) {
            throw new Error("Group not found");
          }
          return { success: true, data: stats };
        } catch (error) {
          console.error("Error fetching group stats:", error);
          throw new Error("Failed to fetch group stats");
        }
      },
      {
        params: t.Object({
          groupId: t.String(),
        }),
      },
    )
    // Global stats endpoint
    .get("/stats/global", async () => {
      try {
        const stats = await leaderboardService.getGlobalStats();
        return { success: true, data: stats };
      } catch (error) {
        console.error("Error fetching global stats:", error);
        throw new Error("Failed to fetch global stats");
      }
    })
    // Record swap endpoint
    .post(
      "/swaps/record",
      async ({ body }) => {
        try {
          const swap = await swapTracker.recordSwap(body);
          return { success: true, data: swap };
        } catch (error) {
          console.error("Error recording swap:", error);
          throw new Error("Failed to record swap");
        }
      },
      {
        body: t.Object({
          userAddress: t.String({ pattern: "^0x[a-fA-F0-9]{40}$" }),
          groupId: t.Optional(t.String()),
          fromToken: t.String(),
          toToken: t.String(),
          fromAmount: t.Union([t.String(), t.Number()]),
          toAmount: t.Union([t.String(), t.Number()]),
          fromAmountUsd: t.Union([t.String(), t.Number()]),
          toAmountUsd: t.Union([t.String(), t.Number()]),
          txHash: t.Optional(t.String()),
          gasUsed: t.Optional(t.Union([t.String(), t.Number()])),
          gasPrice: t.Optional(t.Union([t.String(), t.Number()])),
        }),
      },
    )
    // Complete swap endpoint
    .post(
      "/swaps/complete",
      async ({ body }) => {
        try {
          const swap = await swapTracker.completeSwap(
            body.swapId,
            body.txHash,
            body.currentValueUsd,
          );
          return { success: true, data: swap };
        } catch (error) {
          console.error("Error completing swap:", error);
          throw new Error("Failed to complete swap");
        }
      },
      {
        body: t.Object({
          swapId: t.String(),
          txHash: t.String(),
          currentValueUsd: t.Optional(t.Number()),
        }),
      },
    )
    // Update all PNL based on current prices
    .post(
      "/swaps/update-pnl",
      async ({ body }) => {
        try {
          const priceMap = new Map(Object.entries(body.prices));
          await swapTracker.updateAllPnl(priceMap);
          return { success: true, message: "PNL updated successfully" };
        } catch (error) {
          console.error("Error updating PNL:", error);
          throw new Error("Failed to update PNL");
        }
      },
      {
        body: t.Object({
          prices: t.Record(t.String(), t.Number()),
        }),
      },
    );

  return app;
}
