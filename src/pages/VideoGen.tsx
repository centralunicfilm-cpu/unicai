import { useEffect, useRef, useState } from "react";
import { Video, Loader2, Wand2, Play, Download, Images, MessagesSquare, Maximize2 } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import ImageDropZone from "@/components/ImageDropZone";
import EngineSwitchNotice from "@/components/EngineSwitchNotice";
import FullscreenViewer from "@/components/FullscreenViewer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { downloadOriginalMedia } from "@/lib/sharedMedia";
import { generateVideoDirect, loadLocalHistory, saveLocalHistoryItem } from "@/lib/runware";
import { publishToGallery } from "@/lib/localGallery";

const videoStyles = [
  "Cinematográfico", "Documental", "Comercial", "Clip Musical",
  "Épico", "Cyberpunk", "Anime", "3D Render", "Vintage", "Surrealista"
];

const engineFamilies = [
  { name: "MiniMax H3", versions: ["MiniMax H3", "MiniMax H3 Fast", "MiniMax H3 Max", "MiniMax H3 Max Turbo"] },
  { name: "Seedance", versions: ["Seedance 1.5", "Seedance 2.0", "Seedance 2.5"] },
  { name: "Kling", versions: ["Kling 1.0", "Kling 1.5", "Kling 2.0", "Kling 2.5", "Kling 3.0", "Kling 3.5"] },
  { name: "VEO", versions: ["VEO 3"] },
  { name: "GROK", versions: ["GROK"] },
];
const ratios = ["16:9", "9:16", "1:1", "4:3"];

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  engine: string;
  createdAt: string;
}

export default function VideoGen() {
  const { user, profile } = useAuth();
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [engine, setEngine] = useState("MiniMax H3 Fast");
  const [engineFamily, setEngineFamily] = useState("MiniMax H3");
  const [style, setStyle] = useState("Cinematográfico");
  const [duration, setDuration] = useState(5);
  const [ratio, setRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const [sharingToChat, setSharingToChat] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const engineNoticeCount = useRef(0);
  const [engineNotice, setEngineNotice] = useState({ open: false, previous: "", next: "" });
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);

  useEffect(() => {
    if (!user) {
      setGeneratedVideos([]);
      return;
    }
    // Histórico local neste Mac (sem Supabase)
    const items = loadLocalHistory(user.id, "video");
    setGeneratedVideos(items.map((item) => ({
      id: item.id,
      url: item.url,
      prompt: item.prompt,
      engine: item.engine,
      createdAt: item.createdAt,
    })));
  }, [user]);

  const selectEngine = (nextEngine: string) => {
    if (nextEngine !== engine && engineNoticeCount.current < 2) {
      engineNoticeCount.current += 1;
      setEngineNotice({ open: true, previous: engine, next: nextEngine });
    }
    setEngine(nextEngine);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Chamada direta à Runware (mesma key da Edge Function, via VITE_RUNWARE_API_KEY)
      const { videoUrl } = await generateVideoDirect({
        prompt, engine, duration, referenceImage,
      });
      void ratio;
      setResult(videoUrl);
      setLastPrompt(prompt);
      toast.success("Vídeo gerado com sucesso!");
      if (user) {
        const item = {
          id: crypto.randomUUID(),
          url: videoUrl,
          prompt: prompt.slice(0, 500),
          engine,
          type: "video" as const,
          createdAt: new Date().toISOString(),
        };
        saveLocalHistoryItem(user.id, item);
        setGeneratedVideos((current) => [{
          id: item.id, url: item.url, prompt: item.prompt, engine: item.engine, createdAt: item.createdAt,
        }, ...current].slice(0, 20));
      }
    } catch (e: any) {
      setError(e.message || "Erro ao gerar vídeo");
      toast.error(e.message || "Erro ao gerar vídeo");
    } finally {
      setLoading(false);
    }
  };

  const shareGeneratedVideo = async (destination: "chat" | "gallery") => {
    if (!result || !user) return;
    destination === "chat" ? setSharingToChat(true) : setPublishing(true);
    try {
      if (destination === "gallery") {
        // Galeria pública local (neste Mac) — visível para as contas do Mac na página Galeria.
        await publishToGallery({
          userId: user.id,
          fullName: profile?.full_name || "Membro",
          content: lastPrompt || prompt,
          sourceUrl: result,
          mediaType: "video",
        });
        toast.success("Vídeo publicado na galeria deste Mac!");
      } else {
        // Chat da equipe compartilhado via Supabase desativado no modo local.
        toast.info("Chat da equipe desativado no modo local. Use DOWNLOAD para salvar.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível compartilhar o vídeo.");
    } finally {
      destination === "chat" ? setSharingToChat(false) : setPublishing(false);
    }
  };

  return (
    <ToolPageLayout icon={Video} title="GERAR VÍDEO" subtitle="Transforme textos em vídeos cinematográficos com IA" badge="IA">
      <EngineSwitchNotice
        open={engineNotice.open}
        onOpenChange={(open) => setEngineNotice((notice) => ({ ...notice, open }))}
        previousEngine={engineNotice.previous}
        nextEngine={engineNotice.next}
      />
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Compact image inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
          <ImageDropZone
            label="Referência"
            value={referenceImage}
            onChange={(url) => setReferenceImage(url)}
            height="h-36"
            compact
          />
          <ImageDropZone
            label="Frame Inicial"
            value={startFrame}
            onChange={(url) => setStartFrame(url)}
            height="h-36"
          />
          <ImageDropZone
            label="Frame Final"
            value={endFrame}
            onChange={(url) => setEndFrame(url)}
            height="h-36"
          />
        </div>

        <div>
          {/* LEFT: Prompt + Options */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Descrição do Vídeo</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Câmera voa sobre metrópole futurista à noite, luzes neon refletindo em arranha-céus..."
                rows={4}
                className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl px-6 py-4 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] resize-none input-glow focus:outline-none transition-all text-lg leading-relaxed"
              />
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Engine</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {engineFamilies.map((family) => (
                    <button
                      key={family.name}
                      onClick={() => {
                        setEngineFamily(family.name);
                        selectEngine(family.versions[0]);
                      }}
                      className={`px-3 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all uppercase ${engineFamily === family.name ? "bg-orange text-white shadow-lg shadow-orange/20" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-orange/30"}`}
                    >
                      {family.name}
                    </button>
                  ))}
                </div>

                {engineFamilies.find((family) => family.name === engineFamily)?.versions.length > 1 && (
                  <div className="mt-3 rounded-2xl border border-white/5 bg-[hsl(var(--surface))] p-3">
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">Versão</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {engineFamilies
                        .find((family) => family.name === engineFamily)
                        ?.versions.map((version) => (
                          <button
                            key={version}
                            onClick={() => selectEngine(version)}
                            className={`rounded-xl px-3 py-2.5 text-[10px] font-bold transition-all ${engine === version ? "bg-white text-black" : "bg-white/5 text-white/40 hover:text-white"}`}
                          >
                            {version.replace(`${engineFamily} `, "")}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Proporção</label>
                <div className="grid grid-cols-4 gap-2">
                  {ratios.map((r) => (
                    <button key={r} onClick={() => setRatio(r)}
                      className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${ratio === r ? "bg-white text-black" : "bg-white/5 text-white/40 hover:text-white"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Estilo Visual</label>
              <div className="flex flex-wrap gap-2">
                {videoStyles.map((s) => (
                  <button key={s} onClick={() => setStyle(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${style === s ? "bg-white/10 text-white border border-white/20" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-white/20 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <label htmlFor="video-duration" className="text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] uppercase">Duração</label>
                <span className="min-w-16 rounded-xl border border-orange/30 bg-orange/10 px-3 py-1.5 text-center text-sm font-bold text-orange">
                  {duration}s
                </span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[hsl(var(--surface))] px-5 py-5">
                <input
                  id="video-duration"
                  type="range"
                  min={3}
                  max={30}
                  step={1}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="w-full cursor-pointer accent-orange"
                  aria-valuetext={`${duration} segundos`}
                />
                <div className="mt-2 flex justify-between text-[10px] font-bold tracking-widest text-white/30">
                  <span>3s</span>
                  <span>30s</span>
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="w-full py-5 rounded-2xl font-display text-xl tracking-[0.2em] text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />GERANDO...</> : <><Wand2 className="w-5 h-5" />GERAR VÍDEO</>}
            </button>
          </div>

        </div>

        {/* Main Preview */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Preview</label>
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl aspect-video flex items-center justify-center overflow-hidden relative min-h-[260px] max-h-[620px]">
            {loading && (
              <div className="flex flex-col items-center gap-3 z-10 bg-[#0B0B0D]/60 backdrop-blur-sm inset-0 absolute justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-orange/30 border-t-orange animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-orange uppercase animate-pulse">Processando com {engine}...</p>
              </div>
            )}
            {result && !loading && (
              <video src={result} className="w-full h-full object-contain rounded-xl" controls autoPlay />
            )}
            {result && !loading && (
              <button
                type="button"
                onClick={() => setFullscreenUrl(result)}
                className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/60 backdrop-blur text-white/70 hover:text-white hover:bg-orange transition-colors z-10"
                aria-label="Ver em tela cheia"
                title="Tela cheia"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            {error && !loading && (
              <div className="flex flex-col items-center gap-4 text-center p-6">
                <div className="w-16 h-16 rounded-full border border-orange/20 bg-orange/5 flex items-center justify-center">
                  <Play className="w-8 h-8 text-orange/40" />
                </div>
                <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">{error}</p>
              </div>
            )}
            {!result && !loading && !error && (
              <div className="flex flex-col items-center gap-4 text-[hsl(var(--text-dim))]">
                <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center">
                  <Video className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Aguardando IA</p>
              </div>
            )}
            {result && !loading && (
              <div className="absolute inset-x-0 bottom-0 grid grid-cols-1 gap-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => downloadOriginalMedia(result, "unicfilm-video.mp4")}
                  className="py-3 rounded-xl bg-orange text-white text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
                >
                  <Download className="w-4 h-4" /> DOWNLOAD
                </button>
                <button
                  type="button"
                  onClick={() => shareGeneratedVideo("chat")}
                  disabled={sharingToChat}
                  className="py-3 rounded-xl bg-white/10 backdrop-blur text-white text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 border border-white/10 hover:bg-white/20 transition-all disabled:opacity-40"
                >
                  {sharingToChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessagesSquare className="w-4 h-4" />}
                  ENVIAR NO CHAT
                </button>
                <button
                  type="button"
                  onClick={() => shareGeneratedVideo("gallery")}
                  disabled={publishing}
                  className="py-3 rounded-xl bg-white/10 backdrop-blur text-white text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 border border-white/10 hover:bg-white/20 transition-all disabled:opacity-40"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Images className="w-4 h-4" />}
                  GALERIA PÚBLICA
                </button>
              </div>
            )}
          </div>
        </div>

        <section className="animate-fade-in-up" style={{ animationDelay: "250ms" }}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-secondary))]">
              Galeria de Vídeos Gerados
            </h2>
            <span className="text-[10px] font-bold text-white/30">{generatedVideos.length} vídeos</span>
          </div>

          {generatedVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedVideos.map((video) => (
                <article key={video.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--surface))]">
                  <button
                    type="button"
                    onClick={() => { setResult(video.url); setLastPrompt(video.prompt); setError(null); }}
                    className="relative block aspect-video w-full overflow-hidden bg-black"
                    title="Abrir vídeo no preview"
                  >
                    <video src={video.url} muted preload="metadata" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/70 backdrop-blur">
                      {video.engine}
                    </span>
                  </button>
                  <div className="flex items-center gap-3 p-3">
                    <p className="min-w-0 flex-1 truncate text-xs text-white/60" title={video.prompt}>{video.prompt}</p>
                    <a
                      href={video.url}
                      download="unicfilm-video.mp4"
                      className="rounded-lg border border-white/10 p-2 text-white/40 transition-colors hover:border-orange/40 hover:text-orange"
                      aria-label="Baixar vídeo"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
              <p className="text-xs text-white/30">Os vídeos gerados aparecerão aqui.</p>
            </div>
          )}
        </section>
      </div>
      {fullscreenUrl && (
        <FullscreenViewer
          url={fullscreenUrl}
          type="video"
          fileName="unicfilm-video.mp4"
          onClose={() => setFullscreenUrl(null)}
        />
      )}
    </ToolPageLayout>
  );
}
