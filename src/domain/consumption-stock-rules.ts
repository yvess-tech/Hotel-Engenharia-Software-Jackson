export function consumptionTotal(quantity: number, unitPrice: number, includedInPackage = false) {
  return includedInPackage ? 0 : quantity * unitPrice;
}

export function canConsumeStock(available: number, quantity: number) {
  return Number.isFinite(available) && Number.isFinite(quantity) && quantity > 0 && quantity <= available;
}

export function applyStockMovement(current: number, type: "Entrada" | "Saída", quantity: number) {
  if (!Number.isFinite(current) || !Number.isFinite(quantity) || quantity <= 0) return null;
  if (type === "Saída" && quantity > current) return null;
  return current + (type === "Entrada" ? quantity : -quantity);
}

export function canReverseConsumption(status: string | undefined, stayStatus: string) {
  return status !== "Estornado" && stayStatus === "Ativa";
}

export function migrateStockCollections<T, M>(products: T[] | undefined, movements: M[] | undefined, defaults: T[]) {
  return { products: Array.isArray(products) ? products : structuredClone(defaults), movements: Array.isArray(movements) ? movements : [] as M[] };
}
