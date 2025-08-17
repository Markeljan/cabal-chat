import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const userAddress = address.toLowerCase();

    const swaps = await prisma.swap.findMany({
      where: {
        userAddress: {
          equals: userAddress,
          mode: "insensitive",
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      swaps: swaps.map((swap) => ({
        ...swap,
        fromAmount: swap.fromAmount.toString(),
        toAmount: swap.toAmount.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching user swaps:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user swaps" },
      { status: 500 },
    );
  }
}
