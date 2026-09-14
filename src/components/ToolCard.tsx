import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  path: string;
  delay?: number;
}

export default function ToolCard({
  icon: Icon,
  title,
  description,
  badge,
  path,
  delay = 0,
}: ToolCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(path)}
      className="card-hover cursor-pointer bg-card rounded-2xl p-6 flex flex-col gap-4 animate-fade-in-up group"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* Icon + Badge */}
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-colors group-hover:bg-primary/15 group-hover:border-primary/40">
          <Icon className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
        </div>
        {badge && (
          <span className="text-[10px] font-semibold tracking-widest bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full uppercase shadow-[0_0_8px_hsl(28_88%_58%/0.15)]">
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="font-display text-xl text-foreground tracking-wide leading-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1.5 text-primary text-xs font-semibold tracking-wider mt-auto pt-3 border-t border-border">
        <span>ABRIR FERRAMENTA</span>
        <span className="text-base leading-none transition-transform group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
}
