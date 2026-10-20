import test from "node:test";
import assert from "node:assert/strict";
import { allocateBenefit, benefitLimitForStay, benefitMatches } from "./package-benefit-rules.ts";
test("cobre consumo dentro do limite", () => assert.deepEqual(allocateBenefit(2, 30, 2, 0), { coveredQuantity: 2, excessQuantity: 0, charge: 0 }));
test("cobra apenas excedente parcial ou total", () => { assert.deepEqual(allocateBenefit(3, 30, 2, 0), { coveredQuantity: 2, excessQuantity: 1, charge: 30 }); assert.deepEqual(allocateBenefit(2, 30, 2, 2), { coveredQuantity: 0, excessQuantity: 2, charge: 60 }); });
test("calcula limite por hospedagem e por diária", () => { assert.equal(benefitLimitForStay(2, "Por hospedagem", 3), 2); assert.equal(benefitLimitForStay(2, "Por diária", 3), 6); });
test("reconhece benefício por identificador estruturado", () => { const b = { active: true, kind: "Produto" as const, productId: 7 }; assert.equal(benefitMatches(b, { category: "Produto", productId: 7 }), true); assert.equal(benefitMatches(b, { category: "Produto", productId: 8 }), false); });
