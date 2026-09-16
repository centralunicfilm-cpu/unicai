// Sincronia ONLINE via Worker Cloudflare (entre redes, sem Supabase).
// Imagens viajam (R2); VÍDEOS NÃO — só metadados, o arquivo fica local.
// Auth: código da equipe (TEAM_SECRET do Worker).

import { mergeChatMessage, type ChatMessage } from "./localChat";
import { mergeGalleryItem, type LocalGalleryItem } from "./localGallery";
import { applyRemoteMeta, type MediaMeta } from "./mediaMeta";
import { loadBlobDataUrl } from "./mediaCache";

const CLOUD_HOST_KEY = "unicfilm.local.cloud.host";
const CLOUD_SECRET_KEY = "unicfilm.local.cloud.secret";

// URL pública do relay (não é segredo) — o código da equipe é o que protege.
export const DEFAULT_CLOUD_HOST = "unicfilm-relay.central-unicfilm.workers.dev";

type CloudState = "off" | "connecting" | "on";

let ws: WebSocket | null = null;
let connState: CloudState = "off";
let cloudAuthed = false;
let workerHost = "";
let wantConnection = false;
let reconnectTimer: number | null = null;
let cloudClients: Array<{ id: string; name: string }> = [];
let identity: { id: string; name: string } = { id: "", name: "" };

function emitCloud() {
  window.dispatchEvent(new CustomEvent("unicfilm:cloud"));
}

export function subscribeCloud(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener("unicfilm:cloud", handler);
  return () => window.removeEventListener("unicfilm:cloud", handler);
}

export function cloudState(): {
  state: CloudState;
  host: string;
  authed: boolean;
  clients: Array<{ id: string; name: string }>;
} {
  return { state: connState, host: workerHost, authed: cloudAuthed, clients: cloudClients };
}

export function cloudConnected(): boolean {
  return connState === "on" && !!ws && ws.readyState === WebSocket.OPEN;
}

export function savedCloudHost(): string {
  try {
    return localStorage.getItem(CLOUD_HOST_KEY) || "";
  } catch {
    return "";
  }
}

export function savedCloudSecret(): string {
  try {
    return localStorage.getItem(CLOUD_SECRET_KEY) || "";
  } catch {
    return "";
  }
}

function setState(next: CloudState) {
  connState = next;
  emitCloud();
}

function scheduleReconnect(secret: string) {
  if (!wantConnection || reconnectTimer !== null) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    if (wantConnection && connState !== "on") {
      void openSocket(secret);
    }
  }, 10000);
}

function normalizeHost(input: string): string {
  let h = input.trim().replace(/^wss?:\/\//, "").replace(/\/+$/, "");
  return h;
}

async function openSocket(secret: string): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (err: string | null) => {
      if (!settled) {
        settled = true;
        resolve(err);
      }
    };
    try {
      const socket = new WebSocket(`wss://${workerHost}/ws`);
      ws = socket;
      setState("connecting");

      const timeout = window.setTimeout(() => {
        try {
          socket.close();
        } catch {
          /* ignora */
        }
        if (connState !== "on") setState("off");
        done("Anfitrião online inalcançável. Confira a URL.");
      }, 12000);

      socket.onopen = () => {
        socket.send(JSON.stringify({ t: "hello", secret, user: identity }));
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
          cloudAuthed = msg.authed !== false;
          for (const m of (msg.chat || []) as any[]) {
            await mergeChatMessage(
              {
                id: String(m.id),
                userId: String(m.userId || m.user_id || ""),
                fullName: String(m.fullName || m.full_name || "Equipe"),
                content: String(m.content || ""),
                mediaUrl: m.mediaUrl || m.media_url ? String(m.mediaUrl || m.media_url) : null,
                mediaType: m.mediaType === "video" || m.media_type === "video" ? "video" : m.mediaType === "image" || m.media_type === "image" ? "image" : null,
                createdAt: String(m.createdAt || m.created_at || new Date().toISOString()),
              } as ChatMessage,
              m.dataUrl ?? null
            );
          }
          for (const g of (msg.gallery || []) as any[]) {
            await mergeGalleryItem(
              {
                id: String(g.id),
                userId: String(g.userId || g.user_id || ""),
                fullName: String(g.fullName || g.full_name || "Equipe"),
                content: String(g.content || ""),
                mediaUrl: g.mediaUrl || g.media_url ? String(g.mediaUrl || g.media_url) : "",
                mediaType: g.mediaType === "video" || g.media_type === "video" ? "video" : "image",
                createdAt: String(g.createdAt || g.created_at || new Date().toISOString()),
              } as LocalGalleryItem,
              g.dataUrl ?? null
            );
          }
          window.dispatchEvent(new CustomEvent("unicfilm:gallery"));
          for (const entry of (msg.meta || []) as any[]) {
            if (entry && entry.key) {
              let tags: string[] = [];
              try {
                tags = typeof entry.tags === "string" ? JSON.parse(entry.tags) : entry.tags || [];
              } catch {
                tags = [];
              }
              applyRemoteMeta(String(entry.key), {
                title: entry.title || undefined,
                tags,
                updatedAt: Number(entry.updatedAt || entry.updated_at) || 0,
              });
            }
          }
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
        } else if (msg.t === "meta-new" && msg.key) {
          applyRemoteMeta(String(msg.key), (msg.meta || {}) as MediaMeta);
        } else if (msg.t === "clients") {
          cloudClients = Array.isArray(msg.clients) ? msg.clients : [];
          emitCloud();
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
          done(String(msg.message || "Erro do relay."));
        }
      };

      socket.onerror = () => {
        window.clearTimeout(timeout);
        if (connState !== "on") {
          setState("off");
          done("Não foi possível alcançar o relay. Confira a URL.");
        }
      };

      socket.onclose = () => {
        window.clearTimeout(timeout);
        if (ws === socket) ws = null;
        cloudClients = [];
        cloudAuthed = false;
        if (wantConnection) {
          setState("off");
          scheduleReconnect(secret);
        } else {
          setState("off");
        }
      };
    } catch {
      done("Não foi possível abrir a conexão.");
    }
  });
}

export async function cloudConnect(
  host: string,
  secret: string,
  user: { id: string; name: string }
): Promise<string | null> {
  cloudDisconnect(false);
  workerHost = normalizeHost(host) || DEFAULT_CLOUD_HOST;
  identity = { id: user.id, name: user.name };
  wantConnection = true;
  // Segredo vazio = convidado (só conversa). Com código = acesso total.
  try {
    localStorage.setItem(CLOUD_HOST_KEY, workerHost);
    if (secret.trim()) localStorage.setItem(CLOUD_SECRET_KEY, secret.trim());
  } catch {
    /* ignora */
  }
  return openSocket(secret.trim());
}

export function cloudDisconnect(emit = true) {
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
  cloudClients = [];
  if (emit) setState("off");
}

// Troca o código da equipe no relay (só admin, precisa estar conectado).
export function cloudAdminRotate(adminSecret: string, newSecret: string): Promise<string | null> {
  if (!cloudConnected() || !ws) return Promise.resolve("Conecte-se ao relay primeiro.");
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", () => {});
      resolve("Sem resposta do relay.");
    }, 12000);
    const onMsg = (event: MessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(String((event as MessageEvent).data));
      } catch {
        return;
      }
      if (msg.t === "secret-rotated") {
        window.clearTimeout(timer);
        ws?.removeEventListener("message", onMsg as EventListener);
        resolve(null);
      } else if (msg.t === "error") {
        window.clearTimeout(timer);
        ws?.removeEventListener("message", onMsg as EventListener);
        resolve(String(msg.message || "Erro."));
      }
    };
    // Ouve direto no socket (resposta vem fora do fluxo do app).
    try {
      (ws as unknown as { addEventListener: (t: string, f: (e: Event) => void) => void }).addEventListener("message", onMsg as (e: Event) => void);
    } catch {
      window.clearTimeout(timer);
      resolve("Conexão indisponível.");
      return;
    }
    ws?.send(JSON.stringify({ t: "admin-rotate-secret", adminSecret, newSecret }));
  });
}

// Envia mensagem já salva localmente para o relay espalhar (imagem ≤8MB; vídeo só metadados).
export function forwardChatToCloud(msg: ChatMessage) {
  if (!cloudConnected() || !ws) return;
  void (async () => {
    let dataUrl: string | null = null;
    if (msg.mediaType === "image") {
      dataUrl = await loadBlobDataUrl(`chat-${msg.id}`);
    }
    ws?.send(JSON.stringify({ t: "chat-post", msg, dataUrl }));
  })();
}

// Envia título/tags de uma imagem para a equipe.
export function forwardMetaToCloud(key: string, meta: MediaMeta) {
  if (!cloudConnected() || !ws) return;
  try {
    ws.send(JSON.stringify({ t: "meta-set", key, meta }));
  } catch {
    /* ignora */
  }
}

// Envia item da galeria já publicado localmente (imagem ≤8MB; vídeo só metadados).
export function forwardGalleryToCloud(item: LocalGalleryItem) {
  if (!cloudConnected() || !ws) return;
  void (async () => {
    let dataUrl: string | null = null;
    if (item.mediaType === "image") {
      dataUrl = await loadBlobDataUrl(`gallery-${item.id}`);
    }
    ws?.send(JSON.stringify({ t: "gallery-publish", item, dataUrl }));
  })();
}

export { CLOUD_SECRET_KEY };
