import { z } from "zod";
import {
  itemList,
  itemGet,
  balance,
  transactionsList,
  transactionsSync,
  PlaidCliError,
} from "./plaidCli.js";
import { checkItemHealth } from "./itemHealth.js";

interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: true;
}

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown): ToolResult {
  const message = err instanceof PlaidCliError ? err.stderr : String(err);
  return { content: [{ type: "text", text: message }], isError: true };
}

// list_items
export const listItemsSchema = {};
export async function listItemsHandler(): Promise<ToolResult> {
  try {
    return ok(await itemList());
  } catch (err) {
    return errorResult(err);
  }
}

// get_item
export const getItemSchema = { item: z.string() };
export async function getItemHandler(args: { item: string }): Promise<ToolResult> {
  try {
    return ok(await itemGet(args.item));
  } catch (err) {
    return errorResult(err);
  }
}

// get_balances
export const getBalancesSchema = {
  item: z.string().optional(),
  all: z.boolean().optional(),
};
export async function getBalancesHandler(args: {
  item?: string;
  all?: boolean;
}): Promise<ToolResult> {
  try {
    return ok(await balance(args));
  } catch (err) {
    return errorResult(err);
  }
}

// list_transactions
export const listTransactionsSchema = {
  item: z.string().optional(),
  all: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  count: z.number().int().optional(),
  offset: z.number().int().optional(),
};
export async function listTransactionsHandler(args: {
  item?: string;
  all?: boolean;
  startDate?: string;
  endDate?: string;
  count?: number;
  offset?: number;
}): Promise<ToolResult> {
  try {
    return ok(await transactionsList(args));
  } catch (err) {
    return errorResult(err);
  }
}

// sync_transactions
export const syncTransactionsSchema = {
  item: z.string().optional(),
  all: z.boolean().optional(),
  limit: z.number().int().optional(),
  pageSize: z.number().int().optional(),
};
export async function syncTransactionsHandler(args: {
  item?: string;
  all?: boolean;
  limit?: number;
  pageSize?: number;
}): Promise<ToolResult> {
  try {
    return ok(await transactionsSync(args));
  } catch (err) {
    return errorResult(err);
  }
}

// check_item_health
export const checkItemHealthSchema = { item: z.string().optional() };
export async function checkItemHealthHandler(args: {
  item?: string;
}): Promise<ToolResult> {
  try {
    return ok(await checkItemHealth(args.item));
  } catch (err) {
    return errorResult(err);
  }
}
