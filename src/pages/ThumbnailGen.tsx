import { useState } from "react";
import { Paintbrush, Download, Loader2, Wand2, Image as ImageIcon } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import ComponentGallery from "@/components/ComponentGallery";

const platforms = ["YouTube", "Instagram", "TikTok", "LinkedIn", "Podcast"];
const thumbStyles = ["Dramático", "Minimalista", "Bold Text", "Cinematográfico", "Colorido", "Dark"];

const mockThumbnails = [
  {
    id: "1",
    user: "Vinicius",
    url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
    prompt: "High impact YouTube thumbnail for cinema gear review",
    type: "thumbnail" as const,
    timestamp: "10 min atrás"
  },
  {
    id: "2",
    user: "Damaceno",
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    prompt: "Instagram Reels cover with neon high-tech aesthetic",
    type: "thumbnail" as const,
    timestamp: "45 min atrás"
  }
];

export default function ThumbnailGen() {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [thumbStyle, setThumbStyle] = useState("Dramático");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolution = platform === "YouTube" ? "1280x720" : platform === "Instagram" ? "1080x1350" : "1080x1080";

  const handleGenerate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: `Create a professional ${platform} thumbnail (${resolution}) in ${thumbStyle} style for: "${title}". Bold typography, high contrast, eye-catching composition, professional video production quality, ultra high resolution.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar thumbnail");
      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) setResult(imageUrl);
      else throw new Error("Nenhuma imagem gerada");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout
      icon={Paintbrush}
      title="GERAR THUMBNAIL"
      subtitle="Gere thumbnails de alto impacto para seus conteúdos"
      badge="IA"
    >
      <div className="max-w-6xl mx-auto space-y-8">

        {/* TOP: Reference Image with Drag & Drop */}
        <div className="w-full animate-fade-in-up">
          <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase flex justify-between">
            <span>Imagem de Referência</span>
            <span className="text-orange text-[10px] lowercase italic">opcional</span>
          </label>
          <div className="group relative h-40 border-2 border-dashed border-[hsl(var(--border))] rounded-2xl flex flex-col items-center justify-center transition-all hover:border-orange/50 hover:bg-orange/5 cursor-pointer bg-[hsl(var(--surface))] overflow-hidden">
            <div className="flex flex-col items-center gap-2 text-[hsl(var(--text-dim))] group-hover:text-orange/70">
              <ImageIcon className="w-6 h-6 opacity-40 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Arraste sua Referência</span>
              <p className="text-[10px] lowercase opacity-50">Ajude a IA a entender o estilo desejado</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">
                Título / Tema do Vídeo
              </label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 10 Segredos de Cinematografia que Ninguém Conta"
                rows={2}
                className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl px-6 py-4 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] input-glow focus:outline-none transition-all text-lg font-bold leading-tight"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase flex justify-between">
                  <span>Plataforma</span>
                  <span className="text-orange text-[10px] lowercase tracking-normal">{resolution}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-all uppercase ${platform === p
                        ? "bg-orange text-white shadow-lg shadow-orange/20 border-orange"
                        : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-orange/30"
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Estilo Visual</label>
                <div className="grid grid-cols-2 gap-2">
                  {thumbStyles.map((s) => (
                    <button
                      key={s}
                      onClick={() => setThumbStyle(s)}
                      className={`px-3 py-2.5 rounded-xl text-[10px] font-medium transition-all text-left truncate ${thumbStyle === s
                        ? "bg-white/10 text-white border border-white/20"
                        : "bg-[#0B0B0D] text-[hsl(var(--text-secondary))] border border-white/5 hover:bg-white/5"
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !title.trim()}
              className="w-full py-5 rounded-2xl font-display text-xl tracking-[0.2em] text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />GERANDO...</> : <><Wand2 className="w-5 h-5" />GERAR THUMBNAIL</>}
            </button>

            {error && <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 text-sm text-destructive">{error}</div>}
          </div>

          <div className="lg:col-span-5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Resultado Final</label>
            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl aspect-video flex items-center justify-center overflow-hidden relative shadow-2xl">
              {loading && (
                <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-orange/30 border-t-orange animate-spin" />
                  <p className="text-[10px] font-bold tracking-[0.2em] text-orange uppercase">Renderizando...</p>
                </div>
              )}
              {result && !loading && <img src={result} alt="Thumbnail" className="w-full h-full object-cover rounded-xl" />}
              {!result && !loading && (
                <div className="flex flex-col items-center gap-4 text-[hsl(var(--text-dim))]">
                  <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center mb-2">
                    <Paintbrush className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Layout Vazio</p>
                </div>
              )}

              {result && !loading && (
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                  <a href={result} download="unicfilm-thumbnail.png" className="w-full py-3.5 rounded-xl bg-orange text-white text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-orange/30 transition-transform hover:scale-105">
                    <Download className="w-4 h-4" /> COMPRAR E BAIXAR
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
                <span>Qualidade</span>
                <span>100%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-orange w-full" />
              </div>
            </div>
          </div>
        </div>

        <ComponentGallery
          title="Sua Galeria de Thumbnails"
          items={mockThumbnails}
          type="thumbnail"
        />

      </div>
    </ToolPageLayout>
  );
}
