import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type AccessStatus = "Ativo" | "Inativo";

export interface AccessProfile {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  status: AccessStatus;
}

export interface Account {
  id: number;
  name: string;
  email: string;
  login: string;
  password: string;
  profileIds: number[];
  status: AccessStatus;
  lastAccess?: string;
  passwordUpdatedAt: string;
}

export interface OperationLog {
  id: number;
  userId?: number;
  userName: string;
  operation: string;
  module: string;
  details: string;
  result: "Sucesso" | "Falha";
  dateTime: string;
  ip: string;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthenticationResult {
  user?: SessionUser;
  error?: string;
}

interface AccessControlValue {
  accounts: Account[];
  profiles: AccessProfile[];
  logs: OperationLog[];
  activeAccount: Account | null;
  setAccounts: Dispatch<SetStateAction<Account[]>>;
  setProfiles: Dispatch<SetStateAction<AccessProfile[]>>;
  authenticate: (identifier: string, password: string) => AuthenticationResult;
  endSession: () => void;
  recoverPassword: (email: string) => string;
  registerLog: (
    operation: string,
    module: string,
    details: string,
    result?: OperationLog["result"],
    account?: Pick<Account, "id" | "name">,
  ) => void;
}

const allPermissions = [
  "dashboard",
  "hospedes",
  "reservas",
  "quartos",
  "checkinout",
  "consumos",
  "estoque",
  "pacotes",
  "financeiro",
  "funcionarios",
  "limpeza",
  "eventos",
  "comunicacoes",
  "fiscal",
  "usuarios",
  "relatorios",
];

const initialProfiles: AccessProfile[] = [
  {
    id: 1,
    name: "Administrador",
    description: "Acesso integral à administração e às operações do hotel.",
    permissions: allPermissions,
    status: "Ativo",
  },
  {
    id: 2,
    name: "Gerente",
    description: "Gestão operacional, financeira e acompanhamento de resultados.",
    permissions: allPermissions.filter((permission) => permission !== "usuarios"),
    status: "Ativo",
  },
  {
    id: 3,
    name: "Recepcionista",
    description: "Atendimento ao hóspede e rotinas da recepção.",
    permissions: [
      "dashboard",
      "hospedes",
      "reservas",
      "quartos",
      "checkinout",
      "consumos",
      "pacotes",
      "comunicacoes",
    ],
    status: "Ativo",
  },
  {
    id: 4,
    name: "Camareira",
    description: "Acesso às tarefas de limpeza e situação dos quartos.",
    permissions: ["dashboard", "quartos", "limpeza", "estoque"],
    status: "Ativo",
  },
  {
    id: 5,
    name: "Financeiro",
    description: "Acesso às rotinas financeiras, fiscais e relatórios.",
    permissions: ["dashboard", "financeiro", "fiscal", "relatorios"],
    status: "Ativo",
  },
];

const initialAccounts: Account[] = [
  {
    id: 1,
    name: "João Carlos",
    email: "admin@hotel.com",
    login: "admin",
    password: "Hotel@2026",
    profileIds: [1],
    status: "Ativo",
    lastAccess: "2026-09-13T09:00",
    passwordUpdatedAt: "2026-08-01T10:00",
  },
  {
    id: 2,
    name: "Carlos Mendes",
    email: "carlos@hotel.com",
    login: "carlos.mendes",
    password: "Recepcao@2026",
    profileIds: [3],
    status: "Ativo",
    lastAccess: "2026-09-13T08:05",
    passwordUpdatedAt: "2026-08-10T14:00",
  },
  {
    id: 3,
    name: "Lúcia Santos",
    email: "lucia@hotel.com",
    login: "lucia.santos",
    password: "Limpeza@2026",
    profileIds: [4],
    status: "Ativo",
    lastAccess: "2026-09-13T07:58",
    passwordUpdatedAt: "2026-07-20T09:00",
  },
  {
    id: 4,
    name: "Fernanda Lima",
    email: "fernanda@hotel.com",
    login: "fernanda.lima",
    password: "Financeiro@2026",
    profileIds: [5],
    status: "Inativo",
    lastAccess: "2026-09-10T17:00",
    passwordUpdatedAt: "2026-06-11T11:30",
  },
];

const initialLogs: OperationLog[] = [
  {
    id: 1,
    userId: 1,
    userName: "João Carlos",
    operation: "Autenticação",
    module: "Sistema",
    details: "Sessão iniciada.",
    result: "Sucesso",
    dateTime: "2026-09-13T09:00",
    ip: "192.168.1.18",
  },
  {
    id: 2,
    userId: 2,
    userName: "Carlos Mendes",
    operation: "Check-in registrado",
    module: "Check-in / Out",
    details: "Reserva RSV-2048, quarto 204.",
    result: "Sucesso",
    dateTime: "2026-09-13T08:10",
    ip: "192.168.1.24",
  },
  {
    id: 3,
    userName: "fernanda@hotel.com",
    operation: "Autenticação",
    module: "Sistema",
    details: "Tentativa de acesso de usuário inativo.",
    result: "Falha",
    dateTime: "2026-09-10T17:05",
    ip: "192.168.1.31",
  },
];

const AccessControlContext = createContext<AccessControlValue | null>(null);

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [logs, setLogs] = useState(initialLogs);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  const registerLog: AccessControlValue["registerLog"] = (
    operation,
    module,
    details,
    result = "Sucesso",
    account,
  ) => {
    setLogs((current) => [
      {
        id: Date.now() + Math.random(),
        userId: account?.id ?? activeAccount?.id,
        userName: account?.name ?? activeAccount?.name ?? "Sistema",
        operation,
        module,
        details,
        result,
        dateTime: new Date().toISOString(),
        ip: "192.168.1.18",
      },
      ...current,
    ]);
  };

  const authenticate = (identifier: string, password: string): AuthenticationResult => {
    const normalized = identifier.trim().toLowerCase();
    const account = accounts.find(
      (item) =>
        item.email.toLowerCase() === normalized || item.login.toLowerCase() === normalized,
    );
    if (!account || account.password !== password) {
      registerLog(
        "Autenticação",
        "Sistema",
        "Login ou senha inválidos.",
        "Falha",
        account ?? { id: 0, name: identifier },
      );
      return { error: "Login ou senha inválidos." };
    }
    if (account.status !== "Ativo") {
      registerLog(
        "Autenticação",
        "Sistema",
        "Tentativa de acesso de usuário inativo.",
        "Falha",
        account,
      );
      return { error: "Este usuário está inativo. Procure o administrador." };
    }
    const activeProfiles = profiles.filter(
      (profile) => account.profileIds.includes(profile.id) && profile.status === "Ativo",
    );
    if (!activeProfiles.length) {
      registerLog(
        "Autenticação",
        "Sistema",
        "Usuário sem perfil de acesso ativo.",
        "Falha",
        account,
      );
      return { error: "Usuário sem perfil de acesso ativo." };
    }
    const permissions = [...new Set(activeProfiles.flatMap((profile) => profile.permissions))];
    setAccounts((current) =>
      current.map((item) =>
        item.id === account.id ? { ...item, lastAccess: new Date().toISOString() } : item,
      ),
    );
    setActiveAccount(account);
    registerLog("Autenticação", "Sistema", "Sessão iniciada.", "Sucesso", account);
    return {
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: activeProfiles.map((profile) => profile.name).join(", "),
        permissions,
      },
    };
  };

  const recoverPassword = (email: string) => {
    const account = accounts.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
    );
    registerLog(
      "Recuperação de senha",
      "Sistema",
      account
        ? "Instruções de recuperação solicitadas."
        : "Solicitação para e-mail não cadastrado.",
      account ? "Sucesso" : "Falha",
      account ?? { id: 0, name: email },
    );
    return "Se o e-mail estiver cadastrado, as instruções de recuperação serão enviadas.";
  };

  const endSession = () => {
    if (activeAccount) {
      registerLog(
        "Encerramento de sessão",
        "Sistema",
        "Sessão encerrada pelo usuário.",
        "Sucesso",
        activeAccount,
      );
    }
    setActiveAccount(null);
  };

  return (
    <AccessControlContext.Provider
      value={{
        accounts,
        profiles,
        logs,
        activeAccount,
        setAccounts,
        setProfiles,
        authenticate,
        endSession,
        recoverPassword,
        registerLog,
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (!context) throw new Error("useAccessControl must be used inside AccessControlProvider");
  return context;
}
