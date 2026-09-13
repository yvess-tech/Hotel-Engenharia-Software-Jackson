import { useState } from "react"
import type { User } from "../App"
import Sidebar from "./Sidebar"
import TopBar from "./TopBar"
import Dashboard from "./pages/Dashboard"
import Hospedes from "./pages/Hospedes"
import Reservas from "./pages/Reservas"
import Quartos from "./pages/Quartos"
import CheckInOut from "./pages/CheckInOut"
import Consumos from "./pages/Consumos"
import Estoque from "./pages/Estoque"
import Pacotes from "./pages/Pacotes"
import Financeiro from "./pages/Financeiro"
import Funcionarios from "./pages/Funcionarios"
import LimpezaManutencao from "./pages/LimpezaManutencao"
import Eventos from "./pages/Eventos"
import Comunicacoes from "./pages/Comunicacoes"
import Fiscal from "./pages/Fiscal"
import Usuarios from "./pages/Usuarios"
import Relatorios from "./pages/Relatorios"

export type Page = "dashboard" | "hospedes" | "reservas" | "quartos" | "checkinout" | "consumos" | "estoque" | "pacotes" | "financeiro" | "funcionarios" | "limpeza" | "eventos" | "comunicacoes" | "fiscal" | "usuarios" | "relatorios"

const pageComponents: Record<Page, React.ComponentType> = {
  dashboard: Dashboard,
  hospedes: Hospedes,
  reservas: Reservas,
  quartos: Quartos,
  checkinout: CheckInOut,
  consumos: Consumos,
  estoque: Estoque,
  pacotes: Pacotes,
  financeiro: Financeiro,
  funcionarios: Funcionarios,
  limpeza: LimpezaManutencao,
  eventos: Eventos,
  comunicacoes: Comunicacoes,
  fiscal: Fiscal,
  usuarios: Usuarios,
  relatorios: Relatorios,
}

interface Props {
  user: User
  onLogout: () => void
}

export default function AppShell({ user, onLogout }: Props) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const PageComponent = pageComponents[currentPage]

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#f0f2ee",
      }}
    >
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <TopBar
          user={user}
          onLogout={onLogout}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          currentPage={currentPage}
        />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          <PageComponent />
        </main>
      </div>
    </div>
  )
}
