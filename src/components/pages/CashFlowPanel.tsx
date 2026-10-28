import {
  Surface as Card,
  ManagementTable as Table,
  MetricCard,
} from "../management-ui"

import { useState } from "react"

import {
  calculateCashFlow,
  pendingBalance,
  type FlowObligation,
} from "../../domain/financial-rules"

import {
  formatMoney,
  today,
  useHotelOperations,
} from "../HotelOperationsContext"

import { Alert, FormGrid, Input, formatDisplayDate } from "../ui"

export default function CashFlowPanel() {
  const {
    cashMovements,

    reservations,

    events,

    payables,

    getReservationFinancials,

    getEventFinancials,
  } = useHotelOperations()

  const [from, setFrom] = useState(today())

  const [to, setTo] = useState(() => {
    const date = new Date()

    date.setDate(date.getDate() + 30)

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  })

  const obligations: FlowObligation[] = [
    ...reservations

      .filter((item) => item.status !== "Cancelada")

      .map((item) => ({
        date: item.exit,

        direction: "entrada" as const,

        value: getReservationFinancials(item.id)?.balance ?? 0,
      })),

    ...events

      .filter(
        (item) =>
          item.status !== "Cancelado" && item.billingType === "Separada",
      )

      .flatMap((item) => {
        const financials = getEventFinancials(item.id)

        const balance = financials?.balance ?? 0

        const depositRemaining = item.depositRequired
          ? Math.min(
              balance,

              pendingBalance(
                (item.totalContracted * (item.depositPercent ?? 0)) / 100,

                financials?.received ?? 0,
              ),
            )
          : 0

        return [
          {
            date: item.depositDueDate || item.start.slice(0, 10),

            direction: "entrada" as const,

            value: depositRemaining,
          },

          {
            date: item.balanceDueDate || item.end.slice(0, 10),

            direction: "entrada" as const,

            value: balance - depositRemaining,
          },
        ]
      }),

    ...payables

      .filter((item) => !item.canceledAt)

      .map((item) => ({
        date: item.dueDate,

        direction: "saida" as const,

        value: pendingBalance(
          item.originalValue,

          item.payments.reduce((sum, payment) => sum + payment.value, 0),
        ),
      })),
  ]

  const flow = calculateCashFlow(cashMovements, obligations, from, to, today())

  const valid = Boolean(from && to && from <= to)

  const totals = flow.rows.reduce(
    (sum, row) => ({
      entries: sum.entries + row.entries,

      outflows: sum.outflows + row.outflows,

      expectedEntries: sum.expectedEntries + row.expectedEntries,

      expectedOutflows: sum.expectedOutflows + row.expectedOutflows,
    }),

    { entries: 0, outflows: 0, expectedEntries: 0, expectedOutflows: 0 },
  )

  return (
    <Card
      title="Fluxo de caixa por período"
      description="Compare os movimentos realizados com os recebimentos e pagamentos previstos."
    >
      <FormGrid cols={2}>
        <Input
          label="Data inicial"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <Input
          label="Data final"
          type="date"
          min={from}
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </FormGrid>
      {!valid ? (
        <Alert type="error">
          Informe um período válido. A data final deve ser igual ou posterior à
          inicial.
        </Alert>
      ) : (
        <>
          <div className="management-metrics">
            <MetricCard
              label="Saldo inicial registrado"
              value={formatMoney(flow.opening)}
              description="Movimentos anteriores à data inicial."
              icon="history"
            />
            <MetricCard
              label="Saldo realizado"
              value={formatMoney(flow.actual)}
              description="Entradas e saídas já registradas."
              icon="badge-check"
              tone={flow.actual < 0 ? "negative" : "default"}
            />
            <MetricCard
              label="Saldo projetado"
              value={formatMoney(flow.projected)}
              description="Realizado + valores ainda pendentes."
              icon="calendar-range"
              tone={flow.projected < 0 ? "negative" : "default"}
            />
          </div>
          <Alert type="info">
            O saldo inicial acumula os movimentos anteriores ao período; não
            representa o saldo bancário total nem o fundo de abertura do caixa.
            A projeção soma apenas os saldos ainda pendentes. Vencidos aparecem
            na data de hoje; não há garantia de recebimento.
          </Alert>
          {flow.projected < 0 && (
            <Alert type="warning">
              As saídas previstas superam os recursos registrados neste período.
              Confira os vencimentos e programe os pagamentos.
            </Alert>
          )}
          <Table
            caption="Fluxo de caixa no período selecionado"
            headers={[
              "Data",

              "Entradas realizadas",

              "Saídas realizadas",

              "A receber",

              "A pagar",

              "Saldo realizado",

              "Saldo projetado",
            ]}
            rows={[
              ...flow.rows.map((row) => [
                formatDisplayDate(row.date),

                formatMoney(row.entries),

                formatMoney(row.outflows),

                formatMoney(row.expectedEntries),

                formatMoney(row.expectedOutflows),

                formatMoney(row.actual),

                formatMoney(row.projected),
              ]),

              [
                "Total do período",

                formatMoney(totals.entries),

                formatMoney(totals.outflows),

                formatMoney(totals.expectedEntries),

                formatMoney(totals.expectedOutflows),

                formatMoney(flow.actual),

                formatMoney(flow.projected),
              ],
            ]}
          />
        </>
      )}
    </Card>
  )
}
