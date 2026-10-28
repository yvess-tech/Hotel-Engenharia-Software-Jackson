import { useEffect, useMemo, useState } from "react"
import { useAccessControl } from "../../access-control"
import { validateBankMatch } from "../../domain/financial-rules"
import CashFlowPanel from "./CashFlowPanel"
import printDocument from "../print-document"
import {
  Alert,
  Badge,
  Btn,
  Card,
  FormActions,
  FormGrid,
  FullCol,
  Input,
  Modal,
  PageHeader,
  ResponsibleSelect,
  SectionTitle,
  Select,
  Table,
  Tabs,
  Textarea,
  formatDisplayDate,
} from "../ui"
import {
  PAYMENT_METHODS,
  derivePayableStatus,
  formatMoney,
  isCashPayment,
  OVERDUE_INVOICE_POLICY,
  paymentMethodLabel,
  pendingBalance,
  reservationBaseValue,
  today,
  useHotelOperations,
  type CashMovement,
  type CostCenter,
  type PayableAccount,
  type Reservation,
} from "../HotelOperationsContext"
import { useDemoEngine } from "../demo/DemoEngineContext"

type Tab = "fluxo" | "receber" | "pagar" | "caixa" | "centros" | "conciliacao"
type ModalType = "receber" | "receberEvento" | "newPagar" | "editPagar" | "payPagar" | "abrirCaixa" | "fecharCaixa" | "movCaixa" | "newCentro" | "editCentro" | "concilia" | null

const methodOptions = PAYMENT_METHODS.map((method) => ({
  value: method.id,
  label: method.label,
}))
const emptyPayable = {
  description: "",
  supplier: "",
  category: "Operacional",
  costCenterId: "",
  originalValue: "",
  dueDate: today(),
  notes: "",
}
const emptyPayment = {
  value: "",
  method: "pix",
  responsible: "Administracao",
  notes: "",
  date: today(),
}
const emptyReceipt = {
  value: "",
  method: "pix",
  responsible: "Recepcao",
  notes: "",
  date: today(),
}

export default function Financeiro() {
  const { activeAccount } = useAccessControl()
  const {
    reservations,
    receipts,
    consumptions,
    invoices,
    payables,
    costCenters,
    cashSessions,
    cashMovements,
    events,
    eventReceipts,
    bankTransactions,
    registerReceipt,
    createPayable,
    updatePayable,
    registerPayablePayment,
    openCashSession,
    closeCashSession,
    registerManualCashMovement,
    createCostCenter,
    updateCostCenter,
    reconcileBankTransaction,
    getReservationFinancials,
    cashExpectedTotal,
    getEventFinancials,
    registerEventReceipt,
  } = useHotelOperations()
  const demo = useDemoEngine()
  const [tab, setTab] = useState<Tab>("receber")
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedReservationId, setSelectedReservationId] =
    useState<number | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [selectedPayableId, setSelectedPayableId] = useState<number | null>(
    null,
  )
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null)
  const [receiptForm, setReceiptForm] = useState(emptyReceipt)
  const [payableForm, setPayableForm] = useState(emptyPayable)
  const [paymentForm, setPaymentForm] = useState(emptyPayment)
  const [cashOpenForm, setCashOpenForm] = useState({
    responsible: activeAccount?.name ?? "",
    openingCash: "500",
    shift: "Manhã" as "Manhã" | "Tarde" | "Noite",
    notes: "",
  })
  const [cashCloseForm, setCashCloseForm] = useState({
    countedCash: "",
    notes: "",
  })
  const [cashMoveForm, setCashMoveForm] = useState({
    direction: "saida",
    value: "",
    method: "cash",
    description: "",
    responsible: "Recepcao",
    notes: "",
  })
  const [centerForm, setCenterForm] = useState({
    code: "",
    name: "",
    description: "",
    active: true,
  })
  const [bankForm, setBankForm] = useState({
    date: today(),
    description: "",
    value: "",
    direction: "credito",
    movementId: "",
    notes: "",
  })
  const [message, setMessage] = useState("")
  const [notice, setNotice] = useState("")
  useEffect(() => { setMessage(""); if (modal) setNotice("") }, [modal])

  useEffect(() => {
    const command = demo.activeCommand
    if (
      !command ||
      command.target !== "financeiro" ||
      command.command !== "open-receivable"
    )
      return
    const reservationId = demo.scenario?.ids.reservationId
    setTab("receber")
    if (reservationId) {
      setSelectedReservationId(reservationId)
      setReceiptForm({
        ...emptyReceipt,
        value: "300",
        method: "debit_card",
        notes: "Pagamento parcial da jornada demonstrativa.",
      })
      setModal("receber")
    }
    demo.resolveCommand(command.id, {
      status: "running",
      message:
        "Conta operacional aberta. Registre R$ 300,00 em debito e depois R$ 270,00 em dinheiro.",
    })
  }, [demo.activeCommand])

  const receivables = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.status !== "Cancelada")
        .map((reservation) => {
          const financials = getReservationFinancials(reservation.id)
          const invoice = invoices.find(
            (item) => item.reservationId === reservation.id,
          )
          return {
            reservation,
            invoice,
            total: financials?.total ?? reservationBaseValue(reservation),
            received: financials?.received ?? 0,
            balance: financials?.balance ?? 0,
            status: financials?.status ?? "Pendente",
            lateCharges: financials?.lateCharges ?? 0,
            history: receipts.filter(
              (receipt) =>
                receipt.reservationId === reservation.id &&
                receipt.status === "Confirmado",
            ),
          }
        }),
    [reservations, receipts, consumptions, invoices],
  )

  const eventReceivables = useMemo(
    () =>
      events
        .filter((event) => event.billingType === "Separada")
        .map((event) => {
          const financials = getEventFinancials(event.id)
          return {
            event,
            total: financials?.total ?? event.totalContracted,
            received: financials?.received ?? 0,
            balance: financials?.balance ?? event.totalContracted,
            status: financials?.status ?? "Pendente",
            history: eventReceipts.filter(
              (receipt) =>
                receipt.eventId === event.id && receipt.status === "Confirmado",
            ),
          }
        }),
    [events, eventReceipts],
  )

  const openCash = cashSessions.find((session) => !session.closedAt)
  const todayMovements = cashMovements.filter(
    (movement) => movement.date === today(),
  )
  const financialEntriesToday = todayMovements
    .filter((movement) => movement.direction === "entrada")
    .reduce((total, movement) => total + movement.value, 0)
  const financialOutflowsToday = todayMovements
    .filter((movement) => movement.direction === "saida")
    .reduce((total, movement) => total + movement.value, 0)
  const financialNetToday = financialEntriesToday - financialOutflowsToday
  const payablePending = payables.reduce(
    (total, payable) =>
      total +
      (payable.canceledAt
        ? 0
        : pendingBalance(payable.originalValue, paidValue(payable))),
    0,
  )
  const receivablePending =
    receivables.reduce((total, item) => total + item.balance, 0) +
    eventReceivables.reduce((total, item) => total + (item.status === "Cancelada" ? 0 : item.balance), 0)
  const cashBalance = openCash ? cashExpectedTotal(openCash.id) : 0

  const selectedReceivable = receivables.find(
    (item) => item.reservation.id === selectedReservationId,
  )
  const selectedEventReceivable = eventReceivables.find(
    (item) => item.event.id === selectedEventId,
  )
  const selectedPayable = payables.find((item) => item.id === selectedPayableId)
  const selectedCenter = costCenters.find(
    (item) => item.id === selectedCenterId,
  )

  const saveReceipt = () => {
    if (!selectedReceivable) return
    const result = registerReceipt({
      reservationId: selectedReceivable.reservation.id,
      value: Number(receiptForm.value),
      method: receiptForm.method,
      date: receiptForm.date,
      responsible: receiptForm.responsible,
      notes: receiptForm.notes,
      operationKey: `financeiro-receipt-${Date.now()}`,
    })
    if (!result.ok) {
      setMessage(result.error ?? "Nao foi possivel registrar o recebimento.")
      return
    }
    setModal(null)
    setNotice("Recebimento registrado e fatura atualizada.")
  }

  const saveEventReceipt = () => {
    if (!selectedEventReceivable) return
    const result = registerEventReceipt({
      eventId: selectedEventReceivable.event.id,
      value: Number(receiptForm.value),
      method: receiptForm.method,
      date: receiptForm.date,
      responsible: receiptForm.responsible,
      notes: receiptForm.notes,
      operationKey: `financeiro-event-receipt-${Date.now()}`,
    })
    if (!result.ok) {
      setMessage(result.error ?? "Nao foi possivel registrar o recebimento.")
      return
    }
    setModal(null)
    setNotice("Recebimento do evento registrado no financeiro.")
  }

  const savePayable = () => {
    const input = {
      description: payableForm.description,
      supplier: payableForm.supplier,
      category: payableForm.category,
      costCenterId: Number(payableForm.costCenterId),
      originalValue: Number(payableForm.originalValue),
      dueDate: payableForm.dueDate,
      notes: payableForm.notes,
    }
    const result =
      modal === "editPagar" && selectedPayable
        ? updatePayable(selectedPayable.id, input)
        : createPayable(input)
    if (!result.ok) {
      setMessage(result.error ?? "Nao foi possivel salvar a conta.")
      return
    }
    setModal(null)
    setNotice("Conta a pagar salva.")
  }

  const savePayablePayment = () => {
    if (!selectedPayable) return
    const result = registerPayablePayment({
      payableId: selectedPayable.id,
      value: Number(paymentForm.value),
      method: paymentForm.method,
      responsible: paymentForm.responsible,
      date: paymentForm.date,
      notes: paymentForm.notes,
      operationKey: `financeiro-payable-${Date.now()}`,
    })
    if (!result.ok) {
      setMessage(result.error ?? "Nao foi possivel registrar o pagamento.")
      return
    }
    setModal(null)
    setNotice("Pagamento registrado.")
  }

  const saveCenter = () => {
    const result =
      selectedCenter && modal === "editCentro"
        ? updateCostCenter(selectedCenter.id, centerForm)
        : createCostCenter({
            code: centerForm.code,
            name: centerForm.name,
            description: centerForm.description,
          })
    if (!result.ok) {
      setMessage(result.error ?? "Nao foi possivel salvar o centro de custo.")
      return
    }
    setModal(null)
  }

  const reconciledRows = bankTransactions.map((transaction) => {
    const movement = cashMovements.find(
      (item) => item.id === transaction.matchedMovementId,
    )
    return {
      transaction,
      movement,
      difference: movement
        ? transaction.value - movement.value
        : transaction.value,
    }
  })

  return (
    <div className="ops-page">
      <PageHeader title="Financeiro" />
      <Alert type="info">
        Conciliação simulada - sem integração bancária externa. Os dados
        financeiros sao compartilhados com reservas, hospedagens, consumos,
        faturas e dashboard.
      </Alert>
      {notice && !modal && (
        <Alert type="success">
          {notice}
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <Kpi
            title="Total a receber"
            value={formatMoney(receivablePending)}
            help="Soma dos saldos pendentes de reservas, hospedagens, faturas e eventos com cobrança separada."
          />
        </Card>
        <Card>
          <Kpi
            title="Total a pagar"
            value={formatMoney(payablePending)}
            help="Soma dos saldos de contas a pagar nao canceladas."
          />
        </Card>
        <Card>
          <Kpi
            title="Entradas financeiras hoje"
            value={formatMoney(financialEntriesToday)}
            help="Recebimentos em dinheiro, PIX, cartão e transferência."
          />
        </Card>
        <Card>
          <Kpi
            title="Saídas financeiras hoje"
            value={formatMoney(financialOutflowsToday)}
            help="Pagamentos, reembolsos e demais saídas registradas no dia."
          />
        </Card>
        <Card>
          <Kpi
            title="Fluxo líquido hoje"
            value={formatMoney(financialNetToday)}
            help="Entradas financeiras menos saídas financeiras do dia."
          />
        </Card>
        <Card>
          <Kpi
            title="Dinheiro físico no caixa"
            value={formatMoney(cashBalance)}
            help="Dinheiro fisico esperado: abertura + entradas em dinheiro - saidas em dinheiro."
          />
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: "receber", label: "Contas a Receber" },
          { id: "fluxo", label: "Fluxo de Caixa" },
          { id: "pagar", label: "Contas a Pagar" },
          { id: "caixa", label: "Caixa" },
          { id: "centros", label: "Centros de Custo" },
          { id: "conciliacao", label: "Conciliacao Bancaria" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "fluxo" && <CashFlowPanel />}

      {tab === "receber" && (
        <Card>
          <SectionTitle>Contas a Receber Operacionais</SectionTitle>
          <Alert type="info">
            Faturas vencidas recebem multa de {OVERDUE_INVOICE_POLICY.lateFeePercent}% e juros de {OVERDUE_INVOICE_POLICY.dailyInterestPercent}% ao dia após {OVERDUE_INVOICE_POLICY.graceDays} dias de tolerância. Os encargos entram no saldo a receber.
          </Alert>
          <Table
            headers={[
              "Origem",
              "Cliente",
              "Descricao",
              "Total",
              "Encargos",
              "Recebido",
              "Saldo",
              "Situacao",
              "Historico",
              "Acao",
            ]}
            rows={[
              ...receivables.map((item) => [
                item.invoice
                  ? `Fatura ${item.reservation.code.replace("RES", "HOS")}`
                  : `Reserva ${item.reservation.code}`,
                item.reservation.guest,
                receivableDescription(item.reservation),
                formatMoney(item.total),
                item.lateCharges > 0 ? formatMoney(item.lateCharges) : "—",
                formatMoney(item.received),
                item.received > item.total ? `Crédito: ${formatMoney(item.received - item.total)}` : formatMoney(item.balance),
                <Badge label={item.status} />,
                item.history.length
                  ? item.history
                      .map(
                        (receipt) =>
                          `${formatDisplayDate(receipt.date)} ${formatMoney(receipt.value)} ${receipt.method}`,
                      )
                      .join(" | ")
                  : "Sem recebimentos",
                <Btn
                  small
                  disabled={item.balance <= 0}
                  onClick={() => {
                    setSelectedReservationId(item.reservation.id)
                    setReceiptForm({
                      ...emptyReceipt,
                      value: String(item.balance),
                    })
                    setMessage("")
                    setModal("receber")
                  }}
                >
                  Receber
                </Btn>,
              ]),
              ...eventReceivables.map((item) => [
                `Evento ${item.event.code}`,
                item.event.contractorName,
                item.event.name,
                formatMoney(item.total),
                "—",
                formatMoney(item.received),
                formatMoney(item.balance),
                <Badge label={item.status} />,
                item.history.length
                  ? item.history
                      .map(
                        (receipt) =>
                          `${formatDisplayDate(receipt.date)} ${formatMoney(receipt.value)} ${receipt.method}`,
                      )
                      .join(" | ")
                  : "Sem recebimentos",
                <Btn
                  small
                  disabled={
                    item.balance <= 0 || item.event.status === "Cancelado"
                  }
                  onClick={() => {
                    setSelectedEventId(item.event.id)
                    setReceiptForm({
                      ...emptyReceipt,
                      value: String(item.balance),
                    })
                    setMessage("")
                    setModal("receberEvento")
                  }}
                >
                  Receber
                </Btn>,
              ]),
            ]}
          />
        </Card>
      )}

      {tab === "pagar" && (
        <Card>
          <div className="flex justify-between items-center gap-3 mb-4">
            <SectionTitle>Contas a Pagar</SectionTitle>
            <Btn
              onClick={() => {
                setSelectedPayableId(null)
                setPayableForm({
                  ...emptyPayable,
                  costCenterId: String(costCenters[0]?.id ?? ""),
                })
                setModal("newPagar")
              }}
            >
              + Nova Conta
            </Btn>
          </div>
          <Table
            headers={[
              "Codigo",
              "Descricao",
              "Fornecedor",
              "Centro",
              "Valor",
              "Pago",
              "Saldo",
              "Situacao",
              "Acoes",
            ]}
            rows={payables.map((payable) => {
              const paid = paidValue(payable)
              const status = derivePayableStatus(
                payable.originalValue,
                paid,
                payable.dueDate,
                Boolean(payable.canceledAt),
                today(),
              )
              return [
                payable.code,
                payable.description,
                payable.supplier,
                costCenterName(costCenters, payable.costCenterId),
                formatMoney(payable.originalValue),
                formatMoney(paid),
                formatMoney(pendingBalance(payable.originalValue, paid)),
                <Badge label={status} />,
                <div className="table-actions">
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => {
                      setSelectedPayableId(payable.id)
                      setPayableForm({
                        description: payable.description,
                        supplier: payable.supplier,
                        category: payable.category,
                        costCenterId: String(payable.costCenterId),
                        originalValue: String(payable.originalValue),
                        dueDate: payable.dueDate,
                        notes: payable.notes,
                      })
                      setModal("editPagar")
                    }}
                  >
                    Editar
                  </Btn>
                  <Btn
                    small
                    disabled={
                      pendingBalance(payable.originalValue, paid) <= 0 ||
                      Boolean(payable.canceledAt)
                    }
                    onClick={() => {
                      setSelectedPayableId(payable.id)
                      setPaymentForm({
                        ...emptyPayment,
                        value: String(
                          pendingBalance(payable.originalValue, paid),
                        ),
                      })
                      setModal("payPagar")
                    }}
                  >
                    Pagar
                  </Btn>
                </div>,
              ]
            })}
          />
        </Card>
      )}

      {tab === "caixa" && (
        <div className="space-y-4">
          <Card>
            <div className="flex justify-between items-center gap-3 mb-4">
              <SectionTitle>Caixa</SectionTitle>
              {openCash ? (
                <Btn
                  variant="danger" confirmAction={false}
                  onClick={() => {
                    setCashCloseForm({
                      countedCash: "",
                      notes: "",
                    })
                    setModal("fecharCaixa")
                  }}
                >
                  Fechar Caixa
                </Btn>
              ) : (
                <Btn onClick={() => setModal("abrirCaixa")}>Abrir Caixa</Btn>
              )}
            </div>
            {openCash ? (
              <Alert type="success">
                Caixa {openCash.code} aberto por {openCash.responsible} · turno{" "}
                {openCash.shift ?? "Não informado"}. Apenas dinheiro compõe o saldo físico. Pix, cartões e transferências aparecem nos movimentos financeiros.
              </Alert>
            ) : (
              <Alert type="warning">
                Não há caixa aberto. Abra o caixa para receber, pagar ou devolver em dinheiro. Pix, cartões e transferências podem ser registrados normalmente.
              </Alert>
            )}
            <FormActions>
              <Btn variant="secondary" disabled={!openCash} onClick={() => setModal("movCaixa")}>
                + Movimento Manual
              </Btn>
            </FormActions>
          </Card>
          <Card>
            <SectionTitle>Movimentacoes</SectionTitle>
            <Table
              headers={[
                "Data",
                "Tipo",
                "Metodo",
                "Descricao",
                "Valor",
                "Caixa",
                "Responsavel",
              ]}
              rows={cashMovements.map((movement) => [
                movement.date,
                movement.direction === "entrada" ? "Entrada" : "Saida",
                paymentMethodLabel(movement.methodId),
                movement.description,
                `${
                  movement.direction === "entrada" ? "+" : "-"
                }${formatMoney(movement.value)}`,
                movement.sessionId
                  ? (cashSessions.find((item) => item.id === movement.sessionId)
                      ?.code ?? "-")
                  : "Sem caixa",
                movement.responsible,
              ])}
            />
          </Card>
          <Card>
            <SectionTitle>Histórico de fechamentos</SectionTitle>
            <Table
              headers={[
                "Caixa",
                "Turno",
                "Responsável",
                "Abertura",
                "Fechamento",
                "Esperado",
                "Contado",
                "Diferença",
                "Conferência",
              ]}
              rows={cashSessions
                .filter((session) => session.closedAt)
                .map((session) => [
                  session.code,
                  session.shift ?? "—",
                  session.responsible,
                  new Date(session.openedAt).toLocaleString("pt-BR"),
                  new Date(session.closedAt!).toLocaleString("pt-BR"),
                  formatMoney(
                    session.expectedCash ?? cashExpectedTotal(session.id),
                  ),
                  formatMoney(session.countedCash ?? 0),
                  formatMoney(session.difference ?? 0),
                  <div className="space-y-1 text-xs">
                    <p>Aberto por {session.openedBy?.name ?? session.responsible}</p>
                    <p>Fechado por {session.closedBy?.name ?? "Não registrado"}</p>
                    {session.closingNotes && <p>{session.closingNotes}</p>}
                    <Btn small variant="ghost" onClick={() => printDocument(`Fechamento de caixa · ${session.code}`, [
                      { title: "Conferência do turno", headers: ["Informação", "Valor"], rows: [["Turno", session.shift ?? "—"], ["Responsável", session.responsible], ["Aberto por", session.openedBy?.name ?? session.responsible], ["Fechado por", session.closedBy?.name ?? "Não registrado"], ["Esperado", formatMoney(session.expectedCash ?? cashExpectedTotal(session.id))], ["Contado", formatMoney(session.countedCash ?? 0)], ["Diferença", formatMoney(session.difference ?? 0)], ["Justificativa", session.closingNotes ?? "—"]] },
                      { title: "Movimentos do turno", headers: ["Descrição", "Tipo", "Forma", "Valor"], rows: cashMovements.filter((movement) => movement.sessionId === session.id).map((movement) => [movement.description, movement.direction === "entrada" ? "Entrada" : "Saída", paymentMethodLabel(movement.methodId), formatMoney(movement.value)]) },
                    ])}>Imprimir fechamento</Btn>
                  </div>,
                ])}
            />
          </Card>
        </div>
      )}

      {tab === "centros" && (
        <Card>
          <div className="flex justify-between items-center gap-3 mb-4">
            <SectionTitle>Centros de Custo</SectionTitle>
            <Btn
              onClick={() => {
                setSelectedCenterId(null)
                setCenterForm({
                  code: "",
                  name: "",
                  description: "",
                  active: true,
                })
                setModal("newCentro")
              }}
            >
              + Novo Centro
            </Btn>
          </div>
          <Table
            headers={[
              "Codigo",
              "Nome",
              "Descricao",
              "Receitas",
              "Despesas",
              "Saldo",
              "Status",
              "Acoes",
            ]}
            rows={costCenters.map((center) => {
              const totals = costCenterTotals(
                center,
                receipts,
                payables,
                cashMovements,
              )
              return [
                center.code,
                center.name,
                center.description,
                formatMoney(totals.receipts),
                formatMoney(totals.payments),
                formatMoney(totals.receipts - totals.payments),
                <Badge label={center.active ? "Ativo" : "Inativo"} />,
                <Btn
                  small
                  variant="ghost"
                  onClick={() => {
                    setSelectedCenterId(center.id)
                    setCenterForm({
                      code: center.code,
                      name: center.name,
                      description: center.description,
                      active: center.active,
                    })
                    setModal("editCentro")
                  }}
                >
                  Editar
                </Btn>,
              ]
            })}
          />
        </Card>
      )}

      {tab === "conciliacao" && (
        <Card>
          <div className="flex justify-between items-center gap-3 mb-4">
            <SectionTitle>Conciliação Bancária</SectionTitle>
            <Btn
              onClick={() => {
                setBankForm({
                  date: today(),
                  description: "",
                  value: "",
                  direction: "credito",
                  movementId: "",
                  notes: "",
                })
                setModal("concilia")
              }}
            >
              + Registrar Conciliação
            </Btn>
          </div>
          <Alert type="info">
            Compare uma transacao bancaria informada manualmente com uma
            movimentacao do sistema. Divergencias ficam registradas sem
            substituir valores.
          </Alert>
          <Table
            headers={[
              "Data",
              "Banco",
              "Tipo",
              "Valor banco",
              "Movimento sistema",
              "Diferenca",
              "Status",
            ]}
            rows={reconciledRows.map(
              ({ transaction, movement, difference }) => [
                transaction.date,
                transaction.description,
                transaction.direction === "credito" ? "Credito" : "Debito",
                formatMoney(transaction.value),
                movement
                  ? `${movement.description} (${formatMoney(movement.value)})`
                  : "Nao vinculado",
                formatMoney(Math.abs(difference)),
                <Badge
                  label={
                    movement && validateBankMatch(transaction, movement, bankTransactions.some((other) => other.id !== transaction.id && other.matchedMovementId === movement.id)).ok
                      ? "Conciliado"
                      : movement ? "Divergente" : "A conferir"
                  }
                />,
              ],
            )}
          />
        </Card>
      )}

      {modal === "receber" && selectedReceivable && (
        <Modal
          wide
          title={`Receber ${selectedReceivable.reservation.code}`}
          onClose={() => setModal(null)}
        >
          <Alert type="info">{receiptForm.method === "cash" ? openCash ? "Dinheiro será movimentado no caixa aberto deste turno." : "Para usar dinheiro, abra o caixa em Financeiro → Caixa. Seus dados serão preservados enquanto você confere a operação." : "Este pagamento será registrado no financeiro. Ele não altera o dinheiro físico da gaveta."}</Alert>
          <FormGrid cols={2}>
            <Input
              label="Cliente"
              value={selectedReceivable.reservation.guest}
              readOnly
            />
            <Input
              label="Reserva / hospedagem"
              value={
                selectedReceivable.invoice
                  ? selectedReceivable.reservation.code.replace("RES", "HOS")
                  : selectedReceivable.reservation.code
              }
              readOnly
            />
            <Input
              label="Valor total devido"
              value={formatMoney(selectedReceivable.total)}
              readOnly
            />
            <Input
              label="Valor ja recebido"
              value={formatMoney(selectedReceivable.received)}
              readOnly
            />
            <Input
              label="Saldo pendente"
              value={formatMoney(selectedReceivable.balance)}
              readOnly
            />
            <Input
              label="Valor a receber *"
              type="number"
              min="0.01"
              step="0.01"
              max={selectedReceivable.balance}
              value={receiptForm.value}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, value: event.target.value })
              }
            />
            <Select
              label="Forma de pagamento *"
              value={receiptForm.method}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, method: event.target.value })
              }
            >
              {methodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
            <Input
              label="Data *"
              type="date"
              value={receiptForm.date}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, date: event.target.value })
              }
            />
            <ResponsibleSelect
              value={receiptForm.responsible}
              onChange={(responsible) =>
                setReceiptForm({ ...receiptForm, responsible })
              }
            />
            <FullCol>
              <Textarea
                label="Observacoes"
                value={receiptForm.notes}
                onChange={(event) =>
                  setReceiptForm({ ...receiptForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn onClick={saveReceipt}>Confirmar recebimento</Btn>
          </FormActions>
        </Modal>
      )}

      {modal === "receberEvento" && selectedEventReceivable && (
        <Modal
          wide
          title={`Receber ${selectedEventReceivable.event.code}`}
          onClose={() => setModal(null)}
        >
          <Alert type="info">{receiptForm.method === "cash" ? openCash ? "Dinheiro será movimentado no caixa aberto deste turno." : "Para usar dinheiro, abra o caixa em Financeiro → Caixa. Seus dados serão preservados enquanto você confere a operação." : "Este pagamento será registrado no financeiro. Ele não altera o dinheiro físico da gaveta."}</Alert>
          <FormGrid cols={2}>
            <Input
              label="Cliente"
              value={selectedEventReceivable.event.contractorName}
              readOnly
            />
            <Input
              label="Evento"
              value={selectedEventReceivable.event.name}
              readOnly
            />
            <Input
              label="Valor total devido"
              value={formatMoney(selectedEventReceivable.total)}
              readOnly
            />
            <Input
              label="Valor ja recebido"
              value={formatMoney(selectedEventReceivable.received)}
              readOnly
            />
            <Input
              label="Saldo pendente"
              value={formatMoney(selectedEventReceivable.balance)}
              readOnly
            />
            <Input
              label="Valor a receber *"
              type="number"
              min="0.01"
              step="0.01"
              max={selectedEventReceivable.balance}
              value={receiptForm.value}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, value: event.target.value })
              }
            />
            <Select
              label="Forma de pagamento *"
              value={receiptForm.method}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, method: event.target.value })
              }
            >
              {methodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
            <Input
              label="Data *"
              type="date"
              value={receiptForm.date}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, date: event.target.value })
              }
            />
            <ResponsibleSelect
              value={receiptForm.responsible}
              onChange={(responsible) =>
                setReceiptForm({ ...receiptForm, responsible })
              }
            />
            <FullCol>
              <Textarea
                label="Observacoes"
                value={receiptForm.notes}
                onChange={(event) =>
                  setReceiptForm({ ...receiptForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn onClick={saveEventReceipt}>Confirmar recebimento</Btn>
          </FormActions>
        </Modal>
      )}

      {(modal === "newPagar" || modal === "editPagar") && (
        <Modal
          wide
          title={
            modal === "newPagar" ? "Nova Conta a Pagar" : "Editar Conta a Pagar"
          }
          onClose={() => setModal(null)}
        >
          <PayableForm
            form={payableForm}
            setForm={setPayableForm}
            costCenters={costCenters}
          />
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn onClick={savePayable}>Salvar</Btn>
          </FormActions>
        </Modal>
      )}

      {modal === "payPagar" && selectedPayable && (
        <Modal
          title={`Pagar ${selectedPayable.code}`}
          onClose={() => setModal(null)}
        >
          <Alert type="info">{paymentForm.method === "cash" ? openCash ? "Dinheiro será movimentado no caixa aberto deste turno." : "Para usar dinheiro, abra o caixa em Financeiro → Caixa. Seus dados serão preservados enquanto você confere a operação." : "Este pagamento será registrado no financeiro. Ele não altera o dinheiro físico da gaveta."}</Alert>
          <FormGrid cols={2}>
            <Input
              label="Fornecedor"
              value={selectedPayable.supplier}
              readOnly
            />
            <Input
              label="Saldo pendente"
              value={formatMoney(
                pendingBalance(
                  selectedPayable.originalValue,
                  paidValue(selectedPayable),
                ),
              )}
              readOnly
            />
            <Input
              label="Valor *"
              type="number"
              min="0.01"
              step="0.01"
              value={paymentForm.value}
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, value: event.target.value })
              }
            />
            <Select
              label="Forma *"
              value={paymentForm.method}
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, method: event.target.value })
              }
            >
              {methodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
            <Input
              label="Data"
              type="date"
              value={paymentForm.date}
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, date: event.target.value })
              }
            />
            <ResponsibleSelect
              value={paymentForm.responsible}
              onChange={(responsible) =>
                setPaymentForm({ ...paymentForm, responsible })
              }
            />
            <FullCol>
              <Textarea
                label="Observacoes"
                value={paymentForm.notes}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn onClick={savePayablePayment}>Registrar pagamento</Btn>
          </FormActions>
        </Modal>
      )}

      {modal === "abrirCaixa" && (
        <Modal title="Abrir Caixa" onClose={() => setModal(null)}>
          <FormGrid cols={1}>
            <ResponsibleSelect
              value={cashOpenForm.responsible}
              onChange={(responsible) =>
                setCashOpenForm({ ...cashOpenForm, responsible })
              }
            />
            <Select
              label="Turno"
              value={cashOpenForm.shift}
              onChange={(event) =>
                setCashOpenForm({
                  ...cashOpenForm,
                  shift: event.target.value as typeof cashOpenForm.shift,
                })
              }
            >
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
            </Select>
            <Input
              label="Valor inicial em dinheiro"
              type="number"
              min="0"
              value={cashOpenForm.openingCash}
              onChange={(event) =>
                setCashOpenForm({
                  ...cashOpenForm,
                  openingCash: event.target.value,
                })
              }
            />
            <Textarea
              label="Observacoes"
              value={cashOpenForm.notes}
              onChange={(event) =>
                setCashOpenForm({ ...cashOpenForm, notes: event.target.value })
              }
            />
          </FormGrid>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn
              onClick={() => {
                const result = openCashSession({
                  responsible: cashOpenForm.responsible,
                  openingCash: Number(cashOpenForm.openingCash),
                  shift: cashOpenForm.shift,
                  notes: cashOpenForm.notes,
                })
                if (!result.ok)
                  setMessage(result.error ?? "Falha ao abrir caixa.")
                else setModal(null)
              }}
            >
              Abrir
            </Btn>
          </FormActions>
        </Modal>
      )}

      {modal === "fecharCaixa" && openCash && (
        <Modal title="Fechar Caixa" onClose={() => setModal(null)}>
          <Alert type="info">
            Turno {openCash.shift ?? "Não informado"} · valor físico esperado:{" "}
            {formatMoney(cashExpectedTotal(openCash.id))}. Pix e cartão não
            aumentam o dinheiro em gaveta.
          </Alert>
          <p className="my-3 text-sm text-gray-500">Fechamento registrado por {activeAccount?.name}. Se houver diferença, explique o motivo. O histórico será preservado.</p>
          <FormGrid cols={1}>
            <Input
              label="Dinheiro contado na gaveta (R$) *"
              placeholder="Informe o valor que você contou"
              step="0.01"
              type="number"
              min="0"
              value={cashCloseForm.countedCash}
              onChange={(event) =>
                setCashCloseForm({
                  ...cashCloseForm,
                  countedCash: event.target.value,
                })
              }
            />
            <Input
              label="Diferença entre contado e esperado"
              value={cashCloseForm.countedCash === "" ? "Informe o valor contado" : formatMoney(
                Number(cashCloseForm.countedCash) - cashExpectedTotal(openCash.id),
              )}
              readOnly
            />
            <Textarea
              label="Justificativa da diferença / observações"
              value={cashCloseForm.notes}
              onChange={(event) =>
                setCashCloseForm({
                  ...cashCloseForm,
                  notes: event.target.value,
                })
              }
            />
          </FormGrid>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn
              variant="danger" confirmAction={false}
              onClick={() => {
                const result = closeCashSession({
                  sessionId: openCash.id,
                  countedCash: cashCloseForm.countedCash === "" ? NaN : Number(cashCloseForm.countedCash),
                  notes: cashCloseForm.notes,
                })
                if (!result.ok)
                  setMessage(result.error ?? "Falha ao fechar caixa.")
                else setModal(null)
              }}
            >
              Fechar
            </Btn>
          </FormActions>
        </Modal>
      )}

      {modal === "movCaixa" && (
        <Modal title="Movimento Manual de Caixa" onClose={() => setModal(null)}>
          <FormGrid cols={2}>
            <Select
              label="Tipo"
              value={cashMoveForm.direction}
              onChange={(event) =>
                setCashMoveForm({
                  ...cashMoveForm,
                  direction: event.target.value,
                })
              }
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
            </Select>
            <Select
              label="Metodo"
              value={cashMoveForm.method}
              onChange={(event) =>
                setCashMoveForm({ ...cashMoveForm, method: event.target.value })
              }
            >
              {methodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
            <Input
              label="Valor"
              type="number"
              min="0.01"
              value={cashMoveForm.value}
              onChange={(event) =>
                setCashMoveForm({ ...cashMoveForm, value: event.target.value })
              }
            />
            <ResponsibleSelect
              value={cashMoveForm.responsible}
              onChange={(responsible) =>
                setCashMoveForm({ ...cashMoveForm, responsible })
              }
            />
            <FullCol>
              <Input
                label="Descricao"
                value={cashMoveForm.description}
                onChange={(event) =>
                  setCashMoveForm({
                    ...cashMoveForm,
                    description: event.target.value,
                  })
                }
              />
            </FullCol>
            <FullCol>
              <Textarea
                label="Observacoes"
                value={cashMoveForm.notes}
                onChange={(event) =>
                  setCashMoveForm({
                    ...cashMoveForm,
                    notes: event.target.value,
                  })
                }
              />
            </FullCol>
          </FormGrid>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn
              onClick={() => {
                const result = registerManualCashMovement({
                  ...cashMoveForm,
                  direction: cashMoveForm.direction as "entrada" | "saida",
                  value: Number(cashMoveForm.value),
                })
                if (!result.ok)
                  setMessage(result.error ?? "Falha no movimento.")
                else setModal(null)
              }}
            >
              Registrar
            </Btn>
          </FormActions>
        </Modal>
      )}

      {(modal === "newCentro" || modal === "editCentro") && (
        <Modal title="Centro de Custo" onClose={() => setModal(null)}>
          <FormGrid cols={2}>
            <Input
              label="Codigo"
              value={centerForm.code}
              onChange={(event) =>
                setCenterForm({ ...centerForm, code: event.target.value })
              }
            />
            <Input
              label="Nome"
              value={centerForm.name}
              onChange={(event) =>
                setCenterForm({ ...centerForm, name: event.target.value })
              }
            />
            <Select
              label="Situacao"
              value={centerForm.active ? "ativo" : "inativo"}
              onChange={(event) =>
                setCenterForm({
                  ...centerForm,
                  active: event.target.value === "ativo",
                })
              }
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
            <FullCol>
              <Textarea
                label="Descricao"
                value={centerForm.description}
                onChange={(event) =>
                  setCenterForm({
                    ...centerForm,
                    description: event.target.value,
                  })
                }
              />
            </FullCol>
          </FormGrid>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn onClick={saveCenter}>Salvar</Btn>
          </FormActions>
        </Modal>
      )}

      {modal === "concilia" && (
        <Modal
          wide
          title="Registrar Conciliação"
          onClose={() => setModal(null)}
        >
          <FormGrid cols={2}>
            <Input
              label="Data banco"
              type="date"
              value={bankForm.date}
              onChange={(event) =>
                setBankForm({ ...bankForm, date: event.target.value })
              }
            />
            <Select
              label="Tipo"
              value={bankForm.direction}
              onChange={(event) =>
                setBankForm({ ...bankForm, direction: event.target.value, movementId: "" })
              }
            >
              <option value="credito">Credito</option>
              <option value="debito">Debito</option>
            </Select>
            <Input
              label="Valor banco"
              type="number"
              min="0.01"
              value={bankForm.value}
              onChange={(event) =>
                setBankForm({ ...bankForm, value: event.target.value })
              }
            />
            <Select
              label="Movimento do sistema"
              value={bankForm.movementId}
              onChange={(event) =>
                setBankForm({ ...bankForm, movementId: event.target.value })
              }
            >
              <option value="">Nao vincular</option>
              {cashMovements.filter((movement) => !isCashPayment(movement.methodId) && (bankForm.direction === "credito") === (movement.direction === "entrada") && !bankTransactions.some((transaction) => transaction.matchedMovementId === movement.id)).map((movement) => (
                <option key={movement.id} value={movement.id}>
                  {movement.date} - {movement.description} -{" "}
                  {formatMoney(movement.value)}
                </option>
              ))}
            </Select>
            <FullCol>
              <Input
                label="Descricao banco"
                value={bankForm.description}
                onChange={(event) =>
                  setBankForm({ ...bankForm, description: event.target.value })
                }
              />
            </FullCol>
            <FullCol>
              <Textarea
                label="Observacoes"
                value={bankForm.notes}
                onChange={(event) =>
                  setBankForm({ ...bankForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn
              onClick={() => {
                const result = reconcileBankTransaction({
                  date: bankForm.date,
                  description: bankForm.description,
                  value: Number(bankForm.value),
                  direction: bankForm.direction as "credito" | "debito",
                  movementId: bankForm.movementId
                    ? Number(bankForm.movementId)
                    : undefined,
                  notes: bankForm.notes,
                })
                if (!result.ok)
                  setMessage(result.error ?? "Falha na conciliacao.")
                else setModal(null)
              }}
            >
              Salvar
            </Btn>
          </FormActions>
        </Modal>
      )}
    </div>
  )
}

function Kpi({
  title,
  value,
  help,
}: {
  title: string
  value: string
  help: string
}) {
  return (
    <div className="summary-item">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{help}</small>
    </div>
  )
}

function PayableForm({
  form,
  setForm,
  costCenters,
}: {
  form: typeof emptyPayable
  setForm: (form: typeof emptyPayable) => void
  costCenters: CostCenter[]
}) {
  return (
    <FormGrid cols={2}>
      <FullCol>
        <Input
          label="Descricao *"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
      </FullCol>
      <Input
        label="Fornecedor / beneficiario *"
        value={form.supplier}
        onChange={(event) => setForm({ ...form, supplier: event.target.value })}
      />
      <Input
        label="Categoria"
        value={form.category}
        onChange={(event) => setForm({ ...form, category: event.target.value })}
      />
      <Select
        label="Centro de custo *"
        value={form.costCenterId}
        onChange={(event) =>
          setForm({ ...form, costCenterId: event.target.value })
        }
      >
        {costCenters
          .filter((center) => center.active)
          .map((center) => (
            <option key={center.id} value={center.id}>
              {center.name}
            </option>
          ))}
      </Select>
      <Input
        label="Valor *"
        type="number"
        min="0.01"
        step="0.01"
        value={form.originalValue}
        onChange={(event) =>
          setForm({ ...form, originalValue: event.target.value })
        }
      />
      <Input
        label="Vencimento *"
        type="date"
        value={form.dueDate}
        onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
      />
      <FullCol>
        <Textarea
          label="Observacoes"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
        />
      </FullCol>
    </FormGrid>
  )
}

function paidValue(payable: PayableAccount) {
  return payable.payments.reduce((total, payment) => total + payment.value, 0)
}

function costCenterName(costCenters: CostCenter[], id: number) {
  return costCenters.find((center) => center.id === id)?.name ?? "Sem centro"
}

function receivableDescription(reservation: Reservation) {
  return reservation.status === "Hospedado" ||
    reservation.status === "Concluída"
    ? "Hospedagem e consumos faturaveis"
    : "Valor contratado da reserva"
}

function costCenterTotals(
  center: CostCenter,
  receipts: { value: number ;status: string }[],
  payables: PayableAccount[],
  movements: CashMovement[],
) {
  const receiptsTotal =
    center.name === "Hospedagem"
      ? receipts
          .filter((receipt) => receipt.status === "Confirmado")
          .reduce((total, receipt) => total + receipt.value, 0)
      : 0
  const paymentsTotal = payables
    .filter((payable) => payable.costCenterId === center.id)
    .reduce((total, payable) => total + paidValue(payable), 0)
  const manualCash = movements
    .filter(
      (movement) =>
        movement.source === "manual" &&
        movement.direction === "saida" &&
        isCashPayment(movement.methodId),
    )
    .reduce((total, movement) => total + movement.value, 0)
  return {
    receipts: receiptsTotal,
    payments:
      paymentsTotal + (center.name === "Administracao" ? manualCash : 0),
  }
}
