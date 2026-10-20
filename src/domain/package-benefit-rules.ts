export type BenefitLimitType = "Por hospedagem" | "Por diária";
export type Allocation = { coveredQuantity: number; excessQuantity: number; charge: number };

export function allocateBenefit(quantity: number, unitPrice: number, limit: number, used: number): Allocation {
  const available = Math.max(0, limit - used);
  const coveredQuantity = Math.min(quantity, available);
  const excessQuantity = quantity - coveredQuantity;
  return { coveredQuantity, excessQuantity, charge: excessQuantity * unitPrice };
}

export function benefitLimitForStay(quantityIncluded: number, limitType: BenefitLimitType, nights: number) {
  return quantityIncluded * (limitType === "Por diária" ? Math.max(1, nights) : 1);
}

export function benefitMatches(benefit: { active: boolean; kind: "Produto" | "Serviço"; productId?: number; serviceCode?: string }, consumption: { productId?: number; serviceCode?: string; category?: string }) {
  if (!benefit.active || benefit.kind !== consumption.category) return false;
  return benefit.kind === "Produto" ? benefit.productId === consumption.productId : Boolean(benefit.serviceCode && benefit.serviceCode === consumption.serviceCode);
}
