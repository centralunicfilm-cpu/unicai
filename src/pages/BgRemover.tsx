import { useState, useRef } from "react";
import { Scissors, Upload, Download, ImageIcon, Info } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";

export default function BgRemover() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <ToolPageLayout
      icon={Scissors}
      title="REMOVER FUNDO"
      subtitle="Remova fundos de imagens automaticamente com precisão profissional"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl animate-fade-in-up">
        {/* Upload */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">
              Imagem de Entrada
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-[hsl(var(--border))] hover:border-orange rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all hover:bg-[hsl(var(--orange)/0.04)] group"
            >
              <div className="w-14 h-14 rounded-xl bg-[hsl(var(--orange)/0.1)] flex items-center justify-center group-hover:bg-[hsl(var(--orange)/0.15)] transition-colors">
                <Upload className="w-7 h-7 text-orange" />
              </div>
              <div className="text-center">
                <p className="text-sm text-[hsl(var(--text-primary))] font-medium">Arraste sua imagem aqui</p>
                <p className="text-xs text-[hsl(var(--text-dim))] mt-1">ou clique para selecionar • PNG, JPG, WEBP</p>
              </div>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </div>

          {preview && (
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Original</label>
              <div className="bg-[hsl(var(--surface))] rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-[hsl(var(--border))]">
                <img src={preview} alt="Original" className="max-w-full max-h-full object-contain" />
              </div>
              <p className="text-xs text-[hsl(var(--text-dim))] mt-2">{fileName}</p>
            </div>
          )}

          <button
            disabled={!preview}
            className="w-full py-4 rounded-xl font-display text-xl tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Scissors className="w-5 h-5" />
            REMOVER FUNDO
          </button>
        </div>

        {/* Result */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Resultado</label>
          <div
            className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl aspect-video flex items-center justify-center"
            style={{
              backgroundImage: preview
                ? "repeating-conic-gradient(hsl(0 0% 10%) 0% 25%, hsl(0 0% 14%) 0% 50%)"
                : "none",
              backgroundSize: "20px 20px",
            }}
          >
            <div className="flex flex-col items-center gap-3 text-[hsl(var(--text-dim))]">
              <ImageIcon className="w-12 h-12 opacity-20" />
              <p className="text-sm">Imagem sem fundo aparecerá aqui</p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-[hsl(var(--orange)/0.06)] border border-[hsl(var(--orange)/0.2)] rounded-xl px-5 py-4 space-y-2">
            <div className="flex items-center gap-2 text-orange">
              <Info className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wider uppercase">APIs Recomendadas</span>
            </div>
            <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed">
              Integre com <strong className="text-[hsl(var(--text-primary))]">Remove.bg API</strong>, <strong className="text-[hsl(var(--text-primary))]">Clipdrop</strong> ou <strong className="text-[hsl(var(--text-primary))]">Photoroom</strong> para ativar a remoção de fundo profissional.
            </p>
          </div>

          <button disabled className="w-full py-3 rounded-xl border border-[hsl(var(--orange)/0.3)] text-[hsl(var(--text-dim))] text-sm font-semibold tracking-wider flex items-center justify-center gap-2 opacity-40 cursor-not-allowed">
            <Download className="w-4 h-4" />BAIXAR SEM FUNDO
          </button>
        </div>
      </div>
    </ToolPageLayout>
  );
}
