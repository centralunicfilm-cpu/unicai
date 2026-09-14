import { useState, useRef } from "react";
import { Mic, Loader2, Download, Play, Pause, Wand2 } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const voices = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George — Narrador Profissional" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah — Feminina Natural" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam — Jovem Energético" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily — Suave e Elegante" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian — Grave e Imponente" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura — Apresentadora" },
];

export default function Narration() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(voices[0].id);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setAudioUrl(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao gerar narração");
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (user) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          tool_type: "Narração",
          tool_name: "ElevenLabs TTS",
          input_summary: text.slice(0, 120),
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <ToolPageLayout icon={Mic} title="NARRAÇÃO COM IA" subtitle="Crie narrações profissionais com vozes realistas via ElevenLabs" badge="ElevenLabs">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Texto para Narrar</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole aqui o texto que deseja narrar..."
              rows={7}
              className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-4 py-3 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] resize-none input-glow focus:outline-none transition-all"
            />
            <p className="text-xs text-[hsl(var(--text-dim))] mt-1">{text.length} caracteres</p>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Seleção de Voz</label>
            <div className="space-y-2">
              {voices.map((v) => (
                <button key={v.id} onClick={() => setVoiceId(v.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all btn-glow text-left ${voiceId === v.id ? "bg-orange/10 border border-orange text-orange" : "bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:border-orange/50"}`}>
                  <Mic className="w-4 h-4 flex-shrink-0" />
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className="w-full py-4 rounded-xl font-display text-xl tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />GERANDO ÁUDIO...</> : <><Wand2 className="w-5 h-5" />GERAR NARRAÇÃO</>}
          </button>
        </div>

        <div className="animate-fade-in-up space-y-4" style={{ animationDelay: "100ms" }}>
          <label className="text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] uppercase block">Player de Áudio</label>

          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-6 min-h-64 flex flex-col items-center justify-center gap-4">
            {loading && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-orange/30 border-t-orange animate-spin" />
                <p className="text-sm text-[hsl(var(--text-secondary))]">Sintetizando voz...</p>
              </div>
            )}

            {audioUrl && !loading && (
              <>
                <div className="w-full bg-[hsl(var(--background))] rounded-xl px-4 py-3 flex items-center gap-4">
                  <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-orange flex items-center justify-center btn-glow flex-shrink-0">
                    {playing ? <Pause className="w-4 h-4 text-[hsl(var(--primary-foreground))]" /> : <Play className="w-4 h-4 text-[hsl(var(--primary-foreground))] ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 bg-[hsl(var(--border))] rounded-full overflow-hidden">
                      <div className="h-full bg-orange rounded-full w-0 transition-all" style={{ width: playing ? "100%" : "0%", transition: playing ? "width 30s linear" : "none" }} />
                    </div>
                  </div>
                </div>
                <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
                <a href={audioUrl} download="narracao-unicfilm.mp3" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--text-secondary))] hover:border-orange hover:text-orange transition-all btn-glow">
                  <Download className="w-4 h-4" /> Baixar MP3
                </a>
              </>
            )}

            {!audioUrl && !loading && (
              <div className="text-center text-[hsl(var(--text-dim))]">
                <Mic className="w-14 h-14 opacity-15 mx-auto mb-3" />
                <p className="text-sm">O áudio gerado aparecerá aqui</p>
              </div>
            )}
          </div>

          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-4 py-3">
            <p className="text-xs text-[hsl(var(--text-dim))]">⚡ Powered by <span className="text-orange font-semibold">ElevenLabs</span> — Vozes realistas de última geração</p>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
