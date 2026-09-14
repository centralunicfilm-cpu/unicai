import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ToolPageLayout from "@/components/ToolPageLayout";
import { Settings, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

export default function AccountSettings() {
  const { user, profile, updateProfileName } = useAuth();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const error = await updateProfileName(fullName);
    if (error) toast.error(error);
    else toast.success("Perfil atualizado com sucesso!");
    setSaving(false);
  };

  return (
    <ToolPageLayout icon={Settings} title="CONFIGURAÇÕES" subtitle="Gerencie sua conta local neste Mac" badge="CONTA">
      <div className="mx-auto w-full max-w-xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-6 space-y-5">
            <h3 className="text-xs font-semibold tracking-widest text-[hsl(var(--text-secondary))] uppercase">Dados do Perfil Local</h3>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--text-dim))]" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" className="w-full pl-10 pr-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">E-mail</label>
              <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-dim))] cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Papel</label>
              <input type="text" value={profile?.role === "admin_master" ? "ADMIN MASTER" : "USUÁRIO"} disabled className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-dim))] cursor-not-allowed" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl font-display text-lg tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-2 disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            SALVAR
          </button>
        </form>
      </div>
    </ToolPageLayout>
  );
}
