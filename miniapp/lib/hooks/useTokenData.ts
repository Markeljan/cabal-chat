import { getTokens } from "@coinbase/onchainkit/api";
import type { Token } from "@coinbase/onchainkit/token";
import { useEffect, useState } from "react";

interface UseTokenDataResult {
  data: Token | null;
  isLoading: boolean;
  error: string | null;
}

export function useTokenData(tokenAddress: string): UseTokenDataResult {
  const [data, setData] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setIsLoading(false);
      return;
    }

    const fetchTokenData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getTokens({
          limit: "1",
          search: tokenAddress,
        });

        // if not array type, its error
        if (!Array.isArray(result)) {
          setError(result.message);
          return;
        }

        if (result && result.length > 0) {
          setData(result[0]);
        } else {
          setError("Token not found");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch token data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress]);

  return { data, isLoading, error };
}
