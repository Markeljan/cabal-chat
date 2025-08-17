# Cabal Chat

> **Social Trading Reimagined** - Create crypto trading groups ("Cabals"), compete on leaderboards, and trade tokens together through decentralized messaging.

![Cabal Chat Banner](miniapp/public/hero.png)

## 🎯 Overview

Cabal Chat is a revolutionary social trading platform that combines group messaging with competitive crypto trading. Users can create or join "Cabals" (trading groups), execute token swaps through natural conversation, and compete on performance leaderboards - all powered by XMTP's decentralized messaging protocol and Base blockchain.

### Key Value Propositions

- 🏆 **Competitive Social Trading** - Turn trading into a social game with group competitions
- 💬 **Conversational Commerce** - Execute trades through natural language in group chats
- 📊 **Real-time Leaderboards** - Track performance across users and groups with live PnL
- 🤖 **AI Trading Assistant** - Get market insights and trading help from an intelligent agent
- 🔗 **Decentralized Messaging** - Built on XMTP for censorship-resistant communication

## 🏗️ Architecture

Cabal Chat consists of three main components working in harmony:

```mermaid
graph TB
    User[👤 Users] --> MiniApp[📱 MiniApp Frontend]
    MiniApp --> XMTP[💬 XMTP Network]
    XMTP --> Agent[🤖 XMTP Agent]
    Agent --> CDP[🏦 Coinbase CDP]
    Agent --> OpenAI[🧠 OpenAI]
    Agent --> DB[(📊 PostgreSQL)]
    MiniApp --> DB
    
    subgraph "Frontend Layer"
        MiniApp
    end
    
    subgraph "Protocol Layer"
        XMTP
    end
    
    subgraph "Backend Services"
        Agent
        CDP
        OpenAI
        DB
    end
```

## 📦 Components

### 🖥️ [MiniApp Frontend](miniapp/)

A Next.js 15 MiniApp built with MiniKit for Farcaster integration.

**Tech Stack:** Next.js 15, React 19, OnchainKit, XMTP Browser SDK, Prisma, Tailwind CSS

**Key Features:**
- **Cabal Management** - Create, discover, and join trading groups
- **Trading Interface** - Swap tokens with integrated price feeds  
- **Leaderboards** - Real-time performance tracking and rankings
- **User Profiles** - Comprehensive trading statistics and history
- **XMTP Integration** - Seamless messaging within trading groups
- **Farcaster Frame** - Deploy as a Frame for viral distribution

**Getting Started:**
```bash
cd miniapp
bun install
bun prisma generate
bun dev
```

### 🤖 [XMTP Agent](xmtp-agent/)

An intelligent backend service that powers the conversational trading experience.

**Tech Stack:** Bun, Elysia, XMTP Node SDK, OpenAI, Coinbase CDP SDK, Prisma

**Key Features:**
- **Message Processing** - Handles all XMTP group and DM communications
- **AI Assistant** - Provides trading insights and executes natural language commands
- **Swap Execution** - Automated token trading via Coinbase CDP
- **Leaderboard Engine** - Real-time calculation of user and group performance
- **Group Management** - Handles Cabal creation, invitations, and member management

**Getting Started:**
```bash
cd xmtp-agent  
bun install
bun gen-keys
bun prisma generate
bun dev
```

## 🚀 Quick Start

### Prerequisites

- **Bun** runtime installed
- **PostgreSQL** database running
- **OpenAI** API key
- **Coinbase Developer Platform** credentials

### Setup Instructions

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/cabal-chat.git
cd cabal-chat
```

2. **Set up the database:**
```bash
# Create a PostgreSQL database
createdb cabal_chat

# Set DATABASE_URL in both .env files
echo "DATABASE_URL=postgresql://user:password@localhost:5432/cabal_chat" >> miniapp/.env
echo "DATABASE_URL=postgresql://user:password@localhost:5432/cabal_chat" >> xmtp-agent/.env
```

3. **Start the XMTP Agent:**
```bash
cd xmtp-agent
cp .env.example .env
# Configure your API keys in .env
bun install
bun gen-keys
bun prisma generate && bun prisma db push
bun dev
```

4. **Start the MiniApp:**
```bash
cd miniapp
cp .env.example .env  
# Configure your environment variables
bun install
bun prisma generate
bun dev
```

5. **Access the application:**
   - MiniApp: http://localhost:3000
   - XMTP Agent API: http://localhost:3131

## 💡 How It Works

### User Journey

1. **Connect Wallet** - Users connect their Ethereum wallet via OnchainKit
2. **Initialize XMTP** - Set up decentralized messaging capabilities
3. **Create/Join Cabals** - Start or discover trading groups
4. **Start Trading** - Execute token swaps through chat commands
5. **Compete & Track** - Monitor performance on group leaderboards
6. **Social Interaction** - Chat with group members and get AI assistance

### Trading Flow

```
User Message: "Swap 100 USDC for ETH"
     ↓
XMTP Agent receives message
     ↓
AI parses intent and validates
     ↓
Coinbase CDP executes swap
     ↓
Transaction recorded in database
     ↓
Leaderboards updated automatically
     ↓
Confirmation sent via XMTP
```

### Data Architecture

**Core Models:**
- **Users** - Wallet addresses with aggregated trading stats
- **Groups** - Cabal details with performance metrics
- **GroupMembers** - User membership with group-specific stats  
- **Swaps** - Individual trades with PnL calculations
- **TokenPrices** - Historical price data for PnL tracking

## 🎨 Features Deep Dive

### 🏆 Competitive Leaderboards

Track performance across multiple dimensions:

- **Individual Rankings** - User PnL, volume, win rate
- **Group Rankings** - Cabal performance and activity
- **Token Performance** - Best performing assets per group
- **Time-based Rankings** - Daily, weekly, monthly competitions

### 💬 Conversational Trading

Natural language commands powered by AI:

- `"Buy $100 of ETH"` → Executes market buy
- `"What's my USDC balance?"` → Returns current holdings  
- `"Show me the group leaderboard"` → Displays rankings
- `"What's happening with SOL?"` → Provides market analysis

### 🤖 AI Assistant Capabilities

- **Market Analysis** - Real-time insights on tokens and trends
- **Trading Education** - Explains DeFi concepts and strategies
- **Performance Reviews** - Analyzes trading patterns and suggests improvements
- **Group Moderation** - Helps manage Cabal activities and discussions

### 🔐 Security & Privacy

- **Self-custodial** - Users maintain control of their private keys
- **Decentralized Messaging** - XMTP ensures message privacy and censorship resistance
- **Transparent Trading** - All swaps are recorded on-chain for verification
- **Minimal Data Collection** - Only essential trading data is stored

## 🌐 Deployment

### Production Deployment

Both components can be deployed independently:

**MiniApp (Frontend):**
- **Vercel** (Recommended) - Automatic deployments with GitHub integration
- **Railway** - Full-stack hosting with database
- **Netlify** - Static site hosting with serverless functions

**XMTP Agent (Backend):**
- **Railway** - Simple deployment with built-in PostgreSQL
- **Fly.io** - Global edge deployment  
- **DigitalOcean App Platform** - Managed container hosting
- **Docker** - Self-hosted container deployment

### Environment Variables

Ensure all required environment variables are configured:

**MiniApp:**
- `DATABASE_URL`, `NEXT_PUBLIC_ONCHAINKIT_API_KEY`, `NEXT_PUBLIC_URL`
- Farcaster Frame metadata variables
- Redis configuration for notifications

**XMTP Agent:**  
- `DATABASE_URL`, `OPENAI_API_KEY`, `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`
- XMTP configuration (`XMTP_ENV`, `XMTP_DB_PATH`)

## 🛠️ Development

### Project Structure

```
cabal-chat/
├── miniapp/                 # Next.js frontend application
│   ├── app/                 # App router pages and components
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utilities and hooks
│   ├── prisma/              # Database schema
│   └── public/              # Static assets
├── xmtp-agent/              # Backend service
│   ├── src/                 # Source code
│   │   ├── lib/             # Core business logic
│   │   ├── helpers/         # Utility functions
│   │   └── scripts/         # Management scripts
│   └── prisma/              # Database schema
└── README.md               # This file
```

### Development Workflow

1. **Feature Development** - Work on both frontend and backend simultaneously
2. **Testing** - Comprehensive testing of XMTP integration and trading flows
3. **Database Migrations** - Use Prisma for schema changes across both services  
4. **API Integration** - Ensure consistent data models between components
5. **Deployment** - Deploy backend first, then frontend with updated API endpoints

### Code Quality

- **TypeScript** - Full type safety across all components
- **Biome** - Consistent code formatting and linting
- **Prisma** - Type-safe database operations
- **Modern Standards** - Latest React, Next.js, and Bun best practices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Set up your local development environment (see Quick Start)
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Make your changes and test thoroughly
5. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Areas for Contribution

- **New Trading Features** - Advanced order types, portfolio management
- **UI/UX Improvements** - Enhanced mobile experience, accessibility
- **AI Enhancements** - Better natural language processing, market analysis
- **Integrations** - Additional DEXs, price feeds, blockchain networks
- **Performance** - Optimization of real-time features and database queries

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with these amazing technologies:

- **[XMTP](https://xmtp.org)** - Decentralized messaging protocol
- **[Coinbase](https://www.coinbase.com/developer-platform)** - CDP SDK for onchain operations
- **[Base](https://base.org)** - L2 blockchain and MiniKit framework
- **[OpenAI](https://openai.com)** - AI-powered conversational capabilities
- **[Farcaster](https://farcaster.xyz)** - Decentralized social protocol
- **[Prisma](https://prisma.io)** - Type-safe database toolkit

---

**Ready to start trading with friends?** 🚀

[Deploy your own Cabal Chat](https://github.com/your-username/cabal-chat) | [Join our community](https://warpcast.com/cabal-chat) | [Report issues](https://github.com/your-username/cabal-chat/issues)
