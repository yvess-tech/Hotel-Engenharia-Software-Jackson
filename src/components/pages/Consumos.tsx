import { useEffect, useMemo, useState } from "react"

import {
  FormSection,
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
  Textarea,
} from "../ui"

import {
  formatMoney,
  OPERATIONAL_SERVICES,
  useHotelOperations,
} from "../HotelOperationsContext"

const services = OPERATIONAL_SERVICES

type Kind = "Serviço" | "Produto"

export default function Consumos() {
  const {
    reservations,

    clients,

    rooms,

    stays,

    consumptions,

    products,

    recordConsumption,

    reverseConsumption,
  } = useHotelOperations()

  const [modal, setModal] = useState<"new" | "reverse" | null>(null)

  const [search, setSearch] = useState("")

  const [stayFilter, setStayFilter] = useState("all")

  const [clientFilter, setClientFilter] = useState("all")

  const [statusFilter, setStatusFilter] = useState("all")

  const [dateFrom, setDateFrom] = useState("")

  const [dateTo, setDateTo] = useState("")

  const [feedback, setFeedback] = useState("")

  const [reverse, setReverse] = useState({
    id: 0,

    reason: "",

    responsible: "Recepção",
  })

  const [form, setForm] = useState({
    reservationId: "",

    kind: "Serviço" as Kind,

    service: "Restaurante",

    productId: "",

    description: "",

    quantity: "1",

    unitPrice: "0",

    responsible: "Recepção",
  })

  const activeStays = stays.filter((stay) => stay.status === "Ativa")

  useEffect(() => {
    const stayId = Number(window.sessionStorage.getItem("hotel-consumption-stay"))
    if (!stayId) return

    window.sessionStorage.removeItem("hotel-consumption-stay")
    setStayFilter(String(stayId))
  }, [])

  const staysForFilter = useMemo(
    () =>
      [...stays].sort((first, second) => {
        if (first.status !== second.status)
          return first.status === "Ativa" ? -1 : 1

        return second.checkedInAt.localeCompare(first.checkedInAt)
      }),
    [stays],
  )

  const selectedStay = activeStays.find(
    (stay) => stay.reservationId === Number(form.reservationId),
  )

  const selectedReservation = reservations.find(
    (reservation) => reservation.id === Number(form.reservationId),
  )

  const selectedProduct = products.find(
    (product) => product.id === Number(form.productId),
  )

  const hasStructuredBenefits = Boolean(
    selectedReservation?.packageSnapshot?.structuredBenefits?.length,
  )

  const filtered = useMemo(
    () =>
      consumptions.filter((consumption) => {
        const reservation = reservations.find(
          (item) => item.id === consumption.reservationId,
        )

        const room = rooms.find((item) => item.id === reservation?.roomId)

        const stay = stays.find((item) => item.id === consumption.stayId)

        const matchesStay =
          stayFilter === "all" || consumption.stayId === Number(stayFilter)

        const matchesClient =
          clientFilter === "all" || reservation?.clientId === Number(clientFilter)

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && stay?.status === "Ativa") ||
          (statusFilter === "closed" && stay?.status === "Encerrada") ||
          (statusFilter === "reversed" && consumption.status === "Estornado")

        const consumptionDate = consumption.createdAt.slice(0, 10)
        const matchesDate =
          (!dateFrom || consumptionDate >= dateFrom) &&
          (!dateTo || consumptionDate <= dateTo)

        const matchesSearch =
          !search ||
          `${reservation?.guest ?? ""} ${room?.number ?? ""} ${consumption.service} ${consumption.description} ${consumption.status ?? "Lançado"}`

            .toLowerCase()

            .includes(search.toLowerCase())

        const matchesStayCode =
          !search ||
          stay?.code.toLowerCase().includes(search.toLowerCase())

        return (
          matchesStay &&
          matchesClient &&
          matchesStatus &&
          matchesDate &&
          (matchesSearch || matchesStayCode)
        )
      }),

    [
      consumptions,
      reservations,
      rooms,
      stays,
      search,
      stayFilter,
      clientFilter,
      statusFilter,
      dateFrom,
      dateTo,
    ],
  )

  const total = Number(form.quantity) * Number(form.unitPrice)

  const launchedTotal = filtered

    .filter((item) => item.status !== "Estornado")

    .reduce((sum, item) => sum + item.value, 0)

  const productCount = filtered.filter(
    (item) => item.category === "Produto",
  ).length

  const serviceCount = filtered.filter(
    (item) => item.category !== "Produto",
  ).length

  const reversedTotal = filtered
    .filter((item) => item.status === "Estornado")
    .reduce((sum, item) => sum + item.value, 0)

  const closedStayCount = new Set(
    filtered
      .filter(
        (item) =>
          stays.find((stay) => stay.id === item.stayId)?.status === "Encerrada",
      )
      .map((item) => item.stayId),
  ).size

  const openNew = () => {
    setFeedback("")

    setForm({
      reservationId: "",

      kind: "Serviço",

      service: "Restaurante",

      productId: "",

      description: "",

      quantity: "1",

      unitPrice: "0",

      responsible: "Recepção",
    })

    setModal("new")
  }

  const setKind = (kind: Kind) =>
    setForm({
      ...form,

      kind,

      service: kind === "Serviço" ? "Restaurante" : "",

      productId: "",

      unitPrice: "0",
    })

  const chooseProduct = (productId: string) => {
    const product = products.find((item) => item.id === Number(productId))

    setForm({
      ...form,

      productId,

      service: product?.name ?? "",

      unitPrice: String(product?.unitPrice ?? 0),
    })
  }

  const save = () => {
    if (!selectedStay || !selectedReservation)
      return setFeedback("Selecione uma hospedagem ativa.")

    const result = recordConsumption({
      stayId: selectedStay.id,

      reservationId: selectedReservation.id,

      productId: form.kind === "Produto" ? Number(form.productId) : undefined,

      service:
        form.kind === "Produto" ? (selectedProduct?.name ?? "") : form.service,

      serviceCode: form.kind === "Serviço" ? form.service : undefined,

      category: form.kind,

      description: form.description,

      quantity: Number(form.quantity),

      unitPrice: Number(form.unitPrice),

      value: total,

      responsible: form.responsible,

      includedInPackage: false,
    })

    if (!result.ok)
      return setFeedback(
        result.error ?? "Não foi possível registrar o consumo.",
      )

    setModal(null)

    setFeedback(
      "Consumo registrado; os benefícios estruturados, a fatura e, se aplicável, o estoque foram atualizados.",
    )
  }

  const saveReverse = () => {
    const result = reverseConsumption(
      reverse.id,

      reverse.reason,

      reverse.responsible,
    )

    if (!result.ok)
      return setFeedback(result.error ?? "Não foi possível estornar.")

    setModal(null)

    setFeedback(
      "Estorno registrado; a fatura e o estoque vinculado foram atualizados.",
    )
  }

  return (
    <div className="ops-page">
      <PageHeader
        title="Consumos"
        actions={<Btn onClick={openNew}>+ Registrar lançamento</Btn>}
      />
      {feedback && (
        <Alert
          type={
            feedback.includes("não") || feedback.includes("Selecione")
              ? "error"
              : "success"
          }
        >
          {feedback}
        </Alert>
      )}
      <Card>
        <SectionTitle>Lançamentos da hospedagem</SectionTitle>
        <FormGrid cols={2} className="consumption-history-filters">
          <Select
            label="Hospedagem"
            value={stayFilter}
            onChange={(event) => setStayFilter(event.target.value)}
          >
            <option value="all">Todas as hospedagens</option>
            {staysForFilter.map((stay) => (
              <option key={stay.id} value={stay.id}>
                {stay.code} — {stay.guest} · quarto{" "}
                {rooms.find((room) => room.id === stay.roomId)?.number}
              </option>
            ))}
          </Select>
          <Input
            label="Buscar por hóspede, quarto, item ou situação"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </FormGrid>
        <FormGrid cols={2} className="consumption-history-filters">
          <Select
            label="Cliente"
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
          >
            <option value="all">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Select
            label="Exibir"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Todos os lançamentos</option>
            <option value="active">Hospedagens ativas</option>
            <option value="closed">Hospedagens encerradas</option>
            <option value="reversed">Consumos estornados</option>
          </Select>
          <Input
            label="Lançado a partir de"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <Input
            label="Lançado até"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </FormGrid>
        {(closedStayCount > 0 || reversedTotal > 0) && (
          <Alert type="info">
            Histórico: {closedStayCount} hospedagem(ns) encerrada(s)
            {reversedTotal > 0
              ? ` · ${formatMoney(reversedTotal)} em consumos estornados.`
              : "."}
          </Alert>
        )}
        <Alert type="info">
          {filtered.length} lançamento(s): {productCount} produto(s) de
          frigobar/estoque, {serviceCount} serviço(s) · total extra{" "}
          {formatMoney(launchedTotal)}.
        </Alert>
        <Table
          headers={[
            "Hospedagem",

            "Data",

            "Situação da hospedagem",

            "Reserva",

            "Hóspede",

            "Quarto",

            "Item",

            "Categoria",

            "Qtd.",

            "Unitário",

            "Total",

            "Situação",

            "Ação",
          ]}
          rows={filtered.map((consumption) => {
            const reservation = reservations.find(
              (item) => item.id === consumption.reservationId,
            )

            const room = rooms.find((item) => item.id === reservation?.roomId)

            const stay = stays.find((item) => item.id === consumption.stayId)

            return [
              stay?.code ?? reservation?.code.replace("RES", "HOS") ?? "—",

              new Date(consumption.createdAt).toLocaleString("pt-BR"),

              <Badge label={stay?.status ?? "Sem hospedagem"} />,
              reservation?.code.replace("RES", "HOS") ?? "—",

              reservation?.guest ?? "—",

              room?.number ?? "—",

              consumption.service,

              consumption.category === "Produto"
                ? "Produto / frigobar"
                : "Serviço",

              String(consumption.quantity ?? 1),

              formatMoney(consumption.unitPrice ?? consumption.value),

              formatMoney(consumption.value),

              <Badge label={consumption.status ?? "Lançado"} />,

              consumption.status !== "Estornado" && stay?.status === "Ativa" ? (
                <Btn
                  small
                  variant="danger"
                  onClick={() => {
                    setReverse({
                      id: consumption.id,

                      reason: "",

                      responsible: "Recepção",
                    })

                    setModal("reverse")
                  }}
                >
                  Estornar
                </Btn>
              ) : (
                "—"
              ),
            ]
          })}
        />
      </Card>
      {modal === "new" && (
        <Modal
          title="Registrar consumo da hospedagem"
          onClose={() => setModal(null)}
          footer={
            <>
              <FormActions>
                <Btn variant="ghost" onClick={() => setModal(null)}>
                  Cancelar
                </Btn>
                <Btn
                  disabled={
                    !selectedStay ||
                    (form.kind === "Produto" && !selectedProduct) ||
                    Number(form.quantity) <= 0 ||
                    Number(form.unitPrice) < 0
                  }
                  onClick={save}
                >
                  Lançar {formatMoney(total)}
                </Btn>
              </FormActions>
            </>
          }
          intent="create"
          size="lg"
          description="Vincule o consumo à hospedagem ativa e confira quantidade, valor e benefícios aplicados."
        >
          <Alert type="info">
            Use <strong>Produto</strong> para itens do frigobar ou do estoque.
            Use <strong>Serviço</strong> para restaurante, lavanderia e demais
            atendimentos.
          </Alert>
          <FormGrid cols={2}>
            <FullCol>
              <FormSection title="Hospedagem">
                <FormGrid cols={2}>
                  <FullCol>
                    <Select
                      label="Hospedagem ativa *"
                      value={form.reservationId}
                      onChange={(event) =>
                        setForm({ ...form, reservationId: event.target.value })
                      }
                    >
                      <option value="">Selecione</option>
                      {activeStays.map((stay) => (
                        <option key={stay.id} value={stay.reservationId}>
                          {stay.code} — {stay.guest} · quarto{" "}
                          {
                            rooms.find((room) => room.id === stay.roomId)
                              ?.number
                          }
                        </option>
                      ))}
                    </Select>
                  </FullCol>
                </FormGrid>
              </FormSection>
            </FullCol>
            <FullCol>
              <FormSection title="Produto ou serviço">
                <FormGrid cols={2}>
                  <Select
                    label="Tipo"
                    value={form.kind}
                    onChange={(event) => setKind(event.target.value as Kind)}
                  >
                    <option>Serviço</option>
                    <option value="Produto">
                      Produto (frigobar / estoque)
                    </option>
                  </Select>
                  {form.kind === "Produto" ? (
                    <Select
                      label="Produto ativo *"
                      value={form.productId}
                      onChange={(event) => chooseProduct(event.target.value)}
                    >
                      <option value="">Selecione</option>
                      {products

                        .filter((product) => product.status === "Ativo")

                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} · disponível {product.quantity}{" "}
                            {product.unit}
                          </option>
                        ))}
                    </Select>
                  ) : (
                    <Select
                      label="Serviço *"
                      value={form.service}
                      onChange={(event) =>
                        setForm({ ...form, service: event.target.value })
                      }
                    >
                      {services.map((service) => (
                        <option key={service}>{service}</option>
                      ))}
                    </Select>
                  )}
                  <Input
                    label="Quantidade *"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm({ ...form, quantity: event.target.value })
                    }
                  />
                  <Input
                    label="Valor unitário"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(event) =>
                      setForm({ ...form, unitPrice: event.target.value })
                    }
                    currency
                  />
                </FormGrid>
              </FormSection>
            </FullCol>
            <FullCol>
              <FormSection title="Responsabilidade e descrição">
                <FormGrid cols={2}>
                  <ResponsibleSelect
                    value={form.responsible}
                    onChange={(responsible) =>
                      setForm({ ...form, responsible })
                    }
                  />
                  <FullCol>
                    <Textarea
                      label="Descrição"
                      value={form.description}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                    />
                  </FullCol>
                </FormGrid>
              </FormSection>
            </FullCol>
          </FormGrid>
          {selectedProduct && (
            <Alert type="info">
              Disponível: {selectedProduct.quantity} {selectedProduct.unit}.
              Total calculado: {formatMoney(total)}.
            </Alert>
          )}
          {hasStructuredBenefits && (
            <Alert type="info">
              O sistema aplicará automaticamente as cotas contratadas e cobrará
              apenas excedentes.
            </Alert>
          )}
        </Modal>
      )}
      {modal === "reverse" && (
        <Modal title="Estornar consumo" onClose={() => setModal(null)}>
          <Textarea
            label="Motivo *"
            value={reverse.reason}
            onChange={(event) =>
              setReverse({ ...reverse, reason: event.target.value })
            }
          />
          <ResponsibleSelect
            value={reverse.responsible}
            onChange={(responsible) => setReverse({ ...reverse, responsible })}
          />
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn
              variant="danger"
              disabled={!reverse.reason.trim()}
              onClick={saveReverse}
            >
              Confirmar estorno
            </Btn>
          </FormActions>
        </Modal>
      )}
    </div>
  )
}
