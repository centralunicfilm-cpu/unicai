import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Lock, Camera, Save, ArrowLeft, Loader2, Eye, EyeOff, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const REQUEST_TIMEOUT_MS = 12000;
const UPLOAD_TIMEOUT_MS = 30000;

function withTimeout<T>(operation: () => PromiseLike<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);

        Promise.resolve(operation()).then(
            (result) => {
                window.clearTimeout(timer);
                resolve(result);
            },
            (error) => {
                window.clearTimeout(timer);
                reject(error);
            },
        );
    });
}

export default function UserProfile() {
    const { profile, user, refreshProfile } = useAuth();
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name);
        } else if (user?.email) {
            setFullName(user.email.split("@")[0]);
        }
    }, [profile?.full_name, user?.email]);

    useEffect(() => {
        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    const upsertProfileFields = async (fields: { full_name?: string | null; avatar_url?: string | null }) => {
        if (!user) throw new Error("Usuário não autenticado");

        const updatePayload = {
            ...fields,
            updated_at: new Date().toISOString(),
        };

        const { data: updatedRows, error: updateError } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("user_id", user.id)
            .select("id");

        if (updateError) throw updateError;

        if (!updatedRows || updatedRows.length === 0) {
            const { error: insertError } = await supabase.from("profiles").insert({
                user_id: user.id,
                full_name: fields.full_name ?? profile?.full_name ?? user.email?.split("@")[0] ?? null,
                avatar_url: fields.avatar_url ?? profile?.avatar_url ?? null,
                credits: profile?.credits ?? 20000,
            });

            if (insertError) throw insertError;
        }

        await refreshProfile();
    };

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const normalizedName = fullName.trim();
        if (!normalizedName) {
            toast.error("Informe seu nome antes de salvar.");
            return;
        }

        setLoading(true);
        try {
            await withTimeout(
                async () => await upsertProfileFields({ full_name: normalizedName }),
                REQUEST_TIMEOUT_MS,
                "Tempo excedido ao salvar o perfil.",
            );
            toast.success("Nome atualizado com sucesso!");
        } catch (err: any) {
            console.error("Profile update error:", err);
            toast.error(err?.message || "Erro ao atualizar perfil");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Apenas imagens são permitidas");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Máximo 5MB.");
            return;
        }

        const localPreview = URL.createObjectURL(file);
        setAvatarPreview(localPreview);
        setUploading(true);

        try {
            const fileExt = file.name.split(".").pop() || "png";
            const safeExt = fileExt.toLowerCase();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
            const filePath = `${user.id}/avatars/${fileName}`;

            const { error: uploadError } = await withTimeout(
                async () => await supabase.storage.from("media").upload(filePath, file, { upsert: false }),
                UPLOAD_TIMEOUT_MS,
                "Tempo excedido no upload da foto.",
            );

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from("media").getPublicUrl(filePath);

            await withTimeout(
                async () => await upsertProfileFields({ avatar_url: data.publicUrl }),
                REQUEST_TIMEOUT_MS,
                "Tempo excedido ao salvar a foto de perfil.",
            );

            setAvatarPreview(null);
            URL.revokeObjectURL(localPreview);
            toast.success("Foto de perfil atualizada!");
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            toast.error(error?.message || "Erro ao carregar foto");
            setAvatarPreview(null);
            URL.revokeObjectURL(localPreview);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!user?.email) return;

        if (!currentPassword) {
            toast.error("Digite sua senha atual.");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("A nova senha deve ter pelo menos 8 caracteres.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        setPasswordLoading(true);

        try {
            await withTimeout(
                async () => {
                    const { error: reauthError } = await supabase.auth.signInWithPassword({
                        email: user.email || "",
                        password: currentPassword,
                    });

                    if (reauthError) {
                        throw new Error("Senha atual incorreta.");
                    }

                    const { error: updateError } = await supabase.auth.updateUser({
                        password: newPassword,
                    });

                    if (updateError) throw updateError;
                },
                REQUEST_TIMEOUT_MS,
                "Tempo excedido ao atualizar a senha.",
            );

            toast.success("Senha alterada com sucesso!");
            setPasswordModalOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            console.error("Password update error:", err);
            toast.error(err?.message || "Erro ao alterar senha");
        } finally {
            setPasswordLoading(false);
        }
    };

    const avatarUrl = avatarPreview || profile?.avatar_url || "";

    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <div className="flex items-center gap-4">
                <Link to="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white/40" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-widest uppercase italic">Meu Perfil</h1>
                    <p className="text-white/40 text-sm italic">Gerencie suas informações pessoais.</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto space-y-6">
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 space-y-8">
                    <div className="relative w-32 h-32 mx-auto">
                        <div className="w-full h-full rounded-full bg-orange/10 border-4 border-orange/20 flex items-center justify-center text-4xl font-bold text-orange uppercase overflow-hidden">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-orange" />
                            ) : avatarUrl ? (
                                <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar do usuário" loading="lazy" />
                            ) : (
                                profile?.full_name?.[0] || user?.email?.[0] || "U"
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 p-2 bg-orange rounded-full text-white shadow-lg shadow-orange/20 hover:scale-110 transition-transform disabled:opacity-50"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                        />
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="bg-[#0B0B0D] border-white/10 pl-12 h-12 rounded-2xl text-white focus:border-orange/50 transition-all"
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">E-mail (Privado)</label>
                            <div className="relative opacity-50">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <Input value={user?.email || ""} disabled className="bg-[#0B0B0D] border-white/10 pl-12 h-12 rounded-2xl text-white" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full h-12 rounded-2xl bg-orange hover:bg-orange/80 text-white font-bold tracking-widest uppercase shadow-lg shadow-orange/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {loading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </form>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                        <Button
                            variant="ghost"
                            onClick={() => setPasswordModalOpen(true)}
                            className="w-full h-12 rounded-2xl border border-white/5 hover:bg-white/5 text-white/40 hover:text-white transition-all gap-2 justify-start px-6"
                        >
                            <Lock className="w-4 h-4" />
                            Alterar Senha
                        </Button>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center border border-orange/20">
                            <Coins className="w-6 h-6 text-orange" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Saldo de Créditos</p>
                            <p className="text-3xl font-bold text-white tracking-wider">{(profile?.credits ?? 20000).toLocaleString("pt-BR")}</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Renovação mensal gerenciada pelo administrador.</p>
                </div>
            </div>

            <Dialog
                open={passwordModalOpen}
                onOpenChange={(open) => {
                    setPasswordModalOpen(open);
                    if (!open) {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                    }
                }}
            >
                <DialogContent className="bg-[#0B0B0D] border border-white/10 text-white rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-widest uppercase text-white">Alterar Senha</DialogTitle>
                        <DialogDescription className="text-white/40 text-sm">Confirme sua senha atual e defina uma nova senha.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Senha Atual</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <Input
                                    type={showCurrentPass ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="bg-[#0B0B0D] border-white/10 pl-12 pr-12 h-12 rounded-2xl text-white focus:border-orange/50"
                                    placeholder="Digite sua senha atual"
                                    required
                                />
                                <button type="button" onClick={() => setShowCurrentPass((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <Input
                                    type={showNewPass ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="bg-[#0B0B0D] border-white/10 pl-12 pr-12 h-12 rounded-2xl text-white focus:border-orange/50"
                                    placeholder="Mínimo 8 caracteres"
                                    minLength={8}
                                    required
                                />
                                <button type="button" onClick={() => setShowNewPass((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Confirmar Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <Input
                                    type={showConfirmPass ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-[#0B0B0D] border-white/10 pl-12 pr-12 h-12 rounded-2xl text-white focus:border-orange/50"
                                    placeholder="Repita a nova senha"
                                    minLength={8}
                                    required
                                />
                                <button type="button" onClick={() => setShowConfirmPass((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {newPassword && confirmPassword && newPassword !== confirmPassword && <p className="text-destructive text-xs">As senhas não coincidem</p>}

                        <Button
                            type="submit"
                            disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                            className="w-full h-12 rounded-2xl bg-orange hover:bg-orange/80 text-white font-bold tracking-widest uppercase shadow-lg shadow-orange/20"
                        >
                            {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                            {passwordLoading ? "Atualizando..." : "Atualizar Senha"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

