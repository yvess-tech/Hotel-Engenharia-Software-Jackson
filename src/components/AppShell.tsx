import { useEffect, useState } from "react";
import type { User } from "../App";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Dashboard from "./pages/Dashboard";
import Hospedes from "./pages/Hospedes";
import Reservas from "./pages/Reservas";
import Quartos from "./pages/Quartos";
import CheckInOut from "./pages/CheckInOut";
import Hospedagens from "./pages/Hospedagens";
import Consumos from "./pages/Consumos";
import Estoque from "./pages/Estoque";
import Pacotes from "./pages/Pacotes";
import Financeiro from "./pages/Financeiro";
import Funcionarios from "./pages/Funcionarios";
import LimpezaManutencao from "./pages/LimpezaManutencao";
import Eventos from "./pages/Eventos";
import Comunicacoes from "./pages/Comunicacoes";
import Fiscal from "./pages/Fiscal";
import Usuarios from "./pages/Usuarios";
import Relatorios from "./pages/Relatorios";
import { HotelOperationsProvider } from "./HotelOperationsContext";
import PresentationTour from "./tour/PresentationTour";
import { DemoEngineProvider } from "./demo/DemoEngineContext";
import OperationalDemoPanel from "./demo/OperationalDemoPanel";

export type Page =
  | "dashboard" | "hospedes" | "reservas" | "quartos" | "checkinout" | "hospedagens"
  | "consumos" | "estoque" | "pacotes" | "financeiro" | "funcionarios"
  | "limpeza" | "eventos" | "comunicacoes" | "fiscal" | "usuarios" | "relatorios";

const pageComponents: Record<Page, React.ComponentType> = {
  dashboard: Dashboard,
  hospedes: Hospedes,
  reservas: Reservas,
  quartos: Quartos,
  checkinout: CheckInOut,
  hospedagens: Hospedagens,
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
};

type Props = { user: User; onLogout: () => void };

export default function AppShell({ user, onLogout }: Props) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [presentationOpen, setPresentationOpen] = useState(false);

  useEffect(() => {
    const openStay = (event: Event) => {
      const stayId = (event as CustomEvent<number>).detail;
      if (!Number.isFinite(stayId)) return;
      window.sessionStorage.setItem("hotel-open-stay", String(stayId));
      setCurrentPage("hospedagens");
    };
    window.addEventListener("hotel:open-stay", openStay);
    const openCheckout = (event: Event) => {
      const reservationId = (event as CustomEvent<number>).detail;
      if (!Number.isFinite(reservationId)) return;
      window.sessionStorage.setItem("hotel-open-checkout", String(reservationId));
      setCurrentPage("checkinout");
    };
    window.addEventListener("hotel:open-checkout", openCheckout);
    const openConsumptions = (event: Event) => {
      const stayId = (event as CustomEvent<number>).detail;
      if (Number.isFinite(stayId)) window.sessionStorage.setItem("hotel-consumption-stay", String(stayId));
      setCurrentPage("consumos");
    };
    window.addEventListener("hotel:open-consumptions", openConsumptions);
    const openRoomMap = (event: Event) => {
      const stayId = (event as CustomEvent<number>).detail;
      if (Number.isFinite(stayId)) window.sessionStorage.setItem("hotel-transfer-stay", String(stayId));
      setCurrentPage("quartos");
    };
    window.addEventListener("hotel:open-room-map", openRoomMap);
    return () => {
      window.removeEventListener("hotel:open-stay", openStay);
      window.removeEventListener("hotel:open-checkout", openCheckout);
      window.removeEventListener("hotel:open-consumptions", openConsumptions);
      window.removeEventListener("hotel:open-room-map", openRoomMap);
    };
  }, []);

  const PageComponent = pageComponents[currentPage];

  return (
    <div
      className={currentPage === "financeiro" || currentPage === "eventos" ? "management-shell" : undefined}
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-page)",
      }}
    >
      <HotelOperationsProvider>
      <DemoEngineProvider>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        allowedPages={user.permissions}
      />
        <div
          className="app-content"
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
            onPresent={() => setPresentationOpen(true)}
          />
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
            }}
          >
            <div data-tour-page={currentPage}>
              <PageComponent />
            </div>
          </main>
        </div>
        <PresentationTour
          currentPage={currentPage}
          allowedPages={user.permissions}
          launcherOpen={presentationOpen}
          onCloseLauncher={() => setPresentationOpen(false)}
          onNavigate={setCurrentPage}
        />
        <OperationalDemoPanel currentPage={currentPage} allowedPages={user.permissions} onNavigate={setCurrentPage} />
      </DemoEngineProvider>
      </HotelOperationsProvider>
    </div>
  );
}
