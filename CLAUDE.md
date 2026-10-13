# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run dev` — local dev server at `http://127.0.0.1:8787` (wrangler dev), hot-reloads on edits. Open two tabs to test multi-user.
- `bun run deploy` — deploys to your Cloudflare account with wrangler (prompts for CF login on first run).
- `bun run typecheck` (`npx tsc --noEmit`) — type-check the server (no test suite or linter is configured).

There are no tests. There is no build step for the client — `public/index.html` is served verbatim and imports `partysocket` from esm.sh at runtime.

## Architecture

Single-room chat over WebSockets, deployed as one PartyServer Worker (Cloudflare Durable Objects) that serves both the server logic and the static client.

**Server (`party/server.ts`)** — `ChatRoom extends Server<Env>` from `partyserver`, with a default-exported `fetch` handler that calls `routePartykitRequest(request, env)`. Each unique room key the client connects with instantiates its own Durable Object instance with isolated storage. Hibernation is on (`static options = { hibernate: true }`). The protocol uses JSON-over-WS messages with a `type` discriminator:
- Client → server: `hello` (must be first; sets `conn.setState({ who })`), `msg`
- Server → client: `history` (sent on connect), `msg` (broadcast), `presence` (broadcast on join/leave)

Note the PartyServer API differences from PartyKit: `onMessage(connection, message)` has swapped arguments, `this.room.storage` → `this.ctx.storage`, `this.room.broadcast` → `this.broadcast`, `this.room.getConnection(s)` → `this.getConnection(s)`, `this.room.id` → `this.name`.

Key invariant: `onConnect` fires *before* the client sends `hello`, so a connection has no `who` until then. Presence broadcasts iterate `this.getConnections()` and filter out connections whose `state.who` is unset — never broadcast presence directly from `onConnect`. Inbound `msg` events are also rejected if the sender has no `who`.

Persistence: messages live in `this.ctx.storage` under the `messages` key as a `StoredMessage[]`, trimmed to the last 100 on every append. Each room key = one DO = its own message history; there is no cross-room data.

**Client (`public/index.html`)** — Single file, no framework, no build. Two screens (login / chat) toggled via `display`/class. Uses `PartySocket` from esm.sh, which handles reconnect with backoff. Connects to `window.location.host` because the same Worker serves the HTML, and relies on partysocket's default party `main`, which matches the `Main` DO binding via `routePartykitRequest`'s kebab-casing. Per-name colors are derived deterministically from the name (sum of char codes mod 360 → HSL), so the same name always gets the same color across all clients without server coordination.

**Config (`wrangler.jsonc`)** — `assets: { "directory": "./public" }` is what makes the Worker serve the client as static files alongside the server, so there's a single deploy and a single URL. The `Main` binding + `new_sqlite_classes` migration must be updated whenever a server class is added, renamed or removed.

## Constraints to preserve

- Keep the client a single static file with no build step. Don't introduce a bundler, framework, or npm-installed client deps unless a feature genuinely requires it.
- Server caps: `MAX_MESSAGES = 100`, `MAX_TEXT_LEN = 2000`, `MAX_NAME_LEN = 32`. The 100-message cap keeps the storage value well under Durable Object's 128 KB per-key limit.
- The room key is the only auth. If stricter access control is ever added, do it in `onBeforeConnect` against an env-var secret.
