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
import { dbAdapter, type LeaderboardEntry } from "@/lib/db-adapter";
import { formatAddress } from "@/lib/utils";

type LeaderboardPeriod = "all" | "daily" | "weekly" | "monthly";
type LeaderboardMetric = "volume" | "pnl" | "swaps";

interface GlobalStats {
  totalUsers: number;
  totalGroups: number;
  totalVolume: string;
  totalSwaps: number;
  avgPnl: string;
}

export function LeaderboardTabs() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [metric, setMetric] = useState<LeaderboardMetric>("pnl");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch leaderboard data
        const response = await dbAdapter.getLeaderboard(period, metric, 50);
        if (response.success && response.leaderboard) {
          setLeaderboard(response.leaderboard);

          // Calculate global stats from leaderboard data
          const stats: GlobalStats = {
            totalUsers: response.leaderboard.length,
            totalGroups: 0, // Groups feature can be added later
            totalVolume: response.leaderboard
              .reduce((sum, entry) => sum + entry.totalVolume, 0)
              .toFixed(2),
            totalSwaps: response.leaderboard.reduce(
              (sum, entry) => sum + entry.totalSwaps,
              0,
            ),
            avgPnl:
              response.leaderboard.length > 0
                ? (
                    response.leaderboard.reduce(
                      (sum, entry) => sum + entry.totalPnl,
                      0,
                    ) / response.leaderboard.length
                  ).toFixed(2)
                : "0",
          };
          setGlobalStats(stats);
        }
      } catch (error) {
        console.error("Failed to load leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [period, metric]);

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

  const getPnlIcon = (value: number) => {
    return value >= 0 ? (
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
                  <p className="text-sm text-muted-foreground">Avg PNL</p>
                  <p
                    className={`text-xl font-bold ${getPnlColor(parseFloat(globalStats.avgPnl))}`}
                  >
                    {formatUSD(globalStats.avgPnl)}
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
                {metric === "volume"
                  ? "Trading Volume"
                  : metric === "pnl"
                    ? "Profit & Loss"
                    : "Swap Count"}
                {" - "}
                {period === "daily"
                  ? "Last 24 Hours"
                  : period === "weekly"
                    ? "Last 7 Days"
                    : period === "monthly"
                      ? "Last 30 Days"
                      : "All Time"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-1 text-sm border rounded-md"
                value={period}
                onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
              >
                <option value="all">All Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant={metric === "volume" ? "default" : "outline"}
              size="sm"
              onClick={() => setMetric("volume")}
            >
              Volume
            </Button>
            <Button
              variant={metric === "pnl" ? "default" : "outline"}
              size="sm"
              onClick={() => setMetric("pnl")}
            >
              PNL
            </Button>
            <Button
              variant={metric === "swaps" ? "default" : "outline"}
              size="sm"
              onClick={() => setMetric("swaps")}
            >
              Swaps
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.address}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold w-8">
                      {getRankEmoji(entry.rank) || `#${entry.rank}`}
                    </div>
                    <div>
                      <p className="font-medium">
                        {entry.username || formatAddress(entry.address)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.totalSwaps} swaps • Win rate:{" "}
                        {entry.winRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {metric === "volume"
                        ? formatUSD(entry.totalVolume.toString())
                        : metric === "swaps"
                          ? entry.totalSwaps
                          : formatUSD(entry.totalPnl.toString())}
                    </p>
                    <div
                      className={`flex items-center gap-1 justify-end ${getPnlColor(entry.totalPnl)}`}
                    >
                      {getPnlIcon(entry.totalPnl)}
                      <span className="text-sm">
                        {formatPercent(entry.avgPnlPercentage)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
