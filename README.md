# tiny-chat 💬

A featherweight realtime chat for 4–5 friends. Runs on Cloudflare's edge via [PartyKit](https://www.partykit.io/), served from a single static HTML file. Free forever at this scale. ☁️✨

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
- 🔔 **Optional ping sound** — toggleable, only fires for foreign messages while the tab is hidden, so you're not pinged by yourself.
- 📱 **Installable PWA** — add to home screen on iOS/Android/desktop, with an offline-cached app shell.
- 🕒 **Hover timestamps** — full local time on every message via the `title` attribute.
- 💤 **Cold-start friendly** — DOs wake in ~50–200 ms, then everything is instant.

---

## 🏗️ Architecture

```
┌────────────┐  WebSocket   ┌──────────────────────┐
│ index.html │ ───────────▶ │ PartyKit "ChatRoom"  │
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
- The same PartyKit deploy serves both the server logic _and_ the static client. One command, one URL.

### Wire protocol 📡

JSON over WebSocket, `type` discriminator:

| direction  | type       | payload                                           |
| ---------- | ---------- | ------------------------------------------------- |
| C → S      | `hello`    | `{ who }` — first message after connect           |
| C → S      | `msg`      | `{ text }`                                        |
| C → S      | `typing`   | `{ isTyping }`                                    |
| S → C      | `history`  | `{ messages: StoredMessage[] }` (sent on connect) |
| S → all    | `msg`      | `{ message: StoredMessage }`                      |
| S → all    | `presence` | `{ users: string[] }`                             |
| S → others | `typing`   | `{ who, isTyping }`                               |

---

## 🚀 Quickstart

### Prereqs

- Node.js 18+
- A Cloudflare account (free tier is fine)

### Run locally

```bash
npm install
npx partykit dev
```

Opens at **http://127.0.0.1:1999**. Open in two tabs to chat with yourself. Edits hot-reload.

### Deploy

```bash
npx partykit deploy
```

First run prompts for Cloudflare login. After that you get a URL like `https://tiny-chat.<your-username>.partykit.dev`. Share with friends. 🎉

### Type-check

```bash
npx tsc --noEmit
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
│   ├── manifest.webmanifest # PWA manifest
│   ├── icon.svg             # App icon
│   └── sw.js                # Service worker (offline app-shell cache)
├── partykit.json            # PartyKit config (`serve: "public"` is the magic)
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

## 🐛 Gotchas

- `onConnect` runs **before** the client sends `hello`, so a connection has no `who` until then. Presence broadcasts filter out connections without `state.who`.
- Messages are validated/dropped if the sender hasn't said `hello` yet.
- The service worker only caches the app shell. Live messages still need a working WebSocket.

---

## 💸 What it costs

- **PartyKit free tier** easily covers this.
- If you exceed it, you fall through to raw Cloudflare Durable Object pricing. For 5 friends + ~1000 messages/day, that's pennies/month.
- **Zero bandwidth charges** from Cloudflare — that's a CF-wide policy and a big reason this stack is so cheap. 🎁

---

## 🔮 Future ideas (not built — and why)

| idea                    | why it's not in here                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| 📷 Image / file sharing | Needs a Cloudflare R2 bucket + signed-URL flow. Worth it; out of scope for v1.                     |
| ✅ Read receipts        | For 5 friends, the noise of "seen by X, Y" outweighs the value. Skip.                              |
| 🔒 E2E encryption       | Overkill for friends. Doable with Web Crypto + a shared passphrase if you care.                    |
| 🌐 Custom domain        | CNAME the partykit.dev URL or bind via the Cloudflare dashboard. Default URL is fine for 5 people. |

---

## 🛠️ Built with

- [PartyKit](https://www.partykit.io/) — the four-hook Durable Object wrapper
- [partysocket](https://github.com/partykit/partykit/tree/main/packages/partysocket) — WebSocket client with reconnect/backoff baked in
- Vanilla HTML, CSS, JS — no framework, no build step, no nonsense

Made for talking to friends. 👋
