import assert from "node:assert/strict";
import test from "node:test";
import {
  countNights,
  financialBalance,
  periodsOverlap,
  roomReadiness,
  validateCpf,
} from "./hotel-rules.ts";

test("cenário C: detecta conflito e libera períodos não sobrepostos", () => {
  assert.equal(periodsOverlap("2027-01-10", "2027-01-13", "2027-01-12", "2027-01-15"), true);
  assert.equal(periodsOverlap("2027-01-10", "2027-01-13", "2027-01-13", "2027-01-15"), false);
});

test("cenário D e I: exige quarto livre, limpo e sem manutenção", () => {
  assert.equal(roomReadiness({ occupancyStatus: "Livre", cleaningStatus: "Limpo", maintenanceStatus: "Disponível" }).ready, true);
  assert.equal(roomReadiness({ occupancyStatus: "Ocupado", cleaningStatus: "Limpo", maintenanceStatus: "Disponível" }).ready, false);
  assert.equal(roomReadiness({ occupancyStatus: "Livre", cleaningStatus: "Sujo", maintenanceStatus: "Disponível" }).ready, false);
  assert.equal(roomReadiness({ occupancyStatus: "Livre", cleaningStatus: "Limpo", maintenanceStatus: "Bloqueado" }).ready, false);
});

test("cenário F: calcula saldo financeiro compartilhado", () => {
  assert.deepEqual(financialBalance(900, 120, 0, 450), { total: 1020, received: 450, balance: 570 });
  assert.deepEqual(financialBalance(900, 120, 0, 1020), { total: 1020, received: 1020, balance: 0 });
});

test("cenário H: valida CPF pelos dígitos verificadores", () => {
  assert.equal(validateCpf("529.982.247-25"), true);
  assert.equal(validateCpf("529.982.247-26"), false);
  assert.equal(validateCpf("111.111.111-11"), false);
});

test("calcula diárias sem depender da data atual", () => {
  assert.equal(countNights("2027-01-10", "2027-01-13"), 3);
  assert.equal(countNights("2027-01-10", "2027-01-10"), 0);
});
