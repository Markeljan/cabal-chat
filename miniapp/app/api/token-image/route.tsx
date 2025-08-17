import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function generateChartPath(prices: number[], width: number, height: number) {
  if (prices.length < 2) return { linePath: "", fillPath: "" };

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 0.0001; // Avoid division by zero

  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * width;
    const y = height - ((price - minPrice) / priceRange) * height;
    return { x, y };
  });

  const linePath = `M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")}`;

  // Create filled area path
  const fillPath = `M 0 ${height} L ${points.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${width} ${height} Z`;

  return { linePath, fillPath };
}

async function fetchPriceData(address: string) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 24 * 60 * 60;

    const response = await fetch(
      "https://api.allium.so/api/v1/developer/prices/history",
      {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_ALLIUM_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time_granularity: "1h",
          addresses: [
            {
              token_address: address,
              chain: "base",
            },
          ],
          start_timestamp: dayAgo.toString(),
          end_timestamp: now.toString(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0 && data.items[0].prices) {
      return data.items[0].prices.map((p: any) => p.price);
    }

    // Fallback sample data
    return [
      0.0007039998017590778, 0.0007039998017590778, 0.0007046820287087733,
      0.0007037322374657553, 0.0007038812204784229, 0.0007040302034910905,
      0.0007041791865037582, 0.0007036766301729377, 0.0007050807552853928,
      0.0007051856478519364, 0.0007048508303367077, 0.0007045160128214791,
      0.0007140016519773691, 0.0007111205467146165, 0.0007122622618795604,
      0.0007060619129141058, 0.0007043137609994863, 0.000702565609084867,
      0.0007008174571702476, 0.0007114040295922176, 0.0007140408979218156,
      0.0007114510832412285, 0.0007112342409015396, 0.0007110173985618508,
    ];
  } catch (error) {
    console.error("Error fetching price data:", error);
    // Return fallback sample data
    return [
      0.0007039998017590778, 0.0007039998017590778, 0.0007046820287087733,
      0.0007037322374657553, 0.0007038812204784229, 0.0007040302034910905,
      0.0007041791865037582, 0.0007036766301729377, 0.0007050807552853928,
      0.0007051856478519364, 0.0007048508303367077, 0.0007045160128214791,
      0.0007140016519773691, 0.0007111205467146165, 0.0007122622618795604,
      0.0007060619129141058, 0.0007043137609994863, 0.000702565609084867,
      0.0007008174571702476, 0.0007114040295922176, 0.0007140408979218156,
      0.0007114510832412285, 0.0007112342409015396, 0.0007110173985618508,
    ];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const name = searchParams.get("name") || "Unknown Token";
    const symbol = searchParams.get("symbol") || "TOKEN";
    const image = searchParams.get("image");

    if (!address) {
      throw new Error("Address is required");
    }

    const prices = await fetchPriceData(address);
    const { linePath, fillPath } = generateChartPath(prices, 1200, 630);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;
    const isPositive = priceChange >= 0;

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#1a1a1a",
        }}
      >
        {/* Full-screen chart background */}
        <svg
          width="1200"
          height="630"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
          }}
        >
          <title>Chart</title>
          {/* Filled area */}
          <path
            d={fillPath}
            fill={
              isPositive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"
            }
          />
          {/* Chart line */}
          <path
            d={linePath}
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth="3"
            fill="none"
          />
        </svg>

        {/* Overlay content */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          {/* Token logo */}
          <div
            style={{
              marginBottom: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {image ? (
              <img
                src={image}
                alt={symbol}
                width="150"
                height="150"
                style={{
                  borderRadius: "75px",
                  border: "4px solid rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "75px",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "4px solid rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "64px",
                  color: "#666",
                  fontWeight: 700,
                }}
              >
                {symbol?.charAt(0) || "?"}
              </div>
            )}
          </div>

          {/* Token name */}
          <div
            style={{
              color: "white",
              marginBottom: 16,
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
              textShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            {name}
          </div>

          {/* Token symbol */}
          <div
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: 32,
              marginBottom: 30,
              display: "flex",
              justifyContent: "center",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
            }}
          >
            {symbol}
          </div>

          {/* Price info */}
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "24px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "white",
                marginBottom: 8,
                display: "flex",
              }}
            >
              ${currentPrice.toFixed(6)}
            </div>
            <div
              style={{
                fontSize: 24,
                color: isPositive ? "#22c55e" : "#ef4444",
                display: "flex",
                fontWeight: 600,
              }}
            >
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}% (24h)
            </div>
          </div>

          {/* Address */}
          {address && (
            <div
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: 18,
                fontFamily: "monospace",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: "12px 20px",
                borderRadius: "12px",
                marginTop: 24,
                display: "flex",
                justifyContent: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {address.slice(0, 10)}...{address.slice(-8)}
            </div>
          )}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate",
        },
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
