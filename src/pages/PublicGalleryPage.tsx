import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Filter, Image as ImageIcon, Film, Download, Maximize2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { downloadOriginalMedia } from "@/lib/sharedMedia";
import FullscreenViewer from "@/components/FullscreenViewer";
import { resolveGallery, removeFromGallery, type ResolvedGalleryItem } from "@/lib/localGallery";

type GalleryFilter = "all" | "video" | "image" | "thumbnail" | "audio";

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

export default function PublicGalleryPage() {
  const { user, profile } = useAuth();
  const params = useParams<{ filter?: string }>();
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>(normalizeFilter(params.filter));
  const [items, setItems] = useState<ResolvedGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState<ResolvedGalleryItem | null>(null);

  useEffect(() => {
    setActiveFilter(normalizeFilter(params.filter));
  }, [params.filter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      setItems(await resolveGallery());
    } catch (error: any) {
      console.error("Gallery load error:", error);
      setItems([]);
      toast.error(error?.message || "Erro ao carregar a galeria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("Remover esta publicação da galeria deste Mac?")) return;
    removeFromGallery(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Publicação removida.");
  };

  const canDelete = (item: ResolvedGalleryItem) =>
    item.userId === user?.id || profile?.role === "admin_master";

  const filterOptions: { key: GalleryFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "video", label: "Vídeos" },
    { key: "image", label: "Imagens" },
    { key: "thumbnail", label: "Thumbnails" },
    { key: "audio", label: "Áudios" },
  ];

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "image") return items.filter((item) => item.mediaType === "image" || item.mediaType === "thumbnail");
    return items.filter((item) => item.mediaType === activeFilter);
  }, [items, activeFilter]);

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
          <Film className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[hsl(var(--text-secondary))]">Galeria deste Mac</span>
        </div>
        <h1 className="text-4xl md:text-5xl text-[hsl(var(--text-primary))]">Publicações da Equipe</h1>
        <p className="text-sm text-[hsl(var(--text-secondary))]">Tudo que a equipe publicar (imagem ou vídeo) aparece aqui neste Mac.</p>
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
            Nenhuma publicação ainda. Gere uma imagem ou vídeo e clique em GALERIA para publicar aqui.
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
                <div className="aspect-video bg-[hsl(var(--background))] relative group">
                  {item.mediaType === "video" ? (
                    <video src={item.displayUrl} controls className="w-full h-full object-cover" preload="metadata" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFullscreen(item)}
                      className="block w-full h-full cursor-zoom-in"
                      title="Ver em tela cheia"
                    >
                      <img src={item.displayUrl} alt={item.content || "Publicação da equipe"} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setFullscreen(item)}
                      className="p-2 rounded-lg bg-black/60 text-white/80 hover:text-white hover:bg-orange transition-colors"
                      aria-label="Tela cheia"
                      title="Tela cheia"
                    >
                      {item.mediaType === "video" ? <Maximize2 className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </button>
                    {canDelete(item) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg bg-black/60 text-white/60 hover:text-red-400 transition-colors"
                        aria-label="Remover"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center justify-center">
                      <UserAvatarFallback name={item.fullName} />
                    </div>
                    <span className="text-xs font-semibold text-[hsl(var(--text-primary))]">{item.fullName}</span>
                    <span className="text-[10px] text-[hsl(var(--text-dim))] ml-auto">
                      {new Date(item.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(var(--text-secondary))] line-clamp-2">{item.content || "Sem texto"}</p>
                  <button
                    type="button"
                    onClick={() => downloadOriginalMedia(
                      item.displayUrl,
                      item.mediaType === "video" ? "unicfilm-video.mp4" : "unicfilm-image.png",
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

      {fullscreen && (
        <FullscreenViewer
          url={fullscreen.displayUrl}
          type={fullscreen.mediaType === "video" ? "video" : "image"}
          fileName={fullscreen.mediaType === "video" ? "unicfilm-video.mp4" : "unicfilm-image.png"}
          onClose={() => setFullscreen(null)}
        />
      )}
    </div>
  );
}

function UserAvatarFallback({ name }: { name: string }) {
  return <span className="text-[10px] font-bold uppercase text-[hsl(var(--text-secondary))]">{name.charAt(0) || "U"}</span>;
}
