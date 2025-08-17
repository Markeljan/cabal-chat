"use client";

import {
  Activity,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { leaderboardAPI } from "@/lib/api/leaderboard";
import { formatAddress } from "@/lib/utils";

interface UserProfileProps {
  address: string;
}

export function UserProfile({ address }: UserProfileProps) {
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      setLoading(true);
      try {
        const stats = await leaderboardAPI.getUserStats(address);
        setUserStats(stats);
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

  const formatPercent = (value: string): string => {
    const num = parseFloat(value);
    return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const getPnlColor = (value: string): string => {
    const num = parseFloat(value);
    return num >= 0 ? "text-green-500" : "text-red-500";
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

  const { user, rank, recentSwaps, bestSwap, worstSwap, groups } = userStats;

  return (
    <div className="space-y-6">
      {/* User Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <CardTitle className="text-2xl">
                  {user.username || formatAddress(address)}
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
                  {formatUSD(user.totalVolume)}
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
                <p className="text-xl font-bold">{user.totalSwaps}</p>
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
                  className={`text-xl font-bold ${getPnlColor(user.totalPnlUsd)}`}
                >
                  {formatUSD(user.totalPnlUsd)}
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
                  className={`text-xl font-bold ${getPnlColor(user.totalPnlPercent)}`}
                >
                  {formatPercent(user.totalPnlPercent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best and Worst Swaps */}
      {(bestSwap || worstSwap) && (
        <div className="grid md:grid-cols-2 gap-4">
          {bestSwap && (
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
                    <span>{bestSwap.fromToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span>{bestSwap.toToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PNL</span>
                    <span className="text-green-500 font-bold">
                      {formatUSD(bestSwap.pnlUsd)} (
                      {formatPercent(bestSwap.pnlPercent)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {worstSwap && (
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
                    <span>{worstSwap.fromToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span>{worstSwap.toToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PNL</span>
                    <span className="text-red-500 font-bold">
                      {formatUSD(worstSwap.pnlUsd)} (
                      {formatPercent(worstSwap.pnlPercent)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Swaps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Swaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSwaps.map((swap: any) => (
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
                  <p className="font-medium">{formatUSD(swap.fromAmountUsd)}</p>
                  <p className={`text-sm ${getPnlColor(swap.pnlUsd)}`}>
                    {formatUSD(swap.pnlUsd)} ({formatPercent(swap.pnlPercent)})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Groups */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groups.map((group: any) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {group.imageUrl && (
                      <img
                        src={group.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {group.swapsInGroup} swaps
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatUSD(group.volumeInGroup)}
                    </p>
                    <p
                      className={`text-sm ${getPnlColor(group.pnlInGroupUsd)}`}
                    >
                      PNL: {formatUSD(group.pnlInGroupUsd)}
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
