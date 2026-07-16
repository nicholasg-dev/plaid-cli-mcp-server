# plaid-mcp

**Let an AI coding assistant (like Claude Code) answer questions about your
own bank balances and transactions — by talking to the official [Plaid
CLI](https://plaid.com/docs/resources/cli/) on your own computer.**

This project doesn't store your bank data, doesn't see your bank
credentials, and doesn't talk to Plaid's servers itself. It's a small
translator program that sits between an AI assistant and a tool you already
trust (the Plaid CLI), so the assistant can ask it questions like "what's
my checking account balance?" or "list last month's transactions."

If you've never heard of "MCP" or "Claude Code" before, start with the next
section — it explains everything from scratch. If you already know what
those are and just want the tool reference, jump to
[Tool reference](#tool-reference).

## Contents

- [New here? Start with this](#new-here-start-with-this)
- [Is this safe? / Who should (and shouldn't) use this](#is-this-safe--who-should-and-shouldnt-use-this)
- [Glossary](#glossary)
- [Prerequisites](#prerequisites)
- [Setting up a Plaid account and the Plaid CLI](#setting-up-a-plaid-account-and-the-plaid-cli)
- [Quick start](#quick-start)
- [Registering with Claude Code](#registering-with-claude-code)
- [Using this with OpenCode](#using-this-with-opencode)
- [Tool reference](#tool-reference)
- [Error handling model](#error-handling-model)
- [Item health statuses](#item-health-statuses)
- [Project structure](#project-structure)
- [Development](#development)
- [Frequently asked questions](#frequently-asked-questions)
- [Troubleshooting](#troubleshooting)
- [Non-goals / scope](#non-goals--scope)
- [License](#license)

## New here? Start with this

Three things you need to know about before any of this will make sense:

**Plaid** is a company that banks and financial apps use to securely
connect to your bank account — it's the technology behind the "Connect your
bank" button in apps like Venmo or budgeting apps. Plaid also publishes a
[command-line tool called the Plaid CLI](https://plaid.com/docs/resources/cli/)
that lets a developer log in to their own Plaid account and pull their own
linked bank data from a terminal, without writing any code.

**MCP (Model Context Protocol)** is an open standard that lets an AI
assistant call out to external programs — called "tools" — to do things it
can't do on its own, like read a file, run a search, or (in this case) ask
the Plaid CLI for your account balance. An "MCP server" is just a small
program that offers a fixed set of these tools over a standard interface.
This project *is* an MCP server: it offers six tools (listed below) that
all revolve around reading Plaid data.

**[Claude Code](https://claude.com/claude-code)** is Anthropic's official
command-line AI coding assistant. It can be extended with MCP servers, so
that in addition to reading and writing code, it can also call out to
tools like this one. This project was built for and tested against Claude
Code, but since MCP is an open standard, any MCP-compatible client should
be able to use it too — this README also includes setup steps for
[OpenCode](https://opencode.ai/), a popular open-source alternative (see
[Using this with OpenCode](#using-this-with-opencode)), and the same
general approach should work for other MCP clients as well.

Put together: **this repository is code you run on your own computer** that
lets Claude Code (or another MCP client) ask your already-set-up Plaid CLI
for your own bank data, and hand the answer back to you in conversation —
e.g. "What did I spend on groceries last week?"

## Is this safe? / Who should (and shouldn't) use this

**This project never sees your bank login, and never talks to Plaid's
servers directly.** All of that is handled entirely by the official Plaid
CLI, which you install and log into yourself, independently of this
project. This server's only job is to run CLI commands like
`plaid balance --json` as a subprocess and hand back whatever the CLI
prints out. There is no code anywhere in this repository that stores,
transmits, or has access to a Plaid API key, access token, or bank
password — which is also exactly why it's safe for this repository to be
public: there's nothing secret in it to leak.

This is a good fit for you if:
- You're comfortable using a terminal / command line.
- You already use (or are willing to set up) the Plaid CLI with your own
  Plaid account and a real linked bank account.
- You use Claude Code (or another MCP-compatible AI assistant) and want it
  to be able to answer questions about your own finances.

This is **not**:
- A hosted service — there's no server to sign up for; you run it
  yourself, locally, and it only ever talks to your own machine's Plaid
  CLI.
- A way to view other people's bank data, or anyone's data but your own
  linked Plaid account(s).
- Officially affiliated with Plaid or Anthropic — it's an independent,
  personal project that happens to use both of their tools.

## Glossary

Terms used throughout this README, in case any are unfamiliar:

| Term | Meaning |
|---|---|
| **Terminal / command line / shell** | A text-based way of running programs on your computer, instead of clicking icons. On macOS this is the "Terminal" app; the commands in this README are typed there. |
| **Repository ("repo")** | A folder of code tracked by Git (see below), often hosted on a site like GitHub so others can view or download it. |
| **Git / `git clone`** | Git is the version-control tool that tracks changes to code. `git clone <url>` downloads a copy of a repository to your computer. |
| **Node.js / `npm`** | Node.js is a runtime for running JavaScript/TypeScript code outside a web browser; this project is written in TypeScript and runs on Node.js. `npm` is Node's package manager — `npm install` downloads the libraries this project depends on. |
| **Plaid Item** | Plaid's term for one linked bank connection (e.g. "my checking account at Bank X"). Referred to as `item` or `item_id` throughout this README and in the tools below. |
| **MCP server** | A program that exposes a set of "tools" an AI assistant can call. This project is one. |
| **Tool** | One specific action an MCP server offers — e.g. `get_balances`. Each tool has defined inputs and returns a defined kind of result. |
| **stdio transport** | The way this MCP server communicates with its client (like Claude Code): by reading/writing structured messages over standard input/output, the same input/output channel a terminal program normally uses for text. You don't need to understand the mechanics of this — it just means "runs locally as a subprocess," not "listens on the network." |
| **`--json` flag** | A flag supported by the Plaid CLI that makes it print machine-readable JSON output instead of human-formatted text. This server always uses it. |

## Prerequisites

You'll need all of the following installed and working *before* setting up
this project. None of them are things this project installs for you.

| Requirement | What it is | How to get it |
|---|---|---|
| A terminal | See [glossary](#glossary) | Built into macOS/Linux ("Terminal"); on Windows, use [WSL](https://learn.microsoft.com/windows/wsl/install) or Git Bash. |
| [Git](https://git-scm.com/) | Used to download this repository | `brew install git` (macOS) or see [git-scm.com/downloads](https://git-scm.com/downloads) |
| [Node.js](https://nodejs.org/) v22 or newer | Runs this project's code | Download from [nodejs.org](https://nodejs.org/) (includes `npm`), or `brew install node` on macOS |
| [Plaid CLI](https://plaid.com/docs/resources/cli/) (`plaid`) | The tool this server talks to | See [Setting up a Plaid account and the Plaid CLI](#setting-up-a-plaid-account-and-the-plaid-cli), below |
| A Plaid account, logged in via the CLI | Lets the CLI actually fetch your data | See [Setting up a Plaid account and the Plaid CLI](#setting-up-a-plaid-account-and-the-plaid-cli), below |
| At least one linked bank ("Item") | The actual bank connection you want to ask about | See [Setting up a Plaid account and the Plaid CLI](#setting-up-a-plaid-account-and-the-plaid-cli), below |
| [Claude Code](https://claude.com/claude-code) | The AI assistant that will use this server | See Anthropic's [installation instructions](https://docs.claude.com/en/docs/claude-code) |

**Check your Plaid CLI setup works before going any further** — every tool
in this project will fail the same way if this part isn't working yet:

```bash
plaid config           # shows whether you're logged in
plaid item list --json # should print your linked bank(s) as JSON, not an error
```

If either of those doesn't work, fix that first (usually by running
`plaid login` and/or `plaid link`, both covered step by step below) — this
project can't do anything the CLI itself can't already do.

## Setting up a Plaid account and the Plaid CLI

If you've never used Plaid before, this section walks through everything
from "I have no Plaid account" to "the CLI can see my real bank balance" —
all of it happens through Plaid's own CLI and dashboard, before you ever
touch this project's code.

### 1. Install the Plaid CLI

The [official Plaid CLI docs](https://plaid.com/docs/resources/cli/) only
document one installation method, via [Homebrew](https://brew.sh/):

```bash
brew install plaid/plaid-cli/plaid
```

- **macOS:** works directly, as above. If you don't have Homebrew yet, install
  it first from [brew.sh](https://brew.sh/).
- **Linux:** Homebrew also works on Linux ([Linuxbrew](https://docs.brew.sh/Homebrew-on-Linux)) — install Homebrew first, then run the same command.
- **Windows:** Plaid doesn't document a native Windows install. The most
  reliable path is to install [WSL](https://learn.microsoft.com/windows/wsl/install)
  (Windows Subsystem for Linux), then install Homebrew and the CLI inside
  your WSL Linux environment as above.

Confirm it installed correctly:

```bash
plaid --version
```

### 2. Create a Plaid account

If you don't already have one, sign up right from the CLI:

```bash
plaid register
```

This opens Plaid's dashboard signup page in your browser. Create your
account there (email/password or SSO, plus verifying your email) — this is
Plaid's own signup flow, not anything specific to this project.

Every new Plaid account automatically gets access to the **Sandbox**
environment — a fake/test environment with fake banks and fake data, meant
for developers to try things out safely. Sandbox alone isn't enough to see
your own real bank data — for that, you need Production access, which is
the next step.

### 3. Log in via the CLI

```bash
plaid login
```

This opens your browser to log in to the account you just created. Once
you approve it, the CLI stores your login locally and automatically
fetches your API keys — you don't need to find or copy/paste any keys
yourself.

### 4. Get approved for Production access (to use a real bank)

By default your account can only use Plaid's fake Sandbox data. To connect
an actual bank account, you need to apply for Plaid's **Trial** plan:

```bash
plaid trial
```

This opens a short application form in your browser — no business
paperwork required for the Trial plan, and Plaid states that around 90% of
applicants are auto-approved within about 60 seconds. Once approved, pull
down your newly-unlocked Production API keys:

```bash
plaid keys fetch
```

### 5. Link a real bank account

```bash
plaid link
```

This opens Plaid's own "Link" flow in your browser — the same secure
bank-connection widget used by apps like Venmo. Search for your bank, log
in with your real online banking credentials (this happens inside Plaid's
own widget — this project, and the Plaid CLI itself, never see or store
your bank password), and choose which account(s) to connect. Plaid calls
each connection you create this way an **Item** (see
[Glossary](#glossary)).

### 6. Confirm it worked

```bash
plaid item list --json
```

This should print JSON describing the bank connection you just linked. If
it does, you're fully set up — continue to [Quick start](#quick-start) to
set up this project itself.

## Quick start

Once every item in [Prerequisites](#prerequisites) above is working, here's
the whole setup, start to finish:

```bash
# 1. Download this project
git clone https://github.com/nicholasg-dev/plaid-cli-mcp-server.git
cd plaid-cli-mcp-server

# 2. Install its dependencies
npm install

# 3. Compile it (this project is written in TypeScript, which needs to be
#    turned into plain JavaScript before it can run)
npm run build

# 4. Tell Claude Code about it
claude mcp add plaid --scope user -- node $(pwd)/dist/index.js
```

That's it. Open (or restart) Claude Code and ask it something like *"What's
my current bank balance?"* — it should recognize it has a `plaid` tool
available and use it.

To confirm it's registered correctly at any point:

```bash
claude mcp list        # "plaid" should show up as connected
```

## Registering with Claude Code

The one command from step 4 above, explained:

```bash
claude mcp add plaid --scope user -- node $(pwd)/dist/index.js
```

This tells Claude Code: "there's an MCP server named `plaid`; to start it,
run `node` on this compiled file." Everything after `--` is the exact
command Claude Code will run as a subprocess whenever it needs to use one
of this server's tools.

`--scope user` matters: it registers the server for *every* Claude Code
session on your computer, not just when you happen to be working inside
this specific folder (which is what `claude mcp add` does by default,
without `--scope user`). Since asking about your bank balance isn't tied
to any one coding project, user scope is almost always what you want here.

Useful follow-up commands:

```bash
claude mcp list          # see all registered MCP servers, and whether they're connected
claude mcp get plaid     # see the exact command Claude Code has stored for "plaid"
claude mcp remove plaid  # unregister it
```

If you later move this folder to a different location on disk, re-run the
`claude mcp add` command from that new location — the registration stores
an absolute file path, which won't update itself.

## Using this with OpenCode

[OpenCode](https://opencode.ai/) is another open-source, terminal-based AI
coding assistant, unrelated to Anthropic, that also supports MCP servers.
This project works with it the same way it works with Claude Code — same
[prerequisites](#prerequisites), same compiled `dist/index.js` — only the
registration step is different, since OpenCode is configured via a JSON
file instead of a CLI command.

**1. Build this project first**, if you haven't already (see
[Quick start](#quick-start)):

```bash
npm install
npm run build
```

**2. Add it to an OpenCode config file.** OpenCode reads a JSON config file
either per-project (`opencode.json` in your project's root folder) or
globally, for every project (`~/.config/opencode/opencode.json` — create
this file and any missing folders in the path if it doesn't exist yet).
Global is usually what you want here, for the same reason `--scope user`
is recommended for Claude Code above: your bank balance isn't tied to any
one coding project.

Add a `"plaid"` entry under `"mcp"`, using the absolute path to this
project's compiled `dist/index.js`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "plaid": {
      "type": "local",
      "command": ["node", "/absolute/path/to/plaid-cli-mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

Replace `/absolute/path/to/plaid-cli-mcp-server` with wherever you cloned
this repository — run `pwd` inside the project folder to get that path.
If a `"mcp"` key (or the file itself) already exists with other servers in
it, just add the `"plaid"` entry alongside them rather than replacing the
whole file.

**3. Confirm it's picked up:**

```bash
opencode mcp list   # "plaid" should appear, enabled
```

Then, from an OpenCode session, ask it something like *"what's my bank
balance?"* the same way you would with Claude Code — it should recognize
and call the `plaid` tools automatically.

## Tool reference

This section is the detailed reference for each of the six tools this
server offers. You won't normally need to read this to *use* the server —
just ask Claude Code what you want in plain English and it'll pick the
right tool. This section is for understanding exactly what's happening
under the hood, or for developers extending this project.

All inputs are validated with [zod](https://zod.dev/) schemas that map 1:1
onto the underlying `plaid` CLI's own flags — nothing is renamed or
reshaped between what the AI assistant sends and what the CLI receives.
Every tool call runs `plaid <subcommand> ... --json` and returns the
parsed JSON as the result.

A successful tool call looks like:

```json
{
  "content": [{ "type": "text", "text": "<pretty-printed JSON from the CLI>" }]
}
```

A failed one sets `isError: true`, with the Plaid CLI's own error message
as the content (see [Error handling model](#error-handling-model)):

```json
{
  "content": [{ "type": "text", "text": "<error message from the plaid CLI>" }],
  "isError": true
}
```

---

### `list_items`

Lists every bank connection ("Item") you've linked via the Plaid CLI.

- **Runs:** `plaid item list --json`
- **Inputs:** none
- **Returns:** an object with an `items` array; each entry has at least an
  `item_id`, which you can pass to the other tools below.

This is usually the first tool called, since every other tool that takes
an `item` argument needs an `item_id` from here.

### `get_item`

Gets details for one linked Item, including its accounts.

- **Runs:** `plaid item get --item <id> --json`
- **Inputs:**

  | Field | Type | Required | Description |
  |---|---|---|---|
  | `item` | `string` | yes | The `item_id` to look up (from `list_items`) |

- **If the `item` id doesn't exist:** returns `isError: true` with a
  message containing `ITEM_NOT_FOUND` (see
  [Item health statuses](#item-health-statuses)).

### `get_balances`

Gets current account balances — for one linked Item, or all of them.

- **Runs:** `plaid balance --json [--item <id> | --all]`
- **Inputs:**

  | Field | Type | Required | Description |
  |---|---|---|---|
  | `item` | `string` | no | Only get balances for this one Item |
  | `all` | `boolean` | no | Get balances for every linked Item |

  Only specify one of `item` or `all`, not both — that mirrors the Plaid
  CLI's own rule, which this server doesn't duplicate; it just passes
  along whatever you asked for and lets the CLI validate it.

### `list_transactions`

Lists transactions in a date range.

- **Runs:** `plaid transactions list --json [--item <id> | --all] [--start-date <date>] [--end-date <date>] [--count <n>] [--offset <n>]`
- **Inputs:**

  | Field | Type | Required | Description |
  |---|---|---|---|
  | `item` | `string` | no | Only this one Item |
  | `all` | `boolean` | no | Every linked Item |
  | `startDate` | `string` (`YYYY-MM-DD`) | no | Start of the date range. If left out, the CLI defaults to the last 30 days. |
  | `endDate` | `string` (`YYYY-MM-DD`) | no | End of the date range |
  | `count` | `integer` | no | Maximum number of results to return |
  | `offset` | `integer` | no | How many results to skip (for paging through a long list) |

### `sync_transactions`

Fetches only *new or changed* transactions since the last time this was
called, using Plaid's official incremental-sync mechanism. Useful for
"what's changed since I last checked."

- **Runs:** `plaid transactions sync --json [--item <id> | --all] [--limit <n>] [--page-size <n>]`
- **Inputs:**

  | Field | Type | Required | Description |
  |---|---|---|---|
  | `item` | `string` | no | Only this one Item |
  | `all` | `boolean` | no | Every linked Item |
  | `limit` | `integer` | no | Maximum total results to return |
  | `pageSize` | `integer` | no | How many results to fetch per underlying request |

  The first time this runs for a given Item, it returns that Item's full
  transaction history (there's nothing to compare against yet). Every call
  after that only returns what's new or changed. The bookkeeping needed to
  know "what's changed since last time" (called a cursor) is handled
  entirely by the Plaid CLI — this project doesn't store or manage it.

### `check_item_health`

Checks whether one or all linked Items are working normally, or need your
attention (e.g. because a bank requires you to log in again).

- **Inputs:**

  | Field | Type | Required | Description |
  |---|---|---|---|
  | `item` | `string` | no | Check just this one Item. Left out: checks every linked Item. |

- **How it works:** the Plaid CLI has no single "check health" command, so
  this tool does it in two steps: list the Item(s) to check (via
  `plaid item list`, unless you gave a specific `item`), then run
  `plaid item get` on each one and see whether it succeeds. If checking
  multiple Items, one broken Item won't stop the others from being
  checked — you always get a result for every Item you asked about.

- **Example result:**

  ```json
  [
    { "itemId": "abc123", "status": "healthy" },
    { "itemId": "def456", "status": "re_auth_required" }
  ]
  ```

  See [Item health statuses](#item-health-statuses) for what each possible
  `status` value means.

## Error handling model

Every call to the Plaid CLI goes through one function
(`src/plaidCli.ts`) — nothing else in this codebase runs the `plaid`
binary directly. It always runs the CLI safely (as a plain argument list,
never as a shell command string someone could tamper with), and always
adds the `--json` flag.

- **If the CLI exits successfully:** its JSON output is parsed and
  returned as the tool's result.
- **If the CLI exits with an error:** whatever it printed as its error
  message is captured, and the tool returns a normal (non-crashing) result
  with `isError: true` and that message as the content. This covers things
  like: not being logged in, an unrecognized `item` id, a malformed date,
  or the `plaid` program not being found at all.

For example, asking about an Item that doesn't exist produces an error
message shaped like this from the CLI itself:

```json
{"error":{"code":"ITEM_NOT_FOUND","message":"no item matching \"bogus-item\" found","type":"INVALID_INPUT"}}
```

## Item health statuses

`check_item_health` reads the Plaid CLI's error messages and turns them
into one of these plain-English statuses:

| Underlying Plaid error code | `status` returned | What it means |
|---|---|---|
| *(no error — the check succeeded)* | `healthy` | Everything's working normally |
| `ITEM_LOGIN_REQUIRED` | `re_auth_required` | The bank needs you to log back in via `plaid link` (common after a password change on the bank's side) |
| `ITEM_LOCKED` | `item_locked` | The bank connection is temporarily locked |
| `PENDING_EXPIRATION` | `pending_expiration` | The connection will need re-authentication soon |
| `ITEM_NOT_FOUND` | `not_found` | That `item_id` doesn't exist |
| anything else / an unrecognized error | `unknown_error` | See the `reason` field in the result for details |

## Project structure

For anyone looking to read or modify the code:

```
plaid-mcp/
  src/
    index.ts         # Starts the MCP server and registers all six tools
    tools.ts          # Defines each tool's inputs and what it does when called
    plaidCli.ts        # The one place that actually runs the `plaid` CLI program
    itemHealth.ts      # Logic behind check_item_health
  tests/               # Automated tests (see Development, below)
  docs/superpowers/    # Internal design notes from when this was built — not required reading, kept for history/transparency
  dist/                # Compiled output — created by `npm run build`, not checked into Git
  package.json         # Project metadata and dependency list
  tsconfig.json         # TypeScript compiler settings
```

## Development

```bash
npm test    # runs the automated test suite
npm run build
npm start   # runs the compiled server directly, for manual testing
```

Note: the test suite runs against your **real, logged-in Plaid CLI** —
there are no fake/mock responses. That means running `npm test` requires
the same setup as using the server day-to-day (see
[Prerequisites](#prerequisites)): `plaid` installed, logged in, with at
least one bank linked.

## Frequently asked questions

**Does this project ever see my bank password or Plaid API keys?**
No. It only ever runs commands like `plaid balance --json` and reads the
output. All login and credentials live inside the Plaid CLI's own local
configuration, which this project never reads or touches.

**Is my data sent anywhere other than my own computer and Plaid?**
This project itself makes no network calls at all — it only starts a
local subprocess (`plaid`) and reads its output. Whatever Claude Code (or
whichever AI assistant you're using) does with the resulting data — e.g.
sending it to Anthropic's API as part of your conversation — is between
you and that assistant, the same as with anything else you ask it about.

**Is this an official Plaid or Anthropic product?**
No — this is an independent personal project. "Plaid" and "Claude Code"
are the names of the respective companies' own products that this project
integrates with; this repository isn't published or endorsed by either
company.

**Can I use this with something other than Claude Code?**
Yes — see [Using this with OpenCode](#using-this-with-opencode) for a
second, fully-documented client. More generally, since MCP is an open
standard, any MCP client that supports stdio-transport servers should be
able to run it the same way; consult that client's own documentation for
how to add an MCP server by command or config file.

**Can this create new bank connections, or move money?**
No. It only reads data that's already there (linked Items, balances,
transactions). There's no code path anywhere in this project that links a
new bank, removes one, or initiates any transfer or payment. See
[Non-goals / scope](#non-goals--scope).

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `command not found: plaid` (or every tool call errors similarly) | The `plaid` CLI isn't installed, or isn't on your `PATH`. Run `which plaid` in the same terminal Claude Code uses to confirm it can be found. |
| `command not found: node` or `npm` | Node.js isn't installed — see [Prerequisites](#prerequisites). |
| Tool calls fail with a login/auth-related error | Run `plaid login` again — your CLI session may have expired. |
| One specific bank ("Item") keeps failing | Run the `check_item_health` tool (or `plaid item get --item <id> --json` directly) to see exactly why — often it just needs `plaid link` run again for that bank. |
| `claude mcp list` doesn't show `plaid`, or shows it as disconnected | Re-run the `claude mcp add` command from [Quick start](#quick-start). Make sure `npm run build` has been run so `dist/index.js` actually exists. |
| Made a code change but nothing seems different | Run `npm run build` again — Claude Code runs the compiled `dist/` files, not the TypeScript source directly. |

## Non-goals / scope

To be explicit about what this project intentionally does *not* do:

- **No write access.** It can't link a new bank, remove one, or move
  money — only ever reads data from banks you've already linked yourself.
- **No direct connection to Plaid's servers.** All communication with
  Plaid goes through the official CLI; this project never calls Plaid's
  API directly.
- **No investments or liabilities data** — only Items, balances, and
  transactions are covered.
- **No credential storage.** Login and API keys are entirely the Plaid
  CLI's responsibility; this project has nowhere to keep them even if it
  wanted to.

The original design document, written before this project was built, is
kept at `docs/superpowers/specs/2026-07-15-plaid-mcp-design.md` for anyone
curious about the reasoning behind these choices.

## License

[MIT](./LICENSE) — free and open source. You're welcome to use, modify,
and distribute this code, including commercially, as long as the original
copyright notice is kept. See the [LICENSE](./LICENSE) file for the full
text.
