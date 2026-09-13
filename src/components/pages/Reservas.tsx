import { useState } from "react"
import {
  PageHeader,
  Card,
  Btn,
  Input,
  Select,
  Table,
  Modal,
  Badge,
  Tabs,
  FormGrid,
  FullCol,
  FormActions,
} from "../ui"

type Status = "Aguardando" | "Confirmada" | "Check-in" | "Check-out" | "Cancelada"

const initialData = [
  {
    id: 1,
    hospede: "Ana Souza",
    quarto: "101 — Standard",
    checkin: "2026-09-13",
    checkout: "2026-09-16",
    adultos: 2,
    status: "Confirmada" as Status,
    valor: "R$ 1.200,00",
  },
  {
    id: 2,
    hospede: "Pedro Lima",
    quarto: "205 — Luxo",
    checkin: "2026-09-13",
    checkout: "2026-09-14",
    adultos: 1,
    status: "Check-in" as Status,
    valor: "R$ 450,00",
  },
  {
    id: 3,
    hospede: "Maria Costa",
    quarto: "312 — Suíte",
    checkin: "2026-09-14",
    checkout: "2026-09-18",
    adultos: 2,
    status: "Aguardando" as Status,
    valor: "R$ 3.200,00",
  },
]

const statusColor: Record<Status, "green" | "blue" | "yellow" | "red" | "gray"> =
  {
    Confirmada: "blue",
    "Check-in": "green",
    Aguardando: "yellow",
    Cancelada: "red",
    "Check-out": "gray",
  }

type Tab = "todos" | "ativas" | "canceladas"

export default function Reservas() {
  const [data, setData] = useState(initialData)
  const [tab, setTab] = useState<Tab>("todos")
  const [modal, setModal] = useState<"new" | "edit" | "view" | null>(null)
  const [selected, setSelected] = useState<typeof initialData[0] | null>(null)
  const [form, setForm] = useState({
    hospede: "",
    quarto: "101 — Standard",
    checkin: "",
    checkout: "",
    adultos: "1",
    status: "Aguardando",
  })

  const filtered = data.filter((r) => {
    if (tab === "ativas")
      return r.status !== "Cancelada" && r.status !== "Check-out"
    if (tab === "canceladas") return r.status === "Cancelada"
    return true
  })

  const save = () => {
    if (modal === "new") {
      setData([
        ...data,
        {
          id: Date.now(),
          ...form,
          adultos: Number(form.adultos),
          status: form.status as Status,
          valor: "R$ —",
        },
      ])
    } else if (modal === "edit" && selected) {
      setData(
        data.map((r) =>
          r.id === selected.id
            ? {
                ...r,
                ...form,
                adultos: Number(form.adultos),
                status: form.status as Status,
              }
            : r,
        ),
      )
    }
    setModal(null)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Reservas — RF08 a RF15"
        actions={
          <Btn
            onClick={() => {
              setForm({
                hospede: "",
                quarto: "101 — Standard",
                checkin: "",
                checkout: "",
                adultos: "1",
                status: "Aguardando",
              })
              setModal("new")
            }}
          >
            + Nova Reserva
          </Btn>
        }
      />

      <Tabs
        tabs={[
          { id: "todos", label: "Todas" },
          { id: "ativas", label: "Ativas" },
          { id: "canceladas", label: "Canceladas" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card>
        <Table
          headers={[
            "Hóspede",
            "Quarto",
            "Check-in",
            "Check-out",
            "Hóspedes",
            "Valor",
            "Status",
            "Ações",
          ]}
          rows={filtered.map((r) => [
            r.hospede,
            r.quarto,
            r.checkin,
            r.checkout,
            r.adultos,
            r.valor,
            <Badge label={r.status} color={statusColor[r.status]} />,
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <Btn
                small
                variant="ghost"
                onClick={() => {
                  setSelected(r)
                  setModal("view")
                }}
              >
                Ver
              </Btn>
              <Btn
                small
                variant="secondary"
                onClick={() => {
                  setSelected(r)
                  setForm({
                    hospede: r.hospede,
                    quarto: r.quarto,
                    checkin: r.checkin,
                    checkout: r.checkout,
                    adultos: String(r.adultos),
                    status: r.status,
                  })
                  setModal("edit")
                }}
              >
                Editar
              </Btn>
              {r.status !== "Cancelada" && (
                <Btn
                  small
                  variant="danger"
                  onClick={() =>
                    setData(
                      data.map((d) =>
                        d.id === r.id
                          ? { ...d, status: "Cancelada" as Status }
                          : d,
                      ),
                    )
                  }
                >
                  Cancelar
                </Btn>
              )}
            </div>,
          ])}
        />
      </Card>

      {(modal === "new" || modal === "edit") && (
        <Modal
          title={modal === "new" ? "Nova Reserva" : "Editar Reserva"}
          onClose={() => setModal(null)}
        >
          <FormGrid cols={2}>
            <FullCol>
              <Input
                label="Hóspede *"
                value={form.hospede}
                onChange={(e) => setForm({ ...form, hospede: e.target.value })}
              />
            </FullCol>
            <Select
              label="Quarto *"
              value={form.quarto}
              onChange={(e) => setForm({ ...form, quarto: e.target.value })}
            >
              <option>101 — Standard</option>
              <option>205 — Luxo</option>
              <option>312 — Suíte</option>
              <option>407 — Standard</option>
            </Select>
            <Input
              label="Nº de hóspedes"
              type="number"
              min="1"
              value={form.adultos}
              onChange={(e) => setForm({ ...form, adultos: e.target.value })}
            />
            <Input
              label="Check-in *"
              type="date"
              value={form.checkin}
              onChange={(e) => setForm({ ...form, checkin: e.target.value })}
            />
            <Input
              label="Check-out *"
              type="date"
              value={form.checkout}
              onChange={(e) => setForm({ ...form, checkout: e.target.value })}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Aguardando</option>
              <option>Confirmada</option>
              <option>Cancelada</option>
            </Select>
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>
                Cancelar
              </Btn>
              <Btn onClick={save}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {modal === "view" && selected && (
        <Modal title="Detalhes da Reserva" onClose={() => setModal(null)}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {[
              ["Hóspede", selected.hospede],
              ["Quarto", selected.quarto],
              ["Check-in", selected.checkin],
              ["Check-out", selected.checkout],
              ["Hóspedes", String(selected.adultos)],
              ["Valor", selected.valor],
              ["Status", selected.status],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  gap: "8px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #f0f2ee",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inria Serif',Georgia,serif",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "#7a8a6a",
                    minWidth: "100px",
                  }}
                >
                  {k}
                </span>
                <span
                  style={{
                    fontFamily: "'Inria Serif',Georgia,serif",
                    fontSize: "0.85rem",
                    color: "#374151",
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "16px",
            }}
          >
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Fechar
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
