# Cabal Chat - MiniApp

A [Next.js 15](https://nextjs.org) MiniApp for crypto trading within group chat "Cabals" on Base. Built with modern web3 technologies and XMTP messaging.

## Key Features

- 🏆 **Group Trading Competitions** - Create and join "Cabals" to compete in token trading
- 💬 **XMTP Integration** - Seamless messaging and group chat functionality
- 📊 **Leaderboards** - Track performance across users and groups with real-time PnL
- 🔄 **Token Swapping** - Integrated swap interface with live price feeds
- 👤 **User Profiles** - Comprehensive trading stats and activity history
- 🎯 **Real-time Updates** - Live trading notifications and group activity

## Tech Stack

- [MiniKit](https://docs.base.org/builderkits/minikit/overview) - Base's MiniApp framework
- [OnchainKit](https://www.base.org/builders/onchainkit) - Coinbase's onchain toolkit
- [XMTP](https://xmtp.org) - Decentralized messaging protocol
- [React 19](https://react.dev) - Modern React with concurrent features
- [Prisma](https://prisma.io) - Type-safe database ORM
- [Biomejs](https://biomejs.dev) - Fast linter and formatter

## Getting Started

1. Install dependencies:

```bash
bun install
# or
pnpm install
```

2. Set up environment variables:

Copy `.env.example` to `.env` and configure the following:

**Required for core functionality:**

- `DATABASE_URL` - PostgreSQL database connection
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` - Coinbase API key for onchain operations
- `NEXT_PUBLIC_URL` - Your application's public URL

**XMTP Configuration:**

- XMTP keys are generated automatically on first run
- Ensure the XMTP agent is running for full messaging functionality

**Frame & Notifications:**

- Frame metadata for Farcaster integration
- Redis configuration for real-time notifications
- Account association for user notifications

```bash
# Shared/OnchainKit variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_URL=
NEXT_PUBLIC_ICON_URL=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Frame metadata
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
NEXT_PUBLIC_APP_ICON=
NEXT_PUBLIC_APP_SUBTITLE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_APP_SPLASH_IMAGE=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=
NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

# Redis config
REDIS_URL=
REDIS_TOKEN=
```

3. Start the development server:

```bash
bun run dev
# or
pnpm run dev
```

## Application Features

### Trading & Swapping

- **Token Swapping Interface** - Integrated swap functionality with live price feeds
- **Transaction History** - Complete swap tracking with PnL calculations
- **Token Portfolio** - View and manage your token holdings
- **Price Alerts** - Real-time price updates and notifications

### Group Management ("Cabals")

- **Create Cabals** - Start new trading groups with custom names and descriptions
- **Join Existing Groups** - Discover and participate in active trading communities
- **Group Leaderboards** - Compete with fellow traders and track group performance
- **XMTP Group Chat** - Seamless messaging within trading groups

### User Experience

- **User Profiles** - Comprehensive trading statistics and performance metrics
- **Responsive Design** - Optimized for mobile devices and Frame integration
- **Real-time Updates** - Live trading notifications and group activity feeds
- **Wallet Integration** - Connect with popular wallets via OnchainKit

### Technical Features

- **Database Integration** - PostgreSQL with Prisma ORM for data persistence
- **XMTP Messaging** - Decentralized messaging protocol integration
- **Frame Support** - Full Farcaster Frame compatibility with metadata
- **Background Services** - Redis-backed notification system for real-time updates

## Development Setup

### Database Setup

1. Set up PostgreSQL database and update `DATABASE_URL` in your `.env`

2. Run Prisma migrations:
```bash
bun prisma generate
bun prisma db push
```

### XMTP Agent Integration

For full functionality, ensure the XMTP Agent is running:

```bash
cd ../xmtp-agent
bun install
bun dev
```

### Key Components

- **`app/page.tsx`** - Main application interface with tab navigation
- **`app/components/`** - Reusable UI components for trading and group management
- **`lib/hooks/useXMTP.ts`** - XMTP client hook for messaging functionality  
- **`app/api/`** - API routes for swaps, leaderboards, and user data
- **`prisma/schema.prisma`** - Database schema for users, groups, and swaps

### Deployment

The app is designed to work as a Farcaster Frame and can be deployed to:

- Vercel (recommended for Next.js apps)
- Railway or similar platforms
- Make sure to set all required environment variables

## Learn More

- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs)
- [Biome.js Documentation](https://biomejs.dev)

## License

MIT License - see [LICENSE](LICENSE) file for details.
