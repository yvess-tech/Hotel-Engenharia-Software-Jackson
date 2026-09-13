import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/* ─── typography helpers ─────────────────────────────────────────────── */
const SERIF = "'Inria Serif', Georgia, serif";

/* ─── PageHeader ─────────────────────────────────────────────────────── */
export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h2
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: "1.35rem",
          color: "#3e5525",
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ─── Card ───────────────────────────────────────────────────────────── */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
        padding: "20px 24px",
        border: "1px solid rgba(62,85,37,0.07)",
      }}
    >
      {children}
    </div>
  );
}

/* ─── StatCard ───────────────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  sub,
  icon,
  color = "#3e5525",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        padding: "20px 22px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
        border: "1px solid rgba(62,85,37,0.07)",
        borderTop: `3px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: "0.72rem",
            color: "#7a8a6a",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </p>
        {icon && <span style={{ fontSize: "1.2rem", opacity: 0.6 }}>{icon}</span>}
      </div>
      <p
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: "1.75rem",
          color,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: "0.72rem",
            color: "#aab89a",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── Button ─────────────────────────────────────────────────────────── */
type BtnVariant = "primary" | "secondary" | "danger" | "ghost";

const btnStyles: Record<BtnVariant, React.CSSProperties> = {
  primary: {
    background: "#3e5525",
    color: "#ffffff",
    border: "1.5px solid #3e5525",
  },
  secondary: {
    background: "#f0f4eb",
    color: "#3e5525",
    border: "1.5px solid #c3d4ad",
  },
  danger: {
    background: "#dc2626",
    color: "#ffffff",
    border: "1.5px solid #dc2626",
  },
  ghost: {
    background: "transparent",
    color: "#4b5563",
    border: "1.5px solid #d1d5db",
  },
};

export function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  small,
  fullWidth,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  type?: "button" | "submit";
  small?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        ...btnStyles[variant],
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: small ? "0.78rem" : "0.85rem",
        borderRadius: "9px",
        padding: small ? "5px 12px" : "8px 18px",
        cursor: "pointer",
        transition: "opacity 0.15s, transform 0.1s",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
    >
      {children}
    </button>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────── */
export function Input({
  label,
  helpText,
  ...props
}: { label?: string; helpText?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "#3e5525",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          fontFamily: SERIF,
          fontSize: "0.88rem",
          color: "#1a1a1a",
          background: "#f8faf6",
          border: "1.5px solid #c8d8b8",
          borderRadius: "9px",
          padding: "8px 12px",
          width: "100%",
          transition: "border-color 0.15s",
        }}
      />
      {helpText && (
        <p style={{ fontFamily: SERIF, fontSize: "0.72rem", color: "#9aaa8a" }}>{helpText}</p>
      )}
    </div>
  );
}

/* ─── Textarea ───────────────────────────────────────────────────────── */
export function Textarea({
  label,
  ...props
}: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "#3e5525",
          }}
        >
          {label}
        </label>
      )}
      <textarea
        {...props}
        rows={props.rows ?? 3}
        style={{
          fontFamily: SERIF,
          fontSize: "0.88rem",
          color: "#1a1a1a",
          background: "#f8faf6",
          border: "1.5px solid #c8d8b8",
          borderRadius: "9px",
          padding: "8px 12px",
          width: "100%",
          resize: "vertical",
        }}
      />
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────────────────── */
export function Select({
  label,
  children,
  ...props
}: { label?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "#3e5525",
          }}
        >
          {label}
        </label>
      )}
      <select
        {...props}
        style={{
          fontFamily: SERIF,
          fontSize: "0.88rem",
          color: "#1a1a1a",
          background: "#f8faf6",
          border: "1.5px solid #c8d8b8",
          borderRadius: "9px",
          padding: "8px 12px",
          width: "100%",
          cursor: "pointer",
        }}
      >
        {children}
      </select>
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────── */
const badgeMap: Record<string, React.CSSProperties> = {
  green:  { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" },
  red:    { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" },
  yellow: { background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a" },
  blue:   { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  gray:   { background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" },
  purple: { background: "#ede9fe", color: "#6d28d9", border: "1px solid #ddd6fe" },
};

export function Badge({
  label,
  color,
}: {
  label: string;
  color: "green" | "red" | "yellow" | "blue" | "gray" | "purple";
}) {
  return (
    <span
      style={{
        ...badgeMap[color],
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: "0.7rem",
        letterSpacing: "0.03em",
        borderRadius: "99px",
        padding: "2px 10px",
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

/* ─── Table ──────────────────────────────────────────────────────────── */
export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number | ReactNode)[][];
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: "12px",
        border: "1.5px solid #e2ecd8",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
        <thead>
          <tr style={{ background: "#3e5525" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "#ffffff",
                  padding: "11px 16px",
                  textAlign: "left",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  fontFamily: SERIF,
                  fontSize: "0.85rem",
                  color: "#9aaa8a",
                  padding: "24px 16px",
                  textAlign: "center",
                }}
              >
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  background: ri % 2 === 0 ? "#ffffff" : "#f8faf6",
                  borderBottom: "1px solid #eef2ea",
                  transition: "background 0.1s",
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      fontFamily: SERIF,
                      fontSize: "0.85rem",
                      color: "#374151",
                      padding: "10px 16px",
                      verticalAlign: "middle",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────── */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(20,30,12,0.45)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          width: "100%",
          maxWidth: wide ? "680px" : "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          border: "1px solid rgba(62,85,37,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px 16px",
            borderBottom: "1.5px solid #eef2ea",
          }}
        >
          <h3
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#3e5525",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "none",
              background: "#f0f2ee",
              color: "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontFamily: SERIF,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── SectionTitle ───────────────────────────────────────────────────── */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: "0.92rem",
        color: "#3e5525",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "2px solid #e8f0e0",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </h3>
  );
}

/* ─── Tabs ───────────────────────────────────────────────────────────── */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        background: "#eef2ea",
        padding: "4px",
        borderRadius: "12px",
        flexWrap: "wrap",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            fontFamily: SERIF,
            fontWeight: active === t.id ? 700 : 400,
            fontSize: "0.82rem",
            padding: "7px 16px",
            borderRadius: "9px",
            border: "none",
            cursor: "pointer",
            background: active === t.id ? "#3e5525" : "transparent",
            color: active === t.id ? "#ffffff" : "#4d6a2f",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Alert ──────────────────────────────────────────────────────────── */
export function Alert({
  children,
  type = "info",
}: {
  children: ReactNode;
  type?: "info" | "warning" | "error" | "success";
}) {
  const styles: Record<string, React.CSSProperties> = {
    info:    { background: "#eff6ff", borderLeft: "4px solid #3b82f6", color: "#1e40af" },
    warning: { background: "#fffbeb", borderLeft: "4px solid #f59e0b", color: "#92400e" },
    error:   { background: "#fef2f2", borderLeft: "4px solid #ef4444", color: "#991b1b" },
    success: { background: "#f0fdf4", borderLeft: "4px solid #22c55e", color: "#15803d" },
  };
  return (
    <div
      style={{
        ...styles[type],
        borderRadius: "0 10px 10px 0",
        padding: "10px 14px",
        fontFamily: SERIF,
        fontSize: "0.84rem",
      }}
    >
      {children}
    </div>
  );
}

/* ─── FormGrid ───────────────────────────────────────────────────────── */
export function FormGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "14px",
      }}
    >
      {children}
    </div>
  );
}

export function FullCol({ children }: { children: ReactNode }) {
  return <div style={{ gridColumn: "1 / -1" }}>{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
        marginTop: "8px",
        gridColumn: "1 / -1",
      }}
    >
      {children}
    </div>
  );
}
