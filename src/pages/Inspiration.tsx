import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Search, Maximize2, Download, Pencil } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import FullscreenViewer from "@/components/FullscreenViewer";
import MediaMetaEditor from "@/components/MediaMetaEditor";
import { INSPIRATION_ITEMS, INSPIRATION_FOLDERS } from "@/data/inspiration";
import { downloadOriginalMedia } from "@/lib/sharedMedia";
import { displayTitle, getMeta, matchesMeta, subscribeMeta } from "@/lib/mediaMeta";

const FOLDER_LABELS: Record<string, string> = {
  "palco": "Palco",
  "lista-10-junho": "Lista 10 Junho",
  "lista-2-junho": "Lista 2 Junho",
  "palcos-novos": "Palcos Novos",
};

export default function Inspiration() {
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<string>("all");
  const [fsIndex, setFsIndex] = useState<number | null>(null);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [metaTick, setMetaTick] = useState(0);

  useEffect(() => subscribeMeta(() => setMetaTick((t) => t + 1)), []);

  const filtered = useMemo(() => {
    void metaTick;
    return INSPIRATION_ITEMS.filter((item) => {
      if (folder !== "all" && item.folder !== folder) return false;
      // Busca por título, #tags e pasta.
      const meta = getMeta(`insp:${item.url}`);
      return matchesMeta(query, meta, [item.title, item.folder]);
    });
  }, [query, folder, metaTick]);

  return (
    <ToolPageLayout
      icon={ImageIcon}
      title="INSPIRAÇÃO"
      subtitle="Referências de palco para criar com IA"
      badge="GALERIA"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar referência..."
            className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFolder("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${folder === "all" ? "bg-orange text-white shadow-lg shadow-orange/20" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-orange/30"}`}
          >
            Todas ({INSPIRATION_ITEMS.length})
          </button>
          {INSPIRATION_FOLDERS.map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${folder === f ? "bg-orange text-white shadow-lg shadow-orange/20" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-orange/30"}`}
            >
              {FOLDER_LABELS[f] || f} ({INSPIRATION_ITEMS.filter((i) => i.folder === f).length})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-xs text-white/30">Nenhuma referência encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <article key={item.url} className="group overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--surface))]">
                <button
                  type="button"
                  onClick={() => setFsIndex(i)}
                  className="relative block aspect-video w-full overflow-hidden bg-black/20 cursor-zoom-in"
                  title={item.title}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70" />
                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/50 p-1.5 text-white/70 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-4 w-4" />
                  </span>
                </button>
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-white/60" title={displayTitle(item.title, getMeta(`insp:${item.url}`))}>{displayTitle(item.title, getMeta(`insp:${item.url}`))}</p>
                    <button
                      type="button"
                      onClick={() => setEditingUrl(item.url)}
                      className="rounded-lg border border-white/10 p-2 text-white/40 transition-colors hover:border-orange/40 hover:text-orange shrink-0"
                      aria-label="Renomear / tags"
                      title="Renomear / tags"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadOriginalMedia(item.url, "inspiracao-palco.png")}
                      className="rounded-lg border border-white/10 p-2 text-white/40 transition-colors hover:border-orange/40 hover:text-orange shrink-0"
                      aria-label="Baixar"
                      title="Baixar"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                  {getMeta(`insp:${item.url}`).tags.length > 0 && (
                    <p className="truncate text-[10px] text-orange/70">
                      {getMeta(`insp:${item.url}`).tags.map((t) => `#${t}`).join(" ")}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {editingUrl && (
        <MediaMetaEditor
          metaKey={`insp:${editingUrl}`}
          fallbackTitle={INSPIRATION_ITEMS.find((i) => i.url === editingUrl)?.title || "Imagem"}
          onClose={() => setEditingUrl(null)}
        />
      )}

      {fsIndex !== null && filtered[fsIndex] && (
        <FullscreenViewer
          url={filtered[fsIndex].url}
          type="image"
          fileName="inspiracao-palco.png"
          onClose={() => setFsIndex(null)}
          items={filtered.map((item) => ({ url: item.url, type: "image" as const, fileName: "inspiracao-palco.png" }))}
          index={fsIndex}
          onIndexChange={setFsIndex}
        />
      )}
    </ToolPageLayout>
  );
}
