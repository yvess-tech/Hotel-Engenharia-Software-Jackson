import type { User } from "../App";
import type { Page } from "./AppShell";

const SERIF = "'Inria Serif', Georgia, serif";

const pageTitles: Record<Page, string> = {
  dashboard:    "Dashboard",
  hospedes:     "Hóspedes",
  reservas:     "Reservas",
  quartos:      "Quartos",
  checkinout:   "Check-in / Check-out",
  consumos:     "Consumos do Hóspede",
  estoque:      "Controle de Estoque",
  pacotes:      "Pacotes & Promoções",
  financeiro:   "Financeiro",
  funcionarios: "Funcionários",
  limpeza:      "Limpeza & Manutenção",
  eventos:      "Eventos & Conferências",
  comunicacoes: "Comunicações",
  fiscal:       "Fiscal",
  usuarios:     "Usuários & Acesso",
  relatorios:   "Relatórios",
};

type Props = {
  user: User;
  onLogout: () => void;
  onMenuToggle: () => void;
  currentPage: Page;
};

export default function TopBar({ user, onLogout, onMenuToggle, currentPage }: Props) {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      style={{
        height: "64px",
        background: "#ffffff",
        borderBottom: "1.5px solid #e8f0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        boxShadow: "0 1px 4px rgba(62,85,37,0.06)",
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Hamburger */}
        <button
          onClick={onMenuToggle}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "9px",
            border: "1.5px solid #e2ecd8",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            padding: "0",
            flexShrink: 0,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: "16px",
                height: "1.5px",
                background: "#3e5525",
                borderRadius: "2px",
              }}
            />
          ))}
        </button>

        <div>
          <p
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "1rem",
              color: "#2d3d1a",
              lineHeight: 1.2,
            }}
          >
            {pageTitles[currentPage]}
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "0.7rem",
              color: "#9aaa8a",
              textTransform: "capitalize",
            }}
          >
            {today}
          </p>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* User info */}
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
          <p
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "0.82rem",
              color: "#2d3d1a",
              lineHeight: 1.2,
            }}
          >
            {user.name}
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "0.7rem",
              color: "#7a8a6a",
            }}
          >
            {user.role}
          </p>
        </div>

        {/* Avatar */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3e5525, #6b8f3e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "#ffffff",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(62,85,37,0.3)",
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "0.78rem",
            color: "#6b7280",
            background: "#f0f2ee",
            borderWidth: "1.5px",
            borderStyle: "solid",
            borderColor: "#d1d5db",
            borderRadius: "8px",
            padding: "6px 14px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#fee2e2";
            (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5";
            (e.currentTarget as HTMLElement).style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#f0f2ee";
            (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db";
            (e.currentTarget as HTMLElement).style.color = "#6b7280";
          }}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
