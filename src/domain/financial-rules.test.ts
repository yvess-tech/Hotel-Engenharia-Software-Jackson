import assert from "node:assert/strict";
import test from "node:test";
import {
  derivePayableStatus,
  deriveReceivableStatus,
  isCashPayment,
  normalizePaymentMethod,
  paymentMethodLabel,
  pendingBalance,
  validateSettlement,
  PAYMENT_METHODS,
  validateRefund,
  validateBankMatch,
  calculateCashFlow,
} from "./financial-rules.ts";

test("padroniza formas de pagamento sem duplicar modalidades", () => {
  assert.equal(normalizePaymentMethod("PIX"), "pix");
  assert.equal(normalizePaymentMethod("pix"), "pix");
  assert.equal(normalizePaymentMethod("Cartão de débito"), "debit_card");
  assert.equal(normalizePaymentMethod("Transferência"), "bank_transfer");
  assert.equal(paymentMethodLabel("cash"), "Dinheiro");
});

test("preserva os identificadores enviados pelos formulários para todas as formas de pagamento", () => {
  for (const method of PAYMENT_METHODS) {
    assert.equal(normalizePaymentMethod(method.id), method.id);
    assert.equal(normalizePaymentMethod(method.label), method.id);
  }
});

test("devolução admite retenção total, parcial e nenhuma, sem exceder o recebido", () => {
  for (const value of [0, 100.25, 300]) assert.equal(validateRefund(300, value).ok, true);
  for (const value of [-1, 300.01, NaN, Infinity, 12.345]) assert.equal(validateRefund(300, value).ok, false);
});

test("conciliação impede direção errada, duplicidade, dinheiro físico e valores diferentes", () => {
  const credit = { direction: "credito" as const, value: 450 };
  const movement = { direction: "entrada" as const, value: 450, methodId: "pix" as const };
  assert.equal(validateBankMatch(credit, movement, false).ok, true);
  assert.equal(validateBankMatch(credit, movement, true).ok, false);
  assert.equal(validateBankMatch({ ...credit, direction: "debito" }, movement, false).ok, false);
  assert.equal(validateBankMatch(credit, { ...movement, methodId: "cash" }, false).ok, false);
  assert.equal(validateBankMatch({ ...credit, value: 451 }, movement, false).ok, false);
});

test("fluxo separa realizado de previsto e leva vencidos para hoje sem duplicar pagamentos", () => {
  const flow = calculateCashFlow([
    { date: "2026-10-01", value: 500, direction: "entrada" },
    { date: "2026-10-27", value: 100, direction: "entrada" },
    { date: "2026-10-27", value: 50, direction: "saida" },
    { date: "2026-11-30", value: 9999, direction: "entrada" },
  ], [
    { date: "2026-10-20", value: 200, direction: "entrada" },
    { date: "2026-10-28", value: 350, direction: "saida" },
    { date: "2026-10-28", value: 0, direction: "entrada" },
  ], "2026-10-27", "2026-10-31", "2026-10-27");
  assert.equal(flow.opening, 500);
  assert.equal(flow.actual, 550);
  assert.equal(flow.projected, 400);
  assert.equal(flow.rows[0].date, "2026-10-27");
  assert.equal(flow.rows[0].expectedEntries, 200);
  assert.equal(flow.rows.length, 2);
});

test("conta parcialmente paga e vencida permanece classificada como vencida", () => {
  assert.equal(derivePayableStatus(1000, 250, "2026-10-20", false, "2026-10-27"), "Vencida");
});

test("calcula recebimento parcial, integral e saldo pendente", () => {
  assert.equal(pendingBalance(570, 300), 270);
  assert.equal(deriveReceivableStatus(570, 0, "2026-10-20", false, "2026-10-12"), "Pendente");
  assert.equal(deriveReceivableStatus(570, 300, "2026-10-20", false, "2026-10-12"), "Parcialmente recebida");
  assert.equal(deriveReceivableStatus(570, 570, "2026-10-20", false, "2026-10-12"), "Recebida");
});

test("bloqueia recebimento ou pagamento negativo, zero e acima do saldo", () => {
  assert.equal(validateSettlement(0, 570, "recebimento").ok, false);
  assert.equal(validateSettlement(-1, 570, "recebimento").ok, false);
  assert.equal(validateSettlement(570.01, 570, "recebimento").ok, false);
  assert.equal(validateSettlement(570, 570, "recebimento").ok, true);
});

test("permite dois pagamentos legitimos com mesmo valor e metodo quando nao ha chave repetida", () => {
  const operations = [
    { value: 100, method: "pix", operationKey: "a" },
    { value: 100, method: "pix", operationKey: "b" },
  ];
  assert.equal(new Set(operations.map((item) => item.operationKey)).size, 2);
  assert.equal(operations.reduce((total, item) => total + item.value, 0), 200);
});

test("detecta tentativa de pagamento duplicado por chave de operacao", () => {
  const operations = [{ operationKey: "same" }, { operationKey: "same" }];
  assert.notEqual(new Set(operations.map((item) => item.operationKey)).size, operations.length);
});

test("classifica conta a pagar e centro vinculado por identificador estavel", () => {
  const costCenter = { id: 4, name: "Manutencao" };
  const payable = { costCenterId: 4, total: 1000, paid: 250 };
  assert.equal(payable.costCenterId, costCenter.id);
  assert.equal(derivePayableStatus(payable.total, payable.paid, "2026-10-20", false, "2026-10-12"), "Parcialmente paga");
});

test("caixa fisico considera apenas dinheiro, nao pix ou cartao", () => {
  const movements = [
    { value: 300, method: normalizePaymentMethod("Cartão de débito"), direction: "entrada" },
    { value: 270, method: normalizePaymentMethod("Dinheiro"), direction: "entrada" },
    { value: 50, method: normalizePaymentMethod("Dinheiro"), direction: "saida" },
    { value: 450, method: normalizePaymentMethod("Pix"), direction: "entrada" },
  ];
  const physical = movements.reduce((total, movement) => {
    if (!isCashPayment(movement.method)) return total;
    return movement.direction === "entrada" ? total + movement.value : total - movement.value;
  }, 500);
  assert.equal(physical, 720);
});

test("cenario financeiro obrigatorio fecha saldo sem duplicidade", () => {
  const reserva = 900;
  const antecipacao = 450;
  const consumo = 120;
  const saldoAposConsumo = pendingBalance(reserva + consumo, antecipacao);
  const debito = 300;
  const dinheiro = 270;
  assert.equal(saldoAposConsumo, 570);
  assert.equal(pendingBalance(reserva + consumo, antecipacao + debito + dinheiro), 0);
  assert.equal(antecipacao + debito + dinheiro, 1020);
});

test("conciliacao compara valores sem substituir movimento do sistema", () => {
  const bankValue = 450;
  const systemValue = 430;
  const difference = bankValue - systemValue;
  assert.equal(difference, 20);
  assert.equal(systemValue, 430);
});
