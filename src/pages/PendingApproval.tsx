import { useNavigate } from "react-router-dom";
import { Clock, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function PendingApproval() {
    const { signOut, user } = useAuth();

    return (
        <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange/10 blur-[120px] rounded-full" />

            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl relative z-10 text-center space-y-8">
                <div className="w-20 h-20 bg-orange/10 border border-orange/20 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
                    <Clock className="w-10 h-10 text-orange" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-bold text-white tracking-widest uppercase italic">Acesso Pendente</h1>
                    <p className="text-white/40 text-sm leading-relaxed">
                        Seu cadastro foi recebido com sucesso! Como somos uma plataforma exclusiva,
                        um administrador precisa aprovar seu acesso manualmente.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-white/40" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Enviado para</p>
                        <p className="text-xs text-white/60 font-medium">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <p className="text-[10px] text-white/20 uppercase font-bold tracking-[0.2em]">Você receberá um e-mail quando for aprovado.</p>
                    <Button
                        onClick={() => signOut()}
                        variant="ghost"
                        className="w-full h-12 rounded-2xl border border-white/5 hover:bg-white/5 text-white/60 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da Conta
                    </Button>
                </div>
            </div>
        </div>
    );
}
