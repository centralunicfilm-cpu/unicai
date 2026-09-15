import { useEffect, useRef, useState } from "react";
import { Image, Download, Loader2, Wand2, Images, MessagesSquare, Maximize2 } from "lucide-react";
import FullscreenViewer from "@/components/FullscreenViewer";
import { publishToGallery } from "@/lib/localGallery";
import { sendChatMessage } from "@/lib/localChat";
import { forwardChatToHost, forwardGalleryToHost } from "@/lib/lanSync";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import ToolPageLayout from "@/components/ToolPageLayout";
import ImageDropZone from "@/components/ImageDropZone";
import EngineSwitchNotice from "@/components/EngineSwitchNotice";
import { downloadOriginalMedia } from "@/lib/sharedMedia";
import { generateImageDirect, fileToDataUrl, loadLocalHistory, saveLocalHistoryItem } from "@/lib/runware";
import { fetchAndCache, loadBlobUrl } from "@/lib/mediaCache";
import { IMAGE_PREFILL_KEY } from "@/pages/Prompts";

const styles = ["Cinematográfico", "Retrato", "Fantasia", "Minimalista", "Dramático", "Abstrato", "Realista", "Anime"];
const ratios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const engines = [
  "GPT Image 2",
  "GPT Image 2.5",
  "Nano Banana PRO",
  "Nano Banana 2",
  "Nano Banana",
  "Muse 2.5",
  "FLUX.1 Dev",
  "Midjourney V8.2",
];

const integratedEngines = new Set(["GPT Image 2", "GPT Image 2.5", "FLUX.1 Dev", "Nano Banana", "Nano Banana 2", "Nano Banana PRO", "Muse 2.5"]);

interface ReferenceImage {
  url: string;
  file?: File;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  engine: string;
  createdAt: string;
}

export default function ImageGen() {
  const { user, profile } = useAuth();
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [engine, setEngine] = useState("Nano Banana");
  const [style, setStyle] = useState("Cinematográfico");
  const [ratio, setRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sharingToChat, setSharingToChat] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const engineNoticeCount = useRef(0);
  const [engineNotice, setEngineNotice] = useState({ open: false, previous: "", next: "" });

  const selectEngine = (nextEngine: string) => {
    if (nextEngine !== engine && engineNoticeCount.current < 2) {
      engineNoticeCount.current += 1;
      setEngineNotice({ open: true, previous: engine, next: nextEngine });
    }
    setEngine(nextEngine);
    setError(null);
  };

  // Prompt vindo da biblioteca (Prompts Cinemáticos)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(IMAGE_PREFILL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { prompt?: string };
        if (parsed.prompt) {
          setPrompt(parsed.prompt);
          toast.success("Prompt da biblioteca carregado!");
        }
        localStorage.removeItem(IMAGE_PREFILL_KEY);
      }
    } catch {
      /* ignora */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      setGeneratedImages([]);
      return;
    }
    // Histórico local neste Mac (sem Supabase).
    // Prefere o arquivo cacheado no IndexedDB (a URL da Runware expira).
    let cancelled = false;
    (async () => {
      const items = loadLocalHistory(user.id, "image");
      const resolved = await Promise.all(
        items.map(async (item) => {
          const cached = await loadBlobUrl(`img-${item.id}`);
          return {
            id: item.id,
            url: cached ?? item.url,
            prompt: item.prompt,
            engine: item.engine,
            createdAt: item.createdAt,
          };
        })
      );
      if (!cancelled) setGeneratedImages(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const uploadReferenceImage = async (file: File) => {
    // Modo local: converte para data URL e envia direto à Runware
    return fileToDataUrl(file);
  };

  const handleReferenceChange = (index: number, url: string | null, file?: File) => {
    setReferenceImages((current) => {
      if (!url) return current.filter((_, itemIndex) => itemIndex !== index);

      const next = [...current];
      next[index] = { url, file };
      return next.slice(0, 5);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (!integratedEngines.has(engine)) {
      const message = `A API da engine ${engine} ainda precisa ser conectada.`;
      setError(message);
      toast.info(message);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const referenceImageUrls = await Promise.all(
        referenceImages.map(async ({ url, file }) => {
          if (url.startsWith("data:")) return url;
          if (url.startsWith("http")) return url;
          if (url.startsWith("blob:")) {
            if (file) return uploadReferenceImage(file);
            return null;
          }
          if (file) return uploadReferenceImage(file);
          return url || null;
        }),
      );
      const validReferenceImages = referenceImageUrls.filter((url): url is string => Boolean(url));

      // Chamada direta à Runware (mesma key da Edge Function, via VITE_RUNWARE_API_KEY)
      const { imageUrl } = await generateImageDirect({
        prompt,
        style,
        ratio,
        engine,
        referenceImages: validReferenceImages,
      });

      // Baixa e guarda o arquivo neste Mac (a URL da Runware é temporária).
      // Preview e galeria passam a usar o arquivo local.
      const imageId = crypto.randomUUID();
      const localUrl = await fetchAndCache(imageUrl, `img-${imageId}`);
      const displayUrl = localUrl ?? imageUrl;

      setResult(displayUrl);
      setLastPrompt(prompt);
      const generatedImage: GeneratedImage = {
        id: imageId,
        url: displayUrl,
        prompt,
        engine,
        createdAt: new Date().toISOString(),
      };
      setGeneratedImages((current) => [generatedImage, ...current].slice(0, 20));

      if (user) {
        saveLocalHistoryItem(user.id, {
          id: generatedImage.id,
          url: imageUrl,
          prompt: prompt.slice(0, 500),
          engine,
          type: "image",
          createdAt: generatedImage.createdAt,
        });
      }

      toast.success("Imagem gerada com sucesso!");
    } catch (e: any) {
      const msg = e.message || "Erro desconhecido";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!result || !user) return;
    setPublishing(true);
    try {
      // Galeria pública local (neste Mac) — visível para as contas do Mac na página Galeria.
      const item = await publishToGallery({
        userId: user.id,
        fullName: profile?.full_name || "Membro",
        content: lastPrompt || prompt,
        sourceUrl: result,
        mediaType: "image",
      });
      forwardGalleryToHost(item);
      toast.success("Publicado na galeria!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao publicar");
    } finally {
      setPublishing(false);
    }
  };

  const handleSendToChat = async () => {
    if (!result || !user) return;
    setSharingToChat(true);
    try {
      const inserted = await sendChatMessage({
        userId: user.id,
        fullName: profile?.full_name || "Membro",
        content: lastPrompt || prompt,
        sourceUrl: result,
        mediaType: "image",
      });
      forwardChatToHost(inserted);
      toast.success("Imagem e prompt enviados ao chat da equipe!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar para o chat");
    } finally {
      setSharingToChat(false);
    }
  };

  return (
    <ToolPageLayout icon={Image} title="GERAR IMAGEM" subtitle="Crie imagens profissionais com Inteligência Artificial" badge="IA">
      <EngineSwitchNotice
        open={engineNotice.open}
        onOpenChange={(open) => setEngineNotice((notice) => ({ ...notice, open }))}
        previousEngine={engineNotice.previous}
        nextEngine={engineNotice.next}
      />
      <div className="max-w-6xl mx-auto space-y-8">

        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-secondary))]">
              Imagens de Referência
            </label>
            <span className="text-[10px] font-bold text-orange/70">{referenceImages.length}/5</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Array.from({ length: Math.min(referenceImages.length + 1, 5) }, (_, index) => {
              const reference = referenceImages[index];
              return (
                <ImageDropZone
                  key={`${index}-${reference?.url ?? "empty"}`}
                  label=""
                  optional={false}
                  value={reference?.url ?? null}
                  onChange={(url, file) => handleReferenceChange(index, url, file)}
                  className="w-full"
                  height="h-auto aspect-square"
                  compact
                  plusPlaceholder={index > 0 || referenceImages.length > 0}
                />
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-white/30">Adicione até cinco imagens para orientar estilo, composição e personagens.</p>
        </div>

        <div className="space-y-8">
          <div className="w-full space-y-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">
                O que você quer criar?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Uma câmera cinematográfica em estúdio profissional com luz dramática laranja, super realista..."
                rows={4}
                className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl px-6 py-4 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] resize-none input-glow focus:outline-none transition-all text-lg leading-relaxed"
              />
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Engine</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {engines.map((e) => (
                    <button
                      key={e}
                      onClick={() => selectEngine(e)}
                      title={integratedEngines.has(e) ? `${e} disponível` : `${e}: integração de API pendente`}
                      className={`relative min-h-14 px-3 py-2.5 rounded-xl text-[10px] font-bold tracking-wider transition-all uppercase ${engine === e ? "bg-orange text-white shadow-lg shadow-orange/20" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-orange/30"}`}>
                      <span>{e}</span>
                      {!integratedEngines.has(e) && (
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white/20" aria-label="Integração pendente" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-white/30">
                  O ponto discreto indica uma engine que ainda precisa da respectiva API.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Proporção</label>
                <div className="grid grid-cols-5 gap-2">
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
                {styles.map((s) => (
                  <button key={s} onClick={() => setStyle(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${style === s ? "bg-white/10 text-white border border-white/20" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-white/5 hover:border-white/20 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="w-full py-5 rounded-2xl font-display text-xl tracking-[0.2em] text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />GERANDO...</> : <><Wand2 className="w-5 h-5" />GERAR IMAGEM</>}
            </button>
          </div>

          <div className="w-full animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Preview</label>
            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl aspect-video min-h-[260px] max-h-[620px] flex items-center justify-center overflow-hidden relative">
              {loading && (
                <div className="flex flex-col items-center gap-3 z-10 bg-[#0B0B0D]/60 backdrop-blur-sm inset-0 absolute items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-orange/30 border-t-orange animate-spin" />
                  <p className="text-[10px] font-bold tracking-widest text-orange uppercase animate-pulse">Processando...</p>
                </div>
              )}
              {result && !loading && <img src={result} alt="Resultado" className="w-full h-full object-contain rounded-xl" />}
              {result && !loading && (
                <button
                  type="button"
                  onClick={() => setFullscreenUrl(result)}
                  className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/60 backdrop-blur text-white/70 hover:text-white hover:bg-orange transition-colors"
                  aria-label="Ver em tela cheia"
                  title="Tela cheia"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              {error && !loading && (
                <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase p-4 text-center">{error}</p>
              )}
              {!result && !loading && !error && (
                <div className="flex flex-col items-center gap-4 text-[hsl(var(--text-dim))]">
                  <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center">
                    <Image className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Aguardando IA</p>
                </div>
              )}
              {result && !loading && (
                <div className="absolute inset-x-0 bottom-0 grid grid-cols-1 gap-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => downloadOriginalMedia(result, "unicfilm-image.png")}
                    className="py-3 rounded-xl bg-orange text-white text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
                  >
                    <Download className="w-4 h-4" /> DOWNLOAD
                  </button>
                  <button onClick={handleSendToChat} disabled={sharingToChat}
                    className="py-3 rounded-xl bg-white/10 backdrop-blur text-white text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 border border-white/10 hover:bg-white/20 transition-all disabled:opacity-40">
                    {sharingToChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessagesSquare className="w-4 h-4" />}
                    ENVIAR NO CHAT
                  </button>
                  <button onClick={handlePublish} disabled={publishing}
                    className="py-3 rounded-xl bg-white/10 backdrop-blur text-white text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 border border-white/10 hover:bg-white/20 transition-all disabled:opacity-40">
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Images className="w-4 h-4" />}
                    GALERIA PÚBLICA
                  </button>
                </div>
              )}
            </div>
          </div>

          <section className="w-full animate-fade-in-up" style={{ animationDelay: "250ms" }}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-secondary))]">
                Galeria de Imagens Geradas
              </h2>
              <span className="text-[10px] font-bold text-white/30">{generatedImages.length} imagens</span>
            </div>

            {generatedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {generatedImages.map((image) => (
                  <article key={image.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--surface))]">
                    <button
                      type="button"
                      onClick={() => { setResult(image.url); setLastPrompt(image.prompt); setError(null); }}
                      className="relative block aspect-square w-full overflow-hidden bg-black/20"
                      title="Abrir imagem no preview"
                    >
                      <img src={image.url} alt={image.prompt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70" />
                      <span className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/70 backdrop-blur">
                        {image.engine}
                      </span>
                    </button>
                    <div className="flex items-center gap-3 p-3">
                      <p className="min-w-0 flex-1 truncate text-xs text-white/60" title={image.prompt}>{image.prompt}</p>
                      <button
                        type="button"
                        onClick={() => setFullscreenUrl(image.url)}
                        className="rounded-lg border border-white/10 p-2 text-white/40 transition-colors hover:border-orange/40 hover:text-orange"
                        aria-label="Ver em tela cheia"
                        title="Tela cheia"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                      <a
                        href={image.url}
                        download="unicfilm-image.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/10 p-2 text-white/40 transition-colors hover:border-orange/40 hover:text-orange"
                        aria-label="Baixar imagem"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                <p className="text-xs text-white/30">As imagens geradas aparecerão aqui.</p>
              </div>
            )}
          </section>
        </div>
      </div>
      {fullscreenUrl && (
        <FullscreenViewer
          url={fullscreenUrl}
          type="image"
          fileName="unicfilm-image.png"
          onClose={() => setFullscreenUrl(null)}
        />
      )}
    </ToolPageLayout>
  );
}
