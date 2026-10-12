export type PaymentMethodId =
  | "cash"
  | "pix"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "bank_slip"
  | "check"
  | "other";

export type ReceivableStatus = "Pendente" | "Parcialmente recebida" | "Recebida" | "Vencida" | "Cancelada";
export type PayableStatus = "Pendente" | "Parcialmente paga" | "Paga" | "Vencida" | "Cancelada";

export const PAYMENT_METHODS: Array<{ id: PaymentMethodId; label: string; cashDrawer: boolean }> = [
  { id: "cash", label: "Dinheiro", cashDrawer: true },
  { id: "pix", label: "Pix", cashDrawer: false },
  { id: "credit_card", label: "Cartao de credito", cashDrawer: false },
  { id: "debit_card", label: "Cartao de debito", cashDrawer: false },
  { id: "bank_transfer", label: "Transferencia bancaria", cashDrawer: false },
  { id: "bank_slip", label: "Boleto", cashDrawer: false },
  { id: "check", label: "Cheque", cashDrawer: false },
  { id: "other", label: "Outra", cashDrawer: false },
];

const methodAliases: Record<string, PaymentMethodId> = {
  dinheiro: "cash",
  cash: "cash",
  pix: "pix",
  "cartao de credito": "credit_card",
  "cartão de crédito": "credit_card",
  "cartao credito": "credit_card",
  "cartão crédito": "credit_card",
  credito: "credit_card",
  crédito: "credit_card",
  "cartao de debito": "debit_card",
  "cartão de débito": "debit_card",
  "cartao debito": "debit_card",
  "cartão débito": "debit_card",
  debito: "debit_card",
  débito: "debit_card",
  transferencia: "bank_transfer",
  transferência: "bank_transfer",
  "transferencia bancaria": "bank_transfer",
  "transferência bancária": "bank_transfer",
  ted: "bank_transfer",
  doc: "bank_transfer",
  "ted/doc": "bank_transfer",
  boleto: "bank_slip",
  cheque: "check",
};

export function normalizePaymentMethod(value: string): PaymentMethodId {
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  return methodAliases[normalized] ?? "other";
}

export function paymentMethodLabel(methodId: PaymentMethodId) {
  return PAYMENT_METHODS.find((method) => method.id === methodId)?.label ?? "Outra";
}

export function isCashPayment(methodId: PaymentMethodId) {
  return PAYMENT_METHODS.find((method) => method.id === methodId)?.cashDrawer ?? false;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function pendingBalance(total: number, paid: number) {
  return roundMoney(Math.max(0, total - paid));
}

export function deriveReceivableStatus(total: number, received: number, dueDate?: string, canceled = false, currentDate = ""): ReceivableStatus {
  if (canceled) return "Cancelada";
  const balance = pendingBalance(total, received);
  if (balance <= 0) return "Recebida";
  if (received > 0) return "Parcialmente recebida";
  if (dueDate && currentDate && dueDate < currentDate) return "Vencida";
  return "Pendente";
}

export function derivePayableStatus(total: number, paid: number, dueDate?: string, canceled = false, currentDate = ""): PayableStatus {
  if (canceled) return "Cancelada";
  const balance = pendingBalance(total, paid);
  if (balance <= 0) return "Paga";
  if (paid > 0) return "Parcialmente paga";
  if (dueDate && currentDate && dueDate < currentDate) return "Vencida";
  return "Pendente";
}

export function validateSettlement(value: number, balance: number, label = "operacao") {
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: `Informe um valor valido para ${label}.` };
  if (roundMoney(value - balance) > 0) return { ok: false, error: `O valor informado excede o saldo pendente de ${roundMoney(balance).toFixed(2)}.` };
  return { ok: true };
}
