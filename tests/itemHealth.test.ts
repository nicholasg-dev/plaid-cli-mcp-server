import { describe, it, expect } from "vitest";
import { classifyItemStatus, checkItemHealth } from "../src/itemHealth.js";

describe("classifyItemStatus", () => {
  it("maps ITEM_LOGIN_REQUIRED to re_auth_required", () => {
    const stderr = '{"error":{"code":"ITEM_LOGIN_REQUIRED","message":"re-auth needed","type":"ITEM_ERROR"}}';
    expect(classifyItemStatus(stderr)).toEqual({ status: "re_auth_required" });
  });

  it("maps ITEM_LOCKED to item_locked", () => {
    const stderr = '{"error":{"code":"ITEM_LOCKED","message":"locked","type":"ITEM_ERROR"}}';
    expect(classifyItemStatus(stderr)).toEqual({ status: "item_locked" });
  });

  it("maps PENDING_EXPIRATION to pending_expiration", () => {
    const stderr = '{"error":{"code":"PENDING_EXPIRATION","message":"expiring","type":"ITEM_ERROR"}}';
    expect(classifyItemStatus(stderr)).toEqual({ status: "pending_expiration" });
  });

  it("maps ITEM_NOT_FOUND to not_found", () => {
    const stderr = '{"error":{"code":"ITEM_NOT_FOUND","message":"no item matching \\"x\\" found","type":"INVALID_INPUT"}}';
    expect(classifyItemStatus(stderr)).toEqual({ status: "not_found" });
  });

  it("falls back to unknown_error with the message for an unrecognized code", () => {
    const stderr = '{"error":{"code":"SOME_OTHER_CODE","message":"weird thing happened","type":"API_ERROR"}}';
    expect(classifyItemStatus(stderr)).toEqual({
      status: "unknown_error",
      reason: "weird thing happened",
    });
  });

  it("falls back to unknown_error with the raw text for unparseable stderr", () => {
    expect(classifyItemStatus("not json at all")).toEqual({
      status: "unknown_error",
      reason: "not json at all",
    });
  });
});

describe("checkItemHealth", () => {
  it("reports healthy for the real linked item(s)", async () => {
    const results = await checkItemHealth();
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.status).toBe("healthy");
      expect(result.reason).toBeUndefined();
    }
  });

  it("reports not_found for a bogus item id, without throwing", async () => {
    const results = await checkItemHealth("this-item-does-not-exist-xyz");
    expect(results).toEqual([{ itemId: "this-item-does-not-exist-xyz", status: "not_found" }]);
  });
});
