import { useState, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export type IconName =
  | "hotel" | "banknote" | "trending-up" | "calendar-range" | "package"
  | "octagon-alert" | "triangle-alert" | "arrow-left-right" | "gift"
  | "badge-check" | "percent" | "circle-pause" | "paperclip" | "file-text" | "x" | "chevron-down";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    hotel: <><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/><rect width="16" height="20" x="4" y="2" rx="2"/></>,
    banknote: <><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></>,
    "trending-up": <><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></>,
    "calendar-range": <><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M17 14h-6M13 18H7"/></>,
    package: <><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></>,
    "octagon-alert": <><path d="M12 16h.01M12 8v4"/><path d="M15.3 2H8.7L2 8.7v6.6L8.7 22h6.6l6.7-6.7V8.7Z"/></>,
    "triangle-alert": <><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01"/></>,
    "arrow-left-right": <><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></>,
    gift: <><path d="M12 7v14M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/></>,
    "badge-check": <><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></>,
    percent: <><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>,
    "circle-pause": <><circle cx="12" cy="12" r="10"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></>,
    paperclip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
    "file-text": <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M10 9H8"/></>,
    x: <><path d="M18 6 6 18M6 6l12 12"/></>,
    "chevron-down": <path d="m6 9 6 6 6-6"/>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const rfMap: Record<string, string> = {
  "Hóspedes": "RF01–RF08", "Reservas": "RF09–RF20", "Quartos": "RF21–RF28",
  "Check-in / Check-out": "RF29–RF36", "Consumos": "RF37–RF40", "Estoque": "RF41–RF47",
  "Pacotes": "RF48–RF59", "Financeiro": "RF60–RF76", "Funcionários": "RF77–RF96",
  "Limpeza & Manutenção": "RF97–RF106", "Eventos": "RF107–RF118", "Comunicações": "RF119–RF121",
  "Fiscal": "RF122–RF132", "Usuários & Acesso": "RF133–RF148", "Relatórios": "RF149–RF159",
};

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return <div className="page-header"><div className="page-title-wrap"><h1>{title}</h1>{import.meta.env.DEV && rfMap[title] && <span className="rf-badge">{rfMap[title]}</span>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ds-card ${className}`}>{children}</div>;
}

export function KpiCard({ label, value, sub, icon, tone = "default" }: { label: string; value: string; sub?: string; icon?: IconName; tone?: "default" | "warn" | "danger" }) {
  return <div className="kpi-card"><div className="kpi-heading"><p>{label}</p>{icon && <span className="kpi-icon"><Icon name={icon}/></span>}</div><p className={`kpi-value kpi-value--${tone}`}>{value}</p>{sub && <p className="kpi-sub">{sub}</p>}</div>;
}

export function StatCard(props: { label: string; value: string; sub?: string; icon?: IconName; color?: string }) {
  return <KpiCard label={props.label} value={props.value} sub={props.sub} icon={props.icon}/>;
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
export function Btn({ children, onClick, variant = "primary", type = "button", small, fullWidth, disabled }: { children: ReactNode; onClick?: () => void; variant?: BtnVariant; type?: "button" | "submit"; small?: boolean; fullWidth?: boolean; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const activate = () => {
    if (disabled) return;
    variant === "danger" && onClick ? setConfirming(true) : onClick?.();
  };
  return <><button type={type} disabled={disabled} onClick={activate} className={`ds-button ds-button--${variant}${small ? " ds-button--small" : ""}${fullWidth ? " ds-button--full" : ""}`}>{children}</button>{confirming && <ConfirmDialog title="Confirmar ação" description="Esta ação pode alterar ou remover informações. Deseja continuar?" onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); onClick?.(); }}/>}</>;
}

function FieldLabel({ children }: { children: ReactNode }) { return <label className="field-label">{children}</label>; }
export function Input({ label, helpText, ...props }: { label?: string; helpText?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <div className="field">{label && <FieldLabel>{label}</FieldLabel>}<input {...props} className={`ds-input ${props.className ?? ""}`}/>{helpText && <p className="field-help">{helpText}</p>}</div>;
}
export function Textarea({ label, ...props }: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <div className="field">{label && <FieldLabel>{label}</FieldLabel>}<textarea {...props} rows={props.rows ?? 3} className={`ds-textarea ${props.className ?? ""}`}/></div>;
}
export function Select({ label, children, ...props }: { label?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="field">{label && <FieldLabel>{label}</FieldLabel>}<div className="select-wrap"><select {...props} className={`ds-select ${props.className ?? ""}`}>{children}</select><span className="select-chevron"><Icon name="chevron-down" size={16}/></span></div></div>;
}

type StatusTone = "ok" | "info" | "reserved" | "warn" | "danger" | "neutral";
const statusTones: Record<string, StatusTone> = {
  Livre: "ok", Ativo: "ok", OK: "ok", Vigente: "ok", "Concluída": "ok", Concluído: "ok", Confirmado: "ok", "Documento conferido": "ok", Disponível: "ok", Enviado: "ok", Pago: "ok", Recebido: "ok", Conciliado: "ok", Aprovado: "ok",
  Ocupado: "info", Hospedado: "info", Confirmada: "info", "Check-in": "info", Entrada: "info",
  Reservado: "reserved",
  Manutenção: "warn", "Em manutenção": "warn", "Documento pendente": "warn", Aguardando: "warn", Baixo: "warn", Pendente: "warn", Médio: "warn",
  Crítico: "danger", Cancelada: "danger", Cancelado: "danger", Estornado: "danger", Falha: "danger", Divergente: "danger", Saída: "danger", Urgente: "danger",
  Finalizado: "neutral", Inativo: "neutral",
};
export function StatusBadge({ status, tone }: { status: string; tone?: StatusTone }) { return <span className={`status-badge status-badge--${tone ?? statusTones[status] ?? "neutral"}`}>{status}</span>; }
export function Badge({ label }: { label: string; color?: "green" | "red" | "yellow" | "blue" | "gray" | "purple" }) { return <StatusBadge status={label}/>; }

function isNumericCell(cell: ReactNode) { return typeof cell === "string" && (/^(R\$|\d+[\d.,%]*$|\d{2}\/\d{2}\/\d{4})/.test(cell)); }
export function formatDisplayDate(value: string) {
  return value.replace(/\b(\d{4})-(\d{2})-(\d{2})(?=\b|T|\s)/g, (_match, year, month, day) => `${day}/${month}/${year}`);
}
export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="table-wrap"><table className="ds-table"><thead><tr>{headers.map((h) => <th key={h} className={/(valor|total|saldo|quantidade|preço|r\$)/i.test(h) ? "numeric" : ""}>{h}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={headers.length} className="table-empty">Nenhum registro encontrado.</td></tr> : rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} className={isNumericCell(cell) ? "numeric" : ""}>{typeof cell === "string" ? formatDisplayDate(cell) : cell}</td>)}</tr>)}</tbody></table></div>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal-panel${wide ? " modal-panel--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button className="modal-close" onClick={onClose} aria-label="Fechar"><Icon name="x" size={18}/></button></div><div className="modal-content">{children}</div></div></div>;
}

export function ConfirmDialog({ title, description, onConfirm, onCancel }: { title: string; description: string; onConfirm: () => void; onCancel: () => void }) {
  return <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="confirm-panel" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">{title}</h2><p>{description}</p><div className="form-actions"><Btn variant="ghost" onClick={onCancel}>Cancelar</Btn><button className="ds-button ds-button--danger-confirm" onClick={onConfirm}>Confirmar</button></div></div></div>;
}

export function SectionTitle({ children }: { children: ReactNode }) { return <h2 className="section-title">{children}</h2>; }
export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) { return <div className="ds-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={active === tab.id} className={active === tab.id ? "active" : ""} onClick={() => onChange(tab.id)}>{tab.label}</button>)}</div>; }
export function Alert({ children, type = "info" }: { children: ReactNode; type?: "info" | "warning" | "error" | "success" }) { const tone = type === "warning" ? "warn" : type === "error" ? "danger" : type === "success" ? "ok" : "info"; return <div className={`ds-alert ds-alert--${tone}`}>{children}</div>; }
export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) { return <div className="form-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>{children}</div>; }
export function FullCol({ children }: { children: ReactNode }) { return <div className="full-col">{children}</div>; }
export function FormActions({ children }: { children: ReactNode }) { return <div className="form-actions">{children}</div>; }
