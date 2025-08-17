import { NextRequest, NextResponse } from "next/server";

// Token price service - in production, this would fetch from CoinGecko or another price API
const TOKEN_PRICES: Record<string, { symbol: string; price: number }> = {
  "0x0000000000000000000000000000000000000000": { symbol: "ETH", price: 3500 },
  "0x4200000000000000000000000000000000000006": { symbol: "WETH", price: 3500 },
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": { symbol: "USDC", price: 1 },
  "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": { symbol: "DAI", price: 1 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const addresses = body.addresses as string[];

    const prices: Record<string, number> = {};

    addresses.forEach((address) => {
      const tokenInfo = TOKEN_PRICES[address.toLowerCase()];
      if (tokenInfo) {
        prices[address] = tokenInfo.price;
      }
    });

    return NextResponse.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    console.error("Error fetching token prices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch token prices" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get("address");

    if (!tokenAddress) {
      return NextResponse.json(
        { success: false, error: "Token address required" },
        { status: 400 },
      );
    }

    const tokenInfo = TOKEN_PRICES[tokenAddress.toLowerCase()];

    if (!tokenInfo) {
      return NextResponse.json(
        { success: false, error: "Token not supported" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { price: tokenInfo.price },
    });
  } catch (error) {
    console.error("Error fetching token price:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch token price" },
      { status: 500 },
    );
  }
}
