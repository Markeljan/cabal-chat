import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const swap = await prisma.swap.findUnique({
      where: { id: params.id },
    });

    if (!swap) {
      return NextResponse.json(
        { success: false, error: "Swap not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      swap: {
        ...swap,
        fromAmount: swap.fromAmount.toString(),
        toAmount: swap.toAmount.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching swap:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch swap" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.txHash) updateData.txHash = body.txHash;
    if (body.completedAt) updateData.completedAt = new Date(body.completedAt);
    if (body.pnl !== undefined) updateData.pnl = body.pnl;
    if (body.pnlPercentage !== undefined)
      updateData.pnlPercentage = body.pnlPercentage;
    if (body.currentValueUsd !== undefined)
      updateData.currentValueUsd = body.currentValueUsd;

    const swap = await prisma.swap.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      swap: {
        ...swap,
        fromAmount: swap.fromAmount.toString(),
        toAmount: swap.toAmount.toString(),
      },
    });
  } catch (error) {
    console.error("Error updating swap:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update swap" },
      { status: 500 },
    );
  }
}
