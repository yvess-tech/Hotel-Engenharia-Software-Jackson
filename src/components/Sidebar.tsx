import bedDoubleIcon from "../assets/icons/bed-double.svg?raw";
import calendarCheckIcon from "../assets/icons/calendar-check.svg?raw";
import chartColumnIcon from "../assets/icons/chart-column.svg?raw";
import conciergeBellIcon from "../assets/icons/concierge-bell.svg?raw";
import giftIcon from "../assets/icons/gift.svg?raw";
import idCardIcon from "../assets/icons/id-card.svg?raw";
import keyRoundIcon from "../assets/icons/key-round.svg?raw";
import layoutDashboardIcon from "../assets/icons/layout-dashboard.svg?raw";
import mailIcon from "../assets/icons/mail.svg?raw";
import packageIcon from "../assets/icons/package.svg?raw";
import presentationIcon from "../assets/icons/presentation.svg?raw";
import receiptTextIcon from "../assets/icons/receipt-text.svg?raw";
import shieldCheckIcon from "../assets/icons/shield-check.svg?raw";
import usersIcon from "../assets/icons/users.svg?raw";
import walletIcon from "../assets/icons/wallet.svg?raw";
import wrenchIcon from "../assets/icons/wrench.svg?raw";
import type { Page } from "./AppShell";

const SERIF = "'Inria Serif', Georgia, serif";

type NavItem = {
  id: Page;
  label: string;
  icon: string;
  group?: string;
};

const navItems: NavItem[] = [
  { id: "dashboard",    label: "Dashboard",             icon: layoutDashboardIcon, group: "Principal" },
  { id: "hospedes",     label: "Hóspedes",              icon: usersIcon, group: "Recepção" },
  { id: "reservas",     label: "Reservas",              icon: calendarCheckIcon, group: "Recepção" },
  { id: "quartos",      label: "Quartos",               icon: bedDoubleIcon, group: "Recepção" },
  { id: "checkinout",   label: "Check-in / Check-out",  icon: keyRoundIcon, group: "Recepção" },
  { id: "consumos",     label: "Consumos",              icon: conciergeBellIcon, group: "Serviços" },
  { id: "estoque",      label: "Estoque",               icon: packageIcon, group: "Serviços" },
  { id: "pacotes",      label: "Pacotes",               icon: giftIcon, group: "Serviços" },
  { id: "limpeza",      label: "Limpeza & Manutenção",  icon: wrenchIcon, group: "Operações" },
  { id: "eventos",      label: "Eventos",               icon: presentationIcon, group: "Operações" },
  { id: "funcionarios", label: "Funcionários",          icon: idCardIcon, group: "Gestão" },
  { id: "financeiro",   label: "Financeiro",            icon: walletIcon, group: "Gestão" },
  { id: "fiscal",       label: "Fiscal",                icon: receiptTextIcon, group: "Gestão" },
  { id: "comunicacoes", label: "Comunicações",          icon: mailIcon, group: "Gestão" },
  { id: "usuarios",     label: "Usuários & Acesso",     icon: shieldCheckIcon, group: "Sistema" },
  { id: "relatorios",   label: "Relatórios",            icon: chartColumnIcon, group: "Sistema" },
];

const groups = ["Principal", "Recepção", "Serviços", "Operações", "Gestão", "Sistema"];

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
};

export default function Sidebar({ currentPage, onNavigate, isOpen }: Props) {
  return (
    <aside
      style={{
        width: isOpen ? "242px" : "60px",
        minWidth: isOpen ? "242px" : "60px",
        maxWidth: isOpen ? "242px" : "60px",
        background: "linear-gradient(180deg, #2d3d1a 0%, #32451e 100%)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s, max-width 0.25s",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "2px 0 12px rgba(0,0,0,0.12)",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: isOpen ? "22px 18px 18px" : "22px 12px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            minWidth: "36px",
            background: "#f0f2ee",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "#3e5525",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          H
        </div>
        {isOpen && (
          <div>
            <p
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: "0.92rem",
                color: "#ffffff",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              Hotel Pacaas Novos
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.5)",
                whiteSpace: "nowrap",
              }}
            >
              Sistema de Gestão
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav
        className="sidebar-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "10px 0",
        }}
      >
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              {isOpen && (
                <p className="sidebar-section-label">
                  {group}
                </p>
              )}
              {items.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item${active ? " active" : ""}${isOpen ? "" : " nav-item--collapsed"}`}
                    onClick={() => onNavigate(item.id)}
                    title={!isOpen ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className="nav-item-icon"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: item.icon }}
                    />
                    {isOpen && (
                      <span className="nav-item-label">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <p className="sidebar-version">
            v1.0.0 — 2026
          </p>
        </div>
      )}
    </aside>
  );
}
