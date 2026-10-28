import {
  useState,
  useId,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"
import { useAccessControl } from "../access-control"

export type IconName = "hotel" | "banknote" | "trending-up" | "calendar-range" | "package" | "octagon-alert" | "triangle-alert" | "arrow-left-right" | "gift" | "badge-check" | "percent" | "circle-pause" | "paperclip" | "file-text" | "x" | "chevron-down" | "eye" | "pencil" | "history" | "trash" | "download" | "printer" | "send" | "rotate-ccw" | "log-in" | "log-out" | "users" | "key-round" | "link" | "unlink" | "presentation"

export function Icon({ name, size = 20 }: { name: IconName ;size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    hotel: (
      <>
        <path d="M10 22v-6.57" />
        <path d="M12 11h.01" />
        <path d="M12 7h.01" />
        <path d="M14 15.43V22" />
        <path d="M15 16a5 5 0 0 0-6 0" />
        <path d="M16 11h.01" />
        <path d="M16 7h.01" />
        <path d="M8 11h.01" />
        <path d="M8 7h.01" />
        <rect width="16" height="20" x="4" y="2" rx="2" />
      </>
    ),
    banknote: (
      <>
        <rect width="20" height="12" x="2" y="6" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </>
    ),
    "trending-up": (
      <>
        <path d="m22 7-8.5 8.5-5-5L2 17" />
        <path d="M16 7h6v6" />
      </>
    ),
    "calendar-range": (
      <>
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M17 14h-6M13 18H7" />
      </>
    ),
    package: (
      <>
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
      </>
    ),
    "octagon-alert": (
      <>
        <path d="M12 16h.01M12 8v4" />
        <path d="M15.3 2H8.7L2 8.7v6.6L8.7 22h6.6l6.7-6.7V8.7Z" />
      </>
    ),
    "triangle-alert": (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01" />
      </>
    ),
    "arrow-left-right": (
      <>
        <path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />
      </>
    ),
    gift: (
      <>
        <path d="M12 7v14M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
        <path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" />
        <rect x="3" y="7" width="18" height="4" rx="1" />
      </>
    ),
    "badge-check": (
      <>
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    percent: (
      <>
        <line x1="19" x2="5" y1="5" y2="19" />
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </>
    ),
    "circle-pause": (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="10" x2="10" y1="15" y2="9" />
        <line x1="14" x2="14" y1="15" y2="9" />
      </>
    ),
    paperclip: (
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    ),
    "file-text": (
      <>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M16 13H8M16 17H8M10 9H8" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
      </>
    ),
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    eye: (
      <>
        <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.22 10.22 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.22 10.22 0 0 1-19.88 0" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    pencil: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l4 2" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </>
    ),
    printer: (
      <>
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect width="12" height="8" x="6" y="14" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    "rotate-ccw": (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    "log-in": (
      <>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
      </>
    ),
    "log-out": (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    "key-round": (
      <>
        <path d="M2.6 15.4a6 6 0 1 0 8-8L2 16v4h4l1-1v-2h2l1.4-1.4" />
        <circle cx="16.5" cy="7.5" r=".5" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    unlink: (
      <>
        <path d="m18.84 12.25 1.7-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71M5.17 11.75l-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71M8 2v3M2 8h3M16 19v3M19 16h3" />
      </>
    ),
    presentation: (
      <>
        <path d="M2 3h20M4 3v13h16V3M8 21l4-5 4 5M8 9h2v3H8zM14 7h2v5h-2z" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const rfMap: Record<string, string> = {
  Hóspedes: "RF01–RF08",
  Reservas: "RF09–RF20",
  Quartos: "RF21–RF28",
  "Check-in / Check-out": "RF29–RF36",
  Consumos: "RF37–RF40",
  Estoque: "RF41–RF47",
  Pacotes: "RF48–RF59",
  Financeiro: "RF60–RF76",
  Funcionários: "RF77–RF96",
  "Limpeza & Manutenção": "RF79–RF88",
  Eventos: "RF89–RF100",
  Comunicações: "RF101–RF103",
  Fiscal: "RF122–RF132",
  "Usuários & Acesso": "RF133–RF148",
  Relatórios: "RF149–RF159",
}

export function PageHeader({
  title,
  actions,
}: {
  title: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div className="page-title-wrap">
        <h1>{title}</h1>
        {import.meta.env.DEV && rfMap[title] && (
          <span className="rf-badge">{rfMap[title]}</span>
        )}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`ds-card ${className}`}>{children}</div>
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string
  value: string
  sub?: string
  icon?: IconName
  tone?: "default" | "warn" | "danger"
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-heading">
        <p>{label}</p>
        {icon && (
          <span className="kpi-icon">
            <Icon name={icon} />
          </span>
        )}
      </div>
      <p className={`kpi-value kpi-value--${tone}`}>{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}

export function StatCard(props: {
  label: string
  value: string
  sub?: string
  icon?: IconName
  color?: string
}) {
  return (
    <KpiCard
      label={props.label}
      value={props.value}
      sub={props.sub}
      icon={props.icon}
    />
  )
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost"

function recordActionIcon(label: string): IconName | null {
  const action = label.trim().toLocaleLowerCase("pt-BR")
  if (
    /^(ver|ver detalhes|visualizar|visualizar fatura|consultar)$/.test(action)
  )
    return "eye"
  if (/^(editar|atualizar)$/.test(action)) return "pencil"
  if (action === "histórico") return "history"
  if (/^(cancelar|cancelar reserva|rejeitar)$/.test(action)) return "x"
  if (action === "excluir") return "trash"
  if (action === "inativar") return "circle-pause"
  if (
    /^(ativar|aprovar|registrar limpeza|registrar execução|conciliar)$/.test(
      action,
    )
  )
    return "badge-check"
  if (action === "baixar") return "download"
  if (action === "imprimir") return "printer"
  if (/^(enviar)$/.test(action)) return "send"
  if (/^(reenviar|reemitir|estornar)$/.test(action)) return "rotate-ccw"
  if (action === "iniciar check-in") return "log-in"
  if (action === "realizar check-out") return "log-out"
  if (action === "emitir fatura") return "file-text"
  if (/^(pagar|receber)$/.test(action)) return "banknote"
  if (action === "perfis") return "users"
  if (action === "atualizar senha") return "key-round"
  if (action === "associar perfil") return "link"
  if (action === "remover perfil") return "unlink"
  if (action === "+ repor") return "package"
  return null
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  small,
  fullWidth,
  disabled,
  confirmAction = true,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  type?: "button" | "submit"
  small?: boolean
  fullWidth?: boolean
  disabled?: boolean
  confirmAction?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const actionLabel =
    small && typeof children === "string" ? children.trim() : ""
  const actionIcon = actionLabel ? recordActionIcon(actionLabel) : null
  const activate = () => {
    if (disabled) return
    variant === "danger" && confirmAction && onClick ? setConfirming(true) : onClick?.()
  }
  return (
    <>
      <button
        type={type}
        disabled={disabled}
        onClick={activate}
        aria-label={actionIcon ? actionLabel : undefined}
        title={actionIcon ? actionLabel : undefined}
        data-tooltip={actionIcon ? actionLabel : undefined}
        className={`ds-button ds-button--${variant}${
          small ? " ds-button--small" : ""
        }${fullWidth ? " ds-button--full" : ""}${
          actionIcon ? " ds-button--record-action" : ""
        }`}
      >
        {actionIcon ? <Icon name={actionIcon} size={16} /> : children}
      </button>
      {confirming && (
        <ConfirmDialog
          title="Confirmar ação"
          description="Esta ação pode alterar ou remover informações. Deseja continuar?"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            onClick?.()
          }}
        />
      )}
    </>
  )
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="field-label">{children}</label>
}
export function Input({
  label,
  helpText,
  ...props
}: {
  label?: string
  helpText?: string
} & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  return (
    <div className="field">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <input {...props} id={id} className={`ds-input ${props.className ?? ""}`} />
      {helpText && <p className="field-help">{helpText}</p>}
    </div>
  )
}
export function Textarea({
  label,
  ...props
}: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  return (
    <div className="field">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <textarea
        {...props}
        id={id}
        rows={props.rows ?? 3}
        className={`ds-textarea ${props.className ?? ""}`}
      />
    </div>
  )
}
export function Select({
  label,
  children,
  ...props
}: { label?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  return (
    <div className="field">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div className="select-wrap">
        <select {...props} id={id} className={`ds-select ${props.className ?? ""}`}>
          {children}
        </select>
        <span className="select-chevron">
          <Icon name="chevron-down" size={16} />
        </span>
      </div>
    </div>
  )
}

export function ResponsibleSelect({
  value,
  onChange,
  label = "Responsável *",
}: {
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  const { accounts } = useAccessControl()
  return (
    <Select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Selecione um usuário</option>
      {accounts
        .filter((account) => account.status === "Ativo")
        .map((account) => (
          <option key={account.id} value={account.name}>
            {account.name}
          </option>
        ))}
    </Select>
  )
}

type StatusTone = "ok" | "info" | "reserved" | "warn" | "danger" | "neutral"
const statusTones: Record<string, StatusTone> = {
  Livre: "ok",
  Limpo: "ok",
  Ativo: "ok",
  Ativa: "ok",
  OK: "ok",
  Vigente: "ok",
  Concluída: "ok",
  Concluído: "ok",
  Confirmado: "ok",
  "Documento conferido": "ok",
  Disponível: "ok",
  Enviado: "ok",
  Enviada: "ok",
  Pago: "ok",
  Recebido: "ok",
  Conciliado: "ok",
  Aprovado: "ok",
  Ocupado: "info",
  Hospedado: "info",
  Confirmada: "info",
  "Check-in": "info",
  Entrada: "info",
  Reservado: "reserved",
  Manutenção: "warn",
  "Em manutenção": "warn",
  "Em limpeza": "warn",
  "Documento pendente": "warn",
  Aguardando: "warn",
  Baixo: "warn",
  Pendente: "warn",
  Médio: "warn",
  Crítico: "danger",
  Erro: "danger",
  Sujo: "danger",
  Bloqueado: "danger",
  Bloqueada: "danger",
  Cancelada: "danger",
  Cancelado: "danger",
  Estornado: "danger",
  Falha: "danger",
  Divergente: "danger",
  Saída: "danger",
  Urgente: "danger",
  Finalizado: "neutral",
  Inativo: "neutral",
  Simulada: "neutral",
  "Não executada": "neutral",
}
export function StatusBadge({
  status,
  tone,
}: {
  status: string
  tone?: StatusTone
}) {
  return (
    <span
      className={`status-badge status-badge--${tone ?? statusTones[status] ?? "neutral"}`}
    >
      {status}
    </span>
  )
}
export function Badge({
  label,
}: {
  label: string
  color?: "green" | "red" | "yellow" | "blue" | "gray" | "purple"
}) {
  return <StatusBadge status={label} />
}

function isNumericCell(cell: ReactNode) {
  return (
    typeof cell === "string" &&
    /^(R\$|\d+[\d.,%]*$|\d{2}\/\d{2}\/\d{4})/.test(cell)
  )
}
export function formatDisplayDate(value: string) {
  return value.replace(
    /\b(\d{4})-(\d{2})-(\d{2})(?=\b|T|\s)/g,
    (_match, year, month, day) => `${day}/${month}/${year}`,
  )
}
export function Table({
  headers,
  rows,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className={
                  /(valor|total|saldo|quantidade|preço|r\$)/i.test(h)
                    ? "numeric"
                    : ""
                }
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="table-empty">
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className={isNumericCell(cell) ? "numeric" : ""}>
                    {typeof cell === "string" ? formatDisplayDate(cell) : cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className="modal-overlay">
      <div
        className={`modal-panel${wide ? " modal-panel--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        className="confirm-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="form-actions">
          <Btn variant="ghost" onClick={onCancel}>
            Cancelar
          </Btn>
          <button
            className="ds-button ds-button--danger-confirm"
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T ;label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="ds-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? "active" : ""}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
export function Alert({
  children,
  type = "info",
}: {
  children: ReactNode
  type?: "info" | "warning" | "error" | "success"
}) {
  const tone =
    type === "warning"
      ? "warn"
      : type === "error"
        ? "danger"
        : type === "success"
          ? "ok"
          : "info"
  return <div role={type === "error" ? "alert" : "status"} className={`ds-alert ds-alert--${tone}`}>{children}</div>
}
export function FormGrid({
  children,
  cols = 2,
}: {
  children: ReactNode
  cols?: 1 | 2 | 3
}) {
  return (
    <div
      className="form-grid"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {children}
    </div>
  )
}
export function FullCol({ children }: { children: ReactNode }) {
  return <div className="full-col">{children}</div>
}
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="form-actions">{children}</div>
}
