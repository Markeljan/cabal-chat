"use client";

import {
  Activity,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type GlobalStats,
  type GroupLeaderboardEntry,
  type LeaderboardSortBy,
  leaderboardAPI,
  type UserLeaderboardEntry,
} from "@/lib/api/leaderboard";
import { formatAddress } from "@/lib/utils";

export function LeaderboardTabs() {
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>("volume");
  const [userLeaderboard, setUserLeaderboard] = useState<
    UserLeaderboardEntry[]
  >([]);
  const [groupLeaderboard, setGroupLeaderboard] = useState<
    GroupLeaderboardEntry[]
  >([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [stats] = await Promise.all([leaderboardAPI.getGlobalStats()]);
        setGlobalStats(stats);

        if (activeTab === "users") {
          const users = await leaderboardAPI.getUserLeaderboard(sortBy, 50);
          setUserLeaderboard(users);
        } else {
          const groups = await leaderboardAPI.getGroupLeaderboard(sortBy, 50);
          setGroupLeaderboard(groups);
        }
      } catch (error) {
        console.error("Failed to load leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab, sortBy]);

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

  const getPnlIcon = (value: string) => {
    const num = parseFloat(value);
    return num >= 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      {globalStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-xl font-bold">
                    {globalStats.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Groups</p>
                  <p className="text-xl font-bold">
                    {globalStats.totalGroups.toLocaleString()}
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
                  <p className="text-xl font-bold">
                    {globalStats.totalSwaps.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-xl font-bold">
                    {formatUSD(globalStats.totalVolume)}
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
                  <p className="text-sm text-muted-foreground">Total PNL</p>
                  <p
                    className={`text-xl font-bold ${getPnlColor(globalStats.totalPnl)}`}
                  >
                    {formatUSD(globalStats.totalPnl)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                Top performers by{" "}
                {sortBy === "volume"
                  ? "Volume"
                  : sortBy === "pnl"
                    ? "PNL (USD)"
                    : sortBy === "pnlPercent"
                      ? "PNL (%)"
                      : "Swap Count"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "users" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("users")}
              >
                Users
              </Button>
              <Button
                variant={activeTab === "groups" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("groups")}
              >
                Groups
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant={sortBy === "volume" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("volume")}
            >
              Volume
            </Button>
            <Button
              variant={sortBy === "pnl" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("pnl")}
            >
              PNL ($)
            </Button>
            <Button
              variant={sortBy === "pnlPercent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("pnlPercent")}
            >
              PNL (%)
            </Button>
            <Button
              variant={sortBy === "swaps" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("swaps")}
            >
              Swaps
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : activeTab === "users" ? (
            <div className="space-y-2">
              {userLeaderboard.map((user) => (
                <div
                  key={user.address}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold w-8">
                      {getRankEmoji(user.rank) || `#${user.rank}`}
                    </div>
                    {user.avatarUrl && (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {user.username || formatAddress(user.address)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.totalSwaps} swaps • Avg:{" "}
                        {formatUSD(user.avgSwapSize)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatUSD(user.totalVolume)}</p>
                    <div
                      className={`flex items-center gap-1 justify-end ${getPnlColor(user.totalPnlUsd)}`}
                    >
                      {getPnlIcon(user.totalPnlUsd)}
                      <span className="text-sm">
                        {formatUSD(user.totalPnlUsd)} (
                        {formatPercent(user.totalPnlPercent)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {groupLeaderboard.map((group) => (
                <div
                  key={group.groupId}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold w-8">
                      {getRankEmoji(group.rank) || `#${group.rank}`}
                    </div>
                    {group.imageUrl && (
                      <img
                        src={group.imageUrl}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {group.memberCount} members • {group.totalSwaps} swaps
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatUSD(group.totalVolume)}</p>
                    <div
                      className={`flex items-center gap-1 justify-end ${getPnlColor(group.totalPnlUsd)}`}
                    >
                      {getPnlIcon(group.totalPnlUsd)}
                      <span className="text-sm">
                        {formatUSD(group.totalPnlUsd)} (
                        {formatPercent(group.totalPnlPercent)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
