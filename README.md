# tiny-chat 💬

A featherweight realtime chat for 4–5 friends. Runs on Cloudflare's edge via [PartyServer](https://developers.cloudflare.com/) (Durable Objects), served from a single static HTML file. Free forever at this scale. ☁️✨

> Type your name + a shared room key, land in a chat room, and talk in realtime. The whole client is one HTML file under 10 KB. The whole server is one TypeScript class with four hooks. That's the entire app.

---

## ✨ Features

- ⚡ **Realtime WebSockets** — Cloudflare Durable Object per room, sub-100 ms within-region latency.
- 💾 **Persistent history** — last 100 messages stored per room, replayed to anyone who joins.
- 👀 **Live presence** — see who's online, updates instantly on join/leave.
- ✍️ **Typing indicators** — `alice is typing…` with animated dots, debounced server-side.
- 🎨 **Stable per-name colors** — your name is the same hue everywhere, derived deterministically (no server coordination).
- 🧵 **Message grouping** — consecutive messages from the same sender within 60 s collapse into a tight visual block.
- 🔁 **Auto-reconnect** — `partysocket` handles backoff; an amber banner shows when offline and clears on reconnect.
- 🧹 **`/clear` command** — type `/clear` in the composer to wipe a room's history for everyone (with confirmation).
- 📱 **Installable** — manifest + icon, so iOS/Android/desktop can add it to the home screen.
- 🕒 **Hover timestamps** — full local time on every message via the `title` attribute.
- 💤 **Cold-start friendly** — DOs wake in ~50–200 ms, then everything is instant.

---

## 🏗️ Architecture

```
┌────────────┐  WebSocket   ┌──────────────────────┐
│ index.html │ ───────────▶ │ PartyServer "ChatRoom"│
│ (client)   │ ◀─────────── │ (Durable Object)     │
└────────────┘   broadcasts │  • active sockets    │
      ▲                     │  • last 100 messages │
      │ HTTP GET            │  • presence list     │
      └─────────────────────┴──────────────────────┘
                served by same deployment
```

- One **room key** → one **Durable Object instance** → one chat room.
- The DO holds active WebSocket connections in memory and the last 100 messages in storage.
- The room key is the only auth. Strangers can't guess it; friends share it once.
- The same Worker deploy serves both the server logic _and_ the static client. One command, one URL.

### Wire protocol 📡

JSON over WebSocket, `type` discriminator:

| direction  | type       | payload                                           |
| ---------- | ---------- | ------------------------------------------------- |
| C → S      | `hello`    | `{ who }` — first message after connect           |
| C → S      | `msg`      | `{ text }`                                        |
| C → S      | `typing`   | `{ isTyping }`                                    |
| C → S      | `clear`    | `{}` — wipes room history                         |
| S → C      | `history`  | `{ messages: StoredMessage[] }` (sent on connect) |
| S → all    | `msg`      | `{ message: StoredMessage }`                      |
| S → all    | `presence` | `{ users: string[] }`                             |
| S → all    | `cleared`  | `{ who }` — history was wiped                     |
| S → others | `typing`   | `{ who, isTyping }`                               |

---

## 🚀 Quickstart

### Prereqs

- [Bun](https://bun.sh)
- A Cloudflare account (free tier is fine)

### Run locally

```bash
bun install
bun run dev
```

Opens at **http://127.0.0.1:8787**. Open in two tabs to chat with yourself. Edits hot-reload.

### Deploy

```bash
bun run deploy
```

First run prompts for Cloudflare login. After that you get a URL like `https://tiny-chat.<your-subdomain>.workers.dev`. Share with friends. 🎉

### Type-check

```bash
bun run typecheck
```

There are no tests — this is small enough to verify by opening two tabs.

---

## 📁 Project structure

```
tiny-chat/
├── party/
│   └── server.ts            # ChatRoom Durable Object — 4 hooks, ~100 lines
├── public/
│   ├── index.html           # The whole client, single file
│   ├── manifest.webmanifest # Add-to-home-screen manifest
│   └── icon.svg             # App icon
├── wrangler.jsonc           # Workers config (`assets.directory: "./public"` is the magic)
├── package.json
├── tsconfig.json
└── CLAUDE.md                # Notes for AI pair programmers
```

---

## ⚙️ Constraints worth keeping

- 🪶 **No client build step.** `index.html` is served verbatim and imports `partysocket` from esm.sh. Don't add a bundler unless a feature truly needs one.
- 📏 **Limits:** 100 messages per room, 2000 chars per message, 32 chars per name. Each storage key stays well under the Durable Object 128 KB cap.
- 🔐 **Auth = room key.** If you want stricter access, validate against an env-var secret in `onBeforeConnect`.
- 🧊 Per-room storage. Each room key is its own DO with its own history — no cross-room data.

---

## 🗄️ Storage & history

- Each **room key** maps to its own Durable Object with its own storage.
- We keep the **last 100 messages** per room — older ones drop off when message 101 arrives.
- Storage is **durable and has no TTL**: log out, close the tab, come back days later — same room key, you'll see the same history. Friends see it too.
- Wipe a room with **`/clear`** in the composer (type it as a message). The 5-friend trust model means anyone in the room can do it.
- Hard reset from the CLI if you ever need it: `bunx wrangler delete <room-key>` removes the entire DO instance.

---

## 🐛 Gotchas

- 👀 **You can't see your own typing indicator** — the server broadcasts `typing` to everyone *except* the sender. Open a second tab to test.
- `onConnect` runs **before** the client sends `hello`, so a connection has no `who` until then. Presence broadcasts filter out connections without `state.who`.
- Messages are validated/dropped if the sender hasn't said `hello` yet.

---

## 💸 What it costs

- **Cloudflare Workers free plan** (includes SQLite-backed Durable Objects) easily covers this.
- If you exceed it, you fall through to raw Cloudflare Durable Object pricing. For 5 friends + ~1000 messages/day, that's pennies/month.
- **Zero bandwidth charges** from Cloudflare — that's a CF-wide policy and a big reason this stack is so cheap. 🎁

---

## 🔮 Future ideas (not built — and why)

| idea                    | why it's not in here                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| 📷 Image / file sharing | Needs a Cloudflare R2 bucket + signed-URL flow. Worth it; out of scope for v1.                     |
| ✅ Read receipts        | For 5 friends, the noise of "seen by X, Y" outweighs the value. Skip.                              |
| 🔒 E2E encryption       | Overkill for friends. Doable with Web Crypto + a shared passphrase if you care.                    |
| 🌐 Custom domain        | Bind a domain to the Worker via the Cloudflare dashboard. Default workers.dev URL is fine for 5 people. |

---

## 🛠️ Built with

- [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver) — the four-hook Durable Object wrapper
- [partysocket](https://github.com/partykit/partykit/tree/main/packages/partysocket) — WebSocket client with reconnect/backoff baked in
- Vanilla HTML, CSS, JS — no framework, no build step, no nonsense

Made for talking to friends. 👋
