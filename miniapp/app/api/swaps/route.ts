import { type NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.userAddress ||
      !body.fromToken ||
      !body.toToken ||
      !body.fromAmount ||
      !body.toAmount
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const swap = await prisma.swap.create({
      data: {
        userAddress: body.userAddress.toLowerCase(),
        groupId: body.groupId,
        fromToken: body.fromToken,
        toToken: body.toToken,
        fromAmount: body.fromAmount,
        toAmount: body.toAmount,
        fromAmountUsd: body.fromAmountUsd || 0,
        toAmountUsd: body.toAmountUsd || 0,
        status: body.status || "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      swap: {
        ...swap,
        fromAmount: swap.fromAmount.toString(),
        toAmount: swap.toAmount.toString(),
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Failed to create swap" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);
    const offset = parseInt(searchParams.get("offset") || "0");

    const swaps = await prisma.swap.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      swaps: swaps.map((swap) => ({
        id: swap.id,
        userAddress: swap.userAddress,
        groupId: swap.groupId ?? undefined,
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        fromAmount: swap.fromAmount.toString(),
        toAmount: swap.toAmount.toString(),
        fromAmountUsd: Number(swap.fromAmountUsd),
        toAmountUsd: Number(swap.toAmountUsd),
        txHash: swap.txHash ?? undefined,
        status: swap.status as "PENDING" | "COMPLETED" | "FAILED",
        createdAt: swap.createdAt.toISOString(),
        completedAt: swap.completedAt?.toISOString(),
        pnl: Number(swap.pnlUsd),
        pnlPercentage: Number(swap.pnlPercent),
      })),
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Failed to get swaps" },
      { status: 500 },
    );
  }
}
