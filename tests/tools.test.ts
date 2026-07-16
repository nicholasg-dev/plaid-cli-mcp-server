import { describe, it, expect } from "vitest";
import {
  listItemsHandler,
  getItemHandler,
  getBalancesHandler,
  listTransactionsHandler,
  syncTransactionsHandler,
  checkItemHealthHandler,
} from "../src/tools.js";

describe("tool handlers", () => {
  it("listItemsHandler returns non-error text content", async () => {
    const result = await listItemsHandler();
    expect(result.isError).toBeUndefined();
    expect(result.content[0].type).toBe("text");
    expect(() => JSON.parse(result.content[0].text)).not.toThrow();
  });

  it("getItemHandler returns isError for a nonexistent item", async () => {
    const result = await getItemHandler({ item: "this-item-does-not-exist-xyz" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("ITEM_NOT_FOUND");
  });

  it("getBalancesHandler returns non-error content for the real item", async () => {
    const result = await getBalancesHandler({});
    expect(result.isError).toBeUndefined();
  });

  it("listTransactionsHandler returns non-error content with default range", async () => {
    const result = await listTransactionsHandler({});
    expect(result.isError).toBeUndefined();
  });

  it("syncTransactionsHandler returns non-error content", async () => {
    const result = await syncTransactionsHandler({});
    expect(result.isError).toBeUndefined();
  });

  it("checkItemHealthHandler reports healthy for the real linked item", async () => {
    const result = await checkItemHealthHandler({});
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as Array<{ status: string }>;
    expect(parsed[0].status).toBe("healthy");
  });
});
