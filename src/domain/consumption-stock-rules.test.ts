import test from "node:test";
import assert from "node:assert/strict";
import { applyStockMovement, canConsumeStock, canReverseConsumption, consumptionTotal, migrateStockCollections } from "./consumption-stock-rules.ts";

test("calcula quantidade vezes preço unitário e benefício sem cobrança", () => {
  assert.equal(consumptionTotal(3, 7.5), 22.5);
  assert.equal(consumptionTotal(3, 7.5, true), 0);
});
test("permite baixa com estoque suficiente e bloqueia quantidade inválida ou excedente", () => {
  assert.equal(canConsumeStock(5, 3), true);
  assert.equal(canConsumeStock(5, 6), false);
  assert.equal(canConsumeStock(5, 0), false);
});
test("baixa e estorno recompõem exatamente o estoque", () => {
  const afterConsumption = applyStockMovement(10, "Saída", 4);
  assert.equal(afterConsumption, 6);
  assert.equal(applyStockMovement(afterConsumption!, "Entrada", 4), 10);
  assert.equal(applyStockMovement(2, "Saída", 3), null);
});
test("bloqueia estorno duplicado e estorno após encerramento", () => {
  assert.equal(canReverseConsumption("Lançado", "Ativa"), true);
  assert.equal(canReverseConsumption("Estornado", "Ativa"), false);
  assert.equal(canReverseConsumption("Lançado", "Encerrada"), false);
});
test("migração preserva coleções existentes e inicializa dados legados sem duplicação", () => {
  const existing = [{ id: 9 }];
  assert.deepEqual(migrateStockCollections(existing, [], [{ id: 1 }]), { products: existing, movements: [] });
  assert.deepEqual(migrateStockCollections(undefined, undefined, [{ id: 1 }]), { products: [{ id: 1 }], movements: [] });
});
