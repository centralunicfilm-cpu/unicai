import { forwardRef, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ToolPageLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
}

const ToolPageLayout = forwardRef<HTMLDivElement, ToolPageLayoutProps>(function ToolPageLayout(
  {
    icon: Icon,
    title,
    subtitle,
    badge,
    children,
  },
  ref,
) {
  const navigate = useNavigate();

  return (
    <div ref={ref} className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] px-8 py-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-secondary))] hover:text-orange transition-colors mb-4 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao Dashboard
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[hsl(var(--orange)/0.12)] flex items-center justify-center border border-[hsl(var(--orange)/0.25)]">
            <Icon className="w-7 h-7 text-orange" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-4xl text-[hsl(var(--text-primary))] tracking-wide">{title}</h1>
              {badge && (
                <span className="text-[10px] font-bold tracking-widest bg-[hsl(var(--orange)/0.15)] text-orange border border-[hsl(var(--orange)/0.3)] px-2 py-0.5 rounded-full uppercase">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[hsl(var(--text-secondary))] text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-5xl mx-auto w-full">{children}</div>
    </div>
  );
});

export default ToolPageLayout;
