import { useState } from "react";
import { PageHeader, Card, Btn, Input, Select, Table, Modal, Badge, SectionTitle, FormGrid, FullCol, FormActions } from "../ui";

const initialData = [
  { id: 1, nome: "Ana Souza",   cpf: "123.456.789-00", email: "ana@email.com",   tel: "(69) 99999-0001", nacionalidade: "Brasileira", status: "Ativo" },
  { id: 2, nome: "Pedro Lima",  cpf: "987.654.321-00", email: "pedro@email.com", tel: "(69) 98888-0002", nacionalidade: "Brasileira", status: "Ativo" },
  { id: 3, nome: "Maria Costa", cpf: "456.789.123-00", email: "maria@email.com", tel: "(69) 97777-0003", nacionalidade: "Portuguesa", status: "Ativo" },
];

type Hospede = typeof initialData[0];
type ModalType = "new" | "edit" | "view" | "hist" | null;

export default function Hospedes() {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Hospede | null>(null);
  const [form, setForm] = useState({ nome: "", cpf: "", email: "", tel: "", nacionalidade: "Brasileira" });

  const filtered = data.filter(
    (h) =>
      h.nome.toLowerCase().includes(search.toLowerCase()) ||
      h.cpf.includes(search) ||
      h.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm({ nome: "", cpf: "", email: "", tel: "", nacionalidade: "Brasileira" });
    setModal("new");
  };

  const openEdit = (h: Hospede) => {
    setSelected(h);
    setForm({ nome: h.nome, cpf: h.cpf, email: h.email, tel: h.tel, nacionalidade: h.nacionalidade });
    setModal("edit");
  };

  const save = () => {
    if (modal === "new") {
      setData([...data, { id: Date.now(), ...form, status: "Ativo" }]);
    } else if (modal === "edit" && selected) {
      setData(data.map((h) => (h.id === selected.id ? { ...h, ...form } : h)));
    }
    setModal(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Cadastro de Hóspedes — RF01 a RF07"
        actions={<Btn onClick={openNew}>+ Cadastrar Hóspede</Btn>}
      />

      <Card>
        <div style={{ marginBottom: "16px", maxWidth: "340px" }}>
          <Input
            label="Buscar"
            placeholder="Nome, CPF ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table
          headers={["Nome", "CPF", "E-mail", "Telefone", "Nacionalidade", "Status", "Ações"]}
          rows={filtered.map((h) => [
            h.nome,
            h.cpf,
            h.email,
            h.tel,
            h.nacionalidade,
            <Badge label={h.status} color="green" />,
            <div style={{ display: "flex", gap: "6px" }}>
              <Btn small variant="ghost" onClick={() => { setSelected(h); setModal("view"); }}>Ver</Btn>
              <Btn small variant="secondary" onClick={() => openEdit(h)}>Editar</Btn>
              <Btn small variant="ghost" onClick={() => { setSelected(h); setModal("hist"); }}>Histórico</Btn>
            </div>,
          ])}
        />
      </Card>

      {/* Cadastro / Edição */}
      {(modal === "new" || modal === "edit") && (
        <Modal title={modal === "new" ? "Cadastrar Hóspede" : "Editar Hóspede"} onClose={() => setModal(null)}>
          <FormGrid cols={2}>
            <FullCol>
              <Input label="Nome completo *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </FullCol>
            <Input label="CPF *" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            <Select label="Nacionalidade" value={form.nacionalidade} onChange={(e) => setForm({ ...form, nacionalidade: e.target.value })}>
              <option>Brasileira</option>
              <option>Portuguesa</option>
              <option>Argentina</option>
              <option>Boliviana</option>
              <option>Outra</option>
            </Select>
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Telefone" placeholder="(00) 00000-0000" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} />
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {/* Visualização */}
      {modal === "view" && selected && (
        <Modal title="Detalhes do Hóspede" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              ["Nome", selected.nome],
              ["CPF", selected.cpf],
              ["E-mail", selected.email],
              ["Telefone", selected.tel],
              ["Nacionalidade", selected.nacionalidade],
              ["Status", selected.status],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: "8px", paddingBottom: "8px", borderBottom: "1px solid #f0f2ee" }}>
                <span style={{ fontFamily: "'Inria Serif', Georgia, serif", fontWeight: 700, fontSize: "0.82rem", color: "#7a8a6a", minWidth: "110px" }}>{k}</span>
                <span style={{ fontFamily: "'Inria Serif', Georgia, serif", fontSize: "0.85rem", color: "#374151" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
          </div>
        </Modal>
      )}

      {/* Histórico */}
      {modal === "hist" && selected && (
        <Modal title={`Histórico de Hospedagens — ${selected.nome}`} onClose={() => setModal(null)}>
          <SectionTitle>Estadias anteriores</SectionTitle>
          <Table
            headers={["Período", "Quarto", "Valor pago"]}
            rows={[
              ["01/06 – 05/06/2026", "205 — Luxo",    "R$ 1.200,00"],
              ["15/03 – 17/03/2026", "101 — Standard", "R$ 580,00"],
            ]}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
