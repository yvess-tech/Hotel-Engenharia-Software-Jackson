import { useState } from "react"
import {
  PageHeader,
  Card,
  Btn,
  Input,
  Table,
  Modal,
  Badge,
  SectionTitle,
} from "../ui"

type Tab = "dadosfiscais" | "notasfiscais" | "recibos"
interface TabItem {
  id: Tab
  label: string
}

const notasFiscais = [
  {
    id: 1,
    numero: "NFS-001",
    destinatario: "Ana Souza",
    valor: "R$ 1.200,00",
    data: "13/09/2026",
    status: "Emitida",
  },
  {
    id: 2,
    numero: "NFS-002",
    destinatario: "Pedro Lima",
    valor: "R$ 450,00",
    data: "13/09/2026",
    status: "Emitida",
  },
  {
    id: 3,
    numero: "NFS-003",
    destinatario: "Empresa ABC",
    valor: "R$ 8.500,00",
    data: "11/09/2026",
    status: "Cancelada",
  },
]

const recibos = [
  {
    id: 1,
    numero: "REC-001",
    destinatario: "João Silva",
    valor: "R$ 380,00",
    data: "12/09/2026",
    status: "Emitido",
  },
  {
    id: 2,
    numero: "REC-002",
    destinatario: "Maria Costa",
    valor: "R$ 250,00",
    data: "11/09/2026",
    status: "Emitido",
  },
]

const statusColor: Record<string, "green" | "red" | "yellow"> = {
  Emitida: "green",
  Emitido: "green",
  Cancelada: "red",
  Cancelado: "red",
  Pendente: "yellow",
}

export default function Fiscal() {
  const [tab, setTab] = useState<Tab>("dadosfiscais")
  const [modal, setModal] = useState<"nf" | "recibo" | null>(null)

  const tabs: TabItem[] = [
    { id: "dadosfiscais", label: "Dados Fiscais" },
    { id: "notasfiscais", label: "Notas Fiscais" },
    { id: "recibos", label: "Recibos" },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Fiscal (RF104–RF114)" />

      <div className="flex gap-1 flex-wrap">
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

      {tab === "dadosfiscais" && (
        <Card>
          <SectionTitle>Dados Fiscais do Hotel (RF104–RF106)</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Razão Social"
              defaultValue="Hotel Pacaas Novos LTDA"
            />
            <Input label="CNPJ" defaultValue="12.345.678/0001-90" />
            <Input label="Inscrição Municipal" defaultValue="987654" />
            <Input label="Regime Tributário" defaultValue="Simples Nacional" />
            <div className="col-span-2">
              <Input
                label="Endereço"
                defaultValue="Av. das Palmeiras, 1000 — Porto Velho/RO"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Btn>Salvar</Btn>
          </div>
        </Card>
      )}

      {tab === "notasfiscais" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <SectionTitle>Notas Fiscais de Serviço (RF107–RF110)</SectionTitle>
            <Btn small onClick={() => setModal("nf")}>
              + Emitir NFS
            </Btn>
          </div>
          <Table
            headers={[
              "Número",
              "Destinatário",
              "Valor",
              "Data",
              "Status",
              "Ações",
            ]}
            rows={notasFiscais.map((n) => [
              n.numero,
              n.destinatario,
              n.valor,
              n.data,
              <Badge label={n.status} color={statusColor[n.status]} />,
              <div className="flex gap-1">
                <Btn small variant="ghost">
                  Consultar
                </Btn>
                {n.status !== "Cancelada" && (
                  <>
                    <Btn small variant="secondary">
                      Reemitir
                    </Btn>
                    <Btn small variant="danger">
                      Cancelar
                    </Btn>
                  </>
                )}
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "recibos" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <SectionTitle>Recibos (RF111–RF114)</SectionTitle>
            <Btn small onClick={() => setModal("recibo")}>
              + Emitir Recibo
            </Btn>
          </div>
          <Table
            headers={[
              "Número",
              "Destinatário",
              "Valor",
              "Data",
              "Status",
              "Ações",
            ]}
            rows={recibos.map((r) => [
              r.numero,
              r.destinatario,
              r.valor,
              r.data,
              <Badge label={r.status} color={statusColor[r.status]} />,
              <div className="flex gap-1">
                <Btn small variant="ghost">
                  Consultar
                </Btn>
                <Btn small variant="secondary">
                  Reemitir
                </Btn>
                <Btn small variant="danger">
                  Cancelar
                </Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {modal && (
        <Modal
          title={modal === "nf" ? "Emitir Nota Fiscal" : "Emitir Recibo"}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <Input label="Destinatário *" />
            <Input label="Valor *" placeholder="R$ 0,00" />
            <Input label="Descrição do serviço *" />
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(null)}>
                Cancelar
              </Btn>
              <Btn onClick={() => setModal(null)}>Emitir</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
