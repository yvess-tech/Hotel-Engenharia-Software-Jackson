import { useState } from "react"
import {
  PageHeader,
  Card,
  Btn,
  Select,
  Table,
  Modal,
  Badge,
  Input,
  SectionTitle,
} from "../ui"

type Tab = "limpeza" | "manutencao"

const tarefasLimpeza = [
  {
    id: 1,
    quarto: "101",
    responsavel: "Lúcia Santos",
    status: "Pendente",
    agendado: "13/09/2026 08:00",
  },
  {
    id: 2,
    quarto: "205",
    responsavel: "Lúcia Santos",
    status: "Concluída",
    agendado: "13/09/2026 07:00",
    concluido: "13/09/2026 07:45",
  },
  {
    id: 3,
    quarto: "312",
    responsavel: "Ana Ribeiro",
    status: "Em andamento",
    agendado: "13/09/2026 09:00",
  },
]

const manutencoes = [
  {
    id: 1,
    quarto: "204",
    tipo: "Preventiva",
    descricao: "Troca de encanamento",
    responsavel: "Miguel Costa",
    status: "Em andamento",
    abertura: "11/09/2026",
  },
  {
    id: 2,
    quarto: "108",
    tipo: "Corretiva",
    descricao: "Reparo no ar-condicionado",
    responsavel: "Miguel Costa",
    status: "Pendente",
    abertura: "13/09/2026",
  },
]

const statusColorL: Record<string, "green" | "yellow" | "blue" | "gray"> = {
  Pendente: "yellow",
  "Em andamento": "blue",
  Concluída: "green",
  Cancelada: "gray",
}

export default function LimpezaManutencao() {
  const [tab, setTab] = useState<Tab>("limpeza")
  const [modal, setModal] = useState<"limpeza" | "manutencao" | null>(null)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Limpeza & Manutenção (RF79–RF88)"
        actions={
          <Btn
            onClick={() =>
              setModal(tab === "limpeza" ? "limpeza" : "manutencao")
            }
          >
            + Nova {tab === "limpeza" ? "Tarefa" : "Manutenção"}
          </Btn>
        }
      />

      <div className="flex gap-1">
        {(["limpeza", "manutencao"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{
              fontFamily: '"Inria Serif:Regular", serif',
              background: tab === t ? "#3e5525" : "#fff",
              color: tab === t ? "#fff" : "#3e5525",
              border: "1px solid #3e5525",
            }}
          >
            {t === "limpeza" ? "Limpeza" : "Manutenção"}
          </button>
        ))}
      </div>

      {tab === "limpeza" && (
        <>
          {/* Painel visual */}
          <Card>
            <SectionTitle>Painel de Tarefas de Limpeza</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tarefasLimpeza.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg p-3 text-center"
                  style={{
                    background:
                      t.status === "Concluída"
                        ? "#dcfce7"
                        : t.status === "Em andamento"
                          ? "#dbeafe"
                          : "#fef9c3",
                  }}
                >
                  <p
                    className="font-bold text-lg"
                    style={{ fontFamily: '"Inria Serif:Bold", serif' }}
                  >
                    Qto {t.quarto}
                  </p>
                  <Badge label={t.status} color={statusColorL[t.status]} />
                  <p className="text-xs mt-1" style={{ color: "#666" }}>
                    {t.responsavel}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Table
              headers={[
                "Quarto",
                "Responsável",
                "Agendado",
                "Concluído",
                "Status",
                "Ações",
              ]}
              rows={tarefasLimpeza.map((t) => [
                t.quarto,
                t.responsavel,
                t.agendado,
                (t as typeof t & { concluido?: string }).concluido ?? "—",
                <Badge label={t.status} color={statusColorL[t.status]} />,
                <div className="flex gap-1">
                  <Btn small variant="ghost">
                    Editar
                  </Btn>
                  <Btn small variant="secondary">
                    Registrar
                  </Btn>
                  <Btn small variant="danger">
                    Cancelar
                  </Btn>
                </div>,
              ])}
            />
          </Card>
        </>
      )}

      {tab === "manutencao" && (
        <Card>
          <Table
            headers={[
              "Quarto",
              "Tipo",
              "Descrição",
              "Responsável",
              "Abertura",
              "Status",
              "Ações",
            ]}
            rows={manutencoes.map((m) => [
              m.quarto,
              m.tipo,
              m.descricao,
              m.responsavel,
              m.abertura,
              <Badge label={m.status} color={statusColorL[m.status]} />,
              <div className="flex gap-1">
                <Btn small variant="ghost">
                  Editar
                </Btn>
                <Btn small variant="secondary">
                  Registrar
                </Btn>
                <Btn small variant="danger">
                  Cancelar
                </Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {modal === "limpeza" && (
        <Modal title="Nova Tarefa de Limpeza" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Input label="Quarto *" />
            <Select label="Responsável">
              <option>Lúcia Santos</option>
              <option>Ana Ribeiro</option>
            </Select>
            <Input label="Agendamento *" type="datetime-local" />
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(null)}>
                Cancelar
              </Btn>
              <Btn onClick={() => setModal(null)}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {modal === "manutencao" && (
        <Modal title="Registrar Manutenção" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Input label="Quarto *" />
            <Select label="Tipo">
              <option>Preventiva</option>
              <option>Corretiva</option>
            </Select>
            <Input label="Descrição *" />
            <Select label="Responsável">
              <option>Miguel Costa</option>
            </Select>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(null)}>
                Cancelar
              </Btn>
              <Btn onClick={() => setModal(null)}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
