import { StatCard, Card, SectionTitle, Badge, Icon, PageHeader } from "../ui";

const SERIF = "'Inria Serif', Georgia, serif";

const occupancyData = [
  { day: "Seg", pct: 72 },
  { day: "Ter", pct: 85 },
  { day: "Qua", pct: 91 },
  { day: "Qui", pct: 78 },
  { day: "Sex", pct: 95 },
  { day: "Sáb", pct: 100 },
  { day: "Dom", pct: 68 },
];

const reservations = [
  { guest: "Ana Souza",    room: "101", checkin: "13/09", checkout: "16/09", status: "Confirmada",   statusColor: "blue"  as const },
  { guest: "Pedro Lima",   room: "205", checkin: "13/09", checkout: "14/09", status: "Check-in",     statusColor: "green" as const },
  { guest: "Maria Costa",  room: "312", checkin: "14/09", checkout: "18/09", status: "Aguardando",   statusColor: "yellow" as const },
  { guest: "João Silva",   room: "407", checkin: "12/09", checkout: "13/09", status: "Check-out",    statusColor: "gray"  as const },
];

const roomStatus = [
  { label: "Livres",     count: 12, color: "var(--ok-fg)", pct: 24 },
  { label: "Ocupados",   count: 28, color: "var(--info-fg)", pct: 56 },
  { label: "Reservados", count: 7,  color: "var(--reserved-fg)", pct: 14 },
  { label: "Manutenção", count: 3,  color: "var(--warn-fg)", pct: 6  },
];

const alerts = [
  { msg: "Estoque de sabonetes abaixo do mínimo (12 un.)",           icon: "triangle-alert" as const, type: "warning" },
  { msg: "Quarto 204 com manutenção pendente há 2 dias",             icon: "octagon-alert" as const, type: "error"   },
  { msg: "3 check-outs previstos para hoje sem fatura gerada",       icon: "badge-check" as const, type: "info"    },
];

const alertStyle: Record<string, React.CSSProperties> = {
  warning: { background: "var(--warn-bg)", borderLeft: "4px solid var(--warn-fg)" },
  error:   { background: "var(--danger-bg)", borderLeft: "4px solid var(--danger-fg)" },
  info:    { background: "var(--info-bg)", borderLeft: "4px solid var(--info-fg)" },
};

export default function Dashboard() {
  const maxPct = Math.max(...occupancyData.map((d) => d.pct));
  const average = Math.round(occupancyData.reduce((total, item) => total + item.pct, 0) / occupancyData.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader title="Dashboard" />
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <StatCard label="Taxa de Ocupação" value="88%"       sub="hoje"                          icon="hotel" />
        <StatCard label="RevPAR"           value="R$ 312"    sub="por quarto disponível"         icon="banknote" />
        <StatCard label="Receita Total"    value="R$ 47,8k"  sub="setembro / 2026"               icon="trending-up" />
        <StatCard label="Média de Estadia" value="3,4 dias"  sub="últimos 30 dias"               icon="calendar-range" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        {/* Occupancy bar chart */}
        <Card>
          <SectionTitle>Ocupação — últimos 7 dias</SectionTitle>
          <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: "12px", height: "140px" }}>
            <div style={{ position: "absolute", zIndex: 1, right: 0, bottom: `${(average / maxPct) * 100}%`, left: 0, borderTop: "1px dashed var(--gold-500)" }} />
            {occupancyData.map((d) => (
              <div
                key={d.day}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}
              >
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{d.pct}%</span>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${(d.pct / maxPct) * 100}%`,
                      background: d.day === "Qua" ? "var(--gold-500)" : d.pct >= 90 ? "var(--brand-900)" : "var(--brand-700)",
                      borderRadius: "6px 6px 0 0",
                      minHeight: "8px",
                    }}
                  />
                </div>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-muted)" }}>{d.day}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", color: "var(--text-muted)", fontSize: "12px" }}>
            <span>— Média: {average}%</span><span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><i style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold-500)" }} />Hoje</span>
          </div>
        </Card>

        {/* Room status */}
        <Card>
          <SectionTitle>Status dos Quartos</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {roomStatus.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--text-body)" }}>{s.label}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: s.color }}>{s.count}</span>
                </div>
                <div style={{ height: "5px", background: "var(--bg-page)", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--brand-100)", marginTop: "4px" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text-muted)" }}>Total de quartos</span>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.82rem", color: "var(--brand-700)" }}>50</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent reservations */}
      <Card>
        <SectionTitle>Reservas recentes</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {["Hóspede", "Quarto", "Check-in", "Check-out", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      padding: "0 0 8px",
                      textAlign: "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--brand-100)" }}>
                  {[r.guest, r.room, r.checkin, r.checkout].map((cell, j) => (
                    <td
                      key={j}
                      style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--text-body)", padding: "9px 0" }}
                    >
                      {cell}
                    </td>
                  ))}
                  <td style={{ padding: "9px 0" }}>
                    <Badge label={r.status} color={r.statusColor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alerts */}
      <Card>
        <SectionTitle>Alertas do sistema</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {alerts.map((a, i) => (
            <div
              key={i}
              style={{
                ...alertStyle[a.type],
                borderRadius: "0 10px 10px 0",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ display: "flex", flexShrink: 0 }}><Icon name={a.icon} /></span>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.83rem", color: "var(--text-body)" }}>{a.msg}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
