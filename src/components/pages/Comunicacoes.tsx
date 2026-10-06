import { useState } from "react";
import { PageHeader, Card, Btn, Input, Select, Table, Modal, Badge, KpiCard } from "../ui";

const comunicacoes = [
  { id: 1, tipo: "Confirmação de reserva", destinatario: "Ana Souza", canal: "E-mail", status: "Enviado", data: "13/09/2026 10:00" },
  { id: 2, tipo: "Lembrete check-in", destinatario: "Maria Costa", canal: "SMS", status: "Pendente", data: "13/09/2026 18:00" },
  { id: 3, tipo: "Pós-estadia", destinatario: "João Silva", canal: "E-mail", status: "Enviado", data: "12/09/2026 11:30" },
  { id: 4, tipo: "Oferta especial", destinatario: "Pedro Lima", canal: "WhatsApp", status: "Falha", data: "11/09/2026 09:00" },
];

const statusColor: Record<string, "green" | "yellow" | "red" | "gray"> = {
  Enviado: "green",
  Pendente: "yellow",
  Falha: "red",
  Cancelado: "gray",
};

export default function Comunicacoes() {
  const [modal, setModal] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Comunicações"
        actions={<Btn onClick={() => setModal(true)}>+ Nova Comunicação</Btn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enviadas hoje", value: "12", icon: "badge-check" as const },
          { label: "Pendentes", value: "3", icon: "circle-pause" as const },
          { label: "Com falha", value: "1", icon: "octagon-alert" as const, tone: "danger" as const },
          { label: "Total este mês", value: "248", icon: "arrow-left-right" as const },
        ].map((s) => (
          <KpiCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
        ))}
      </div>

      <Card>
        <Table
          headers={["Tipo", "Destinatário", "Canal", "Data/Hora", "Status"]}
          rows={comunicacoes.map((c) => [
            c.tipo,
            c.destinatario,
            c.canal,
            c.data,
            <Badge label={c.status} color={statusColor[c.status]} />,
          ])}
        />
      </Card>

      {modal && (
        <Modal title="Nova Comunicação" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Select label="Tipo *">
              <option>Confirmação de reserva</option>
              <option>Lembrete check-in</option>
              <option>Pós-estadia</option>
              <option>Pesquisa de satisfação</option>
              <option>Oferta especial</option>
            </Select>
            <Input label="Destinatário *" />
            <Select label="Canal *">
              <option>E-mail</option>
              <option>SMS</option>
              <option>WhatsApp</option>
            </Select>
            <Input label="Data/hora de envio" type="datetime-local" />
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn onClick={() => setModal(false)}>Registrar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
