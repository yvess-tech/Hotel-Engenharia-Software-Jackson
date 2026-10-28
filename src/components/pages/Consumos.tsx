import { useMemo, useState } from "react"
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
        const matchesStay =
          stayFilter === "all" || consumption.stayId === Number(stayFilter)
        const matchesSearch =
          !search ||
          `${reservation?.guest ?? ""} ${room?.number ?? ""} ${consumption.service} ${consumption.description} ${consumption.status ?? "Lançado"}`
            .toLowerCase()
            .includes(search.toLowerCase())
        return matchesStay && matchesSearch
      }),
    [consumptions, reservations, rooms, search, stayFilter],
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
        <p className="text-body">
          Consulte os produtos do frigobar ou estoque e os serviços já
          registrados antes de fazer um novo lançamento.
        </p>
        <FormGrid cols={2}>
          <Select
            label="Hospedagem"
            value={stayFilter}
            onChange={(event) => setStayFilter(event.target.value)}
          >
            <option value="all">Todas as hospedagens ativas</option>
            {activeStays.map((stay) => (
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
        <Alert type="info">
          {filtered.length} lançamento(s): {productCount} produto(s) de
          frigobar/estoque, {serviceCount} serviço(s) · total extra{" "}
          {formatMoney(launchedTotal)}.
        </Alert>
        <Table
          headers={[
            "Hospedagem",
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
            return [
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
              consumption.status !== "Estornado" ? (
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
        >
          <Alert type="info">
            Use <strong>Produto</strong> para itens do frigobar ou do estoque.
            Use <strong>Serviço</strong> para restaurante, lavanderia e demais
            atendimentos.
          </Alert>
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
                    {rooms.find((room) => room.id === stay.roomId)?.number}
                  </option>
                ))}
              </Select>
            </FullCol>
            <Select
              label="Tipo"
              value={form.kind}
              onChange={(event) => setKind(event.target.value as Kind)}
            >
              <option>Serviço</option>
              <option value="Produto">Produto (frigobar / estoque)</option>
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
            />
            <ResponsibleSelect
              value={form.responsible}
              onChange={(responsible) => setForm({ ...form, responsible })}
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
