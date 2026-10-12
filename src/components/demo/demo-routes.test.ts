import assert from "node:assert/strict";
import test from "node:test";
import { demoRoutes, guestJourneyRoute, hotelAdministrationRoute } from "./demo-routes.ts";

test("os dois roteiros operacionais são independentes", () => {
  assert.notEqual(guestJourneyRoute.id, hotelAdministrationRoute.id);
  assert.equal(guestJourneyRoute.steps.length, 18);
  assert.equal(hotelAdministrationRoute.steps.length, 15);
  assert.equal(Object.keys(demoRoutes).length, 2);
});

test("a primeira integração usa formulário real e confirmação posterior", () => {
  const first = guestJourneyRoute.steps[0];
  assert.equal(first.action.kind, "form-command");
  if (first.action.kind === "form-command") {
    assert.equal(first.action.target, "hospedes");
    assert.equal(first.action.command, "open-client-form");
  }
  assert.equal(first.inputData.email, "joao.demo@example.com");
  assert.equal(first.inputData.cpf, "012.345.678-90");
});

test("toda a Jornada B está operacional e a Entrega C continua bloqueada", () => {
  for (const step of guestJourneyRoute.steps) assert.notEqual(step.action.kind, "unavailable");
  for (const step of hotelAdministrationRoute.steps) {
    if (step.id === "admin-events") assert.equal(step.action.kind, "form-command");
    else assert.equal(step.action.kind, "unavailable");
  }
});

test("todos os passos possuem rastreabilidade e resultado esperado", () => {
  for (const route of Object.values(demoRoutes)) {
    for (const step of route.steps) {
      assert.ok(step.rfs.length > 0);
      assert.ok(step.process.length > 0);
      assert.ok(step.entities.length > 0);
      assert.ok(step.expectedResult.length > 0);
      assert.match(step.selector, /\[data-(tour-page|demo-target)="/);
    }
  }
});
