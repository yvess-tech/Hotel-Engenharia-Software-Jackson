export type EventStatus = "Planejado" | "Confirmado" | "Em andamento" | "Concluido" | "Cancelado";
export type RoomAvailabilityStatus = "Ativo" | "Inativo";

export type EventPeriod = {
  id?: number;
  roomId: number;
  start: string;
  end: string;
  status: EventStatus;
};

export type ContractedServiceLine = {
  quantity: number;
  contractedUnitPrice: number;
};

export function eventDurationHours(start: string, end: string) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  return Math.max(0, (endDate.getTime() - startDate.getTime()) / 3600000);
}

export function activeEventStatus(status: EventStatus) {
  return status !== "Cancelado";
}

export function eventPeriodsOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string) {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export function findRoomScheduleConflict(events: EventPeriod[], roomId: number, start: string, end: string, ignoredEventId?: number | null) {
  return events.find((event) =>
    event.id !== ignoredEventId &&
    event.roomId === roomId &&
    activeEventStatus(event.status) &&
    eventPeriodsOverlap(start, end, event.start, event.end)
  ) ?? null;
}

export function calculateRoomContractValue(start: string, end: string, hourlyRate: number) {
  return roundCurrency(eventDurationHours(start, end) * hourlyRate);
}

export function calculateServiceSubtotal(quantity: number, unitPrice: number) {
  return roundCurrency(quantity * unitPrice);
}

export function calculateServicesTotal(lines: ContractedServiceLine[]) {
  return roundCurrency(lines.reduce((total, line) => total + calculateServiceSubtotal(line.quantity, line.contractedUnitPrice), 0));
}

export function calculateEventTotal(roomValue: number, serviceValue: number, discount = 0) {
  return roundCurrency(Math.max(0, roomValue + serviceValue - discount));
}

export function validateEventPeriod(start: string, end: string) {
  if (!start || !end) return { ok: false, error: "Informe data e horario inicial e final." };
  if (eventDurationHours(start, end) <= 0) return { ok: false, error: "O fim do evento deve ser posterior ao inicio." };
  return { ok: true };
}

export function validateTimelineTimes(times: string[], start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return { ok: false, error: "Periodo do evento invalido." };
  const baseDate = start.slice(0, 10);
  for (const time of times) {
    if (!/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "Use horarios do cronograma no formato HH:mm." };
    let candidate = new Date(`${baseDate}T${time}`);
    if (candidate < startDate && end.slice(0, 10) > start.slice(0, 10)) candidate = new Date(`${end.slice(0, 10)}T${time}`);
    if (candidate < startDate || candidate > endDate) return { ok: false, error: `A atividade ${time} esta fora do periodo do evento.` };
  }
  return { ok: true };
}

export function canTransitionEventStatus(from: EventStatus, to: EventStatus) {
  if (from === to) return true;
  const allowed: Record<EventStatus, EventStatus[]> = {
    Planejado: ["Confirmado", "Cancelado"],
    Confirmado: ["Em andamento", "Cancelado"],
    "Em andamento": ["Concluido"],
    Concluido: [],
    Cancelado: [],
  };
  return allowed[from].includes(to);
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
