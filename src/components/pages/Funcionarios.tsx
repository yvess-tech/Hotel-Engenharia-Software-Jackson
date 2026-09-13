import { useState } from "react";
import { PageHeader, Card, Btn, Input, Select, Table, Modal, Badge, SectionTitle } from "../ui";

type Tab = "funcionarios" | "cargos" | "turnos" | "ponto";

const funcionarios = [
  { id: 1, nome: "Carlos Mendes", cargo: "Recepcionista", turno: "Manhã", ponto: "08:05", status: "Ativo" },
  { id: 2, nome: "Lúcia Santos", cargo: "Camareira", turno: "Manhã", ponto: "07:58", status: "Ativo" },
  { id: 3, nome: "Roberto Alves", cargo: "Garçom", turno: "Tarde", ponto: "13:02", status: "Ativo" },
  { id: 4, nome: "Fernanda Lima", cargo: "Financeiro", turno: "Comercial", ponto: "09:00", status: "Inativo" },
];

const cargos = [
  { nome: "Recepcionista", descricao: "Atendimento ao cliente", status: "Ativo" },
  { nome: "Camareira", descricao: "Governança e limpeza", status: "Ativo" },
  { nome: "Garçom", descricao: "Restaurante e room service", status: "Ativo" },
  { nome: "Financeiro", descricao: "Setor financeiro", status: "Ativo" },
];

export default function Funcionarios() {
  const [tab, setTab] = useState<Tab>("funcionarios");
  const [modal, setModal] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "funcionarios", label: "Funcionários" },
    { id: "cargos", label: "Cargos" },
    { id: "turnos", label: "Turnos" },
    { id: "ponto", label: "Ponto" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Funcionários (RF60–RF78)"
        actions={<Btn onClick={() => setModal(true)}>+ Cadastrar</Btn>}
      />

      <div className="flex gap-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{
              fontFamily: '"Inria Serif:Regular", serif',
              background: tab === t.id ? "#3e5525" : "#fff",
              color: tab === t.id ? "#fff" : "#3e5525",
              border: "1px solid #3e5525",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "funcionarios" && (
        <Card>
          <Table
            headers={["Nome", "Cargo", "Turno", "Entrada hoje", "Status", "Ações"]}
            rows={funcionarios.map((f) => [
              f.nome,
              f.cargo,
              f.turno,
              f.ponto,
              <Badge label={f.status} color={f.status === "Ativo" ? "green" : "gray"} />,
              <div className="flex gap-1">
                <Btn small variant="ghost">Editar</Btn>
                <Btn small variant="secondary">Histórico</Btn>
                <Btn small variant="ghost">Inativar</Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "cargos" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <SectionTitle>Cargos (RF64–RF67)</SectionTitle>
            <Btn small>+ Novo Cargo</Btn>
          </div>
          <Table
            headers={["Cargo", "Descrição", "Status", "Ações"]}
            rows={cargos.map((c) => [
              c.nome,
              c.descricao,
              <Badge label={c.status} color="green" />,
              <div className="flex gap-1">
                <Btn small variant="ghost">Editar</Btn>
                <Btn small variant="secondary">Inativar</Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "turnos" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <SectionTitle>Turnos (RF68–RF71)</SectionTitle>
            <Btn small>+ Novo Turno</Btn>
          </div>
          <Table
            headers={["Turno", "Início", "Fim", "Status"]}
            rows={[
              ["Manhã", "06:00", "14:00", <Badge label="Ativo" color="green" />],
              ["Tarde", "14:00", "22:00", <Badge label="Ativo" color="green" />],
              ["Noite", "22:00", "06:00", <Badge label="Ativo" color="green" />],
              ["Comercial", "08:00", "17:00", <Badge label="Ativo" color="green" />],
            ]}
          />
        </Card>
      )}

      {tab === "ponto" && (
        <Card>
          <SectionTitle>Registro de Ponto (RF72–RF73)</SectionTitle>
          <div className="flex gap-3 mb-4 flex-wrap">
            <Input label="Data" type="date" defaultValue="2026-09-13" />
            <Select label="Funcionário">
              <option value="">Todos</option>
              {funcionarios.map((f) => <option key={f.id}>{f.nome}</option>)}
            </Select>
            <div className="flex items-end">
              <Btn>Consultar</Btn>
            </div>
          </div>
          <Table
            headers={["Funcionário", "Data", "Entrada", "Saída", "Horas trabalhadas"]}
            rows={[
              ["Carlos Mendes", "13/09/2026", "08:05", "—", "em andamento"],
              ["Lúcia Santos", "13/09/2026", "07:58", "14:02", "6h04"],
              ["Roberto Alves", "13/09/2026", "13:02", "—", "em andamento"],
              ["Carlos Mendes", "12/09/2026", "08:00", "14:00", "6h00"],
            ]}
          />
        </Card>
      )}

      {modal && (
        <Modal title="Cadastrar Funcionário" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <SectionTitle>Identificação</SectionTitle>
            <Input label="Nome completo *" />
            <Input label="CPF *" placeholder="000.000.000-00" />
            <Select label="Cargo *">
              {cargos.map((c) => <option key={c.nome}>{c.nome}</option>)}
            </Select>
            <Select label="Turno *">
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
              <option>Comercial</option>
            </Select>
            <SectionTitle>Contato</SectionTitle>
            <Input label="E-mail" type="email" />
            <Input label="Telefone" placeholder="(00) 00000-0000" />
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn onClick={() => setModal(false)}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
