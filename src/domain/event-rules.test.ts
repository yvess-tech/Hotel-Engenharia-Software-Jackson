import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateEventTotal,
  calculateRoomContractValue,
  calculateServicesTotal,
  canTransitionEventStatus,
  findRoomScheduleConflict,
  validateTimelineTimes,
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
