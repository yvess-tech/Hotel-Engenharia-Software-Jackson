import { useRef, type ComponentProps, type ReactNode } from "react"

import {
  Card,
  Icon,
  Modal,
  PageHeader,
  StatusBadge,
  Table,
  Tabs,
  formatDisplayDate,
  type IconName,
} from "./ui"

import "../styles/management.css"

export default function ManagementPage({
  module,

  children,
}: {
  module: "events" | "finance"

  children: ReactNode
}) {
  return (
    <div className={`ops-page management-page management-page--${module}`}>
      {children}
    </div>
  )
}

export function ManagementHeader({
  title,

  description,

  eyebrow,

  actions,
}: {
  title: string

  description: string

  eyebrow: string

  actions?: ReactNode
}) {
  return (
    <header className="management-heading">
      <p className="management-eyebrow">{eyebrow}</p>
      <PageHeader title={title} actions={actions} />
      <p className="management-description">{description}</p>
    </header>
  )
}

export function Surface({
  children,

  className = "",

  title,

  description,

  actions,
}: {
  children: ReactNode

  className?: string

  title?: string

  description?: string

  actions?: ReactNode
}) {
  return (
    <Card className={`management-surface ${className}`}>
      {title && (
        <SectionHeading
          title={title}
          description={description}
          actions={actions}
        />
      )}
      {children}
    </Card>
  )
}

export function SectionHeading({
  title,

  description,

  actions,
}: {
  title: string

  description?: string

  actions?: ReactNode
}) {
  return (
    <div className="management-section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="management-section-actions">{actions}</div>}
    </div>
  )
}

export function MetricCard({
  label,

  value,

  description,

  icon = "banknote",

  tone = "default",
}: {
  label: string

  value: string

  description?: string

  icon?: IconName

  tone?: "default" | "positive" | "warning" | "negative"
}) {
  return (
    <Card className={`management-metric management-metric--${tone}`}>
      <div className="management-metric__heading">
        <span>{label}</span>
        <span className="management-metric__icon">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <strong className="management-metric__value">{value}</strong>
      {description && <p>{description}</p>}
    </Card>
  )
}

export function DetailValue({
  label,

  value,
}: {
  label: string

  value: ReactNode
}) {
  const display =
    typeof value === "string"
      ? formatDisplayDate(value).replace(/(\d{2}\/\d{2}\/\d{4})T/g, "$1 às ")
      : value

  return (
    <dl className="management-detail">
      <dt>{label}</dt>
      <dd>{display}</dd>
    </dl>
  )
}

export function ManagementBadge({ label }: { label: string; color?: string }) {
  const names: Record<string, string> = {
    Concluido: "Concluído",

    Saida: "Saída",
  }

  const tones = {
    Planejado: "warn",

    Confirmado: "ok",

    "Em andamento": "info",

    Concluido: "neutral",

    Cancelado: "neutral",

    Cancelada: "neutral",

    Recebida: "ok",

    Paga: "ok",

    "Parcialmente recebida": "info",

    "Parcialmente paga": "info",

    Vencida: "danger",

    "A conferir": "warn",

    Entrada: "ok",

    Saida: "danger",

    Saída: "danger",
  } as const

  return (
    <StatusBadge
      status={names[label] ?? label}
      tone={tones[(label as keyof typeof tones)]}
    />
  )
}

export function ManagementTable({
  headers,

  rows,

  caption = "Registros",

  emptyDescription = "Não há registros para esta visualização. Confira os filtros ou cadastre um novo item.",

  ...props
}: ComponentProps<typeof Table> & { emptyDescription?: string }) {
  const normalize = (label: string) =>
    label

      .normalize("NFD")

      .replace(/[\u0300-\u036f]/g, "")

      .toLowerCase()

  const monetary =
    /valor|total|saldo|preco|recebido|contratado|encargos|pago|pendente|subtotal|esperado|contado|diferenca|a receber|a pagar|entradas realizadas|saidas realizadas/

  const labels: Record<string, string> = {
    Codigo: "Código",

    Descricao: "Descrição",

    Situacao: "Situação",

    Historico: "Histórico",

    Acao: "Ação",

    Acoes: "Ações",

    Responsavel: "Responsável",

    Metodo: "Método",

    Preco: "Preço",

    Area: "Área",

    Localizacao: "Localização",

    Servico: "Serviço",

    "Preco contratado": "Preço contratado",

    "Preco por hora": "Preço por hora",

    Diferenca: "Diferença",
  }

  const classes = headers.map((label) => {
    const name = normalize(label)

    if (monetary.test(name) || /^(quantidade|area|capacidade)$/.test(name))
      return "management-col--number"

    if (/^(acao|acoes|conferencia)$/.test(name))
      return "management-col--actions"

    if (/descricao|historico|recursos|observacoes/.test(name))
      return "management-col--description"

    if (/data|vencimento|abertura|fechamento|^codigo$|^periodo$/.test(name))
      return "management-col--date"

    return "management-col--text"
  })

  const alignments = classes.map((name) =>
    name === "management-col--number" || name === "management-col--actions"
      ? "right" as const
      : "left" as const,
  )

  return (
    <div
      className="management-table"
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <Table
        {...props}
        caption={caption}
        headers={headers.map((label) => labels[label] ?? label)}
        columnAlignments={alignments}
        columnClasses={classes}
        emptyMessage={
          <div className="management-empty">
            <Icon name="file-text" size={28} />
            <strong>Nenhum registro encontrado</strong>
            <span>{emptyDescription}</span>
          </div>
        }
        rows={rows.map((row) =>
          row.map((cell) => {
            if (typeof cell !== "string") return cell

            if (/^[+-]?R\$/.test(cell) || /^Crédito:/.test(cell))
              return (
                <span
                  className={`management-money ${
                    cell.startsWith("-")
                      ? "management-money--negative"
                      : cell.startsWith("+")
                        ? "management-money--positive"
                        : ""
                  }`}
                >
                  {cell}
                </span>
              )

            return formatDisplayDate(cell).replace(
              /(\d{2}\/\d{2}\/\d{4})T/g,

              "$1 às ",
            )
          }),
        )}
      />
    </div>
  )
}

export function ManagementTabs<T extends string>({
  tabs,

  active,

  onChange,
}: {
  tabs: { id: T; label: string }[]

  active: T

  onChange: (id: T) => void
}) {
  const root = useRef<HTMLElement>(null)

  return (
    <nav
      ref={root}
      className="management-tabs"
      aria-label="Seções do módulo"
      onKeyDown={(event) => {
        if (
          !(event.target instanceof HTMLElement) ||
          event.target.getAttribute("role") !== "tab"
        )
          return

        const index = tabs.findIndex((tab) => tab.id === active)

        const next =
          event.key === "ArrowRight"
            ? (index + 1) % tabs.length
            : event.key === "ArrowLeft"
              ? (index - 1 + tabs.length) % tabs.length
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : undefined

        if (next === undefined) return

        event.preventDefault()

        onChange(tabs[next].id)

        root.current

          ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
          [next]?.focus()
      }}
    >
      <Tabs tabs={tabs} active={active} onChange={onChange} rovingFocus />
    </nav>
  )
}

export function ManagementModal({
  description,

  ...props
}: ComponentProps<typeof Modal>) {
  const title = props.title

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .toLowerCase()

  const context = /cancelar/.test(title)
    ? "Revise os valores e o acordo com o contratante antes de confirmar."
    : /receber/.test(title)
      ? "Confira o saldo, informe o pagamento e confirme o recebimento."
      : /fechar caixa/.test(title)
        ? "Conte o dinheiro físico e registre a conferência deste turno."
        : /abrir caixa/.test(title)
          ? "Identifique o turno e informe o fundo inicial em dinheiro."
          : /caixa/.test(title)
            ? "Informe o tipo, o valor e o responsável pela movimentação."
            : /conciliacao/.test(title)
              ? "Conciliação simulada, sem integração bancária externa. Compare o extrato com os registros do sistema."
              : /cadastro de evento/.test(title)
                ? "Preencha as seis etapas e revise a contratação antes de salvar."
                : /^evt-/.test(title)
                  ? "Contrato, serviços, cronograma e situação financeira do evento."
                  : /pagar/.test(title)
                    ? "Confira os dados da obrigação e registre os valores correspondentes."
                    : /centro/.test(title)
                      ? "Organize a classificação das despesas e os vínculos financeiros."
                      : /sala/.test(title)
                        ? "Capacidade, estrutura e condições de contratação do espaço."
                        : /servico/.test(title)
                          ? "Informações do serviço e sua unidade de cobrança."
                          : "Confira as informações antes de concluir a operação."

  return (
    <Modal
      {...props}
      className={`management-modal ${props.className ?? ""}`}
      description={description ?? context}
    />
  )
}
