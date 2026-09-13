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
  SectionTitle,
} from "../ui"

const initialEstoque = [
  {
    id: 1,
    nome: "Sabonete",
    categoria: "Amenities",
    unidade: "un",
    quantidade: 12,
    minimo: 50,
    status: "Critico",
  },
  {
    id: 2,
    nome: "Toalha de banho",
    categoria: "Roupas de cama",
    unidade: "un",
    quantidade: 80,
    minimo: 40,
    status: "OK",
  },
  {
    id: 3,
    nome: "Água mineral 500ml",
    categoria: "Bebidas",
    unidade: "cx",
    quantidade: 30,
    minimo: 20,
    status: "OK",
  },
  {
    id: 4,
    nome: "Detergente",
    categoria: "Limpeza",
    unidade: "L",
    quantidade: 8,
    minimo: 15,
    status: "Baixo",
  },
  {
    id: 5,
    nome: "Lençol solteiro",
    categoria: "Roupas de cama",
    unidade: "un",
    quantidade: 120,
    minimo: 60,
    status: "OK",
  },
]

const movimentacoes = [
  {
    tipo: "Entrada",
    produto: "Toalha de banho",
    quantidade: 40,
    responsavel: "João",
    data: "13/09/2026 09:00",
  },
  {
    tipo: "Saída",
    produto: "Sabonete",
    quantidade: 30,
    responsavel: "Maria",
    data: "13/09/2026 08:30",
  },
  {
    tipo: "Entrada",
    produto: "Água mineral",
    quantidade: 10,
    responsavel: "Pedro",
    data: "12/09/2026 14:00",
  },
]

export default function Estoque() {
  const [estoque, setEstoque] = useState(initialEstoque)
  const [modal, setModal] = useState<"new" | "mov" | null>(null)
  const [form, setForm] = useState({
    nome: "",
    categoria: "Amenities",
    unidade: "un",
    quantidade: "",
    minimo: "",
  })
  const [movForm, setMovForm] = useState({
    tipo: "Entrada",
    produto: "",
    quantidade: "",
  })

  const save = () => {
    setEstoque([
      ...estoque,
      {
        id: Date.now(),
        nome: form.nome,
        categoria: form.categoria,
        unidade: form.unidade,
        quantidade: Number(form.quantidade),
        minimo: Number(form.minimo),
        status: Number(form.quantidade) < Number(form.minimo) ? "Baixo" : "OK",
      },
    ])
    setModal(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Estoque (RF32–RF38)"
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setModal("mov")}>
              Movimentação
            </Btn>
            <Btn
              onClick={() => {
                setForm({
                  nome: "",
                  categoria: "Amenities",
                  unidade: "un",
                  quantidade: "",
                  minimo: "",
                })
                setModal("new")
              }}
            >
              + Novo Produto
            </Btn>
          </div>
        }
      />

      {/* Alertas */}
      {estoque.filter((e) => e.status !== "OK").length > 0 && (
        <Card>
          <SectionTitle>Alertas de Reposição</SectionTitle>
          <div className="space-y-2">
            {estoque
              .filter((e) => e.status !== "OK")
              .map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{
                    background: e.status === "Critico" ? "#fee2e2" : "#fffbeb",
                    borderLeft: `3px solid ${
                      e.status === "Critico" ? "#dc2626" : "#d97706"
                    }`,
                  }}
                >
                  <span>{e.status === "Critico" ? "🔴" : "⚠"}</span>
                  <p
                    className="text-sm"
                    style={{ fontFamily: '"Inria Serif:Regular", serif' }}
                  >
                    <strong>{e.nome}</strong>: {e.quantidade} {e.unidade}{" "}
                    (mínimo: {e.minimo} {e.unidade})
                  </p>
                </div>
              ))}
          </div>
        </Card>
      )}

      <Card>
        <Table
          headers={[
            "Produto",
            "Categoria",
            "Quantidade",
            "Mínimo",
            "Status",
            "Ações",
          ]}
          rows={estoque.map((e) => [
            e.nome,
            e.categoria,
            `${e.quantidade} ${e.unidade}`,
            `${e.minimo} ${e.unidade}`,
            <Badge
              label={e.status}
              color={
                e.status === "OK"
                  ? "green"
                  : e.status === "Baixo"
                    ? "yellow"
                    : "red"
              }
            />,
            <div className="flex gap-1">
              <Btn small variant="ghost">
                Editar
              </Btn>
              <Btn small variant="secondary">
                Inativar
              </Btn>
            </div>,
          ])}
        />
      </Card>

      <Card>
        <SectionTitle>Últimas Movimentações</SectionTitle>
        <Table
          headers={[
            "Tipo",
            "Produto",
            "Quantidade",
            "Responsável",
            "Data/Hora",
          ]}
          rows={movimentacoes.map((m) => [
            <Badge
              label={m.tipo}
              color={m.tipo === "Entrada" ? "green" : "red"}
            />,
            m.produto,
            m.quantidade,
            m.responsavel,
            m.data,
          ])}
        />
      </Card>

      {modal === "new" && (
        <Modal title="Cadastrar Produto" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Input
              label="Nome *"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Select
              label="Categoria"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              <option>Amenities</option>
              <option>Limpeza</option>
              <option>Roupas de cama</option>
              <option>Bebidas</option>
              <option>Alimentos</option>
              <option>Manutenção</option>
            </Select>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Unidade"
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
              />
              <Input
                label="Quantidade inicial"
                type="number"
                value={form.quantidade}
                onChange={(e) =>
                  setForm({ ...form, quantidade: e.target.value })
                }
              />
              <Input
                label="Estoque mínimo"
                type="number"
                value={form.minimo}
                onChange={(e) => setForm({ ...form, minimo: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(null)}>
                Cancelar
              </Btn>
              <Btn onClick={save}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {modal === "mov" && (
        <Modal title="Registrar Movimentação" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Select
              label="Tipo *"
              value={movForm.tipo}
              onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}
            >
              <option>Entrada</option>
              <option>Saída</option>
            </Select>
            <Select
              label="Produto *"
              value={movForm.produto}
              onChange={(e) =>
                setMovForm({ ...movForm, produto: e.target.value })
              }
            >
              <option value="">Selecione...</option>
              {estoque.map((e) => (
                <option key={e.id}>{e.nome}</option>
              ))}
            </Select>
            <Input
              label="Quantidade *"
              type="number"
              value={movForm.quantidade}
              onChange={(e) =>
                setMovForm({ ...movForm, quantidade: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(null)}>
                Cancelar
              </Btn>
              <Btn onClick={() => setModal(null)}>Registrar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
