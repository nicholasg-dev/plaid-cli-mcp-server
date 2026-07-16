import { describe, it, expect } from "vitest";
import { createServer } from "../src/index.js";

describe("createServer", () => {
  it("registers all six tools without throwing", () => {
    expect(() => createServer()).not.toThrow();
  });
});
