# refinore-mcp

[![npm version](https://img.shields.io/npm/v/refinore-mcp.svg)](https://www.npmjs.com/package/refinore-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)
[![Solana](https://img.shields.io/badge/Solana-ORE_Mining-purple.svg)](https://automine.refinore.com)

**Mine ORE on Solana with AI.** An MCP server that gives Cursor, Claude Desktop, Windsurf, and any MCP client full control over [refinORE's](https://automine.refinore.com) autonomous ORE mining platform.

---

## What is refinORE?

[refinORE](https://automine.refinore.com) is an autonomous mining platform for **ORE** — a proof-of-work token on the Solana blockchain. Unlike traditional crypto mining that requires GPUs, ORE mining happens on-chain through a grid-based game where miners deploy SOL, USDC, ORE, stORE, or SKR across squares to earn rewards.

refinORE automates the entire process: deploying funds, selecting optimal tiles, managing risk, and harvesting rewards — all from a clean API.

## What is refinore-mcp?

**refinore-mcp** is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that exposes refinORE's complete mining API as tools your AI agent can call directly. Instead of copy-pasting between a mining dashboard and your editor, just tell your AI:

> *"Start mining ORE with 0.05 SOL on 20 squares"*

And it does it.

Works with **Cursor**, **Claude Desktop**, **Windsurf**, **Cline**, and any MCP-compatible client.

**Other Options:**
- 🔨 **CLI Tool:** [refinore-cli](https://github.com/JussCubs/refinore-cli) — `npx -y refinore-cli --auto-mine` (for terminal users)
- 🤖 **OpenClaw Skill:** [ore-miner-skills](https://github.com/JussCubs/ore-miner-skills) — For OpenClaw/Clawdbot agents

---

## Quick Start

### 1. Get your API key

Sign up at [automine.refinore.com](https://automine.refinore.com) and generate an API key from your account settings.

### 2. Add to your MCP client

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "refinore": {
      "command": "npx",
      "args": ["-y", "refinore-mcp"],
      "env": {
        "REFINORE_API_KEY": "rsk_your_key_here"
      }
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "refinore": {
      "command": "npx",
      "args": ["-y", "refinore-mcp"],
      "env": {
        "REFINORE_API_KEY": "rsk_your_key_here"
      }
    }
  }
}
```

#### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "refinore": {
      "command": "npx",
      "args": ["-y", "refinore-mcp"],
      "env": {
        "REFINORE_API_KEY": "rsk_your_key_here"
      }
    }
  }
}
```

### 3. Start mining

Ask your AI agent:

- *"What's my refinORE wallet address?"*
- *"Start mining ORE with 0.02 SOL on 10 squares"*
- *"Check my mining session status"*
- *"What are my current balances?"*
- *"Show me the current round info"*

---

## Features

- 🔨 **12 MCP tools** covering every refinORE API endpoint
- ⛏️ **Full mining control** — start, stop, monitor sessions
- 📊 **Real-time data** — balances, rewards, round info, history
- 🤖 **Strategy automation** — create and launch reusable mining strategies
- 💎 **Multi-token support** — SOL, USDC, ORE, stORE, SKR
- 🛡️ **Risk management** — low, medium, high risk tolerance settings
- 📈 **Staking info** — stORE balances, APR, pending rewards
- ⚡ **Zero config** — just set your API key and go
- 🔒 **Secure** — API key stays in your local environment, never transmitted to third parties

---

## Tools Reference

### Account

| Tool | Description |
|------|-------------|
| `get_account_info` | Get your refinORE account info including Solana wallet address and deposit instructions. Call this first to discover your wallet. |

### Mining

| Tool | Description |
|------|-------------|
| `start_mining` | Start a new ORE mining session. Configure wallet, amount, squares, token, risk, and tile strategy. |
| `stop_mining` | Stop an active mining session. Optionally specify a session ID. |
| `get_mining_session` | Get current active mining session status, stats, and round info. |
| `get_mining_history` | Get past mining rounds with results and earnings. |

### Wallet & Rewards

| Tool | Description |
|------|-------------|
| `get_balances` | Get SOL, ORE, USDC, stORE, and SKR balances for a wallet. |
| `get_rewards` | Get unclaimed SOL, unrefined ORE, and bonus ORE rewards. |

### Round Info

| Tool | Description |
|------|-------------|
| `get_current_round` | Get current round number, time remaining, total deployed, motherlode, and EV. No auth required. |

### Strategies

| Tool | Description |
|------|-------------|
| `list_strategies` | List all saved auto-mining strategies. |
| `create_strategy` | Create a new strategy with name, amount, squares, token, and risk settings. |
| `start_strategy` | Launch an auto-mining session using a saved strategy. |

### Staking

| Tool | Description |
|------|-------------|
| `get_staking_info` | Get stORE balance, current APR, and pending staking rewards for a wallet. |

---

## Tool Parameters

### start_mining

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `wallet_address` | string | *required* | Your Solana wallet address |
| `sol_amount` | number | `0.01` | Amount to deploy per round |
| `num_squares` | number | `15` | Number of grid squares to mine |
| `mining_token` | enum | `"SOL"` | `SOL`, `USDC`, `ORE`, `stORE`, or `SKR` |
| `risk_tolerance` | enum | `"medium"` | `low`, `medium`, or `high` |
| `tile_selection_mode` | enum | `"optimal"` | `optimal`, `random`, or `custom` |

### create_strategy

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Name for the strategy |
| `solAmount` | number | Amount to deploy per round |
| `numSquares` | number | Number of grid squares |
| `miningToken` | string | Token to mine with |
| `riskTolerance` | string | Risk level |

---

## Example Conversations

### Check your setup
> **You:** What's my refinORE account info?
>
> **AI:** Your wallet address is `7xK...abc`. You have 0.5 SOL and 12.3 ORE. To deposit, send SOL to your wallet address.

### Start mining
> **You:** Start mining with 0.05 SOL on 20 squares, high risk
>
> **AI:** Mining session started! Session ID: `abc-123`. Deploying 0.05 SOL across 20 squares with high risk tolerance and optimal tile selection.

### Monitor progress
> **You:** How's my mining going?
>
> **AI:** Your session is active — round 4,217. You've earned 0.003 ORE so far this session. Time remaining in current round: 2m 15s.

### Create a strategy
> **You:** Create a conservative strategy called "Safe Miner" with 0.01 SOL on 10 squares
>
> **AI:** Strategy "Safe Miner" created with ID `strat-456`. 0.01 SOL, 10 squares, SOL token, low risk. You can start it anytime with start_strategy.

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REFINORE_API_KEY` | Yes | — | Your refinORE API key (starts with `rsk_`) |
| `REFINORE_API_URL` | No | `https://automine.refinore.com/api` | API base URL (for custom deployments) |

### Getting an API Key

1. Go to [automine.refinore.com](https://automine.refinore.com)
2. Create an account or sign in
3. Navigate to account settings
4. Generate a new API key
5. Copy the key (starts with `rsk_`)

---

## How ORE Mining Works

[ORE](https://ore.supply) is a proof-of-work token on Solana. Unlike Bitcoin mining that requires specialized hardware, ORE mining is accessible to everyone through on-chain transactions.

**refinORE** adds a game-theory layer: each round, miners deploy tokens across a grid of squares. When the round ends, one square is selected as the **motherlode** — miners on that square earn outsized rewards. The strategy is in choosing which squares to deploy on, how much to risk, and when to mine.

With **refinore-mcp**, your AI agent handles all of this autonomously. It can:

- Analyze current round conditions
- Deploy with optimal tile selection
- Monitor sessions and adjust strategy
- Track rewards and balances
- Create and manage reusable strategies

---

## Development

```bash
# Clone the repo
git clone https://github.com/JussCubs/refinore-mcp.git
cd refinore-mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
REFINORE_API_KEY=rsk_your_key node dist/index.js
```

### Local MCP config (for development)

```json
{
  "mcpServers": {
    "refinore": {
      "command": "node",
      "args": ["/path/to/refinore-mcp/dist/index.js"],
      "env": {
        "REFINORE_API_KEY": "rsk_your_key_here"
      }
    }
  }
}
```

---

## Links

- 🌐 **refinORE Platform** — [automine.refinore.com](https://automine.refinore.com)
- 📦 **npm Package** — [npmjs.com/package/refinore-mcp](https://www.npmjs.com/package/refinore-mcp)
- 🐙 **GitHub** — [github.com/JussCubs/refinore-mcp](https://github.com/JussCubs/refinore-mcp)
- 🐾 **ClawdHub Skills** — [clawhub.ai/skills](https://www.clawhub.ai/skills)
- 🤖 **Clawdbot** — [clawhub.ai](https://www.clawhub.ai)

---

## Related Projects

- **[Clawdbot](https://www.clawhub.ai)** — AI agent framework with MCP support
- **[OpenClaw](https://github.com/JussCubs)** — Open-source AI agent tools
- **[ORE](https://ore.supply)** — Proof-of-work token on Solana

---

## License

MIT © [JussCubs](https://github.com/JussCubs)
