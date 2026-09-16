// Relay online da equipe (Cloudflare free) — chat + galeria entre redes.
// Chat em tempo real via WebSocket (Durable Object), histórico em D1,
// imagens em R2. VÍDEOS NÃO VIAJAM: só metadados (o arquivo fica local).
// Auth: segredo da equipe (env TEAM_SECRET), um por time.

const IMAGE_BYTES_MAX = 8 * 1024 * 1024;
const CHAT_MAX = 300;
const GALLERY_MAX = 100;

function dataUrlBytes(dataUrl) {
  if (typeof dataUrl !== "string") return 0;
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return Math.floor(b64.length * 0.75);
}

function mimeFromDataUrl(dataUrl) {
  const m = /^data:([^;,]+)/.exec(dataUrl || "");
  return m ? m[1] : "image/png";
}

function extFromMime(mime) {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "png";
}

function dataUrlToBytes(dataUrl) {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Mesma base de URL pública das imagens deste Worker.
function imgUrlOf(requestUrl, key) {
  const url = new URL(typeof requestUrl === "string" ? requestUrl : requestUrl.url);
  return `${url.origin}/img/${key}`;
}

export class TeamRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.sessions = new Map(); // ws -> { id, name }
  }

  async fetch(request) {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return new Response("Use WebSocket em /ws", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, null);
    this.lastRequestUrl = request.url;
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    try {
      await this.onMessage(ws, typeof message === "string" ? message : String(message || ""), this.lastRequestUrl);
    } catch (err) {
      console.error(err);
      this.send(ws, { t: "error", message: "Erro interno." });
    }
  }

  async webSocketClose(ws) {
    this.sessions.delete(ws);
    this.broadcastClients();
  }

  async webSocketError(ws) {
    try {
      ws.close();
    } catch {}
    this.sessions.delete(ws);
    this.broadcastClients();
  }

  send(ws, obj) {
    try {
      ws.send(JSON.stringify(obj));
    } catch {}
  }

  broadcast(obj, except) {
    const raw = JSON.stringify(obj);
    for (const [ws, user] of this.sessions) {
      if (ws !== except && user) {
        try {
          ws.send(raw);
        } catch {}
      }
    }
  }

  broadcastClients() {
    const clients = [...this.sessions.values()].filter(Boolean);
    this.broadcast({ t: "clients", clients });
  }

  async onMessage(ws, raw, request) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return this.send(ws, { t: "error", message: "Mensagem inválida." });
    }
    if (msg.t === "ping") return this.send(ws, { t: "pong" });

    if (msg.t === "hello") {
      if (String(msg.secret || "") !== String(this.env.TEAM_SECRET || "")) {
        this.send(ws, { t: "error", message: "Código da equipe incorreto." });
        try {
          ws.close();
        } catch {}
        return;
      }
      const user = {
        id: String((msg.user && msg.user.id) || "convidado"),
        name: String((msg.user && msg.user.name) || "Convidado"),
      };
      this.sessions.set(ws, user);
      const chat = await this.env.DB.prepare(
        "SELECT * FROM chat ORDER BY created_at DESC LIMIT ?"
      )
        .bind(CHAT_MAX)
        .all();
      const gallery = await this.env.DB.prepare(
        "SELECT * FROM gallery ORDER BY created_at DESC LIMIT ?"
      )
        .bind(GALLERY_MAX)
        .all();
      this.send(ws, {
        t: "welcome",
        chat: (chat.results || []).reverse(),
        gallery: gallery.results || [],
      });
      this.broadcastClients();
      return;
    }

    const user = this.sessions.get(ws);
    if (!user) return this.send(ws, { t: "error", message: "Não autenticado." });

    if (msg.t === "chat-post" && msg.msg) {
      const m = msg.msg;
      const entry = {
        id: String(m.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        userId: String(m.userId || user.id),
        fullName: String(m.fullName || user.name),
        content: String(m.content || "").slice(0, 2000),
        mediaType: m.mediaType === "video" ? "video" : m.mediaType === "image" ? "image" : null,
        mediaUrl: null,
        createdAt: m.createdAt || new Date().toISOString(),
        origin: "cloud",
      };
      if (entry.mediaType === "image" && msg.dataUrl && dataUrlBytes(msg.dataUrl) <= IMAGE_BYTES_MAX) {
        const key = `chat-${entry.id}.${extFromMime(mimeFromDataUrl(msg.dataUrl))}`;
        await this.env.MEDIA.put(key, dataUrlToBytes(msg.dataUrl), {
          httpMetadata: { contentType: mimeFromDataUrl(msg.dataUrl) },
        });
        entry.mediaUrl = imgUrlOf(request, key);
      }
      await this.env.DB.prepare(
        "INSERT OR IGNORE INTO chat (id, user_id, full_name, content, media_type, media_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(entry.id, entry.userId, entry.fullName, entry.content, entry.mediaType, entry.mediaUrl, entry.createdAt)
        .run();
      await this.env.DB.prepare(
        "DELETE FROM chat WHERE id NOT IN (SELECT id FROM chat ORDER BY created_at DESC LIMIT ?)"
      )
        .bind(CHAT_MAX)
        .run();
      return this.broadcast({ t: "chat-new", msg: entry });
    }

    if (msg.t === "gallery-publish" && msg.item) {
      const g = msg.item;
      const entry = {
        id: String(g.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        userId: String(g.userId || user.id),
        fullName: String(g.fullName || user.name),
        content: String(g.content || "").slice(0, 500),
        mediaType: g.mediaType === "video" ? "video" : "image",
        mediaUrl: null,
        createdAt: g.createdAt || new Date().toISOString(),
        origin: "cloud",
      };
      if (entry.mediaType === "image" && msg.dataUrl && dataUrlBytes(msg.dataUrl) <= IMAGE_BYTES_MAX) {
        const key = `gallery-${entry.id}.${extFromMime(mimeFromDataUrl(msg.dataUrl))}`;
        await this.env.MEDIA.put(key, dataUrlToBytes(msg.dataUrl), {
          httpMetadata: { contentType: mimeFromDataUrl(msg.dataUrl) },
        });
        entry.mediaUrl = imgUrlOf(request, key);
      }
      await this.env.DB.prepare(
        "INSERT OR IGNORE INTO gallery (id, user_id, full_name, content, media_type, media_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(entry.id, entry.userId, entry.fullName, entry.content, entry.mediaType, entry.mediaUrl, entry.createdAt)
        .run();
      await this.env.DB.prepare(
        "DELETE FROM gallery WHERE id NOT IN (SELECT id FROM gallery ORDER BY created_at DESC LIMIT ?)"
      )
        .bind(GALLERY_MAX)
        .run();
      return this.broadcast({ t: "gallery-new", item: entry });
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return Response.json({ ok: true, service: "unicfilm-relay" });
    }
    if (url.pathname.startsWith("/img/")) {
      const key = decodeURIComponent(url.pathname.slice(5));
      if (!key || key.includes("..")) return new Response("404", { status: 404 });
      const obj = await env.MEDIA.get(key);
      if (!obj) return new Response("404", { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Access-Control-Allow-Origin", "*");
      return new Response(obj.body, { headers });
    }
    if (url.pathname === "/ws") {
      const id = env.ROOM.idFromName("team");
      const stub = env.ROOM.get(id);
      return stub.fetch(request);
    }
    return new Response("404", { status: 404 });
  },
};
