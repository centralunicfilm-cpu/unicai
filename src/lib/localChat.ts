// Chat da equipe LOCAL (neste Mac) — substitui a tabela "messages" do Supabase.
// Metadados no localStorage + mídia no IndexedDB. Abas/janelas do mesmo Mac
// sincronizam via evento "storage"; a rede entre Macs entra via lanSync.

import { fetchAndCache, loadBlobUrl } from "./mediaCache";

export interface ChatMessage {
  id: string;
  userId: string;
  fullName: string;
  content: string;
  mediaUrl: string | null; // referência (pode expirar; o arquivo real fica no IndexedDB)
  mediaType: "image" | "video" | null;
  createdAt: string;
  origin?: "local" | "lan";
}

export interface ResolvedChatMessage extends ChatMessage {
  displayUrl: string | null;
}

const CHAT_KEY = "unicfilm.local.chat";
const CHAT_PING_KEY = "unicfilm.local.chat.ping";
const CHAT_MAX = 300;

export function listChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChat(items: ChatMessage[]) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(items.slice(-CHAT_MAX)));
}

export function notifyChat() {
  try {
    localStorage.setItem(CHAT_PING_KEY, String(Date.now()));
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new CustomEvent("unicfilm:chat"));
}

export function subscribeChat(callback: () => void): () => void {
  const onCustom = () => callback();
  const onStorage = (e: StorageEvent) => {
    if (e.key === CHAT_KEY || e.key === CHAT_PING_KEY) callback();
  };
  window.addEventListener("unicfilm:chat", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("unicfilm:chat", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export async function sendChatMessage(args: {
  userId: string;
  fullName: string;
  content: string;
  sourceUrl?: string | null;
  mediaType?: "image" | "video" | null;
}): Promise<ChatMessage> {
  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    userId: args.userId,
    fullName: args.fullName,
    content: args.content.slice(0, 2000),
    mediaUrl: args.sourceUrl ?? null,
    mediaType: args.mediaType ?? null,
    createdAt: new Date().toISOString(),
    origin: "local",
  };
  if (args.sourceUrl) {
    try {
      await fetchAndCache(args.sourceUrl, `chat-${msg.id}`);
    } catch {
      /* segue com referência */
    }
  }
  saveChat([...listChat(), msg]);
  notifyChat();
  return msg;
}

// Mescla mensagem vinda da rede (anfitrião) — sem duplicar. Retorna true se inseriu.
export async function mergeChatMessage(
  msg: ChatMessage,
  dataUrl?: string | null
): Promise<boolean> {
  const current = listChat();
  if (current.some((m) => m.id === msg.id)) return false;
  if (dataUrl) {
    try {
      const { cacheBlob } = await import("./mediaCache");
      const resp = await fetch(dataUrl);
      if (resp.ok) await cacheBlob(`chat-${msg.id}`, await resp.blob());
    } catch {
      /* segue com referência */
    }
  }
  saveChat([...current, { ...msg, origin: "lan" }]);
  notifyChat();
  return true;
}

export async function resolveChat(): Promise<ResolvedChatMessage[]> {
  const items = listChat();
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      displayUrl:
        item.mediaType === "image"
          ? (await loadBlobUrl(`chat-${item.id}`)) ?? item.mediaUrl
          : item.mediaUrl,
    }))
  );
}
