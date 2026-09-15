// Cliente de rede local — conecta este Mac ao anfitrião via WebSocket nativo
// (funciona no navegador e no app instalado). O anfitrião roda no Electron
// via electron/lan-host.cjs e é controlado pela tela Rede.

import { mergeChatMessage, type ChatMessage } from "./localChat";
import { mergeGalleryItem, type LocalGalleryItem } from "./localGallery";
import { loadBlobDataUrl } from "./mediaCache";

export const LAN_PORT = 41234;

export interface LanHostInfo {
  running: boolean;
  ip: string | null;
  port: number;
  pin: string | null;
  clients: Array<{ id: string; name: string }>;
  chatCount: number;
  galleryCount: number;
}

interface LanBridge {
  hostStart: () => Promise<LanHostInfo>;
  hostStop: () => Promise<LanHostInfo>;
  hostStatus: () => Promise<LanHostInfo>;
  hostRegenPin: () => Promise<LanHostInfo>;
}

declare global {
  interface Window {
    unicfilmLan?: LanBridge;
  }
}

export const lanBridgeAvailable = () =>
  typeof window !== "undefined" && !!window.unicfilmLan;

type LanConnState = "off" | "connecting" | "on";

let ws: WebSocket | null = null;
let connState: LanConnState = "off";
let hostIp = "";
let hostPin = "";
let identity: { id: string; name: string } = { id: "", name: "" };
let wantConnection = false;
let reconnectTimer: number | null = null;
let lanClients: Array<{ id: string; name: string }> = [];

function emitLan() {
  window.dispatchEvent(new CustomEvent("unicfilm:lan"));
}

export function subscribeLan(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener("unicfilm:lan", handler);
  return () => window.removeEventListener("unicfilm:lan", handler);
}

export function lanState(): { state: LanConnState; ip: string; clients: Array<{ id: string; name: string }> } {
  return { state: connState, ip: hostIp, clients: lanClients };
}

export function lanConnected(): boolean {
  return connState === "on" && !!ws && ws.readyState === WebSocket.OPEN;
}

function setState(next: LanConnState) {
  connState = next;
  emitLan();
}

function scheduleReconnect() {
  if (!wantConnection || reconnectTimer !== null) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    if (wantConnection && connState !== "on") {
      void openSocket();
    }
  }, 8000);
}

async function openSocket(): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (err: string | null) => {
      if (!settled) {
        settled = true;
        resolve(err);
      }
    };
    try {
      const socket = new WebSocket(`ws://${hostIp}:${LAN_PORT}`);
      ws = socket;
      setState("connecting");

      const timeout = window.setTimeout(() => {
        try {
          socket.close();
        } catch {
          /* ignora */
        }
        if (connState !== "on") setState("off");
        done("Não foi possível alcançar o anfitrião. Confira IP e rede Wi-Fi.");
      }, 10000);

      socket.onopen = () => {
        socket.send(JSON.stringify({ t: "hello", pin: hostPin, user: identity }));
      };

      socket.onmessage = async (event) => {
        let msg: any;
        try {
          msg = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (msg.t === "welcome") {
          window.clearTimeout(timeout);
          for (const m of (msg.chat || []) as any[]) {
            await mergeChatMessage(
              {
                id: String(m.id),
                userId: String(m.userId || ""),
                fullName: String(m.fullName || "Equipe"),
                content: String(m.content || ""),
                mediaUrl: m.mediaUrl ? String(m.mediaUrl) : null,
                mediaType: m.mediaType === "video" ? "video" : m.mediaType === "image" ? "image" : null,
                createdAt: String(m.createdAt || new Date().toISOString()),
              } as ChatMessage,
              m.dataUrl ?? null
            );
          }
          const { mergeGalleryItem: merge } = await import("./localGallery");
          for (const g of (msg.gallery || []) as any[]) {
            await merge(
              {
                id: String(g.id),
                userId: String(g.userId || ""),
                fullName: String(g.fullName || "Equipe"),
                content: String(g.content || ""),
                mediaUrl: g.mediaUrl ? String(g.mediaUrl) : "",
                mediaType: g.mediaType === "video" ? "video" : "image",
                createdAt: String(g.createdAt || new Date().toISOString()),
              } as LocalGalleryItem,
              g.dataUrl ?? null
            );
          }
          window.dispatchEvent(new CustomEvent("unicfilm:gallery"));
          setState("on");
          done(null);
        } else if (msg.t === "chat-new" && msg.msg) {
          const m = msg.msg;
          await mergeChatMessage(
            {
              id: String(m.id),
              userId: String(m.userId || ""),
              fullName: String(m.fullName || "Equipe"),
              content: String(m.content || ""),
              mediaUrl: m.mediaUrl ? String(m.mediaUrl) : null,
              mediaType: m.mediaType === "video" ? "video" : m.mediaType === "image" ? "image" : null,
              createdAt: String(m.createdAt || new Date().toISOString()),
            } as ChatMessage,
            m.dataUrl ?? null
          );
        } else if (msg.t === "gallery-new" && msg.item) {
          const g = msg.item;
          await mergeGalleryItem(
            {
              id: String(g.id),
              userId: String(g.userId || ""),
              fullName: String(g.fullName || "Equipe"),
              content: String(g.content || ""),
              mediaUrl: g.mediaUrl ? String(g.mediaUrl) : "",
              mediaType: g.mediaType === "video" ? "video" : "image",
              createdAt: String(g.createdAt || new Date().toISOString()),
            } as LocalGalleryItem,
            g.dataUrl ?? null
          );
          window.dispatchEvent(new CustomEvent("unicfilm:gallery"));
        } else if (msg.t === "clients") {
          lanClients = Array.isArray(msg.clients) ? msg.clients : [];
          emitLan();
        } else if (msg.t === "pong") {
          /* vivo */
        } else if (msg.t === "error" && connState !== "on") {
          window.clearTimeout(timeout);
          try {
            socket.close();
          } catch {
            /* ignora */
          }
          setState("off");
          done(String(msg.message || "Erro do anfitrião."));
        }
      };

      socket.onerror = () => {
        window.clearTimeout(timeout);
        if (connState !== "on") {
          setState("off");
          done("Não foi possível alcançar o anfitrião. Confira IP e rede Wi-Fi.");
        }
      };

      socket.onclose = () => {
        window.clearTimeout(timeout);
        if (ws === socket) ws = null;
        lanClients = [];
        if (wantConnection) {
          setState("off");
          scheduleReconnect();
        } else {
          setState("off");
        }
      };
    } catch {
      done("Não foi possível abrir a conexão.");
    }
  });
}

export async function lanConnect(
  ip: string,
  pin: string,
  user: { id: string; name: string }
): Promise<string | null> {
  lanDisconnect(false);
  hostIp = ip.trim();
  hostPin = pin.trim();
  identity = { id: user.id, name: user.name };
  wantConnection = true;
  if (!hostIp) return "Informe o IP do Mac anfitrião.";
  return openSocket();
}

export function lanDisconnect(emit = true) {
  wantConnection = false;
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    try {
      ws.close();
    } catch {
      /* ignora */
    }
    ws = null;
  }
  lanClients = [];
  if (emit) setState("off");
}

// Envia mensagem de chat já salva localmente para o anfitrião espalhar.
export function forwardChatToHost(msg: ChatMessage) {
  if (!lanConnected() || !ws) return;
  void (async () => {
    let dataUrl: string | null = null;
    if (msg.mediaType === "image") {
      dataUrl = await loadBlobDataUrl(`chat-${msg.id}`);
    }
    ws?.send(JSON.stringify({ t: "chat-post", msg, dataUrl }));
  })();
}

// Envia item da galeria já publicado localmente para o anfitrião espalhar.
export function forwardGalleryToHost(item: LocalGalleryItem) {
  if (!lanConnected() || !ws) return;
  void (async () => {
    let dataUrl: string | null = null;
    if (item.mediaType === "image") {
      dataUrl = await loadBlobDataUrl(`gallery-${item.id}`);
    }
    ws?.send(JSON.stringify({ t: "gallery-publish", item, dataUrl }));
  })();
}
