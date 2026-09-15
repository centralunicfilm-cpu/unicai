// Galeria pública LOCAL (neste Mac) — substitui a tabela "messages" do Supabase.
// Metadados no localStorage + arquivos no IndexedDB (as URLs da Runware expiram).

import { fetchAndCache, loadBlobUrl } from "./mediaCache";

export interface LocalGalleryItem {
  id: string;
  userId: string;
  fullName: string;
  content: string;
  mediaUrl: string; // referência remota (pode expirar; o arquivo real fica no IndexedDB)
  mediaType: "image" | "video";
  createdAt: string;
}

export interface ResolvedGalleryItem extends LocalGalleryItem {
  displayUrl: string;
}

const GALLERY_KEY = "unicfilm.local.gallery";
const MAX_ITEMS = 100;

export function listGallery(): LocalGalleryItem[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGallery(items: LocalGalleryItem[]) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export async function publishToGallery(args: {
  userId: string;
  fullName: string;
  content: string;
  sourceUrl: string;
  mediaType: "image" | "video";
}): Promise<LocalGalleryItem> {
  const item: LocalGalleryItem = {
    id: crypto.randomUUID(),
    userId: args.userId,
    fullName: args.fullName,
    content: args.content.slice(0, 500),
    mediaUrl: args.sourceUrl,
    mediaType: args.mediaType,
    createdAt: new Date().toISOString(),
  };
  // Guarda o arquivo de verdade neste Mac (não bloqueia em caso de falha — usa a URL remota).
  try {
    await fetchAndCache(args.sourceUrl, `gallery-${item.id}`);
  } catch {
    /* mantém referência remota */
  }
  saveGallery([item, ...listGallery()]);
  return item;
}

export async function resolveGallery(): Promise<ResolvedGalleryItem[]> {
  const items = listGallery();
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      displayUrl: (await loadBlobUrl(`gallery-${item.id}`)) ?? item.mediaUrl,
    }))
  );
}

export function removeFromGallery(id: string) {
  saveGallery(listGallery().filter((item) => item.id !== id));
}
