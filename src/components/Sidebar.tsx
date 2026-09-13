import type { Page } from "./AppShell"

const SERIF = "'Inria Serif', Georgia, serif"

type NavItem = {
  id: Page
  label: string
  icon: string
  group?: string
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "◼", group: "Principal" },
  { id: "hospedes", label: "Hóspedes", icon: "👤", group: "Recepção" },
  { id: "reservas", label: "Reservas", icon: "📅", group: "Recepção" },
  { id: "quartos", label: "Quartos", icon: "🛏", group: "Recepção" },
  {
    id: "checkinout",
    label: "Check-in / Check-out",
    icon: "🔑",
    group: "Recepção",
  },
  { id: "consumos", label: "Consumos", icon: "🍽", group: "Serviços" },
  { id: "estoque", label: "Estoque", icon: "📦", group: "Serviços" },
  { id: "pacotes", label: "Pacotes", icon: "🎁", group: "Serviços" },
  {
    id: "limpeza",
    label: "Limpeza & Manutenção",
    icon: "🧹",
    group: "Operações",
  },
  { id: "eventos", label: "Eventos", icon: "🎪", group: "Operações" },
  { id: "funcionarios", label: "Funcionários", icon: "👥", group: "Gestão" },
  { id: "financeiro", label: "Financeiro", icon: "💰", group: "Gestão" },
  { id: "fiscal", label: "Fiscal", icon: "🧾", group: "Gestão" },
  { id: "comunicacoes", label: "Comunicações", icon: "✉", group: "Gestão" },
  { id: "usuarios", label: "Usuários & Acesso", icon: "🔐", group: "Sistema" },
  { id: "relatorios", label: "Relatórios", icon: "📊", group: "Sistema" },
]

const groups = [
  "Principal",
  "Recepção",
  "Serviços",
  "Operações",
  "Gestão",
  "Sistema",
]

type Props = {
  currentPage: Page
  onNavigate: (page: Page) => void
  isOpen: boolean
}

export default function Sidebar({ currentPage, onNavigate, isOpen }: Props) {
  return (
    <aside
      style={{
        width: isOpen ? "242px" : "60px",
        minWidth: isOpen ? "242px" : "60px",
        maxWidth: isOpen ? "242px" : "60px",
        background: "linear-gradient(180deg, #2d3d1a 0%, #3e5525 100%)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        transition:
          "width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s, max-width 0.25s",
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
                fontFamily: SERIF,
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
          const items = navItems.filter((n) => n.group === group)
          if (!items.length) return null
          return (
            <div key={group}>
              {isOpen && (
                <p
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "14px 18px 4px",
                  }}
                >
                  {group}
                </p>
              )}
              {items.map((item) => {
                const active = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={!isOpen ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: isOpen ? "9px 18px 9px 14px" : "9px 0",
                      justifyContent: isOpen ? "flex-start" : "center",
                      background: active
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                      borderTopWidth: 0,
                      borderRightWidth: 0,
                      borderBottomWidth: 0,
                      borderLeftWidth: "3px",
                      borderStyle: "solid",
                      borderLeftColor: active ? "#a8c878" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active)
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255,255,255,0.06)"
                    }}
                    onMouseLeave={(e) => {
                      if (!active)
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1rem",
                        width: "22px",
                        textAlign: "center",
                        flexShrink: 0,
                        filter: active ? "none" : "grayscale(20%)",
                      }}
                    >
                      {item.icon}
                    </span>
                    {isOpen && (
                      <span
                        style={{
                          fontFamily: SERIF,
                          fontWeight: active ? 700 : 400,
                          fontSize: "0.84rem",
                          color: active ? "#ffffff" : "rgba(255,255,255,0.68)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
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
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            v1.0.0 — 2026
          </p>
        </div>
      )}
    </aside>
  )
}
