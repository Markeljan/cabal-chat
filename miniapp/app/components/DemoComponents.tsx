"use client";

import { useNotification } from "@coinbase/onchainkit/minikit";
import {
  Transaction,
  TransactionButton,
  type TransactionError,
  type TransactionResponse,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
} from "@coinbase/onchainkit/transaction";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount } from "wagmi";
import {
  type Group,
  GroupResponse,
  GroupsResponse,
  groupApi,
} from "../../lib/group-api";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
};

export {
  BottomNavigation,
  CabalDetails,
  GroupCreation,
  GroupLeaderboard,
  ProfileTab,
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)]",
    secondary:
      "bg-[var(--app-gray)] hover:bg-[var(--app-gray-dark)] text-[var(--app-foreground)]",
    outline:
      "border border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] text-[var(--app-accent)]",
    ghost:
      "hover:bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

function Card({ title, children, className = "", onClick }: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  if (onClick) {
    return (
      <button
        type="button"
        className={`w-full text-left bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl ${className}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        {title && (
          <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
            <h3 className="text-lg font-medium text-[var(--app-foreground)]">
              {title}
            </h3>
          </div>
        )}
        <div className="p-5">{children}</div>
      </button>
    );
  }

  return (
    <div
      className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all ${className}`}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

type FeaturesProps = {
  setActiveTab: (tab: string) => void;
};

export function Features({ setActiveTab }: FeaturesProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Key Features">
        <ul className="space-y-3 mb-4">
          <li className="flex items-start">
            <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Minimalistic and beautiful UI design
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Responsive layout for all devices
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Dark mode support
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              OnchainKit integration
            </span>
          </li>
        </ul>
        <Button variant="outline" onClick={() => setActiveTab("home")}>
          Back to Home
        </Button>
      </Card>
    </div>
  );
}

type HomeProps = {
  setActiveTab: (tab: string) => void;
};

export function Home({ setActiveTab }: HomeProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="My First Mini App">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          This is a minimalistic Mini App built with OnchainKit components.
        </p>
        <Button
          onClick={() => setActiveTab("features")}
          icon={<Icon name="arrow-right" size="sm" />}
        >
          Explore Features
        </Button>
      </Card>

      <TodoList />

      <TransactionCard />
    </div>
  );
}

type IconProps = {
  name:
    | "heart"
    | "star"
    | "check"
    | "plus"
    | "arrow-right"
    | "users"
    | "trophy"
    | "trending-up"
    | "user"
    | "list"
    | "arrow-left"
    | "dollar-sign"
    | "bar-chart";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const icons = {
    heart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Heart</title>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    star: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Star</title>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    check: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Check</title>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    plus: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Plus</title>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    "arrow-right": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Arrow Right</title>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    users: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Users</title>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    trophy: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Trophy</title>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55.47.98.97 1.21C11.25 18.48 11.61 18.5 12 18.5s.75-.02 1.03-.29c.5-.23.97-.66.97-1.21v-2.34" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    "trending-up": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Trending Up</title>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    user: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>User</title>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    list: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>List</title>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    "arrow-left": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Arrow Left</title>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    "dollar-sign": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Dollar Sign</title>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    "bar-chart": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Bar Chart</title>
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  };

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {icons[name]}
    </span>
  );
}

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn about MiniKit", completed: false },
    { id: 2, text: "Build a Mini App", completed: true },
    { id: 3, text: "Deploy to Base and go viral", completed: false },
  ]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = () => {
    if (newTodo.trim() === "") return;

    const newId =
      todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
    setTodos([...todos, { id: newId, text: newTodo, completed: false }]);
    setNewTodo("");
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <Card title="Get started">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task..."
            className="flex-1 px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
          />
          <Button
            variant="primary"
            size="md"
            onClick={addTodo}
            icon={<Icon name="plus" size="sm" />}
          >
            Add
          </Button>
        </div>

        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id={`todo-${todo.id}`}
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    todo.completed
                      ? "bg-[var(--app-accent)] border-[var(--app-accent)]"
                      : "border-[var(--app-foreground-muted)] bg-transparent"
                  }`}
                >
                  {todo.completed && (
                    <Icon
                      name="check"
                      size="sm"
                      className="text-[var(--app-background)]"
                    />
                  )}
                </button>
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`text-[var(--app-foreground-muted)] cursor-pointer ${todo.completed ? "line-through opacity-70" : ""}`}
                >
                  {todo.text}
                </label>
              </div>
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                className="text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
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
        <Card title="Create New Cabal">
          <div className="text-center py-4">
            <p className="text-[var(--app-foreground-muted)] mb-2">
              Connect your wallet to create a cabal
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Card title="Create New Cabal">
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
            icon={<Icon name="users" size="sm" />}
          >
            {isCreating ? "Creating..." : "Create Cabal"}
          </Button>

          <p className="text-xs text-[var(--app-foreground-muted)]">
            Tip: Press ⌘ + Enter to create quickly
          </p>
        </div>
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
          <Icon name="list" size="md" />
          <span className="text-xs mt-1">Leaderboard</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("create")}
          className="flex flex-col items-center py-2 px-3 bg-[var(--app-accent)] rounded-full text-[var(--app-background)] shadow-lg"
        >
          <Icon name="plus" size="md" />
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
          <Icon name="user" size="md" />
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
        <Card title="My Cabals">
          <div className="text-center py-4">
            <p className="text-[var(--app-foreground-muted)]">
              Connect your wallet to view your cabals
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card title="My Cabals">
          <div className="text-center py-8">
            <div className="animate-pulse text-[var(--app-foreground-muted)]">
              Loading your cabals...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card title="My Cabals">
          <div className="space-y-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
            <Button onClick={fetchUserGroups} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Card title="My Cabals">
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
                      <Icon
                        name="trending-up"
                        size="sm"
                        className="inline mr-1"
                      />
                      +{(group.performance || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-[var(--app-foreground-muted)]">
                    <span className="flex items-center">
                      <Icon name="users" size="sm" className="mr-1" />
                      {group.memberCount || 0} members
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

  useEffect(() => {
    const fetchCabalDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result: GroupResponse = await groupApi.getGroupDetails(cabalId);

        if (result.success && result.group) {
          setCabal(result.group);
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
  }, [cabalId]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={onBack}
            className="mr-3 p-2 hover:bg-[var(--app-card-bg)] rounded-lg transition-colors"
          >
            <Icon name="arrow-left" size="md" />
          </button>
          <h1 className="text-lg font-semibold">Loading...</h1>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="animate-pulse text-[var(--app-foreground-muted)]">
              Loading cabal details...
            </div>
          </div>
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
            <Icon name="arrow-left" size="md" />
          </button>
          <h1 className="text-lg font-semibold">Error</h1>
        </div>
        <Card>
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
          <Icon name="arrow-left" size="md" />
        </button>
        <h1 className="text-lg font-semibold">{cabal.name}</h1>
      </div>

      <Card>
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
              <Icon name="users" size="sm" className="mr-1" />
              {cabal.memberCount || 0} members
            </span>
            <span>
              Created {new Date(cabal.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              +{mockStats.pnl}%
            </div>
            <div className="text-sm text-[var(--app-foreground-muted)]">
              PnL
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--app-foreground)]">
              ${(mockStats.tvl / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-[var(--app-foreground-muted)]">
              TVL
            </div>
          </div>
        </Card>
      </div>

      <Card title="Performance Stats">
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
            <span className="text-[var(--app-foreground-muted)]">Win Rate</span>
            <span className="font-medium text-green-500">
              {mockStats.winRate}%
            </span>
          </div>
        </div>
      </Card>

      <Card title="Trading Activity">
        <div className="text-center py-8">
          <Icon
            name="bar-chart"
            size="lg"
            className="text-[var(--app-foreground-muted)] mx-auto mb-2"
          />
          <p className="text-[var(--app-foreground-muted)]">
            Trading charts coming soon
          </p>
        </div>
      </Card>

      <div className="pt-4">
        <Button className="w-full" icon={<Icon name="users" size="sm" />}>
          Join Cabal
        </Button>
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

  const toggleJoinGroup = (groupId: string) => {
    console.log("Toggle join group:", groupId);
  };

  const getRankIcon = (index: number) => {
    const rank = index + 1;
    if (rank === 1)
      return <Icon name="trophy" size="sm" className="text-yellow-500" />;
    if (rank <= 3)
      return (
        <Icon name="star" size="sm" className="text-[var(--app-accent)]" />
      );
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
        <Card title="Cabal Leaderboard">
          <div className="text-center py-8">
            <div className="animate-pulse text-[var(--app-foreground-muted)]">
              Loading cabals...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card title="Cabal Leaderboard">
          <div className="space-y-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
            <Button onClick={fetchGroups} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <Card title="Cabal Leaderboard">
          <div className="text-center py-8">
            <p className="text-[var(--app-foreground-muted)]">
              No cabals found. Be the first to create one!
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Card title="Cabal Leaderboard">
        <div className="space-y-3">
          {groups.map((group, index) => (
            <Card
              key={group.id}
              className="transition-all hover:border-[var(--app-accent)]/50 cursor-pointer"
              onClick={() => onCabalClick?.(group.id)}
            >
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
                    <Icon
                      name="trending-up"
                      size="sm"
                      className="inline mr-1"
                    />
                    {formatPerformance(group.performance)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-[var(--app-foreground-muted)]">
                  <span className="flex items-center">
                    <Icon name="users" size="sm" className="mr-1" />
                    {group.memberCount || 0} members
                  </span>
                  <span className="text-xs">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e?.stopPropagation();
                    toggleJoinGroup(group.id);
                  }}
                >
                  Join
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TransactionCard() {
  const { address } = useAccount();

  // Example transaction call - sending 0 ETH to self
  const calls = useMemo(
    () =>
      address
        ? [
            {
              to: address,
              data: "0x" as `0x${string}`,
              value: BigInt(0),
            },
          ]
        : [],
    [address],
  );

  const sendNotification = useNotification();

  const handleSuccess = useCallback(
    async (response: TransactionResponse) => {
      const transactionHash = response.transactionReceipts[0].transactionHash;

      console.log(`Transaction successful: ${transactionHash}`);

      await sendNotification({
        title: "Congratulations!",
        body: `You sent your a transaction, ${transactionHash}!`,
      });
    },
    [sendNotification],
  );

  return (
    <Card title="Make Your First Transaction">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Experience the power of seamless sponsored transactions with{" "}
          <a
            href="https://onchainkit.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0052FF] hover:underline"
          >
            OnchainKit
          </a>
          .
        </p>

        <div className="flex flex-col items-center">
          {address ? (
            <Transaction
              calls={calls}
              onSuccess={handleSuccess}
              onError={(error: TransactionError) =>
                console.error("Transaction failed:", error)
              }
            >
              <TransactionButton className="text-white text-md" />
              <TransactionStatus>
                <TransactionStatusAction />
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast className="mb-4">
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          ) : (
            <p className="text-yellow-400 text-sm text-center mt-2">
              Connect your wallet to send a transaction
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
