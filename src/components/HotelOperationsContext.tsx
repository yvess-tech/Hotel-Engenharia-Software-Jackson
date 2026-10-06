import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ReservationStatus = "Pendente" | "Confirmada" | "Hospedado" | "Concluída" | "Cancelada";
export type RoomStatus = "Livre" | "Ocupado" | "Em manutenção" | "Reservado";
export type ReceiptStatus = "Confirmado" | "Cancelado" | "Estornado";

export type RoomCategory = {
  id: number;
  name: string;
  description: string;
  capacity: number;
  rate: number;
  notes: string;
};

export type Room = {
  id: number;
  number: string;
  floor: string;
  category: string;
  capacity: number;
  status: RoomStatus;
  rate: number;
  notes: string;
  accessibility: boolean;
  view: string;
  bedType: string;
  balcony: boolean;
  minibar: boolean;
  airConditioning: boolean;
};

export type Reservation = {
  id: number;
  code: string;
  guest: string;
  entry: string;
  exit: string;
  category: string;
  roomId: number;
  guests: number;
  status: ReservationStatus;
  dailyRate: number;
  notes: string;
  audit?: string;
};

export type Receipt = {
  id: number;
  code: string;
  reservationId: number;
  date: string;
  value: number;
  method: string;
  status: ReceiptStatus;
  notes: string;
};

const initialCategories: RoomCategory[] = [
  { id: 1, name: "Standard", description: "Conforto essencial para até duas pessoas.", capacity: 2, rate: 250, notes: "" },
  { id: 2, name: "Luxo", description: "Quarto amplo com comodidades adicionais.", capacity: 3, rate: 450, notes: "Opção acessível disponível." },
  { id: 3, name: "Suíte", description: "Suíte espaçosa com vista panorâmica.", capacity: 4, rate: 800, notes: "" },
];

const initialRooms: Room[] = [
  { id: 1, number: "101", floor: "1", category: "Standard", capacity: 2, status: "Livre", rate: 250, notes: "Vista jardim", accessibility: false, view: "Jardim", bedType: "Casal", balcony: false, minibar: true, airConditioning: true },
  { id: 2, number: "102", floor: "1", category: "Standard", capacity: 2, status: "Livre", rate: 250, notes: "", accessibility: true, view: "Interna", bedType: "Solteiro", balcony: false, minibar: true, airConditioning: true },
  { id: 3, number: "205", floor: "2", category: "Luxo", capacity: 3, status: "Ocupado", rate: 450, notes: "Acessível", accessibility: true, view: "Floresta", bedType: "Queen", balcony: true, minibar: true, airConditioning: true },
  { id: 4, number: "312", floor: "3", category: "Suíte", capacity: 4, status: "Reservado", rate: 800, notes: "Vista panorâmica", accessibility: false, view: "Cânion", bedType: "King", balcony: true, minibar: true, airConditioning: true },
  { id: 5, number: "204", floor: "2", category: "Luxo", capacity: 2, status: "Em manutenção", rate: 450, notes: "Manutenção no encanamento", accessibility: false, view: "Floresta", bedType: "Queen", balcony: false, minibar: true, airConditioning: true },
  { id: 6, number: "407", floor: "4", category: "Standard", capacity: 2, status: "Livre", rate: 260, notes: "", accessibility: false, view: "Cidade", bedType: "Casal", balcony: false, minibar: true, airConditioning: true },
];

const initialReservations: Reservation[] = [
  { id: 1, code: "RES-1001", guest: "Maria Costa", entry: "2026-09-30", exit: "2026-10-03", category: "Suíte", roomId: 4, guests: 2, status: "Confirmada", dailyRate: 800, notes: "Chegada prevista às 14h." },
  { id: 2, code: "RES-1002", guest: "Pedro Lima", entry: "2026-09-27", exit: "2026-09-30", category: "Luxo", roomId: 3, guests: 1, status: "Hospedado", dailyRate: 450, notes: "" },
  { id: 3, code: "RES-1003", guest: "Ana Souza", entry: "2026-10-05", exit: "2026-10-08", category: "Standard", roomId: 1, guests: 2, status: "Pendente", dailyRate: 250, notes: "" },
  { id: 4, code: "RES-0998", guest: "João Silva", entry: "2026-09-20", exit: "2026-09-23", category: "Standard", roomId: 6, guests: 1, status: "Concluída", dailyRate: 260, notes: "" },
];

const initialReceipts: Receipt[] = [
  { id: 1, code: "REC-0201", reservationId: 1, date: "2026-09-25", value: 800, method: "PIX", status: "Confirmado", notes: "Sinal da reserva." },
  { id: 2, code: "REC-0202", reservationId: 2, date: "2026-09-27", value: 900, method: "Cartão de crédito", status: "Confirmado", notes: "Pagamento parcial." },
  { id: 3, code: "REC-0190", reservationId: 4, date: "2026-09-20", value: 780, method: "PIX", status: "Confirmado", notes: "" },
];

type OperationsContextValue = {
  rooms: Room[];
  categories: RoomCategory[];
  reservations: Reservation[];
  receipts: Receipt[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  setCategories: React.Dispatch<React.SetStateAction<RoomCategory[]>>;
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  cancelReservation: (id: number, reason: string) => void;
  checkIn: (reservationId: number) => void;
  checkOut: (reservationId: number) => void;
  activeReceiptsTotal: (reservationId: number) => number;
};

const OperationsContext = createContext<OperationsContextValue | null>(null);

export function HotelOperationsProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [categories, setCategories] = useState(initialCategories);
  const [reservations, setReservations] = useState(initialReservations);
  const [receipts, setReceipts] = useState(initialReceipts);

  const cancelReservation = (id: number, reason: string) => {
    const reservation = reservations.find((item) => item.id === id);
    if (!reservation) return;
    setReservations((current) => current.map((item) => item.id === id ? {
      ...item,
      status: "Cancelada",
      audit: `Cancelada por João Carlos em 30/09/2026 às 10:42. Motivo: ${reason}`,
    } : item));
    setRooms((current) => current.map((room) =>
      room.id === reservation.roomId && room.status !== "Ocupado" ? { ...room, status: "Livre" } : room
    ));
  };

  const checkIn = (reservationId: number) => {
    const reservation = reservations.find((item) => item.id === reservationId);
    if (!reservation) return;
    setReservations((current) => current.map((item) => item.id === reservationId ? { ...item, status: "Hospedado" } : item));
    setRooms((current) => current.map((room) => room.id === reservation.roomId ? { ...room, status: "Ocupado" } : room));
  };

  const checkOut = (reservationId: number) => {
    const reservation = reservations.find((item) => item.id === reservationId);
    if (!reservation) return;
    setReservations((current) => current.map((item) => item.id === reservationId ? {
      ...item,
      status: "Concluída",
      audit: "Check-out finalizado por João Carlos em 30/09/2026 às 11:18.",
    } : item));
    setRooms((current) => current.map((room) => room.id === reservation.roomId ? { ...room, status: "Livre" } : room));
  };

  const activeReceiptsTotal = (reservationId: number) => receipts
    .filter((item) => item.reservationId === reservationId && item.status === "Confirmado")
    .reduce((total, item) => total + item.value, 0);

  const value = useMemo(() => ({
    rooms,
    categories,
    reservations,
    receipts,
    setRooms,
    setCategories,
    setReservations,
    setReceipts,
    cancelReservation,
    checkIn,
    checkOut,
    activeReceiptsTotal,
  }), [rooms, categories, reservations, receipts]);

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useHotelOperations() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error("useHotelOperations must be used inside HotelOperationsProvider");
  return context;
}

export function countNights(entry: string, exit: string) {
  if (!entry || !exit) return 0;
  const start = new Date(`${entry}T12:00:00`);
  const end = new Date(`${exit}T12:00:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
