import { useState } from "react";
import { Youtube, Download, Info, Loader2 } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import { toast } from "sonner";

const qualities = [
  { label: "Vídeo 4K Ultra HD (MP4)", value: "4k" },
  { label: "Vídeo 1080p Full HD (MP4)", value: "1080p" },
  { label: "Vídeo 720p HD (MP4)", value: "720p" },
  { label: "Vídeo 480p (MP4)", value: "480p" },
  { label: "Vídeo 360p (MP4)", value: "360p" },
  { label: "Apenas Áudio (MP3)", value: "audio" },
];

export default function YoutubeDownloader() {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("1080p");
  const [loading, setLoading] = useState(false);

  const isValidUrl = url.startsWith("http");

  async function handleDownload() {
    if (!isValidUrl) {
      toast.error("Por favor, insira uma URL válida.");
      return;
    }
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      toast.info("Iniciando download...");

      const res = await fetch(`${supabaseUrl}/functions/v1/youtube-download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
        },
        body: JSON.stringify({ url, quality }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.error || "Erro ao baixar o arquivo.");
        return;
      }

      const blob = await res.blob();
      const isVideo = quality !== "audio";
      const ext = isVideo ? "mp4" : "mp3";
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `youtube-download.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Download concluído!");
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao baixar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPageLayout
      icon={Youtube}
      title="DOWNLOADER MULTI-PLATAFORMA"
      subtitle="Baixe vídeos e áudios do YouTube, Instagram, TikTok e mais"
    >
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
        <div>
          <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">
            URL do Vídeo
          </label>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-4">
              <Youtube className="w-4 h-4 text-orange flex-shrink-0" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-transparent py-3 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase">Formato</label>
          <div className="space-y-2">
            {qualities.map((q) => (
              <button
                key={q.value}
                onClick={() => setQuality(q.value)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all btn-glow text-left ${quality === q.value
                  ? "bg-[hsl(var(--orange)/0.12)] border border-[hsl(var(--orange)/0.4)] text-orange"
                  : "bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--orange)/0.3)] hover:text-[hsl(var(--text-primary))]"
                  }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${quality === q.value ? "border-orange bg-orange" : "border-[hsl(var(--text-dim))]"}`} />
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <button
            disabled={!isValidUrl || loading}
            onClick={handleDownload}
            className="w-full py-4 rounded-xl font-display text-xl tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                BAIXANDO...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                BAIXAR
              </>
            )}
          </button>

          <div className="bg-[hsl(var(--orange)/0.06)] border border-[hsl(var(--orange)/0.2)] rounded-xl px-5 py-4 space-y-3">
            <div className="flex items-center gap-2 text-orange">
              <Info className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wider uppercase">Como funciona</span>
            </div>
            <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed">
              Cole a URL do conteúdo (YouTube, Instagram, TikTok, etc.), selecione o formato e clique em <strong className="text-[hsl(var(--text-primary))]">Baixar</strong>.
            </p>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
