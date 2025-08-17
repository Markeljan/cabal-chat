import { useState, useEffect } from 'react';
import { getTokens } from '@coinbase/onchainkit/api';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image: string;
  chainId: number;
}

interface UseTokenDataResult {
  data: TokenData | null;
  isLoading: boolean;
  error: string | null;
}

export function useTokenData(tokenAddress: string): UseTokenDataResult {
  const [data, setData] = useState<TokenData | null>(null);
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
          limit: '1', 
          search: tokenAddress 
        });

        if (result && result.length > 0) {
          setData(result[0]);
        } else {
          setError('Token not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch token data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress]);

  return { data, isLoading, error };
}