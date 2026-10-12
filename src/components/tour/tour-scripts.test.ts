import assert from "node:assert/strict";
import test from "node:test";
import { academicScript, currentModuleScript, stayScript } from "./tour-scripts.ts";

test("tour do sistema cobre as funcionalidades dos modulos", () => {
  assert.equal(academicScript.name, "Tour do Sistema de Hotel");
  assert.equal(academicScript.steps.length, 35);
  for (const module of ["Dashboard", "Hospedes", "Reservas", "Check-in", "Financeiro", "Relatorios"]) {
    assert.ok(academicScript.steps.some((step) => step.module === module));
  }
});

test("todas as etapas possuem seletor estavel, RFs, entidades e integracoes", () => {
  for (const step of [...academicScript.steps, ...stayScript.steps]) {
    assert.match(step.selector, /\[data-tour-page="/);
    assert.ok(step.rfs.length > 0);
    assert.ok(step.entities.length > 0);
    assert.ok(step.integrations.length > 0);
  }
});

test("roteiro operacional interno usa condicoes operacionais", () => {
  assert.equal(stayScript.steps.length, 11);
  assert.ok(stayScript.steps.some((step) => step.condition === "demo-active-stay"));
  assert.ok(stayScript.steps.some((step) => step.condition === "demo-paid"));
  assert.ok(stayScript.steps.some((step) => step.condition === "demo-cleaning-complete"));
});

test("roteiro do modulo atual preserva a pagina selecionada", () => {
  const script = currentModuleScript("financeiro");
  assert.equal(script.steps.length, 2);
  assert.ok(script.steps.every((step) => step.page === "financeiro"));
});
