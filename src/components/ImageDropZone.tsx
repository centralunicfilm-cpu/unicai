import { forwardRef, useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropZoneProps {
  label?: string;
  optional?: boolean;
  value: string | null;
  onChange: (url: string | null, file?: File) => void;
  className?: string;
  accept?: string;
  height?: string;
  compact?: boolean;
  plusPlaceholder?: boolean;
}

const ImageDropZone = forwardRef<HTMLDivElement, ImageDropZoneProps>(function ImageDropZone({
  label = "Imagem de Referência",
  optional = true,
  value,
  onChange,
  className,
  accept = "image/*",
  height = "h-48",
  compact = false,
  plusPlaceholder = false,
}, ref) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string, file);
      setLoading(false);
    };
    reader.onerror = () => setLoading(false);
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {label && (
        <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-3 uppercase flex justify-between">
          <span>{label}</span>
          {optional && <span className="text-orange text-[10px] lowercase italic">opcional</span>}
        </label>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer bg-[hsl(var(--surface))] overflow-hidden",
          height,
          dragging ? "border-orange bg-orange/10" : "border-[hsl(var(--border))] hover:border-orange/50 hover:bg-orange/5"
        )}
      >
        {loading ? (
          <Loader2 className="w-8 h-8 text-orange animate-spin" />
        ) : value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-contain" />
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white/80 hover:text-white hover:bg-black/80 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : plusPlaceholder ? (
          <div className="flex flex-col items-center gap-2 text-orange/60 transition-colors group-hover:text-orange">
            <Plus className="h-7 w-7 transition-transform group-hover:scale-110" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Adicionar</span>
          </div>
        ) : (
          <div className={cn("flex flex-col items-center text-center text-[hsl(var(--text-dim))] group-hover:text-orange/70", compact ? "gap-2 px-3" : "gap-2")}>
            <Upload className={cn("opacity-40 group-hover:scale-110 transition-transform", compact ? "w-6 h-6" : "w-8 h-8")} />
            <span className={cn("font-bold uppercase", compact ? "text-[9px] tracking-[0.12em] leading-tight" : "text-xs tracking-widest")}>
              {compact ? "Adicionar imagem" : "Carregar ou Arrastar Imagem"}
            </span>
            {!compact && <p className="text-[10px] lowercase opacity-50">Clique ou arraste um arquivo aqui</p>}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
});

export default ImageDropZone;
