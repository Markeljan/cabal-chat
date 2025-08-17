"use client";

import {
  Activity,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dbAdapter, type Swap, type UserStats } from "@/lib/db-adapter";
import { formatAddress } from "@/lib/utils";

interface UserProfileProps {
  address: string;
}

export function UserProfile({ address }: UserProfileProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentSwaps, setRecentSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      setLoading(true);
      try {
        const [statsResponse, swapsResponse] = await Promise.all([
          dbAdapter.getUserStats(address),
          dbAdapter.getUserSwaps(address, 10, 0),
        ]);

        if (statsResponse.success && statsResponse.stats) {
          setUserStats(statsResponse.stats);
        }

        if (swapsResponse.success && swapsResponse.swaps) {
          setRecentSwaps(swapsResponse.swaps);
        }
      } catch (error) {
        console.error("Failed to load user stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserStats();
  }, [address]);

  const formatUSD = (value: string): string => {
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getPnlColor = (value: number): string => {
    return value >= 0 ? "text-green-500" : "text-red-500";
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading user profile...</div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">User not found</div>
      </div>
    );
  }

  // Calculate rank from leaderboard position (can be fetched separately if needed)
  const rank = 1; // Default rank, should be fetched from leaderboard API

  return (
    <div className="space-y-6">
      {/* User Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="text-2xl">
                  {formatAddress(address)}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Trophy className="w-4 h-4" />
                  Rank #{rank}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-xl font-bold">
                  {formatUSD(userStats.totalVolume.toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Swaps</p>
                <p className="text-xl font-bold">{userStats.totalSwaps}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total PNL</p>
                <p
                  className={`text-xl font-bold ${getPnlColor(userStats.totalPnl)}`}
                >
                  {formatUSD(userStats.totalPnl.toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">PNL %</p>
                <p
                  className={`text-xl font-bold ${getPnlColor(userStats.avgPnlPercentage)}`}
                >
                  {formatPercent(userStats.avgPnlPercentage)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best and Worst Swaps */}
      {(userStats.bestSwap || userStats.worstSwap) && (
        <div className="grid md:grid-cols-2 gap-4">
          {userStats.bestSwap && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Best Swap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span>{userStats.bestSwap.fromToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span>{userStats.bestSwap.toToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PNL</span>
                    <span className="text-green-500 font-bold">
                      {formatUSD((userStats.bestSwap.pnl || 0).toString())} (
                      {formatPercent(userStats.bestSwap.pnlPercentage || 0)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {userStats.worstSwap && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Worst Swap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span>{userStats.worstSwap.fromToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span>{userStats.worstSwap.toToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PNL</span>
                    <span className="text-red-500 font-bold">
                      {formatUSD((userStats.worstSwap.pnl || 0).toString())} (
                      {formatPercent(userStats.worstSwap.pnlPercentage || 0)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Swaps */}
      {recentSwaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Swaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSwaps.map((swap) => (
                <div
                  key={swap.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {swap.fromToken} → {swap.toToken}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(swap.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatUSD(swap.fromAmountUsd.toString())}
                    </p>
                    <p className={`text-sm ${getPnlColor(swap.pnl || 0)}`}>
                      {formatUSD((swap.pnl || 0).toString())} (
                      {formatPercent(swap.pnlPercentage || 0)})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Favorite Tokens */}
      {userStats.favoriteTokens && userStats.favoriteTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Favorite Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats.favoriteTokens.map((token) => (
                <div
                  key={token.token}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{token.token}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {token.count} trades
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
