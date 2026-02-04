# refinore-mcp — MCP Server Specification

## Overview
An MCP (Model Context Protocol) server that exposes refinORE's ORE mining API as tools for AI agents in Cursor, Claude Desktop, Windsurf, and any MCP-compatible client.

## Tech Stack
- TypeScript
- `@modelcontextprotocol/sdk` (official MCP SDK)
- `zod` for input validation
- stdio transport (standard for MCP servers)
- Published to npm as `refinore-mcp`

## Configuration
User sets environment variable:
```
REFINORE_API_KEY=rsk_your_key_here
```

Optional:
```
REFINORE_API_URL=https://automine.refinore.com/api  (default)
```

## MCP Client Configuration

### Claude Desktop / Cursor / Windsurf
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

## Tools (12 total)

### Account
1. **`get_account_info`** — GET /account/me
   - No params
   - Returns: wallet_address, email, deposit_instructions
   - Description: "Get your refinORE account info including Solana wallet address and deposit instructions. Call this first to discover your wallet."

### Mining
2. **`start_mining`** — POST /mining/start
   - Params: wallet_address (string, required), sol_amount (number, default 0.01), num_squares (number, default 15), mining_token (enum: SOL|USDC|ORE|stORE|SKR, default SOL), risk_tolerance (enum: low|medium|high, default medium), tile_selection_mode (enum: optimal|random|custom, default optimal)
   - Returns: session id, status

3. **`stop_mining`** — POST /mining/stop
   - Params: session_id (string, optional)
   - Returns: success

4. **`get_mining_session`** — GET /mining/session
   - No params
   - Returns: active session status, stats, current round info

5. **`get_mining_history`** — GET /mining/history
   - Params: limit (number, default 20)
   - Returns: array of past mining rounds

### Wallet
6. **`get_balances`** — GET /wallet/balances
   - Params: wallet_address (string, required)
   - Returns: SOL, ORE, USDC, stORE, SKR balances

7. **`get_rewards`** — GET /rewards
   - Params: wallet_address (string, required)
   - Returns: unclaimed SOL, unrefined ORE, bonus ORE

### Round
8. **`get_current_round`** — GET /rounds/current
   - No params (public endpoint, no auth needed)
   - Returns: round number, time remaining, total deployed, motherlode, EV

### Strategy
9. **`list_strategies`** — GET /auto-strategies
   - No params
   - Returns: array of saved strategies

10. **`create_strategy`** — POST /auto-strategies
    - Params: name (string), solAmount (number), numSquares (number), miningToken (string), riskTolerance (string)
    - Returns: created strategy

11. **`start_strategy`** — POST /mining/start-strategy
    - Params: strategy_id (string, required)
    - Returns: session id

### Staking
12. **`get_staking_info`** — GET /staking/info
    - Params: wallet_address (string, required)
    - Returns: stORE balance, APR, rewards

## File Structure
```
refinore-mcp/
├── src/
│   └── index.ts          # MCP server with all tools
├── package.json          # npm package config
├── tsconfig.json         # TypeScript config
├── README.md             # Comprehensive docs + SEO
├── LICENSE               # MIT
└── .github/
    └── workflows/
        └── publish.yml   # Auto-publish to npm on release
```

## Key Implementation Details

### src/index.ts
- Use `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
- Use `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
- Use `zod` for all tool input schemas
- Helper function `apiCall(method, path, body?)` that handles auth header
- Read `REFINORE_API_KEY` from `process.env`
- Read `REFINORE_API_URL` from `process.env` with default `https://automine.refinore.com/api`
- NEVER log to stdout (breaks stdio transport) — use stderr only

### package.json
```json
{
  "name": "refinore-mcp",
  "version": "1.0.0",
  "description": "MCP server for refinORE ORE mining on Solana. Mine ORE autonomously via Cursor, Claude, or any MCP client.",
  "main": "dist/index.js",
  "bin": {
    "refinore-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "keywords": [
    "mcp", "model-context-protocol", "refinore", "ore", "solana",
    "mining", "ai-agent", "cursor", "claude", "windsurf",
    "openclaw", "clawdbot", "defi", "crypto"
  ],
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

### README.md SEO Keywords
- "refinORE MCP server"
- "mine ORE on Solana with Cursor"
- "mine ORE on Solana with Claude"
- "Solana mining MCP"
- "ORE mining AI agent"
- "OpenClaw MCP"
- "Clawdbot MCP"
- "refinORE API"
- "autonomous ORE mining"
- "crypto MCP server"

### README.md Structure
1. Banner/title with badges (npm version, license, MCP)
2. One-line description
3. Quick start (npx command + config)
4. Features list
5. Tool reference (all 12 tools with descriptions)
6. Configuration details
7. Example usage scenarios
8. Links to refinORE, GitHub, ClawdHub skill
9. License

## Post-Build: Registry Submissions
After npm publish, submit to:
1. **Smithery.ai** — largest MCP registry, auto-discovers from npm
2. **Glama.ai** — auto-discovers from GitHub, needs README + LICENSE
3. **MCP Registry** (official) — mcp.run
4. **PulseMCP** — pulsemcp.com
5. **mcp.so** — another popular directory

## Important
- The `bin` field in package.json must point to `dist/index.js`
- The `dist/index.js` must start with `#!/usr/bin/env node`
- NEVER use console.log — only console.error (stderr) for debugging
- All tools must have clear, descriptive names and descriptions
- Tool descriptions should explain WHAT the tool does and WHEN to use it
