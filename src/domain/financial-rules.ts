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
  if (PAYMENT_METHODS.some((method) => method.id === normalized)) return normalized as PaymentMethodId;
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
  if (dueDate && currentDate && dueDate < currentDate) return "Vencida";
  if (received > 0) return "Parcialmente recebida";
  return "Pendente";
}

export function derivePayableStatus(total: number, paid: number, dueDate?: string, canceled = false, currentDate = ""): PayableStatus {
  if (canceled) return "Cancelada";
  const balance = pendingBalance(total, paid);
  if (balance <= 0) return "Paga";
  if (dueDate && currentDate && dueDate < currentDate) return "Vencida";
  if (paid > 0) return "Parcialmente paga";
  return "Pendente";
}

export function validateSettlement(value: number, balance: number, label = "operacao") {
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: `Informe um valor valido para ${label}.` };
  if (roundMoney(value) !== value) return { ok: false, error: "Informe o valor com até duas casas decimais." };
  if (roundMoney(value - balance) > 0) return { ok: false, error: `O valor informado excede o saldo pendente de ${roundMoney(balance).toFixed(2)}.` };
  return { ok: true };
}

export function validateRefund(received: number, refund: number) {
  if (!Number.isFinite(refund) || refund < 0 || roundMoney(refund) !== refund || refund > roundMoney(received)) {
    return { ok: false, error: "A devolução deve estar entre zero e o valor recebido, com até duas casas decimais." };
  }
  return { ok: true };
}

export function validateBankMatch(
  transaction: { direction: "credito" | "debito"; value: number },
  movement: { direction: "entrada" | "saida"; value: number; methodId: PaymentMethodId },
  alreadyMatched: boolean,
) {
  if (alreadyMatched) return { ok: false, error: "Este movimento já foi vinculado a outra transação bancária." };
  if (isCashPayment(movement.methodId)) return { ok: false, error: "Movimentos em dinheiro são conferidos no caixa físico, não na conciliação bancária." };
  if ((transaction.direction === "credito") !== (movement.direction === "entrada")) return { ok: false, error: "Vincule crédito a uma entrada ou débito a uma saída." };
  if (roundMoney(transaction.value - movement.value) !== 0) return { ok: false, error: "Os valores são diferentes. Registre sem vínculo para investigar a divergência." };
  return { ok: true };
}

export type FlowMovement = { date: string; direction: "entrada" | "saida"; value: number };
export type FlowObligation = { date: string; direction: "entrada" | "saida"; value: number };

// Future obligations are scheduled at their due date; overdue items appear today.
// Existing cash movements are actuals and never counted again as forecasts.
export function calculateCashFlow(movements: FlowMovement[], obligations: FlowObligation[], from: string, to: string, today: string) {
  const signed = (item: FlowMovement) => item.direction === "entrada" ? item.value : -item.value;
  const opening = roundMoney(movements.filter((item) => item.date < from).reduce((sum, item) => sum + signed(item), 0));
  const days = new Map<string, { date: string; entries: number; outflows: number; expectedEntries: number; expectedOutflows: number }>();
  const day = (date: string) => {
    if (!days.has(date)) days.set(date, { date, entries: 0, outflows: 0, expectedEntries: 0, expectedOutflows: 0 });
    return days.get(date)!;
  };
  for (const item of movements) {
    if (item.date < from || item.date > to) continue;
    day(item.date)[item.direction === "entrada" ? "entries" : "outflows"] += item.value;
  }
  for (const item of obligations) {
    const date = item.date < today ? today : item.date;
    if (date < from || date > to || item.value <= 0) continue;
    day(date)[item.direction === "entrada" ? "expectedEntries" : "expectedOutflows"] += item.value;
  }
  let actual = opening;
  let projected = opening;
  const rows = [...days.values()].sort((a, b) => a.date.localeCompare(b.date)).map((item) => {
    actual = roundMoney(actual + item.entries - item.outflows);
    projected = roundMoney(projected + item.entries - item.outflows + item.expectedEntries - item.expectedOutflows);
    return { ...item, actual, projected };
  });
  return { opening, actual, projected, rows };
}
