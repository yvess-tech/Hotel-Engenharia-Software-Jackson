import ManagementPage, {
  Surface as Card,
  ManagementBadge as Badge,
  ManagementModal as Modal,
  ManagementTable as Table,
  ManagementTabs as Tabs,
  ManagementHeader,
  MetricCard,
  DetailValue as Info,
} from "../management-ui"

import { useEffect, useMemo, useState } from "react"

import { useAccessControl } from "../../access-control"

import printDocument from "../print-document"

import {
  findRoomScheduleConflict,
  validateTimelineTimes,
} from "../../domain/event-rules"

import {
  PAYMENT_METHODS,
  formatMoney,
  today,
  useHotelOperations,
  type ConferenceRoom,
  type ConferenceRoomInput,
  type ContractedEventService,
  type EventInput,
  type EventRecord,
  type EventFinancials,
  type EventService,
  type EventServiceInput,
  type EventStatus,
  type EventTimelineItem,
  type EventType,
} from "../HotelOperationsContext"

import { useDemoEngine } from "../demo/DemoEngineContext"

import {
  Alert,
  Btn,
  FormActions,
  FormGrid,
  FullCol,
  Input,
  Icon,
  ResponsibleSelect,
  SectionTitle,
  Select,
  Textarea,
  formatDisplayDate,
} from "../ui"

type Tab = "agenda" | "eventos" | "salas" | "servicos"

type ModalMode = "event-new" | "event-edit" | "event-view" | "event-cancel" | "event-receipt" | "room-new" | "room-edit" | "room-view" | "service-new" | "service-edit" | "service-view" | null

type EventStep = 1 | 2 | 3 | 4 | 5 | 6

const eventStatuses: EventStatus[] = [
  "Planejado",
  "Confirmado",
  "Em andamento",
  "Concluido",
  "Cancelado",
]

const paymentMethods = PAYMENT_METHODS.map((method) => ({
  value: method.id,
  label: method.label,
}))

const emptyTimeline = (): EventTimelineItem => ({
  id: Date.now(),
  time: "08:00",
  activity: "",
  responsible: "",
  notes: "",
})

const emptyRoom = (): ConferenceRoomInput => ({
  name: "",
  location: "",
  capacity: 0,
  area: 0,
  hourlyRate: 0,
  resources: "",
})

const emptyService = (): EventServiceInput => ({
  name: "",
  category: "Coffee break",
  description: "",
  unit: "por evento",
  price: 0,
})

function localDateTime(days: number, time: string) {
  const date = new Date()

  date.setDate(date.getDate() + days)

  return `${date.toISOString().slice(0, 10)}T${time}`
}

function emptyEvent(
  room?: ConferenceRoom,
  services: EventService[] = [],
): EventInput {
  const start = localDateTime(10, "08:00")

  const end = localDateTime(10, "12:00")

  return {
    name: "",
    type: "Corporativo",
    contractorName: "",
    contact: "",
    phone: "",
    email: "",
    contractorClientId: undefined,
    guests: 1,
    notes: "",
    roomId: room?.id ?? 0,
    roomHourlyRateContracted: room?.hourlyRate ?? 0,
    start,
    end,
    setupMinutes: 30,
    teardownMinutes: 30,
    services: services.slice(0, 0).map(serviceToLine),
    discountValue: 0,
    billingType: "Separada",
    linkedReservationId: undefined,
    depositRequired: true,
    depositPercent: 30,
    depositDueDate: start.slice(0, 10),
    balanceDueDate: start.slice(0, 10),
    cancellationPolicy:
      "Sinal não reembolsável em caso de cancelamento a menos de 7 dias do evento.",
    status: "Planejado",
    timeline: [
      {
        id: 1,
        time: "08:00",
        activity: "Preparacao da sala",
        responsible: "Equipe de eventos",
        notes: "",
      },
      {
        id: 2,
        time: "08:30",
        activity: "Credenciamento",
        responsible: "Recepcao",
        notes: "",
      },
      {
        id: 3,
        time: "09:00",
        activity: "Abertura",
        responsible: "Contratante",
        notes: "",
      },
      {
        id: 4,
        time: "12:00",
        activity: "Encerramento",
        responsible: "Contratante",
        notes: "",
      },
    ],
  }
}

function serviceToLine(
  service: EventService,
  quantity = 1,
): ContractedEventService {
  return {
    id: Date.now() + Math.round(Math.random() * 1000),
    serviceId: service.id,
    serviceName: service.name,
    category: service.category,
    unit: service.unit,
    quantity,
    contractedUnitPrice: service.price,
    subtotal: quantity * service.price,
  }
}

function eventToForm(event: EventRecord): EventInput {
  return {
    scenarioKey: event.scenarioKey,
    name: event.name,
    type: event.type,
    contractorClientId: event.contractorClientId,
    contractorName: event.contractorName,
    contact: event.contact,
    phone: event.phone,
    email: event.email,
    guests: event.guests,
    notes: event.notes,
    roomId: event.roomId,
    roomHourlyRateContracted: event.roomHourlyRateContracted,
    start: event.start,
    end: event.end,
    setupMinutes: event.setupMinutes ?? 0,
    teardownMinutes: event.teardownMinutes ?? 0,
    services: event.services,
    discountValue: event.discountValue,
    billingType: event.billingType,
    linkedReservationId: event.linkedReservationId,
    depositRequired: event.depositRequired ?? false,
    depositPercent: event.depositPercent ?? 0,
    depositDueDate: event.depositDueDate ?? event.start.slice(0, 10),
    balanceDueDate: event.balanceDueDate ?? event.end.slice(0, 10),
    cancellationPolicy: event.cancellationPolicy ?? "",
    status: event.status,
    timeline: event.timeline,
  }
}

function durationHours(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()

  return Number.isFinite(ms) ? Math.max(0, ms / 3600000) : 0
}

function lineSubtotal(line: ContractedEventService) {
  return Math.round(line.quantity * line.contractedUnitPrice * 100) / 100
}

function formTotals(form: EventInput) {
  const roomValue =
    Math.round(
      durationHours(form.start, form.end) * form.roomHourlyRateContracted * 100,
    ) / 100

  const servicesValue =
    Math.round(
      form.services.reduce((total, line) => total + lineSubtotal(line), 0) *
        100,
    ) / 100

  const total = Math.max(
    0,
    roomValue + servicesValue - Number(form.discountValue || 0),
  )

  return {
    roomValue,
    servicesValue,
    total,
    duration: durationHours(form.start, form.end),
  }
}

export default function Eventos() {
  const { activeAccount, registerLog } = useAccessControl()

  const demo = useDemoEngine()

  const {
    clients,
    reservations,
    stays,
    conferenceRooms,
    eventServices,
    events,
    eventReceipts,
    createConferenceRoom,
    updateConferenceRoom,
    inactivateConferenceRoom,
    createEventService,
    updateEventService,
    inactivateEventService,
    createEvent,
    updateEvent,
    cancelEvent,
    registerEventReceipt,
    getEventFinancials,
  } = useHotelOperations()

  const [tab, setTab] = useState<Tab>("agenda")

  const [modal, setModal] = useState<ModalMode>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [eventStep, setEventStep] = useState<EventStep>(1)

  const [eventForm, setEventForm] = useState<EventInput>(() =>
    emptyEvent(conferenceRooms.find((room) => room.status === "Ativo")),
  )

  const [roomForm, setRoomForm] = useState<ConferenceRoomInput>(emptyRoom)

  const [serviceForm, setServiceForm] =
    useState<EventServiceInput>(emptyService)

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    roomId: "",
    from: "",
    to: "",
  })

  const [agendaDate, setAgendaDate] = useState(today())

  const [agendaView, setAgendaView] = useState<"dia" | "semana">("dia")

  const [agendaRoomId, setAgendaRoomId] = useState("")

  const [message, setMessage] = useState("")

  const [cancelForm, setCancelForm] = useState({
    reason: "",
    treatment: "",
    refundValue: "",
    refundMethod: "pix",
    choice: "full",
  })

  useEffect(() => {
    setMessage("")
  }, [modal])

  const [receiptForm, setReceiptForm] = useState({
    value: "",
    method: "pix",
    responsible: activeAccount?.name ?? "Eventos",
    notes: "",
    date: today(),
  })

  const selectedEvent = events.find((event) => event.id === selectedId) ?? null

  const selectedRoom =
    conferenceRooms.find((room) => room.id === selectedId) ?? null

  const selectedService =
    eventServices.find((service) => service.id === selectedId) ?? null

  const activeRooms = conferenceRooms.filter((room) => room.status === "Ativo")

  const activeServices = eventServices.filter(
    (service) => service.status === "Ativo",
  )

  const formRoom = conferenceRooms.find((room) => room.id === eventForm.roomId)

  const totals = formTotals(eventForm)

  const conflict =
    eventForm.roomId && eventForm.start && eventForm.end
      ? findRoomScheduleConflict(
          events,
          eventForm.roomId,
          eventForm.start,
          eventForm.end,
          modal === "event-edit" ? selectedId : undefined,
          eventForm.setupMinutes,
          eventForm.teardownMinutes,
        )
      : null

  const eligibleStays = stays

    .filter((stay) => stay.status === "Ativa")

    .map((stay) => ({
      stay,
      reservation: reservations.find(
        (reservation) => reservation.id === stay.reservationId,
      ),
    }))

    .filter((item) => item.reservation)

  useEffect(() => {
    const command = demo.activeCommand

    if (!command || command.target !== "eventos") return

    if (command.command === "prefill-event-form") {
      openNewEvent()

      const room =
        conferenceRooms.find((item) => item.name === "Sala A") ?? activeRooms[0]

      const coffee = eventServices.find((item) =>
        item.name.toLowerCase().includes("coffee"),
      )

      const projector = eventServices.find((item) =>
        item.name.toLowerCase().includes("projetor"),
      )

      setEventForm({
        ...emptyEvent(room),
        name: "Treinamento Corporativo",
        contractorName: "Empresa Exemplo Ltda.",
        contact: "Marina Alves",
        phone: "(69) 99999-3300",
        email: "marina@empresaexemplo.com.br",
        guests: 30,
        roomId: room?.id ?? 0,
        roomHourlyRateContracted: room?.hourlyRate ?? 300,
        services: [coffee, projector]

          .filter((item): item is EventService => Boolean(item))

          .map((service) =>
            serviceToLine(
              service,
              service.name.toLowerCase().includes("coffee") ? 30 : 1,
            ),
          ),
      })

      demo.resolveCommand(command.id, {
        status: "running",
        message:
          "Formulario de evento preenchido para a jornada administrativa.",
      })
    }
  }, [demo.activeCommand])

  const actor = activeAccount
    ? { id: activeAccount.id, name: activeAccount.name }
    : undefined

  const roomName = (id: number) =>
    conferenceRooms.find((room) => room.id === id)?.name ?? "Sala historica"

  const filteredEvents = events.filter((event) => {
    const query = filters.search.trim().toLowerCase()

    return (
      (!query ||
        `${event.code} ${event.name} ${event.contractorName}`

          .toLowerCase()

          .includes(query)) &&
      (!filters.status || event.status === filters.status) &&
      (!filters.type || event.type === filters.type) &&
      (!filters.roomId || event.roomId === Number(filters.roomId)) &&
      (!filters.from || event.start.slice(0, 10) >= filters.from) &&
      (!filters.to || event.start.slice(0, 10) <= filters.to)
    )
  })

  const metrics = {
    future: events.filter(
      (event) =>
        event.status !== "Cancelado" &&
        event.start >= new Date().toISOString().slice(0, 16),
    ).length,
    contracted: filteredEvents

      .filter((event) => event.status !== "Cancelado")

      .reduce((total, event) => total + event.totalContracted, 0),
    received: events

      .filter(
        (event) => event.billingType === "Separada",
      )

      .reduce(
        (total, event) => total + (getEventFinancials(event.id)?.received ?? 0),
        0,
      ),
    pending: events

      .filter(
        (event) =>
          event.billingType === "Separada" && event.status !== "Cancelado",
      )

      .reduce(
        (total, event) => total + (getEventFinancials(event.id)?.balance ?? 0),
        0,
      ),
  }

  const openNewEvent = () => {
    setSelectedId(null)

    setEventStep(1)

    setMessage("")

    setEventForm(emptyEvent(activeRooms[0], activeServices))

    setModal("event-new")
  }

  const openEditEvent = (event: EventRecord) => {
    setSelectedId(event.id)

    setEventForm(eventToForm(event))

    setEventStep(1)

    setMessage("")

    setModal("event-edit")
  }

  const saveEvent = () => {
    setMessage("")

    const timelineValidation = validateTimelineTimes(
      eventForm.timeline.map((item) => item.time),
      eventForm.start,
      eventForm.end,
    )

    if (!timelineValidation.ok) {
      setMessage(timelineValidation.error ?? "Cronograma invalido.")

      return
    }

    const result =
      modal === "event-edit" && selectedEvent
        ? updateEvent(selectedEvent.id, eventForm)
        : createEvent(eventForm)

    if (!result.ok) {
      setMessage(result.error ?? "Nao foi possivel salvar o evento.")

      return
    }

    registerLog(
      modal === "event-edit" ? "Evento atualizado" : "Evento cadastrado",
      "Eventos",
      eventForm.name,
      "Sucesso",
      actor,
    )

    setModal(null)

    setTab("eventos")
  }

  const saveRoom = () => {
    const result =
      modal === "room-edit" && selectedRoom
        ? updateConferenceRoom(selectedRoom.id, roomForm)
        : createConferenceRoom(roomForm)

    if (!result.ok)
      setMessage(result.error ?? "Nao foi possivel salvar a sala.")
    else {
      registerLog(
        modal === "room-edit" ? "Sala atualizada" : "Sala cadastrada",
        "Eventos",
        roomForm.name,
        "Sucesso",
        actor,
      )

      setModal(null)
    }
  }

  const saveService = () => {
    const result =
      modal === "service-edit" && selectedService
        ? updateEventService(selectedService.id, serviceForm)
        : createEventService(serviceForm)

    if (!result.ok)
      setMessage(result.error ?? "Nao foi possivel salvar o servico.")
    else {
      registerLog(
        modal === "service-edit" ? "Servico atualizado" : "Servico cadastrado",
        "Eventos",
        serviceForm.name,
        "Sucesso",
        actor,
      )

      setModal(null)
    }
  }

  const confirmCancel = () => {
    if (!selectedEvent) return

    const received = getEventFinancials(selectedEvent.id)?.received ?? 0

    const refundValue =
      cancelForm.choice === "full"
        ? received
        : cancelForm.choice === "retain"
          ? 0
          : cancelForm.refundValue === ""
            ? NaN
            : Number(cancelForm.refundValue)

    const result = cancelEvent(selectedEvent.id, { ...cancelForm, refundValue })

    if (!result.ok) setMessage(result.error ?? "Nao foi possivel cancelar.")
    else {
      registerLog(
        "Evento cancelado",
        "Eventos",
        selectedEvent.code,
        "Sucesso",
        actor,
      )

      setModal(null)
    }
  }

  const saveReceipt = () => {
    if (!selectedEvent) return

    const result = registerEventReceipt({
      eventId: selectedEvent.id,
      value: Number(receiptForm.value),
      method: receiptForm.method,
      responsible: receiptForm.responsible,
      notes: receiptForm.notes,
      date: receiptForm.date,
      operationKey: `event-receipt-${Date.now()}`,
    })

    if (!result.ok)
      setMessage(result.error ?? "Nao foi possivel registrar o recebimento.")
    else {
      setModal(null)

      setMessage("Recebimento do evento registrado como entrada no caixa.")
    }
  }

  return (
    <ManagementPage module="events">
      <ManagementHeader
        title="Eventos"
        eyebrow="Operações e planejamento"
        description="Organize espaços, contratações e serviços. Acompanhe cada evento até a conclusão."
        actions={<Btn onClick={openNewEvent}>+ Novo Evento</Btn>}
      />
      {message && (
        <Alert
          type={
            message.includes("Nao") ||
            message.includes("Conflito") ||
            message.includes("invalido")
              ? "error"
              : "success"
          }
        >
          {message}
        </Alert>
      )}

      <div className="management-metrics management-metrics--events">
        <MetricCard
          label="Eventos futuros"
          value={String(metrics.future)}
          description="Eventos não cancelados com início futuro."
          icon="calendar-range"
        />
        <MetricCard
          label="Valor contratado"
          description="Contratos não cancelados nos filtros atuais."
          icon="file-text"
          value={formatMoney(metrics.contracted)}
        />
        <MetricCard
          label="Recebido líquido em eventos"
          description="Cobrança separada, descontadas as devoluções."
          icon="badge-check"
          tone="positive"
          value={formatMoney(metrics.received)}
        />
        <MetricCard
          label="Saldo a receber"
          value={formatMoney(metrics.pending)}
          description="Saldo de eventos com cobrança separada."
          icon="banknote"
          tone="warning"
        />
      </div>

      <Tabs
        tabs={[
          { id: "agenda", label: "Agenda" },
          { id: "eventos", label: "Eventos" },
          { id: "salas", label: "Salas" },
          { id: "servicos", label: "Serviços" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "agenda" && (
        <AgendaView
          events={events}
          rooms={conferenceRooms}
          date={agendaDate}
          setDate={setAgendaDate}
          view={agendaView}
          setView={setAgendaView}
          roomId={agendaRoomId}
          setRoomId={setAgendaRoomId}
          openEvent={(event) => {
            setSelectedId(event.id)

            setModal("event-view")
          }}
          startEvent={(roomId, start, end) => {
            const room = conferenceRooms.find((item) => item.id === roomId)

            setEventForm({
              ...emptyEvent(room),
              roomId,
              start,
              end,
              roomHourlyRateContracted: room?.hourlyRate ?? 0,
            })

            setEventStep(1)

            setModal("event-new")
          }}
        />
      )}

      {tab === "eventos" && (
        <Card
          title="Eventos cadastrados"
          description="Consulte contratos, acompanhe os recebimentos e gerencie cada etapa."
        >
          <Alert type="info">
            Fluxo do evento: cadastre a contratação, registre o pagamento em{" "}
            <strong>Receber</strong> e o sistema cria uma{" "}
            <strong>entrada no Caixa</strong>. Eventos vinculados à hospedagem
            são recebidos na fatura da reserva.
          </Alert>
          <div className="management-filters">
            <FormGrid cols={3}>
              <Input
                label="Buscar"
                placeholder="Codigo, evento ou contratante"
                value={filters.search}
                onChange={(event) =>
                  setFilters({ ...filters, search: event.target.value })
                }
              />
              <Select
                label="Sala"
                value={filters.roomId}
                onChange={(event) =>
                  setFilters({ ...filters, roomId: event.target.value })
                }
              >
                <option value="">Todas</option>
                {conferenceRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Situação"
                value={filters.status}
                onChange={(event) =>
                  setFilters({ ...filters, status: event.target.value })
                }
              >
                <option value="">Todas</option>
                {eventStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
              <Select
                label="Tipo"
                value={filters.type}
                onChange={(event) =>
                  setFilters({ ...filters, type: event.target.value })
                }
              >
                <option value="">Todos</option>
                <option>Corporativo</option>
                <option>Social</option>
              </Select>
              <Input
                label="De"
                type="date"
                value={filters.from}
                onChange={(event) =>
                  setFilters({ ...filters, from: event.target.value })
                }
              />
              <Input
                label="Até"
                type="date"
                value={filters.to}
                onChange={(event) =>
                  setFilters({ ...filters, to: event.target.value })
                }
              />
            </FormGrid>
          </div>
          <Table
            caption="Eventos cadastrados"
            headers={["Evento","Contratante","Período e espaço","Cobrança e sinal","Contratado","Recebido","Saldo","Situação","Ações"]}
            rows={filteredEvents.map((event) => [
<div className="management-cell"><strong>{event.name}</strong><small>{event.code} · {event.type}</small></div>,
event.contractorName,
<div className="management-cell">
                <strong>
                  {formatDisplayDate(event.start).replace("T", " · ")}
                </strong>
                <small>
                  Até {formatDisplayDate(event.end).replace("T", " · ")} ·{" "}
                  {event.roomName}
                </small>
              </div>,
<div className="management-cell"><span>{event.billingType === "Separada"
                ? "Evento"
                : "Fatura da hospedagem"}</span><small>{event.billingType === "Separada" && event.depositRequired
                ? `${event.depositPercent ?? 0}% · ${formatMoney((event.totalContracted * (event.depositPercent ?? 0)) / 100)}`
                : "Sem sinal"}</small></div>,
formatMoney(event.totalContracted),
event.billingType === "Vinculada a hospedagem"
                ? "Na fatura"
                : formatMoney(getEventFinancials(event.id)?.received ?? 0),
event.billingType === "Vinculada a hospedagem"
                ? "Consultar hospedagem"
                : formatMoney(
                    getEventFinancials(event.id)?.balance ??
                      event.totalContracted,
                  ),
<Badge label={event.status} />,
<div className="table-actions">
                <Btn
                  small
                  variant="ghost"
                  onClick={() => {
                    setSelectedId(event.id)

                    setModal("event-view")
                  }}
                >
                  Consultar
                </Btn>
                {!["Cancelado", "Concluido"].includes(event.status) && (
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => openEditEvent(event)}
                  >
                    Atualizar
                  </Btn>
                )}
                {event.billingType === "Separada" &&
                  (getEventFinancials(event.id)?.balance ?? 0) > 0 && (
                    <Btn
                      small
                      variant="secondary"
                      onClick={() => {
                        setSelectedId(event.id)

                        setReceiptForm({
                          ...receiptForm,
                          value: String(
                            getEventFinancials(event.id)?.balance ?? 0,
                          ),
                        })

                        setModal("event-receipt")
                      }}
                    >
                      Receber
                    </Btn>
                  )}
                {["Planejado", "Confirmado"].includes(event.status) && (
                  <Btn
                    small
                    variant="danger"
                    confirmAction={false}
                    onClick={() => {
                      setSelectedId(event.id)

                      setCancelForm({
                        reason: "",
                        treatment: "",
                        refundValue: "",
                        refundMethod: "pix",
                        choice: "full",
                      })

                      setModal("event-cancel")
                    }}
                  >
                    Cancelar
                  </Btn>
                )}
              </div>
])}
          />
        </Card>
      )}

      {tab === "salas" && (
        <Card
          title="Salas e espaços"
          description="Capacidade, estrutura e valores dos espaços de eventos."
        >
          <div className="management-section-heading">
            <Btn
              onClick={() => {
                setSelectedId(null)

                setRoomForm(emptyRoom())

                setModal("room-new")
              }}
            >
              + Nova Sala
            </Btn>
          </div>
          <Table
            caption="Salas e espaços para eventos"
            headers={[
              "Nome",
              "Localizacao",
              "Capacidade",
              "Area",
              "Recursos",
              "Preco por hora",
              "Situacao",
              "Acoes",
            ]}
            rows={conferenceRooms.map((room) => [
              room.name,
              room.location,
              `${room.capacity} pessoas`,
              `${room.area} m2`,
              room.resources || "Nao informado",
              formatMoney(room.hourlyRate),
              <Badge label={room.status} />,
              <div className="table-actions">
                <Btn
                  small
                  variant="ghost"
                  onClick={() => {
                    setSelectedId(room.id)

                    setModal("room-view")
                  }}
                >
                  Consultar
                </Btn>
                {room.status === "Ativo" && (
                  <>
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => {
                        setSelectedId(room.id)

                        setRoomForm({
                          name: room.name,
                          location: room.location,
                          capacity: room.capacity,
                          area: room.area,
                          hourlyRate: room.hourlyRate,
                          resources: room.resources,
                        })

                        setModal("room-edit")
                      }}
                    >
                      Atualizar
                    </Btn>
                    <Btn
                      small
                      variant="danger"
                      onClick={() => {
                        const result = inactivateConferenceRoom(room.id)

                        setMessage(
                          result.ok
                            ? `${room.name} inativada.`
                            : (result.error ?? "Nao foi possivel inativar."),
                        )
                      }}
                    >
                      Inativar
                    </Btn>
                  </>
                )}
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "servicos" && (
        <Card
          title="Catálogo de serviços"
          description="Serviços disponíveis e seus preços de contratação."
        >
          <div className="management-section-heading">
            <Btn
              onClick={() => {
                setSelectedId(null)

                setServiceForm(emptyService())

                setModal("service-new")
              }}
            >
              + Novo Servico
            </Btn>
          </div>
          <Table
            caption="Catálogo de serviços de eventos"
            headers={[
              "Nome",
              "Categoria",
              "Descricao",
              "Unidade",
              "Preco",
              "Situacao",
              "Acoes",
            ]}
            rows={eventServices.map((service) => [
              service.name,
              service.category,
              service.description,
              service.unit,
              formatMoney(service.price),
              <Badge label={service.status} />,
              <div className="table-actions">
                <Btn
                  small
                  variant="ghost"
                  onClick={() => {
                    setSelectedId(service.id)

                    setModal("service-view")
                  }}
                >
                  Consultar
                </Btn>
                {service.status === "Ativo" && (
                  <>
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => {
                        setSelectedId(service.id)

                        setServiceForm({
                          name: service.name,
                          category: service.category,
                          description: service.description,
                          unit: service.unit,
                          price: service.price,
                        })

                        setModal("service-edit")
                      }}
                    >
                      Atualizar
                    </Btn>
                    <Btn
                      small
                      variant="danger"
                      onClick={() => {
                        const result = inactivateEventService(service.id)

                        setMessage(
                          result.ok
                            ? `${service.name} inativado.`
                            : (result.error ?? "Nao foi possivel inativar."),
                        )
                      }}
                    >
                      Inativar
                    </Btn>
                  </>
                )}
              </div>,
            ])}
          />
        </Card>
      )}

      {(modal === "event-new" || modal === "event-edit") && (
        <EventWizard
          form={eventForm}
          setForm={setEventForm}
          step={eventStep}
          setStep={setEventStep}
          rooms={conferenceRooms}
          services={eventServices}
          clients={clients}
          eligibleStays={eligibleStays}
          conflict={conflict}
          totals={totals}
          onClose={() => setModal(null)}
          onSave={saveEvent}
          message={message}
        />
      )}

      {modal === "event-view" && selectedEvent && (
        <EventDetails
          event={selectedEvent}
          receipts={eventReceipts.filter(
            (receipt) => receipt.eventId === selectedEvent.id,
          )}
          financials={getEventFinancials(selectedEvent.id)}
          message={message}
          onAdvance={
            ["Planejado", "Confirmado", "Em andamento"].includes(
              selectedEvent.status,
            )
              ? () => {
                  const next: Record<string, EventStatus> = {
                    Planejado: "Confirmado",
                    Confirmado: "Em andamento",
                    "Em andamento": "Concluido",
                  }

                  const result = updateEvent(selectedEvent.id, {
                    ...eventToForm(selectedEvent),
                    status: next[selectedEvent.status],
                  })

                  setMessage(
                    result.ok
                      ? ""
                      : (result.error ??
                          "Não foi possível atualizar o evento."),
                  )
                }
              : undefined
          }
          onClose={() => setModal(null)}
          onReceive={
            selectedEvent.billingType === "Separada" &&
            (getEventFinancials(selectedEvent.id)?.balance ?? 0) > 0
              ? () => {
                  setReceiptForm({
                    ...receiptForm,
                    value: String(
                      getEventFinancials(selectedEvent.id)?.balance ?? 0,
                    ),
                  })

                  setModal("event-receipt")
                }
              : undefined
          }
          reservationLabel={reservationLabel(
            reservations,
            selectedEvent.linkedReservationId,
          )}
        />
      )}
      {modal === "event-cancel" && selectedEvent && (
        <Modal
          title={`Cancelar ${selectedEvent.code}`}
          onClose={() => setModal(null)}
          footer={
            <>
              {message && <Alert type="error">{message}</Alert>}
              <FormActions>
                <Btn variant="ghost" onClick={() => setModal(null)}>
                  Voltar
                </Btn>
                <Btn
                  variant="danger"
                  confirmAction={false}
                  onClick={confirmCancel}
                >
                  Confirmar cancelamento
                </Btn>
              </FormActions>
            </>
          }
        >
          <Alert type="warning">
            O cancelamento libera a sala e encerra a cobrança pendente. O
            contrato e os recebimentos continuam no histórico.
          </Alert>
          <Textarea
            label="Motivo do cancelamento *"
            value={cancelForm.reason}
            onChange={(event) =>
              setCancelForm({ ...cancelForm, reason: event.target.value })
            }
          />
          {selectedEvent.billingType === "Vinculada a hospedagem" && (
            <Alert type="info">
              O valor do evento será retirado da fatura da hospedagem. Os
              pagamentos da hospedagem serão preservados. Confira na fatura se
              restou crédito para o hóspede.
            </Alert>
          )}
          {(getEventFinancials(selectedEvent.id)?.received ?? 0) > 0 && (
            <div className="management-stack">
              <Info
                label="Já recebido"
                value={formatMoney(
                  getEventFinancials(selectedEvent.id)?.received ?? 0,
                )}
              />
              <Select
                label="O que foi acordado com o contratante?"
                value={cancelForm.choice}
                onChange={(event) =>
                  setCancelForm({ ...cancelForm, choice: event.target.value })
                }
              >
                <option value="full">Devolver todo o valor recebido</option>
                <option value="partial">
                  Devolver uma parte e reter o restante
                </option>
                <option value="retain">
                  Reter todo o valor como taxa de cancelamento
                </option>
              </Select>
              {cancelForm.choice === "partial" && (
                <Input
                  label="Valor a devolver (R$) *"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={getEventFinancials(selectedEvent.id)?.received ?? 0}
                  value={cancelForm.refundValue}
                  onChange={(event) =>
                    setCancelForm({
                      ...cancelForm,
                      refundValue: event.target.value,
                    })
                  }
                />
              )}
              {cancelForm.choice !== "retain" && (
                <Select
                  label="Forma da devolução *"
                  value={cancelForm.refundMethod}
                  onChange={(event) =>
                    setCancelForm({
                      ...cancelForm,
                      refundMethod: event.target.value,
                    })
                  }
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </Select>
              )}
              <FormGrid cols={2}>
                <Info
                  label="Devolver ao contratante"
                  value={formatMoney(
                    cancelForm.choice === "full"
                      ? (getEventFinancials(selectedEvent.id)?.received ?? 0)
                      : cancelForm.choice === "retain"
                        ? 0
                        : Number(cancelForm.refundValue || 0),
                  )}
                />
                <Info
                  label="Valor retido"
                  value={formatMoney(
                    (getEventFinancials(selectedEvent.id)?.received ?? 0) -
                      (cancelForm.choice === "full"
                        ? (getEventFinancials(selectedEvent.id)?.received ?? 0)
                        : cancelForm.choice === "retain"
                          ? 0
                          : Number(cancelForm.refundValue || 0)),
                  )}
                />
              </FormGrid>
              <Textarea
                label="Justificativa do acordo *"
                value={cancelForm.treatment}
                onChange={(event) =>
                  setCancelForm({
                    ...cancelForm,
                    treatment: event.target.value,
                  })
                }
              />
              <Alert type="info">
                Confirme após realizar a devolução ao cliente. O sistema
                registra a saída financeira; não executa transferências
                bancárias. Devoluções em dinheiro exigem caixa aberto e saldo
                suficiente.
              </Alert>
            </div>
          )}
        </Modal>
      )}
      {modal === "event-receipt" && selectedEvent && (
        <Modal
          title={`Receber ${selectedEvent.code}`}
          onClose={() => setModal(null)}
          footer={
            <>
              {message && <Alert type="error">{message}</Alert>}
              <FormActions>
                <Btn variant="ghost" onClick={() => setModal(null)}>
                  Cancelar
                </Btn>
                <Btn onClick={saveReceipt}>Confirmar recebimento</Btn>
              </FormActions>
            </>
          }
        >
          <Alert type="info">
            Ao confirmar, este valor será registrado como entrada no Financeiro
            e aparecerá em Caixa.
          </Alert>
          <FormGrid cols={2}>
            <Input label="Evento" value={selectedEvent.name} readOnly />
            <Input
              label="Saldo pendente"
              value={formatMoney(
                getEventFinancials(selectedEvent.id)?.balance ?? 0,
              )}
              readOnly
            />
            <Input
              label="Valor"
              type="number"
              min="0.01"
              step="0.01"
              value={receiptForm.value}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, value: event.target.value })
              }
            />
            <Select
              label="Forma"
              value={receiptForm.method}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, method: event.target.value })
              }
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
            <Input
              label="Data"
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
                label="Observações"
                value={receiptForm.notes}
                onChange={(event) =>
                  setReceiptForm({ ...receiptForm, notes: event.target.value })
                }
              />
            </FullCol>
          </FormGrid>
        </Modal>
      )}

      {(modal === "room-new" || modal === "room-edit") && (
        <Modal
          title={
            modal === "room-new"
              ? "Cadastrar sala de conferencia"
              : "Atualizar sala"
          }
          onClose={() => setModal(null)}
          footer={
            <>
              {message && <Alert type="error">{message}</Alert>}
              <FormActions>
                <Btn variant="ghost" onClick={() => setModal(null)}>
                  Cancelar
                </Btn>
                <Btn onClick={saveRoom}>Salvar</Btn>
              </FormActions>
            </>
          }
        >
          <RoomForm form={roomForm} setForm={setRoomForm} />
        </Modal>
      )}
      {modal === "room-view" && selectedRoom && (
        <Modal
          title="Consultar sala"
          onClose={() => setModal(null)}
          footer={
            <>
              <FormActions>
                <Btn variant="ghost" onClick={() => setModal(null)}>
                  Fechar
                </Btn>
              </FormActions>
            </>
          }
        >
          <FormGrid cols={2}>
            <Info label="Nome" value={selectedRoom.name} />
            <Info label="Localização" value={selectedRoom.location} />
            <Info
              label="Capacidade"
              value={`${selectedRoom.capacity} pessoas`}
            />
            <Info label="Área" value={`${selectedRoom.area} m2`} />
            <Info
              label="Preco por hora"
              value={formatMoney(selectedRoom.hourlyRate)}
            />
            <Info
              label="Situação"
              value={<Badge label={selectedRoom.status} />}
            />
            <FullCol>
              <Info
                label="Recursos"
                value={selectedRoom.resources || "Nao informado"}
              />
            </FullCol>
          </FormGrid>
        </Modal>
      )}

      {(modal === "service-new" || modal === "service-edit") && (
        <Modal
          title={
            modal === "service-new"
              ? "Cadastrar servico de evento"
              : "Atualizar servico"
          }
          onClose={() => setModal(null)}
          footer={
            <>
              {message && <Alert type="error">{message}</Alert>}
              <FormActions>
                <Btn variant="ghost" onClick={() => setModal(null)}>
                  Cancelar
                </Btn>
                <Btn onClick={saveService}>Salvar</Btn>
              </FormActions>
            </>
          }
        >
          <ServiceForm form={serviceForm} setForm={setServiceForm} />
        </Modal>
      )}
      {modal === "service-view" && selectedService && (
        <Modal
          title="Consultar servico"
          onClose={() => setModal(null)}
          footer={
            <>
              <FormActions>
                <Btn variant="ghost" onClick={() => setModal(null)}>
                  Fechar
                </Btn>
              </FormActions>
            </>
          }
        >
          <FormGrid cols={2}>
            <Info label="Nome" value={selectedService.name} />
            <Info label="Categoria" value={selectedService.category} />
            <Info label="Unidade" value={selectedService.unit} />
            <Info label="Preço" value={formatMoney(selectedService.price)} />
            <Info
              label="Situação"
              value={<Badge label={selectedService.status} />}
            />
            <FullCol>
              <Info label="Descrição" value={selectedService.description} />
            </FullCol>
          </FormGrid>
        </Modal>
      )}
    </ManagementPage>
  )
}

function EventWizard({
  form,
  setForm,
  step,
  setStep,
  rooms,
  services,
  clients,
  eligibleStays,
  conflict,
  totals,
  onClose,
  onSave,
  message,
}: {
  form: EventInput

  setForm: (form: EventInput) => void

  step: EventStep

  setStep: (step: EventStep) => void

  rooms: ConferenceRoom[]

  services: EventService[]

  clients: {
    id: number

    name: string

    email: string

    phone: string

    status: string
  }[]

  eligibleStays: {
    stay: { code: string; reservationId: number }

    reservation?: { id: number; code: string; guest: string; status: string }
  }[]

  conflict: EventRecord | null

  totals: {
    roomValue: number

    servicesValue: number

    total: number

    duration: number
  }

  onClose: () => void

  onSave: () => void

  message: string
}) {
  const selectedClient = clients.find(
    (client) => client.id === form.contractorClientId,
  )

  const setRoom = (roomId: number) => {
    const room = rooms.find((item) => item.id === roomId)

    setForm({
      ...form,
      roomId,
      roomHourlyRateContracted: room?.hourlyRate ?? 0,
    })
  }

  const addService = (serviceId: number) => {
    const service = services.find((item) => item.id === serviceId)

    if (!service) return

    setForm({
      ...form,
      services: [
        ...form.services,
        serviceToLine(service, service.unit === "por pessoa" ? form.guests : 1),
      ],
    })
  }

  return (
    <Modal
      wide
      title="Cadastro de evento"
      onClose={onClose}
      footer={
        <>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn
              variant="ghost"
              onClick={
                step === 1 ? onClose : () => setStep((step - 1) as EventStep)
              }
            >
              {step === 1 ? "Cancelar" : "Anterior"}
            </Btn>
            {step < 6 ? (
              <Btn
                onClick={() => setStep((step + 1) as EventStep)}
                disabled={Boolean(conflict)}
              >
                Proximo
              </Btn>
            ) : (
              <Btn onClick={onSave} disabled={Boolean(conflict)}>
                Confirmar evento
              </Btn>
            )}
          </FormActions>
        </>
      }
    >
      <nav className="management-wizard" aria-label="Etapas do cadastro">
        {([
          "Evento e cliente",
          "Espaço e período",
          "Serviços",
          "Cronograma",
          "Cobrança",
          "Revisão",
        ] as const).map((label, index) => (
          <button
            key={label}
            type="button"
            aria-current={step === index + 1 ? "step" : undefined}
            onClick={() => setStep((index + 1) as EventStep)}
          >
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </nav>
      {step === 1 && (
        <FormGrid cols={2}>
          <FullCol>
            <SectionTitle>Dados do evento e contratante</SectionTitle>
          </FullCol>
          <Input
            label="Nome do evento"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(event) =>
              setForm({ ...form, type: event.target.value as EventType })
            }
          >
            <option>Corporativo</option>
            <option>Social</option>
          </Select>
          <Select
            label="Cliente cadastrado"
            value={form.contractorClientId ?? ""}
            onChange={(event) => {
              const client = clients.find(
                (item) => item.id === Number(event.target.value),
              )

              setForm({
                ...form,
                contractorClientId: client?.id,
                contractorName: client?.name ?? "",
                contact: client?.name ?? form.contact,
                email: client?.email ?? "",
                phone: client?.phone ?? "",
              })
            }}
          >
            <option value="">Contratante externo</option>
            {clients

              .filter((client) => client.status === "Ativo")

              .map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
          </Select>
          <Input
            label="Contratante"
            value={form.contractorName}
            readOnly={Boolean(selectedClient)}
            onChange={(event) =>
              setForm({ ...form, contractorName: event.target.value })
            }
          />
          <Input
            label="Contato"
            value={form.contact}
            onChange={(event) =>
              setForm({ ...form, contact: event.target.value })
            }
          />
          <Input
            label="Telefone"
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
          />
          <Input
            label="Participantes"
            type="number"
            min="1"
            value={form.guests}
            onChange={(event) =>
              setForm({ ...form, guests: Number(event.target.value) })
            }
          />
          <FullCol>
            <Textarea
              label="Observações"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </FullCol>
        </FormGrid>
      )}
      {step === 2 && (
        <FormGrid cols={2}>
          <FullCol>
            <SectionTitle>Espaço e agendamento</SectionTitle>
          </FullCol>
          <Select
            label="Sala"
            value={form.roomId || ""}
            onChange={(event) => setRoom(Number(event.target.value))}
          >
            <option value="">Selecione</option>
            {rooms.map((room) => (
              <option
                key={room.id}
                value={room.id}
                disabled={room.status !== "Ativo"}
              >
                {room.name} - {room.capacity} pessoas - {room.status}
              </option>
            ))}
          </Select>
          <Input
            label="Preco contratado por hora"
            type="number"
            min="0"
            step="0.01"
            value={form.roomHourlyRateContracted}
            onChange={(event) =>
              setForm({
                ...form,
                roomHourlyRateContracted: Number(event.target.value),
              })
            }
          />
          <Input
            label="Início"
            type="datetime-local"
            value={form.start}
            onChange={(event) =>
              setForm({ ...form, start: event.target.value })
            }
          />
          <Input
            label="Fim"
            type="datetime-local"
            value={form.end}
            onChange={(event) => setForm({ ...form, end: event.target.value })}
          />
          <Input
            label="Montagem antes do evento (minutos)"
            type="number"
            min="0"
            max="1440"
            step="1"
            value={form.setupMinutes ?? 0}
            onChange={(event) =>
              setForm({ ...form, setupMinutes: Number(event.target.value) })
            }
          />
          <Input
            label="Desmontagem após o evento (minutos)"
            type="number"
            min="0"
            max="1440"
            step="1"
            value={form.teardownMinutes ?? 0}
            onChange={(event) =>
              setForm({ ...form, teardownMinutes: Number(event.target.value) })
            }
          />
          <FullCol>
            <Alert type="info">
              A sala ficará bloqueada também durante a montagem e a desmontagem.
              Esses minutos não alteram o preço contratado do evento.
            </Alert>
          </FullCol>
          <Info
            label="Duração calculada"
            value={`${totals.duration.toFixed(1)} horas`}
          />
          <Info label="Valor do espaço" value={formatMoney(totals.roomValue)} />
          <FullCol>
            {conflict ? (
              <Alert type="error">
                Conflito com {conflict.code} - {conflict.name}. O sistema nao
                permitira salvar.
              </Alert>
            ) : (
              <Alert type="success">
                Sala disponivel no periodo informado.
              </Alert>
            )}
          </FullCol>
        </FormGrid>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <SectionTitle>Serviços contratados</SectionTitle>
          <FormGrid cols={2}>
            <Select
              label="Adicionar servico"
              value=""
              onChange={(event) =>
                event.target.value && addService(Number(event.target.value))
              }
            >
              <option value="">Selecione</option>
              {services

                .filter((service) => service.status === "Ativo")

                .map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {formatMoney(service.price)} {service.unit}
                  </option>
                ))}
            </Select>
            <Info
              label="Total dos servicos"
              value={formatMoney(totals.servicesValue)}
            />
          </FormGrid>
          <Table
            caption="Serviços da contratação"
            headers={[
              "Servico",
              "Unidade",
              "Quantidade",
              "Preco contratado",
              "Subtotal",
              "Acoes",
            ]}
            rows={form.services.map((line, index) => [
              line.serviceName,
              line.unit,
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={line.quantity}
                onChange={(event) =>
                  updateServiceLine(form, setForm, index, {
                    quantity: Number(event.target.value),
                  })
                }
              />,
              <Input
                type="number"
                min="0"
                step="0.01"
                value={line.contractedUnitPrice}
                onChange={(event) =>
                  updateServiceLine(form, setForm, index, {
                    contractedUnitPrice: Number(event.target.value),
                  })
                }
              />,
              formatMoney(lineSubtotal(line)),
              <Btn
                small
                variant="danger"
                confirmAction={false}
                onClick={() =>
                  setForm({
                    ...form,
                    services: form.services.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  })
                }
              >
                Excluir
              </Btn>,
            ])}
          />
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <SectionTitle>Cronograma</SectionTitle>
          <Table
            caption="Atividades do cronograma"
            headers={[
              "Horario",
              "Atividade",
              "Responsavel",
              "Observacoes",
              "Acoes",
            ]}
            rows={form.timeline.map((item, index) => [
              <Input
                type="time"
                value={item.time}
                onChange={(event) =>
                  updateTimeline(form, setForm, index, {
                    time: event.target.value,
                  })
                }
              />,
              <Input
                value={item.activity}
                onChange={(event) =>
                  updateTimeline(form, setForm, index, {
                    activity: event.target.value,
                  })
                }
              />,
              <Input
                value={item.responsible}
                onChange={(event) =>
                  updateTimeline(form, setForm, index, {
                    responsible: event.target.value,
                  })
                }
              />,
              <Input
                value={item.notes}
                onChange={(event) =>
                  updateTimeline(form, setForm, index, {
                    notes: event.target.value,
                  })
                }
              />,
              <Btn
                small
                variant="danger"
                confirmAction={false}
                onClick={() =>
                  setForm({
                    ...form,
                    timeline: form.timeline.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  })
                }
              >
                Excluir
              </Btn>,
            ])}
          />
          <Btn
            variant="secondary"
            onClick={() =>
              setForm({
                ...form,
                timeline: [...form.timeline, emptyTimeline()],
              })
            }
          >
            + Adicionar atividade
          </Btn>
        </div>
      )}
      {step === 5 && (
        <FormGrid cols={2}>
          <FullCol>
            <SectionTitle>Cobranca</SectionTitle>
          </FullCol>
          <Info label="Valor da sala" value={formatMoney(totals.roomValue)} />
          <Info
            label="Valor dos servicos"
            value={formatMoney(totals.servicesValue)}
          />
          <Input
            label="Desconto"
            type="number"
            min="0"
            step="0.01"
            value={form.discountValue}
            onChange={(event) =>
              setForm({ ...form, discountValue: Number(event.target.value) })
            }
          />
          <Info label="Total contratado" value={formatMoney(totals.total)} />
          <Select
            label="Forma de cobranca"
            value={form.billingType}
            onChange={(event) =>
              setForm({
                ...form,
                billingType: event.target.value as EventInput["billingType"],
                linkedReservationId: undefined,
              })
            }
          >
            <option>Separada</option>
            <option>Vinculada a hospedagem</option>
          </Select>
          {form.billingType === "Vinculada a hospedagem" && (
            <Select
              label="Hospedagem ativa"
              value={form.linkedReservationId ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  linkedReservationId: Number(event.target.value),
                })
              }
            >
              <option value="">Selecione</option>
              {eligibleStays.map(({ stay, reservation }) => (
                <option key={stay.reservationId} value={stay.reservationId}>
                  {reservation?.code} - {reservation?.guest} - {stay.code}
                </option>
              ))}
            </Select>
          )}
          {form.billingType === "Separada" && (
            <>
              <Select
                label="Exigir sinal para confirmar"
                value={form.depositRequired ? "sim" : "nao"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    depositRequired: event.target.value === "sim",
                  })
                }
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </Select>
              {form.depositRequired && (
                <Input
                  label="Sinal (%)"
                  type="number"
                  min="1"
                  max="100"
                  value={form.depositPercent ?? 0}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      depositPercent: Number(event.target.value),
                    })
                  }
                />
              )}
              <Input
                label="Vencimento do saldo"
                type="date"
                value={form.balanceDueDate ?? ""}
                onChange={(event) =>
                  setForm({ ...form, balanceDueDate: event.target.value })
                }
              />
              {form.depositRequired && (
                <Input
                  label="Vencimento do sinal"
                  type="date"
                  value={form.depositDueDate ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, depositDueDate: event.target.value })
                  }
                />
              )}
              <FullCol>
                <Textarea
                  label="Política de cancelamento e reembolso"
                  value={form.cancellationPolicy ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, cancellationPolicy: event.target.value })
                  }
                />
              </FullCol>
            </>
          )}
          <Info label="Valor recebido" value={formatMoney(0)} />
          <Info label="Saldo pendente" value={formatMoney(totals.total)} />
        </FormGrid>
      )}
      {step === 6 && (
        <div className="space-y-4">
          <SectionTitle>Revisão e confirmação</SectionTitle>
          <FormGrid cols={2}>
            <Info
              label="Contratante"
              value={form.contractorName || "Nao informado"}
            />
            <Info
              label="Sala"
              value={
                rooms.find((room) => room.id === form.roomId)?.name ??
                "Nao selecionada"
              }
            />
            <Info
              label="Período"
              value={`${formatDisplayDate(form.start)} ate ${formatDisplayDate(form.end)}`}
            />
            <Info label="Participantes" value={String(form.guests)} />
            <Info
              label="Servicos"
              value={
                form.services

                  .map(
                    (line) =>
                      `${line.serviceName} (${line.quantity} x ${formatMoney(line.contractedUnitPrice)})`,
                  )

                  .join(", ") || "Nenhum"
              }
            />
            <Info label="Total" value={formatMoney(totals.total)} />
            <FullCol>
              <Info label="Cobrança" value={form.billingType} />
            </FullCol>
            {form.billingType === "Separada" && form.depositRequired && (
              <>
                <Info
                  label="Sinal para confirmação"
                  value={`${form.depositPercent ?? 0}% (${formatMoney((totals.total * (form.depositPercent ?? 0)) / 100)})`}
                />
                <Info
                  label="Vencimentos"
                  value={`Sinal: ${formatDisplayDate(form.depositDueDate ?? "")} | Saldo: ${formatDisplayDate(form.balanceDueDate ?? "")}`}
                />
              </>
            )}
          </FormGrid>
          <Timeline items={form.timeline} />
        </div>
      )}
    </Modal>
  )
}

function AgendaView({
  events,
  rooms,
  date,
  setDate,
  view,
  setView,
  roomId,
  setRoomId,
  openEvent,
  startEvent,
}: {
  events: EventRecord[]

  rooms: ConferenceRoom[]

  date: string

  setDate: (date: string) => void

  view: "dia" | "semana"

  setView: (view: "dia" | "semana") => void

  roomId: string

  setRoomId: (roomId: string) => void

  openEvent: (event: EventRecord) => void

  startEvent: (roomId: number, start: string, end: string) => void
}) {
  const days = useMemo(
    () =>
      view === "dia"
        ? [date]
        : Array.from({ length: 7 }, (_, index) => {
            const item = new Date(`${date}T12:00`)

            item.setDate(item.getDate() + index)

            return item.toISOString().slice(0, 10)
          }),
    [date, view],
  )

  const displayRooms = rooms.filter(
    (room) => !roomId || room.id === Number(roomId),
  )

  const [fullDay, setFullDay] = useState(false)

  const hours = Array.from(
    { length: fullDay ? 24 : 16 },
    (_, index) => index + (fullDay ? 0 : 7),
  )

  return (
    <Card
      title="Agenda de espaços"
      description="Disponibilidade de salas, incluindo os períodos de montagem e desmontagem."
    >
      <div className="management-agenda-toolbar">
        <div className="management-agenda-legend">
          <span>
            <i />
            Disponível
          </span>
          <span>
            <i />
            Evento ou preparação
          </span>
        </div>
        <Btn small variant="secondary" onClick={() => setFullDay(!fullDay)}>
          {fullDay ? "Mostrar horário comercial" : "Mostrar as 24 horas"}
        </Btn>
      </div>
      <div className="management-filters management-filters--agenda">
        <FormGrid cols={3}>
          <Input
            label="Data inicial"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Select
            label="Visualização"
            value={view}
            onChange={(event) =>
              setView(event.target.value as "dia" | "semana")
            }
          >
            <option value="dia">Diaria</option>
            <option value="semana">Semanal</option>
          </Select>
          <Select
            label="Sala"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
          >
            <option value="">Todas</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </Select>
        </FormGrid>
      </div>
      <div className="management-stack">
        {displayRooms.map((room) => (
          <div key={room.id} className="management-agenda-room">
            <div className="management-agenda-room__heading">
              <strong>{room.name}</strong>
              <Badge label={room.status} />
            </div>
            <div
              className="management-agenda-grid"
              style={{
                gridTemplateColumns: `repeat(${days.length}, minmax(150px, 1fr))`,
                overflowX: "auto",
              }}
            >
              {days.map((day) => (
                <div key={day} className="management-agenda-day">
                  <p className="management-agenda-day__label">
                    {formatDisplayDate(day)}
                  </p>
                  {hours.map((hour) => {
                    const start = `${day}T${String(hour).padStart(2, "0")}:00`

                    const nextDay = new Date(`${day}T12:00`)

                    nextDay.setDate(nextDay.getDate() + 1)

                    const end =
                      hour === 23
                        ? `${nextDay.toISOString().slice(0, 10)}T00:00`
                        : `${day}T${String(hour + 1).padStart(2, "0")}:00`

                    const event = events.find(
                      (item) =>
                        item.roomId === room.id &&
                        item.status !== "Cancelado" &&
                        new Date(item.start).getTime() -
                          (item.setupMinutes ?? 0) * 60000 <
                          new Date(end).getTime() &&
                        new Date(item.end).getTime() +
                          (item.teardownMinutes ?? 0) * 60000 >
                          new Date(start).getTime(),
                    )

                    return (
                      <button
                        key={start}
                        type="button"
                        disabled={!event && room.status !== "Ativo"}
                        className={`management-agenda-slot ${
                          event ? "management-agenda-slot--booked" : ""
                        }`}
                        title={
                          event
                            ? `${event.name} · ${formatDisplayDate(event.start).replace("T", " ")} até ${formatDisplayDate(event.end).replace("T", " ")}`
                            : undefined
                        }
                        onClick={() =>
                          event
                            ? openEvent(event)
                            : startEvent(room.id, start, end)
                        }
                      >
                        <strong>{String(hour).padStart(2, "0")}:00</strong>{" "}
                        <span>
                          {event ? (
                            <>
                              <strong>{event.name}</strong>
                              <small>
                                {event.code} ·{" "}
                                {event.end <= start
                                  ? "Desmontagem"
                                  : event.start >= end
                                    ? "Montagem"
                                    : event.status}
                              </small>
                            </>
                          ) : room.status === "Ativo" ? (
                            "Disponível"
                          ) : (
                            "Sala inativa"
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function RoomForm({
  form,
  setForm,
}: {
  form: ConferenceRoomInput

  setForm: (form: ConferenceRoomInput) => void
}) {
  return (
    <FormGrid cols={2}>
      <Input
        label="Nome"
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
      />
      <Input
        label="Localização"
        value={form.location}
        onChange={(event) => setForm({ ...form, location: event.target.value })}
      />
      <Input
        label="Capacidade"
        type="number"
        min="1"
        value={form.capacity}
        onChange={(event) =>
          setForm({ ...form, capacity: Number(event.target.value) })
        }
      />
      <Input
        label="Área"
        type="number"
        min="0"
        value={form.area}
        onChange={(event) =>
          setForm({ ...form, area: Number(event.target.value) })
        }
      />
      <Input
        label="Preco por hora"
        type="number"
        min="0"
        step="0.01"
        value={form.hourlyRate}
        onChange={(event) =>
          setForm({ ...form, hourlyRate: Number(event.target.value) })
        }
      />
      <FullCol>
        <Textarea
          label="Recursos disponiveis"
          value={form.resources}
          onChange={(event) =>
            setForm({ ...form, resources: event.target.value })
          }
        />
      </FullCol>
    </FormGrid>
  )
}

function ServiceForm({
  form,
  setForm,
}: {
  form: EventServiceInput

  setForm: (form: EventServiceInput) => void
}) {
  return (
    <FormGrid cols={2}>
      <Input
        label="Nome"
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
      />
      <Select
        label="Categoria"
        value={form.category}
        onChange={(event) => setForm({ ...form, category: event.target.value })}
      >
        <option>Coffee break</option>
        <option>Equipamentos</option>
        <option>Decoracao</option>
        <option>Equipe de apoio</option>
        <option>Outros</option>
      </Select>
      <Select
        label="Unidade de cobranca"
        value={form.unit}
        onChange={(event) => setForm({ ...form, unit: event.target.value })}
      >
        <option>por evento</option>
        <option>por pessoa</option>
        <option>por hora</option>
        <option>por diaria</option>
      </Select>
      <Input
        label="Preço"
        type="number"
        min="0"
        step="0.01"
        value={form.price}
        onChange={(event) =>
          setForm({ ...form, price: Number(event.target.value) })
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
  )
}

function EventDetails({
  event,
  receipts,
  financials,
  reservationLabel,
  onClose,
  onReceive,
  onAdvance,
  message,
}: {
  event: EventRecord

  receipts: {
    code: string

    date: string

    value: number

    method: string

    status: string
  }[]

  financials: EventFinancials | null

  reservationLabel: string

  onClose: () => void

  onReceive?: () => void

  onAdvance?: () => void

  message?: string
}) {
  const depositValue = event.depositRequired
    ? (event.totalContracted * (event.depositPercent ?? 0)) / 100
    : 0

  const depositReceived = financials?.received ?? 0

  return (
    <Modal
      wide
      title={`${event.code} - ${event.name}`}
      onClose={onClose}
      footer={
        <>
          {message && <Alert type="error">{message}</Alert>}
          <FormActions>
            <Btn variant="ghost" onClick={onClose}>
              Fechar
            </Btn>
            {onReceive && <Btn onClick={onReceive}>Receber saldo</Btn>}
            {onAdvance && (
              <Btn onClick={onAdvance}>
                {event.status === "Planejado"
                  ? "Confirmar evento"
                  : event.status === "Confirmado"
                    ? "Iniciar evento"
                    : "Concluir evento"}
              </Btn>
            )}
            <Btn
              variant="secondary"
              onClick={() =>
                printDocument(`Ordem de serviço · ${event.code}`, [
                  {
                    title: event.name,
                    headers: ["Informação", "Detalhe"],
                    rows: [
                      ["Situação", event.status],
                      ["Contratante", event.contractorName],
                      [
                        "Contato",
                        `${event.contact} · ${event.phone || event.email}`,
                      ],
                      ["Sala", event.roomName],
                      ["Início", formatDisplayDate(event.start)],
                      ["Fim", formatDisplayDate(event.end)],
                      [
                        "Montagem / desmontagem",
                        `${event.setupMinutes ?? 0} min antes / ${event.teardownMinutes ?? 0} min depois`,
                      ],
                      ["Participantes", String(event.guests)],
                      ["Observações", event.notes || "—"],
                    ],
                  },
                  {
                    title: "Serviços contratados",
                    headers: ["Serviço", "Quantidade", "Unidade"],
                    rows: event.services.map((line) => [
                      line.serviceName,
                      String(line.quantity),
                      line.unit,
                    ]),
                  },
                  {
                    title: "Cronograma e responsáveis",
                    headers: [
                      "Horário",
                      "Atividade",
                      "Responsável",
                      "Observações",
                    ],
                    rows: event.timeline.map((item) => [
                      item.time,
                      item.activity,
                      item.responsible,
                      item.notes,
                    ]),
                  },
                ])
              }
            >
              Imprimir ordem de serviço
            </Btn>
          </FormActions>
        </>
      }
    >
      <div className="management-stack">
        <SectionTitle>Resumo financeiro</SectionTitle>
        <div className="management-financial-summary">
          <Info
            label="Valor da sala"
            value={formatMoney(event.roomValueContracted)}
          />
          <Info
            label="Valor dos servicos"
            value={formatMoney(event.servicesValueContracted)}
          />
          <Info
            label="Total contratado"
            value={formatMoney(event.totalContracted)}
          />
          <Info
            label="Recebido"
            value={
              event.billingType === "Vinculada a hospedagem"
                ? "Pagamento na fatura conjunta"
                : formatMoney(financials?.received ?? 0)
            }
          />
          <Info
            label={
              event.billingType === "Vinculada a hospedagem"
                ? "Saldo total da hospedagem"
                : "Saldo pendente do evento"
            }
            value={
              event.billingType === "Vinculada a hospedagem"
                ? financials?.linkedBalance === undefined
                  ? "Consultar fatura da hospedagem"
                  : formatMoney(financials.linkedBalance)
                : formatMoney(financials?.balance ?? event.totalContracted)
            }
          />
          <Info
            label="Situacao financeira"
            value={financials?.status ?? "Pendente"}
          />
        </div>
        <SectionTitle>Dados do evento e contratação</SectionTitle>
        <FormGrid cols={2}>
          <Info label="Situação" value={<Badge label={event.status} />} />
          <Info label="Tipo" value={event.type} />
          <Info label="Contratante" value={event.contractorName} />
          <Info
            label="Contato"
            value={`${event.contact} - ${event.phone || event.email || "sem contato"}`}
          />
          <Info label="Sala" value={event.roomName} />
          <Info
            label="Período"
            value={`${formatDisplayDate(event.start)} ate ${formatDisplayDate(event.end)}`}
          />
          <Info
            label="Montagem / desmontagem"
            value={`${event.setupMinutes ?? 0} min antes / ${event.teardownMinutes ?? 0} min depois`}
          />
          <Info label="Participantes" value={String(event.guests)} />
          <Info
            label="Cobrança"
            value={
              event.billingType === "Vinculada a hospedagem"
                ? `${event.billingType}: ${reservationLabel}`
                : event.billingType
            }
          />
          {event.billingType === "Separada" && event.depositRequired && (
            <>
              <Info
                label="Sinal para confirmação"
                value={`${event.depositPercent ?? 0}% — ${formatMoney(depositValue)}`}
              />
              <Info
                label="Situação do sinal"
                value={
                  depositReceived + 0.009 >= depositValue
                    ? "Sinal recebido"
                    : `Pendente — recebido ${formatMoney(depositReceived)}`
                }
              />
              <Info
                label="Vencimento do sinal"
                value={formatDisplayDate(event.depositDueDate ?? "")}
              />
              <Info
                label="Vencimento do saldo"
                value={formatDisplayDate(event.balanceDueDate ?? "")}
              />
            </>
          )}
        </FormGrid>
        {event.billingType === "Separada" && event.cancellationPolicy && (
          <Alert type="info">
            Política de cancelamento: {event.cancellationPolicy}
          </Alert>
        )}
        <SectionTitle>Serviços contratados</SectionTitle>
        <Table
          caption="Serviços contratados do evento"
          headers={[
            "Servico",
            "Categoria",
            "Quantidade",
            "Unidade",
            "Preco contratado",
            "Subtotal",
          ]}
          rows={event.services.map((line) => [
            line.serviceName,
            line.category,
            String(line.quantity),
            line.unit,
            formatMoney(line.contractedUnitPrice),
            formatMoney(line.subtotal),
          ])}
        />
        <SectionTitle>Cronograma</SectionTitle>
        <Timeline items={event.timeline} />

        {event.status === "Cancelado" ? (
          <Alert type="info">
            Evento cancelado. A cobrança pendente foi encerrada e o histórico
            foi preservado.
          </Alert>
        ) : event.billingType === "Separada" ? (
          <Alert type="info">
            Use Receber para registrar o pagamento. A confirmação gera uma
            entrada no Caixa.
          </Alert>
        ) : (
          <Alert type="info">
            Este evento está vinculado à hospedagem {reservationLabel}; o
            pagamento é registrado na fatura conjunta. Recebimentos da
            hospedagem não são atribuídos individualmente a este evento.
          </Alert>
        )}
        {receipts.length > 0 && (
          <Table
            caption="Recebimentos do evento"
            headers={["Codigo", "Data", "Valor", "Forma", "Status"]}
            rows={receipts.map((receipt) => [
              receipt.code,
              receipt.date,
              formatMoney(receipt.value),
              receipt.method,
              receipt.status,
            ])}
          />
        )}
        {event.financialNotes && (
          <Alert type="info">Historico: {event.financialNotes}</Alert>
        )}
        {event.cancellation && (
          <FormGrid cols={3}>
            <Info
              label="Recebido antes do cancelamento"
              value={formatMoney(event.cancellation.received)}
            />
            <Info
              label="Devolvido"
              value={formatMoney(event.cancellation.refunded)}
            />
            <Info
              label="Retido como taxa"
              value={formatMoney(event.cancellation.retained)}
            />
          </FormGrid>
        )}
      </div>
    </Modal>
  )
}

function Timeline({ items }: { items: EventTimelineItem[] }) {
  return (
    <div className="management-timeline">
      {[...items]
        .sort((first, second) => first.time.localeCompare(second.time))
        .map((item) => (
          <div key={item.id} className="management-timeline__item">
            <time>{item.time}</time>
            <div>
              <strong>{item.activity}</strong>
              <p>
                {item.responsible}
                {item.notes ? ` — ${item.notes}` : ""}
              </p>
            </div>
          </div>
        ))}
    </div>
  )
}

function updateServiceLine(
  form: EventInput,
  setForm: (form: EventInput) => void,
  index: number,
  patch: Partial<ContractedEventService>,
) {
  setForm({
    ...form,
    services: form.services.map((line, itemIndex) =>
      itemIndex === index ? { ...line, ...patch } : line,
    ),
  })
}

function updateTimeline(
  form: EventInput,
  setForm: (form: EventInput) => void,
  index: number,
  patch: Partial<EventTimelineItem>,
) {
  setForm({
    ...form,
    timeline: form.timeline.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    ),
  })
}

function reservationLabel(
  reservations: { id: number; code: string; guest: string }[],
  reservationId?: number,
) {
  const reservation = reservations.find((item) => item.id === reservationId)

  return reservation
    ? `${reservation.code} - ${reservation.guest}`
    : "Nao vinculada"
}
