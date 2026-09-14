import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ---- Tipos locais (sem Supabase) ----
export interface LocalUser {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin_master' | null;
  status: 'active' | 'blocked' | null;
  credits: number | null;
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin_master';
  status: 'active' | 'blocked';
  createdAt: string;
}

interface AuthContextType {
  user: LocalUser | null;
  session: { user: LocalUser } | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  localSignIn: (email: string, password: string) => Promise<string | null>;
  localSignUp: (name: string, email: string, password: string) => Promise<string | null>;
  localResetPassword: (email: string, newPassword: string) => Promise<string | null>;
  updateProfileName: (name: string) => Promise<string | null>;
  hasLocalAccount: boolean;
  // admin
  listUsers: () => StoredAccount[];
  setUserStatus: (email: string, status: 'active' | 'blocked') => void;
  deleteUser: (email: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
  localSignIn: async () => "Modo local indisponível",
  localSignUp: async () => "Modo local indisponível",
  localResetPassword: async () => "Modo local indisponível",
  updateProfileName: async () => "Modo local indisponível",
  hasLocalAccount: false,
  listUsers: () => [],
  setUserStatus: () => { },
  deleteUser: () => { },
});

const LOCAL_ACCOUNT_KEY = "unicfilm.local.accounts";
const LOCAL_SESSION_KEY = "unicfilm.local.session";
const ADMIN_EMAIL = "canalderespeito@gmail.com";
const MAX_USERS = 5;

const hashSecret = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const readAccounts = (): StoredAccount[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as StoredAccount[];
    // compat com formato antigo (objeto único)
    if (parsed && typeof parsed === "object" && "email" in parsed) {
      const old = parsed as { name: string; email: string; passwordHash: string };
      return [{
        id: `local-${Date.now()}`,
        name: old.name ?? "Editor",
        email: old.email,
        passwordHash: old.passwordHash,
        role: old.email.toLowerCase() === ADMIN_EMAIL ? "admin_master" : "user",
        status: "active",
        createdAt: new Date().toISOString(),
      }];
    }
    return [];
  } catch { return []; }
};

const writeAccounts = (accounts: StoredAccount[]) => {
  localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(accounts));
};

const toProfile = (account: StoredAccount): Profile => ({
  id: `profile-${account.id}`,
  user_id: account.id,
  full_name: account.name,
  avatar_url: null,
  role: account.role,
  status: account.status,
  credits: null,
});

const toUser = (account: StoredAccount): LocalUser => ({
  id: account.id,
  email: account.email,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountsTick, setAccountsTick] = useState(0);

  const ensureAdminSeed = async () => {
    const accounts = readAccounts();
    const admin = accounts.find((a) => a.email.toLowerCase() === ADMIN_EMAIL);
    if (!admin) {
      // senha inicial do admin: 910710 (pode ser trocada no app)
      const passwordHash = await hashSecret("910710");
      const seed: StoredAccount = {
        id: "admin-master-1",
        name: "Admin",
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin_master",
        status: "active",
        createdAt: new Date().toISOString(),
      };
      // garante limite: se já tem 5 contas, ainda assim garante o admin (remove nada, só adiciona se houver espaço;
      // se cheio, promove a conta com esse email caso exista — como não existe, força espaço)
      const next = [...accounts, seed].slice(0, Math.max(accounts.length + 1, MAX_USERS + 1));
      writeAccounts(next);
      setAccountsTick((t) => t + 1);
    } else if (admin.role !== "admin_master" || admin.status !== "active") {
      writeAccounts(accounts.map((a) =>
        a.email.toLowerCase() === ADMIN_EMAIL
          ? { ...a, role: "admin_master" as const, status: "active" as const }
          : a
      ));
      setAccountsTick((t) => t + 1);
    }
  };

  const loadSession = () => {
    const sessionEmail = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!sessionEmail) {
      setUser(null);
      setProfile(null);
      return;
    }
    const account = readAccounts().find((item) => item.email.toLowerCase() === sessionEmail.toLowerCase());
    if (!account || account.status === "blocked") {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
      setProfile(null);
      return;
    }
    setUser(toUser(account));
    setProfile(toProfile(account));
  };

  useEffect(() => {
    (async () => {
      await ensureAdminSeed();
      loadSession();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
    setProfile(null);
  };

  const localSignUp = async (name: string, email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split("@")[0];
    if (!cleanEmail || !cleanEmail.includes("@")) return "Informe um e-mail válido.";
    if (password.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
    const accounts = readAccounts();
    if (accounts.some((item) => item.email.toLowerCase() === cleanEmail)) return "Este e-mail já possui uma conta neste Mac.";
    if (accounts.length >= MAX_USERS) return "Limite de 5 contas neste Mac atingido.";
    const newAccount: StoredAccount = {
      id: `local-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: await hashSecret(password),
      role: cleanEmail === ADMIN_EMAIL ? "admin_master" : "user",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    writeAccounts([...accounts, newAccount]);
    localStorage.setItem(LOCAL_SESSION_KEY, newAccount.email);
    setUser(toUser(newAccount));
    setProfile(toProfile(newAccount));
    setAccountsTick((t) => t + 1);
    return null;
  };

  const localSignIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const account = readAccounts().find((item) => item.email.toLowerCase() === cleanEmail);
    if (!account) return "Conta não encontrada neste Mac. Crie sua senha no primeiro acesso.";
    if (account.status === "blocked") return "Conta bloqueada. Fale com o administrador.";
    if (account.passwordHash !== await hashSecret(password)) return "Senha incorreta.";
    localStorage.setItem(LOCAL_SESSION_KEY, account.email);
    setUser(toUser(account));
    setProfile(toProfile(account));
    return null;
  };

  const localResetPassword = async (email: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (newPassword.length < 6) return "A nova senha precisa ter pelo menos 6 caracteres.";
    const accounts = readAccounts();
    const idx = accounts.findIndex((item) => item.email.toLowerCase() === cleanEmail);
    if (idx === -1) return "Conta não encontrada neste Mac.";
    accounts[idx] = { ...accounts[idx], passwordHash: await hashSecret(newPassword) };
    writeAccounts(accounts);
    setAccountsTick((t) => t + 1);
    return null;
  };

  const updateProfileName = async (name: string) => {
    if (!user) return "Sem sessão ativa.";
    const clean = name.trim();
    if (!clean) return "Informe um nome.";
    const accounts = readAccounts().map((a) =>
      a.id === user.id ? { ...a, name: clean } : a
    );
    writeAccounts(accounts);
    const updated = accounts.find((a) => a.id === user.id);
    if (updated) setProfile(toProfile(updated));
    setAccountsTick((t) => t + 1);
    return null;
  };

  const refreshProfile = async () => {
    loadSession();
  };

  const listUsers = () => readAccounts();

  const setUserStatus = (email: string, status: 'active' | 'blocked') => {
    const clean = email.trim().toLowerCase();
    if (clean === ADMIN_EMAIL && status === "blocked") return; // nunca bloqueia o admin master
    writeAccounts(readAccounts().map((a) =>
      a.email.toLowerCase() === clean ? { ...a, status } : a
    ));
    // se bloqueou quem está logado, derruba a sessão
    const current = localStorage.getItem(LOCAL_SESSION_KEY);
    if (current && current.toLowerCase() === clean && status === "blocked") {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
      setProfile(null);
    } else {
      loadSession();
    }
    setAccountsTick((t) => t + 1);
  };

  const deleteUser = (email: string) => {
    const clean = email.trim().toLowerCase();
    if (clean === ADMIN_EMAIL) return; // nunca deleta o admin master
    writeAccounts(readAccounts().filter((a) => a.email.toLowerCase() !== clean));
    const current = localStorage.getItem(LOCAL_SESSION_KEY);
    if (current && current.toLowerCase() === clean) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
      setProfile(null);
    }
    setAccountsTick((t) => t + 1);
  };

  void accountsTick;

  const session = user ? { user } : null;

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, signOut, refreshProfile,
      localSignIn, localSignUp, localResetPassword, updateProfileName,
      hasLocalAccount: readAccounts().length > 0,
      listUsers, setUserStatus, deleteUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
