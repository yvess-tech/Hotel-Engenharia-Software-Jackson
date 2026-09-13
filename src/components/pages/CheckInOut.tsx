import { useState } from "react";
import { PageHeader, Card, Btn, Input, Table, Modal, Badge, SectionTitle } from "../ui";

const pendingCheckins = [
  { id: 1, hospede: "Maria Costa", quarto: "312 - Suíte", checkin: "2026-09-14", checkout: "2026-09-18", reserva: "#1003" },
];

const pendingCheckouts = [
  { id: 2, hospede: "Pedro Lima", quarto: "205 - Luxo", checkin: "2026-09-13", checkout: "2026-09-14", reserva: "#1002", saldo: "R$ 450,00" },
];

const hospedagens = [
  { id: 1, hospede: "Pedro Lima", quarto: "205", tipo: "Check-in", data: "13/09/2026 14:30", status: "Ativo" },
  { id: 2, hospede: "João Silva", quarto: "407", tipo: "Check-out", data: "13/09/2026 11:00", status: "Finalizado" },
];

export default function CheckInOut() {
  const [modal, setModal] = useState<"checkin" | "checkout" | "fatura" | null>(null);
  const [selected, setSelected] = useState<typeof pendingCheckins[0] | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader title="Check-in / Check-out (RF24–RF31)" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending check-ins */}
        <Card>
          <SectionTitle>Check-ins Pendentes</SectionTitle>
          <div className="space-y-3">
            {pendingCheckins.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div>
                  <p className="font-medium text-sm" style={{ fontFamily: '"Inria Serif:Bold", serif', color: "#374151" }}>{c.hospede}</p>
                  <p className="text-xs" style={{ color: "#666", fontFamily: '"Inria Serif:Regular", serif' }}>{c.quarto} · {c.reserva}</p>
                  <p className="text-xs mt-1" style={{ color: "#16a34a" }}>Entrada: {c.checkin}</p>
                </div>
                <Btn small onClick={() => { setSelected(c); setModal("checkin"); }}>Realizar Check-in</Btn>
              </div>
            ))}
            {pendingCheckins.length === 0 && <p className="text-sm text-gray-500">Nenhum check-in pendente.</p>}
          </div>
        </Card>

        {/* Pending check-outs */}
        <Card>
          <SectionTitle>Check-outs Pendentes</SectionTitle>
          <div className="space-y-3">
            {pendingCheckouts.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <div>
                  <p className="font-medium text-sm" style={{ fontFamily: '"Inria Serif:Bold", serif', color: "#374151" }}>{c.hospede}</p>
                  <p className="text-xs" style={{ color: "#666", fontFamily: '"Inria Serif:Regular", serif' }}>{c.quarto} · {c.reserva}</p>
                  <p className="text-xs mt-1" style={{ color: "#d97706" }}>Saída: {c.checkout} · Saldo: {c.saldo}</p>
                </div>
                <div className="flex gap-1 flex-col">
                  <Btn small variant="secondary" onClick={() => { setSelected(c as typeof selected); setModal("fatura"); }}>Ver Fatura</Btn>
                  <Btn small onClick={() => setModal("checkout")}>Check-out</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hospedagens table */}
      <Card>
        <SectionTitle>Hospedagens (RF24–RF27)</SectionTitle>
        <Table
          headers={["Hóspede", "Quarto", "Tipo", "Data/Hora", "Status"]}
          rows={hospedagens.map((h) => [
            h.hospede,
            h.quarto,
            h.tipo,
            h.data,
            <Badge label={h.status} color={h.status === "Ativo" ? "green" : "gray"} />,
          ])}
        />
      </Card>

      {/* Check-in modal */}
      {modal === "checkin" && selected && (
        <Modal title="Realizar Check-in" onClose={() => setModal(null)}>
          <SectionTitle>Ficha de Hospedagem</SectionTitle>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: "#f9fafb" }}>
              <p className="text-sm" style={{ fontFamily: '"Inria Serif:Regular", serif' }}><strong>Hóspede:</strong> {selected.hospede}</p>
              <p className="text-sm" style={{ fontFamily: '"Inria Serif:Regular", serif' }}><strong>Quarto:</strong> {selected.quarto}</p>
              <p className="text-sm" style={{ fontFamily: '"Inria Serif:Regular", serif' }}><strong>Período:</strong> {selected.checkin} → {selected.checkout}</p>
            </div>
            <Input label="Documento verificado" placeholder="Número do documento" />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="assDigital" className="rounded" />
              <label htmlFor="assDigital" className="text-sm" style={{ fontFamily: '"Inria Serif:Regular", serif' }}>Assinatura digital coletada</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="chave" className="rounded" />
              <label htmlFor="chave" className="text-sm" style={{ fontFamily: '"Inria Serif:Regular", serif' }}>Chave/cartão liberado</label>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={() => setModal(null)}>Confirmar Check-in</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Fatura modal */}
      {modal === "fatura" && (
        <Modal title="Fatura da Hospedagem" onClose={() => setModal(null)}>
          <Table
            headers={["Descrição", "Qtd", "Valor Unit.", "Total"]}
            rows={[
              ["Diária — 205 Luxo", "1", "R$ 450,00", "R$ 450,00"],
              ["Frigobar", "3", "R$ 25,00", "R$ 75,00"],
              ["Room service", "1", "R$ 85,00", "R$ 85,00"],
            ]}
          />
          <div className="mt-3 text-right text-sm font-bold" style={{ fontFamily: '"Inria Serif:Bold", serif', color: "#3e5525" }}>
            Total: R$ 610,00
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
            <Btn variant="secondary">Imprimir</Btn>
          </div>
        </Modal>
      )}

      {modal === "checkout" && (
        <Modal title="Confirmar Check-out" onClose={() => setModal(null)}>
          <p className="text-sm mb-4" style={{ fontFamily: '"Inria Serif:Regular", serif' }}>
            Confirme o pagamento da fatura antes de concluir o check-out.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="pgto" className="rounded" />
            <label htmlFor="pgto" className="text-sm" style={{ fontFamily: '"Inria Serif:Regular", serif' }}>Pagamento confirmado</label>
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={() => setModal(null)}>Concluir Check-out</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
