import { useAuth } from "@/contexts/AuthContext";
import { Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function MyPlan() {
    const { profile } = useAuth();

    const totalCredits = profile?.role === 'admin_master' ? 999999999 : 20000;
    const usedCredits = 2500; // Mock value for now
    const remainingCredits = totalCredits - usedCredits;
    const progress = (usedCredits / totalCredits) * 100;

    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <div className="flex items-center gap-4">
                <Link to="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white/40" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-widest uppercase italic">Meu Plano</h1>
                    <p className="text-white/40 text-sm italic">Status de assinante e controle de créditos.</p>
                </div>
            </div>

            <div className="mx-auto w-full max-w-4xl">
                {/* Credits Balance Card */}
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange/10 blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-orange/20 transition-all duration-700" />

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-2">Plano Atual</p>
                            <h2 className="text-4xl font-bold text-white uppercase italic flex items-center gap-3">
                                {profile?.role === 'admin_master' ? 'Admin Master' : 'Unicfilm Pro'}
                                <ShieldCheck className="w-8 h-8 text-orange" />
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Créditos usados este mês</span>
                            <span className="text-xl font-bold text-white italic">{usedCredits.toLocaleString()} / {profile?.role === 'admin_master' ? "∞" : "20.000"}</span>
                        </div>
                        <Progress value={profile?.role === 'admin_master' ? 0 : progress} className="h-3 bg-white/5" />
                        <p className="text-[10px] text-white/20 text-right uppercase tracking-widest font-bold">
                            {profile?.role === 'admin_master' ? "Uso ilimitado ativado" : `Restam ${remainingCredits.toLocaleString()} créditos`}
                        </p>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-white/20" />
                            <span className="text-xs text-white/40 font-medium">Renova em: <span className="text-white">25 de Março, 2026</span></span>
                        </div>
                        <Button className="h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                            Ver Detalhes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
