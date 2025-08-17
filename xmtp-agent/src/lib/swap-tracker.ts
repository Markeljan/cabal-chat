import type { Swap } from "@prisma/client";
import { PrismaClient, SwapStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

interface SwapData {
  userAddress: string;
  groupId?: string;
  fromToken: string;
  toToken: string;
  fromAmount: string | number;
  toAmount: string | number;
  fromAmountUsd: string | number;
  toAmountUsd: string | number;
  txHash?: string;
  gasUsed?: string | number;
  gasPrice?: string | number;
}

interface TokenPriceData {
  tokenAddress: string;
  symbol: string;
  priceUsd: number;
}

export class SwapTracker {
  /**
   * Record a new swap and update user/group statistics
   */
  async recordSwap(swapData: SwapData): Promise<Swap> {
    return await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const _user = await tx.user.upsert({
        where: { address: swapData.userAddress },
        update: {},
        create: {
          address: swapData.userAddress,
        },
      });

      // Create the swap record
      const swap = await tx.swap.create({
        data: {
          userAddress: swapData.userAddress,
          groupId: swapData.groupId,
          fromToken: swapData.fromToken,
          toToken: swapData.toToken,
          fromAmount: new Decimal(swapData.fromAmount),
          toAmount: new Decimal(swapData.toAmount),
          fromAmountUsd: new Decimal(swapData.fromAmountUsd),
          toAmountUsd: new Decimal(swapData.toAmountUsd),
          txHash: swapData.txHash,
          gasUsed: swapData.gasUsed ? new Decimal(swapData.gasUsed) : null,
          gasPrice: swapData.gasPrice ? new Decimal(swapData.gasPrice) : null,
          status: SwapStatus.PENDING,
        },
      });

      // Update user stats
      await tx.user.update({
        where: { address: swapData.userAddress },
        data: {
          totalVolume: {
            increment: new Decimal(swapData.fromAmountUsd),
          },
          totalSwaps: {
            increment: 1,
          },
        },
      });

      // Update group stats if applicable
      if (swapData.groupId) {
        await tx.group.update({
          where: { groupId: swapData.groupId },
          data: {
            totalVolume: {
              increment: new Decimal(swapData.fromAmountUsd),
            },
            totalSwaps: {
              increment: 1,
            },
          },
        });

        // Update group member stats
        await tx.groupMember.updateMany({
          where: {
            groupId: swapData.groupId,
            address: swapData.userAddress,
          },
          data: {
            volumeInGroup: {
              increment: new Decimal(swapData.fromAmountUsd),
            },
            swapsInGroup: {
              increment: 1,
            },
          },
        });
      }

      return swap;
    });
  }

  /**
   * Complete a swap and calculate initial PNL
   */
  async completeSwap(
    swapId: string,
    txHash: string,
    currentValueUsd?: number,
  ): Promise<Swap> {
    // First fetch the existing swap to get its values
    const existingSwap = await prisma.swap.findUnique({
      where: { id: swapId },
    });

    if (!existingSwap) {
      throw new Error(`Swap with id ${swapId} not found`);
    }

    // Now update the swap with new values
    const swap = await prisma.swap.update({
      where: { id: swapId },
      data: {
        status: SwapStatus.COMPLETED,
        completedAt: new Date(),
        txHash,
        ...(currentValueUsd && {
          currentValueUsd: new Decimal(currentValueUsd),
          pnlUsd: new Decimal(currentValueUsd).minus(existingSwap.toAmountUsd),
          pnlPercent: new Decimal(currentValueUsd)
            .minus(existingSwap.toAmountUsd)
            .dividedBy(existingSwap.toAmountUsd)
            .times(100),
        }),
      },
    });

    // Update PNL stats if we have current value
    if (currentValueUsd) {
      await this.updateUserPnl(swap.userAddress);
      if (swap.groupId) {
        await this.updateGroupPnl(swap.groupId);
      }
    }

    return swap;
  }

  /**
   * Update PNL for all swaps based on current token prices
   */
  async updateAllPnl(tokenPrices: Map<string, number>): Promise<void> {
    const swaps = await prisma.swap.findMany({
      where: { status: SwapStatus.COMPLETED },
    });

    for (const swap of swaps) {
      const currentPrice = tokenPrices.get(swap.toToken);
      if (currentPrice) {
        const currentValueUsd = swap.toAmount.times(currentPrice);
        const pnlUsd = currentValueUsd.minus(swap.toAmountUsd);
        const pnlPercent = pnlUsd.dividedBy(swap.toAmountUsd).times(100);

        await prisma.swap.update({
          where: { id: swap.id },
          data: {
            currentValueUsd,
            pnlUsd,
            pnlPercent,
          },
        });
      }
    }

    // Update all user and group PNL stats
    const users = await prisma.user.findMany();
    for (const user of users) {
      await this.updateUserPnl(user.address);
    }

    const groups = await prisma.group.findMany();
    for (const group of groups) {
      await this.updateGroupPnl(group.groupId);
    }
  }

  /**
   * Update user's total PNL
   */
  private async updateUserPnl(userAddress: string): Promise<void> {
    const swaps = await prisma.swap.findMany({
      where: {
        userAddress,
        status: SwapStatus.COMPLETED,
      },
    });

    const totalPnlUsd = swaps.reduce(
      (sum, swap) => sum.plus(swap.pnlUsd),
      new Decimal(0),
    );

    const totalInvested = swaps.reduce(
      (sum, swap) => sum.plus(swap.fromAmountUsd),
      new Decimal(0),
    );

    const totalPnlPercent = totalInvested.isZero()
      ? new Decimal(0)
      : totalPnlUsd.dividedBy(totalInvested).times(100);

    await prisma.user.update({
      where: { address: userAddress },
      data: {
        totalPnlUsd,
        totalPnlPercent,
      },
    });
  }

  /**
   * Update group's total PNL
   */
  private async updateGroupPnl(groupId: string): Promise<void> {
    const swaps = await prisma.swap.findMany({
      where: {
        groupId,
        status: SwapStatus.COMPLETED,
      },
    });

    const totalPnlUsd = swaps.reduce(
      (sum, swap) => sum.plus(swap.pnlUsd),
      new Decimal(0),
    );

    const totalInvested = swaps.reduce(
      (sum, swap) => sum.plus(swap.fromAmountUsd),
      new Decimal(0),
    );

    const totalPnlPercent = totalInvested.isZero()
      ? new Decimal(0)
      : totalPnlUsd.dividedBy(totalInvested).times(100);

    await prisma.group.update({
      where: { groupId },
      data: {
        totalPnlUsd,
        totalPnlPercent,
      },
    });

    // Update group member PNL
    const memberSwaps = await prisma.swap.groupBy({
      by: ["userAddress"],
      where: {
        groupId,
        status: SwapStatus.COMPLETED,
      },
      _sum: {
        pnlUsd: true,
      },
    });

    for (const memberSwap of memberSwaps) {
      if (memberSwap._sum.pnlUsd) {
        await prisma.groupMember.updateMany({
          where: {
            groupId,
            address: memberSwap.userAddress,
          },
          data: {
            pnlInGroupUsd: memberSwap._sum.pnlUsd,
          },
        });
      }
    }
  }

  /**
   * Store token price for historical tracking
   */
  async storeTokenPrice(priceData: TokenPriceData): Promise<void> {
    await prisma.tokenPrice.create({
      data: {
        tokenAddress: priceData.tokenAddress,
        symbol: priceData.symbol,
        priceUsd: new Decimal(priceData.priceUsd),
      },
    });
  }
}

export const swapTracker = new SwapTracker();
