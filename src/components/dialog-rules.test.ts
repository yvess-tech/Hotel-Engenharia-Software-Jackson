import test from "node:test"
import assert from "node:assert/strict"
import {
  createActivationGuard,
  dialogFocusBoundary,
  isDiscardAction,
} from "./dialog-rules.ts"

test("bloqueia ativação duplicada sem impedir outra ação nem uma tentativa posterior", () => {
  const save = {}
  const next = {}
  const allow = createActivationGuard()
  assert.equal(allow(save, 1000), true)
  assert.equal(allow(save, 1010), false)
  assert.equal(allow(save, 1400), true)
  assert.equal(allow(next, 1401), true)
})

test("proteção de descarte distingue fechar o formulário de navegar entre etapas", () => {
  for (const label of ["Cancelar", "Fechar", "Voltar"])
    assert.equal(isDiscardAction(label, "ghost"), true)
  for (const label of [
    "Anterior",
    "← Anterior",
    "Próximo →",
    "Salvar",
    "Excluir",
    "Adicionar benefício",
  ])
    assert.equal(isDiscardAction(label, "ghost"), false)
  assert.equal(isDiscardAction("Cancelar", "danger"), false)
})

test("Tab e Shift+Tab permanecem no diálogo e tratam ausência de campos focáveis", () => {
  const fields = ["close", "name", "save"]
  assert.equal(dialogFocusBoundary("save", fields, false), "close")
  assert.equal(dialogFocusBoundary("close", fields, true), "save")
  assert.equal(dialogFocusBoundary(null, fields, false), "close")
  assert.equal(dialogFocusBoundary(null, fields, true), "save")
  assert.equal(dialogFocusBoundary("name", fields, false), null)
  assert.equal(dialogFocusBoundary(null, [], false), null)
})
