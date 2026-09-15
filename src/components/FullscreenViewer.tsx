import { useCallback, useEffect } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { downloadOriginalMedia } from "@/lib/sharedMedia";

export interface ViewerItem {
  url: string;
  type: "image" | "video";
  fileName?: string;
}

interface FullscreenViewerProps {
  url: string;
  type: "image" | "video";
  fileName?: string;
  onClose: () => void;
  items?: ViewerItem[];
  index?: number;
  onIndexChange?: (index: number) => void;
}

export default function FullscreenViewer({ url, type, fileName, onClose, items, index, onIndexChange }: FullscreenViewerProps) {
  const list: ViewerItem[] = items && items.length > 0 ? items : [{ url, type, fileName }];
  const current = items && typeof index === "number" ? Math.min(Math.max(index, 0), list.length - 1) : 0;
  const item = list[current];
  const canNavigate = list.length > 1 && !!onIndexChange;

  const goPrev = useCallback(() => {
    if (!canNavigate || !onIndexChange) return;
    onIndexChange((current - 1 + list.length) % list.length);
  }, [canNavigate, onIndexChange, current, list.length]);

  const goNext = useCallback(() => {
    if (!canNavigate || !onIndexChange) return;
    onIndexChange((current + 1) % list.length);
  }, [canNavigate, onIndexChange, current, list.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {canNavigate && (
          <span className="px-3 py-2 rounded-xl bg-white/10 text-xs font-bold text-white/70 tracking-widest">
            {current + 1} / {list.length}
          </span>
        )}
        {item.fileName && (
          <button
            type="button"
            onClick={() => downloadOriginalMedia(item.url, item.fileName!)}
            className="p-3 rounded-xl bg-white/10 hover:bg-orange text-white transition-colors"
            aria-label="Baixar"
            title="Baixar"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Fechar (Esc)"
          title="Fechar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {canNavigate && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-orange text-white transition-colors z-10"
            aria-label="Anterior"
            title="Anterior (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-orange text-white transition-colors z-10"
            aria-label="Próxima"
            title="Próxima (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div
        className="max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            key={item.url}
            src={item.url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
          />
        ) : (
          <img
            key={item.url}
            src={item.url}
            alt="Visualização em tela cheia"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
