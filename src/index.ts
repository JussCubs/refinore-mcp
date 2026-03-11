#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Configuration ───────────────────────────────────────────────────────────

const API_KEY = process.env.REFINORE_API_KEY;
const API_URL =
  process.env.REFINORE_API_URL || "https://automine.refinore.com/api";

// ─── API Helper ──────────────────────────────────────────────────────────────

async function apiCall(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
  requireAuth = true
): Promise<unknown> {
  if (requireAuth && !API_KEY) {
    throw new Error(
      "REFINORE_API_KEY environment variable is not set. " +
        "Get your API key at https://automine.refinore.com"
    );
  }

  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "refinore-mcp/1.0.0",
  };

  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const options: RequestInit = { method, headers };

  if (body && (method === "POST" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  console.error(`[refinore-mcp] ${method} ${path}`);

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `refinORE API error ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

// ─── Format Response ─────────────────────────────────────────────────────────

function formatResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "refinore-mcp",
  version: "1.2.0",
});

// ─── Tool 1: get_account_info ────────────────────────────────────────────────

server.tool(
  "get_account_info",
  "Get your refinORE account info including Solana wallet address and deposit instructions. Call this first to discover your wallet.",
  {},
  async () => {
    const data = await apiCall("GET", "/account/me");
    return formatResult(data);
  }
);

// ─── Tool 2: start_mining ────────────────────────────────────────────────────

server.tool(
  "start_mining",
  "Start a new ORE mining session on refinORE. Deploys SOL/USDC/ORE across squares on the mining grid. Configure amount, number of squares, token, risk tolerance, and tile selection strategy.",
  {
    wallet_address: z.string().describe("Your Solana wallet address"),
    sol_amount: z
      .number()
      .default(0.01)
      .describe("Amount to deploy per round (default: 0.01)"),
    num_squares: z
      .number()
      .default(15)
      .describe("Number of grid squares to mine (default: 15)"),
    mining_token: z
      .enum(["SOL", "USDC", "ORE", "stORE", "SKR"])
      .default("SOL")
      .describe("Token to use for mining (default: SOL)"),
    risk_tolerance: z
      .enum(["degen", "risky", "less-risky", "positive-ev"])
      .default("less-risky")
      .describe("Risk tolerance: 'degen' (always deploy), 'risky' (deploy most rounds), 'less-risky' (skip negative EV), 'positive-ev' (only deploy +EV)"),
    tile_selection_mode: z
      .enum(["optimal", "random", "custom", "odd", "even", "hot", "cold"])
      .default("optimal")
      .describe("Tile selection strategy: 'optimal' (AI-selected lowest competition), 'random', 'custom' (specify tiles), 'odd', 'even', 'hot' (tiles that win most often), 'cold' (tiles that win least often)"),
  },
  async (params) => {
    const data = await apiCall("POST", "/mining/start", {
      wallet_address: params.wallet_address,
      sol_amount: params.sol_amount,
      num_squares: params.num_squares,
      mining_token: params.mining_token,
      risk_tolerance: params.risk_tolerance,
      tile_selection_mode: params.tile_selection_mode,
    });
    return formatResult(data);
  }
);

// ─── Tool 3: stop_mining ─────────────────────────────────────────────────────

server.tool(
  "stop_mining",
  "Stop an active ORE mining session. Optionally specify a session ID, or stop the current active session.",
  {
    session_id: z
      .string()
      .optional()
      .describe("Session ID to stop (optional — stops active session if omitted)"),
  },
  async (params) => {
    const body: Record<string, unknown> = {};
    if (params.session_id) {
      body.session_id = params.session_id;
    }
    const data = await apiCall("POST", "/mining/stop", body);
    return formatResult(data);
  }
);

// ─── Tool 4: get_mining_session ──────────────────────────────────────────────

server.tool(
  "get_mining_session",
  "Get the status of your current active mining session, including stats and current round info.",
  {},
  async () => {
    const data = await apiCall("GET", "/mining/session");
    return formatResult(data);
  }
);

// ─── Tool 5: get_mining_history ──────────────────────────────────────────────

server.tool(
  "get_mining_history",
  "Get your past mining rounds history. Returns an array of completed mining rounds with results and earnings.",
  {
    limit: z
      .number()
      .default(20)
      .describe("Maximum number of rounds to return (default: 20)"),
  },
  async (params) => {
    const data = await apiCall("GET", `/mining/history?limit=${params.limit}`);
    return formatResult(data);
  }
);

// ─── Tool 6: get_balances ────────────────────────────────────────────────────

server.tool(
  "get_balances",
  "Get wallet token balances including SOL, ORE, USDC, stORE, and SKR for a given Solana wallet address.",
  {
    wallet_address: z.string().describe("Solana wallet address to check balances for"),
  },
  async (params) => {
    const data = await apiCall(
      "GET",
      `/wallet/balances?wallet=${encodeURIComponent(params.wallet_address)}`
    );
    return formatResult(data);
  }
);

// ─── Tool 7: get_rewards ─────────────────────────────────────────────────────

server.tool(
  "get_rewards",
  "Get unclaimed rewards for a wallet — includes unclaimed SOL, unrefined ORE, and bonus ORE.",
  {
    wallet_address: z.string().describe("Solana wallet address to check rewards for"),
  },
  async (params) => {
    const data = await apiCall(
      "GET",
      `/rewards?wallet=${encodeURIComponent(params.wallet_address)}`
    );
    return formatResult(data);
  }
);

// ─── Tool 8: get_current_round ───────────────────────────────────────────────

server.tool(
  "get_current_round",
  "Get the current mining round info — round number, time remaining, total deployed, motherlode, and expected value. This is a public endpoint (no auth required).",
  {},
  async () => {
    const data = await apiCall("GET", "/rounds/current", undefined, false);
    return formatResult(data);
  }
);

// ─── Tool 9: list_strategies ─────────────────────────────────────────────────

server.tool(
  "list_strategies",
  "List all your saved auto-mining strategies. Strategies define reusable mining configurations.",
  {},
  async () => {
    const data = await apiCall("GET", "/auto-strategies");
    return formatResult(data);
  }
);

// ─── Tool 10: create_strategy ────────────────────────────────────────────────

server.tool(
  "create_strategy",
  "Create a new auto-mining strategy with a name and mining parameters. Strategies can be started later with start_strategy.",
  {
    name: z.string().describe("Name for this strategy"),
    solAmount: z.number().describe("Amount to deploy per round"),
    numSquares: z.number().describe("Number of grid squares to mine"),
    miningToken: z
      .string()
      .describe("Token to mine with (SOL, USDC, ORE, stORE, SKR)"),
    riskTolerance: z
      .enum(["degen", "risky", "less-risky", "positive-ev"])
      .default("less-risky")
      .describe("Risk tolerance: 'degen' (always deploy), 'risky' (deploy most rounds), 'less-risky' (skip negative EV), 'positive-ev' (only deploy +EV)"),
  },
  async (params) => {
    const data = await apiCall("POST", "/auto-strategies", {
      name: params.name,
      solAmount: params.solAmount,
      numSquares: params.numSquares,
      miningToken: params.miningToken,
      riskTolerance: params.riskTolerance,
    });
    return formatResult(data);
  }
);

// ─── Tool 11: start_strategy ─────────────────────────────────────────────────

server.tool(
  "start_strategy",
  "Start mining using a saved strategy. Launches an auto-mining session with the strategy's predefined parameters.",
  {
    strategy_id: z.string().describe("ID of the strategy to start"),
  },
  async (params) => {
    const data = await apiCall("POST", "/mining/start-strategy", {
      strategy_id: params.strategy_id,
    });
    return formatResult(data);
  }
);

// ─── Tool 12: get_staking_info ───────────────────────────────────────────────

server.tool(
  "get_staking_info",
  "Get staking information for a wallet — stORE balance, current APR, and pending staking rewards.",
  {
    wallet_address: z.string().describe("Solana wallet address to check staking info for"),
  },
  async (params) => {
    const data = await apiCall(
      "GET",
      `/staking/info?wallet=${encodeURIComponent(params.wallet_address)}`
    );
    return formatResult(data);
  }
);

// ─── Tool 13: get_tile_stats ─────────────────────────────────────────────────

server.tool(
  "get_tile_stats",
  "Get hot and cold tile statistics from the last N rounds. Shows which tiles (0-24) have won the most/least — useful for building predictive tile strategies. Public endpoint, no auth required.",
  {
    limit: z
      .number()
      .default(100)
      .describe("Number of rounds to analyze (10-500, default: 100)"),
  },
  async (params) => {
    const data = await apiCall(
      "GET",
      `/rounds/tile-stats?limit=${params.limit}`,
      undefined,
      false
    );
    return formatResult(data);
  }
);

// ─── Tool 14: get_round_history ─────────────────────────────────────────────

server.tool(
  "get_round_history",
  "Get your personal mining round history — every round you deployed in with full details including tiles used, amounts, EV, results, SOL/ORE won, and more. Supports pagination.",
  {
    limit: z
      .number()
      .default(50)
      .describe("Number of rounds to return (1-500, default: 50)"),
    offset: z
      .number()
      .default(0)
      .describe("Offset for pagination (default: 0)"),
    session_id: z
      .string()
      .optional()
      .describe("Filter to a specific mining session ID (optional)"),
  },
  async (params) => {
    let path = `/rounds/my-history?limit=${params.limit}&offset=${params.offset}`;
    if (params.session_id) {
      path += `&session_id=${encodeURIComponent(params.session_id)}`;
    }
    const data = await apiCall("GET", path);
    return formatResult(data);
  }
);

// ─── Tool 15: live_edit_strategy ────────────────────────────────────────────

server.tool(
  "live_edit_strategy",
  "Live-edit a mining strategy between rounds WITHOUT stopping the session. Only send the fields you want to change — changes take effect on the next deployment round automatically. Perfect for dynamically adjusting tiles, amounts, or thresholds mid-session.",
  {
    strategy_id: z.string().describe("ID of the strategy to edit"),
    sol_amount: z.number().optional().describe("New SOL amount per round"),
    num_squares: z.number().optional().describe("New number of tiles (1-25)"),
    tile_selection_mode: z
      .enum(["optimal", "random", "custom", "odd", "even", "hot", "cold"])
      .optional()
      .describe("New tile selection mode"),
    custom_tiles: z
      .array(z.number())
      .optional()
      .describe("Custom tile indices 0-24 (API uses 0-indexed; tile 1 in the UI = index 0, tile 25 = index 24)"),
    skip_last_winning_square: z
      .boolean()
      .optional()
      .describe("Skip the tile that won last round"),
    mining_token: z
      .enum(["SOL", "USDC", "ORE", "stORE", "SKR"])
      .optional()
      .describe("Change mining token"),
    deployment_timing: z
      .number()
      .optional()
      .describe("Deployment timing in seconds (30-55)"),
    motherlode_threshold: z
      .number()
      .optional()
      .describe("Minimum motherlode ORE to deploy"),
    max_sol_deployed_threshold: z
      .number()
      .optional()
      .describe("Max total SOL deployed before skipping"),
  },
  async (params) => {
    const { strategy_id, ...updates } = params;
    // Filter out undefined values
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        body[key] = value;
      }
    }
    const data = await apiCall(
      "PATCH",
      `/auto-strategies/${encodeURIComponent(strategy_id)}/live`,
      body
    );
    return formatResult(data);
  }
);

// ─── Tool 16: delete_strategy ───────────────────────────────────────────────

server.tool(
  "delete_strategy",
  "Delete a saved auto-mining strategy by ID.",
  {
    strategy_id: z.string().describe("ID of the strategy to delete"),
  },
  async (params) => {
    const data = await apiCall(
      "DELETE",
      `/auto-strategies/${encodeURIComponent(params.strategy_id)}`
    );
    return formatResult(data);
  }
);

// ─── Tool 17: edit_session ───────────────────────────────────────────────────

server.tool(
  "edit_session",
  "Live-edit your active mining session between rounds WITHOUT stopping/restarting. Only send fields you want to change. For strategy-based sessions, use live_edit_strategy instead.",
  {
    sol_amount: z.number().optional().describe("New SOL amount per round"),
    num_squares: z.number().optional().describe("New number of tiles (1-25)"),
    tile_selection_mode: z.enum(["optimal", "random", "custom", "odd", "even", "hot", "cold"]).optional().describe("Tile selection strategy"),
    custom_tiles: z.array(z.number()).optional().describe("Custom tile indices 0-24 (API uses 0-indexed; tile 1 in the UI = index 0, tile 25 = index 24)"),
    skip_last_winning_square: z.boolean().optional().describe("Skip the tile that won last round"),
    mining_token: z.enum(["SOL", "USDC", "ORE", "stORE", "SKR"]).optional().describe("Mining token"),
    deployment_timing_seconds: z.number().optional().describe("Deployment timing in seconds (0-60)"),
    risk_tolerance: z.enum(["degen", "risky", "less-risky", "positive-ev"]).optional().describe("Risk tolerance level"),
    custom_ev_threshold: z.number().optional().describe("Custom EV threshold percentage"),
    motherlode_threshold: z.number().optional().describe("Minimum motherlode ORE to deploy"),
    max_sol_deployed_threshold: z.number().optional().describe("Max total SOL deployed before skipping"),
  },
  async (params) => {
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) body[key] = value;
    }
    const data = await apiCall("PATCH", "/mining/session/edit", body);
    return formatResult(data);
  }
);

// ─── Tool 18: create_swap_order ─────────────────────────────────────────────

server.tool(
  "create_swap_order",
  "Create a DCA (dollar-cost averaging) or limit order for automated token swaps. DCA orders execute at regular intervals. Limit orders execute when price conditions are met.",
  {
    name: z.string().describe("Name for this order (e.g., 'Daily ORE Buy')"),
    order_type: z.enum(["dca", "limit"]).describe("Order type: 'dca' for recurring or 'limit' for price-triggered"),
    swap_type: z.enum(["buy", "sell"]).describe("'buy' to buy ORE, 'sell' to sell ORE"),
    trigger_field: z.enum(["ore_price", "time"]).describe("What triggers execution: 'ore_price' or 'time'"),
    trigger_operator: z.enum(["gt", "gte", "lt", "lte", "eq"]).describe("Comparison operator for trigger"),
    trigger_value: z.number().optional().default(0).describe("Trigger value (price in USD or time in seconds)"),
    ore_amount: z.number().describe("Amount of ORE to buy/sell per execution"),
    execution_timing: z.number().optional().default(30).describe("When in the round to execute (0-60 seconds)"),
    repeat_enabled: z.boolean().optional().default(false).describe("Enable recurring execution"),
    repeat_interval_rounds: z.number().optional().default(1).describe("Rounds between executions (minimum 1)"),
    max_executions: z.number().optional().describe("Maximum total executions (null = unlimited)"),
  },
  async (params) => {
    const data = await apiCall("POST", "/auto-swap-orders", params);
    return formatResult(data);
  }
);

// ─── Tool 19: list_swap_orders ──────────────────────────────────────────────

server.tool(
  "list_swap_orders",
  "List all your auto swap orders (DCA and limit orders).",
  {},
  async () => {
    const data = await apiCall("GET", "/auto-swap-orders");
    return formatResult(data);
  }
);

// ─── Tool 20: delete_swap_order ─────────────────────────────────────────────

server.tool(
  "delete_swap_order",
  "Delete an auto swap order by ID.",
  {
    order_id: z.string().describe("The swap order ID to delete"),
  },
  async (params) => {
    const data = await apiCall("DELETE", `/auto-swap-orders/${encodeURIComponent(params.order_id)}`);
    return formatResult(data);
  }
);

// ─── Tool 21: get_swap_history ──────────────────────────────────────────────

server.tool(
  "get_swap_history",
  "Get your swap operations history — shows executed DCA buys, limit order fills, and swap results.",
  {
    limit: z.number().optional().default(10).describe("Number of operations to return"),
    offset: z.number().optional().default(0).describe("Pagination offset"),
  },
  async (params) => {
    const data = await apiCall("GET", `/auto-swap-orders/history?limit=${params.limit}&offset=${params.offset}`);
    return formatResult(data);
  }
);

// ─── Start Server ────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  console.error("[refinore-mcp] Starting refinORE MCP server...");
  await server.connect(transport);
  console.error("[refinore-mcp] Server connected and ready");
}

main().catch((error) => {
  console.error("[refinore-mcp] Fatal error:", error);
  process.exit(1);
});
