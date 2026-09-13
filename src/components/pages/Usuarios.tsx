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

type Tab = "usuarios" | "perfis" | "logs"
interface TabItem {
  id: Tab
  label: string
}

const usuarios = [
  {
    id: 1,
    nome: "João Carlos",
    email: "joao@hotel.com",
    perfil: "Administrador",
    status: "Ativo",
    ultimo: "13/09/2026 09:00",
  },
  {
    id: 2,
    nome: "Carlos Mendes",
    email: "carlos@hotel.com",
    perfil: "Recepcionista",
    status: "Ativo",
    ultimo: "13/09/2026 08:05",
  },
  {
    id: 3,
    nome: "Fernanda Lima",
    email: "fernanda@hotel.com",
    perfil: "Financeiro",
    status: "Inativo",
    ultimo: "10/09/2026 17:00",
  },
]

const perfis = [
  { nome: "Administrador", permissoes: "Total", usuarios: 1, status: "Ativo" },
  {
    nome: "Recepcionista",
    permissoes: "Reservas, Check-in/out, Hóspedes",
    usuarios: 3,
    status: "Ativo",
  },
  { nome: "Camareira", permissoes: "Limpeza", usuarios: 2, status: "Ativo" },
  {
    nome: "Financeiro",
    permissoes: "Financeiro, Relatórios",
    usuarios: 1,
    status: "Ativo",
  },
]

const logs = [
  {
    usuario: "João Carlos",
    acao: "Login",
    modulo: "Sistema",
    data: "13/09/2026 09:00",
  },
  {
    usuario: "Carlos Mendes",
    acao: "Check-in",
    modulo: "Reservas",
    data: "13/09/2026 08:10",
  },
  {
    usuario: "João Carlos",
    acao: "Cadastro hóspede",
    modulo: "Hóspedes",
    data: "13/09/2026 09:15",
  },
  {
    usuario: "Fernanda Lima",
    acao: "Login falhou",
    modulo: "Sistema",
    data: "10/09/2026 17:05",
  },
]

export default function Usuarios() {
  const [tab, setTab] = useState<Tab>("usuarios")
  const [modal, setModal] = useState(false)

  const tabs: TabItem[] = [
    { id: "usuarios", label: "Usuários" },
    { id: "perfis", label: "Perfis de Acesso" },
    { id: "logs", label: "Logs de Operação" },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuários & Controle de Acesso (RF115–RF130)"
        actions={
          tab === "usuarios" ? (
            <Btn onClick={() => setModal(true)}>+ Cadastrar Usuário</Btn>
          ) : undefined
        }
      />

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

      {tab === "usuarios" && (
        <Card>
          <Table
            headers={[
              "Nome",
              "E-mail",
              "Perfil",
              "Último acesso",
              "Status",
              "Ações",
            ]}
            rows={usuarios.map((u) => [
              u.nome,
              u.email,
              u.perfil,
              u.ultimo,
              <Badge
                label={u.status}
                color={u.status === "Ativo" ? "green" : "gray"}
              />,
              <div className="flex gap-1">
                <Btn small variant="ghost">
                  Editar
                </Btn>
                <Btn small variant="secondary">
                  Senha
                </Btn>
                <Btn small variant="danger">
                  Inativar
                </Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "perfis" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <SectionTitle>Perfis de Acesso (RF119–RF124)</SectionTitle>
            <Btn small>+ Novo Perfil</Btn>
          </div>
          <Table
            headers={["Perfil", "Permissões", "Usuários", "Status", "Ações"]}
            rows={perfis.map((p) => [
              p.nome,
              p.permissoes,
              String(p.usuarios),
              <Badge label={p.status} color="green" />,
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
      )}

      {tab === "logs" && (
        <Card>
          <SectionTitle>Logs de Operação (RF129–RF130)</SectionTitle>
          <div className="flex gap-3 mb-4 flex-wrap">
            <Select label="Usuário">
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id}>{u.nome}</option>
              ))}
            </Select>
            <Input label="Data início" type="date" />
            <Input label="Data fim" type="date" />
            <div className="flex items-end">
              <Btn>Filtrar</Btn>
            </div>
          </div>
          <Table
            headers={["Usuário", "Ação", "Módulo", "Data/Hora"]}
            rows={logs.map((l) => [l.usuario, l.acao, l.modulo, l.data])}
          />
        </Card>
      )}

      {modal && (
        <Modal title="Cadastrar Usuário" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Input label="Nome *" />
            <Input label="E-mail *" type="email" />
            <Select label="Perfil de acesso *">
              {perfis.map((p) => (
                <option key={p.nome}>{p.nome}</option>
              ))}
            </Select>
            <Input label="Senha inicial *" type="password" />
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>
                Cancelar
              </Btn>
              <Btn onClick={() => setModal(false)}>Cadastrar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
