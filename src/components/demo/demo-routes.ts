import type { Page } from "../AppShell";
import type { DemoRoute, DemoRouteId, DemoStep } from "./demo-types";

const area = (page: Page) => `[data-tour-page="${page}"]`;
const target = (name: string) => `[data-demo-target="${name}"]`;

function unavailableStep(
  routeId: DemoRouteId,
  id: string,
  module: string,
  page: Page,
  title: string,
  process: string,
  rfs: string,
  entities: string[],
  description: string,
  delivery: "B" | "C",
): DemoStep {
  return {
    id, routeId, module, page, selector: area(page), title, process, rfs, entities,
    description,
    inputData: {},
    expectedResult: "Operacao real concluida e validada no estado compartilhado.",
    action: { kind: "unavailable", reason: `Integracao operacional prevista para a Entrega ${delivery}. A etapa nao sera marcada como executada nesta entrega.` },
  };
}

function operationalStep(
  id: string,
  module: string,
  page: Page,
  title: string,
  process: string,
  rfs: string,
  entities: string[],
  description: string,
  command: string,
  inputData: DemoStep["inputData"] = {},
  selector = area(page),
  cta?: string,
): DemoStep {
  return {
    id, routeId: "guest-journey", module, page, selector, title, process, rfs, entities,
    description, inputData,
    expectedResult: "Operacao real concluida e validada no estado compartilhado, sem duplicidade.",
    action: command ? { kind: "form-command", target: page, command } : { kind: "manual", validation: id },
    cta,
  };
}

const clientInput = {
  name: "Joao Silva", cpf: "012.345.678-90", phone: "(69) 99999-0105",
  email: "joao.demo@example.com", postalCode: "76801-100", street: "Rua Academica",
  addressNumber: "105", district: "Centro", city: "Porto Velho", state: "RO",
  documentNumber: "1234567", birthDate: "1990-05-12", gender: "Masculino",
  emergencyContact: "Ana Silva", emergencyPhone: "(69) 99999-0106",
  preferredRoomType: "Standard", preferredFloor: "Alto (6o+)",
  preferences: "Cliente ficticio exclusivo do cenario academico.",
};

export const guestJourneyRoute: DemoRoute = {
  id: "guest-journey",
  name: "Jornada Completa do Hospede",
  description: "Cenario independente de Joao Silva, do cadastro a limpeza e aos indicadores.",
  delivery: "B",
  steps: [
    operationalStep("journey-client-open", "Hospedes", "hospedes", "1. Cadastro do hospede", "PP1 - Gestao de clientes", "RF01-RF07", ["Cliente", "Documento"], "Vamos abrir o formulario real de cadastro do hospede.", "open-client-form", clientInput, target("new-client-button"), "Abrir cadastro"),
    operationalStep("journey-client-personal", "Hospedes", "hospedes", "Dados pessoais", "PP1 - Gestao de clientes", "RF01", ["Cliente"], "Os dados pessoais do hospede serao preenchidos para identificar o cliente.", "fill-client-personal", clientInput, target("client-personal-section")),
    operationalStep("journey-client-contact", "Hospedes", "hospedes", "Contatos", "PP1 - Gestao de clientes", "RF01", ["Cliente"], "Agora vamos registrar telefone, e-mail e contato de emergencia.", "fill-client-contact", clientInput, target("client-contact-section")),
    operationalStep("journey-client-address", "Hospedes", "hospedes", "Endereco", "PP1 - Gestao de clientes", "RF01", ["Cliente"], "O endereco completa o cadastro para comunicacao e conferencia operacional.", "fill-client-address", clientInput, target("client-address-section")),
    operationalStep("journey-client-review", "Hospedes", "hospedes", "Preferencias e revisao", "PP1 - Gestao de clientes", "RF01", ["Cliente"], "Registramos preferencias de hospedagem e deixamos o cadastro pronto para salvar.", "fill-client-preferences", clientInput, target("client-preferences-section")),
    operationalStep("journey-client-save", "Hospedes", "hospedes", "Salvar hospede", "PP1 - Gestao de clientes", "RF01", ["Cliente"], "O registro sera salvo usando a mesma operacao do formulario real e aparecera na tabela.", "save-client", clientInput, target("client-save-action"), "Salvar hospede"),
    operationalStep("journey-rooms", "Quartos", "quartos", "2. Consulta de quartos disponiveis", "PP3 - Gestao de quartos", "RF16-RF23", ["Quarto", "Categoria"], "Agora que cadastramos o hospede, vamos conferir um quarto livre, limpo e disponivel.", "inspect-room", { quarto: "preparado pelo cenario" }),
    operationalStep("journey-rate", "Pacotes", "pacotes", "3. Tarifa ou pacote", "PP7 - Pacotes comerciais", "RF39-RF42", ["Pacote", "Tarifa"], "Vamos preparar um pacote fechado de R$ 900,00 para tres diarias.", "prefill-package-form", { code: "DEMO-JOAO-900", name: "Jornada Joao Silva", price: 900, nights: 3 }, area("pacotes"), "Salvar pacote"),
    operationalStep("journey-reservation", "Reservas", "reservas", "4. Cadastro da reserva", "PP2 - Gestao de reservas", "RF08-RF15", ["Cliente", "Reserva", "Quarto"], "Com hospede, quarto e pacote definidos, vamos cadastrar a reserva real.", "prefill-reservation-form", { guests: 1, nights: 3 }, area("reservas"), "Confirmar reserva"),
    operationalStep("journey-deposit", "Reservas", "reservas", "5. Pagamento antecipado", "PP8 - Gestao financeira", "RF43-RF59", ["Recebimento", "Reserva"], "A reserva recebera uma antecipacao de R$ 450,00 via PIX.", "prefill-deposit-form", { value: 450, method: "PIX" }, area("reservas"), "Registrar pagamento"),
    operationalStep("journey-checkin", "Check-in", "checkinout", "6. Check-in", "PP4 - Entrada do hospede", "RF24-RF31", ["Reserva", "Hospedagem", "Fatura"], "Vamos abrir o fluxo real de check-in para conferencia e confirmacao.", "open-checkin", {}, area("checkinout"), "Realizar check-in"),
    operationalStep("journey-consumption", "Consumos", "consumos", "7. Consumos", "PP5 - Conta da hospedagem", "PP5 / integracao operacional", ["Hospedagem", "Consumo"], "Durante a hospedagem, registramos um consumo extra de R$ 120,00.", "prefill-consumption-form", { service: "Room Service", value: 120 }, area("consumos"), "Confirmar consumo"),
    operationalStep("journey-invoice", "Check-in / Check-out", "checkinout", "8. Consulta da fatura", "PP4 e PP8 - Faturamento", "RF24-RF31, RF43-RF59", ["Fatura", "Recebimento"], "A fatura mostra total, pagamentos ja recebidos e saldo em aberto.", "open-invoice"),
    operationalStep("journey-payment", "Financeiro", "financeiro", "9. Quitar saldo", "PP8 - Gestao financeira", "RF43-RF59", ["Recebimento", "Caixa"], "Vamos exibir a conta operacional para quitar o saldo restante.", "open-receivable", {}, area("financeiro"), "Quitar saldo"),
    operationalStep("journey-checkout", "Check-out", "checkinout", "10. Check-out", "PP4 - Saida do hospede", "RF24-RF31", ["Hospedagem", "Quarto", "Fatura"], "Com a conta quitada, o check-out encerra a hospedagem e gera a tarefa de limpeza.", "open-checkout", {}, area("checkinout"), "Realizar check-out"),
    operationalStep("journey-history", "Hospedes", "hospedes", "11. Historico do cliente", "PP1 - Historico", "RF02", ["Cliente", "Hospedagem"], "O historico do hospede passa a exibir a hospedagem encerrada.", "open-client-history"),
    operationalStep("journey-cleaning", "Limpeza & Manutencao", "limpeza", "12. Limpeza do quarto", "PP10 - Governanca", "RF79-RF88", ["Tarefa", "Quarto"], "A tarefa gerada pelo check-out sera concluida para liberar o quarto.", "open-housekeeping", {}, area("limpeza"), "Concluir limpeza"),
    operationalStep("journey-results", "Dashboard", "dashboard", "13. Dashboard e Relatorios", "PP15 - Indicadores", "RF131-RF141", ["Indicador", "Hospedagem", "Receita"], "Por fim, conferimos os efeitos reais da jornada nos indicadores.", ""),
  ],
};

const adminModules: Array<[string, string, Page, string, string, string[]]> = [
  ["admin-clients", "Clientes", "hospedes", "RF01-RF07", "PP1 - Gestao de clientes", ["Cliente", "Documento"]],
  ["admin-reservations", "Reservas", "reservas", "RF08-RF15", "PP2 - Gestao de reservas", ["Reserva", "Recebimento"]],
  ["admin-rooms", "Quartos", "quartos", "RF16-RF23", "PP3 - Gestao de quartos", ["Quarto", "Categoria"]],
  ["admin-stays", "Check-in e Check-out", "checkinout", "RF24-RF31", "PP4 - Hospedagens", ["Reserva", "Hospedagem", "Fatura"]],
  ["admin-consumptions", "Consumos", "consumos", "PP5", "PP5 - Consumos", ["Hospedagem", "Consumo"]],
  ["admin-stock", "Estoque", "estoque", "RF32-RF38", "PP6 - Estoque", ["Grupo", "Produto", "Movimentacao"]],
  ["admin-packages", "Pacotes", "pacotes", "RF39-RF42", "PP7 - Pacotes", ["Pacote", "Beneficio"]],
  ["admin-finance", "Financeiro", "financeiro", "RF43-RF59", "PP8 - Financeiro", ["Caixa", "Conta", "Recebimento"]],
  ["admin-staff", "Funcionarios", "funcionarios", "RF60-RF78", "PP9 - Funcionarios", ["Funcionario", "Cargo", "Turno"]],
  ["admin-governance", "Limpeza e Manutencao", "limpeza", "RF79-RF88", "PP10 - Governanca", ["Tarefa", "Manutencao"]],
  ["admin-events", "Eventos e Salas", "eventos", "RF89-RF100", "PP11 - Eventos", ["Evento", "Sala", "Servico"]],
  ["admin-messages", "Comunicacoes", "comunicacoes", "RF101-RF103", "PP12 - Comunicacoes", ["Mensagem", "Fila"]],
  ["admin-fiscal", "Notas Fiscais e Recibos", "fiscal", "RF104-RF114", "PP13 - Fiscal", ["Nota", "Recibo"]],
  ["admin-access", "Usuarios e Permissoes", "usuarios", "RF115-RF130", "PP14 - Acesso", ["Usuario", "Perfil", "Log"]],
  ["admin-reports", "Relatorios e Dashboard", "relatorios", "RF131-RF141", "PP15 - Indicadores", ["Relatorio", "Indicador"]],
];

export const hotelAdministrationRoute: DemoRoute = {
  id: "hotel-administration",
  name: "Administracao Completa do Hotel",
  description: "Roteiro administrativo independente pelos 15 processos principais.",
  delivery: "C",
  steps: adminModules.map(([id, module, page, rfs, process, entities], index) =>
    id === "admin-events"
      ? operationalStep("admin-events", module, page, `${index + 1}. ${module}`, process, rfs, entities, "Cadastrar sala, servico e evento com agenda, cronograma, cobranca e consulta do resultado.", "prefill-event-form", { event: "Treinamento Corporativo", contractor: "Empresa Exemplo Ltda.", total: 2100 }, area("eventos"), "Cadastrar evento")
      : unavailableStep("hotel-administration", id, module, page, `${index + 1}. ${module}`, process, rfs, entities, "Executar uma operacao administrativa real e verificavel no modulo.", "C"),
  ),
};

export const demoRoutes: Record<DemoRouteId, DemoRoute> = {
  "guest-journey": guestJourneyRoute,
  "hotel-administration": hotelAdministrationRoute,
};
