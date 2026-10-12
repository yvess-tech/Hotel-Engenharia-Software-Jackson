import type { Page } from "../AppShell";

export type TourCondition =
  | "demo-client"
  | "demo-reservation"
  | "demo-room-ready"
  | "demo-active-stay"
  | "demo-consumption"
  | "demo-invoice"
  | "demo-paid"
  | "demo-checkout"
  | "demo-cleaning-created"
  | "demo-cleaning-complete";

export type TourStep = {
  id: string;
  module: string;
  page: Page;
  selector: string;
  title: string;
  description: string;
  process: string;
  rfs: string;
  entities: string[];
  integrations: string[];
  condition?: TourCondition;
  conditionHint?: string;
};

export type TourScript = {
  id: "academic" | "stay" | "module";
  name: string;
  description: string;
  steps: TourStep[];
};

const pageHeader = (page: Page) => `[data-tour-page="${page}"] .page-header`;
const pageArea = (page: Page) => `[data-tour-page="${page}"]`;

function tourStep(
  id: string,
  module: string,
  page: Page,
  title: string,
  description: string,
  process: string,
  rfs: string,
  entities: string[],
  integrations: string[],
  selector = pageArea(page),
): TourStep {
  return { id, module, page, selector, title, description, process, rfs, entities, integrations };
}

export const academicSteps: TourStep[] = [
  tourStep("dashboard-overview", "Dashboard", "dashboard", "Indicadores principais", "Mostra a situacao atual do hotel: ocupacao, RevPAR operacional, receita recebida e media de permanencia. Use esta tela para abrir a apresentacao com um panorama rapido.", "Acompanhamento diario", "RF131-RF141", ["Indicador", "Quarto", "Recebimento"], ["Quartos", "Reservas", "Financeiro"], pageHeader("dashboard")),
  tourStep("dashboard-alerts", "Dashboard", "dashboard", "Alertas e reservas recentes", "Acompanha quartos livres, sujos, bloqueados, tarefas pendentes e reservas recentes. Essa parte ajuda a recepcao e a gestao a priorizar o trabalho do dia.", "Acompanhamento diario", "RF131-RF141", ["Quarto", "Reserva", "Tarefa"], ["Limpeza", "Reservas"]),

  tourStep("guests-register", "Hospedes", "hospedes", "Cadastrar hospede", "Cria a ficha do cliente com dados pessoais, documento, endereco, contatos, preferencias e documentos anexados. O cadastro e a base para reserva, check-in e historico.", "Recepcao - clientes", "RF01", ["Cliente", "Documento"], ["Reservas", "Check-in"], pageHeader("hospedes")),
  tourStep("guests-search", "Hospedes", "hospedes", "Consultar e editar hospede", "Permite buscar por nome, CPF ou e-mail, abrir a ficha completa, atualizar dados e consultar o historico de hospedagens encerradas.", "Recepcao - clientes", "RF02-RF07", ["Cliente", "Historico"], ["Check-out", "Reservas"]),

  tourStep("rooms-status", "Quartos", "quartos", "Mapa de quartos", "Mostra categoria, capacidade, tarifa, ocupacao, limpeza e manutencao. O sistema separa quarto livre de quarto realmente pronto para uso.", "Recepcao - quartos", "RF16-RF23", ["Quarto", "Categoria"], ["Reservas", "Check-in"], pageHeader("quartos")),
  tourStep("rooms-availability", "Quartos", "quartos", "Disponibilidade e bloqueios", "A reserva verifica conflito por periodo. O check-in tambem valida limpeza e manutencao, evitando hospedar cliente em quarto sujo ou bloqueado.", "Recepcao - quartos", "RF16-RF23", ["Quarto", "Manutencao"], ["Limpeza", "Reservas"]),

  tourStep("packages-register", "Pacotes", "pacotes", "Cadastrar pacote", "Define codigo, nome, preco, vigencia, quantidade de diarias, categoria elegivel e beneficios. O pacote organiza ofertas comerciais do hotel.", "Comercial", "RF39-RF42", ["Pacote", "Beneficio"], ["Reservas"], pageHeader("pacotes")),
  tourStep("packages-rules", "Pacotes", "pacotes", "Aplicar regras comerciais", "Ao usar pacote em uma reserva, o sistema valida elegibilidade e salva um snapshot das condicoes contratadas para a fatura nao mudar depois.", "Comercial", "RF39-RF42", ["Pacote", "Reserva"], ["Fatura", "Consumos"]),

  tourStep("reservations-register", "Reservas", "reservas", "Cadastrar reserva", "Seleciona hospede, periodo, categoria, quarto, quantidade de pessoas, modalidade comercial e observacoes. A tela calcula valor contratado e saldo previsto.", "Recepcao - reservas", "RF08-RF15", ["Reserva", "Cliente", "Quarto"], ["Hospedes", "Quartos", "Pacotes"], pageHeader("reservas")),
  tourStep("reservations-payments", "Reservas", "reservas", "Recebimentos antecipados", "Registra pagamento antecipado vinculado a reserva, consulta recebimentos e permite cancelar ou estornar quando necessario.", "Recepcao - reservas", "RF43-RF59", ["Recebimento", "Reserva"], ["Financeiro"]),
  tourStep("reservations-actions", "Reservas", "reservas", "Consultar, atualizar e cancelar", "A lista permite consultar detalhes, alterar reservas ainda nao hospedadas e cancelar mantendo historico e auditoria.", "Recepcao - reservas", "RF08-RF15", ["Reserva", "Auditoria"], ["Quartos", "Financeiro"]),

  tourStep("checkin-start", "Check-in", "checkinout", "Realizar check-in", "Transforma uma reserva confirmada em hospedagem ativa. Antes de confirmar, o sistema confere reserva, cliente, capacidade, periodo e quarto pronto.", "Operacao da hospedagem", "RF24-RF31", ["Reserva", "Hospedagem"], ["Reservas", "Quartos"], pageArea("checkinout")),
  tourStep("checkin-invoice", "Check-in", "checkinout", "Criar fatura da hospedagem", "Ao concluir o check-in, a hospedagem e a fatura passam a existir para receber consumos, pagamentos e conferencia no check-out.", "Operacao da hospedagem", "RF24-RF31", ["Hospedagem", "Fatura"], ["Consumos", "Financeiro"]),

  tourStep("consumptions-register", "Consumos", "consumos", "Lancar consumo", "Registra servicos usados por uma hospedagem ativa, como room service, restaurante, lavanderia ou outro extra.", "Servicos da hospedagem", "PP5", ["Consumo", "Hospedagem"], ["Fatura"], pageHeader("consumos")),
  tourStep("consumptions-package", "Consumos", "consumos", "Diferenciar incluso e extra", "Beneficios inclusos no pacote podem ser registrados sem nova cobranca; consumos extras entram no total da fatura.", "Servicos da hospedagem", "PP5", ["Beneficio", "Consumo"], ["Pacotes", "Check-out"]),

  tourStep("finance-receivable", "Financeiro", "financeiro", "Contas a receber", "Mostra saldos ligados a reservas e hospedagens. A quitacao feita aqui atualiza a mesma fatura usada no check-out.", "Gestao financeira", "RF43-RF59", ["Recebimento", "Fatura"], ["Reservas", "Check-out"], pageHeader("financeiro")),
  tourStep("finance-cash", "Financeiro", "financeiro", "Caixa e conciliacao", "Organiza movimentacoes financeiras, formas de pagamento, contas administrativas e conciliacao para controle gerencial.", "Gestao financeira", "RF43-RF59", ["Caixa", "Conta"], ["Relatorios"]),

  tourStep("checkout-balance", "Check-out", "checkinout", "Conferir saldo", "O check-out recalcula hospedagem, pacote, consumos e pagamentos. Se ainda houver saldo, a saida fica bloqueada ate a quitacao.", "Saida do hospede", "RF24-RF31", ["Fatura", "Recebimento"], ["Financeiro"], pageArea("checkinout")),
  tourStep("checkout-finish", "Check-out", "checkinout", "Encerrar hospedagem", "Quando tudo esta correto, o sistema encerra a hospedagem, atualiza o historico do hospede e gera a tarefa de limpeza do quarto.", "Saida do hospede", "RF24-RF31", ["Hospedagem", "Quarto"], ["Limpeza", "Historico"]),

  tourStep("cleaning-tasks", "Limpeza e Manutencao", "limpeza", "Tarefas de limpeza", "Lista tarefas de entrada, saida e rotina. A conclusao informa responsavel e libera o quarto quando a limpeza termina.", "Governanca", "RF79-RF88", ["Tarefa", "Quarto"], ["Check-out", "Quartos"], pageHeader("limpeza")),
  tourStep("cleaning-maintenance", "Limpeza e Manutencao", "limpeza", "Manutencao e bloqueios", "Registra manutencoes e bloqueios impeditivos. Um quarto bloqueado nao deve ser usado em reserva ou check-in.", "Governanca", "RF79-RF88", ["Manutencao", "Quarto"], ["Quartos", "Funcionarios"]),

  tourStep("stock-products", "Estoque", "estoque", "Produtos e grupos", "Controla itens usados pelo hotel, como materiais de limpeza, frigobar e suprimentos. Grupos ajudam a organizar a consulta.", "Suprimentos", "RF32-RF38", ["Produto", "Grupo"], ["Limpeza", "Consumos"], pageHeader("estoque")),
  tourStep("stock-movements", "Estoque", "estoque", "Entradas, saidas e alertas", "Registra movimentacoes, consulta saldo, evita inconsistencias e exibe alerta de reposicao quando o estoque fica baixo.", "Suprimentos", "RF32-RF38", ["Movimentacao", "Saldo"], ["Financeiro"]),

  tourStep("staff-register", "Funcionarios", "funcionarios", "Cadastro da equipe", "Mantem funcionarios, cargos, contatos e situacao cadastral. Isso permite associar responsaveis as rotinas internas.", "Gestao de pessoas", "RF60-RF78", ["Funcionario", "Cargo"], ["Limpeza", "Usuarios"], pageHeader("funcionarios")),
  tourStep("staff-shifts", "Funcionarios", "funcionarios", "Escalas, ponto e atribuicoes", "Acompanha turnos, registros de ponto e distribuicao de tarefas. O foco e apoiar a gestao operacional da equipe.", "Gestao de pessoas", "RF60-RF78", ["Turno", "Ponto"], ["Eventos", "Limpeza"]),

  tourStep("events-rooms", "Eventos", "eventos", "Salas e agenda", "Gerencia salas de eventos, horarios e conflitos. A agenda ajuda a visualizar quando cada espaco esta reservado.", "Eventos e salas", "RF89-RF100", ["Sala", "Evento"], ["Financeiro"], pageHeader("eventos")),
  tourStep("events-services", "Eventos", "eventos", "Servicos do evento", "Permite associar servicos, responsaveis e valores ao evento, conectando a operacao comercial com controle financeiro.", "Eventos e salas", "RF89-RF100", ["Servico", "Evento"], ["Comunicacoes", "Funcionarios"]),

  tourStep("messages-queue", "Comunicacoes", "comunicacoes", "Fila de mensagens", "Organiza mensagens para hospedes e operacoes importantes, como reserva, check-in, check-out e avisos administrativos.", "Atendimento", "RF101-RF103", ["Mensagem", "Fila"], ["Reservas", "Check-in"], pageHeader("comunicacoes")),
  tourStep("messages-templates", "Comunicacoes", "comunicacoes", "Modelos e historico", "Permite usar textos padronizados e consultar o historico. No prototipo, o envio externo e simulado.", "Atendimento", "RF101-RF103", ["Template", "Historico"], ["Check-out"]),

  tourStep("fiscal-issue", "Fiscal", "fiscal", "Emitir notas e recibos", "Demonstra emissao de documentos fiscais ou recibos a partir de informacoes financeiras da hospedagem.", "Documentos fiscais", "RF104-RF114", ["Nota fiscal", "Recibo"], ["Financeiro"], pageHeader("fiscal")),
  tourStep("fiscal-manage", "Fiscal", "fiscal", "Consultar, cancelar e reemitir", "Permite acompanhar documentos emitidos, cancelar e reemitir quando necessario. A integracao fiscal externa nao e real neste prototipo.", "Documentos fiscais", "RF104-RF114", ["Documento fiscal"], ["Relatorios"]),

  tourStep("users-profiles", "Usuarios e Acesso", "usuarios", "Usuarios e perfis", "Cria usuarios, associa perfis e define permissoes por modulo. A navegacao muda conforme o acesso do usuario.", "Administracao do sistema", "RF115-RF130", ["Usuario", "Perfil"], ["Todos os modulos"], pageHeader("usuarios")),
  tourStep("users-audit", "Usuarios e Acesso", "usuarios", "Permissoes e logs", "Mostra a separacao de responsabilidades e registra acoes relevantes para auditoria academica do sistema.", "Administracao do sistema", "RF115-RF130", ["Permissao", "Log"], ["Seguranca"]),

  tourStep("reports-generate", "Relatorios", "relatorios", "Gerar relatorio", "Diferente do Dashboard, aqui o objetivo e escolher tipo e periodo para gerar uma consulta formal: ocupacao, receita, RevPAR, permanencia, rankings e desempenho.", "Consultas gerenciais", "RF131-RF141", ["Relatorio", "Indicador"], ["Financeiro", "Reservas"], pageHeader("relatorios")),
  tourStep("reports-export", "Relatorios", "relatorios", "Exportar e consultar historico", "Depois de gerar, o usuario pode exportar CSV, imprimir/PDF e consultar relatorios ja emitidos. E a area de documentacao gerencial.", "Consultas gerenciais", "RF131-RF141", ["Historico", "Exportacao"], ["Dashboard"]),
];

export const stayDemoSteps: TourStep[] = [
  tourStep("stay-client", "Hospedes", "hospedes", "1. Localize Maria Costa", "Consulte o cliente de demonstracao antes de iniciar a hospedagem.", "Identificacao do cliente", "RF01-RF07", ["Cliente"], ["Reservas"]),
  tourStep("stay-reservation", "Reservas", "reservas", "2. Consulte a reserva RES-1001", "Confira reserva, pacote, periodo e quarto contratado.", "Contratacao", "RF08-RF15", ["Reserva"], ["Quartos", "Check-in"]),
  tourStep("stay-room", "Quartos", "quartos", "3. Verifique o quarto 312", "Confirme que o quarto esta pronto para receber o hospede.", "Disponibilidade", "RF16-RF23", ["Quarto"], ["Limpeza"]),
  tourStep("stay-checkin", "Check-in", "checkinout", "4. Realize o check-in", "Inicie a hospedagem real a partir da reserva.", "Entrada", "RF24-RF31", ["Hospedagem"], ["Consumos"]),
  tourStep("stay-consumption", "Consumos", "consumos", "5. Lance um consumo", "Registre um servico usado durante a hospedagem.", "Conta", "PP5", ["Consumo"], ["Fatura"]),
  tourStep("stay-invoice", "Check-in / Check-out", "checkinout", "6. Consulte a fatura", "Confira valor contratado, extras, pagamentos e saldo.", "Conferencia", "RF24-RF31, RF43-RF59", ["Fatura"], ["Financeiro"]),
  tourStep("stay-payment", "Financeiro", "financeiro", "7. Receba o saldo", "Quite a conta antes do check-out.", "Liquidacao", "RF43-RF59", ["Recebimento"], ["Check-out"]),
  tourStep("stay-checkout", "Check-out", "checkinout", "8. Finalize o check-out", "Encerre a hospedagem e gere a tarefa de limpeza.", "Saida", "RF24-RF31", ["Hospedagem"], ["Limpeza"]),
  tourStep("stay-cleaning-created", "Limpeza e Manutencao", "limpeza", "9. Consulte a tarefa", "Veja a limpeza criada apos a saida.", "Governanca", "RF79-RF88", ["Tarefa"], ["Check-out"]),
  tourStep("stay-cleaning-complete", "Limpeza e Manutencao", "limpeza", "10. Conclua a limpeza", "Libere o quarto para novas reservas.", "Liberacao", "RF79-RF88", ["Quarto"], ["Dashboard"]),
  tourStep("stay-indicators", "Dashboard", "dashboard", "11. Confira os indicadores", "Observe o reflexo da operacao no Dashboard principal.", "Resultados", "RF131-RF141", ["Indicador"], ["Todos os modulos operacionais"]),
].map((step) => {
  const conditions: Partial<Record<string, TourCondition>> = {
    "stay-client": "demo-client",
    "stay-reservation": "demo-reservation",
    "stay-room": "demo-room-ready",
    "stay-checkin": "demo-active-stay",
    "stay-consumption": "demo-consumption",
    "stay-invoice": "demo-invoice",
    "stay-payment": "demo-paid",
    "stay-checkout": "demo-checkout",
    "stay-cleaning-created": "demo-cleaning-created",
    "stay-cleaning-complete": "demo-cleaning-complete",
  };
  return { ...step, condition: conditions[step.id], conditionHint: "Conclua a operacao real indicada para avancar." };
});

export const academicScript: TourScript = {
  id: "academic",
  name: "Tour do Sistema de Hotel",
  description: "Roteiro unico de onboarding pelas funcionalidades do sistema.",
  steps: academicSteps,
};

export const stayScript: TourScript = {
  id: "stay",
  name: "Jornada operacional do hospede",
  description: "Roteiro operacional mantido para validacoes internas.",
  steps: stayDemoSteps,
};

export function currentModuleScript(page: Page): TourScript {
  const steps = academicSteps.filter((item) => item.page === page);
  return {
    id: "module",
    name: steps[0] ? `Conhecer ${steps[0].module}` : "Conhecer modulo",
    description: "Resumo das funcionalidades do modulo atual.",
    steps: steps.length ? steps.map((step) => ({ ...step, id: `module-${step.id}` })) : [{ ...academicSteps[0], id: `module-${academicSteps[0].id}` }],
  };
}

export const scriptById = (id: string, currentPage: Page) => {
  if (id === "academic") return academicScript;
  if (id === "stay") return stayScript;
  return currentModuleScript(currentPage);
};
