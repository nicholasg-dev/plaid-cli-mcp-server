import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  listItemsSchema,
  listItemsHandler,
  getItemSchema,
  getItemHandler,
  getBalancesSchema,
  getBalancesHandler,
  listTransactionsSchema,
  listTransactionsHandler,
  syncTransactionsSchema,
  syncTransactionsHandler,
  checkItemHealthSchema,
  checkItemHealthHandler,
} from "./tools.js";

export function createServer(): McpServer {
  const server = new McpServer({ name: "plaid", version: "0.1.0" });

  server.registerTool(
    "list_items",
    {
      description: "List every Plaid item linked via the plaid CLI.",
      inputSchema: listItemsSchema,
    },
    listItemsHandler,
  );

  server.registerTool(
    "get_item",
    {
      description: "Get one linked Plaid item and the accounts it contains.",
      inputSchema: getItemSchema,
    },
    getItemHandler,
  );

  server.registerTool(
    "get_balances",
    {
      description: "Get current balances for one or all linked Plaid items.",
      inputSchema: getBalancesSchema,
    },
    getBalancesHandler,
  );

  server.registerTool(
    "list_transactions",
    {
      description: "List transactions for a date range (default: last 30 days).",
      inputSchema: listTransactionsSchema,
    },
    listTransactionsHandler,
  );

  server.registerTool(
    "sync_transactions",
    {
      description: "Incrementally sync transactions using Plaid's cursor-based sync.",
      inputSchema: syncTransactionsSchema,
    },
    syncTransactionsHandler,
  );

  server.registerTool(
    "check_item_health",
    {
      description:
        "Check whether one or all linked Plaid items are healthy or need re-authentication.",
      inputSchema: checkItemHealthSchema,
    },
    checkItemHealthHandler,
  );

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
