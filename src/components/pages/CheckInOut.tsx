import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Badge,
  Btn,
  Card,
  ConfirmDialog,
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
  countNights,
  formatMoney,
  packageEligibility,
  reservationBaseValue,
  today,
  useHotelOperations,
  type Reservation,
} from "../HotelOperationsContext"
import { useDemoEngine } from "../demo/DemoEngineContext"
import { stayNavigationEvent } from "../../domain/stay-rules"

type Tab = "checkin" | "checkout" | "fatura" | "historico"
type ModalType = "checkin" | "checkout" | "fatura" | "payment" | null

export default function CheckInOut() {
  const {
    clients,
    rooms,
    reservations,
    receipts,
    consumptions,
    stays,
    packages,
    createClient,
    registerReceipt,
    activeReceiptsTotal,
    checkIn,
    walkInCheckIn,
    checkOut,
  } = useHotelOperations()
  const [tab, setTab] = useState<Tab>("checkin")
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [step, setStep] = useState(1)
  const [documents, setDocuments] = useState({ main: false })
  const [roomId, setRoomId] = useState("")
  const [authorizeEarly, setAuthorizeEarly] = useState(false)
  const [keyData, setKeyData] = useState({
    identifier: "",
    deliveredAt: "",
    notes: "",
  })
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")
  const [checkoutChecks, setCheckoutChecks] = useState({
    key: false,
    invoice: false,
    pending: false,
  })
  const [confirmCheckout, setConfirmCheckout] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [issueSuccess, setIssueSuccess] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    value: "",
    method: "pix",
    date: today(),
    responsible: "Recepcao",
    notes: "Regularizacao no check-out.",
  })
  const [walkIn, setWalkIn] = useState(false)
  const [walkInClientOpen, setWalkInClientOpen] = useState(false)
  const [walkInClient, setWalkInClient] = useState({
    name: "",
    cpf: "",
    phone: "",
    email: "",
  })
  const [walkInForm, setWalkInForm] = useState({
    clientId: "",
    entry: today(),
    exit: today(),
    roomId: "",
    guests: "1",
    contractType:
      "Tarifa convencional" as "Tarifa convencional" | "Pacote comercial",
    packageId: "",
    notes: "Atendimento direto no balcão.",
  })
  const demo = useDemoEngine()

  const selected = reservations.find((item) => item.id === selectedId) ?? null
  const selectedClient = selected
    ? clients.find((client) => client.id === selected.clientId)
    : null
  const roomFor = (reservation: Reservation) =>
    rooms.find((room) => room.id === reservation.roomId)
  const keyIdentifierFor = (targetRoomId: number) => {
    const room = rooms.find((item) => item.id === targetRoomId)
    return room ? `CH-${room.number}-01` : ""
  }
  const candidateRooms = selected
    ? rooms.filter(
        (room) =>
          room.category === selected.category &&
          room.capacity >= selected.guests &&
          room.occupancyStatus === "Livre" &&
          room.cleaningStatus === "Limpo" &&
          room.maintenanceStatus === "Disponível" &&
          !reservations.some(
            (item) =>
              item.id !== selected.id &&
              item.roomId === room.id &&
              ["Confirmada", "Hospedado"].includes(item.status) &&
              selected.entry < item.exit &&
              selected.exit > item.entry,
          ),
      )
    : []

  const invoiceFor = (reservation: Reservation) => {
    const reservationConsumptions = consumptions.filter(
      (item) => item.reservationId === reservation.id,
    )
    const chargeableConsumptions = reservationConsumptions.filter(
      (item) => !item.includedInPackage && item.status !== "Estornado",
    )
    const consumptionTotal = chargeableConsumptions.reduce(
      (total, item) => total + item.value,
      0,
    )
    const baseTotal = reservationBaseValue(reservation)
    const received = activeReceiptsTotal(reservation.id)
    const total = baseTotal + consumptionTotal
    return {
      nights: countNights(reservation.entry, reservation.exit),
      baseTotal,
      reservationConsumptions,
      chargeableConsumptions,
      consumptionTotal,
      received,
      total,
      balance: Math.max(0, total - received),
    }
  }
  const selectedInvoice = useMemo(
    () => (selected ? invoiceFor(selected) : null),
    [selected, receipts, consumptions],
  )
  const normalizedSearch = search.trim().toLowerCase()
  const checkinReservations = reservations
    .filter(
      (item) =>
        item.status === "Confirmada" &&
        (!normalizedSearch ||
          item.code.toLowerCase().includes(normalizedSearch) ||
          item.guest.toLowerCase().includes(normalizedSearch) ||
          roomFor(item)?.number.includes(normalizedSearch)),
    )
    .sort((a, b) => a.entry.localeCompare(b.entry))
  const activeStays = stays
    .filter((item) => item.status === "Ativa")
    .map((stay) => reservations.find((item) => item.id === stay.reservationId))
    .filter((item): item is Reservation => Boolean(item))
  const history = reservations.filter((item) => item.status === "Concluída")
  const canFinishCheckout = Boolean(
    selectedInvoice &&
      selectedInvoice.balance === 0 &&
      checkoutChecks.key &&
      checkoutChecks.invoice &&
      checkoutChecks.pending,
  )
  const isFuture = selected ? selected.entry > today() : false
  const selectedWalkInPackage = packages.find(
    (item) => item.id === Number(walkInForm.packageId),
  )
  const compatibleWalkInRooms = rooms.filter(
    (room) =>
      room.occupancyStatus === "Livre" &&
      room.cleaningStatus === "Limpo" &&
      room.maintenanceStatus === "Disponível" &&
      room.capacity >= Number(walkInForm.guests) &&
      (!selectedWalkInPackage ||
        packageEligibility(
          selectedWalkInPackage,
          walkInForm.entry,
          walkInForm.exit,
          room.category,
          Number(walkInForm.guests),
        ).eligible),
  )
  const walkInPackageRestrictions = selectedWalkInPackage
    ? packageEligibility(
        selectedWalkInPackage,
        walkInForm.entry,
        walkInForm.exit,
        "",
        Number(walkInForm.guests),
      ).reasons
    : []

  const openCheckin = (reservation: Reservation) => {
    setSelectedId(reservation.id)
    setStep(1)
    setDocuments({ main: false })
    setRoomId(String(reservation.roomId))
    setAuthorizeEarly(false)
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setKeyData({
      identifier: keyIdentifierFor(reservation.roomId),
      deliveredAt: now.toISOString().slice(0, 16),
      notes: "",
    })
    setError("")
    setFeedback("")
    setModal("checkin")
  }

  const confirmCheckin = () => {
    if (!selected) return
    const result = checkIn(selected.id, {
      roomId: Number(roomId),
      companions: selected.companions,
      authorizeEarlyArrival: authorizeEarly,
    })
    if (!result.ok) {
      setError(result.error ?? "Não foi possível confirmar o check-in.")
      return
    }
    setModal(null)
    setFeedback(
      `Check-in da reserva ${selected.code} confirmado. O quarto está ocupado e a hospedagem foi liberada para consumos e check-out.`,
    )
    if (result.stayId) {
      const navigation = stayNavigationEvent(result.stayId)
      window.dispatchEvent(
        new CustomEvent(navigation.name, { detail: navigation.stayId }),
      )
    }
  }

  const openCheckout = (reservation: Reservation) => {
    setSelectedId(reservation.id)
    setCheckoutChecks({ key: false, invoice: false, pending: false })
    setError("")
    setModal("checkout")
  }

  useEffect(() => {
    const reservationId = Number(
      window.sessionStorage.getItem("hotel-open-checkout"),
    )
    if (!reservationId) return
    window.sessionStorage.removeItem("hotel-open-checkout")
    const reservation = reservations.find((item) => item.id === reservationId)
    if (reservation) {
      setTab("checkout")
      openCheckout(reservation)
    }
  }, [])

  useEffect(() => {
    const command = demo.activeCommand
    if (!command || command.target !== "checkinout") return
    const reservation = reservations.find(
      (item) => item.id === demo.scenario?.ids.reservationId,
    )
    if (!reservation) {
      demo.resolveCommand(command.id, {
        status: "error",
        message: "Reserva do cenário não encontrada.",
      })
      return
    }
    if (command.command === "open-checkin") {
      setTab("checkin")
      openCheckin(reservation)
      demo.resolveCommand(command.id, {
        status: "running",
        message: "Fluxo de check-in aberto. Faça as conferências e confirme.",
      })
    } else if (command.command === "open-invoice") {
      setTab("fatura")
      setSelectedId(reservation.id)
      setModal("fatura")
      demo.resolveCommand(command.id, {
        status: "running",
        message: "Fatura aberta para conferência dos valores.",
      })
    } else if (command.command === "open-checkout") {
      setTab("checkout")
      openCheckout(reservation)
      demo.resolveCommand(command.id, {
        status: "running",
        message: "Check-out aberto. Conclua o checklist e confirme a operação.",
      })
    }
  }, [demo.activeCommand])

  const registerBalancePayment = () => {
    if (!selected || !selectedInvoice || selectedInvoice.balance <= 0) return
    const result = registerReceipt({
      reservationId: selected.id,
      value: Number(paymentForm.value),
      method: paymentForm.method,
      date: paymentForm.date,
      notes: paymentForm.notes,
      responsible: paymentForm.responsible,
    })
    if (!result.ok)
      setError(result.error ?? "Não foi possível registrar o recebimento.")
    else setModal("checkout")
  }

  const issueInvoice = () => {
    setIssuing(true)
    setIssueSuccess(false)
    window.setTimeout(() => {
      setIssuing(false)
      setIssueSuccess(true)
    }, 600)
  }

  return (
    <div className="ops-page">
      <PageHeader
        title="Check-in / Check-out"
        actions={
          <Btn
            onClick={() => {
              const tomorrow = new Date(`${today()}T12:00`)
              tomorrow.setDate(tomorrow.getDate() + 1)
              setWalkInForm({
                clientId: String(
                  clients.find((item) => item.status === "Ativo")?.id ?? "",
                ),
                entry: today(),
                exit: tomorrow.toISOString().slice(0, 10),
                roomId: "",
                guests: "1",
                contractType: "Tarifa convencional",
                packageId: "",
                notes: "Atendimento direto no balcão.",
              })
              setWalkIn(true)
            }}
          >
            + Check-in sem reserva
          </Btn>
        }
      />
      <Tabs
        tabs={[
          { id: "checkin", label: "Check-in" },
          { id: "checkout", label: "Check-out" },
          { id: "fatura", label: "Faturas" },
          { id: "historico", label: "Histórico" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {feedback && <Alert type="success">{feedback}</Alert>}

      {tab === "checkin" && (
        <Card>
          <SectionTitle>Reservas aguardando check-in</SectionTitle>
          <div className="ops-filters">
            <div className="ops-filter-search">
              <Input
                label="Pesquisar"
                placeholder="Cliente, reserva ou quarto"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <Table
            headers={[
              "Reserva",
              "Responsável",
              "Quarto / categoria",
              "Entrada",
              "Saída",
              "Hóspedes",
              "Reserva",
              "Quarto",
              "Ação",
            ]}
            rows={checkinReservations.map((reservation) => {
              const room = roomFor(reservation)
              const dateSituation =
                reservation.entry < today()
                  ? "Atrasada"
                  : reservation.entry === today()
                    ? "Prevista hoje"
                    : "Futura"
              return [
                reservation.code,
                reservation.guest,
                `${room?.number ?? "—"} · ${reservation.category}`,
                reservation.entry,
                reservation.exit,
                String(reservation.guests),
                <Badge label={`${reservation.status} · ${dateSituation}`} />,
                <Badge label={room?.status ?? "Indisponível"} />,
                <Btn small onClick={() => openCheckin(reservation)}>
                  Iniciar Check-in
                </Btn>,
              ]
            })}
          />
          {checkinReservations.length === 0 && (
            <Alert type="info">Nenhuma reserva confirmada encontrada.</Alert>
          )}
        </Card>
      )}

      {tab === "checkout" && (
        <Card>
          <SectionTitle>Hospedagens ativas</SectionTitle>
          <Table
            headers={[
              "Hospedagem",
              "Hóspede",
              "Quarto",
              "Contratação",
              "Entrada real",
              "Saída",
              "Saldo",
              "Ações",
            ]}
            rows={activeStays.map((reservation) => {
              const invoice = invoiceFor(reservation)
              const stay = stays.find(
                (item) =>
                  item.reservationId === reservation.id &&
                  item.status === "Ativa",
              )
              return [
                stay?.code ?? reservation.code.replace("RES", "HOS"),
                reservation.guest,
                roomFor(reservation)?.number ?? "—",
                reservation.packageSnapshot?.name ?? "Tarifa convencional",
                stay ? new Date(stay.checkedInAt).toLocaleString("pt-BR") : "—",
                stay?.expectedExit ?? reservation.exit,
                formatMoney(invoice.balance),
                <div className="table-actions">
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => {
                      setSelectedId(reservation.id)
                      setModal("fatura")
                    }}
                  >
                    Visualizar Fatura
                  </Btn>
                  <Btn small onClick={() => openCheckout(reservation)}>
                    Realizar Check-out
                  </Btn>
                </div>,
              ]
            })}
          />
        </Card>
      )}

      {tab === "fatura" && (
        <Card>
          <SectionTitle>Faturas de hospedagem</SectionTitle>
          <Table
            headers={[
              "Hospedagem",
              "Hóspede",
              "Quarto",
              "Contratação",
              "Total",
              "Recebimentos",
              "Saldo",
              "Ações",
            ]}
            rows={reservations
              .filter((item) =>
                ["Hospedado", "Concluída"].includes(item.status),
              )
              .map((reservation) => {
                const invoice = invoiceFor(reservation)
                return [
                  reservation.code.replace("RES", "HOS"),
                  reservation.guest,
                  roomFor(reservation)?.number ?? "—",
                  reservation.packageSnapshot?.name ?? "Tarifa convencional",
                  formatMoney(invoice.total),
                  formatMoney(invoice.received),
                  formatMoney(invoice.balance),
                  <div className="table-actions">
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => {
                        setSelectedId(reservation.id)
                        setIssueSuccess(false)
                        setModal("fatura")
                      }}
                    >
                      Visualizar Fatura
                    </Btn>
                    <Btn
                      small
                      variant="secondary"
                      onClick={() => {
                        setSelectedId(reservation.id)
                        setModal("fatura")
                        window.setTimeout(issueInvoice, 0)
                      }}
                    >
                      Emitir Fatura
                    </Btn>
                  </div>,
                ]
              })}
          />
        </Card>
      )}

      {tab === "historico" && (
        <Card>
          <SectionTitle>Histórico de hospedagens</SectionTitle>
          <Table
            headers={[
              "Hospedagem",
              "Hóspede",
              "Quarto",
              "Entrada real",
              "Saída prevista",
              "Status",
              "Auditoria",
            ]}
            rows={history.map((reservation) => [
              reservation.code.replace("RES", "HOS"),
              reservation.guest,
              roomFor(reservation)?.number ?? "—",
              reservation.checkedInAt
                ? new Date(reservation.checkedInAt).toLocaleString("pt-BR")
                : reservation.entry,
              reservation.exit,
              <Badge label={reservation.status} />,
              reservation.audit ?? "Registro concluído",
            ])}
          />
        </Card>
      )}

      {modal === "checkin" && selected && (
        <Modal
          wide
          title={`Iniciar hospedagem — ${selected.code}`}
          onClose={() => setModal(null)}
        >
          <div
            style={{
              border: "1px solid var(--brand-200)",
              background: "var(--brand-50)",
              borderRadius: "14px",
              padding: "18px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--brand-700)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Recepção · início da estadia
                </p>
                <h3 style={{ margin: "4px 0", color: "var(--brand-900)" }}>
                  {selected.guest}
                </h3>
                <p style={{ margin: 0, color: "var(--text-muted)" }}>
                  {selected.code} · {formatDisplayDate(selected.entry)} a{" "}
                  {formatDisplayDate(selected.exit)} · {selected.guests}{" "}
                  hóspede(s)
                </p>
              </div>
              <Badge
                label={selected.packageSnapshot?.name ?? "Tarifa convencional"}
              />
            </div>
            <div className="wizard-steps" style={{ marginTop: "16px" }}>
              {[
                "Conferir reserva",
                "Identificar hóspedes",
                "Preparar quarto",
                "Confirmar início",
              ].map((label, index) => (
                <span
                  key={label}
                  className={
                    step === index + 1
                      ? "active"
                      : step > index + 1
                        ? "done"
                        : ""
                  }
                >
                  {index + 1}. {label}
                </span>
              ))}
            </div>
          </div>
          {step === 1 && (
            <>
              <SectionTitle>Conferir dados da reserva</SectionTitle>
              <div className="summary-grid">
                <Detail label="Código" value={selected.code} />
                <Detail label="Responsável" value={selected.guest} />
                <Detail
                  label="Período"
                  value={`${formatDisplayDate(selected.entry)} a ${formatDisplayDate(selected.exit)}`}
                />
                <Detail
                  label="Quarto reservado"
                  value={roomFor(selected)?.number ?? "—"}
                />
                <Detail label="Categoria" value={selected.category} />
                <Detail
                  label="Contratação"
                  value={
                    selected.packageSnapshot?.name ?? "Tarifa convencional"
                  }
                />
              </div>
              <Alert type="info">
                Confira os dados contratados. A gestão de quarto, consumos e
                pagamentos ficará disponível após a confirmação, na área
                Hospedagens.
              </Alert>
              {isFuture && (
                <Alert type="warning">
                  Esta reserva é futura. O check-in antecipado só poderá ser
                  confirmado mediante autorização expressa.
                </Alert>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <SectionTitle>
                Confirmar identificação e quantidade de hóspedes
              </SectionTitle>
              <FormGrid cols={2}>
                <Input label="Responsável" value={selected.guest} readOnly />
                <Input
                  label="CPF do responsável"
                  value={selectedClient?.cpf ?? "CPF não localizado"}
                  readOnly
                />
                <Input
                  label="Quantidade de hóspedes"
                  value={String(selected.guests)}
                  readOnly
                />
              </FormGrid>
              <div className="check-row">
                <Check
                  label="Documento do responsável conferido"
                  checked={documents.main}
                  onChange={(checked) => setDocuments({ main: checked })}
                />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <SectionTitle>Preparar quarto e entrega de acesso</SectionTitle>
              <Select
                label="Quarto compatível e disponível *"
                value={roomId}
                onChange={(event) => {
                  setRoomId(event.target.value)
                  setKeyData((current) => ({
                    ...current,
                    identifier: keyIdentifierFor(Number(event.target.value)),
                  }))
                }}
              >
                <option value="">Selecione</option>
                {candidateRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.number} — {room.category} · {room.status}
                  </option>
                ))}
              </Select>
              {candidateRooms.length === 0 ? (
                <Alert type="error">
                  Não há quarto compatível liberado. Quartos ocupados ou em
                  manutenção não podem receber check-in.
                </Alert>
              ) : (
                <Alert type="info">
                  A troca mantém categoria, tarifa e condições contratadas.
                  Alterações comerciais exigem edição autorizada da reserva.
                </Alert>
              )}
              <FormGrid cols={2}>
                <Input
                  label="Identificação da chave/cartão *"
                  value={keyData.identifier}
                  onChange={(event) =>
                    setKeyData({ ...keyData, identifier: event.target.value })
                  }
                />
                <Input
                  label="Data/hora da entrega *"
                  type="datetime-local"
                  value={keyData.deliveredAt}
                  onChange={(event) =>
                    setKeyData({ ...keyData, deliveredAt: event.target.value })
                  }
                />
                <FullCol>
                  <Textarea
                    label="Observação operacional"
                    value={keyData.notes}
                    onChange={(event) =>
                      setKeyData({ ...keyData, notes: event.target.value })
                    }
                  />
                </FullCol>
              </FormGrid>
              <Btn variant="secondary" onClick={() => window.print()}>
                Imprimir ficha de check-in
              </Btn>
            </>
          )}
          {step === 4 && (
            <>
              <SectionTitle>Resumo para iniciar a hospedagem</SectionTitle>
              <div className="summary-grid">
                <Detail label="Responsável" value={selected.guest} />
                <Detail
                  label="Quantidade de hóspedes"
                  value={String(selected.guests)}
                />
                <Detail
                  label="Quarto"
                  value={
                    rooms.find((room) => room.id === Number(roomId))?.number ??
                    "—"
                  }
                />
                <Detail
                  label="Entrada efetiva"
                  value={new Date().toLocaleString("pt-BR")}
                />
                <Detail
                  label="Saída prevista"
                  value={formatDisplayDate(selected.exit)}
                />
                <Detail
                  label="Diárias"
                  value={String(countNights(selected.entry, selected.exit))}
                />
                <Detail
                  label="Tarifa / pacote"
                  value={
                    selected.packageSnapshot?.name ??
                    `${formatMoney(selected.dailyRate)} por diária`
                  }
                />
                <Detail
                  label="Valor previsto"
                  value={formatMoney(reservationBaseValue(selected))}
                />
                <Detail
                  label="Pagamentos antecipados"
                  value={formatMoney(activeReceiptsTotal(selected.id))}
                />
                <Detail
                  label="Saldo previsto"
                  value={formatMoney(
                    Math.max(
                      0,
                      reservationBaseValue(selected) -
                        activeReceiptsTotal(selected.id),
                    ),
                  )}
                />
              </div>
              <Alert type="success">
                Ao confirmar, o quarto será ocupado, uma hospedagem ativa e sua
                fatura serão criadas. Você será direcionado ao gerenciamento da
                estadia.
              </Alert>
              {selected.packageSnapshot && (
                <Alert type="info">
                  Pacote contratado: {selected.packageSnapshot.name}.
                  Benefícios: {selected.packageSnapshot.benefits.join(" · ")}.
                </Alert>
              )}
              {isFuture && (
                <Check
                  label="Autorizo o check-in antecipado e assumo a alteração operacional"
                  checked={authorizeEarly}
                  onChange={setAuthorizeEarly}
                />
              )}
            </>
          )}
          {error && <Alert type="error">{error}</Alert>}
          <FormActions>
            <Btn
              variant="ghost"
              onClick={() =>
                step === 1 ? setModal(null) : setStep((current) => current - 1)
              }
            >
              {step === 1 ? "Cancelar atendimento" : "Voltar e revisar"}
            </Btn>
            {step < 4 ? (
              <Btn
                disabled={
                  (step === 2 && !documents.main) ||
                  (step === 3 && (!roomId || !keyData.identifier))
                }
                onClick={() => setStep((current) => current + 1)}
              >
                {step === 3 ? "Ver resumo da hospedagem" : "Continuar"}
              </Btn>
            ) : (
              <Btn
                disabled={isFuture && !authorizeEarly}
                onClick={confirmCheckin}
              >
                Confirmar e iniciar hospedagem
              </Btn>
            )}
          </FormActions>
        </Modal>
      )}

      {modal === "checkout" && selected && selectedInvoice && (
        <Modal
          wide
          title={`Check-out — ${selected.code.replace("RES", "HOS")}`}
          onClose={() => setModal(null)}
        >
          <SectionTitle>Resumo financeiro</SectionTitle>
          <div className="summary-grid">
            <Detail
              label={selected.packageSnapshot ? "Pacote contratado" : "Diárias"}
              value={formatMoney(selectedInvoice.baseTotal)}
            />
            <Detail
              label="Extras"
              value={formatMoney(selectedInvoice.consumptionTotal)}
            />
            <Detail
              label="Recebimentos"
              value={formatMoney(selectedInvoice.received)}
            />
            <Detail
              label="Valor total"
              value={formatMoney(selectedInvoice.total)}
            />
            <Detail
              label="Saldo pendente"
              value={formatMoney(selectedInvoice.balance)}
              strong={selectedInvoice.balance > 0}
            />
          </div>
          {selected.packageSnapshot && (
            <Alert type="success">
              {selected.packageSnapshot.name}:{" "}
              {selected.packageSnapshot.benefits.join(" · ")}. Benefícios
              utilizados não são cobrados novamente.
            </Alert>
          )}
          <Invoice
            reservation={selected}
            roomNumber={roomFor(selected)?.number ?? "—"}
            invoice={selectedInvoice}
          />
          {selectedInvoice.balance > 0 ? (
            <Alert type="error">Regularize o saldo antes de finalizar.</Alert>
          ) : (
            <Alert type="success">Situação financeira regularizada.</Alert>
          )}
          {selectedInvoice.balance > 0 && (
            <Btn
              variant="secondary"
              onClick={() => {
                setPaymentForm({
                  value: String(selectedInvoice.balance),
                  method: "pix",
                  date: today(),
                  responsible: "Recepcao",
                  notes: "Regularizacao no check-out.",
                })
                setModal("payment")
              }}
            >
              Registrar recebimento
            </Btn>
          )}
          <SectionTitle>Checklist de finalização</SectionTitle>
          <div className="checklist">
            <Check
              label="Situação financeira regularizada"
              checked={selectedInvoice.balance === 0}
              disabled
            />
            <Check
              label="Chave/cartão devolvido"
              checked={checkoutChecks.key}
              onChange={(checked) =>
                setCheckoutChecks({ ...checkoutChecks, key: checked })
              }
            />
            <Check
              label="Fatura conferida"
              checked={checkoutChecks.invoice}
              onChange={(checked) =>
                setCheckoutChecks({ ...checkoutChecks, invoice: checked })
              }
            />
            <Check
              label="Pendências verificadas"
              checked={checkoutChecks.pending}
              onChange={(checked) =>
                setCheckoutChecks({ ...checkoutChecks, pending: checked })
              }
            />
          </div>
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Btn>
            <Btn
              disabled={!canFinishCheckout}
              onClick={() => setConfirmCheckout(true)}
            >
              Finalizar Check-out
            </Btn>
          </FormActions>
        </Modal>
      )}

      {modal === "fatura" && selected && selectedInvoice && (
        <Modal wide title="Fatura da Hospedagem" onClose={() => setModal(null)}>
          <Invoice
            reservation={selected}
            roomNumber={roomFor(selected)?.number ?? "—"}
            invoice={selectedInvoice}
          />
          {issuing && <p className="inline-state">Emitindo fatura...</p>}
          {issueSuccess && (
            <Alert type="success">
              Fatura emitida e vinculada à hospedagem.
            </Alert>
          )}
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Fechar
            </Btn>
            <Btn variant="secondary" onClick={() => window.print()}>
              Visualizar Fatura
            </Btn>
            <Btn disabled={issuing} onClick={issueInvoice}>
              {issuing ? "Emitindo..." : "Emitir Fatura"}
            </Btn>
          </FormActions>
        </Modal>
      )}
      {confirmCheckout && selected && (
        <ConfirmDialog
          title="Confirmar check-out"
          description="A hospedagem será encerrada e o quarto liberado."
          onCancel={() => setConfirmCheckout(false)}
          onConfirm={() => {
            const result = checkOut(selected.id)
            setConfirmCheckout(false)
            if (!result.ok) {
              setError(result.error ?? "Falha ao concluir.")
              return
            }
            setModal(null)
            setFeedback("Check-out concluído e quarto liberado.")
            setTab("historico")
          }}
        />
      )}
      {modal === "payment" && selected && selectedInvoice && (
        <Modal
          title="Registrar Recebimento"
          onClose={() => setModal("checkout")}
        >
          <FormGrid cols={2}>
            <Input label="Cliente" value={selected.guest} readOnly />
            <Input
              label="Saldo pendente"
              value={formatMoney(selectedInvoice.balance)}
              readOnly
            />
            <Input
              label="Valor a receber"
              type="number"
              min="0.01"
              max={selectedInvoice.balance}
              step="0.01"
              value={paymentForm.value}
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, value: event.target.value })
              }
            />
            <Select
              label="Forma"
              value={paymentForm.method}
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, method: event.target.value })
              }
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
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
                label="Observacao"
                value={paymentForm.notes}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          <FormActions>
            <Btn variant="ghost" onClick={() => setModal("checkout")}>
              Cancelar
            </Btn>
            <Btn onClick={registerBalancePayment}>Confirmar recebimento</Btn>
          </FormActions>
        </Modal>
      )}
      {walkIn && (
        <Modal
          wide
          title="Iniciar hospedagem sem reserva"
          onClose={() => setWalkIn(false)}
        >
          <div
            style={{
              border: "1px solid var(--brand-200)",
              background: "var(--brand-50)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <strong style={{ color: "var(--brand-900)" }}>
              Atendimento de balcão
            </strong>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)" }}>
              Selecione ou cadastre o hóspede, confirme o quarto e revise o
              resumo. A confirmação cria reserva operacional, hospedagem ativa e
              fatura.
            </p>
          </div>
          <FormGrid cols={2}>
            <FullCol>
              <SectionTitle>1. Hóspede responsável</SectionTitle>
              <Select
                label="Hóspede responsável *"
                value={walkInForm.clientId}
                onChange={(event) =>
                  setWalkInForm({ ...walkInForm, clientId: event.target.value })
                }
              >
                <option value="">Selecione um hóspede cadastrado</option>
                {clients
                  .filter((item) => item.status === "Ativo")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.cpf}
                    </option>
                  ))}
              </Select>
              <Btn
                small
                variant="secondary"
                onClick={() => {
                  setWalkInClient({ name: "", cpf: "", phone: "", email: "" })
                  setWalkInClientOpen(true)
                }}
              >
                + Cadastrar hóspede sem abandonar o atendimento
              </Btn>
            </FullCol>
            <FullCol>
              <SectionTitle>2. Período e acomodação</SectionTitle>
            </FullCol>
            <Input
              label="Entrada"
              type="date"
              value={walkInForm.entry}
              onChange={(event) =>
                setWalkInForm({
                  ...walkInForm,
                  entry: event.target.value,
                  roomId: "",
                  packageId: "",
                })
              }
            />
            <Input
              label="Saída prevista"
              type="date"
              min={walkInForm.entry}
              value={walkInForm.exit}
              onChange={(event) =>
                setWalkInForm({
                  ...walkInForm,
                  exit: event.target.value,
                  roomId: "",
                  packageId: "",
                })
              }
            />
            <Input
              label="Quantidade de hóspedes"
              type="number"
              min="1"
              value={walkInForm.guests}
              onChange={(event) =>
                setWalkInForm({
                  ...walkInForm,
                  guests: event.target.value,
                  roomId: "",
                })
              }
            />
            <Select
              label="Quarto disponível"
              value={walkInForm.roomId}
              onChange={(event) =>
                setWalkInForm({ ...walkInForm, roomId: event.target.value })
              }
            >
              <option value="">Selecione</option>
              {compatibleWalkInRooms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.number} · {item.category} · {formatMoney(item.rate)}
                </option>
              ))}
            </Select>
            <FullCol>
              <SectionTitle>3. Contratação e observações</SectionTitle>
            </FullCol>
            <Select
              label="Modalidade"
              value={walkInForm.contractType}
              onChange={(event) =>
                setWalkInForm({
                  ...walkInForm,
                  contractType: event.target
                    .value as typeof walkInForm.contractType,
                  packageId: "",
                  roomId: "",
                })
              }
            >
              <option>Tarifa convencional</option>
              <option>Pacote comercial</option>
            </Select>
            {walkInForm.contractType === "Pacote comercial" && (
              <Select
                label="Pacote"
                value={walkInForm.packageId}
                onChange={(event) =>
                  setWalkInForm({
                    ...walkInForm,
                    packageId: event.target.value,
                    roomId: "",
                  })
                }
              >
                <option value="">Selecione</option>
                {packages
                  .filter(
                    (item) =>
                      item.active &&
                      item.validFrom <= walkInForm.entry &&
                      item.validTo >= walkInForm.exit,
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </Select>
            )}
            {selectedWalkInPackage && (
              <FullCol>
                <Alert
                  type={walkInPackageRestrictions.length ? "warning" : "info"}
                >
                  <strong>{selectedWalkInPackage.name}</strong> contempla as
                  categorias {selectedWalkInPackage.roomCategories.join(", ")}.{" "}
                  {walkInPackageRestrictions.length
                    ? `Revise: ${walkInPackageRestrictions.join(", ")}.`
                    : `${compatibleWalkInRooms.length} quarto(s) compatível(is) disponível(is): ${compatibleWalkInRooms.map((room) => `${room.number} (${room.category})`).join(", ") || "nenhum"}.`}
                </Alert>
              </FullCol>
            )}
            <FullCol>
              <Textarea
                label="Observações"
                value={walkInForm.notes}
                onChange={(event) =>
                  setWalkInForm({ ...walkInForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
          <Alert type="info">
            Resumo:{" "}
            {clients.find((item) => item.id === Number(walkInForm.clientId))
              ?.name ?? "hóspede não selecionado"}{" "}
            · quarto{" "}
            {rooms.find((item) => item.id === Number(walkInForm.roomId))
              ?.number ?? "não selecionado"}{" "}
            · {walkInForm.guests} hóspede(s).
          </Alert>
          {error && <Alert type="error">{error}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={() => setWalkIn(false)}>
              Cancelar atendimento
            </Btn>
            <Btn
              disabled={
                !walkInForm.clientId ||
                !walkInForm.roomId ||
                !walkInForm.exit ||
                (walkInForm.contractType === "Pacote comercial" &&
                  !walkInForm.packageId)
              }
              onClick={() => {
                const result = walkInCheckIn({
                  clientId: Number(walkInForm.clientId),
                  companions: [],
                  entry: walkInForm.entry,
                  exit: walkInForm.exit,
                  roomId: Number(walkInForm.roomId),
                  guests: Number(walkInForm.guests),
                  contractType: walkInForm.contractType,
                  packageId: walkInForm.packageId
                    ? Number(walkInForm.packageId)
                    : undefined,
                  notes: walkInForm.notes,
                })
                if (!result.ok)
                  return setError(result.error ?? "Não foi possível concluir.")
                setWalkIn(false)
                if (result.stayId) {
                  const navigation = stayNavigationEvent(result.stayId)
                  window.dispatchEvent(
                    new CustomEvent(navigation.name, {
                      detail: navigation.stayId,
                    }),
                  )
                }
              }}
            >
              Confirmar e iniciar hospedagem
            </Btn>
          </FormActions>
        </Modal>
      )}
      {walkInClientOpen && (
        <Modal
          title="Cadastro rápido de hóspede"
          onClose={() => setWalkInClientOpen(false)}
        >
          <FormGrid cols={2}>
            <FullCol>
              <Input
                label="Nome completo *"
                value={walkInClient.name}
                onChange={(event) =>
                  setWalkInClient({ ...walkInClient, name: event.target.value })
                }
              />
            </FullCol>
            <Input
              label="CPF *"
              value={walkInClient.cpf}
              onChange={(event) =>
                setWalkInClient({ ...walkInClient, cpf: event.target.value })
              }
            />
            <Input
              label="Telefone"
              value={walkInClient.phone}
              onChange={(event) =>
                setWalkInClient({ ...walkInClient, phone: event.target.value })
              }
            />
            <FullCol>
              <Input
                label="E-mail"
                type="email"
                value={walkInClient.email}
                onChange={(event) =>
                  setWalkInClient({
                    ...walkInClient,
                    email: event.target.value,
                  })
                }
              />
            </FullCol>
          </FormGrid>
          <FormActions>
            <Btn variant="ghost" onClick={() => setWalkInClientOpen(false)}>
              Cancelar
            </Btn>
            <Btn
              onClick={() => {
                const result = createClient({
                  name: walkInClient.name,
                  cpf: walkInClient.cpf,
                  documentType: "RG",
                  documentNumber: "",
                  birthDate: "",
                  nationality: "Brasileira",
                  gender: "",
                  postalCode: "",
                  street: "",
                  addressNumber: "",
                  complement: "",
                  district: "",
                  city: "",
                  state: "",
                  email: walkInClient.email,
                  phone: walkInClient.phone,
                  emergencyPhone: "",
                  emergencyContact: "",
                  preferredRoomType: "",
                  preferredFloor: "",
                  smoker: "Não",
                  preferences: "",
                })
                if (!result.ok || !result.client)
                  return setError(
                    result.error ?? "Não foi possível cadastrar o hóspede.",
                  )
                setWalkInForm({
                  ...walkInForm,
                  clientId: String(result.client.id),
                })
                setWalkInClientOpen(false)
                setError("")
              }}
            >
              Cadastrar e selecionar
            </Btn>
          </FormActions>
        </Modal>
      )}
    </div>
  )
}

type InvoiceData = ReturnType<typeof invoiceShape>
function invoiceShape() {
  return {
    nights: 0,
    baseTotal: 0,
    reservationConsumptions: [] as {
      id: number
      service: string
      description: string
      value: number
      includedInPackage: boolean
    }[],
    chargeableConsumptions: [] as {
      id: number
      service: string
      description: string
      value: number
      includedInPackage: boolean
    }[],
    consumptionTotal: 0,
    received: 0,
    total: 0,
    balance: 0,
  }
}

function Invoice({
  reservation,
  roomNumber,
  invoice,
}: {
  reservation: Reservation
  roomNumber: string
  invoice: InvoiceData
}) {
  const baseDescription = reservation.packageSnapshot
    ? `Pacote ${reservation.packageSnapshot.name}`
    : "Hospedagem por diária"
  const rows = [
    [
      baseDescription,
      reservation.packageSnapshot ? "1" : String(invoice.nights),
      formatMoney(invoice.baseTotal),
      "Contratado",
    ],
    ...invoice.reservationConsumptions.map((item) => [
      item.description || item.service,
      "1",
      formatMoney(item.includedInPackage ? 0 : item.value),
      item.includedInPackage ? "Incluso no pacote" : "Extra",
    ]),
  ]
  return (
    <div className="invoice-sheet">
      <div className="invoice-header">
        <div>
          <strong>Hotel Pacaas Novos</strong>
          <span>Fatura · {reservation.code.replace("RES", "HOS")}</span>
        </div>
        <div>
          <span>{reservation.guest}</span>
          <span>
            Quarto {roomNumber} · {formatDisplayDate(reservation.entry)} a{" "}
            {formatDisplayDate(reservation.exit)}
          </span>
        </div>
      </div>
      <Table
        headers={["Descrição", "Quantidade", "Valor", "Classificação"]}
        rows={rows}
      />
      <div className="invoice-totals">
        <Detail
          label="Hospedagem / pacote"
          value={formatMoney(invoice.baseTotal)}
        />
        <Detail label="Extras" value={formatMoney(invoice.consumptionTotal)} />
        <Detail label="Recebimentos" value={formatMoney(invoice.received)} />
        <Detail label="Total" value={formatMoney(invoice.total)} />
        <Detail
          label="Saldo"
          value={formatMoney(invoice.balance)}
          strong={invoice.balance > 0}
        />
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong className={strong ? "financial-alert" : ""}>{value}</strong>
    </div>
  )
}

function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="check-field">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      {label}
    </label>
  )
}
