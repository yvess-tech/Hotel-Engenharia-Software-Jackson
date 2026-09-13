import { useState } from "react";
import { PageHeader, Card, Btn, Input, Select, Table, Modal, Badge, SectionTitle } from "../ui";

type Tab = "eventos" | "salas" | "servicos";

const eventos = [
  { id: 1, nome: "Conferência Tech 2026", sala: "Sala A", inicio: "2026-09-20 09:00", fim: "2026-09-20 18:00", status: "Confirmado", valor: "R$ 8.500,00" },
  { id: 2, nome: "Casamento Silva & Costa", sala: "Salão Principal", inicio: "2026-10-05 16:00", fim: "2026-10-06 02:00", status: "Aguardando", valor: "R$ 22.000,00" },
];

const salas = [
  { id: 1, nome: "Sala A", capacidade: 50, status: "Disponível" },
  { id: 2, nome: "Sala B", capacidade: 30, status: "Reservada" },
  { id: 3, nome: "Salão Principal", capacidade: 200, status: "Disponível" },
];

const servicos = [
  { id: 1, nome: "Coffee Break", descricao: "Café, sucos e salgadinhos", valor: "R$ 45,00/pax", status: "Ativo" },
  { id: 2, nome: "Projetor", descricao: "Projetor Full HD + tela", valor: "R$ 300,00/dia", status: "Ativo" },
  { id: 3, nome: "Decoração", descricao: "Decoração personalizada", valor: "Sob consulta", status: "Ativo" },
];

export default function Eventos() {
  const [tab, setTab] = useState<Tab>("eventos");
  const [modal, setModal] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "eventos", label: "Eventos" },
    { id: "salas", label: "Salas" },
    { id: "servicos", label: "Serviços" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Eventos & Conferências (RF89–RF100)"
        actions={<Btn onClick={() => setModal(true)}>+ Novo Evento</Btn>}
      />

      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm"
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

      {tab === "eventos" && (
        <Card>
          <Table
            headers={["Nome", "Sala", "Início", "Fim", "Valor", "Status", "Ações"]}
            rows={eventos.map((e) => [
              e.nome,
              e.sala,
              e.inicio,
              e.fim,
              e.valor,
              <Badge label={e.status} color={e.status === "Confirmado" ? "green" : "yellow"} />,
              <div className="flex gap-1">
                <Btn small variant="ghost">Editar</Btn>
                <Btn small variant="danger">Cancelar</Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "salas" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <SectionTitle>Salas de Conferência (RF93–RF96)</SectionTitle>
            <Btn small>+ Nova Sala</Btn>
          </div>
          <Table
            headers={["Nome", "Capacidade", "Status", "Ações"]}
            rows={salas.map((s) => [
              s.nome,
              `${s.capacidade} pessoas`,
              <Badge label={s.status} color={s.status === "Disponível" ? "green" : "yellow"} />,
              <div className="flex gap-1">
                <Btn small variant="ghost">Editar</Btn>
                <Btn small variant="secondary">Inativar</Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "servicos" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <SectionTitle>Serviços de Evento (RF97–RF100)</SectionTitle>
            <Btn small>+ Novo Serviço</Btn>
          </div>
          <Table
            headers={["Serviço", "Descrição", "Valor", "Status", "Ações"]}
            rows={servicos.map((s) => [
              s.nome,
              s.descricao,
              s.valor,
              <Badge label={s.status} color="green" />,
              <div className="flex gap-1">
                <Btn small variant="ghost">Editar</Btn>
                <Btn small variant="secondary">Inativar</Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {modal && (
        <Modal title="Novo Evento" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Input label="Nome do evento *" />
            <Select label="Sala *">
              {salas.map((s) => <option key={s.id}>{s.nome}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data/hora início *" type="datetime-local" />
              <Input label="Data/hora fim *" type="datetime-local" />
            </div>
            <Input label="Responsável" />
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
