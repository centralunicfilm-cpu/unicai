import { useState, useRef } from "react";
import { FileText, Upload, Loader2, Copy, Info } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";

const languages = ["Português (BR)", "Inglês", "Espanhol", "Francês", "Auto-detectar"];

export default function Transcription() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("Português (BR)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setAudioFile(file);
    setResult("");
  };

  return (
    <ToolPageLayout
      icon={FileText}
      title="TRANSCRIÇÃO DE ÁUDIO"
      subtitle="Converta áudio e vídeo em texto com reconhecimento de fala por IA"
      badge="IA"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl animate-fade-in-up">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">
              Arquivo de Áudio / Vídeo
            </label>
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-[hsl(var(--border))] hover:border-orange rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all hover:bg-[hsl(var(--orange)/0.04)] group"
            >
              <div className="w-14 h-14 rounded-xl bg-[hsl(var(--orange)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--orange)/0.15)] transition-colors">
                <Upload className="w-7 h-7 text-orange" />
              </div>
              <div className="text-center">
                <p className="text-sm text-[hsl(var(--text-primary))] font-medium">
                  {audioFile ? audioFile.name : "Arraste ou clique para selecionar"}
                </p>
                <p className="text-xs text-[hsl(var(--text-dim))] mt-1">MP3, MP4, WAV, M4A, WEBM • máx. 500MB</p>
              </div>
              <input ref={inputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Idioma</label>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <button key={l} onClick={() => setLanguage(l)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-glow ${language === l ? "bg-orange text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-[hsl(var(--border))] hover:border-orange hover:text-orange"}`}>{l}</button>
              ))}
            </div>
          </div>

          <button
            disabled={!audioFile || loading}
            className="w-full py-4 rounded-xl font-display text-xl tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />TRANSCREVENDO...</> : <><FileText className="w-5 h-5" />TRANSCREVER</>}
          </button>

          <div className="bg-[hsl(var(--orange)/0.06)] border border-[hsl(var(--orange)/0.2)] rounded-xl px-5 py-4 space-y-2">
            <div className="flex items-center gap-2 text-orange">
              <Info className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wider uppercase">API Recomendada</span>
            </div>
            <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed">
              Integre com <strong className="text-[hsl(var(--text-primary))]">OpenAI Whisper</strong> ou <strong className="text-[hsl(var(--text-primary))]">AssemblyAI</strong> para transcrição de alta precisão com identificação de falantes.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] uppercase">Transcrição</label>
            {result && (
              <button onClick={() => navigator.clipboard.writeText(result)} className="flex items-center gap-1.5 text-xs text-orange btn-glow px-3 py-1 rounded-lg border border-[hsl(var(--orange)/0.3)]">
                <Copy className="w-3 h-3" />Copiar
              </button>
            )}
          </div>
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 min-h-80 max-h-[500px] overflow-y-auto">
            {result ? (
              <p className="text-sm text-[hsl(var(--text-primary))] leading-relaxed whitespace-pre-wrap">{result}</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-[hsl(var(--text-dim))]">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm">A transcrição aparecerá aqui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
