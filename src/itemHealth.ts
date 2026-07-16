import { itemList, itemGet, PlaidCliError } from "./plaidCli.js";

export type ItemHealthStatus =
  | "healthy"
  | "re_auth_required"
  | "item_locked"
  | "pending_expiration"
  | "not_found"
  | "unknown_error";

export interface ItemHealthResult {
  itemId: string;
  status: ItemHealthStatus;
  reason?: string;
}

const KNOWN_CODES: Record<string, ItemHealthStatus> = {
  ITEM_LOGIN_REQUIRED: "re_auth_required",
  ITEM_LOCKED: "item_locked",
  PENDING_EXPIRATION: "pending_expiration",
  ITEM_NOT_FOUND: "not_found",
};

export function classifyItemStatus(
  stderr: string,
): { status: ItemHealthStatus; reason?: string } {
  let parsed: { error?: { code?: string; message?: string } };
  try {
    parsed = JSON.parse(stderr);
  } catch {
    return { status: "unknown_error", reason: stderr };
  }

  const code = parsed?.error?.code;
  if (code && code in KNOWN_CODES) {
    return { status: KNOWN_CODES[code] };
  }
  return { status: "unknown_error", reason: parsed?.error?.message ?? stderr };
}

export async function checkItemHealth(itemId?: string): Promise<ItemHealthResult[]> {
  const targetIds = itemId
    ? [itemId]
    : ((await itemList()) as { items: Array<{ item_id: string }> }).items.map(
        (item) => item.item_id,
      );

  const results: ItemHealthResult[] = [];
  for (const id of targetIds) {
    try {
      await itemGet(id);
      results.push({ itemId: id, status: "healthy" });
    } catch (err) {
      if (err instanceof PlaidCliError) {
        results.push({ itemId: id, ...classifyItemStatus(err.stderr) });
      } else {
        results.push({ itemId: id, status: "unknown_error", reason: String(err) });
      }
    }
  }
  return results;
}
