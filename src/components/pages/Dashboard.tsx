import { useState } from "react";
import { Alert, Badge, Btn, Card, ConfirmDialog, PageHeader, SectionTitle, StatCard, Table } from "../ui";
import { countNights, formatMoney, reservationBaseValue, today, useHotelOperations } from "../HotelOperationsContext";

export default function Dashboard() {
  const { rooms, reservations, stays, receipts, consumptions, housekeepingTasks, payables, cashSessions, resetDemonstrationData, getReservationFinancials, cashExpectedTotal } = useHotelOperations();
  const [confirmReset, setConfirmReset] = useState(false);
  const availableRooms = rooms.filter((room) => room.maintenanceStatus === "Disponível");
  const occupiedRooms = rooms.filter((room) => room.occupancyStatus === "Ocupado");
  const occupancyRate = availableRooms.length ? occupiedRooms.length / availableRooms.length * 100 : 0;
  const activeOrCompleted = reservations.filter((reservation) => ["Hospedado", "Concluída"].includes(reservation.status));
  const lodgingRevenue = activeOrCompleted.reduce((total, reservation) => total + reservationBaseValue(reservation), 0);
  const serviceRevenue = consumptions.filter((item) => !item.includedInPackage).reduce((total, item) => total + item.value, 0);
  const receivedRevenue = receipts.filter((receipt) => receipt.status === "Confirmado").reduce((total, receipt) => total + receipt.value, 0);
  const pendingReceivables = reservations.reduce((total, reservation) => total + (getReservationFinancials(reservation.id)?.balance ?? 0), 0);
  const pendingPayables = payables.reduce((total, payable) => total + (payable.canceledAt ? 0 : Math.max(0, payable.originalValue - payable.payments.reduce((sum, payment) => sum + payment.value, 0))), 0);
  const openCash = cashSessions.find((session) => !session.closedAt);
  const physicalCash = openCash ? cashExpectedTotal(openCash.id) : 0;
  const revPar = availableRooms.length ? lodgingRevenue / availableRooms.length : 0;
  const averageStay = stays.length ? stays.reduce((total, stay) => {
    const reservation = reservations.find((item) => item.id === stay.reservationId);
    return total + (reservation ? countNights(reservation.entry, reservation.exit) : 0);
  }, 0) / stays.length : 0;

  const recentReservations = [...reservations].sort((first, second) => second.id - first.id).slice(0, 5);
  const pendingCleaning = housekeepingTasks.filter((task) => task.status !== "Concluída").length;
  const blockedRooms = rooms.filter((room) => room.maintenanceStatus === "Bloqueado").length;
  const departuresToday = stays.filter((stay) => stay.status === "Ativa" && stay.expectedExit === today()).length;
  const roomBreakdown = [
    { label: "Ocupados", value: occupiedRooms.length, status: "Ocupado" },
    { label: "Livres e limpos", value: rooms.filter((room) => room.occupancyStatus === "Livre" && room.cleaningStatus === "Limpo" && room.maintenanceStatus === "Disponível").length, status: "Livre" },
    { label: "Aguardando limpeza", value: rooms.filter((room) => room.cleaningStatus !== "Limpo").length, status: "Sujo" },
    { label: "Bloqueados", value: blockedRooms, status: "Bloqueado" },
  ];

  return <div className="ops-page">
    <PageHeader title="Dashboard" actions={<Btn variant="secondary" onClick={() => setConfirmReset(true)}>Restaurar dados de demonstração</Btn>} />
    <Alert type="info">Os dados deste protótipo são armazenados localmente neste navegador e não representam um banco de dados de produção.</Alert>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Taxa de ocupação" value={`${occupancyRate.toFixed(1)}%`} sub={`${occupiedRooms.length} de ${availableRooms.length} UHs disponíveis`} icon="hotel" />
      <StatCard label="RevPAR operacional" value={formatMoney(revPar)} sub="receita de hospedagem / UHs disponíveis" icon="banknote" />
      <StatCard label="Receita recebida" value={formatMoney(receivedRevenue)} sub={`${formatMoney(serviceRevenue)} em extras lançados`} icon="trending-up" />
      <StatCard label="Média de permanência" value={`${averageStay.toFixed(1)} diárias`} sub={`${stays.length} hospedagens consideradas`} icon="calendar-range" />
    </div>

    <div className="dashboard-operations-grid">
      <Card>
        <SectionTitle>Situação operacional dos quartos</SectionTitle>
        <div className="detail-list">{roomBreakdown.map((item) => <div className="dashboard-status-row" key={item.label}><span>{item.label}</span><div><strong>{item.value}</strong><Badge label={item.status} /></div></div>)}</div>
      </Card>
      <Card>
        <SectionTitle>Alertas operacionais</SectionTitle>
        <div className="detail-list">
          {pendingCleaning > 0 && <Alert type="warning">{pendingCleaning} tarefa(s) de limpeza aguardando conclusão.</Alert>}
          {blockedRooms > 0 && <Alert type="error">{blockedRooms} quarto(s) bloqueado(s) por manutenção.</Alert>}
          {departuresToday > 0 && <Alert type="info">{departuresToday} saída(s) prevista(s) para hoje.</Alert>}
          {pendingCleaning === 0 && blockedRooms === 0 && departuresToday === 0 && <Alert type="success">Nenhuma pendência operacional crítica.</Alert>}
        </div>
      </Card>
    </div>

    <Card>
      <SectionTitle>Reservas recentes</SectionTitle>
      <Table headers={["Reserva", "Responsável", "Quarto", "Entrada", "Saída", "Contratação", "Valor", "Status"]} rows={recentReservations.map((reservation) => [
        reservation.code,
        reservation.guest,
        rooms.find((room) => room.id === reservation.roomId)?.number ?? "—",
        reservation.entry,
        reservation.exit,
        reservation.packageSnapshot?.name ?? "Tarifa convencional",
        formatMoney(reservationBaseValue(reservation)),
        <Badge label={reservation.status} />,
      ])} />
    </Card>

    <Card>
      <SectionTitle>Composição financeira do protótipo</SectionTitle>
      <div className="summary-grid">
        <Summary label="Hospedagem contratada" value={formatMoney(lodgingRevenue)} />
        <Summary label="Consumos extras" value={formatMoney(serviceRevenue)} />
        <Summary label="Recebimentos efetivos" value={formatMoney(receivedRevenue)} />
        <Summary label="Contas a receber pendentes" value={formatMoney(pendingReceivables)} />
        <Summary label="Contas a pagar pendentes" value={formatMoney(pendingPayables)} />
        <Summary label="Saldo fisico do caixa" value={formatMoney(physicalCash)} />
      </div>
    </Card>
    {confirmReset && <ConfirmDialog title="Restaurar dados de demonstração" description="Todos os dados operacionais armazenados localmente serão substituídos pelo conjunto inicial de demonstração." onCancel={() => setConfirmReset(false)} onConfirm={() => { resetDemonstrationData(); setConfirmReset(false); }} />}
  </div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summary-item"><span>{label}</span><strong>{value}</strong></div>;
}
