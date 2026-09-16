// Metadados locais das imagens (título personalizado + #tags) — por dispositivo.
// Chave estável por item: "history:<id>" | "gallery:<id>" | "insp:<url>".

export interface MediaMeta {
  title?: string;
  tags: string[];
  updatedAt?: number;
}

const META_KEY = "unicfilm.local.media-meta";

function readAll(): Record<string, MediaMeta> {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getMeta(key: string): MediaMeta {
  const all = readAll();
  return all[key] || { tags: [] };
}

export function setMeta(key: string, meta: MediaMeta) {
  const all = readAll();
  const tags = [...new Set(
    (meta.tags || [])
      .map((t) => t.replace(/^#+/, "").trim().toLowerCase())
      .filter(Boolean)
  )].slice(0, 20);
  const entry: MediaMeta = {
    title: (meta.title || "").trim().slice(0, 120) || undefined,
    tags,
    updatedAt: Date.now(),
  };
  all[key] = entry;
  try {
    localStorage.setItem(META_KEY, JSON.stringify(all));
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new CustomEvent("unicfilm:meta"));
  // Espalha para a equipe quando online (sem travar a UI se falhar).
  void import("./cloudSync").then((m) => m.forwardMetaToCloud(key, entry)).catch(() => {});
}

// Aplica metadado vindo da nuvem (última alteração vence). Não reencaminha.
export function applyRemoteMeta(key: string, meta: MediaMeta): boolean {
  const incomingAt = Number(meta.updatedAt) || 0;
  const all = readAll();
  const currentAt = Number(all[key]?.updatedAt) || 0;
  if (incomingAt < currentAt) return false;
  all[key] = {
    title: (meta.title || "").trim().slice(0, 120) || undefined,
    tags: [...new Set(
      (meta.tags || [])
        .map((t) => String(t).replace(/^#+/, "").trim().toLowerCase())
        .filter(Boolean)
    )].slice(0, 20),
    updatedAt: incomingAt,
  };
  try {
    localStorage.setItem(META_KEY, JSON.stringify(all));
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new CustomEvent("unicfilm:meta"));
  return true;
}

export function subscribeMeta(callback: () => void): () => void {
  const onCustom = () => callback();
  const onStorage = (e: StorageEvent) => {
    if (e.key === META_KEY) callback();
  };
  window.addEventListener("unicfilm:meta", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("unicfilm:meta", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function displayTitle(fallback: string, meta: MediaMeta): string {
  return meta.title || fallback;
}

// Casa busca (texto livre, com ou sem #) contra título, tags e texto extra.
export function matchesMeta(query: string, meta: MediaMeta, extras: string[] = []): boolean {
  const q = query.trim().toLowerCase().replace(/^#+/, "");
  if (!q) return true;
  const hay = [
    meta.title || "",
    ...meta.tags.map((t) => `#${t}`),
    ...meta.tags,
    ...extras,
  ].join("\n").toLowerCase();
  return q.split(/\s+/).every((part) => hay.includes(part.replace(/^#+/, "")));
}
