import type * as Party from "partykit/server";

type StoredMessage = {
  id: string;
  who: string;
  text: string;
  ts: number;
};

type ConnState = { who: string };

const MAX_MESSAGES = 100;
const MAX_TEXT_LEN = 2000;
const MAX_NAME_LEN = 32;
const MAX_SIGNAL_LEN = 16 * 1024;

export default class ChatRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection<ConnState>) {
    const messages =
      (await this.room.storage.get<StoredMessage[]>("messages")) ?? [];
    conn.send(JSON.stringify({ type: "history", messages }));
    conn.send(JSON.stringify({ type: "self", id: conn.id }));
  }

  async onMessage(raw: string, sender: Party.Connection<ConnState>) {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    if (!data || typeof data !== "object") return;
    const msg = data as {
      type?: string;
      who?: string;
      text?: string;
      isTyping?: boolean;
      to?: string;
      payload?: unknown;
      fileId?: string;
      name?: string;
      size?: number;
      mime?: string;
    };

    if (msg.type === "hello") {
      const who = sanitizeName(msg.who);
      if (!who) return;
      sender.setState({ who });
      this.broadcastPresence();
      return;
    }

    if (msg.type === "signal") {
      const state = sender.state;
      if (!state?.who) return;
      if (typeof msg.to !== "string" || !msg.to) return;
      if (raw.length > MAX_SIGNAL_LEN) return;
      const target = this.room.getConnection(msg.to);
      if (!target) return;
      target.send(
        JSON.stringify({
          type: "signal",
          from: sender.id,
          fromWho: state.who,
          payload: msg.payload,
        }),
      );
      return;
    }

    if (msg.type === "file-offer") {
      const state = sender.state;
      if (!state?.who) return;
      if (typeof msg.fileId !== "string" || !msg.fileId) return;
      const name = typeof msg.name === "string" ? msg.name.slice(0, 256) : "file";
      const size = typeof msg.size === "number" ? msg.size : 0;
      const mime = typeof msg.mime === "string" ? msg.mime.slice(0, 128) : "";
      this.room.broadcast(
        JSON.stringify({
          type: "file-offer",
          from: sender.id,
          fromWho: state.who,
          fileId: msg.fileId,
          name,
          size,
          mime,
        }),
        [sender.id],
      );
      return;
    }

    if (msg.type === "typing") {
      const state = sender.state;
      if (!state?.who) return;
      const isTyping = !!msg.isTyping;
      this.room.broadcast(
        JSON.stringify({ type: "typing", who: state.who, isTyping }),
        [sender.id],
      );
      return;
    }

    if (msg.type === "clear") {
      const state = sender.state;
      if (!state?.who) return;
      await this.room.storage.put("messages", []);
      this.room.broadcast(
        JSON.stringify({ type: "cleared", who: state.who }),
      );
      return;
    }

    if (msg.type === "msg") {
      const state = sender.state;
      if (!state?.who) return;
      const text = (msg.text ?? "").toString().slice(0, MAX_TEXT_LEN).trim();
      if (!text) return;

      const stored: StoredMessage = {
        id: crypto.randomUUID(),
        who: state.who,
        text,
        ts: Date.now(),
      };

      const messages =
        (await this.room.storage.get<StoredMessage[]>("messages")) ?? [];
      messages.push(stored);
      while (messages.length > MAX_MESSAGES) messages.shift();
      await this.room.storage.put("messages", messages);

      this.room.broadcast(JSON.stringify({ type: "msg", message: stored }));
      this.room.broadcast(
        JSON.stringify({ type: "typing", who: state.who, isTyping: false }),
        [sender.id],
      );
    }
  }

  onClose(conn: Party.Connection<ConnState>) {
    const who = conn.state?.who;
    if (who) {
      this.room.broadcast(
        JSON.stringify({ type: "typing", who, isTyping: false }),
        [conn.id],
      );
    }
    this.broadcastPresence();
  }

  private broadcastPresence() {
    const users: { id: string; who: string }[] = [];
    for (const c of this.room.getConnections<ConnState>()) {
      if (c.state?.who) users.push({ id: c.id, who: c.state.who });
    }
    this.room.broadcast(JSON.stringify({ type: "presence", users }));
  }
}

function sanitizeName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, MAX_NAME_LEN);
  if (!trimmed) return null;
  return trimmed;
}
