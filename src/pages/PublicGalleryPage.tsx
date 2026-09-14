import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Filter, Image as ImageIcon, Video, Film, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { downloadOriginalMedia, isGalleryEligibleContent, visibleSharedContent } from "@/lib/sharedMedia";

type GalleryFilter = "all" | "video" | "image" | "thumbnail" | "audio";

interface GalleryItem {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  content: string;
  media_url: string;
  media_type: "image" | "video" | "thumbnail" | "audio";
  created_at: string;
}

const REQUEST_TIMEOUT_MS = 12000;

function withTimeout<T>(operation: () => PromiseLike<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    Promise.resolve(operation()).then(
      (result) => {
        window.clearTimeout(timer);
        resolve(result);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function normalizeFilter(value?: string): GalleryFilter {
  switch ((value || "").toLowerCase()) {
    case "videos":
    case "video":
      return "video";
    case "images":
    case "imagem":
    case "image":
      return "image";
    case "thumbnails":
    case "thumbnail":
      return "thumbnail";
    case "audios":
    case "audio":
      return "audio";
    default:
      return "all";
  }
}

function inferMediaType(mediaType: string | null, mediaUrl: string): GalleryItem["media_type"] {
  if (mediaType === "video") return "video";
  if (mediaType === "image") return "image";

  const lower = mediaUrl.toLowerCase();
  if (lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".m4a")) return "audio";
  if (lower.includes("thumbnail")) return "thumbnail";
  return "image";
}

export default function PublicGalleryPage() {
  const { user, profile } = useAuth();
  const params = useParams<{ filter?: string }>();
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>(normalizeFilter(params.filter));
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveFilter(normalizeFilter(params.filter));
  }, [params.filter]);

  useEffect(() => {
    let mounted = true;

    const loadGallery = async () => {
      setLoading(true);
      try {
        const { data, error } = await withTimeout(
          async () =>
            await supabase
              .from("messages")
              .select("id,user_id,full_name,avatar_url,content,media_url,media_type,created_at")
              .not("media_url", "is", null)
              .order("created_at", { ascending: false })
              .limit(300),
          REQUEST_TIMEOUT_MS,
          "Tempo excedido ao carregar a galeria pública.",
        );

        if (error) throw error;

        if (mounted) {
          const mapped = (data || [])
            .filter((entry) => !!entry.media_url && isGalleryEligibleContent(entry.content))
            .map((entry) => ({
              id: entry.id,
              user_id: entry.user_id,
              full_name: entry.full_name || "Membro",
              avatar_url: entry.avatar_url,
              content: visibleSharedContent(entry.content),
              media_url: entry.media_url as string,
              media_type: inferMediaType(entry.media_type, entry.media_url as string),
              created_at: entry.created_at,
            }));

          setItems(mapped);
        }
      } catch (error: any) {
        console.error("Gallery load error:", error);
        if (mounted) {
          setItems([]);
          toast.error(error?.message || "Erro ao carregar a galeria");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadGallery();

    const channel = supabase
      .channel("public_gallery_messages")
      .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
        const next = payload.new;
        if (!next?.media_url || !mounted || !isGalleryEligibleContent(next.content)) return;

        const item: GalleryItem = {
          id: next.id,
          user_id: next.user_id,
          full_name: next.full_name || "Membro",
          avatar_url: next.avatar_url || null,
          content: visibleSharedContent(next.content),
          media_url: next.media_url,
          media_type: inferMediaType(next.media_type, next.media_url),
          created_at: next.created_at,
        };

        setItems((prev) => (prev.some((existing) => existing.id === item.id) ? prev : [item, ...prev]));
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filterOptions: { key: GalleryFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "video", label: "Vídeos" },
    { key: "image", label: "Imagens" },
    { key: "thumbnail", label: "Thumbnails" },
    { key: "audio", label: "Áudios" },
  ];

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.media_type === activeFilter);
  }, [items, activeFilter]);

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
          <Film className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[hsl(var(--text-secondary))]">Galeria Pública</span>
        </div>
        <h1 className="text-4xl md:text-5xl text-[hsl(var(--text-primary))]">Publicações da Equipe</h1>
        <p className="text-sm text-[hsl(var(--text-secondary))]">Tudo o que for publicado no chat geral com mídia aparece aqui em tempo real.</p>
      </header>

      <section className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-[hsl(var(--text-dim))]" />
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveFilter(option.key)}
              className={
                activeFilter === option.key
                  ? "px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase bg-primary text-primary-foreground"
                  : "px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--border))] border-t-primary animate-spin" />
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-10 text-center text-[hsl(var(--text-secondary))]">
            Nenhuma publicação encontrada para este filtro.
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
                <div className="aspect-video bg-[hsl(var(--background))]">
                  {item.media_type === "video" ? (
                    <video src={item.media_url} controls className="w-full h-full object-cover" preload="metadata" />
                  ) : (
                    <img src={item.media_url} alt={item.content || "Publicação da equipe"} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center justify-center">
                      {(item.user_id === user?.id ? profile?.avatar_url : item.avatar_url) ? (
                        <img
                          src={(item.user_id === user?.id ? profile?.avatar_url : item.avatar_url) || ""}
                          alt={item.full_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <UserAvatarFallback name={item.full_name} />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[hsl(var(--text-primary))]">{item.full_name}</span>
                    <span className="text-[10px] text-[hsl(var(--text-dim))] ml-auto">
                      {new Date(item.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(var(--text-secondary))] line-clamp-2">{item.content || "Sem texto"}</p>
                  <button
                    type="button"
                    onClick={() => downloadOriginalMedia(
                      item.media_url,
                      item.media_type === "video" ? "unicfilm-video.mp4" : "unicfilm-image.png",
                    )}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange/30 bg-orange/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-orange transition-colors hover:bg-orange hover:text-white"
                  >
                    <Download className="h-4 w-4" /> Baixar original
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UserAvatarFallback({ name }: { name: string }) {
  return <span className="text-[10px] font-bold uppercase text-[hsl(var(--text-secondary))]">{name.charAt(0) || "U"}</span>;
}
