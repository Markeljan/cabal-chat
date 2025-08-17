# XMTP Agent - Backend Service

An intelligent backend service that handles XMTP messaging, AI-powered interactions, and blockchain operations for the Cabal Chat ecosystem.

## Overview

The XMTP Agent acts as the backend brain for Cabal Chat, providing:

- 🤖 **AI-Powered Chat Agent** - Intelligent responses and trading assistance via OpenAI
- 📡 **XMTP Message Handling** - Real-time message processing and group management
- 💱 **Swap Execution** - Automated token swapping via Coinbase CDP SDK
- 📊 **Leaderboard Management** - Real-time tracking of user and group performance
- 🔄 **Background Processing** - Continuous monitoring and data synchronization

## Tech Stack

- **[Bun](https://bun.sh)** - Fast JavaScript runtime and package manager
- **[Elysia](https://elysiajs.com)** - Lightweight web framework built on Bun
- **[XMTP Node SDK](https://xmtp.org)** - Decentralized messaging protocol
- **[OpenAI SDK](https://openai.com)** - AI-powered conversational capabilities
- **[Coinbase CDP SDK](https://docs.cdp.coinbase.com)** - Onchain operations and swaps
- **[Prisma](https://prisma.io)** - Type-safe database ORM
- **[TypeScript](https://typescriptlang.org)** - Full type safety

## Quick Start

### Prerequisites

- Bun runtime installed
- PostgreSQL database
- OpenAI API key
- Coinbase Developer Platform credentials

### Installation

1. **Install dependencies:**
```bash
bun install
```

2. **Set up environment variables:**

Create a `.env` file with the following:

```bash
# Database
DATABASE_URL="postgresql://..."

# XMTP Configuration
XMTP_ENV="production" # or "dev" for development
XMTP_DB_PATH="./xmtp_data"

# OpenAI
OPENAI_API_KEY="sk-..."

# Coinbase CDP
CDP_API_KEY_NAME="..."
CDP_API_KEY_PRIVATE_KEY="..."

# Elysia Server
PORT=3131
```

3. **Generate XMTP keys (first run only):**
```bash
bun gen-keys
```

4. **Set up the database:**
```bash
bun prisma generate
bun prisma db push
```

5. **Start the service:**
```bash
bun dev
```

## Core Features

### Message Processing

The agent continuously monitors XMTP conversations and processes incoming messages:

- **Text Analysis** - Parses messages for trading commands and Ethereum addresses
- **Context Awareness** - Maintains conversation history for intelligent responses
- **Group Management** - Handles group creation, member management, and permissions
- **Command Processing** - Executes swap commands, balance checks, and leaderboard queries

### AI Integration

Powered by OpenAI's GPT models for:

- **Trading Assistance** - Provides market insights and trading recommendations
- **Natural Conversations** - Engages users with contextual, helpful responses
- **Command Understanding** - Interprets natural language trading commands
- **Educational Content** - Explains DeFi concepts and trading strategies

### Swap Execution

Integrated with Coinbase CDP for automated trading:

- **Token Swaps** - Executes trades based on user commands
- **Balance Tracking** - Monitors wallet balances and token holdings
- **Transaction Monitoring** - Tracks swap status and updates records
- **PnL Calculations** - Computes profit/loss in real-time

### API Endpoints

The service exposes REST endpoints via Elysia:

```
GET  /leaderboard/users          # Top trading users
GET  /leaderboard/groups         # Top trading groups  
POST /leaderboard/update         # Update leaderboard data
GET  /health                     # Service health check
```

## Architecture

### Core Components

```
src/
├── index.ts                 # Main entry point
├── helpers/
│   ├── client.ts           # XMTP client utilities
│   └── get-client.ts       # Client initialization
├── lib/
│   ├── ai/index.ts         # OpenAI integration
│   ├── xmtp.ts            # XMTP message handler
│   ├── swap-handler.ts    # Trade execution logic
│   ├── swap-tracker.ts    # Trade monitoring
│   ├── leaderboard.ts     # Scoring system
│   ├── group-service.ts   # Group management
│   ├── server.ts          # Elysia web server
│   └── database.ts        # Database operations
└── scripts/
    ├── gen-keys.ts         # XMTP key generation
    ├── check-installations.ts
    ├── clean-installations.ts
    └── wipe-db.ts         # Database cleanup
```

### Message Flow

1. **Message Reception** - XMTP client receives new messages
2. **Content Analysis** - Extract addresses, commands, and context
3. **AI Processing** - Generate intelligent responses via OpenAI
4. **Action Execution** - Execute swaps, updates, or queries
5. **Response Delivery** - Send results back via XMTP
6. **Data Persistence** - Update database with transaction records

## Configuration

### XMTP Setup

The agent automatically handles XMTP client initialization:

- Generates encryption keys on first run
- Maintains persistent message history
- Handles group invitations and management
- Processes multiple content types (text, transaction references, etc.)

### Database Schema

Key models tracked by the agent:

- **Users** - Ethereum addresses with trading stats
- **Groups** - XMTP group chats with performance metrics  
- **Swaps** - Individual trades with PnL calculations
- **GroupMembers** - User membership and group-specific stats

### AI Behavior

The AI agent is configured to:

- Provide helpful trading insights without financial advice
- Assist with DeFi education and explanations
- Process natural language commands for trading
- Maintain conversation context within groups

## Scripts & Utilities

### Database Management

```bash
bun wipe-db              # Clear all data (destructive)
bun check-installations  # Verify agent installations
bun clean-installations  # Clean up old installations
```

### Key Management

```bash
bun gen-keys            # Generate new XMTP encryption keys
```

## Deployment

### Production Setup

1. **Environment Configuration**
   - Use production XMTP environment
   - Secure API keys with proper access controls
   - Configure database connection pooling

2. **Process Management**
   - Use PM2 or similar for process monitoring
   - Set up health checks and restart policies
   - Configure log rotation and monitoring

3. **Scaling Considerations**
   - Single instance handles message streams
   - Database operations are optimized for concurrent access
   - Consider read replicas for leaderboard queries

### Docker Support

```dockerfile
FROM oven/bun:1-slim
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3131
CMD ["bun", "start"]
```

## Development

### Local Development

```bash
bun dev                  # Start with auto-reload
bun check               # Run biome linter
bun check:fix           # Fix linting issues
```

### Testing

The agent includes comprehensive testing for:

- XMTP message processing
- AI response generation  
- Swap execution logic
- Database operations
- API endpoint functionality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test thoroughly
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and support:

1. Check existing GitHub issues
2. Review XMTP documentation for protocol questions
3. Consult Coinbase CDP docs for trading integration
4. Create a new issue with detailed reproduction steps
