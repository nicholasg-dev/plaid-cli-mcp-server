import { describe, it, expect } from "vitest";
import {
  itemList,
  itemGet,
  balance,
  transactionsList,
  transactionsSync,
  PlaidCliError,
} from "../src/plaidCli.js";

describe("plaidCli", () => {
  it("itemList resolves with at least one linked item", async () => {
    const result = (await itemList()) as { items: Array<{ item_id: string }> };
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
    expect(typeof result.items[0].item_id).toBe("string");
  });

  it("itemGet resolves accounts for a real linked item", async () => {
    const list = (await itemList()) as { items: Array<{ item_id: string }> };
    const itemId = list.items[0].item_id;
    const result = (await itemGet(itemId)) as { accounts: unknown[] };
    expect(Array.isArray(result.accounts)).toBe(true);
    expect(result.accounts.length).toBeGreaterThan(0);
  });

  it("itemGet rejects with PlaidCliError for a nonexistent item", async () => {
    await expect(itemGet("this-item-does-not-exist-xyz")).rejects.toBeInstanceOf(
      PlaidCliError,
    );
  });

  it("PlaidCliError carries the CLI's stderr and a non-zero exit code", async () => {
    try {
      await itemGet("this-item-does-not-exist-xyz");
      expect.unreachable("expected itemGet to reject");
    } catch (err) {
      expect(err).toBeInstanceOf(PlaidCliError);
      const cliErr = err as PlaidCliError;
      expect(cliErr.exitCode).toBe(1);
      expect(cliErr.stderr).toContain("ITEM_NOT_FOUND");
    }
  });
});

describe("plaidCli balances and transactions", () => {
  it("balance resolves without args (single linked item)", async () => {
    const result = (await balance({})) as Record<string, unknown>;
    expect(result).toBeTypeOf("object");
  });

  it("transactionsList resolves with the default date range", async () => {
    const result = (await transactionsList({})) as Record<string, unknown>;
    expect(result).toBeTypeOf("object");
  });

  it("transactionsSync resolves without a prior cursor", async () => {
    const result = (await transactionsSync({})) as Record<string, unknown>;
    expect(result).toBeTypeOf("object");
  });

  it("balance rejects with PlaidCliError for a nonexistent item", async () => {
    await expect(balance({ item: "this-item-does-not-exist-xyz" })).rejects.toBeInstanceOf(
      PlaidCliError,
    );
  });
});
