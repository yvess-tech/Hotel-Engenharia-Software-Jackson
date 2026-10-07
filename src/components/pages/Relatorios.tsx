import { useMemo, useState, type ReactNode } from "react";
import { useAccessControl } from "../../access-control";
import {
  Alert,
  Badge,
  Btn,
  Card,
  Input,
  PageHeader,
  SectionTitle,
  Select,
  StatCard,
  Table,
  Tabs,
} from "../ui";

type Tab = "dashboard" | "relatorios" | "historico";
type ReportType =
  | "ocupacao"
  | "revpar"
  | "receita"
  | "permanencia"
  | "origens"
  | "desempenho"
  | "quartos"
  | "servicos";

interface MonthlyRecord {
  month: string;
  label: string;
  availableRoomNights: number;
  occupiedRoomNights: number;
  roomRevenue: number;
  totalRevenue: number;
  stays: number;
  stayNights: number;
  reservations: number;
  cancellations: number;
}

interface GeneratedReport {
  id: number;
  type: ReportType;
  start: string;
  end: string;
  generatedAt: string;
  generatedBy: string;
}

const reportLabels: Record<ReportType, string> = {
  ocupacao: "Taxa de ocupação",
  revpar: "RevPAR",
  receita: "Receita total",
  permanencia: "Média de permanência",
  origens: "Origem das reservas",
  desempenho: "Desempenho por período",
  quartos: "Ranking de quartos",
  servicos: "Ranking de serviços",
};

const monthlyData: MonthlyRecord[] = [
  { month: "2026-01", label: "Jan", availableRoomNights: 1550, occupiedRoomNights: 1012, roomRevenue: 322000, totalRevenue: 401500, stays: 295, stayNights: 1012, reservations: 318, cancellations: 23 },
  { month: "2026-02", label: "Fev", availableRoomNights: 1400, occupiedRoomNights: 980, roomRevenue: 329000, totalRevenue: 412800, stays: 282, stayNights: 980, reservations: 301, cancellations: 19 },
  { month: "2026-03", label: "Mar", availableRoomNights: 1550, occupiedRoomNights: 1116, roomRevenue: 381000, totalRevenue: 468300, stays: 324, stayNights: 1116, reservations: 350, cancellations: 26 },
  { month: "2026-04", label: "Abr", availableRoomNights: 1500, occupiedRoomNights: 1170, roomRevenue: 408000, totalRevenue: 502600, stays: 338, stayNights: 1170, reservations: 362, cancellations: 24 },
  { month: "2026-05", label: "Mai", availableRoomNights: 1550, occupiedRoomNights: 1271, roomRevenue: 456000, totalRevenue: 561900, stays: 359, stayNights: 1271, reservations: 385, cancellations: 26 },
  { month: "2026-06", label: "Jun", availableRoomNights: 1500, occupiedRoomNights: 1320, roomRevenue: 510000, totalRevenue: 632500, stays: 371, stayNights: 1320, reservations: 396, cancellations: 25 },
  { month: "2026-07", label: "Jul", availableRoomNights: 1550, occupiedRoomNights: 1457, roomRevenue: 589000, totalRevenue: 728400, stays: 402, stayNights: 1457, reservations: 425, cancellations: 23 },
  { month: "2026-08", label: "Ago", availableRoomNights: 1550, occupiedRoomNights: 1411, roomRevenue: 565000, totalRevenue: 694700, stays: 394, stayNights: 1411, reservations: 420, cancellations: 26 },
  { month: "2026-09", label: "Set", availableRoomNights: 1500, occupiedRoomNights: 1320, roomRevenue: 468000, totalRevenue: 578600, stays: 388, stayNights: 1320, reservations: 411, cancellations: 23 },
];

const originData = [
  { name: "Site próprio", reservations: 1178 },
  { name: "Booking.com", reservations: 868 },
  { name: "Expedia", reservations: 420 },
  { name: "Ligação direta", reservations: 336 },
];

const roomRanking = [
  { room: "312", category: "Suíte", nights: 218, occupancy: 92, revenue: 128400 },
  { room: "205", category: "Luxo", nights: 207, occupancy: 88, revenue: 105570 },
  { room: "101", category: "Standard", nights: 194, occupancy: 84, revenue: 69840 },
  { room: "407", category: "Standard", nights: 183, occupancy: 81, revenue: 65880 },
  { room: "204", category: "Luxo", nights: 176, occupancy: 79, revenue: 89760 },
];

const serviceRanking = [
  { service: "Room service", uses: 687, revenue: 72135, averageTicket: 105 },
  { service: "Restaurante", uses: 564, revenue: 95880, averageTicket: 170 },
  { service: "Lavanderia", uses: 341, revenue: 18755, averageTicket: 55 },
  { service: "Spa", uses: 298, revenue: 77480, averageTicket: 260 },
  { service: "Transfer", uses: 214, revenue: 32100, averageTicket: 150 },
];

const initialHistory: GeneratedReport[] = [
  { id: 1, type: "ocupacao", start: "2026-01", end: "2026-08", generatedAt: "2026-09-01T09:12", generatedBy: "João Carlos" },
  { id: 2, type: "receita", start: "2026-08", end: "2026-08", generatedAt: "2026-09-02T14:35", generatedBy: "João Carlos" },
  { id: 3, type: "quartos", start: "2026-01", end: "2026-08", generatedAt: "2026-09-03T10:20", generatedBy: "João Carlos" },
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const decimalCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function periodLabel(start: string, end: string) {
  const format = (value: string) =>
    new Date(`${value}-15T12:00:00`).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
  return start === end ? format(start) : `${format(start)} a ${format(end)}`;
}

function calculateTotals(records: MonthlyRecord[]): Totals {
  const available = records.reduce(
    (sum, record) => sum + record.availableRoomNights,
    0,
  );
  const occupied = records.reduce(
    (sum, record) => sum + record.occupiedRoomNights,
    0,
  );
  const roomRevenue = records.reduce(
    (sum, record) => sum + record.roomRevenue,
    0,
  );
  const totalRevenue = records.reduce(
    (sum, record) => sum + record.totalRevenue,
    0,
  );
  const stays = records.reduce((sum, record) => sum + record.stays, 0);
  const nights = records.reduce((sum, record) => sum + record.stayNights, 0);
  const reservations = records.reduce(
    (sum, record) => sum + record.reservations,
    0,
  );
  const cancellations = records.reduce(
    (sum, record) => sum + record.cancellations,
    0,
  );
  return {
    available,
    occupied,
    roomRevenue,
    totalRevenue,
    stays,
    nights,
    reservations,
    cancellations,
    occupancy: available ? (occupied / available) * 100 : 0,
    revpar: available ? roomRevenue / available : 0,
    averageStay: stays ? nights / stays : 0,
    cancellationRate: reservations ? (cancellations / reservations) * 100 : 0,
  };
}

export default function Relatorios() {
  const { activeAccount, registerLog } = useAccessControl();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [reportType, setReportType] = useState<ReportType>("ocupacao");
  const [start, setStart] = useState("2026-01");
  const [end, setEnd] = useState("2026-09");
  const [appliedQuery, setAppliedQuery] = useState({
    type: "ocupacao" as ReportType,
    start: "2026-01",
    end: "2026-09",
  });
  const [history, setHistory] = useState(initialHistory);
  const [error, setError] = useState("");
  const [historyType, setHistoryType] = useState("");

  const actor = activeAccount
    ? { id: activeAccount.id, name: activeAccount.name }
    : undefined;

  const records = useMemo(
    () =>
      monthlyData.filter(
        (record) =>
          record.month >= appliedQuery.start && record.month <= appliedQuery.end,
      ),
    [appliedQuery],
  );

  const totals = useMemo(() => calculateTotals(records), [records]);
  const dashboardTotals = useMemo(() => calculateTotals(monthlyData), []);

  const generateReport = () => {
    if (!start || !end) {
      setError("Informe o período inicial e final.");
      return;
    }
    if (start > end) {
      setError("O período inicial não pode ser posterior ao período final.");
      return;
    }
    if (!monthlyData.some((record) => record.month >= start && record.month <= end)) {
      setError("Não existem dados disponíveis para o período informado.");
      return;
    }
    const generated: GeneratedReport = {
      id: Date.now(),
      type: reportType,
      start,
      end,
      generatedAt: new Date().toISOString(),
      generatedBy: activeAccount?.name ?? "Usuário",
    };
    setAppliedQuery({ type: reportType, start, end });
    setHistory((current) => [generated, ...current]);
    setError("");
    registerLog(
      "Relatório gerado",
      "Relatórios",
      `${reportLabels[reportType]} — ${periodLabel(start, end)}.`,
      "Sucesso",
      actor,
    );
  };

  const consultHistory = (report: GeneratedReport) => {
    setReportType(report.type);
    setStart(report.start);
    setEnd(report.end);
    setAppliedQuery({
      type: report.type,
      start: report.start,
      end: report.end,
    });
    setTab("relatorios");
    setError("");
    registerLog(
      "Relatório consultado",
      "Relatórios",
      `${reportLabels[report.type]} — ${periodLabel(report.start, report.end)}.`,
      "Sucesso",
      actor,
    );
  };

  const exportRows = (): (string | number)[][] => {
    switch (appliedQuery.type) {
      case "ocupacao":
        return records.map((record) => [
          record.label,
          record.availableRoomNights,
          record.occupiedRoomNights,
          `${((record.occupiedRoomNights / record.availableRoomNights) * 100).toFixed(1)}%`,
        ]);
      case "revpar":
        return records.map((record) => [
          record.label,
          record.availableRoomNights,
          record.roomRevenue,
          (record.roomRevenue / record.availableRoomNights).toFixed(2),
        ]);
      case "receita":
        return records.map((record) => [
          record.label,
          record.roomRevenue,
          record.totalRevenue - record.roomRevenue,
          record.totalRevenue,
        ]);
      case "permanencia":
        return records.map((record) => [
          record.label,
          record.stays,
          record.stayNights,
          (record.stayNights / record.stays).toFixed(2),
        ]);
      case "origens":
        return originData.map((origin) => {
          const share = origin.reservations / originTotal;
          return [
            origin.name,
            Math.round(totals.reservations * share),
            `${(share * 100).toFixed(1)}%`,
          ];
        });
      case "desempenho":
        return records.map((record) => [
          record.label,
          record.reservations,
          record.cancellations,
          `${((record.occupiedRoomNights / record.availableRoomNights) * 100).toFixed(1)}%`,
          (record.roomRevenue / record.availableRoomNights).toFixed(2),
          record.totalRevenue,
        ]);
      case "quartos":
        return roomRanking.map((room, index) => [
          index + 1,
          room.room,
          room.category,
          room.nights,
          `${room.occupancy}%`,
          room.revenue,
        ]);
      case "servicos":
        return serviceRanking.map((service, index) => [
          index + 1,
          service.service,
          service.uses,
          service.revenue,
          service.averageTicket,
        ]);
    }
  };

  const exportHeaders = (): string[] => {
    const headers: Record<ReportType, string[]> = {
      ocupacao: ["Período", "Diárias disponíveis", "Diárias ocupadas", "Taxa de ocupação"],
      revpar: ["Período", "Diárias disponíveis", "Receita de hospedagem", "RevPAR"],
      receita: ["Período", "Hospedagem", "Outras receitas", "Receita total"],
      permanencia: ["Período", "Estadias", "Diárias", "Média de permanência"],
      origens: ["Origem", "Reservas", "Participação"],
      desempenho: ["Período", "Reservas", "Cancelamentos", "Ocupação", "RevPAR", "Receita total"],
      quartos: ["Posição", "Quarto", "Categoria", "Diárias", "Ocupação", "Receita"],
      servicos: ["Posição", "Serviço", "Utilizações", "Receita", "Ticket médio"],
    };
    return headers[appliedQuery.type];
  };

  const exportCsv = () => {
    const escapeCell = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const csv = [exportHeaders(), ...exportRows()]
      .map((row) => row.map(escapeCell).join(";"))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${appliedQuery.type}-${appliedQuery.start}-${appliedQuery.end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    registerLog(
      "Relatório exportado",
      "Relatórios",
      `${reportLabels[appliedQuery.type]} exportado em CSV.`,
      "Sucesso",
      actor,
    );
  };

  const printReport = () => {
    window.print();
    registerLog(
      "Relatório exportado",
      "Relatórios",
      `${reportLabels[appliedQuery.type]} enviado para impressão/PDF.`,
      "Sucesso",
      actor,
    );
  };

  const dashboardRecords = monthlyData;
  const maxRevenue = Math.max(...dashboardRecords.map((record) => record.totalRevenue));
  const originTotal = originData.reduce((sum, origin) => sum + origin.reservations, 0);
  const filteredHistory = history.filter(
    (report) => !historyType || report.type === historyType,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Relatórios & Dashboard — RF131 a RF141"
        actions={
          tab === "relatorios" ? (
            <div className="flex flex-wrap gap-2">
              <Btn variant="secondary" onClick={exportCsv}>
                Exportar CSV
              </Btn>
              <Btn variant="ghost" onClick={printReport}>
                Imprimir / PDF
              </Btn>
            </div>
          ) : undefined
        }
      />

      <Tabs
        tabs={[
          { id: "dashboard", label: "Dashboard gerencial" },
          { id: "relatorios", label: "Gerar relatório" },
          { id: "historico", label: "Relatórios consultados" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "dashboard" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Taxa de ocupação"
              value={`${dashboardTotals.occupancy.toFixed(1)}%`}
              sub="média ponderada em 2026"
              icon="hotel"
            />
            <StatCard
              label="RevPAR"
              value={decimalCurrency.format(dashboardTotals.revpar)}
              sub="receita por quarto disponível"
              icon="banknote"
            />
            <StatCard
              label="Receita total"
              value={currency.format(dashboardTotals.totalRevenue)}
              sub="acumulado no período"
              icon="trending-up"
            />
            <StatCard
              label="Média de permanência"
              value={`${dashboardTotals.averageStay.toFixed(1)} dias`}
              sub={`${dashboardTotals.stays.toLocaleString("pt-BR")} estadias`}
              icon="calendar-range"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <Card>
              <SectionTitle>Receita e ocupação por mês</SectionTitle>
              <div className="mt-4 flex h-64 items-end gap-2 sm:gap-4">
                {dashboardRecords.map((record) => {
                  const occupancy =
                    (record.occupiedRoomNights / record.availableRoomNights) * 100;
                  return (
                    <div
                      key={record.month}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <p className="hidden text-xs font-bold text-primary sm:block">
                        {currency.format(record.totalRevenue / 1000)} mil
                      </p>
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-lg bg-primary"
                          style={{ height: `${(record.totalRevenue / maxRevenue) * 100}%` }}
                          title={`${record.label}: ${currency.format(record.totalRevenue)}`}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{record.label}</p>
                      <Badge label={`${occupancy.toFixed(0)}%`} color="green" />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <SectionTitle>Origem das reservas</SectionTitle>
              <div className="mt-4 space-y-5">
                {originData.map((origin) => {
                  const share = (origin.reservations / originTotal) * 100;
                  return (
                    <ProgressRow
                      key={origin.name}
                      label={origin.name}
                      value={`${share.toFixed(1)}%`}
                      progress={share}
                    />
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <SectionTitle>Quartos mais utilizados</SectionTitle>
              <RankingList
                rows={roomRanking.slice(0, 4).map((room) => ({
                  label: `Quarto ${room.room} · ${room.category}`,
                  value: `${room.nights} diárias`,
                }))}
              />
            </Card>
            <Card>
              <SectionTitle>Serviços mais utilizados</SectionTitle>
              <RankingList
                rows={serviceRanking.slice(0, 4).map((service) => ({
                  label: service.service,
                  value: `${service.uses} utilizações`,
                }))}
              />
            </Card>
          </div>
        </div>
      )}

      {tab === "relatorios" && (
        <div className="space-y-5">
          <Card>
            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto] lg:items-end">
              <Select
                label="Tipo de relatório"
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
              >
                {Object.entries(reportLabels).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </Select>
              <Input
                label="Período inicial"
                type="month"
                min="2026-01"
                max="2026-09"
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
              <Input
                label="Período final"
                type="month"
                min="2026-01"
                max="2026-09"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
              <Btn onClick={generateReport}>Gerar relatório</Btn>
            </div>
            {error && (
              <div className="mt-4">
                <Alert type="error">{error}</Alert>
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <SectionTitle>{reportLabels[appliedQuery.type]}</SectionTitle>
                <p className="text-sm text-gray-500">
                  Período: {periodLabel(appliedQuery.start, appliedQuery.end)}
                </p>
              </div>
              <Badge label="Atualizado" color="green" />
            </div>
            <ReportContent
              type={appliedQuery.type}
              records={records}
              totals={totals}
            />
          </Card>
        </div>
      )}

      {tab === "historico" && (
        <Card>
          <div className="mb-4 max-w-sm">
            <Select
              label="Tipo de relatório"
              value={historyType}
              onChange={(event) => setHistoryType(event.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(reportLabels).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </Select>
          </div>
          <Table
            headers={["Relatório", "Período", "Gerado em", "Responsável", "Ação"]}
            rows={filteredHistory.map((report) => [
              reportLabels[report.type],
              periodLabel(report.start, report.end),
              formatDate(report.generatedAt),
              report.generatedBy,
              <Btn small variant="secondary" onClick={() => consultHistory(report)}>
                Consultar
              </Btn>,
            ])}
          />
        </Card>
      )}
    </div>
  );
}

type Totals = {
  available: number;
  occupied: number;
  roomRevenue: number;
  totalRevenue: number;
  stays: number;
  nights: number;
  reservations: number;
  cancellations: number;
  occupancy: number;
  revpar: number;
  averageStay: number;
  cancellationRate: number;
};

function ReportContent({
  type,
  records,
  totals,
}: {
  type: ReportType;
  records: MonthlyRecord[];
  totals: Totals;
}) {
  if (type === "ocupacao") {
    return (
      <div className="space-y-5">
        <ReportSummary
          items={[
            { label: "Ocupação no período", value: `${totals.occupancy.toFixed(1)}%` },
            { label: "Diárias ocupadas", value: totals.occupied.toLocaleString("pt-BR") },
            { label: "Diárias disponíveis", value: totals.available.toLocaleString("pt-BR") },
          ]}
        />
        <div className="space-y-3">
          {records.map((record) => {
            const rate = (record.occupiedRoomNights / record.availableRoomNights) * 100;
            return (
              <ProgressRow
                key={record.month}
                label={record.label}
                value={`${rate.toFixed(1)}%`}
                progress={rate}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "revpar") {
    return (
      <div className="space-y-5">
        <ReportSummary
          items={[
            { label: "RevPAR no período", value: decimalCurrency.format(totals.revpar) },
            { label: "Receita de hospedagem", value: currency.format(totals.roomRevenue) },
            { label: "Quartos disponíveis", value: totals.available.toLocaleString("pt-BR") },
          ]}
        />
        <Table
          headers={["Período", "Receita de hospedagem", "Diárias disponíveis", "RevPAR"]}
          rows={records.map((record) => [
            record.label,
            currency.format(record.roomRevenue),
            record.availableRoomNights.toLocaleString("pt-BR"),
            decimalCurrency.format(record.roomRevenue / record.availableRoomNights),
          ])}
        />
      </div>
    );
  }

  if (type === "receita") {
    return (
      <div className="space-y-5">
        <ReportSummary
          items={[
            { label: "Receita total", value: currency.format(totals.totalRevenue) },
            { label: "Hospedagem", value: currency.format(totals.roomRevenue) },
            { label: "Serviços e adicionais", value: currency.format(totals.totalRevenue - totals.roomRevenue) },
          ]}
        />
        <Table
          headers={["Período", "Hospedagem", "Outras receitas", "Receita total"]}
          rows={records.map((record) => [
            record.label,
            currency.format(record.roomRevenue),
            currency.format(record.totalRevenue - record.roomRevenue),
            currency.format(record.totalRevenue),
          ])}
        />
      </div>
    );
  }

  if (type === "permanencia") {
    return (
      <div className="space-y-5">
        <ReportSummary
          items={[
            { label: "Média de permanência", value: `${totals.averageStay.toFixed(2)} dias` },
            { label: "Estadias concluídas", value: totals.stays.toLocaleString("pt-BR") },
            { label: "Diárias hospedadas", value: totals.nights.toLocaleString("pt-BR") },
          ]}
        />
        <Table
          headers={["Período", "Estadias", "Diárias", "Média de permanência"]}
          rows={records.map((record) => [
            record.label,
            record.stays,
            record.stayNights,
            `${(record.stayNights / record.stays).toFixed(2)} dias`,
          ])}
        />
      </div>
    );
  }

  if (type === "origens") {
    const originTotal = originData.reduce(
      (sum, origin) => sum + origin.reservations,
      0,
    );
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          {originData.map((origin) => {
            const share = (origin.reservations / originTotal) * 100;
            return (
              <ProgressRow
                key={origin.name}
                label={origin.name}
                value={`${share.toFixed(1)}%`}
                progress={share}
              />
            );
          })}
        </div>
        <Table
          headers={["Origem", "Reservas", "Participação"]}
          rows={originData.map((origin) => [
            origin.name,
            Math.round(
              totals.reservations * (origin.reservations / originTotal),
            ).toLocaleString("pt-BR"),
            `${((origin.reservations / originTotal) * 100).toFixed(1)}%`,
          ])}
        />
      </div>
    );
  }

  if (type === "desempenho") {
    return (
      <div className="space-y-5">
        <ReportSummary
          items={[
            { label: "Reservas", value: totals.reservations.toLocaleString("pt-BR") },
            { label: "Cancelamentos", value: totals.cancellations.toLocaleString("pt-BR") },
            { label: "Taxa de cancelamento", value: `${totals.cancellationRate.toFixed(1)}%` },
            { label: "Receita total", value: currency.format(totals.totalRevenue) },
          ]}
        />
        <Table
          headers={["Período", "Reservas", "Cancelamentos", "Ocupação", "RevPAR", "Receita"]}
          rows={records.map((record) => [
            record.label,
            record.reservations,
            record.cancellations,
            `${((record.occupiedRoomNights / record.availableRoomNights) * 100).toFixed(1)}%`,
            decimalCurrency.format(record.roomRevenue / record.availableRoomNights),
            currency.format(record.totalRevenue),
          ])}
        />
      </div>
    );
  }

  if (type === "quartos") {
    return (
      <Table
        headers={["Posição", "Quarto", "Categoria", "Diárias ocupadas", "Ocupação", "Receita"]}
        rows={roomRanking.map((room, index) => [
          <Rank position={index + 1} />,
          room.room,
          room.category,
          room.nights,
          `${room.occupancy}%`,
          currency.format(room.revenue),
        ])}
      />
    );
  }

  return (
    <Table
      headers={["Posição", "Serviço", "Utilizações", "Receita", "Ticket médio"]}
      rows={serviceRanking.map((service, index) => [
        <Rank position={index + 1} />,
        service.service,
        service.uses,
        currency.format(service.revenue),
        currency.format(service.averageTicket),
      ])}
    />
  );
}

function ReportSummary({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${items.length > 3 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-primary/70">
            {item.label}
          </p>
          <p className="mt-2 text-xl font-bold text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-bold text-primary">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}

function RankingList({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className="flex items-center gap-3 rounded-lg bg-surface p-3"
        >
          <Rank position={index + 1} />
          <span className="min-w-0 flex-1 text-sm text-gray-700">{row.label}</span>
          <span className="text-sm font-bold text-primary">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function Rank({ position }: { position: number }): ReactNode {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
      {position}
    </span>
  );
}
