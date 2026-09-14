import { AlertTriangle, Images } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EngineSwitchNoticeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousEngine: string;
  nextEngine: string;
}

export default function EngineSwitchNotice({
  open,
  onOpenChange,
  previousEngine,
  nextEngine,
}: EngineSwitchNoticeProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-orange/30 bg-[#111114] p-0 shadow-2xl shadow-orange/10 sm:max-w-md">
        <div className="h-1 bg-gradient-to-r from-orange/20 via-orange to-orange/20" />
        <div className="space-y-5 p-6 pt-4">
          <DialogHeader className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange/20 bg-orange/10 text-orange">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="font-display text-2xl tracking-wider text-white">CONFIRA ANTES DE GERAR</DialogTitle>
            <DialogDescription className="leading-relaxed text-white/50">
              Você trocou de IA. Modelos diferentes podem interpretar as mesmas referências de formas distintas.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-white/35">{previousEngine}</span>
              <span className="text-orange">→</span>
              <span className="min-w-0 truncate font-bold text-white">{nextEngine}</span>
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-orange/15 bg-orange/[0.06] p-4">
            <Images className="mt-0.5 h-5 w-5 shrink-0 text-orange" />
            <p className="text-xs leading-relaxed text-white/60">
              Revise as imagens de referência e confirme se a versão selecionada é a desejada: <strong className="text-white">{nextEngine}</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)} className="w-full bg-orange text-white hover:bg-orange/90">
              ENTENDI, CONFERIR AJUSTES
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
