import test from "node:test";
import assert from "node:assert/strict";
import { hasRemainingStayRoomConflict, stayNavigationEvent } from "./stay-rules.ts";

test("bloqueia transferência para quarto reservado no período restante", () => {
  assert.equal(hasRemainingStayRoomConflict({ reservationId: 1, roomId: 9, remainingFrom: "2026-10-19", expectedExit: "2026-10-22", reservations: [{ id: 2, roomId: 9, entry: "2026-10-20", exit: "2026-10-23", status: "Confirmada" }] }), true);
});

test("aceita quarto sem conflito e ignora reserva cancelada", () => {
  assert.equal(hasRemainingStayRoomConflict({ reservationId: 1, roomId: 9, remainingFrom: "2026-10-19", expectedExit: "2026-10-22", reservations: [{ id: 2, roomId: 9, entry: "2026-10-20", exit: "2026-10-23", status: "Cancelada" }] }), false);
});

test("identifica o evento de navegação do gerenciamento recém-criado", () => {
  assert.deepEqual(stayNavigationEvent(18), { name: "hotel:open-stay", stayId: 18 });
});
