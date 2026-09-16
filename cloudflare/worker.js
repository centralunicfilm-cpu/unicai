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

// Mesmos modelos do app (src/lib/runware.ts).
function mapImageModel(engine) {
  const e = String(engine || "").toLowerCase();
  if (e.includes("gpt") && e.includes("2.5")) return "openai:gpt-image@2.5-flare";
  if (e.includes("muse")) return "meta:muse@image";
  if (e.includes("flux")) return "runware:101@1";
  if (e.includes("banana 2") || e.includes("banana pro")) return "google:4@3";
  if (e.includes("banana")) return "google:4@2";
  return "openai:gpt-image@2";
}

const VIDEO_MODELS = {
  "MiniMax H3": "minimax:h3@0",
  "MiniMax H3 Fast": "minimax:h3@fast",
  "MiniMax H3 Max": "minimax:h3@max",
  "MiniMax H3 Max Turbo": "minimax:h3@max-turbo",
};

async function handleAiImage(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (String(body.secret || "") !== String(env.TEAM_SECRET || "")) {
    return Response.json({ error: "Código da equipe incorreto." }, { status: 401 });
  }
  const apiKey = env.RUNWARE_API_KEY;
  if (!apiKey) return Response.json({ error: "IA não configurada no relay." }, { status: 500 });

  const prompt = String(body.prompt || "").trim();
  if (!prompt) return Response.json({ error: "Prompt obrigatório." }, { status: 400 });
  const style = String(body.style || "Cinematográfico");
  const ratio = String(body.ratio || "16:9");
  const engine = String(body.engine || "Nano Banana");
  const referenceImages = Array.isArray(body.referenceImages)
    ? body.referenceImages.filter((v) => typeof v === "string" && v).slice(0, 5)
    : [];
  const model = mapImageModel(engine);
  const fullPrompt = `Generate a ${style} style image: ${prompt}. Aspect ratio ${ratio}. Professional production quality, cinematic lighting, ultra high resolution.`;
  // Modelos Google (Nano Banana) só aceitam dimensões específicas.
  let width = ratio === "9:16" || ratio === "3:4" ? 768 : 1024;
  let height = ratio === "16:9" || ratio === "4:3" ? 768 : 1024;
  if (model.startsWith("google:")) {
    if (ratio === "16:9") { width = 1376; height = 768; }
    else if (ratio === "9:16") { width = 768; height = 1376; }
    else if (ratio === "4:3") { width = 1200; height = 896; }
    else if (ratio === "3:4") { width = 896; height = 1200; }
    else { width = 1024; height = 1024; }
  }
  const task = {
    taskType: "imageInference",
    taskUUID: crypto.randomUUID(),
    model,
    positivePrompt: fullPrompt,
    width,
    height,
    outputFormat: "PNG",
    numberResults: 1,
  };
  if (referenceImages.length) {
    task.inputs = model === "meta:muse@image"
      ? { referenceImages }
      : referenceImages.map((image) => ({ image }));
  }

  const resp = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });
  if (resp.status === 429) return Response.json({ error: "Limite de requisições excedido. Tente de novo em segundos." }, { status: 429 });
  if (resp.status === 402) return Response.json({ error: "Créditos insuficientes na Runware." }, { status: 402 });
  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => "");
    console.error("Runware upstream:", resp.status, bodyText.slice(0, 300));
    return Response.json({ error: "Erro no gateway de IA." }, { status: 502 });
  }
  const data = await resp.json();
  const imageUrl = data.data && data.data[0] && data.data[0].imageURL;
  if (!imageUrl) {
    const msg = (data.errors && data.errors[0] && data.errors[0].message) || "Nenhuma imagem foi gerada.";
    return Response.json({ error: msg }, { status: 500 });
  }

  // Guarda no R2 e devolve URL pública (a original expira).
  try {
    const img = await fetch(imageUrl);
    if (img.ok) {
      const buf = new Uint8Array(await img.arrayBuffer());
      const key = `ai/${crypto.randomUUID()}.png`;
      await env.MEDIA.put(key, buf, { httpMetadata: { contentType: "image/png" } });
      return Response.json({ imageUrl: imgUrlOf(request, key), model });
    }
  } catch {
    /* cai para a URL original */
  }
  return Response.json({ imageUrl, model });
}

async function handleAiVideo(request, env) {
  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (String(body.secret || "") !== String(env.TEAM_SECRET || "")) {
    return Response.json({ error: "Código da equipe incorreto." }, { status: 401 });
  }
  const apiKey = env.RUNWARE_API_KEY;
  if (!apiKey) return Response.json({ error: "IA não configurada no relay." }, { status: 500 });

  const prompt = String(body.prompt || "").trim();
  if (!prompt) return Response.json({ error: "Prompt obrigatório." }, { status: 400 });
  const engine = String(body.engine || "MiniMax H3 Fast");
  const task = {
    taskType: "videoInference",
    taskUUID: crypto.randomUUID(),
    model: VIDEO_MODELS[engine] || "minimax:h3@fast",
    positivePrompt: prompt,
    duration: Math.min(Math.max(Number(body.duration || 5), 5), 15),
    outputType: "URL",
    outputFormat: "MP4",
  };
  if (body.referenceImage) {
    task.inputs = { frameImages: [{ frame: "first", input: body.referenceImage }] };
  }
  const resp = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = (data.errors && data.errors[0] && data.errors[0].message) || "Erro no Runware.";
    return Response.json({ error: msg }, { status: 502 });
  }
  const videoUrl = data.data && data.data[0] && data.data[0].videoURL;
  if (!videoUrl) {
    const msg = (data.errors && data.errors[0] && data.errors[0].message) || "Nenhum vídeo foi gerado.";
    return Response.json({ error: msg }, { status: 500 });
  }
  return Response.json({ videoUrl, model: task.model });
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
    this.teamSecretCache = null;
    this.teamSecretAt = 0;
  }

  // Código da equipe fica no D1 (editável pelo admin); env é o valor inicial.
  async getTeamSecret() {
    if (!this.teamSecretCache || Date.now() - this.teamSecretAt > 60000) {
      try {
        const row = await this.env.DB.prepare(
          "SELECT value FROM settings WHERE key = 'team_secret'"
        ).first();
        this.teamSecretCache = (row && row.value) || this.env.TEAM_SECRET || "";
      } catch {
        this.teamSecretCache = this.env.TEAM_SECRET || "";
      }
      this.teamSecretAt = Date.now();
    }
    return this.teamSecretCache;
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
      const teamSecret = await this.getTeamSecret();
      if (String(msg.secret || "") !== String(teamSecret)) {
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

    if (msg.t === "admin-rotate-secret") {
      if (String(msg.adminSecret || "") !== String(this.env.ADMIN_SECRET || "")) {
        return this.send(ws, { t: "error", message: "Sem permissão." });
      }
      const next = String(msg.newSecret || "").trim();
      if (next.length < 4 || next.length > 64) {
        return this.send(ws, { t: "error", message: "Código deve ter 4 a 64 caracteres." });
      }
      await this.env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES ('team_secret', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      )
        .bind(next)
        .run();
      this.teamSecretCache = next;
      this.teamSecretAt = Date.now();
      return this.send(ws, { t: "secret-rotated" });
    }

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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonCors(obj, status) {
  return Response.json(obj, {
    status: status || 200,
    headers: CORS_HEADERS,
  });
}

async function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (url.pathname === "/") {
      return Response.json({ ok: true, service: "unicfilm-relay" });
    }
    if (url.pathname === "/ai-image" && request.method === "POST") {
      try {
        return await withCors(await handleAiImage(request, env));
      } catch (e) {
        return jsonCors({ error: "Falha na geração. Tente de novo." }, 500);
      }
    }
    if (url.pathname === "/ai-video" && request.method === "POST") {
      try {
        return await withCors(await handleAiVideo(request, env));
      } catch (e) {
        return jsonCors({ error: "Falha na geração. Tente de novo." }, 500);
      }
    }
    if (url.pathname.startsWith("/img/")) {
      const key = decodeURIComponent(url.pathname.slice(5));
      if (!key || key.includes("..")) return new Response("404", { status: 404 });
      const obj = await env.MEDIA.get(key);
      if (!obj) return new Response("404", { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      if (!headers.get("content-type")) {
        const lower = key.toLowerCase();
        const guess = lower.endsWith(".png")
          ? "image/png"
          : lower.endsWith(".webp")
            ? "image/webp"
            : lower.endsWith(".jpg") || lower.endsWith(".jpeg")
              ? "image/jpeg"
              : lower.endsWith(".gif")
                ? "image/gif"
                : "application/octet-stream";
        headers.set("content-type", guess);
      }
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
