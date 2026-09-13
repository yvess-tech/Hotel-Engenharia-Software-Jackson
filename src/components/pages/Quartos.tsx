import { useState } from "react";
import { PageHeader, Card, Btn, Input, Select, Modal, Badge, SectionTitle, Tabs, FormGrid, FullCol, FormActions, Table } from "../ui";

type Status = "Livre" | "Ocupado" | "Manutenção" | "Reservado";
type Tab = "painel" | "lista" | "categorias";

const statusColor: Record<Status, "green" | "blue" | "yellow" | "red"> = {
  Livre:      "green",
  Ocupado:    "blue",
  Manutenção: "yellow",
  Reservado:  "red",
};

const statusBg: Record<Status, string> = {
  Livre:      "#f0fdf4",
  Ocupado:    "#eff6ff",
  Manutenção: "#fffbeb",
  Reservado:  "#fef2f2",
};

const statusBorder: Record<Status, string> = {
  Livre:      "#bbf7d0",
  Ocupado:    "#bfdbfe",
  Manutenção: "#fde68a",
  Reservado:  "#fecaca",
};

const initialQuartos = [
  { id: 1, numero: "101", andar: "1", categoria: "Standard", capacidade: 2, status: "Livre"      as Status, tarifa: "R$ 250,00", obs: "Vista jardim"    },
  { id: 2, numero: "102", andar: "1", categoria: "Standard", capacidade: 2, status: "Ocupado"    as Status, tarifa: "R$ 250,00", obs: ""                 },
  { id: 3, numero: "205", andar: "2", categoria: "Luxo",     capacidade: 3, status: "Reservado"  as Status, tarifa: "R$ 450,00", obs: "Acessível"        },
  { id: 4, numero: "312", andar: "3", categoria: "Suíte",    capacidade: 4, status: "Livre"      as Status, tarifa: "R$ 800,00", obs: "Vista panorâmica" },
  { id: 5, numero: "204", andar: "2", categoria: "Luxo",     capacidade: 2, status: "Manutenção" as Status, tarifa: "R$ 450,00", obs: "Encanamento"     },
  { id: 6, numero: "407", andar: "4", categoria: "Standard", capacidade: 2, status: "Livre"      as Status, tarifa: "R$ 260,00", obs: ""                 },
];

const SERIF = "'Inria Serif', Georgia, serif";

export default function Quartos() {
  const [quartos, setQuartos] = useState(initialQuartos);
  const [tab, setTab] = useState<Tab>("painel");
  const [modal, setModal] = useState<"new" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<typeof initialQuartos[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({ numero: "", andar: "1", categoria: "Standard", capacidade: "2", status: "Livre", tarifa: "", obs: "" });

  const filtered = quartos.filter(
    (q) => (!filterStatus || q.status === filterStatus)
  );

  const save = () => {
    if (modal === "new") {
      setQuartos([...quartos, { id: Date.now(), ...form, capacidade: Number(form.capacidade), status: form.status as Status }]);
    } else if (modal === "edit" && selected) {
      setQuartos(quartos.map((q) => q.id === selected.id ? { ...q, ...form, capacidade: Number(form.capacidade), status: form.status as Status } : q));
    }
    setModal(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Quartos — RF16 a RF23"
        actions={
          <Btn onClick={() => { setForm({ numero: "", andar: "1", categoria: "Standard", capacidade: "2", status: "Livre", tarifa: "", obs: "" }); setModal("new"); }}>
            + Cadastrar Quarto
          </Btn>
        }
      />

      <Tabs
        tabs={[
          { id: "painel",     label: "Painel visual" },
          { id: "lista",      label: "Lista detalhada" },
          { id: "categorias", label: "Categorias" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "painel" && (
        <Card>
          <SectionTitle>Mapa de quartos — clique para detalhes</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "10px" }}>
            {quartos.map((q) => (
              <button
                key={q.id}
                onClick={() => { setSelected(q); setModal("view"); }}
                style={{
                  background: statusBg[q.status],
                  border: `1.5px solid ${statusBorder[q.status]}`,
                  borderRadius: "12px",
                  padding: "12px 10px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "transform 0.1s, box-shadow 0.1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "1.1rem", color: "#2d3d1a", marginBottom: "4px" }}>{q.numero}</p>
                <p style={{ fontFamily: SERIF, fontSize: "0.68rem", color: "#7a8a6a", marginBottom: "6px" }}>{q.categoria}</p>
                <Badge label={q.status} color={statusColor[q.status]} />
              </button>
            ))}
          </div>
        </Card>
      )}

      {tab === "lista" && (
        <Card>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ width: "180px" }}>
              <Select label="Filtrar por status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option>Livre</option>
                <option>Ocupado</option>
                <option>Manutenção</option>
                <option>Reservado</option>
              </Select>
            </div>
          </div>
          <Table
            headers={["Nº", "Andar", "Categoria", "Capacidade", "Tarifa/noite", "Status", "Ações"]}
            rows={filtered.map((q) => [
              q.numero,
              `${q.andar}º`,
              q.categoria,
              `${q.capacidade} pax`,
              q.tarifa,
              <Badge label={q.status} color={statusColor[q.status]} />,
              <div style={{ display: "flex", gap: "6px" }}>
                <Btn small variant="secondary" onClick={() => { setSelected(q); setForm({ numero: q.numero, andar: q.andar, categoria: q.categoria, capacidade: String(q.capacidade), status: q.status, tarifa: q.tarifa, obs: q.obs }); setModal("edit"); }}>Editar</Btn>
                <Btn small variant="danger"    onClick={() => setQuartos(quartos.filter((x) => x.id !== q.id))}>Excluir</Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "categorias" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {["Standard", "Luxo", "Suíte"].map((cat) => {
            const items = quartos.filter((q) => q.categoria === cat);
            return (
              <Card key={cat}>
                <SectionTitle>{cat}</SectionTitle>
                <p style={{ fontFamily: SERIF, fontSize: "0.82rem", color: "#7a8a6a", marginBottom: "10px" }}>
                  {items.length} quartos cadastrados
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {items.map((q) => (
                    <Badge key={q.id} label={`${q.numero} · ${q.status}`} color={statusColor[q.status]} />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {(modal === "new" || modal === "edit") && (
        <Modal title={modal === "new" ? "Cadastrar Quarto" : "Editar Quarto"} onClose={() => setModal(null)}>
          <FormGrid cols={2}>
            <Input label="Número *"  value={form.numero}     onChange={(e) => setForm({ ...form, numero: e.target.value })} />
            <Input label="Andar"     value={form.andar}      onChange={(e) => setForm({ ...form, andar: e.target.value })} />
            <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              <option>Standard</option><option>Luxo</option><option>Suíte</option>
            </Select>
            <Input label="Capacidade (pax)" type="number" min="1" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} />
            <Input label="Tarifa diária" placeholder="R$ 0,00" value={form.tarifa} onChange={(e) => setForm({ ...form, tarifa: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Livre</option><option>Ocupado</option><option>Manutenção</option><option>Reservado</option>
            </Select>
            <FullCol>
              <Input label="Observações" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Vista, acessibilidade, etc." />
            </FullCol>
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {modal === "view" && selected && (
        <Modal title={`Quarto ${selected.numero}`} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {[
              ["Número", selected.numero],
              ["Andar", `${selected.andar}º`],
              ["Categoria", selected.categoria],
              ["Capacidade", `${selected.capacidade} pessoas`],
              ["Tarifa", `${selected.tarifa} / noite`],
              ["Observações", selected.obs || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: "8px", paddingBottom: "8px", borderBottom: "1px solid #f0f2ee" }}>
                <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem", color: "#7a8a6a", minWidth: "100px" }}>{k}</span>
                <span style={{ fontFamily: SERIF, fontSize: "0.85rem", color: "#374151" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem", color: "#7a8a6a", minWidth: "100px" }}>Status</span>
              <Badge label={selected.status} color={statusColor[selected.status]} />
            </div>
          </div>
          <div style={{ display: "flex", justify: "flex-end", gap: "8px" } as React.CSSProperties}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
            <Btn variant="secondary" onClick={() => { setForm({ numero: selected.numero, andar: selected.andar, categoria: selected.categoria, capacidade: String(selected.capacidade), status: selected.status, tarifa: selected.tarifa, obs: selected.obs }); setModal("edit"); }}>Editar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
