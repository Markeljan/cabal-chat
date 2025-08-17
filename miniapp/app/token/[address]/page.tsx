import { Metadata } from "next";
import TokenPageClient from "./token-client";

async function fetchTokenData(address: string) {
  try {
    const response = await fetch(
      `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}`,
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "content-type": "application/json",
          "onchainkit-context": "api",
          "onchainkit-version": "0.38.19",
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "cdp_listSwapAssets",
          params: [
            {
              limit: "1",
              page: "1",
              search: address,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.result && data.result.length > 0) {
      const token = data.result[0];
      return {
        name: token.name,
        symbol: token.symbol,
        image: token.image,
        chainId: token.chainId,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching token data:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const tokenData = await fetchTokenData(address);
  console.log(tokenData);
  // Create dynamic image URL with token data
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const imageParams = new URLSearchParams({
    address: address,
    ...(tokenData?.name && { name: tokenData.name }),
    ...(tokenData?.symbol && { symbol: tokenData.symbol }),
    ...(tokenData?.image && { image: tokenData.image }),
  });

  const dynamicImageUrl = `${baseUrl}/api/token-image?${imageParams.toString()}`;

  const miniapp = {
    version: "1",
    imageUrl: dynamicImageUrl,
    button: {
      title: `Buy ${tokenData?.symbol || "Buy Token"}`,
      action: {
        type: "launch_miniapp",
        name: tokenData?.name || "Token",
        url: `${baseUrl}/token/${address}`,
        splashImageUrl: tokenData?.image || `${baseUrl}/logo.png`,
        splashBackgroundColor: "#f5f0ec",
      },
    },
  };

  return {
    title: tokenData?.name
      ? `${tokenData.name} (${tokenData.symbol})`
      : `Token ${address}`,
    description: tokenData?.name
      ? `View and trade ${tokenData.name} (${tokenData.symbol}) on chain ${tokenData.chainId}`
      : `View token details for ${address}`,
    other: {
      "fc:miniapp": JSON.stringify(miniapp),
    },
  };
}

export default function TokenPage() {
  return <TokenPageClient />;
}
