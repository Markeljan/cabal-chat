"use client";

import {
  ArrowLeft,
  BarChart3,
  Check,
  List,
  Plus,
  Star,
  TrendingUp,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type Group,
  type GroupResponse,
  type GroupsResponse,
  groupApi,
} from "@/lib/group-api";
import { cn } from "@/lib/utils";

export {
  BottomNavigation,
  CabalDetails,
  GroupCreation,
  GroupLeaderboard,
  ProfileTab,
};

type FeaturesProps = {
  setActiveTab: (tab: string) => void;
};

export function Features({ setActiveTab }: FeaturesProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-4">
            <li className="flex items-start">
              <Check className="w-5 h-5 text-[var(--app-accent)] mt-1 mr-2" />
              <span className="text-[var(--app-foreground-muted)]">
                Minimalistic and beautiful UI design
              </span>
            </li>
            <li className="flex items-start">
              <Check className="w-5 h-5 text-[var(--app-accent)] mt-1 mr-2" />
              <span className="text-[var(--app-foreground-muted)]">
                Responsive layout for all devices
              </span>
            </li>
            <li className="flex items-start">
              <Check className="w-5 h-5 text-[var(--app-accent)] mt-1 mr-2" />
              <span className="text-[var(--app-foreground-muted)]">
                Dark mode support
              </span>
            </li>
            <li className="flex items-start">
              <Check className="w-5 h-5 text-[var(--app-accent)] mt-1 mr-2" />
              <span className="text-[var(--app-foreground-muted)]">
                OnchainKit integration
              </span>
            </li>
          </ul>
          <Button variant="outline" onClick={() => setActiveTab("home")}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function GroupCreation({ onGroupCreated }: { onGroupCreated?: () => void }) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  const createGroup = async () => {
    if (!groupName.trim() || !address) return;

    setIsCreating(true);
    setError(null);

    try {
      const result = await groupApi.createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        createdBy: address,
      });

      if (result.success) {
        setGroupName("");
        setGroupDescription("");
        onGroupCreated?.();
      } else {
        setError(result.error || "Failed to create group");
      }
    } catch (_err) {
      setError("Network error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && e.metaKey) {
      action();
    }
  };

  if (!address) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Create New Cabal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-[var(--app-foreground-muted)] mb-2">
                Connect your wallet to create a cabal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Create New Cabal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="group-name"
                className="block text-sm font-medium text-[var(--app-foreground)] mb-2"
              >
                Cabal Name
              </label>
              <input
                id="group-name"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, createGroup)}
                placeholder="Enter cabal name..."
                maxLength={100}
                className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                disabled={isCreating}
              />
            </div>

            <div>
              <label
                htmlFor="group-description"
                className="block text-sm font-medium text-[var(--app-foreground)] mb-2"
              >
                Description (Optional)
              </label>
              <textarea
                id="group-description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, createGroup)}
                placeholder="Describe your trading strategy..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)] resize-none"
                disabled={isCreating}
              />
            </div>

            <Button
              onClick={createGroup}
              disabled={!groupName.trim() || isCreating}
            >
              <Users className="w-4 h-4 mr-2" />
              {isCreating ? "Creating..." : "Create Cabal"}
            </Button>

            <p className="text-xs text-[var(--app-foreground-muted)]">
              Tip: Press ⌘ + Enter to create quickly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BottomNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--app-card-bg)] border-t border-[var(--app-card-border)] px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        <button
          type="button"
          onClick={() => onTabChange("leaderboard")}
          className={`flex flex-col items-center py-2 px-3 transition-colors ${
            activeTab === "leaderboard"
              ? "text-[var(--app-accent)]"
              : "text-[var(--app-foreground-muted)]"
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-xs mt-1">Leaderboard</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("create")}
          className="flex flex-col items-center py-2 px-3 bg-[var(--app-accent)] rounded-full text-[var(--app-background)] shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center py-2 px-3 transition-colors ${
            activeTab === "profile"
              ? "text-[var(--app-accent)]"
              : "text-[var(--app-foreground-muted)]"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
}

function ProfileTab() {
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  const fetchUserGroups = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const result: GroupsResponse = await groupApi.getUserGroups(address);

      if (result.success && result.groups) {
        setJoinedGroups(result.groups);
      } else {
        setError(result.error || "Failed to fetch your groups");
      }
    } catch (_err) {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  if (!address) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card>
          <CardHeader>
            <CardTitle>My Cabals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-[var(--app-foreground-muted)]">
                Connect your wallet to view your cabals
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card>
          <CardHeader>
            <CardTitle>My Cabals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-pulse text-[var(--app-foreground-muted)]">
                Loading your cabals...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card>
          <CardHeader>
            <CardTitle>My Cabals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
              <Button onClick={fetchUserGroups} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Card>
        <CardHeader>
          <CardTitle>My Cabals</CardTitle>
        </CardHeader>
        <CardContent>
          {joinedGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--app-foreground-muted)]">
                You haven't joined any cabals yet. Check out the leaderboard to
                find one!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {joinedGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 rounded-lg border bg-[var(--app-accent)]/10 border-[var(--app-accent)]/30 cursor-pointer hover:bg-[var(--app-accent)]/15 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-[var(--app-foreground)]">
                        {group.name}
                      </h4>
                      {group.description && (
                        <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-500">
                        <TrendingUp className="w-4 h-4 inline mr-1" />+
                        {(group.performance || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-[var(--app-foreground-muted)]">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {group.members || 0} members
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-[var(--app-accent)] text-[var(--app-background)] text-xs rounded-full">
                      Joined
                    </span>
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

function CabalDetails({
  cabalId,
  onBack,
}: {
  cabalId: string;
  onBack: () => void;
}) {
  const [cabal, setCabal] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    const fetchCabalDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result: GroupResponse = await groupApi.getGroupDetails(cabalId);

        if (result.success && result.group) {
          setCabal(result.group);

          if (address) {
            setMembershipLoading(true);
            try {
              const membershipResult = (await groupApi.checkMembership(
                cabalId,
                address,
              )) as { success: boolean; member?: { isActive: boolean } };
              setIsMember(
                (membershipResult.success &&
                  membershipResult.member?.isActive) ||
                  false,
              );
            } catch (_err) {
              setIsMember(false);
            } finally {
              setMembershipLoading(false);
            }
          }
        } else {
          setError(result.error || "Failed to fetch cabal details");
        }
      } catch (_err) {
        setError("Network error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCabalDetails();
  }, [cabalId, address]);

  const handleJoinCabal = async () => {
    if (!address || isJoining || isMember) return;

    setIsJoining(true);

    try {
      const result = await groupApi.joinGroup(cabalId, address);

      if (result.success) {
        setIsMember(true);
      } else {
        setError(result.error || "Failed to join cabal");
      }
    } catch (_err) {
      setError("Network error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={onBack}
            className="mr-3 p-2 hover:bg-[var(--app-card-bg)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Loading...</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-pulse text-[var(--app-foreground-muted)]">
                Loading cabal details...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !cabal) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={onBack}
            className="mr-3 p-2 hover:bg-[var(--app-card-bg)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">
                  {error || "Cabal not found"}
                </p>
              </div>
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mockStats = {
    pnl: 23.5,
    tvl: 1250000,
    volume24h: 89000,
    trades: 127,
    winRate: 68.5,
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center mb-4">
        <button
          type="button"
          onClick={onBack}
          className="mr-3 p-2 hover:bg-[var(--app-card-bg)] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">{cabal.name}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-[var(--app-foreground)] mb-2">
                {cabal.name}
              </h2>
              {cabal.description && (
                <p className="text-[var(--app-foreground-muted)]">
                  {cabal.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-[var(--app-foreground-muted)]">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {cabal.members || 0} members
              </span>
              <span>
                Created {new Date(cabal.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                +{mockStats.pnl}%
              </div>
              <div className="text-sm text-[var(--app-foreground-muted)]">
                PnL
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--app-foreground)]">
                ${(mockStats.tvl / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-[var(--app-foreground-muted)]">
                TVL
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--app-foreground-muted)]">
                24h Volume
              </span>
              <span className="font-medium">
                ${mockStats.volume24h.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--app-foreground-muted)]">
                Total Trades
              </span>
              <span className="font-medium">{mockStats.trades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--app-foreground-muted)]">
                Win Rate
              </span>
              <span className="font-medium text-green-500">
                {mockStats.winRate}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trading Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-6 h-6 text-[var(--app-foreground-muted)] mx-auto mb-2" />
            <p className="text-[var(--app-foreground-muted)]">
              Trading charts coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        {address ? (
          <Button
            className="w-full"
            variant={isMember ? "secondary" : "default"}
            disabled={isJoining || membershipLoading}
            onClick={handleJoinCabal}
          >
            <Users className="w-4 h-4 mr-2" />
            {isJoining
              ? "Joining..."
              : membershipLoading
                ? "Checking..."
                : isMember
                  ? "Already Joined"
                  : "Join Cabal"}
          </Button>
        ) : (
          <div className="text-center py-4">
            <p className="text-[var(--app-foreground-muted)]">
              Connect your wallet to join this cabal
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GroupLeaderboard({
  refreshTrigger,
  onCabalClick,
}: {
  refreshTrigger?: number;
  onCabalClick?: (cabalId: string) => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result: GroupsResponse = await groupApi.getAllGroups();

      if (result.success && result.groups) {
        setGroups(result.groups);
      } else {
        setError(result.error || "Failed to fetch groups");
      }
    } catch (_err) {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups, refreshTrigger]);

  const getRankIcon = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank <= 3) return <Star className="w-4 h-4 text-[var(--app-accent)]" />;
    return (
      <span className="text-[var(--app-foreground-muted)] text-sm">
        #{rank}
      </span>
    );
  };

  const getPerformanceColor = (performance?: number) => {
    if (!performance) return "text-[var(--app-foreground-muted)]";
    if (performance > 20) return "text-green-500";
    if (performance > 10) return "text-green-400";
    if (performance > 0) return "text-yellow-500";
    return "text-red-500";
  };

  const formatPerformance = (performance?: number) => {
    if (performance === undefined) return "N/A";
    return `+${performance.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Cabal Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-pulse text-[var(--app-foreground-muted)]">
                Loading cabals...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Cabal Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
              <Button onClick={fetchGroups} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Cabal Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-[var(--app-foreground-muted)]">
                No cabals found. Be the first to create one!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Cabal Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {groups.map((group, index) => (
              <Card
                key={group.id}
                className={cn(
                  "transition-all hover:border-[var(--app-accent)]/50 cursor-pointer",
                  onCabalClick && "cursor-pointer",
                )}
                onClick={() => onCabalClick?.(group.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(index)}
                      <div>
                        <h4 className="font-medium text-[var(--app-foreground)]">
                          {group.name}
                        </h4>
                        {group.description && (
                          <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${getPerformanceColor(group.performance)}`}
                      >
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        {formatPerformance(group.performance)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-[var(--app-foreground-muted)]">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {group.members || 0} members
                      </span>
                      <span className="text-xs">
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
