import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAccessControl } from "../access-control";
import { roundMoney, validateRefund, validateBankMatch } from "../domain/financial-rules";
import {
  PAYMENT_METHODS,
  derivePayableStatus,
  deriveReceivableStatus,
  isCashPayment,
  normalizePaymentMethod,
  paymentMethodLabel,
  pendingBalance,
  validateSettlement,
  type PaymentMethodId,
} from "../domain/financial-rules";
import {
  calculateEventTotal,
  calculateRoomContractValue,
  calculateServiceSubtotal,
  calculateServicesTotal,
  canTransitionEventStatus,
  eventDurationHours,
  eventFinancialSnapshot,
  findRoomScheduleConflict,
  validateEventPeriod,
  validateTimelineTimes,
  type EventStatus,
} from "../domain/event-rules";
import { countNights, financialBalance, normalizeCpf, periodsOverlap, roomReadiness, validateCpf } from "../domain/hotel-rules";
import { hasRemainingStayRoomConflict } from "../domain/stay-rules";
import { applyStockMovement, canConsumeStock, canReverseConsumption, consumptionTotal, migrateStockCollections } from "../domain/consumption-stock-rules";
import { allocateBenefit, benefitLimitForStay, benefitMatches, type BenefitLimitType } from "../domain/package-benefit-rules";

export { countNights, normalizeCpf, validateCpf } from "../domain/hotel-rules";
export { PAYMENT_METHODS, derivePayableStatus, isCashPayment, paymentMethodLabel, pendingBalance } from "../domain/financial-rules";
export type { PaymentMethodId } from "../domain/financial-rules";

export type ReservationStatus = "Pendente" | "Confirmada" | "Hospedado" | "Concluída" | "Cancelada";
export type RoomStatus = "Livre" | "Ocupado" | "Em manutenção" | "Reservado";
export type OccupancyStatus = "Livre" | "Ocupado";
export type CleaningStatus = "Limpo" | "Sujo" | "Em limpeza";
export type MaintenanceStatus = "Disponível" | "Bloqueado";
export type ReceiptStatus = "Confirmado" | "Cancelado" | "Estornado";
export type ContractType = "Tarifa convencional" | "Pacote comercial";
export type PackagePriceRule = "Preço fechado" | "Por diária";
export const OPERATIONAL_SERVICES = ["Café da manhã", "Decoração especial", "Jantar romântico", "Trilha guiada", "Ingresso parque nacional", "Restaurante", "Frigobar", "Room Service", "Lavanderia", "Spa", "Transfer aeroporto", "Ceia especial"] as const;

export type PackageBenefit = { id: string; kind: "Produto" | "Serviço"; productId?: number; serviceCode?: string; label: string; description: string; quantityIncluded: number; unit: string; limitType: BenefitLimitType; excessRule: "Cobrar preço unitário"; active: boolean };

export type ConferenceRoomStatus = "Ativo" | "Inativo";
export type EventType = "Corporativo" | "Social";
export type EventBillingType = "Separada" | "Vinculada a hospedagem";
export type EventServiceStatus = "Ativo" | "Inativo";
export type { EventStatus } from "../domain/event-rules";

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
  scenarioKey?: string;
  number: string;
  floor: string;
  category: string;
  capacity: number;
  status: RoomStatus;
  occupancyStatus: OccupancyStatus;
  cleaningStatus: CleaningStatus;
  maintenanceStatus: MaintenanceStatus;
  rate: number;
  notes: string;
  accessibility: boolean;
  view: string;
  bedType: string;
  balcony: boolean;
  minibar: boolean;
  airConditioning: boolean;
};

export type ClientDocument = {
  name: string;
  type: string;
  date: string;
};

export type Client = {
  id: number;
  scenarioKey?: string;
  name: string;
  cpf: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  nationality: string;
  gender: string;
  postalCode: string;
  street: string;
  addressNumber: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  emergencyPhone: string;
  emergencyContact: string;
  preferredRoomType: string;
  preferredFloor: string;
  smoker: string;
  preferences: string;
  status: "Ativo" | "Inativo";
  documents: ClientDocument[];
};

export type CommercialPackage = {
  id: number;
  scenarioKey?: string;
  code: string;
  name: string;
  description: string;
  season: string;
  mealPlan: string;
  roomCategories: string[];
  minNights: number;
  maxNights: number;
  includedGuests: number;
  price: number;
  priceRule: PackagePriceRule;
  discountPercent: number;
  validFrom: string;
  validTo: string;
  benefits: string[];
  structuredBenefits?: PackageBenefit[];
  conditions: string;
  active: boolean;
};

export type PackageSnapshot = {
  packageId: number;
  code: string;
  name: string;
  description: string;
  mealPlan: string;
  priceRule: PackagePriceRule;
  basePrice: number;
  discountPercent: number;
  benefits: string[];
  structuredBenefits?: PackageBenefit[];
  conditions: string;
  contractedValue: number;
};

export type Reservation = {
  id: number;
  scenarioKey?: string;
  code: string;
  clientId: number;
  guest: string;
  companions: string[];
  entry: string;
  exit: string;
  category: string;
  roomId: number;
  guests: number;
  status: ReservationStatus;
  dailyRate: number;
  contractType: ContractType;
  contractedValue: number;
  roomTransferCharge?: number;
  packageId?: number;
  packageSnapshot?: PackageSnapshot;
  checkedInAt?: string;
  notes: string;
  audit?: string;
};

export type Receipt = {
  id: number;
  scenarioKey?: string;
  code: string;
  reservationId: number;
  date: string;
  value: number;
  method: string;
  status: ReceiptStatus;
  notes: string;
  stayId?: number;
  createdAt?: string;
  responsible?: string;
  methodId?: PaymentMethodId;
  operationKey?: string;
};

export type CostCenter = {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
};

export type PayablePayment = {
  id: number;
  payableId: number;
  date: string;
  value: number;
  methodId: PaymentMethodId;
  responsible: string;
  notes: string;
  createdAt: string;
  operationKey?: string;
};

export type PayableAccount = {
  id: number;
  code: string;
  description: string;
  supplier: string;
  category: string;
  costCenterId: number;
  originalValue: number;
  dueDate: string;
  notes: string;
  createdAt: string;
  canceledAt?: string;
  payments: PayablePayment[];
};

export type CashSession = {
  id: number;
  code: string;
  openedAt: string;
  responsible: string;
  openingCash: number;
  closedAt?: string;
  countedCash?: number;
  notes: string;
  shift?: "Manhã" | "Tarde" | "Noite";
  expectedCash?: number;
  difference?: number;
  openedBy?: { id: number; name: string };
  closedBy?: { id: number; name: string };
  closingNotes?: string;
};

export type CashMovement = {
  id: number;
  sessionId?: number;
  direction: "entrada" | "saida";
  date: string;
  createdAt: string;
  value: number;
  methodId: PaymentMethodId;
  source: "recebimento" | "pagamento" | "manual" | "devolucao_evento" | "estorno_recebimento";
  sourceId: number;
  description: string;
  responsible: string;
  notes: string;
};

export type BankTransaction = {
  id: number;
  date: string;
  description: string;
  value: number;
  direction: "credito" | "debito";
  matchedMovementId?: number;
  notes: string;
};

export type Consumption = {
  id: number;
  scenarioKey?: string;
  stayId: number;
  reservationId: number;
  service: string;
  description: string;
  value: number;
  createdAt: string;
  includedInPackage: boolean;
  originEventId?: number;
  category?: "Produto" | "Serviço";
  quantity?: number;
  unitPrice?: number;
  responsible?: string;
  status?: "Lançado" | "Estornado";
  reversedAt?: string;
  reversalReason?: string;
  productId?: number;
  serviceCode?: string;
  benefitId?: string;
  benefitCoveredQuantity?: number;
  excessQuantity?: number;
};

export type StockProduct = {
  id: number; code: string; name: string; category: string; unit: string; quantity: number;
  minimumStock: number; maximumStock: number; location: string; supplier: string; notes: string;
  status: "Ativo" | "Inativo"; createdAt: string; unitPrice?: number;
};

export type StockMovement = {
  id: number; productId: number; productName: string; type: "Entrada" | "Saída";
  quantity: number; responsible: string; notes: string; createdAt: string;
  source?: "Manual" | "Consumo" | "Estorno"; consumptionId?: number;
};

export type Stay = {
  id: number;
  scenarioKey?: string;
  code: string;
  reservationId: number;
  clientId: number;
  roomId: number;
  guest: string;
  companions: string[];
  expectedExit: string;
  checkedInAt: string;
  checkedOutAt?: string;
  status: "Ativa" | "Encerrada";
  origin?: "Reserva" | "Atendimento direto";
  history?: { at: string; type: string; description: string }[];
};

export type Invoice = {
  id: number;
  scenarioKey?: string;
  stayId: number;
  reservationId: number;
  baseValue: number;
  extrasValue: number;
  discounts: number;
  total: number;
  status: "Aberta" | "Quitada";
  updatedAt: string;
};

export type ConferenceRoom = {
  id: number;
  scenarioKey?: string;
  name: string;
  location: string;
  capacity: number;
  area: number;
  hourlyRate: number;
  resources: string;
  status: ConferenceRoomStatus;
};

export type EventService = {
  id: number;
  scenarioKey?: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  price: number;
  status: EventServiceStatus;
};

export type EventTimelineItem = {
  id: number;
  time: string;
  activity: string;
  responsible: string;
  notes: string;
};

export type ContractedEventService = {
  id: number;
  serviceId: number;
  serviceName: string;
  category: string;
  unit: string;
  quantity: number;
  contractedUnitPrice: number;
  subtotal: number;
};

export type EventRecord = {
  id: number;
  scenarioKey?: string;
  code: string;
  name: string;
  type: EventType;
  contractorClientId?: number;
  contractorName: string;
  contact: string;
  phone: string;
  email: string;
  guests: number;
  notes: string;
  roomId: number;
  roomName: string;
  roomHourlyRateContracted: number;
  durationHoursContracted: number;
  roomValueContracted: number;
  start: string;
  end: string;
  setupMinutes?: number;
  teardownMinutes?: number;
  services: ContractedEventService[];
  servicesValueContracted: number;
  discountValue: number;
  totalContracted: number;
  billingType: EventBillingType;
  linkedReservationId?: number;
  depositRequired?: boolean;
  depositPercent?: number;
  depositDueDate?: string;
  balanceDueDate?: string;
  cancellationPolicy?: string;
  status: EventStatus;
  createdAt: string;
  canceledAt?: string;
  financialNotes?: string;
  cancellation?: { received: number; refunded: number; retained: number; methodId?: PaymentMethodId; responsible: string; at: string };
  timeline: EventTimelineItem[];
};

export type EventReceipt = {
  id: number;
  scenarioKey?: string;
  code: string;
  eventId: number;
  date: string;
  value: number;
  method: string;
  status: ReceiptStatus;
  notes: string;
  createdAt: string;
  responsible: string;
  methodId: PaymentMethodId;
  operationKey?: string;
};

export type FiscalDocumentType = "NFS-e" | "Recibo";
export type FiscalDocumentStatus = "Emitida" | "Cancelada";

export type HotelFiscalProfile = {
  legalName: string;
  tradeName: string;
  document: string;
  municipalRegistration: string;
  taxRegime: string;
  address: string;
};

export type FiscalDocument = {
  id: number;
  scenarioKey?: string;
  type: FiscalDocumentType;
  number: string;
  recipient: string;
  recipientDocument: string;
  description: string;
  value: number;
  issueDate: string;
  status: FiscalDocumentStatus;
  origin: "Hospedagem" | "Evento" | "Manual";
  reservationId?: number;
  eventId?: number;
  createdAt: string;
  canceledAt?: string;
  cancelReason?: string;
  reissuedFromId?: number;
};

export type CommunicationChannel = "E-mail" | "SMS" | "WhatsApp";
export type CommunicationStatus = "Enviada" | "Pendente" | "Falha";
export type CommunicationNature = "Transacional" | "Promocional";

export type Communication = {
  id: number;
  scenarioKey?: string;
  code: string;
  type: string;
  recipient: string;
  destination: string;
  channel: CommunicationChannel;
  nature: CommunicationNature;
  subject: string;
  message: string;
  trigger: string;
  scheduledAt: string;
  status: CommunicationStatus;
  queued: boolean;
  attempts: number;
  provider: string;
  endpoint: string;
  createdAt: string;
  sentAt?: string;
  externalId?: string;
  error?: string;
  unsubscribeUrl?: string;
};

export type HousekeepingTask = {
  id: number;
  scenarioKey?: string;
  code: string;
  roomId: number;
  stayId: number;
  scheduledAt: string;
  priority: "Média" | "Alta" | "Urgente";
  status: "Pendente" | "Em andamento" | "Concluída";
  completedAt?: string;
  completedBy?: string;
  notes: string;
};

type CheckInPayload = {
  roomId: number;
  companions: string[];
  authorizeEarlyArrival: boolean;
};

type OperationResult = { ok: boolean; error?: string };

type ClientInput = Omit<Client, "id" | "status" | "documents"> & {
  documents?: ClientDocument[];
};

type ClientResult = OperationResult & { client?: Client };

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export const OVERDUE_INVOICE_POLICY = {
  graceDays: 0,
  lateFeePercent: 2,
  dailyInterestPercent: 0.033,
};

function invoiceLateCharges(baseTotal: number, dueDate: string, referenceDate = today()) {
  const due = new Date(`${dueDate}T12:00`);
  const reference = new Date(`${referenceDate}T12:00`);
  const delayedDays = Math.max(0, Math.floor((reference.getTime() - due.getTime()) / 86400000));
  if (delayedDays <= OVERDUE_INVOICE_POLICY.graceDays) return 0;
  const chargeableDays = delayedDays - OVERDUE_INVOICE_POLICY.graceDays;
  const fine = baseTotal * OVERDUE_INVOICE_POLICY.lateFeePercent / 100;
  const interest = baseTotal * OVERDUE_INVOICE_POLICY.dailyInterestPercent / 100 * chargeableDays;
  return Math.round((fine + interest + Number.EPSILON) * 100) / 100;
}

function relativeDate(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDate(date);
}

export const today = () => localDate();

export function deriveRoomStatus(room: Pick<Room, "occupancyStatus" | "maintenanceStatus">): RoomStatus {
  if (room.maintenanceStatus === "Bloqueado") return "Em manutenção";
  if (room.occupancyStatus === "Ocupado") return "Ocupado";
  return "Livre";
}

const initialClients: Client[] = [
  {
    id: 1, name: "Ana Souza", cpf: "529.982.247-25", documentType: "RG", documentNumber: "1234567",
    birthDate: "1990-04-15", nationality: "Brasileira", gender: "Feminino",
    postalCode: "76801-000", street: "Av. das Palmeiras", addressNumber: "100", complement: "",
    district: "Centro", city: "Porto Velho", state: "RO", email: "ana@email.com", phone: "(69) 99999-0001",
    emergencyPhone: "(69) 98888-9999", emergencyContact: "Carlos Souza", preferredRoomType: "Suíte",
    preferredFloor: "Alto", smoker: "Não", preferences: "Prefere cama queen", status: "Ativo",
    documents: [{ name: "RG digitalizado", type: "PDF", date: relativeDate(-20) }],
  },
  {
    id: 2, name: "Pedro Lima", cpf: "111.444.777-35", documentType: "Passaporte", documentNumber: "AB123456",
    birthDate: "1985-08-22", nationality: "Brasileira", gender: "Masculino",
    postalCode: "76820-000", street: "Rua do Comércio", addressNumber: "200", complement: "Apto 4",
    district: "Olaria", city: "Porto Velho", state: "RO", email: "pedro@email.com", phone: "(69) 98888-0002",
    emergencyPhone: "", emergencyContact: "", preferredRoomType: "Luxo", preferredFloor: "Qualquer",
    smoker: "Não", preferences: "", status: "Ativo", documents: [],
  },
  {
    id: 3, name: "Maria Costa", cpf: "935.411.347-80", documentType: "Passaporte", documentNumber: "PT789012",
    birthDate: "1978-12-03", nationality: "Portuguesa", gender: "Feminino",
    postalCode: "", street: "", addressNumber: "", complement: "", district: "", city: "Lisboa", state: "EX",
    email: "maria@email.com", phone: "(69) 97777-0003", emergencyPhone: "", emergencyContact: "",
    preferredRoomType: "Standard", preferredFloor: "Baixo", smoker: "Não", preferences: "Alérgica a plumas",
    status: "Ativo", documents: [{ name: "Passaporte", type: "JPG", date: relativeDate(-10) }],
  },
  {
    id: 4, name: "João Silva", cpf: "390.533.447-05", documentType: "RG", documentNumber: "7654321",
    birthDate: "1988-05-11", nationality: "Brasileira", gender: "Masculino",
    postalCode: "", street: "", addressNumber: "", complement: "", district: "", city: "Porto Velho", state: "RO",
    email: "joao@email.com", phone: "(69) 96666-0004", emergencyPhone: "", emergencyContact: "",
    preferredRoomType: "Standard", preferredFloor: "", smoker: "Não", preferences: "", status: "Ativo", documents: [],
  },
];

const initialCategories: RoomCategory[] = [
  { id: 1, name: "Standard", description: "Conforto essencial para até duas pessoas.", capacity: 2, rate: 250, notes: "" },
  { id: 2, name: "Luxo", description: "Quarto amplo com comodidades adicionais.", capacity: 3, rate: 450, notes: "Opção acessível disponível." },
  { id: 3, name: "Suíte", description: "Suíte espaçosa com vista panorâmica.", capacity: 4, rate: 800, notes: "" },
];

const initialRooms: Room[] = [
  { id: 1, number: "101", floor: "1", category: "Standard", capacity: 2, status: "Livre", occupancyStatus: "Livre", cleaningStatus: "Limpo", maintenanceStatus: "Disponível", rate: 250, notes: "Vista jardim", accessibility: false, view: "Jardim", bedType: "Casal", balcony: false, minibar: true, airConditioning: true },
  { id: 2, number: "102", floor: "1", category: "Standard", capacity: 2, status: "Livre", occupancyStatus: "Livre", cleaningStatus: "Limpo", maintenanceStatus: "Disponível", rate: 250, notes: "", accessibility: true, view: "Interna", bedType: "Solteiro", balcony: false, minibar: true, airConditioning: true },
  { id: 3, number: "205", floor: "2", category: "Luxo", capacity: 3, status: "Ocupado", occupancyStatus: "Ocupado", cleaningStatus: "Limpo", maintenanceStatus: "Disponível", rate: 450, notes: "Acessível", accessibility: true, view: "Floresta", bedType: "Queen", balcony: true, minibar: true, airConditioning: true },
  { id: 4, number: "312", floor: "3", category: "Suíte", capacity: 4, status: "Reservado", occupancyStatus: "Livre", cleaningStatus: "Limpo", maintenanceStatus: "Disponível", rate: 800, notes: "Vista panorâmica", accessibility: false, view: "Cânion", bedType: "King", balcony: true, minibar: true, airConditioning: true },
  { id: 5, number: "204", floor: "2", category: "Luxo", capacity: 2, status: "Em manutenção", occupancyStatus: "Livre", cleaningStatus: "Limpo", maintenanceStatus: "Bloqueado", rate: 450, notes: "Manutenção no encanamento", accessibility: false, view: "Floresta", bedType: "Queen", balcony: false, minibar: true, airConditioning: true },
  { id: 6, number: "407", floor: "4", category: "Standard", capacity: 2, status: "Livre", occupancyStatus: "Livre", cleaningStatus: "Limpo", maintenanceStatus: "Disponível", rate: 260, notes: "", accessibility: false, view: "Cidade", bedType: "Casal", balcony: false, minibar: true, airConditioning: true },
];

const initialStockProducts: StockProduct[] = [
  { id: 1, code: "LMP-001", name: "Sabonete", category: "Amenities", unit: "un", quantity: 12, minimumStock: 50, maximumStock: 300, location: "Dep. A1", supplier: "Distribuidora X", notes: "", status: "Ativo", createdAt: "2026-01-10", unitPrice: 0 },
  { id: 2, code: "LMP-002", name: "Detergente 1L", category: "Limpeza", unit: "L", quantity: 8, minimumStock: 15, maximumStock: 80, location: "Dep. A2", supplier: "Distribuidora X", notes: "", status: "Ativo", createdAt: "2026-01-10", unitPrice: 0 },
  { id: 3, code: "RDC-001", name: "Toalha de banho", category: "Roupas de cama", unit: "un", quantity: 80, minimumStock: 40, maximumStock: 200, location: "Dep. B1", supplier: "Têxteis Sul", notes: "", status: "Ativo", createdAt: "2026-01-15", unitPrice: 0 },
  { id: 4, code: "RDC-002", name: "Lençol solteiro", category: "Roupas de cama", unit: "un", quantity: 120, minimumStock: 60, maximumStock: 300, location: "Dep. B1", supplier: "Têxteis Sul", notes: "", status: "Ativo", createdAt: "2026-01-15", unitPrice: 0 },
  { id: 5, code: "BEB-001", name: "Água mineral 500ml", category: "Bebidas", unit: "cx", quantity: 30, minimumStock: 20, maximumStock: 100, location: "Dep. C1", supplier: "Bebidas RO", notes: "Cx c/ 12 un.", status: "Ativo", createdAt: "2026-02-01", unitPrice: 0 },
  { id: 6, code: "ALI-001", name: "Café em pó 500g", category: "Alimentos", unit: "kg", quantity: 6, minimumStock: 10, maximumStock: 40, location: "Dep. C2", supplier: "Café Seleção", notes: "", status: "Ativo", createdAt: "2026-02-01", unitPrice: 0 },
  { id: 7, code: "MAN-001", name: "Lâmpada LED 9W", category: "Manutenção", unit: "un", quantity: 25, minimumStock: 20, maximumStock: 100, location: "Dep. D1", supplier: "Elétrica Norte", notes: "", status: "Ativo", createdAt: "2026-03-05", unitPrice: 0 },
  { id: 8, code: "AME-001", name: "Shampoo 30ml", category: "Amenities", unit: "un", quantity: 45, minimumStock: 80, maximumStock: 400, location: "Dep. A1", supplier: "Distribuidora X", notes: "Frasco individual", status: "Ativo", createdAt: "2026-01-10", unitPrice: 0 },
];

const initialPackages: CommercialPackage[] = [
  {
    id: 1, code: "PAC-001", name: "Pacote Romântico",
    description: "Duas noites para casal com experiência especial.",
    season: "Ano inteiro", mealPlan: "Café da manhã", roomCategories: ["Suíte"],
    minNights: 2, maxNights: 2, includedGuests: 2, price: 850,
    priceRule: "Preço fechado", discountPercent: 0,
    validFrom: relativeDate(-180), validTo: relativeDate(365),
    benefits: ["Café da manhã", "Decoração especial", "Jantar romântico"],
    conditions: "Válido para duas pessoas e duas diárias.", active: true,
  },
  {
    id: 2, code: "PAC-002", name: "Família Aventura",
    description: "Estadia para famílias com atividades na natureza.",
    season: "Baixa temporada", mealPlan: "Meia pensão", roomCategories: ["Luxo"],
    minNights: 3, maxNights: 7, includedGuests: 3, price: 620,
    priceRule: "Por diária", discountPercent: 10,
    validFrom: relativeDate(-90), validTo: relativeDate(180),
    benefits: ["Café da manhã", "Trilha guiada", "Ingresso parque nacional"],
    conditions: "Atividades sujeitas às condições climáticas.", active: true,
  },
  {
    id: 3, code: "PAC-003", name: "Réveillon Pacaás",
    description: "Programação especial de fim de ano.",
    season: "Fim de ano", mealPlan: "Pensão completa", roomCategories: ["Standard", "Luxo"],
    minNights: 3, maxNights: 5, includedGuests: 2, price: 3200,
    priceRule: "Preço fechado", discountPercent: 0,
    validFrom: relativeDate(200), validTo: relativeDate(240),
    benefits: ["Transfer aeroporto", "Ceia especial"],
    conditions: "Não reembolsável.", active: true,
  },
];

function snapshotFor(commercialPackage: CommercialPackage, nights: number): PackageSnapshot {
  const multiplier = commercialPackage.priceRule === "Por diária" ? nights : 1;
  const gross = commercialPackage.price * multiplier;
  const contractedValue = gross * (1 - commercialPackage.discountPercent / 100);
  return {
    packageId: commercialPackage.id,
    code: commercialPackage.code,
    name: commercialPackage.name,
    description: commercialPackage.description,
    mealPlan: commercialPackage.mealPlan,
    priceRule: commercialPackage.priceRule,
    basePrice: commercialPackage.price,
    discountPercent: commercialPackage.discountPercent,
    benefits: [...commercialPackage.benefits],
    structuredBenefits: commercialPackage.structuredBenefits ? structuredClone(commercialPackage.structuredBenefits) : undefined,
    conditions: commercialPackage.conditions,
    contractedValue,
  };
}

const romanticSnapshot = snapshotFor(initialPackages[0], 2);

const initialReservations: Reservation[] = [
  { id: 1, code: "RES-1001", clientId: 3, guest: "Maria Costa", companions: ["Rafael Costa"], entry: relativeDate(0), exit: relativeDate(2), category: "Suíte", roomId: 4, guests: 2, status: "Confirmada", dailyRate: 800, contractType: "Pacote comercial", contractedValue: romanticSnapshot.contractedValue, packageId: 1, packageSnapshot: romanticSnapshot, notes: "Chegada prevista às 14h." },
  { id: 2, code: "RES-1002", clientId: 2, guest: "Pedro Lima", companions: [], entry: relativeDate(-2), exit: relativeDate(1), category: "Luxo", roomId: 3, guests: 1, status: "Hospedado", dailyRate: 450, contractType: "Tarifa convencional", contractedValue: 1350, checkedInAt: `${relativeDate(-2)}T14:10`, notes: "" },
  { id: 3, code: "RES-1003", clientId: 1, guest: "Ana Souza", companions: ["Paulo Souza"], entry: relativeDate(5), exit: relativeDate(8), category: "Standard", roomId: 1, guests: 2, status: "Confirmada", dailyRate: 250, contractType: "Tarifa convencional", contractedValue: 750, notes: "" },
  { id: 4, code: "RES-0998", clientId: 4, guest: "João Silva", companions: [], entry: relativeDate(-10), exit: relativeDate(-7), category: "Standard", roomId: 6, guests: 1, status: "Concluída", dailyRate: 260, contractType: "Tarifa convencional", contractedValue: 780, checkedInAt: `${relativeDate(-10)}T14:05`, notes: "", audit: "Check-out finalizado." },
];

const initialReceipts: Receipt[] = [
  { id: 1, code: "REC-0201", reservationId: 1, date: relativeDate(-5), value: 300, method: "Pix", methodId: "pix", status: "Confirmado", notes: "Sinal da reserva." },
  { id: 2, code: "REC-0202", reservationId: 2, date: relativeDate(-2), value: 900, method: "Cartao de credito", methodId: "credit_card", status: "Confirmado", notes: "Pagamento parcial." },
  { id: 3, code: "REC-0190", reservationId: 4, date: relativeDate(-10), value: 780, method: "Pix", methodId: "pix", status: "Confirmado", notes: "" },
];

const initialConsumptions: Consumption[] = [
  { id: 1, stayId: 1, reservationId: 2, service: "Frigobar", description: "Água mineral", value: 30, createdAt: new Date().toISOString(), includedInPackage: false },
];

const initialStays: Stay[] = [
  { id: 1, code: "HOS-1002", reservationId: 2, clientId: 2, roomId: 3, guest: "Pedro Lima", companions: [], expectedExit: relativeDate(1), checkedInAt: `${relativeDate(-2)}T14:10`, status: "Ativa" },
  { id: 2, code: "HOS-0998", reservationId: 4, clientId: 4, roomId: 6, guest: "João Silva", companions: [], expectedExit: relativeDate(-7), checkedInAt: `${relativeDate(-10)}T14:05`, checkedOutAt: `${relativeDate(-7)}T11:00`, status: "Encerrada" },
];

const initialInvoices: Invoice[] = [
  { id: 1, stayId: 1, reservationId: 2, baseValue: 1350, extrasValue: 30, discounts: 0, total: 1380, status: "Aberta", updatedAt: new Date().toISOString() },
  { id: 2, stayId: 2, reservationId: 4, baseValue: 780, extrasValue: 0, discounts: 0, total: 780, status: "Quitada", updatedAt: `${relativeDate(-7)}T11:00` },
];

const initialCostCenters: CostCenter[] = [
  { id: 1, code: "CC-001", name: "Hospedagem", description: "Receitas e despesas de diarias, reservas e hospedagens.", active: true },
  { id: 2, code: "CC-002", name: "Restaurante", description: "Consumos e insumos de alimentos e bebidas.", active: true },
  { id: 3, code: "CC-003", name: "Eventos", description: "Receitas e despesas de eventos.", active: true },
  { id: 4, code: "CC-004", name: "Manutencao", description: "Reparos e infraestrutura.", active: true },
  { id: 5, code: "CC-005", name: "Administracao", description: "Despesas administrativas e gerais.", active: true },
];

const initialPayables: PayableAccount[] = [
  {
    id: 1,
    code: "PAG-0001",
    description: "Fornecedor lavanderia",
    supplier: "Lavanderia Brilho",
    category: "Servicos operacionais",
    costCenterId: 1,
    originalValue: 1200,
    dueDate: relativeDate(10),
    notes: "",
    createdAt: `${relativeDate(-3)}T09:00`,
    payments: [],
  },
  {
    id: 2,
    code: "PAG-0002",
    description: "Internet fibra",
    supplier: "Operadora empresarial",
    category: "Administrativo",
    costCenterId: 5,
    originalValue: 580,
    dueDate: relativeDate(-2),
    notes: "Conta demonstrativa ja quitada.",
    createdAt: `${relativeDate(-20)}T09:00`,
    payments: [{
      id: 1,
      payableId: 2,
      date: relativeDate(-2),
      value: 580,
      methodId: "bank_transfer",
      responsible: "Administracao",
      notes: "",
      createdAt: `${relativeDate(-2)}T10:00`,
      operationKey: "seed-payable-2",
    }],
  },
];

const initialCashSessions: CashSession[] = [
  { id: 1, code: "CX-0001", openedAt: `${today()}T08:00`, responsible: "Recepcao", openingCash: 500, notes: "Caixa demonstrativo aberto." },
];

const initialCashMovements: CashMovement[] = [];
const initialBankTransactions: BankTransaction[] = [];

const initialConferenceRooms: ConferenceRoom[] = [
  { id: 1, name: "Sala A", location: "Terreo", capacity: 50, area: 82, hourlyRate: 300, resources: "Projetor, tela, audio e Wi-Fi", status: "Ativo" },
  { id: 2, name: "Sala B", location: "1o andar", capacity: 30, area: 48, hourlyRate: 240, resources: "TV 65, videoconferencia e Wi-Fi", status: "Ativo" },
  { id: 3, name: "Salao Principal", location: "Terreo", capacity: 200, area: 310, hourlyRate: 950, resources: "Palco, audio, iluminacao e camarim", status: "Ativo" },
  { id: 4, name: "Sala Jatoba", location: "2o andar", capacity: 16, area: 32, hourlyRate: 180, resources: "TV 55 e videoconferencia", status: "Inativo" },
];

const initialEventServices: EventService[] = [
  { id: 1, name: "Coffee break", category: "Coffee break", description: "Cafe, sucos, frutas, bolos e salgados.", unit: "por pessoa", price: 25, status: "Ativo" },
  { id: 2, name: "Projetor", category: "Equipamentos", description: "Projetor Full HD, tela e cabeamento.", unit: "por evento", price: 150, status: "Ativo" },
  { id: 3, name: "Decoracao social", category: "Decoracao", description: "Arranjos, toalhas e composicao de mesa.", unit: "por evento", price: 1800, status: "Ativo" },
  { id: 4, name: "Equipe de apoio", category: "Equipe de apoio", description: "Apoio operacional durante o evento.", unit: "por hora", price: 120, status: "Ativo" },
];

const initialEvents: EventRecord[] = [
  {
    id: 1,
    code: "EVT-0206",
    name: "Conferencia Tech 2026",
    type: "Corporativo",
    contractorName: "Norte Tecnologia",
    contact: "Marcos Vieira",
    email: "eventos@nortetec.com.br",
    phone: "(69) 99210-3300",
    roomId: 1,
    roomName: "Sala A",
    roomHourlyRateContracted: 300,
    durationHoursContracted: 9,
    roomValueContracted: 2700,
    start: "2026-09-20T09:00",
    end: "2026-09-20T18:00",
    guests: 45,
    notes: "Montagem disponivel a partir das 07h.",
    services: [
      { id: 1, serviceId: 1, serviceName: "Coffee break", category: "Coffee break", unit: "por pessoa", quantity: 45, contractedUnitPrice: 25, subtotal: 1125 },
      { id: 2, serviceId: 2, serviceName: "Projetor", category: "Equipamentos", unit: "por evento", quantity: 1, contractedUnitPrice: 150, subtotal: 150 },
      { id: 3, serviceId: 4, serviceName: "Equipe de apoio", category: "Equipe de apoio", unit: "por hora", quantity: 9, contractedUnitPrice: 120, subtotal: 1080 },
    ],
    servicesValueContracted: 2355,
    discountValue: 0,
    totalContracted: 5055,
    billingType: "Vinculada a hospedagem",
    linkedReservationId: 1,
    status: "Confirmado",
    createdAt: "2026-07-12T10:20",
    timeline: [
      { id: 1, time: "07:00", activity: "Montagem e teste de equipamentos", responsible: "Equipe tecnica", notes: "" },
      { id: 2, time: "08:30", activity: "Credenciamento", responsible: "Recepcao", notes: "" },
      { id: 3, time: "09:00", activity: "Abertura da conferencia", responsible: "Organizador", notes: "" },
      { id: 4, time: "10:30", activity: "Coffee break", responsible: "A&B", notes: "" },
      { id: 5, time: "18:00", activity: "Encerramento e desmontagem", responsible: "Equipe tecnica", notes: "" },
    ],
  },
  {
    id: 2,
    code: "EVT-0207",
    name: "Casamento Silva & Costa",
    type: "Social",
    contractorName: "Ana Silva",
    contact: "Ana Silva",
    email: "ana.silva@email.com",
    phone: "(69) 99814-2210",
    roomId: 3,
    roomName: "Salao Principal",
    roomHourlyRateContracted: 950,
    durationHoursContracted: 10,
    roomValueContracted: 9500,
    start: "2026-10-05T16:00",
    end: "2026-10-06T02:00",
    guests: 180,
    notes: "Cerimonia e recepcao no mesmo espaco.",
    services: [
      { id: 4, serviceId: 1, serviceName: "Coffee break", category: "Coffee break", unit: "por pessoa", quantity: 180, contractedUnitPrice: 25, subtotal: 4500 },
      { id: 5, serviceId: 3, serviceName: "Decoracao social", category: "Decoracao", unit: "por evento", quantity: 1, contractedUnitPrice: 1800, subtotal: 1800 },
    ],
    servicesValueContracted: 6300,
    discountValue: 0,
    totalContracted: 15800,
    billingType: "Separada",
    status: "Planejado",
    createdAt: "2026-08-03T14:10",
    timeline: [
      { id: 6, time: "16:00", activity: "Cerimonia", responsible: "Cerimonial", notes: "" },
      { id: 7, time: "18:00", activity: "Jantar", responsible: "A&B", notes: "" },
      { id: 8, time: "02:00", activity: "Encerramento", responsible: "Cerimonial", notes: "" },
    ],
  },
];
const initialEventReceipts: EventReceipt[] = [];

const initialFiscalProfile: HotelFiscalProfile = {
  legalName: "Hotel Pacaas Novos LTDA",
  tradeName: "Hotel Pacaas Novos",
  document: "12.345.678/0001-90",
  municipalRegistration: "987654",
  taxRegime: "Simples Nacional",
  address: "Av. das Palmeiras, 1000 - Porto Velho/RO",
};

const initialFiscalDocuments: FiscalDocument[] = [
  { id: 1, type: "NFS-e", number: "NFS-0001", recipient: "Maria Costa", recipientDocument: "935.411.347-80", description: "Hospedagem Pacote Romantico - RES-1001", value: 850, issueDate: relativeDate(-1), status: "Emitida", origin: "Hospedagem", reservationId: 1, createdAt: `${relativeDate(-1)}T10:00` },
  { id: 2, type: "Recibo", number: "REC-FIS-0001", recipient: "Pedro Lima", recipientDocument: "111.444.777-35", description: "Recebimento parcial da reserva RES-1002", value: 900, issueDate: relativeDate(-2), status: "Emitida", origin: "Hospedagem", reservationId: 2, createdAt: `${relativeDate(-2)}T10:20` },
];

const initialCommunications: Communication[] = [
  { id: 1, code: "COM-0418", type: "Confirmacao de reserva", recipient: "Ana Souza", destination: "ana@email.com", channel: "E-mail", nature: "Transacional", subject: "Sua reserva no Hotel Pacaas Novos esta confirmada", message: "Ola, Ana. Sua reserva RES-1003 esta confirmada.", trigger: "Reserva confirmada - RES-1003", scheduledAt: `${relativeDate(-1)}T10:00`, status: "Enviada", queued: false, attempts: 1, provider: "SendGrid", endpoint: "/v3/mail/send", createdAt: `${relativeDate(-1)}T09:59`, sentAt: `${relativeDate(-1)}T10:00`, externalId: "sg_92f1a4e7" },
  { id: 2, code: "COM-0419", type: "Lembrete de check-in", recipient: "Maria Costa", destination: "+5569992104480", channel: "SMS", nature: "Transacional", subject: "Seu check-in esta proximo", message: "Ola, Maria. Seu check-in sera em breve.", trigger: "24 horas antes do check-in - RES-1001", scheduledAt: `${today()}T18:00`, status: "Pendente", queued: true, attempts: 0, provider: "Infobip", endpoint: "/sms/2/text/advanced", createdAt: `${today()}T10:05` },
  { id: 3, code: "COM-0411", type: "Oferta personalizada", recipient: "Pedro Lima", destination: "+5569998702241", channel: "WhatsApp", nature: "Promocional", subject: "Uma oferta especial para sua proxima estadia", message: "Ola, Pedro. Preparamos uma condicao especial para sua proxima visita.", trigger: "Campanha hospedes recorrentes", scheduledAt: `${relativeDate(-2)}T09:00`, status: "Falha", queued: false, attempts: 3, provider: "n8n", endpoint: "/webhook/hotel-whatsapp", createdAt: `${relativeDate(-2)}T08:55`, error: "Webhook retornou HTTP 502.", unsubscribeUrl: "https://hotel.example/descadastro/tk_0411" },
];

const STORAGE_KEY = "hotel-prototype-state-v1";
const STORAGE_VERSION = 1;

type StoredOperations = {
  version: number;
  clients: Client[];
  rooms: Room[];
  categories: RoomCategory[];
  reservations: Reservation[];
  receipts: Receipt[];
  packages: CommercialPackage[];
  consumptions: Consumption[];
  stays: Stay[];
  invoices: Invoice[];
  housekeepingTasks: HousekeepingTask[];
  payables: PayableAccount[];
  costCenters: CostCenter[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  bankTransactions: BankTransaction[];
  products: StockProduct[];
  stockMovements: StockMovement[];
  conferenceRooms: ConferenceRoom[];
  eventServices: EventService[];
  events: EventRecord[];
  eventReceipts: EventReceipt[];
  fiscalProfile: HotelFiscalProfile;
  fiscalDocuments: FiscalDocument[];
  communications: Communication[];
};

function demonstrationState(): StoredOperations {
  return {
    version: STORAGE_VERSION,
    clients: structuredClone(initialClients),
    rooms: structuredClone(initialRooms),
    categories: structuredClone(initialCategories),
    reservations: structuredClone(initialReservations),
    receipts: structuredClone(initialReceipts),
    packages: structuredClone(initialPackages),
    consumptions: structuredClone(initialConsumptions),
    stays: structuredClone(initialStays),
    invoices: structuredClone(initialInvoices),
    housekeepingTasks: [],
    payables: structuredClone(initialPayables),
    costCenters: structuredClone(initialCostCenters),
    cashSessions: structuredClone(initialCashSessions),
    cashMovements: structuredClone(initialCashMovements),
    bankTransactions: structuredClone(initialBankTransactions),
    conferenceRooms: structuredClone(initialConferenceRooms),
    eventServices: structuredClone(initialEventServices),
    events: structuredClone(initialEvents),
    eventReceipts: structuredClone(initialEventReceipts),
    fiscalProfile: structuredClone(initialFiscalProfile),
    fiscalDocuments: structuredClone(initialFiscalDocuments),
    communications: structuredClone(initialCommunications),
    products: structuredClone(initialStockProducts),
    stockMovements: [],
  };
}

function migrateRelationships(state: StoredOperations) {
  const stock = migrateStockCollections(state.products, state.stockMovements, initialStockProducts);
  state.products = stock.products;
  state.stockMovements = stock.movements;
  const nameCounts = new Map<string, Client[]>();
  state.clients.forEach((client) => nameCounts.set(client.name.toLocaleLowerCase("pt-BR"), [...(nameCounts.get(client.name.toLocaleLowerCase("pt-BR")) ?? []), client]));
  state.reservations = state.reservations.map((reservation) => {
    if (reservation.clientId && state.clients.some((client) => client.id === reservation.clientId)) return reservation;
    const matches = nameCounts.get(reservation.guest.toLocaleLowerCase("pt-BR")) ?? [];
    return matches.length === 1 ? { ...reservation, clientId: matches[0].id } : reservation;
  }).filter((reservation) => Boolean(reservation.clientId));
  state.stays = state.stays.map((stay) => {
    if (stay.clientId && state.clients.some((client) => client.id === stay.clientId)) return stay;
    const reservation = state.reservations.find((item) => item.id === stay.reservationId);
    return reservation ? { ...stay, clientId: reservation.clientId } : stay;
  }).filter((stay) => Boolean(stay.clientId));
  state.consumptions = state.consumptions.map((consumption) => {
    if (consumption.stayId && state.stays.some((stay) => stay.id === consumption.stayId)) return consumption;
    const stay = state.stays.find((item) => item.reservationId === consumption.reservationId);
    return stay ? { ...consumption, stayId: stay.id } : consumption;
  }).filter((consumption) => Boolean(consumption.stayId));
  state.receipts = state.receipts.map((receipt) => {
    const methodId = receipt.methodId ?? normalizePaymentMethod(receipt.method);
    return { ...receipt, methodId, method: paymentMethodLabel(methodId) };
  });
  return state;
}

function loadStoredOperations(): StoredOperations {
  if (typeof window === "undefined") return demonstrationState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return demonstrationState();
    const parsed = JSON.parse(raw) as Partial<StoredOperations>;
    const required = [parsed.clients, parsed.rooms, parsed.categories, parsed.reservations, parsed.receipts, parsed.packages, parsed.consumptions, parsed.stays];
    if (parsed.version !== STORAGE_VERSION || required.some((value) => !Array.isArray(value))) return demonstrationState();
    return migrateRelationships({
      ...demonstrationState(),
      ...parsed,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      housekeepingTasks: Array.isArray(parsed.housekeepingTasks) ? parsed.housekeepingTasks : [],
      payables: Array.isArray(parsed.payables) ? parsed.payables : structuredClone(initialPayables),
      costCenters: Array.isArray(parsed.costCenters) ? parsed.costCenters : structuredClone(initialCostCenters),
      cashSessions: Array.isArray(parsed.cashSessions) ? parsed.cashSessions : structuredClone(initialCashSessions),
      cashMovements: Array.isArray(parsed.cashMovements) ? parsed.cashMovements : structuredClone(initialCashMovements),
      bankTransactions: Array.isArray(parsed.bankTransactions) ? parsed.bankTransactions : structuredClone(initialBankTransactions),
      conferenceRooms: Array.isArray(parsed.conferenceRooms) ? parsed.conferenceRooms : structuredClone(initialConferenceRooms),
      eventServices: Array.isArray(parsed.eventServices) ? parsed.eventServices : structuredClone(initialEventServices),
      events: Array.isArray(parsed.events) ? parsed.events : structuredClone(initialEvents),
      eventReceipts: Array.isArray(parsed.eventReceipts) ? parsed.eventReceipts : structuredClone(initialEventReceipts),
      fiscalProfile: parsed.fiscalProfile ?? structuredClone(initialFiscalProfile),
      fiscalDocuments: Array.isArray(parsed.fiscalDocuments) ? parsed.fiscalDocuments : structuredClone(initialFiscalDocuments),
      communications: Array.isArray(parsed.communications) ? parsed.communications : structuredClone(initialCommunications),
      products: Array.isArray(parsed.products) ? parsed.products : structuredClone(initialStockProducts),
      stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
    } as StoredOperations);
  } catch {
    return demonstrationState();
  }
}

type OperationsContextValue = {
  conferenceRooms: ConferenceRoom[];
  eventServices: EventService[];
  events: EventRecord[];
  eventReceipts: EventReceipt[];
  fiscalProfile: HotelFiscalProfile;
  fiscalDocuments: FiscalDocument[];
  communications: Communication[];
  products: StockProduct[];
  stockMovements: StockMovement[];
  clients: Client[];
  rooms: Room[];
  categories: RoomCategory[];
  reservations: Reservation[];
  receipts: Receipt[];
  packages: CommercialPackage[];
  consumptions: Consumption[];
  stays: Stay[];
  housekeepingTasks: HousekeepingTask[];
  invoices: Invoice[];
  payables: PayableAccount[];
  costCenters: CostCenter[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  bankTransactions: BankTransaction[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  setCategories: React.Dispatch<React.SetStateAction<RoomCategory[]>>;
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  setPackages: React.Dispatch<React.SetStateAction<CommercialPackage[]>>;
  setConsumptions: React.Dispatch<React.SetStateAction<Consumption[]>>;
  saveProduct: (input: Omit<StockProduct, "id" | "createdAt"> & { id?: number }) => OperationResult;
  changeProductStock: (input: { productId: number; type: "Entrada" | "Saída"; quantity: number; responsible: string; notes: string }) => OperationResult;
  createClient: (input: ClientInput) => ClientResult;
  updateClient: (id: number, input: ClientInput) => ClientResult;
  recordConsumption: (input: Omit<Consumption, "id" | "createdAt">) => OperationResult;
  reverseConsumption: (consumptionId: number, reason: string, responsible: string) => OperationResult;
  registerReceipt: (input: { reservationId: number; value: number; method: string; notes: string; responsible: string; scenarioKey?: string; date?: string; operationKey?: string }) => OperationResult;
  changeReceiptStatus: (receiptId: number, status: Exclude<ReceiptStatus, "Confirmado">, responsible: string) => OperationResult;
  cancelReservation: (id: number, reason: string) => void;
  checkIn: (reservationId: number, payload: CheckInPayload) => OperationResult & { stayId?: number };
  walkInCheckIn: (input: { clientId: number; companions: string[]; entry: string; exit: string; roomId: number; guests: number; contractType: ContractType; packageId?: number; notes: string }) => OperationResult & { stayId?: number };
  transferStayRoom: (stayId: number, roomId: number, reason: string, responsible: string) => OperationResult;
  checkOut: (reservationId: number) => OperationResult;
  completeHousekeeping: (taskId: number, completedBy: string, notes: string) => OperationResult;
  setRoomMaintenance: (roomNumber: string, blocked: boolean) => void;
  resetDemonstrationData: () => void;
  cleanupDemoScenario: (scenarioKey: string) => void;
  activeReceiptsTotal: (reservationId: number) => number;
  getReservationFinancials: (reservationId: number) => ReservationFinancials | null;
  createPayable: (input: PayableInput) => OperationResult;
  updatePayable: (id: number, input: PayableInput) => OperationResult;
  cancelPayable: (id: number, responsible: string) => OperationResult;
  registerPayablePayment: (input: { payableId: number; value: number; method: string; responsible: string; notes: string; date?: string; operationKey?: string }) => OperationResult;
  openCashSession: (input: { responsible: string; openingCash: number; notes: string; shift?: "Manhã" | "Tarde" | "Noite" }) => OperationResult;
  closeCashSession: (input: { sessionId: number; countedCash: number; notes: string }) => OperationResult;
  registerManualCashMovement: (input: { direction: "entrada" | "saida"; value: number; method: string; description: string; responsible: string; notes: string }) => OperationResult;
  createCostCenter: (input: { code: string; name: string; description: string }) => OperationResult;
  updateCostCenter: (id: number, input: { code: string; name: string; description: string; active: boolean }) => OperationResult;
  reconcileBankTransaction: (input: { transactionId?: number; date: string; description: string; value: number; direction: "credito" | "debito"; movementId?: number; notes: string }) => OperationResult;
  cashExpectedTotal: (sessionId: number) => number;
  createConferenceRoom: (input: ConferenceRoomInput) => OperationResult;
  updateConferenceRoom: (id: number, input: ConferenceRoomInput) => OperationResult;
  inactivateConferenceRoom: (id: number) => OperationResult;
  createEventService: (input: EventServiceInput) => OperationResult;
  updateEventService: (id: number, input: EventServiceInput) => OperationResult;
  inactivateEventService: (id: number) => OperationResult;
  createEvent: (input: EventInput) => OperationResult & { event?: EventRecord };
  updateEvent: (id: number, input: EventInput) => OperationResult;
  cancelEvent: (id: number, input: EventCancellationInput) => OperationResult;
  registerEventReceipt: (input: { eventId: number; value: number; method: string; notes: string; responsible: string; date?: string; operationKey?: string }) => OperationResult;
  getEventFinancials: (eventId: number) => EventFinancials | null;
  updateFiscalProfile: (input: HotelFiscalProfile) => OperationResult;
  issueFiscalDocument: (input: FiscalDocumentInput) => OperationResult;
  cancelFiscalDocument: (id: number, reason: string) => OperationResult;
  reissueFiscalDocument: (id: number) => OperationResult;
  setCommunications: React.Dispatch<React.SetStateAction<Communication[]>>;
};

export type ReservationFinancials = {
  total: number;
  received: number;
  balance: number;
  status: ReturnType<typeof deriveReceivableStatus>;
  baseTotal?: number;
  lateCharges?: number;
  dueDate?: string;
};

export type EventFinancials = Omit<ReservationFinancials, "status"> & {
  status: ReservationFinancials["status"] | "Na fatura da hospedagem";
  linkedBalance?: number;
};
export type EventCancellationInput = {
  reason: string;
  treatment: string;
  refundValue?: number;
  refundMethod?: string;
};

type PayableInput = {
  description: string;
  supplier: string;
  category: string;
  costCenterId: number;
  originalValue: number;
  dueDate: string;
  notes: string;
};

export type ConferenceRoomInput = Omit<ConferenceRoom, "id" | "status" | "scenarioKey"> & { scenarioKey?: string };
export type EventServiceInput = Omit<EventService, "id" | "status" | "scenarioKey"> & { scenarioKey?: string };
export type EventInput = Omit<EventRecord, "id" | "code" | "createdAt" | "roomName" | "durationHoursContracted" | "roomValueContracted" | "servicesValueContracted" | "totalContracted" | "canceledAt"> & {
  scenarioKey?: string;
};
export type FiscalDocumentInput = Omit<FiscalDocument, "id" | "number" | "status" | "createdAt" | "canceledAt" | "cancelReason" | "reissuedFromId">;

const OperationsContext = createContext<OperationsContextValue | null>(null);

export function HotelOperationsProvider({ children }: { children: ReactNode }) {
  const { activeAccount, registerLog } = useAccessControl();
  const loadedState = useRef(loadStoredOperations());
  const [clients, setClients] = useState(loadedState.current.clients);
  const [rooms, setRooms] = useState(loadedState.current.rooms);
  const [categories, setCategories] = useState(loadedState.current.categories);
  const [reservations, setReservations] = useState(loadedState.current.reservations);
  const [receipts, setReceipts] = useState(loadedState.current.receipts);
  const [packages, setPackages] = useState(loadedState.current.packages);
  const [consumptions, setConsumptions] = useState(loadedState.current.consumptions);
  const [stays, setStays] = useState(loadedState.current.stays);
  const [invoices, setInvoices] = useState(loadedState.current.invoices);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>(loadedState.current.housekeepingTasks);
  const [payables, setPayables] = useState(loadedState.current.payables);
  const [costCenters, setCostCenters] = useState(loadedState.current.costCenters);
  const [cashSessions, setCashSessions] = useState(loadedState.current.cashSessions);
  const [cashMovements, setCashMovements] = useState(loadedState.current.cashMovements);
  const [bankTransactions, setBankTransactions] = useState(loadedState.current.bankTransactions);
  const [products, setProducts] = useState(loadedState.current.products);
  const [stockMovements, setStockMovements] = useState(loadedState.current.stockMovements);
  const [conferenceRooms, setConferenceRooms] = useState(loadedState.current.conferenceRooms);
  const [eventServices, setEventServices] = useState(loadedState.current.eventServices);
  const [events, setEvents] = useState(loadedState.current.events);
  const [eventReceipts, setEventReceipts] = useState(loadedState.current.eventReceipts);
  const [fiscalProfile, setFiscalProfile] = useState(loadedState.current.fiscalProfile);
  const [fiscalDocuments, setFiscalDocuments] = useState(loadedState.current.fiscalDocuments);
  const [communications, setCommunications] = useState(loadedState.current.communications);

  useEffect(() => {
    const snapshot: StoredOperations = {
      version: STORAGE_VERSION,
      clients, rooms, categories, reservations, receipts, packages, consumptions, stays, invoices, housekeepingTasks,
      payables, costCenters, cashSessions, cashMovements, bankTransactions,
      conferenceRooms, eventServices, events, eventReceipts,
      fiscalProfile, fiscalDocuments, communications, products, stockMovements,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [clients, rooms, categories, reservations, receipts, packages, consumptions, stays, invoices, housekeepingTasks, payables, costCenters, cashSessions, cashMovements, bankTransactions, conferenceRooms, eventServices, events, eventReceipts, fiscalProfile, fiscalDocuments, communications, products, stockMovements]);

  const createClient = (input: ClientInput): ClientResult => {
    if (!input.name.trim()) return { ok: false, error: "Informe o nome completo do cliente." };
    if (!validateCpf(input.cpf)) return { ok: false, error: "CPF inválido. Verifique os dígitos informados." };
    const cpf = normalizeCpf(input.cpf);
    if (clients.some((client) => normalizeCpf(client.cpf) === cpf)) return { ok: false, error: "Já existe um cliente cadastrado com este CPF." };
    const client: Client = {
      ...input,
      id: Math.max(0, ...clients.map((item) => item.id)) + 1,
      name: input.name.trim(),
      status: "Ativo",
      documents: input.documents ?? [],
    };
    setClients((current) => [...current, client]);
    return { ok: true, client };
  };

  const updateClient = (id: number, input: ClientInput): ClientResult => {
    const existing = clients.find((client) => client.id === id);
    if (!existing) return { ok: false, error: "Cliente não encontrado." };
    if (!validateCpf(input.cpf)) return { ok: false, error: "CPF inválido. Verifique os dígitos informados." };
    const cpf = normalizeCpf(input.cpf);
    if (clients.some((client) => client.id !== id && normalizeCpf(client.cpf) === cpf)) return { ok: false, error: "Já existe outro cliente cadastrado com este CPF." };
    const client: Client = { ...existing, ...input, name: input.name.trim(), documents: input.documents ?? existing.documents };
    setClients((current) => current.map((item) => item.id === id ? client : item));
    setReservations((current) => current.map((reservation) => reservation.clientId === id ? { ...reservation, guest: client.name } : reservation));
    setStays((current) => current.map((stay) => stay.clientId === id ? { ...stay, guest: client.name } : stay));
    return { ok: true, client };
  };

  const saveProduct = (input: Omit<StockProduct, "id" | "createdAt"> & { id?: number }): OperationResult => {
    if (!input.code.trim() || !input.name.trim()) return { ok: false, error: "Informe código e nome do produto." };
    if (!Number.isFinite(input.quantity) || input.quantity < 0 || !Number.isFinite(input.unitPrice ?? 0) || (input.unitPrice ?? 0) < 0) return { ok: false, error: "Quantidade ou preço unitário inválido." };
    const duplicate = products.some((item) => item.code.trim().toLowerCase() === input.code.trim().toLowerCase() && item.id !== input.id);
    if (duplicate) return { ok: false, error: "Já existe um produto com este código." };
    if (input.id) {
      setProducts((current) => current.map((item) => item.id === input.id ? { ...item, ...input, code: input.code.trim(), name: input.name.trim() } : item));
    } else {
      const id = Math.max(0, ...products.map((item) => item.id)) + 1;
      setProducts((current) => [...current, { ...input, id, code: input.code.trim(), name: input.name.trim(), createdAt: new Date().toISOString() }]);
    }
    return { ok: true };
  };

  const changeProductStock = (input: { productId: number; type: "Entrada" | "Saída"; quantity: number; responsible: string; notes: string }): OperationResult => {
    const product = products.find((item) => item.id === input.productId);
    if (!product || product.status !== "Ativo") return { ok: false, error: "Produto ativo não encontrado." };
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) return { ok: false, error: "Informe uma quantidade válida." };
    if (applyStockMovement(product.quantity, input.type, input.quantity) === null) return { ok: false, error: "Quantidade superior ao estoque disponível." };
    const nextId = Math.max(0, ...stockMovements.map((item) => item.id)) + 1;
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + (input.type === "Entrada" ? input.quantity : -input.quantity) } : item));
    setStockMovements((current) => [...current, { id: nextId, productId: product.id, productName: product.name, type: input.type, quantity: input.quantity, responsible: input.responsible || "Sistema", notes: input.notes, createdAt: new Date().toISOString(), source: "Manual" }]);
    return { ok: true };
  };

  const recordConsumption = (input: Omit<Consumption, "id" | "createdAt">): OperationResult => {
    const stay = stays.find((item) => item.id === input.stayId && item.status === "Ativa");
    if (!stay || stay.reservationId !== input.reservationId) return { ok: false, error: "Hospedagem ativa não encontrada." };
    const nextId = Math.max(0, ...consumptions.map((item) => item.id)) + 1;
    const quantity = input.quantity ?? 1;
    const product = input.productId ? products.find((item) => item.id === input.productId) : undefined;
    if (input.productId && (!product || product.status !== "Ativo")) return { ok: false, error: "Produto ativo não encontrado no estoque." };
    if (product && !canConsumeStock(product.quantity, quantity)) return { ok: false, error: `Estoque insuficiente para ${product.name}. Disponível: ${product.quantity}.` };
    const unitPrice = input.unitPrice ?? product?.unitPrice ?? input.value / quantity;
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return { ok: false, error: "Quantidade e valor unitário inválidos." };
    const reservation = reservations.find((item) => item.id === input.reservationId);
    const serviceCode = input.serviceCode ?? input.service;
    const benefits = reservation?.packageSnapshot?.structuredBenefits ?? [];
    const benefit = benefits.find((item) => benefitMatches(item, { category: product ? "Produto" : input.category ?? "Serviço", productId: input.productId, serviceCode }));
    const used = benefit ? consumptions.filter((item) => item.stayId === stay.id && item.benefitId === benefit.id && item.status !== "Estornado").reduce((total, item) => total + (item.benefitCoveredQuantity ?? 0), 0) : 0;
    const nights = reservation ? countNights(reservation.entry, reservation.exit) : 1;
    const allocation = benefit ? allocateBenefit(quantity, unitPrice, benefitLimitForStay(benefit.quantityIncluded, benefit.limitType, nights), used) : { coveredQuantity: 0, excessQuantity: quantity, charge: consumptionTotal(quantity, unitPrice, input.includedInPackage) };
    const value = benefit ? allocation.charge : consumptionTotal(quantity, unitPrice, input.includedInPackage);
    const createdAt = new Date().toISOString();
    const service = product?.name ?? input.service;
    setConsumptions((current) => [...current, { ...input, service, serviceCode, category: product ? "Produto" : input.category ?? "Serviço", benefitId: benefit?.id, benefitCoveredQuantity: allocation.coveredQuantity, excessQuantity: allocation.excessQuantity, includedInPackage: Boolean(benefit && allocation.excessQuantity === 0), value, quantity, unitPrice, status: "Lançado", id: nextId, createdAt }]);
    if (product) {
      const movementId = Math.max(0, ...stockMovements.map((item) => item.id)) + 1;
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity - quantity } : item));
      setStockMovements((current) => [...current, { id: movementId, productId: product.id, productName: product.name, type: "Saída", quantity, responsible: input.responsible || "Sistema", notes: `Consumo #${nextId} da hospedagem ${stay.code}.`, createdAt, source: "Consumo", consumptionId: nextId }]);
    }
    setInvoices((current) => current.map((invoice) => invoice.stayId === stay.id ? {
      ...invoice,
      extrasValue: invoice.extrasValue + value,
      total: invoice.total + value,
      status: "Aberta",
      updatedAt: new Date().toISOString(),
    } : invoice));
    setStays((current) => current.map((item) => item.id === stay.id ? { ...item, history: [...(item.history ?? []), { at: createdAt, type: "Consumo", description: `${service}: ${formatMoney(value)}${benefit ? ` (${allocation.coveredQuantity} incluso(s), ${allocation.excessQuantity} excedente(s))` : ""}.` }] } : item));
    return { ok: true };
  };

  const reverseConsumption = (consumptionId: number, reason: string, responsible: string): OperationResult => {
    const consumption = consumptions.find((item) => item.id === consumptionId);
    const stay = consumption ? stays.find((item) => item.id === consumption.stayId) : undefined;
    if (!consumption || !stay || stay.status !== "Ativa") return { ok: false, error: "Consumo de hospedagem ativa não encontrado." };
    if (!canReverseConsumption(consumption.status, stay.status)) return { ok: false, error: "Este consumo já foi estornado." };
    if (!reason.trim()) return { ok: false, error: "Informe o motivo do estorno." };
    const reversedAt = new Date().toISOString();
    const product = consumption.productId ? products.find((item) => item.id === consumption.productId) : undefined;
    const reservation = reservations.find((item) => item.id === consumption.reservationId);
    const benefit = reservation?.packageSnapshot?.structuredBenefits?.find((item) => item.id === consumption.benefitId);
    const recalculated = new Map<number, { covered: number; excess: number; value: number }>();
    if (benefit) {
      const limit = benefitLimitForStay(benefit.quantityIncluded, benefit.limitType, reservation ? countNights(reservation.entry, reservation.exit) : 1);
      let used = 0;
      consumptions.filter((item) => item.stayId === stay.id && item.benefitId === benefit.id && item.id !== consumptionId && item.status !== "Estornado").sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((item) => {
        const allocation = allocateBenefit(item.quantity ?? 1, item.unitPrice ?? item.value, limit, used);
        used += allocation.coveredQuantity;
        recalculated.set(item.id, { covered: allocation.coveredQuantity, excess: allocation.excessQuantity, value: allocation.charge });
      });
    }
    const nextConsumptions = consumptions.map((item) => {
      if (item.id === consumptionId) return { ...item, status: "Estornado" as const, reversedAt, reversalReason: `${reason.trim()} · ${responsible || "Sistema"}`, value: 0 };
      const next = recalculated.get(item.id);
      return next ? { ...item, benefitCoveredQuantity: next.covered, excessQuantity: next.excess, includedInPackage: next.excess === 0, value: next.value } : item;
    });
    setConsumptions(nextConsumptions);
    if (product) {
      const movementId = Math.max(0, ...stockMovements.map((item) => item.id)) + 1;
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + (consumption.quantity ?? 1) } : item));
      setStockMovements((current) => [...current, { id: movementId, productId: product.id, productName: product.name, type: "Entrada", quantity: consumption.quantity ?? 1, responsible: responsible || "Sistema", notes: `Estorno do consumo #${consumption.id}: ${reason.trim()}.`, createdAt: reversedAt, source: "Estorno", consumptionId }]);
    }
    const nextExtras = nextConsumptions.filter((item) => item.stayId === stay.id && item.status !== "Estornado" && !item.includedInPackage).reduce((total, item) => total + item.value, 0);
    setInvoices((current) => current.map((invoice) => invoice.stayId === stay.id ? { ...invoice, extrasValue: nextExtras, total: Math.max(0, invoice.baseValue - invoice.discounts + nextExtras), status: "Aberta", updatedAt: new Date().toISOString() } : invoice));
    setStays((current) => current.map((item) => item.id === stay.id ? { ...item, history: [...(item.history ?? []), { at: new Date().toISOString(), type: "Estorno de consumo", description: `${consumption.service}. Motivo: ${reason.trim()}.` }] } : item));
    return { ok: true };
  };

  const confirmedReceiptsTotal = (reservationId: number) => receipts
    .filter((item) => item.reservationId === reservationId && item.status === "Confirmado")
    .reduce((total, item) => total + item.value, 0);

  const getReservationFinancials = (reservationId: number): ReservationFinancials | null => {
    const reservation = reservations.find((item) => item.id === reservationId);
    if (!reservation) return null;
    const invoice = invoices.find((item) => item.reservationId === reservationId);
    const extras = consumptions.filter((item) => item.reservationId === reservationId && !item.includedInPackage && item.status !== "Estornado").reduce((total, item) => total + item.value, 0);
    const baseTotal = invoice?.total ?? reservationBaseValue(reservation) + extras;
    const received = confirmedReceiptsTotal(reservationId);
    const lateCharges = received + 0.009 >= baseTotal || reservation.status === "Cancelada"
      ? 0
      : invoiceLateCharges(Math.max(0, baseTotal - received), reservation.exit);
    const total = baseTotal + lateCharges;
    return {
      total,
      received,
      balance: pendingBalance(total, received),
      status: deriveReceivableStatus(total, received, reservation.exit, reservation.status === "Cancelada", today()),
      baseTotal,
      lateCharges,
      dueDate: reservation.exit,
    };
  };

  const openSessionForMovement = () => cashSessions.find((session) => !session.closedAt);

  const validateCashMovement = (methodId: PaymentMethodId, value: number, direction: "entrada" | "saida"): OperationResult => {
    if (!isCashPayment(methodId)) return { ok: true };
    const session = openSessionForMovement();
    if (!session) return { ok: false, error: "Abra o caixa em Financeiro → Caixa antes de movimentar dinheiro. Pix e transferências podem ser registrados sem caixa aberto." };
    if (direction === "saida" && roundMoney(value) > roundMoney(cashExpectedTotal(session.id))) return { ok: false, error: "O caixa não tem dinheiro suficiente para esta saída." };
    return { ok: true };
  };

  const registerReceipt = (input: { reservationId: number; value: number; method: string; notes: string; responsible: string; scenarioKey?: string; date?: string; operationKey?: string }): OperationResult => {
    const reservation = reservations.find((item) => item.id === input.reservationId);
    if (!reservation) return { ok: false, error: "Reserva não encontrada." };
    const financials = getReservationFinancials(input.reservationId);
    if (!financials) return { ok: false, error: "Obrigacao financeira nao encontrada." };
    const validation = validateSettlement(input.value, financials.balance, "recebimento");
    if (!validation.ok) return validation;
    if (input.operationKey && receipts.some((receipt) => receipt.operationKey === input.operationKey)) {
      return { ok: false, error: "Este recebimento ja foi processado." };
    }
    const date = input.date ?? today();
    const methodId = normalizePaymentMethod(input.method);
    const cashValidation = validateCashMovement(methodId, input.value, "entrada");
    if (!cashValidation.ok) return cashValidation;
    const stay = stays.find((item) => item.reservationId === input.reservationId);
    const nextId = Math.max(0, ...receipts.map((item) => item.id)) + 1;
    const openSession = openSessionForMovement();
    const createdAt = new Date().toISOString();
    setReceipts((current) => [...current, {
      id: nextId,
      scenarioKey: input.scenarioKey ?? reservation.scenarioKey,
      code: `REC-${String(200 + nextId).padStart(4, "0")}`,
      reservationId: input.reservationId,
      stayId: stay?.id,
      date,
      createdAt,
      value: input.value,
      method: paymentMethodLabel(methodId),
      methodId,
      status: "Confirmado",
      notes: input.notes,
      responsible: input.responsible,
      operationKey: input.operationKey,
    }]);
    if (stay) setStays((current) => current.map((item) => item.id === stay.id ? { ...item, history: [...(item.history ?? []), { at: createdAt, type: "Recebimento", description: `${formatMoney(input.value)} via ${paymentMethodLabel(methodId)}.` }] } : item));
    setCashMovements((current) => [...current, {
      id: Math.max(0, ...current.map((item) => item.id)) + 1,
      sessionId: openSession?.id,
      direction: "entrada",
      date,
      createdAt,
      value: input.value,
      methodId,
      source: "recebimento",
      sourceId: nextId,
      description: `Recebimento ${reservation.code} - ${reservation.guest}`,
      responsible: input.responsible,
      notes: openSession ? input.notes : `${input.notes}${input.notes ? " " : ""}Registrado sem caixa aberto.`,
    }]);
    const projectedReceived = confirmedReceiptsTotal(input.reservationId) + input.value;
    setInvoices((current) => current.map((invoice) => invoice.reservationId === input.reservationId ? {
      ...invoice,
      status: projectedReceived + 0.009 >= financials.total ? "Quitada" : "Aberta",
      updatedAt: new Date().toISOString(),
    } : invoice));
    return { ok: true };
  };

  const changeReceiptStatus = (receiptId: number, status: Exclude<ReceiptStatus, "Confirmado">, responsible: string): OperationResult => {
    const receipt = receipts.find((item) => item.id === receiptId);
    if (!receipt || receipt.status !== "Confirmado") return { ok: false, error: "Recebimento válido não encontrado." };
    const methodId = receipt.methodId ?? normalizePaymentMethod(receipt.method);
    const cashValidation = validateCashMovement(methodId, receipt.value, "saida");
    if (!cashValidation.ok) return cashValidation;
    setReceipts((current) => current.map((item) => item.id === receiptId ? {
      ...item,
      status,
      notes: `${item.notes}${item.notes ? " · " : ""}${status} por ${responsible} em ${new Date().toLocaleString("pt-BR")}.`,
    } : item));
    setCashMovements((current) => [...current, {
      id: Math.max(0, ...current.map((item) => item.id)) + 1, sessionId: openSessionForMovement()?.id,
      direction: "saida", date: today(), createdAt: new Date().toISOString(), value: receipt.value,
      methodId, source: "estorno_recebimento", sourceId: receipt.id,
      description: `Estorno ${receipt.code}`, responsible, notes: `${status} — recebimento original preservado.`,
    }]);
    const projectedReceived = Math.max(0, activeReceiptsTotal(receipt.reservationId) - receipt.value);
    setInvoices((current) => current.map((invoice) => invoice.reservationId === receipt.reservationId ? {
      ...invoice,
      status: projectedReceived + 0.009 >= invoice.total ? "Quitada" : "Aberta",
      updatedAt: new Date().toISOString(),
    } : invoice));
    return { ok: true };
  };

  const eventReceiptsTotal = (eventId: number) => eventReceipts
    .filter((item) => item.eventId === eventId && item.status === "Confirmado")
    .reduce((total, item) => total + item.value, 0);

  const getEventFinancials = (eventId: number): EventFinancials | null => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return null;
    return eventFinancialSnapshot(event, eventReceiptsTotal(eventId), today(), event.linkedReservationId ? getReservationFinancials(event.linkedReservationId)?.balance : undefined);
  };

  const normalizeEventInput = (input: EventInput, eventId?: number): OperationResult & { event?: Omit<EventRecord, "id" | "code" | "createdAt"> } => {
    if (!input.name.trim() || !input.contractorName.trim() || !input.contact.trim()) return { ok: false, error: "Informe nome, contratante e contato do evento." };
    if (!Number.isFinite(input.guests) || input.guests <= 0) return { ok: false, error: "Informe uma quantidade valida de participantes." };
    const period = validateEventPeriod(input.start, input.end);
    if (!period.ok) return period;
    const room = conferenceRooms.find((item) => item.id === input.roomId);
    if (!room) return { ok: false, error: "Sala de conferencia nao encontrada." };
    if (room.status !== "Ativo") return { ok: false, error: "Nao e permitido agendar evento em sala inativa." };
    if (input.guests > room.capacity) return { ok: false, error: `A sala comporta no maximo ${room.capacity} participantes.` };
    if (![input.setupMinutes ?? 0, input.teardownMinutes ?? 0].every((value) => Number.isInteger(value) && value >= 0 && value <= 1440)) return { ok: false, error: "Montagem e desmontagem devem ter entre 0 e 1.440 minutos." };
    if (![input.roomHourlyRateContracted, input.discountValue, ...input.services.flatMap((line) => [line.quantity, line.contractedUnitPrice])].every(Number.isFinite) || input.roomHourlyRateContracted < 0 || input.discountValue < 0) return { ok: false, error: "Informe preços e desconto válidos." };
    const conflict = findRoomScheduleConflict(events, input.roomId, input.start, input.end, eventId, input.setupMinutes, input.teardownMinutes);
    if (conflict) return { ok: false, error: `Conflito com ${conflict.code} - ${conflict.name}.` };
    if (input.services.some((line) => line.quantity <= 0 || line.contractedUnitPrice < 0)) return { ok: false, error: "Servicos contratados precisam ter quantidade e preco validos." };
    const inactiveService = input.services.find((line) => !eventServices.some((service) => service.id === line.serviceId && service.status === "Ativo") && !events.some((event) => event.id === eventId && event.services.some((existing) => existing.serviceId === line.serviceId)));
    if (inactiveService) return { ok: false, error: "Servico inativo nao pode ser contratado em novo evento." };
    if (!input.timeline.length) return { ok: false, error: "Inclua ao menos uma atividade no cronograma." };
    const timelineValidation = validateTimelineTimes(input.timeline.map((item) => item.time), input.start, input.end);
    if (!timelineValidation.ok) return timelineValidation;
    if (input.billingType === "Vinculada a hospedagem") {
      const reservation = reservations.find((item) => item.id === input.linkedReservationId);
      const stay = stays.find((item) => item.reservationId === input.linkedReservationId && item.status === "Ativa");
      if (!reservation || !stay) return { ok: false, error: "Selecione uma hospedagem ativa para vincular a cobranca." };
      if (reservation.status === "Concluída" || reservation.status === "Cancelada") return { ok: false, error: "Nao e permitido vincular evento a hospedagem encerrada ou cancelada." };
    }
    if (input.billingType === "Separada" && input.depositRequired) {
      if (!Number.isFinite(input.depositPercent) || (input.depositPercent ?? 0) <= 0 || (input.depositPercent ?? 0) > 100) return { ok: false, error: "Informe um percentual de sinal entre 1% e 100%." };
      if (!input.depositDueDate || !input.balanceDueDate) return { ok: false, error: "Informe os vencimentos do sinal e do saldo." };
    }
    const durationHoursContracted = eventDurationHours(input.start, input.end);
    const roomValueContracted = calculateRoomContractValue(input.start, input.end, input.roomHourlyRateContracted);
    const services = input.services.map((line) => ({ ...line, subtotal: calculateServiceSubtotal(line.quantity, line.contractedUnitPrice) }));
    const servicesValueContracted = calculateServicesTotal(services);
    const totalContracted = calculateEventTotal(roomValueContracted, servicesValueContracted, input.discountValue);
    const depositValue = input.depositRequired ? totalContracted * (input.depositPercent ?? 0) / 100 : 0;
    const alreadyReceived = eventId ? eventReceiptsTotal(eventId) : 0;
    if (alreadyReceived > totalContracted + 0.009) return { ok: false, error: "O total não pode ficar abaixo do valor já recebido. Regularize os recebimentos antes de alterar o contrato." };
    if (input.status === "Confirmado" && input.billingType === "Separada" && depositValue > alreadyReceived + 0.009) {
      return { ok: false, error: `O evento exige sinal de ${formatMoney(depositValue)}. Registre o recebimento antes de confirma-lo.` };
    }
    return {
      ok: true,
      event: {
        ...input,
        roomName: room.name,
        durationHoursContracted,
        roomValueContracted,
        services,
        servicesValueContracted,
        totalContracted,
        timeline: [...input.timeline].sort((first, second) => first.time.localeCompare(second.time)),
      },
    };
  };

  const upsertLinkedEventConsumption = (event: EventRecord) => {
    if (event.billingType !== "Vinculada a hospedagem" || !event.linkedReservationId) return;
    const stay = stays.find((item) => item.reservationId === event.linkedReservationId && item.status === "Ativa");
    if (!stay) return;
    setConsumptions((current) => {
      const filtered = current.filter((item) => item.originEventId !== event.id);
      return [...filtered, {
        id: Math.max(0, ...filtered.map((item) => item.id)) + 1,
        scenarioKey: event.scenarioKey,
        stayId: stay.id,
        reservationId: stay.reservationId,
        service: "Evento",
        description: `${event.code} - ${event.name}`,
        value: event.totalContracted,
        createdAt: new Date().toISOString(),
        includedInPackage: false,
        originEventId: event.id,
      }];
    });
    setInvoices((current) => current.map((invoice) => invoice.stayId === stay.id ? {
      ...invoice,
      extrasValue: consumptions.filter((item) => item.stayId === stay.id && item.originEventId !== event.id && !item.includedInPackage && item.status !== "Estornado").reduce((total, item) => total + item.value, event.totalContracted),
      total: invoice.baseValue + consumptions.filter((item) => item.stayId === stay.id && item.originEventId !== event.id && !item.includedInPackage && item.status !== "Estornado").reduce((total, item) => total + item.value, event.totalContracted) - invoice.discounts,
      status: "Aberta",
      updatedAt: new Date().toISOString(),
    } : invoice));
  };

  const removeLinkedEventConsumption = (eventId: number) => {
    const linked = consumptions.find((item) => item.originEventId === eventId);
    if (!linked) return;
    setConsumptions((current) => current.filter((item) => item.originEventId !== eventId));
    setInvoices((current) => current.map((invoice) => {
      if (invoice.stayId !== linked.stayId) return invoice;
      const extrasValue = consumptions
        .filter((item) => item.stayId === linked.stayId && item.originEventId !== eventId && !item.includedInPackage && item.status !== "Estornado")
        .reduce((total, item) => total + item.value, 0);
      return {
        ...invoice,
        extrasValue,
        total: Math.max(0, invoice.baseValue + extrasValue - invoice.discounts),
        status: activeReceiptsTotal(invoice.reservationId) + 0.009 >= Math.max(0, invoice.baseValue + extrasValue - invoice.discounts) ? "Quitada" : "Aberta",
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  const createConferenceRoom = (input: ConferenceRoomInput): OperationResult => {
    if (!input.name.trim() || !input.location.trim()) return { ok: false, error: "Informe nome e localizacao da sala." };
    if (!Number.isFinite(input.capacity) || input.capacity <= 0) return { ok: false, error: "Informe uma capacidade valida." };
    if (!Number.isFinite(input.hourlyRate) || input.hourlyRate < 0) return { ok: false, error: "Informe um preco por hora valido." };
    setConferenceRooms((current) => [{ ...input, id: Math.max(0, ...current.map((item) => item.id)) + 1, status: "Ativo" }, ...current]);
    return { ok: true };
  };

  const updateConferenceRoom = (id: number, input: ConferenceRoomInput): OperationResult => {
    if (!conferenceRooms.some((item) => item.id === id)) return { ok: false, error: "Sala nao encontrada." };
    setConferenceRooms((current) => current.map((room) => room.id === id ? { ...room, ...input } : room));
    return { ok: true };
  };

  const inactivateConferenceRoom = (id: number): OperationResult => {
    const future = events.find((event) => event.roomId === id && !["Cancelado", "Concluido"].includes(event.status) && event.end >= new Date().toISOString().slice(0, 16));
    if (future) return { ok: false, error: `A sala possui evento futuro ativo: ${future.code} - ${future.name}.` };
    setConferenceRooms((current) => current.map((room) => room.id === id ? { ...room, status: "Inativo" } : room));
    return { ok: true };
  };

  const createEventService = (input: EventServiceInput): OperationResult => {
    if (!input.name.trim() || !input.category.trim() || !input.unit.trim()) return { ok: false, error: "Informe nome, categoria e unidade de cobranca." };
    if (!Number.isFinite(input.price) || input.price < 0) return { ok: false, error: "Informe um preco valido." };
    setEventServices((current) => [{ ...input, id: Math.max(0, ...current.map((item) => item.id)) + 1, status: "Ativo" }, ...current]);
    return { ok: true };
  };

  const updateEventService = (id: number, input: EventServiceInput): OperationResult => {
    if (!eventServices.some((item) => item.id === id)) return { ok: false, error: "Servico nao encontrado." };
    setEventServices((current) => current.map((service) => service.id === id ? { ...service, ...input } : service));
    return { ok: true };
  };

  const inactivateEventService = (id: number): OperationResult => {
    setEventServices((current) => current.map((service) => service.id === id ? { ...service, status: "Inativo" } : service));
    return { ok: true };
  };

  const createEvent = (input: EventInput): OperationResult & { event?: EventRecord } => {
    if (input.status !== "Planejado") return { ok: false, error: "Cadastre o evento como Planejado e avance a situação após conferir o contrato e o sinal." };
    const normalized = normalizeEventInput(input);
    if (!normalized.ok || !normalized.event) return { ok: false, error: normalized.error };
    const nextId = Math.max(0, ...events.map((item) => item.id)) + 1;
    const event: EventRecord = { ...normalized.event, id: nextId, code: `EVT-${String(206 + nextId).padStart(4, "0")}`, createdAt: new Date().toISOString() };
    setEvents((current) => [event, ...current]);
    upsertLinkedEventConsumption(event);
    return { ok: true, event };
  };

  const updateEvent = (id: number, input: EventInput): OperationResult => {
    const existing = events.find((item) => item.id === id);
    if (!existing) return { ok: false, error: "Evento nao encontrado." };
    if (["Cancelado", "Concluido"].includes(existing.status)) return { ok: false, error: "Eventos encerrados preservam seu histórico e não podem ser alterados." };
    if (input.status === "Cancelado") return { ok: false, error: "Use Cancelar evento para conferir os valores e registrar a devolução." };
    if (eventReceiptsTotal(id) > 0 && (existing.billingType !== input.billingType || existing.linkedReservationId !== input.linkedReservationId)) return { ok: false, error: "Não é possível mudar a cobrança de um evento com recebimentos." };
    if (!canTransitionEventStatus(existing.status, input.status) && existing.status !== input.status) return { ok: false, error: "Transicao de status do evento nao permitida." };
    const normalized = normalizeEventInput(input, id);
    if (!normalized.ok || !normalized.event) return normalized;
    const event: EventRecord = { ...existing, ...normalized.event };
    setEvents((current) => current.map((item) => item.id === id ? event : item));
    removeLinkedEventConsumption(id);
    upsertLinkedEventConsumption(event);
    return { ok: true };
  };

  const cancelEvent = (id: number, input: EventCancellationInput): OperationResult => {
    const event = events.find((item) => item.id === id);
    if (!event || ["Cancelado", "Concluido", "Em andamento"].includes(event.status)) return { ok: false, error: "Somente eventos planejados ou confirmados podem ser cancelados." };
    if (!input.reason.trim()) return { ok: false, error: "Informe o motivo do cancelamento." };
    if (!activeAccount) return { ok: false, error: "Entre no sistema para cancelar o evento." };
    if (event.billingType === "Vinculada a hospedagem" && !stays.some((stay) => stay.reservationId === event.linkedReservationId && stay.status === "Ativa")) return { ok: false, error: "A hospedagem já foi encerrada. Regularize a fatura antes de cancelar este evento." };
    const received = eventReceiptsTotal(id);
    const refunded = input.refundValue ?? (received > 0 ? NaN : 0);
    const validation = validateRefund(received, refunded);
    if (!validation.ok) return validation;
    if (received > 0 && !input.treatment.trim()) return { ok: false, error: "Explique o acordo de devolução ou retenção dos valores recebidos." };
    if (refunded > 0 && !input.refundMethod) return { ok: false, error: "Selecione a forma da devolução." };
    const methodId = normalizePaymentMethod(input.refundMethod ?? "pix");
    const cashValidation = validateCashMovement(methodId, refunded, "saida");
    if (refunded > 0 && !cashValidation.ok) return cashValidation;
    const at = new Date().toISOString();
    const retained = roundMoney(received - refunded);
    setEvents((current) => current.map((item) => item.id === id ? {
      ...item, status: "Cancelado", canceledAt: at,
      financialNotes: `${input.reason.trim()}${input.treatment.trim() ? ` · ${input.treatment.trim()}` : ""}`,
      cancellation: { received, refunded, retained, methodId: refunded > 0 ? methodId : undefined, responsible: activeAccount.name, at },
    } : item));
    if (refunded > 0) setCashMovements((current) => [...current, {
      id: Math.max(0, ...current.map((item) => item.id)) + 1,
      sessionId: openSessionForMovement()?.id, direction: "saida", date: today(), createdAt: at,
      value: refunded, methodId, source: "devolucao_evento", sourceId: id,
      description: `Devolução ${event.code} - ${event.name}`, responsible: activeAccount.name, notes: input.treatment,
    }]);
    removeLinkedEventConsumption(id);
    registerLog("Evento cancelado", "Eventos", `${event.code}: devolvido ${formatMoney(refunded)}, retido ${formatMoney(retained)}. ${input.reason}`, "Sucesso");
    return { ok: true };
  };

  const registerEventReceipt = (input: { eventId: number; value: number; method: string; notes: string; responsible: string; date?: string; operationKey?: string }): OperationResult => {
    const event = events.find((item) => item.id === input.eventId);
    if (!event || event.status === "Cancelado") return { ok: false, error: "Evento faturavel nao encontrado." };
    if (event.billingType !== "Separada") return { ok: false, error: "Recebimentos diretos sao permitidos apenas para cobranca separada." };
    const financials = getEventFinancials(input.eventId);
    if (!financials) return { ok: false, error: "Obrigacao financeira do evento nao encontrada." };
    const validation = validateSettlement(input.value, financials.balance, "recebimento do evento");
    if (!validation.ok) return validation;
    if (input.operationKey && eventReceipts.some((receipt) => receipt.operationKey === input.operationKey)) return { ok: false, error: "Este recebimento ja foi processado." };
    const date = input.date ?? today();
    const methodId = normalizePaymentMethod(input.method);
    const cashValidation = validateCashMovement(methodId, input.value, "entrada");
    if (!cashValidation.ok) return cashValidation;
    const nextId = Math.max(0, ...eventReceipts.map((item) => item.id)) + 1;
    const openSession = openSessionForMovement();
    const createdAt = new Date().toISOString();
    setEventReceipts((current) => [...current, {
      id: nextId,
      scenarioKey: event.scenarioKey,
      code: `REV-${String(200 + nextId).padStart(4, "0")}`,
      eventId: event.id,
      date,
      createdAt,
      value: input.value,
      method: paymentMethodLabel(methodId),
      methodId,
      status: "Confirmado",
      notes: input.notes,
      responsible: input.responsible,
      operationKey: input.operationKey,
    }]);
    setCashMovements((current) => [...current, {
      id: Math.max(0, ...current.map((item) => item.id)) + 1,
      sessionId: openSession?.id,
      direction: "entrada",
      date,
      createdAt,
      value: input.value,
      methodId,
      source: "recebimento",
      sourceId: nextId,
      description: `Recebimento ${event.code} - ${event.name}`,
      responsible: input.responsible,
      notes: openSession ? input.notes : `${input.notes}${input.notes ? " " : ""}Registrado sem caixa aberto.`,
    }]);
    const depositValue = event.depositRequired ? event.totalContracted * (event.depositPercent ?? 0) / 100 : 0;
    if (event.status === "Planejado" && depositValue > 0 && eventReceiptsTotal(event.id) + input.value + 0.009 >= depositValue) {
      setEvents((current) => current.map((item) => item.id === event.id ? { ...item, status: "Confirmado" } : item));
    }
    return { ok: true };
  };

  const updateFiscalProfile = (input: HotelFiscalProfile): OperationResult => {
    if (!input.legalName.trim() || !input.document.trim() || !input.municipalRegistration.trim()) {
      return { ok: false, error: "Informe razao social, CNPJ e inscricao municipal." };
    }
    setFiscalProfile(input);
    return { ok: true };
  };

  const fiscalNumber = (type: FiscalDocumentType, id: number) =>
    type === "NFS-e" ? `NFS-${String(id).padStart(4, "0")}` : `REC-FIS-${String(id).padStart(4, "0")}`;

  const issueFiscalDocument = (input: FiscalDocumentInput): OperationResult => {
    if (!input.recipient.trim() || !input.description.trim()) return { ok: false, error: "Informe destinatario e descricao." };
    if (!Number.isFinite(input.value) || input.value <= 0) return { ok: false, error: "Informe um valor valido." };
    if (input.origin === "Hospedagem" && !reservations.some((reservation) => reservation.id === input.reservationId)) return { ok: false, error: "Reserva/hospedagem de origem nao encontrada." };
    if (input.origin === "Evento" && !events.some((event) => event.id === input.eventId)) return { ok: false, error: "Evento de origem nao encontrado." };
    const nextId = Math.max(0, ...fiscalDocuments.map((item) => item.id)) + 1;
    setFiscalDocuments((current) => [{
      ...input,
      id: nextId,
      number: fiscalNumber(input.type, nextId),
      status: "Emitida",
      createdAt: new Date().toISOString(),
    }, ...current]);
    return { ok: true };
  };

  const cancelFiscalDocument = (id: number, reason: string): OperationResult => {
    const document = fiscalDocuments.find((item) => item.id === id);
    if (!document || document.status === "Cancelada") return { ok: false, error: "Documento fiscal ativo nao encontrado." };
    if (!reason.trim()) return { ok: false, error: "Informe o motivo do cancelamento." };
    setFiscalDocuments((current) => current.map((item) => item.id === id ? { ...item, status: "Cancelada", canceledAt: new Date().toISOString(), cancelReason: reason } : item));
    return { ok: true };
  };

  const reissueFiscalDocument = (id: number): OperationResult => {
    const document = fiscalDocuments.find((item) => item.id === id);
    if (!document) return { ok: false, error: "Documento fiscal nao encontrado." };
    const nextId = Math.max(0, ...fiscalDocuments.map((item) => item.id)) + 1;
    setFiscalDocuments((current) => [{
      ...document,
      id: nextId,
      number: fiscalNumber(document.type, nextId),
      issueDate: today(),
      status: "Emitida",
      createdAt: new Date().toISOString(),
      canceledAt: undefined,
      cancelReason: undefined,
      reissuedFromId: document.id,
    }, ...current]);
    return { ok: true };
  };

  const createPayable = (input: PayableInput): OperationResult => {
    if (!input.description.trim() || !input.supplier.trim()) return { ok: false, error: "Informe descricao e fornecedor." };
    if (!costCenters.some((center) => center.id === input.costCenterId && center.active)) return { ok: false, error: "Centro de custo ativo nao encontrado." };
    if (!Number.isFinite(input.originalValue) || input.originalValue <= 0) return { ok: false, error: "Informe um valor valido para a conta." };
    const nextId = Math.max(0, ...payables.map((item) => item.id)) + 1;
    setPayables((current) => [...current, {
      id: nextId,
      code: `PAG-${String(nextId).padStart(4, "0")}`,
      ...input,
      createdAt: new Date().toISOString(),
      payments: [],
    }]);
    return { ok: true };
  };

  const updatePayable = (id: number, input: PayableInput): OperationResult => {
    const payable = payables.find((item) => item.id === id);
    if (!payable || payable.canceledAt) return { ok: false, error: "Conta a pagar nao encontrada." };
    const paid = payable.payments.reduce((total, payment) => total + payment.value, 0);
    if (input.originalValue + 0.009 < paid) return { ok: false, error: "O valor da conta nao pode ficar menor que o total ja pago." };
    setPayables((current) => current.map((item) => item.id === id ? { ...item, ...input } : item));
    return { ok: true };
  };

  const cancelPayable = (id: number, responsible: string): OperationResult => {
    const payable = payables.find((item) => item.id === id);
    if (!payable) return { ok: false, error: "Conta a pagar nao encontrada." };
    if (payable.payments.length > 0) return { ok: false, error: "Conta com pagamentos registrados nao pode ser cancelada neste prototipo." };
    setPayables((current) => current.map((item) => item.id === id ? { ...item, canceledAt: new Date().toISOString(), notes: `${item.notes}${item.notes ? " " : ""}Cancelada por ${responsible}.` } : item));
    return { ok: true };
  };

  const registerPayablePayment = (input: { payableId: number; value: number; method: string; responsible: string; notes: string; date?: string; operationKey?: string }): OperationResult => {
    const payable = payables.find((item) => item.id === input.payableId);
    if (!payable || payable.canceledAt) return { ok: false, error: "Conta a pagar nao encontrada." };
    if (input.operationKey && payable.payments.some((payment) => payment.operationKey === input.operationKey)) {
      return { ok: false, error: "Este pagamento ja foi processado." };
    }
    const paid = payable.payments.reduce((total, payment) => total + payment.value, 0);
    const validation = validateSettlement(input.value, pendingBalance(payable.originalValue, paid), "pagamento");
    if (!validation.ok) return validation;
    const methodId = normalizePaymentMethod(input.method);
    const cashValidation = validateCashMovement(methodId, input.value, "saida");
    if (!cashValidation.ok) return cashValidation;
    const date = input.date ?? today();
    const createdAt = new Date().toISOString();
    const paymentId = Math.max(0, ...payables.flatMap((item) => item.payments.map((payment) => payment.id))) + 1;
    const payment: PayablePayment = { id: paymentId, payableId: payable.id, date, value: input.value, methodId, responsible: input.responsible, notes: input.notes, createdAt, operationKey: input.operationKey };
    setPayables((current) => current.map((item) => item.id === payable.id ? { ...item, payments: [...item.payments, payment] } : item));
    const openSession = openSessionForMovement();
    setCashMovements((current) => [...current, {
      id: Math.max(0, ...current.map((item) => item.id)) + 1,
      sessionId: openSession?.id,
      direction: "saida",
      date,
      createdAt,
      value: input.value,
      methodId,
      source: "pagamento",
      sourceId: paymentId,
      description: `Pagamento ${payable.code} - ${payable.supplier}`,
      responsible: input.responsible,
      notes: input.notes,
    }]);
    return { ok: true };
  };

  const openCashSession = (input: { responsible: string; openingCash: number; notes: string; shift?: "Manhã" | "Tarde" | "Noite" }): OperationResult => {
    if (cashSessions.some((session) => !session.closedAt)) return { ok: false, error: "Ja existe um caixa aberto." };
    if (!input.responsible.trim()) return { ok: false, error: "Informe o responsavel pelo caixa." };
    if (!Number.isFinite(input.openingCash) || input.openingCash < 0) return { ok: false, error: "Informe um valor inicial valido." };
    if (!activeAccount) return { ok: false, error: "Entre no sistema para abrir o caixa." };
    const nextId = Math.max(0, ...cashSessions.map((item) => item.id)) + 1;
    setCashSessions((current) => [{ id: nextId, code: `CX-${String(nextId).padStart(4, "0")}`, openedAt: new Date().toISOString(), responsible: input.responsible, openingCash: input.openingCash, openedBy: { id: activeAccount.id, name: activeAccount.name }, notes: input.notes, shift: input.shift ?? "Manhã" }, ...current]);
    return { ok: true };
  };

  const cashExpectedTotal = (sessionId: number) => {
    const session = cashSessions.find((item) => item.id === sessionId);
    if (!session) return 0;
    const physicalMovements = cashMovements.filter((movement) => movement.sessionId === sessionId && isCashPayment(movement.methodId));
    return physicalMovements.reduce((total, movement) => movement.direction === "entrada" ? total + movement.value : total - movement.value, session.openingCash);
  };

  const closeCashSession = (input: { sessionId: number; countedCash: number; notes: string }): OperationResult => {
    const session = cashSessions.find((item) => item.id === input.sessionId);
    if (!session || session.closedAt) return { ok: false, error: "Caixa aberto nao encontrado." };
    if (!Number.isFinite(input.countedCash) || input.countedCash < 0) return { ok: false, error: "Informe o valor contado." };
    if (!activeAccount) return { ok: false, error: "Entre no sistema para fechar o caixa." };
    const expectedCash = roundMoney(cashExpectedTotal(input.sessionId));
    const difference = roundMoney(input.countedCash - expectedCash);
    if (difference !== 0 && !input.notes.trim()) return { ok: false, error: "Há uma diferença de caixa. Informe a justificativa antes de fechar." };
    setCashSessions((current) => current.map((item) => item.id === input.sessionId ? { ...item, closedAt: new Date().toISOString(), countedCash: input.countedCash, expectedCash, difference, closedBy: { id: activeAccount.id, name: activeAccount.name }, closingNotes: input.notes } : item));
    return { ok: true };
  };

  const registerManualCashMovement = (input: { direction: "entrada" | "saida"; value: number; method: string; description: string; responsible: string; notes: string }): OperationResult => {
    const openSession = openSessionForMovement();
    if (!openSession) return { ok: false, error: "Abra um caixa antes de lancar movimentos manuais." };
    if (!Number.isFinite(input.value) || input.value <= 0) return { ok: false, error: "Informe um valor valido." };
    const methodId = normalizePaymentMethod(input.method);
    const cashValidation = validateCashMovement(methodId, input.value, input.direction);
    if (!cashValidation.ok) return cashValidation;
    setCashMovements((current) => [...current, {
      id: Math.max(0, ...current.map((item) => item.id)) + 1,
      sessionId: openSession.id,
      direction: input.direction,
      date: today(),
      createdAt: new Date().toISOString(),
      value: input.value,
      methodId,
      source: "manual",
      sourceId: Date.now(),
      description: input.description,
      responsible: input.responsible,
      notes: input.notes,
    }]);
    return { ok: true };
  };

  const createCostCenter = (input: { code: string; name: string; description: string }): OperationResult => {
    if (!input.code.trim() || !input.name.trim()) return { ok: false, error: "Informe codigo e nome do centro de custo." };
    if (costCenters.some((item) => item.code.toLocaleLowerCase("pt-BR") === input.code.toLocaleLowerCase("pt-BR"))) return { ok: false, error: "Codigo de centro de custo ja cadastrado." };
    setCostCenters((current) => [...current, { id: Math.max(0, ...current.map((item) => item.id)) + 1, ...input, active: true }]);
    return { ok: true };
  };

  const updateCostCenter = (id: number, input: { code: string; name: string; description: string; active: boolean }): OperationResult => {
    if (!costCenters.some((item) => item.id === id)) return { ok: false, error: "Centro de custo nao encontrado." };
    const hasLinkedPayables = payables.some((payable) => payable.costCenterId === id && !payable.canceledAt);
    if (!input.active && hasLinkedPayables) return { ok: false, error: "Centro de custo com vinculos ativos nao pode ser inativado." };
    setCostCenters((current) => current.map((item) => item.id === id ? { ...item, ...input } : item));
    return { ok: true };
  };

  const reconcileBankTransaction = (input: { transactionId?: number; date: string; description: string; value: number; direction: "credito" | "debito"; movementId?: number; notes: string }): OperationResult => {
    if (!Number.isFinite(input.value) || input.value <= 0) return { ok: false, error: "Informe o valor bancario." };
    const movement = input.movementId ? cashMovements.find((item) => item.id === input.movementId) : undefined;
    if (input.movementId && !movement) return { ok: false, error: "Movimentacao do sistema nao encontrada." };
    if (!input.date || !input.description.trim()) return { ok: false, error: "Informe data e descrição da transação bancária." };
    if (movement) {
      const validation = validateBankMatch(input, movement, bankTransactions.some((item) => item.id !== input.transactionId && item.matchedMovementId === movement.id));
      if (!validation.ok) return validation;
    }
    const id = input.transactionId ?? Math.max(0, ...bankTransactions.map((item) => item.id)) + 1;
    const transaction: BankTransaction = { id, date: input.date, description: input.description, value: input.value, direction: input.direction, matchedMovementId: input.movementId, notes: input.notes };
    setBankTransactions((current) => input.transactionId ? current.map((item) => item.id === input.transactionId ? transaction : item) : [transaction, ...current]);
    return { ok: true };
  };

  const cancelReservation = (id: number, reason: string) => {
    const reservation = reservations.find((item) => item.id === id);
    if (!reservation || reservation.status === "Hospedado") return;
    setReservations((current) => current.map((item) => item.id === id ? {
      ...item,
      status: "Cancelada",
      audit: `Cancelada em ${new Date().toLocaleString("pt-BR")}. Motivo: ${reason}`,
    } : item));
    setRooms((current) => current.map((room) =>
      room.id === reservation.roomId && room.status === "Reservado" ? { ...room, status: "Livre" } : room
    ));
  };

  const checkIn = (reservationId: number, payload: CheckInPayload): OperationResult & { stayId?: number } => {
    const reservation = reservations.find((item) => item.id === reservationId);
    const room = rooms.find((item) => item.id === payload.roomId);
    if (!reservation) return { ok: false, error: "Reserva não encontrada." };
    if (reservation.status !== "Confirmada") return { ok: false, error: "Esta reserva não está apta ou já possui check-in." };
    if (stays.some((stay) => stay.reservationId === reservation.id && stay.status === "Ativa")) return { ok: false, error: "Já existe uma hospedagem ativa para esta reserva." };
    if (reservation.entry > today() && !payload.authorizeEarlyArrival) return { ok: false, error: "Check-in antecipado exige autorização expressa." };
    if (reservation.exit <= today()) return { ok: false, error: "A previsão de saída já foi atingida. Atualize a reserva antes do check-in." };
    if (!room || room.category !== reservation.category) return { ok: false, error: "Selecione um quarto compatível com a categoria contratada." };
    if (room.capacity < reservation.guests) return { ok: false, error: `O quarto ${room.number} não comporta ${reservation.guests} hóspedes.` };
    const readiness = roomReadiness(room);
    if (!readiness.ready) return { ok: false, error: `O quarto ${room.number} está ${readiness.reason}.` };
    const conflict = reservations.some((item) =>
      item.id !== reservation.id && item.roomId === room.id && ["Confirmada", "Hospedado"].includes(item.status) &&
      periodsOverlap(reservation.entry, reservation.exit, item.entry, item.exit)
    );
    if (conflict) return { ok: false, error: "Existe outra hospedagem ativa para o quarto selecionado." };

    setReservations((current) => current.map((item) => item.id === reservationId ? {
      ...item,
      roomId: room.id,
      companions: payload.companions,
      status: "Hospedado",
      checkedInAt: new Date().toISOString(),
      audit: `Check-in confirmado em ${new Date().toLocaleString("pt-BR")}.`,
    } : item));
    setRooms((current) => current.map((item) => {
      if (item.id === room.id) return { ...item, status: "Ocupado", occupancyStatus: "Ocupado" };
      if (item.id === reservation.roomId && item.status === "Reservado") return { ...item, status: "Livre" };
      return item;
    }));
    const nextStayId = Math.max(0, ...stays.map((item) => item.id)) + 1;
    setStays((current) => [...current, {
      id: nextStayId,
      scenarioKey: reservation.scenarioKey,
      code: `HOS-${reservation.code.replace("RES-", "")}`,
      reservationId: reservation.id,
      clientId: reservation.clientId,
      roomId: room.id,
      guest: reservation.guest,
      companions: payload.companions,
      expectedExit: reservation.exit,
      checkedInAt: new Date().toISOString(),
      status: "Ativa",
      origin: "Reserva",
      history: [{ at: new Date().toISOString(), type: "Check-in", description: `Hospedagem iniciada a partir da reserva ${reservation.code}.` }],
    }]);
    setInvoices((current) => [...current, {
      id: Math.max(0, ...current.map((item) => item.id)) + 1,
      scenarioKey: reservation.scenarioKey,
      stayId: nextStayId,
      reservationId: reservation.id,
      baseValue: reservationBaseValue(reservation),
      extrasValue: 0,
      discounts: 0,
      total: reservationBaseValue(reservation),
      status: activeReceiptsTotal(reservation.id) >= reservationBaseValue(reservation) ? "Quitada" : "Aberta",
      updatedAt: new Date().toISOString(),
    }]);
    return { ok: true, stayId: nextStayId };
  };

  const transferStayRoom = (stayId: number, roomId: number, reason: string, responsible: string): OperationResult => {
    const stay = stays.find((item) => item.id === stayId && item.status === "Ativa");
    const destination = rooms.find((item) => item.id === roomId);
    if (!stay || !destination) return { ok: false, error: "Hospedagem ou quarto não encontrado." };
    if (stay.roomId === roomId) return { ok: false, error: "Selecione um quarto diferente do atual." };
    if (!reason.trim()) return { ok: false, error: "Informe o motivo da transferência." };
    const reservation = reservations.find((item) => item.id === stay.reservationId);
    if (!reservation || destination.capacity < reservation.guests || !roomReadiness(destination).ready) return { ok: false, error: "O quarto selecionado não está apto para transferência." };
    if (hasRemainingStayRoomConflict({ reservationId: reservation.id, roomId: destination.id, remainingFrom: today(), expectedExit: stay.expectedExit, reservations })) return { ok: false, error: "O quarto possui reserva ou hospedagem conflitante no período restante." };
    const at = new Date().toISOString();
    const previousRoomId = stay.roomId;
    const source = rooms.find((room) => room.id === previousRoomId);
    const remainingNights = Math.max(0, countNights(today(), stay.expectedExit));
    const upgradeCharge = Math.max(0, destination.rate - (source?.rate ?? 0)) * remainingNights;
    const updatedTransferCharge = (reservation.roomTransferCharge ?? 0) + upgradeCharge;
    const baseValue = reservationBaseValue({ ...reservation, roomTransferCharge: updatedTransferCharge });
    const extrasValue = consumptions.filter((item) => item.stayId === stay.id && !item.includedInPackage && item.status !== "Estornado").reduce((total, item) => total + item.value, 0);
    const invoice = invoices.find((item) => item.stayId === stay.id);
    const invoiceTotal = baseValue + extrasValue - (invoice?.discounts ?? 0);
    const transferDescription = `Quarto ${source?.number ?? previousRoomId} → ${destination.number}. Motivo: ${reason.trim()}. Responsável: ${responsible || "Recepção"}.${upgradeCharge > 0 ? ` Acréscimo por ${remainingNights} diária(s) restante(s): ${formatMoney(upgradeCharge)}.` : ""}`;
    setStays((current) => current.map((item) => item.id === stayId ? { ...item, roomId, history: [...(item.history ?? []), { at, type: "Transferência de quarto", description: transferDescription }] } : item));
    setReservations((current) => current.map((item) => item.id === stay.reservationId ? { ...item, roomId, category: destination.category, roomTransferCharge: updatedTransferCharge, audit: `Transferência para o quarto ${destination.number} em ${new Date(at).toLocaleString("pt-BR")}.${upgradeCharge > 0 ? ` Acréscimo de ${formatMoney(upgradeCharge)} incluído na fatura.` : ""}` } : item));
    if (invoice) setInvoices((current) => current.map((item) => item.id === invoice.id ? { ...item, baseValue, extrasValue, total: invoiceTotal, status: activeReceiptsTotal(reservation.id) >= invoiceTotal ? "Quitada" : "Aberta", updatedAt: at } : item));
    setRooms((current) => current.map((room) => room.id === roomId ? { ...room, status: "Ocupado", occupancyStatus: "Ocupado" } : room.id === previousRoomId ? { ...room, status: "Livre", occupancyStatus: "Livre", cleaningStatus: "Sujo" } : room));
    return { ok: true };
  };

  const walkInCheckIn = (input: { clientId: number; companions: string[]; entry: string; exit: string; roomId: number; guests: number; contractType: ContractType; packageId?: number; notes: string }): OperationResult & { stayId?: number } => {
    const client = clients.find((item) => item.id === input.clientId && item.status === "Ativo");
    const room = rooms.find((item) => item.id === input.roomId);
    const commercialPackage = input.packageId ? packages.find((item) => item.id === input.packageId) : undefined;
    const nights = countNights(input.entry, input.exit);
    if (!client || !room || nights < 1 || input.guests < 1) return { ok: false, error: "Preencha hóspede, período e quarto." };
    if (room.capacity < input.guests || !roomReadiness(room).ready) return { ok: false, error: "O quarto não está disponível para esta hospedagem." };
    if (stays.some((stay) => stay.roomId === room.id && stay.status === "Ativa")) return { ok: false, error: "O quarto já possui hospedagem ativa." };
    if (input.contractType === "Pacote comercial" && (!commercialPackage || !packageEligibility(commercialPackage, input.entry, input.exit, room.category, input.guests).eligible)) return { ok: false, error: "Pacote comercial incompatível." };
    const reservationId = Math.max(0, ...reservations.map((item) => item.id)) + 1;
    const stayId = Math.max(0, ...stays.map((item) => item.id)) + 1;
    const code = `RES-${1000 + reservationId}`;
    const snapshot = commercialPackage ? createPackageSnapshot(commercialPackage, nights) : undefined;
    const contractedValue = snapshot?.contractedValue ?? nights * room.rate;
    const at = new Date().toISOString();
    const reservation: Reservation = { id: reservationId, code, clientId: client.id, guest: client.name, companions: input.companions, entry: input.entry, exit: input.exit, category: room.category, roomId: room.id, guests: input.guests, status: "Hospedado", dailyRate: room.rate, contractType: input.contractType, contractedValue, packageId: commercialPackage?.id, packageSnapshot: snapshot, checkedInAt: at, notes: input.notes, audit: "Atendimento direto: reserva operacional criada no check-in." };
    setReservations((current) => [...current, reservation]);
    setStays((current) => [...current, { id: stayId, code: `HOS-${code.replace("RES-", "")}`, reservationId, clientId: client.id, roomId: room.id, guest: client.name, companions: input.companions, expectedExit: input.exit, checkedInAt: at, status: "Ativa", origin: "Atendimento direto", history: [{ at, type: "Check-in direto", description: "Hospedagem criada no balcão sem reserva prévia." }] }]);
    setInvoices((current) => [...current, { id: Math.max(0, ...current.map((item) => item.id)) + 1, stayId, reservationId, baseValue: contractedValue, extrasValue: 0, discounts: 0, total: contractedValue, status: "Aberta", updatedAt: at }]);
    setRooms((current) => current.map((item) => item.id === room.id ? { ...item, status: "Ocupado", occupancyStatus: "Ocupado" } : item));
    return { ok: true, stayId };
  };

  const checkOut = (reservationId: number): OperationResult => {
    const reservation = reservations.find((item) => item.id === reservationId);
    const stay = stays.find((item) => item.reservationId === reservationId && item.status === "Ativa");
    if (!reservation || reservation.status !== "Hospedado" || !stay) return { ok: false, error: "Hospedagem ativa não encontrada." };
    const invoice = invoices.find((item) => item.stayId === stay.id && item.reservationId === reservationId);
    if (!invoice) return { ok: false, error: "A hospedagem não possui fatura vinculada." };
    const extras = consumptions.filter((item) => item.stayId === stay.id && !item.includedInPackage && item.status !== "Estornado").reduce((total, item) => total + item.value, 0);
    const amounts = financialBalance(reservationBaseValue(reservation), extras, invoice.discounts, activeReceiptsTotal(reservationId));
    const total = amounts.total;
    const received = activeReceiptsTotal(reservationId);
    if (total - received > 0.009) return { ok: false, error: `Existe saldo pendente de ${formatMoney(total - received)}.` };
    setReservations((current) => current.map((item) => item.id === reservationId ? {
      ...item,
      status: "Concluída",
      audit: `Check-out finalizado em ${new Date().toLocaleString("pt-BR")}.`,
    } : item));
    setStays((current) => current.map((item) => item.id === stay.id ? { ...item, status: "Encerrada", checkedOutAt: new Date().toISOString(), history: [...(item.history ?? []), { at: new Date().toISOString(), type: "Check-out", description: "Hospedagem encerrada após conferência financeira." }] } : item));
    setInvoices((current) => current.map((item) => item.id === invoice.id ? {
      ...item, baseValue: reservationBaseValue(reservation), extrasValue: extras, total, status: "Quitada", updatedAt: new Date().toISOString(),
    } : item));
    setRooms((current) => current.map((room) => room.id === reservation.roomId ? { ...room, status: "Livre", occupancyStatus: "Livre", cleaningStatus: "Sujo" } : room));
    const nextTaskId = Math.max(0, ...housekeepingTasks.map((item) => item.id)) + 1;
    setHousekeepingTasks((current) => [...current, {
      id: nextTaskId,
      scenarioKey: reservation.scenarioKey,
      code: `LIM-${String(1100 + nextTaskId)}`,
      roomId: reservation.roomId,
      stayId: stay.id,
      scheduledAt: new Date().toISOString(),
      priority: "Alta",
      status: "Pendente",
      notes: `Limpeza de saída gerada pelo check-out de ${stay.code}.`,
    }]);
    return { ok: true };
  };

  const completeHousekeeping = (taskId: number, completedBy: string, notes: string): OperationResult => {
    const task = housekeepingTasks.find((item) => item.id === taskId);
    if (!task || task.status === "Concluída") return { ok: false, error: "Tarefa pendente não encontrada." };
    const room = rooms.find((item) => item.id === task.roomId);
    if (room?.occupancyStatus === "Ocupado") return { ok: false, error: `O quarto ${room.number} ainda está ocupado e não pode ser liberado pela limpeza.` };
    setHousekeepingTasks((current) => current.map((item) => item.id === taskId ? {
      ...item, status: "Concluída", completedAt: new Date().toISOString(), completedBy, notes,
    } : item));
    setRooms((current) => current.map((room) => room.id === task.roomId ? {
      ...room, cleaningStatus: "Limpo", status: deriveRoomStatus(room),
    } : room));
    return { ok: true };
  };

  const setRoomMaintenance = (roomNumber: string, blocked: boolean) => {
    setRooms((current) => current.map((room) => room.number === roomNumber ? {
      ...room,
      maintenanceStatus: blocked ? "Bloqueado" : "Disponível",
      status: deriveRoomStatus({ ...room, maintenanceStatus: blocked ? "Bloqueado" : "Disponível" }),
    } : room));
  };

  const resetDemonstrationData = () => {
    const demo = demonstrationState();
    setClients(demo.clients);
    setRooms(demo.rooms);
    setCategories(demo.categories);
    setReservations(demo.reservations);
    setReceipts(demo.receipts);
    setPackages(demo.packages);
    setConsumptions(demo.consumptions);
    setStays(demo.stays);
    setInvoices(demo.invoices);
    setHousekeepingTasks(demo.housekeepingTasks);
    setPayables(demo.payables);
    setCostCenters(demo.costCenters);
    setCashSessions(demo.cashSessions);
    setCashMovements(demo.cashMovements);
    setBankTransactions(demo.bankTransactions);
    setProducts(demo.products);
    setStockMovements(demo.stockMovements);
    setConferenceRooms(demo.conferenceRooms);
    setEventServices(demo.eventServices);
    setEvents(demo.events);
    setEventReceipts(demo.eventReceipts);
    setFiscalProfile(demo.fiscalProfile);
    setFiscalDocuments(demo.fiscalDocuments);
    setCommunications(demo.communications);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  };

  const cleanupDemoScenario = (scenarioKey: string) => {
    const roomIds = new Set([
      ...stays.filter((item) => item.scenarioKey === scenarioKey).map((item) => item.roomId),
      ...reservations.filter((item) => item.scenarioKey === scenarioKey).map((item) => item.roomId),
    ]);
    setClients((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setPackages((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setReservations((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setReceipts((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setConsumptions((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setStays((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setInvoices((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setHousekeepingTasks((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setEventReceipts((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setEvents((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setEventServices((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setConferenceRooms((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setFiscalDocuments((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setCommunications((current) => current.filter((item) => item.scenarioKey !== scenarioKey));
    setCashMovements((current) => current.filter((item) => ![...receipts.filter((receipt) => receipt.scenarioKey === scenarioKey).map((receipt) => receipt.id), ...eventReceipts.filter((receipt) => receipt.scenarioKey === scenarioKey).map((receipt) => receipt.id)].includes(item.sourceId)));
    setRooms((current) => current.filter((room) => room.scenarioKey !== scenarioKey).map((room) => roomIds.has(room.id) ? {
      ...room, status: "Livre", occupancyStatus: "Livre", cleaningStatus: "Limpo",
    } : room));
  };

  const activeReceiptsTotal = confirmedReceiptsTotal;

  const value = useMemo(() => ({
    clients, rooms, categories, reservations, receipts, packages, consumptions, stays, housekeepingTasks, invoices, products, stockMovements,
    payables, costCenters, cashSessions, cashMovements, bankTransactions,
    conferenceRooms, eventServices, events, eventReceipts,
    fiscalProfile, fiscalDocuments, communications,
    setClients, setRooms, setCategories, setReservations, setReceipts, setPackages, setConsumptions, saveProduct, changeProductStock,
    createClient, updateClient, recordConsumption, reverseConsumption, registerReceipt, changeReceiptStatus, cancelReservation, checkIn, walkInCheckIn, transferStayRoom, checkOut,
    completeHousekeeping, setRoomMaintenance, resetDemonstrationData, cleanupDemoScenario, activeReceiptsTotal,
    getReservationFinancials, createPayable, updatePayable, cancelPayable, registerPayablePayment,
    openCashSession, closeCashSession, registerManualCashMovement, createCostCenter, updateCostCenter,
    reconcileBankTransaction, cashExpectedTotal,
    createConferenceRoom, updateConferenceRoom, inactivateConferenceRoom,
    createEventService, updateEventService, inactivateEventService,
    createEvent, updateEvent, cancelEvent, registerEventReceipt, getEventFinancials,
    updateFiscalProfile, issueFiscalDocument, cancelFiscalDocument, reissueFiscalDocument, setCommunications,
  }), [clients, rooms, categories, reservations, receipts, packages, consumptions, stays, housekeepingTasks, invoices, payables, costCenters, cashSessions, cashMovements, bankTransactions, conferenceRooms, eventServices, events, eventReceipts, fiscalProfile, fiscalDocuments, communications, products, stockMovements]);

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useHotelOperations() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error("useHotelOperations must be used inside HotelOperationsProvider");
  return context;
}

export function packageEligibility(commercialPackage: CommercialPackage, entry: string, exit: string, category: string, guests: number) {
  const reasons: string[] = [];
  const nights = countNights(entry, exit);
  if (!commercialPackage.active) reasons.push("pacote inativo");
  if (entry && entry < commercialPackage.validFrom) reasons.push("entrada anterior à vigência");
  if (exit && exit > commercialPackage.validTo) reasons.push("saída posterior à vigência");
  if (category && !commercialPackage.roomCategories.includes(category)) reasons.push("categoria não contemplada");
  if (nights && nights < commercialPackage.minNights) reasons.push(`mínimo de ${commercialPackage.minNights} diárias`);
  if (nights && nights > commercialPackage.maxNights) reasons.push(`máximo de ${commercialPackage.maxNights} diárias`);
  if (guests > commercialPackage.includedGuests) reasons.push(`contempla até ${commercialPackage.includedGuests} hóspedes`);
  return { eligible: reasons.length === 0, reasons, nights };
}

export function calculatePackageValue(commercialPackage: CommercialPackage, nights: number) {
  const gross = commercialPackage.price * (commercialPackage.priceRule === "Por diária" ? nights : 1);
  return gross * (1 - commercialPackage.discountPercent / 100);
}

export function createPackageSnapshot(commercialPackage: CommercialPackage, nights: number) {
  return snapshotFor(commercialPackage, nights);
}

export function reservationBaseValue(reservation: Reservation) {
  const contracted = reservation.packageSnapshot?.contractedValue ?? reservation.contractedValue ?? countNights(reservation.entry, reservation.exit) * reservation.dailyRate;
  return contracted + (reservation.roomTransferCharge ?? 0);
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
