import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Users,
    Search,
    ShieldCheck,
    ArrowLeft,
    Trash2,
    Ban,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface LocalRow {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'blocked';
    createdAt: string;
}

export default function AdminPanel() {
    const { listUsers, setUserStatus, deleteUser } = useAuth();
    const [users, setUsers] = useState<LocalRow[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchUsers = () => {
        try {
            setUsers(listUsers() as unknown as LocalRow[]);
        } catch (e) {
            console.error(e);
            toast.error("Erro ao carregar usuários locais");
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateStatus = (email: string, newStatus: 'active' | 'blocked') => {
        setUserStatus(email, newStatus);
        toast.success(`Usuário ${newStatus === 'active' ? 'desbloqueado' : 'bloqueado'}!`);
        fetchUsers();
    };

    const handleDelete = (email: string) => {
        if (email.toLowerCase() === "canalderespeito@gmail.com") {
            toast.error("O admin master não pode ser removido.");
            return;
        }
        if (!confirm(`Remover ${email} deste Mac?`)) return;
        deleteUser(email);
        toast.success("Usuário removido.");
        fetchUsers();
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white/40" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-widest uppercase italic">Painel Admin</h1>
                        <p className="text-white/40 text-sm italic">Uso interno • {users.length}/5 contas neste Mac.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1 justify-end"><Users className="w-3 h-3" />Usuários locais</p>
                        <p className="text-xl font-bold text-white italic">{users.length}/5</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-orange/30 uppercase tracking-widest flex items-center gap-1 justify-end"><ShieldCheck className="w-3 h-3" />Admins</p>
                        <p className="text-xl font-bold text-orange italic">
                            {users.filter(u => u.role === 'admin_master').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-orange transition-colors" />
                <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border-white/10 pl-12 h-14 rounded-2xl text-white placeholder:text-white/20 focus:border-orange/50 transition-all shadow-xl"
                />
            </div>

            {/* USERS LIST */}
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Usuário</th>
                                <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Status</th>
                                <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Papel</th>
                                <th className="p-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/40 uppercase italic">
                                                {u.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white tracking-wide uppercase italic">{u.name || "Sem Nome"}</p>
                                                <p className="text-[10px] text-white/20 font-bold tracking-tighter truncate max-w-[220px]">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase italic",
                                            u.status === 'active' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                                                "bg-red-500/10 text-red-500 border border-red-500/20"
                                        )}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase">
                                            {u.role === 'admin_master' ? 'ADMIN MASTER' : 'USUÁRIO'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {u.status === 'active' && u.role !== 'admin_master' && (
                                                <Button
                                                    onClick={() => handleUpdateStatus(u.email, 'blocked')}
                                                    size="sm"
                                                    className="h-9 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[9px] font-bold uppercase tracking-widest"
                                                >
                                                    <Ban className="w-3 h-3 mr-1" /> Bloquear
                                                </Button>
                                            )}
                                            {u.status === 'blocked' && (
                                                <Button
                                                    onClick={() => handleUpdateStatus(u.email, 'active')}
                                                    size="sm"
                                                    className="h-9 px-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 text-[9px] font-bold uppercase tracking-widest"
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Desbloquear
                                                </Button>
                                            )}
                                            {u.role !== 'admin_master' && (
                                                <Button
                                                    onClick={() => handleDelete(u.email)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-white/20 transition-all border border-transparent hover:border-red-500/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-white/20 uppercase tracking-widest italic font-bold">
                            Nenhum usuário encontrado
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
