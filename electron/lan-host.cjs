// Servidor de rede local (Mac anfitrião) — chat + galeria entre Macs sem internet.
// WebSocket em LAN (padrão porta 41234), auth por PIN, persistência em userData/unicfilm-lan.
const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 41234;
const IMAGE_BYTES_MAX = 15 * 1024 * 1024; // imagens acima disso sincronizam só metadados
const CHAT_MAX = 300;
const GALLERY_MAX = 100;

let wss = null;
let storeDir = "";
let mediaDir = "";
const state = { running: false, port: PORT, ip: null, pin: null, clients: [] };
let chat = [];
let gallery = [];

function ensureDirs(baseDir) {
  storeDir = path.join(baseDir, "unicfilm-lan");
  mediaDir = path.join(storeDir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(storeDir, file), "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(storeDir, file), JSON.stringify(data));
}

function loadStore() {
  chat = readJson("chat.json", []);
  gallery = readJson("gallery.json", []);
  if (!Array.isArray(chat)) chat = [];
  if (!Array.isArray(gallery)) gallery = [];
  let pin = null;
  try {
    pin = String(readJson("pin.json", null) || "").trim() || null;
  } catch {
    pin = null;
  }
  if (!pin) {
    pin = String(Math.floor(100000 + Math.random() * 900000));
    writeJson("pin.json", pin);
  }
  state.pin = pin;
}

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const info of list || []) {
      if (info.family === "IPv4" && !info.internal) return info.address;
    }
  }
  return null;
}

function dataUrlBytes(dataUrl) {
  if (typeof dataUrl !== "string") return 0;
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor(b64.length * 0.75);
}

function mimeFromDataUrl(dataUrl) {
  const m = /^data:([^;,]+)/.exec(dataUrl || "");
  return m ? m[1] : "application/octet-stream";
}

function extFromMime(mime) {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  return "bin";
}

function saveMediaFile(id, dataUrl) {
  const mime = mimeFromDataUrl(dataUrl);
  const file = `${id}.${extFromMime(mime)}`;
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  fs.writeFileSync(path.join(mediaDir, file), Buffer.from(b64, "base64"));
  return { file, mime };
}

function hydrateMedia(entry) {
  if (!entry.mediaFile) return null;
  try {
    const buf = fs.readFileSync(path.join(mediaDir, entry.mediaFile));
    const mime = entry.mediaMime || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcast(obj, exceptWs) {
  if (!wss) return;
  const raw = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1 && client.authed && client !== exceptWs) client.send(raw);
  }
}

function broadcastClients() {
  const clients = [];
  if (wss) {
    for (const client of wss.clients) {
      if (client.authed && client.user) clients.push(client.user);
    }
  }
  state.clients = clients;
  broadcast({ t: "clients", clients });
}

function getStatus() {
  return {
    running: state.running,
    ip: state.ip,
    port: state.port,
    pin: state.running ? state.pin : null,
    clients: state.clients,
    chatCount: chat.length,
    galleryCount: gallery.length,
  };
}

function handleMessage(ws, raw) {
  let msg;
  try {
    msg = JSON.parse(String(raw));
  } catch {
    return send(ws, { t: "error", message: "Mensagem inválida." });
  }

  if (msg.t === "ping") return send(ws, { t: "pong" });

  if (msg.t === "hello") {
    if (String(msg.pin || "") !== String(state.pin)) {
      send(ws, { t: "error", message: "PIN incorreto." });
      return ws.close();
    }
    ws.authed = true;
    ws.user = {
      id: String((msg.user && msg.user.id) || "convidado"),
      name: String((msg.user && msg.user.name) || "Convidado"),
    };
    send(ws, {
      t: "welcome",
      chat: chat.map((m) => ({ ...m, dataUrl: m.mediaType === "image" ? hydrateMedia(m) : null })),
      gallery: gallery.map((g) => ({ ...g, dataUrl: g.mediaType === "image" ? hydrateMedia(g) : null })),
    });
    broadcastClients();
    return;
  }

  if (!ws.authed) return send(ws, { t: "error", message: "Não autenticado." });

  if (msg.t === "chat-post" && msg.msg) {
    const incoming = msg.msg;
    const entry = {
      id: String(incoming.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      userId: String(incoming.userId || (ws.user && ws.user.id) || "convidado"),
      fullName: String(incoming.fullName || (ws.user && ws.user.name) || "Convidado"),
      content: String(incoming.content || "").slice(0, 2000),
      mediaType: incoming.mediaType === "video" ? "video" : incoming.mediaType === "image" ? "image" : null,
      mediaUrl: incoming.mediaUrl ? String(incoming.mediaUrl) : null,
      createdAt: incoming.createdAt || new Date().toISOString(),
      origin: "lan",
    };
    if (entry.mediaType === "image" && msg.dataUrl && dataUrlBytes(msg.dataUrl) <= IMAGE_BYTES_MAX) {
      try {
        const saved = saveMediaFile(`chat-${entry.id}`, msg.dataUrl);
        entry.mediaFile = saved.file;
        entry.mediaMime = saved.mime;
      } catch {
        /* segue sem arquivo */
      }
    }
    if (!chat.some((m) => m.id === entry.id)) {
      chat = [...chat, entry].slice(-CHAT_MAX);
      try {
        writeJson("chat.json", chat);
      } catch {
        /* segue em memória */
      }
    }
    return broadcast({
      t: "chat-new",
      msg: { ...entry, dataUrl: entry.mediaType === "image" ? hydrateMedia(entry) : null },
    });
  }

  if (msg.t === "gallery-publish" && msg.item) {
    const incoming = msg.item;
    const entry = {
      id: String(incoming.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      userId: String(incoming.userId || (ws.user && ws.user.id) || "convidado"),
      fullName: String(incoming.fullName || (ws.user && ws.user.name) || "Convidado"),
      content: String(incoming.content || "").slice(0, 500),
      mediaType: incoming.mediaType === "video" ? "video" : "image",
      mediaUrl: incoming.mediaUrl ? String(incoming.mediaUrl) : null,
      createdAt: incoming.createdAt || new Date().toISOString(),
      origin: "lan",
    };
    if (entry.mediaType === "image" && msg.dataUrl && dataUrlBytes(msg.dataUrl) <= IMAGE_BYTES_MAX) {
      try {
        const saved = saveMediaFile(`gallery-${entry.id}`, msg.dataUrl);
        entry.mediaFile = saved.file;
        entry.mediaMime = saved.mime;
      } catch {
        /* segue sem arquivo */
      }
    }
    if (!gallery.some((g) => g.id === entry.id)) {
      gallery = [entry, ...gallery].slice(0, GALLERY_MAX);
      try {
        writeJson("gallery.json", gallery);
      } catch {
        /* segue em memória */
      }
    }
    return broadcast({
      t: "gallery-new",
      item: { ...entry, dataUrl: entry.mediaType === "image" ? hydrateMedia(entry) : null },
    });
  }
}

function startLanHost(baseDir) {
  if (wss) return getStatus();
  ensureDirs(baseDir);
  loadStore();
  wss = new WebSocketServer({ port: PORT });
  wss.on("connection", (ws) => {
    ws.authed = false;
    ws.user = null;
    ws.on("message", (raw) => handleMessage(ws, raw));
    ws.on("close", () => broadcastClients());
    ws.on("error", () => {
      try {
        ws.close();
      } catch {
        /* ignora */
      }
    });
  });
  state.running = true;
  state.ip = getLanIp();
  state.clients = [];
  return getStatus();
}

function stopLanHost() {
  if (wss) {
    for (const client of wss.clients) {
      try {
        client.close();
      } catch {
        /* ignora */
      }
    }
    wss.close();
    wss = null;
  }
  state.running = false;
  state.clients = [];
  return getStatus();
}

function regenPin() {
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  state.pin = pin;
  try {
    if (storeDir) writeJson("pin.json", pin);
  } catch {
    /* segue em memória */
  }
  return getStatus();
}

module.exports = { startLanHost, stopLanHost, getLanStatus: getStatus, regenLanPin: regenPin, LAN_PORT: PORT };
