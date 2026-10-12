export type OperationalRoomState = {
  occupancyStatus: "Livre" | "Ocupado";
  cleaningStatus: "Limpo" | "Sujo" | "Em limpeza";
  maintenanceStatus: "Disponível" | "Bloqueado";
};

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

export function validateCpf(value: string) {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = sum * 10 % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function countNights(entry: string, exit: string) {
  if (!entry || !exit) return 0;
  const start = new Date(`${entry}T12:00:00`);
  const end = new Date(`${exit}T12:00:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

export function periodsOverlap(firstEntry: string, firstExit: string, secondEntry: string, secondExit: string) {
  return firstEntry < secondExit && firstExit > secondEntry;
}

export function roomReadiness(state: OperationalRoomState) {
  if (state.occupancyStatus === "Ocupado") return { ready: false, reason: "ocupado" };
  if (state.cleaningStatus !== "Limpo") return { ready: false, reason: "sem liberação de limpeza" };
  if (state.maintenanceStatus === "Bloqueado") return { ready: false, reason: "bloqueado por manutenção" };
  return { ready: true, reason: "" };
}

export function financialBalance(baseValue: number, extrasValue: number, discounts: number, received: number) {
  const total = Math.max(0, baseValue + extrasValue - discounts);
  return { total, received, balance: Math.max(0, total - received) };
}
