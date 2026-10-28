import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateEventTotal,
  calculateRoomContractValue,
  calculateServicesTotal,
  canTransitionEventStatus,
  findRoomScheduleConflict,
  validateTimelineTimes,
  eventFinancialSnapshot,
} from "./event-rules.ts";

test("calcula valores contratados de sala e servicos", () => {
  const roomValue = calculateRoomContractValue("2026-11-10T08:00", "2026-11-10T12:00", 300);
  const servicesValue = calculateServicesTotal([
    { quantity: 30, contractedUnitPrice: 25 },
    { quantity: 1, contractedUnitPrice: 150 },
  ]);

  assert.equal(roomValue, 1200);
  assert.equal(servicesValue, 900);
  assert.equal(calculateEventTotal(roomValue, servicesValue), 2100);
});

test("bloqueia conflito de sala apenas para eventos ativos", () => {
  const events = [
    { id: 1, roomId: 1, start: "2026-11-10T08:00", end: "2026-11-10T12:00", status: "Confirmado" as const },
    { id: 2, roomId: 1, start: "2026-11-10T14:00", end: "2026-11-10T16:00", status: "Cancelado" as const },
  ];

  assert.equal(findRoomScheduleConflict(events, 1, "2026-11-10T10:00", "2026-11-10T11:00")?.id, 1);
  assert.equal(findRoomScheduleConflict(events, 1, "2026-11-10T14:30", "2026-11-10T15:30"), null);
  assert.equal(findRoomScheduleConflict(events, 1, "2026-11-10T10:00", "2026-11-10T11:00", 1), null);
});

test("aceita eventos atravessando meia-noite e valida cronograma", () => {
  const result = validateTimelineTimes(["23:00", "01:00"], "2026-11-10T22:00", "2026-11-11T02:00");

  assert.equal(result.ok, true);
});

test("impede transicoes sem sentido", () => {
  assert.equal(canTransitionEventStatus("Planejado", "Confirmado"), true);
  assert.equal(canTransitionEventStatus("Cancelado", "Concluido"), false);
  assert.equal(canTransitionEventStatus("Concluido", "Em andamento"), false);
});

test("montagem e desmontagem bloqueiam a sala inclusive ao atravessar meia-noite", () => {
  const event = { id: 1, roomId: 1, start: "2026-11-10T23:00", end: "2026-11-11T01:00", status: "Confirmado" as const, setupMinutes: 30, teardownMinutes: 60 };
  assert.equal(findRoomScheduleConflict([event], 1, "2026-11-11T01:30", "2026-11-11T03:00")?.id, 1);
  assert.equal(findRoomScheduleConflict([event], 1, "2026-11-10T21:00", "2026-11-10T22:00", undefined, 0, 45)?.id, 1);
  assert.equal(findRoomScheduleConflict([event], 1, "2026-11-11T02:00", "2026-11-11T03:00"), null);
  assert.equal(findRoomScheduleConflict([{ ...event, status: "Cancelado" }], 1, "2026-11-10T23:00", "2026-11-11T01:00"), null);
});

test("cancelamento zera a obrigação e preserva apenas o recebido líquido após devolução", () => {
  const event = { status: "Cancelado" as const, totalContracted: 2100, billingType: "Separada", end: "2026-11-10T12:00", cancellation: { refunded: 400 } };
  const financials = eventFinancialSnapshot(event, 630, "2026-10-27");
  assert.equal(financials.balance, 0);
  assert.equal(financials.received, 230);
  assert.equal(financials.status, "Cancelada");
  assert.equal(eventFinancialSnapshot({ ...event, cancellation: undefined }, 630, "2026-10-27").balance, 0);
});

test("evento vinculado não apropria pagamentos nem duplica o saldo da hospedagem", () => {
  const event = { status: "Confirmado" as const, totalContracted: 500, billingType: "Vinculada a hospedagem", end: "2026-11-10T12:00" };
  const financials = eventFinancialSnapshot(event, 1000, "2026-10-27", 500);
  assert.equal(financials.received, 0);
  assert.equal(financials.balance, 0);
  assert.equal(financials.linkedBalance, 500);
  assert.equal(financials.status, "Na fatura da hospedagem");
});
