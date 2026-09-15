import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clapperboard, Search, Copy, Check, Wand2, ExternalLink, ChevronDown } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import { CINEMATIC_PROMPTS, PROMPT_CATEGORIES, type CinematicPrompt } from "@/data/cinematicPrompts";
import { toast } from "sonner";

export const VIDEO_PREFILL_KEY = "unicfilm.prefill.video";

const cleanTitle = (title: string) => title.replace(/^\d+\.\s*/, "");

export default function Prompts() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CINEMATIC_PROMPTS.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = async (item: CinematicPrompt) => {
    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId((cur) => (cur === item.id ? null : cur)), 2000);
      toast.success("Prompt copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleUseInVideo = (item: CinematicPrompt) => {
    localStorage.setItem(VIDEO_PREFILL_KEY, JSON.stringify({ prompt: item.prompt }));
    navigate("/video-gen");
  };

  return (
    <ToolPageLayout
      icon={Clapperboard}
      title="PROMPTS CINEMÁTICOS"
      subtitle="Biblioteca de prompts de cinema para vídeos com IA"
      badge="BIBLIOTECA"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Busca */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por estilo, cena, diretor..."
            className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange/50 transition-all"
          />
        </div>

        {/* Categorias */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategory("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${category === "all" ? "bg-orange text-white shadow-lg shadow-orange/20" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-orange/30"}`}
          >
            Todos ({CINEMATIC_PROMPTS.length})
          </button>
          {PROMPT_CATEGORIES.map((cat) => {
            const count = CINEMATIC_PROMPTS.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${category === cat ? "bg-orange text-white shadow-lg shadow-orange/20" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-orange/30"}`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-xs text-white/30">Nenhum prompt encontrado para essa busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const isOpen = expanded.has(item.id);
              return (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-[hsl(var(--surface))] p-5 space-y-3 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white leading-snug">{cleanTitle(item.title)}</h3>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-orange/10 border border-orange/20 text-[9px] font-bold uppercase tracking-widest text-orange">
                          {item.category}
                        </span>
                        {item.duration && (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/50">
                            {item.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-white/50 italic leading-relaxed">{item.description}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="text-left rounded-xl bg-black/30 border border-white/5 p-4 group"
                  >
                    <pre className={`text-[11px] leading-relaxed text-white/70 whitespace-pre-wrap font-sans ${isOpen ? "" : "line-clamp-6"}`}>
                      {item.prompt}
                    </pre>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-orange/70 group-hover:text-orange transition-colors">
                      {isOpen ? "Recolher" : "Ler prompt completo"}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>

                  <div className="flex items-center gap-2 pt-1 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 hover:text-white hover:border-orange/40 transition-all flex items-center justify-center gap-2"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copiedId === item.id ? "Copiado!" : "Copiar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseInVideo(item)}
                      className="flex-1 py-2.5 rounded-xl bg-orange text-white text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-orange/20 hover:brightness-110 transition-all"
                    >
                      <Wand2 className="w-4 h-4" /> Usar no vídeo
                    </button>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-orange hover:border-orange/40 transition-all"
                        aria-label="Ver fonte original"
                        title={item.source || "Fonte original"}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Crédito */}
        <p className="text-center text-[10px] text-white/25 tracking-wide pt-2">
          Prompts adaptados de <span className="text-white/40 font-bold">awesome-seedance</span> por ZeroLu (licença MIT) —{" "}
          <a href="https://github.com/ZeroLu/awesome-seedance" target="_blank" rel="noopener noreferrer" className="text-orange/60 hover:text-orange transition-colors">
            github.com/ZeroLu/awesome-seedance
          </a>
        </p>
      </div>
    </ToolPageLayout>
  );
}
