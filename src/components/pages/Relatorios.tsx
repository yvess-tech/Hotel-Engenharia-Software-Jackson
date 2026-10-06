import { useState } from "react";
import { PageHeader, Card, Btn, Input, SectionTitle, StatCard, Tabs } from "../ui";

type Tab = "dashboard" | "ocupacao" | "receita" | "desempenho" | "rankings";

const SERIF = "'Inria Serif', Georgia, serif";

const monthlyData = [
  { mes: "Mar", receita: 38000, ocupacao: 72 },
  { mes: "Abr", receita: 42000, ocupacao: 78 },
  { mes: "Mai", receita: 45000, ocupacao: 82 },
  { mes: "Jun", receita: 51000, ocupacao: 88 },
  { mes: "Jul", receita: 58000, ocupacao: 94 },
  { mes: "Ago", receita: 54000, ocupacao: 91 },
  { mes: "Set", receita: 47800, ocupacao: 88 },
];

const origins = [
  { label: "Site próprio",    pct: 42, color: "var(--brand-700)" },
  { label: "Booking.com",    pct: 31, color: "var(--info-fg)" },
  { label: "Expedia",        pct: 15, color: "var(--warn-fg)" },
  { label: "Ligação direta", pct: 12, color: "var(--reserved-fg)" },
];

const maxReceita  = Math.max(...monthlyData.map((d) => d.receita));

export default function Relatorios() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Relatórios"
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn variant="secondary">Exportar PDF</Btn>
            <Btn variant="ghost">Exportar XLSX</Btn>
          </div>
        }
      />

      <Tabs
        tabs={[
          { id: "dashboard",  label: "Dashboard"   },
          { id: "ocupacao",   label: "Ocupação"    },
          { id: "receita",    label: "Receita"     },
          { id: "desempenho", label: "Desempenho"  },
          { id: "rankings",   label: "Rankings"    },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            <StatCard label="Taxa de Ocupação"    value="88%"      sub="set/2026"               icon="hotel" />
            <StatCard label="RevPAR"              value="R$ 312"   sub="por quarto disponível"  icon="banknote" />
            <StatCard label="Receita Total"       value="R$ 47,8k" sub="setembro / 2026"        icon="trending-up" />
            <StatCard label="Média de Permanência" value="3,4 dias" sub="últimos 30 dias"       icon="calendar-range" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <Card>
              <SectionTitle>Receita mensal — 2026 (R$)</SectionTitle>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "150px" }}>
                {monthlyData.map((d) => (
                  <div key={d.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {(d.receita / 1000).toFixed(0)}k
                    </span>
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                      <div
                        style={{
                          width: "100%",
                          height: `${(d.receita / maxReceita) * 100}%`,
                          background: `linear-gradient(180deg, var(--brand-700), var(--brand-700))`,
                          borderRadius: "6px 6px 0 0",
                          minHeight: "4px",
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{d.mes}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>Origem das Reservas</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {origins.map((o) => (
                  <div key={o.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--text-body)" }}>{o.label}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.8rem", color: o.color }}>{o.pct}%</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-page)", borderRadius: "3px" }}>
                      <div style={{ height: "100%", width: `${o.pct}%`, background: o.color, borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            <StatCard label="Check-ins hoje"    value="4"   color="var(--brand-700)" />
            <StatCard label="Check-outs hoje"   value="2"   color="var(--danger-fg)" />
            <StatCard label="Reservas este mês" value="148" color="var(--info-fg)" />
            <StatCard label="Cancelamentos"     value="16"  color="var(--warn-fg)" />
          </div>
        </div>
      )}

      {tab !== "dashboard" && (
        <Card>
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <Input label="Período inicial" type="date" defaultValue="2026-09-01" />
            <Input label="Período final"   type="date" defaultValue="2026-09-13" />
            <Btn>Gerar Relatório</Btn>
          </div>

          {tab === "ocupacao" && (
            <div>
              <SectionTitle>Taxa de Ocupação por Mês</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                {monthlyData.map((d) => (
                  <div key={d.mes} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--text-muted)", width: "36px" }}>{d.mes}</span>
                    <div style={{ flex: 1, height: "22px", background: "var(--bg-page)", borderRadius: "6px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${d.ocupacao}%`,
                          background: d.ocupacao >= 90 ? "var(--brand-700)" : "var(--brand-700)",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "8px",
                        }}
                      >
                        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", color: "var(--bg-card)" }}>{d.ocupacao}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "receita" && (
            <div>
              <SectionTitle>Composição de Receita — Total: R$ 336.600,00</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                {[
                  { centro: "Hospedagem", valor: "R$ 220.000,00", pct: 65, color: "var(--brand-700)" },
                  { centro: "Restaurante", valor: "R$ 72.000,00",  pct: 21, color: "var(--info-fg)" },
                  { centro: "Eventos",     valor: "R$ 28.000,00",  pct: 8,  color: "var(--reserved-fg)" },
                  { centro: "Spa & Outros", valor: "R$ 16.600,00", pct: 6,  color: "var(--warn-fg)" },
                ].map((r) => (
                  <div key={r.centro}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--text-body)" }}>{r.centro}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: r.color }}>
                        {r.valor} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>({r.pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: "8px", background: "var(--bg-page)", borderRadius: "4px" }}>
                      <div style={{ height: "100%", width: `${r.pct}%`, background: r.color, borderRadius: "4px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "desempenho" && (
            <div>
              <SectionTitle>Indicadores de Desempenho</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "8px" }}>
                <StatCard label="Reservas totais"       value="148"   color="var(--brand-700)" />
                <StatCard label="Check-ins realizados"  value="132"   color="var(--info-fg)" />
                <StatCard label="Cancelamentos"         value="16"    color="var(--danger-fg)" />
                <StatCard label="Taxa de cancelamento"  value="10,8%" color="var(--warn-fg)" />
              </div>
            </div>
          )}

          {tab === "rankings" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <SectionTitle>Quartos Mais Utilizados</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  {[
                    { quarto: "312 — Suíte",    noites: 24 },
                    { quarto: "205 — Luxo",     noites: 21 },
                    { quarto: "101 — Standard", noites: 18 },
                    { quarto: "407 — Standard", noites: 15 },
                  ].map((q, i) => (
                    <div key={q.quarto} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "var(--bg-card)", borderRadius: "10px" }}>
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--brand-700)", color: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--text-body)" }}>{q.quarto}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--brand-700)" }}>{q.noites} noites</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SectionTitle>Serviços Mais Utilizados</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  {[
                    { servico: "Room Service", usos: 87 },
                    { servico: "Restaurante",  usos: 64 },
                    { servico: "Spa",          usos: 41 },
                    { servico: "Lavanderia",   usos: 29 },
                  ].map((s, i) => (
                    <div key={s.servico} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "var(--bg-card)", borderRadius: "10px" }}>
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--info-fg)", color: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--text-body)" }}>{s.servico}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--info-fg)" }}>{s.usos} usos</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
