import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class PlaidCliError extends Error {
  readonly stderr: string;
  readonly exitCode: number | null;

  constructor(stderr: string, exitCode: number | null) {
    super(`plaid CLI exited with code ${exitCode}: ${stderr.trim()}`);
    this.name = "PlaidCliError";
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

async function runPlaidCli(args: string[]): Promise<unknown> {
  try {
    const { stdout } = await execFileAsync("plaid", [...args, "--json"]);
    return JSON.parse(stdout);
  } catch (err) {
    const execErr = err as { stderr?: string; code?: unknown };
    const exitCode = typeof execErr.code === "number" ? execErr.code : null;
    throw new PlaidCliError(execErr.stderr ?? String(err), exitCode);
  }
}

export async function itemList(): Promise<unknown> {
  return runPlaidCli(["item", "list"]);
}

export async function itemGet(itemId: string): Promise<unknown> {
  return runPlaidCli(["item", "get", "--item", itemId]);
}

export async function balance(
  opts: { item?: string; all?: boolean } = {},
): Promise<unknown> {
  const args = ["balance"];
  if (opts.item) args.push("--item", opts.item);
  if (opts.all) args.push("--all");
  return runPlaidCli(args);
}

export async function transactionsList(
  opts: {
    item?: string;
    all?: boolean;
    startDate?: string;
    endDate?: string;
    count?: number;
    offset?: number;
  } = {},
): Promise<unknown> {
  const args = ["transactions", "list"];
  if (opts.item) args.push("--item", opts.item);
  if (opts.all) args.push("--all");
  if (opts.startDate) args.push("--start-date", opts.startDate);
  if (opts.endDate) args.push("--end-date", opts.endDate);
  if (opts.count !== undefined) args.push("--count", String(opts.count));
  if (opts.offset !== undefined) args.push("--offset", String(opts.offset));
  return runPlaidCli(args);
}

export async function transactionsSync(
  opts: { item?: string; all?: boolean; limit?: number; pageSize?: number } = {},
): Promise<unknown> {
  const args = ["transactions", "sync"];
  if (opts.item) args.push("--item", opts.item);
  if (opts.all) args.push("--all");
  if (opts.limit !== undefined) args.push("--limit", String(opts.limit));
  if (opts.pageSize !== undefined) args.push("--page-size", String(opts.pageSize));
  return runPlaidCli(args);
}
