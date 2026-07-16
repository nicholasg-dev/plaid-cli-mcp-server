# plaid-mcp

A local, stdio-transport MCP server that exposes Plaid bank balances,
transactions, and item metadata as MCP tools — by shelling out to the
[Plaid CLI](https://plaid.com/docs/cli/) (`plaid`), which must already be
installed and authenticated (`plaid login`, then `plaid item link` to link
at least one bank).

This server holds no Plaid credentials itself. All auth lives in the
`plaid` CLI's own config.

## Tools

| Tool | Description |
|---|---|
| `list_items` | List every linked Plaid item |
| `get_item` | Get one item and its accounts |
| `get_balances` | Current balances for one or all items |
| `list_transactions` | Transactions for a date range |
| `sync_transactions` | Cursor-based incremental transaction sync |
| `check_item_health` | Whether item(s) are healthy or need re-auth |

## Setup

```bash
npm install
npm run build
```

## Register with Claude Code

```bash
claude mcp add plaid --scope user -- node $(pwd)/dist/index.js
```

## Development

```bash
npm test    # runs against the real, authenticated plaid CLI — no mocks
npm run build
```
