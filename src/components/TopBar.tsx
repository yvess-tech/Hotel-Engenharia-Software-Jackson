import type { User } from "../App";
import type { Page } from "./AppShell";

const SERIF = "'Inria Serif', Georgia, serif";

const pageTitles: Record<Page, string> = {
  dashboard:    "Dashboard",
  hospedes:     "Hóspedes",
  reservas:     "Reservas",
  quartos:      "Quartos",
  checkinout:   "Check-in / Check-out",
  consumos:     "Consumos",
  estoque:      "Estoque",
  pacotes:      "Pacotes",
  financeiro:   "Financeiro",
  funcionarios: "Funcionários",
  limpeza:      "Limpeza & Manutenção",
  eventos:      "Eventos",
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
  const today = "30/09/2026";

  return (
    <header
      style={{
        height: "64px",
        background: "var(--bg-card)",
        borderBottom: "1.5px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        boxShadow: "var(--shadow-card)",
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
            border: "1.5px solid var(--border)",
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
                background: "var(--brand-700)",
                borderRadius: "2px",
              }}
            />
          ))}
        </button>

        <div>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--brand-900)",
              lineHeight: 1.2,
            }}
          >
            {pageTitles[currentPage]}
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: "0.7rem",
              color: "var(--text-muted)",
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
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.82rem",
              color: "var(--brand-900)",
              lineHeight: 1.2,
            }}
          >
            {user.name}
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: "0.7rem",
              color: "var(--text-muted)",
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
            background: "linear-gradient(135deg, var(--brand-700), var(--brand-700))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "var(--bg-card)",
            flexShrink: 0,
            boxShadow: "var(--shadow-card)",
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            background: "var(--bg-page)",
            borderWidth: "1.5px",
            borderStyle: "solid",
            borderColor: "var(--border)",
            borderRadius: "8px",
            padding: "6px 14px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--danger-bg)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--danger-bg)";
            (e.currentTarget as HTMLElement).style.color = "var(--danger-fg)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-page)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
