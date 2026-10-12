import { useEffect, useMemo, useState } from "react";
import { useAccessControl } from "../../access-control";
import { findRoomScheduleConflict, validateTimelineTimes } from "../../domain/event-rules";
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
  type EventService,
  type EventServiceInput,
  type EventStatus,
  type EventTimelineItem,
  type EventType,
} from "../HotelOperationsContext";
import { useDemoEngine } from "../demo/DemoEngineContext";
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
  SectionTitle,
  Select,
  Table,
  Tabs,
  Textarea,
  formatDisplayDate,
} from "../ui";

type Tab = "agenda" | "eventos" | "salas" | "servicos";
type ModalMode = "event-new" | "event-edit" | "event-view" | "event-cancel" | "event-receipt" | "room-new" | "room-edit" | "room-view" | "service-new" | "service-edit" | "service-view" | null;
type EventStep = 1 | 2 | 3 | 4 | 5 | 6;

const eventStatuses: EventStatus[] = ["Planejado", "Confirmado", "Em andamento", "Concluido", "Cancelado"];
const paymentMethods = PAYMENT_METHODS.map((method) => ({ value: method.id, label: method.label }));

const emptyTimeline = (): EventTimelineItem => ({ id: Date.now(), time: "08:00", activity: "", responsible: "", notes: "" });
const emptyRoom = (): ConferenceRoomInput => ({ name: "", location: "", capacity: 0, area: 0, hourlyRate: 0, resources: "" });
const emptyService = (): EventServiceInput => ({ name: "", category: "Coffee break", description: "", unit: "por evento", price: 0 });

function localDateTime(days: number, time: string) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.toISOString().slice(0, 10)}T${time}`;
}

function emptyEvent(room?: ConferenceRoom, services: EventService[] = []): EventInput {
  const start = localDateTime(10, "08:00");
  const end = localDateTime(10, "12:00");
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
    services: services.slice(0, 0).map(serviceToLine),
    discountValue: 0,
    billingType: "Separada",
    linkedReservationId: undefined,
    status: "Planejado",
    timeline: [
      { id: 1, time: "08:00", activity: "Preparacao da sala", responsible: "Equipe de eventos", notes: "" },
      { id: 2, time: "08:30", activity: "Credenciamento", responsible: "Recepcao", notes: "" },
      { id: 3, time: "09:00", activity: "Abertura", responsible: "Contratante", notes: "" },
      { id: 4, time: "12:00", activity: "Encerramento", responsible: "Contratante", notes: "" },
    ],
  };
}

function serviceToLine(service: EventService, quantity = 1): ContractedEventService {
  return {
    id: Date.now() + Math.round(Math.random() * 1000),
    serviceId: service.id,
    serviceName: service.name,
    category: service.category,
    unit: service.unit,
    quantity,
    contractedUnitPrice: service.price,
    subtotal: quantity * service.price,
  };
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
    services: event.services,
    discountValue: event.discountValue,
    billingType: event.billingType,
    linkedReservationId: event.linkedReservationId,
    status: event.status,
    timeline: event.timeline,
  };
}

function durationHours(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Number.isFinite(ms) ? Math.max(0, ms / 3600000) : 0;
}

function lineSubtotal(line: ContractedEventService) {
  return Math.round(line.quantity * line.contractedUnitPrice * 100) / 100;
}

function formTotals(form: EventInput) {
  const roomValue = Math.round(durationHours(form.start, form.end) * form.roomHourlyRateContracted * 100) / 100;
  const servicesValue = Math.round(form.services.reduce((total, line) => total + lineSubtotal(line), 0) * 100) / 100;
  const total = Math.max(0, roomValue + servicesValue - Number(form.discountValue || 0));
  return { roomValue, servicesValue, total, duration: durationHours(form.start, form.end) };
}

export default function Eventos() {
  const { activeAccount, registerLog } = useAccessControl();
  const demo = useDemoEngine();
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
  } = useHotelOperations();

  const [tab, setTab] = useState<Tab>("agenda");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [eventStep, setEventStep] = useState<EventStep>(1);
  const [eventForm, setEventForm] = useState<EventInput>(() => emptyEvent(conferenceRooms.find((room) => room.status === "Ativo")));
  const [roomForm, setRoomForm] = useState<ConferenceRoomInput>(emptyRoom);
  const [serviceForm, setServiceForm] = useState<EventServiceInput>(emptyService);
  const [filters, setFilters] = useState({ search: "", status: "", type: "", roomId: "", from: "", to: "" });
  const [agendaDate, setAgendaDate] = useState(today());
  const [agendaView, setAgendaView] = useState<"dia" | "semana">("dia");
  const [agendaRoomId, setAgendaRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [cancelForm, setCancelForm] = useState({ reason: "", treatment: "" });
  const [receiptForm, setReceiptForm] = useState({ value: "", method: "pix", responsible: activeAccount?.name ?? "Eventos", notes: "", date: today() });

  const selectedEvent = events.find((event) => event.id === selectedId) ?? null;
  const selectedRoom = conferenceRooms.find((room) => room.id === selectedId) ?? null;
  const selectedService = eventServices.find((service) => service.id === selectedId) ?? null;
  const activeRooms = conferenceRooms.filter((room) => room.status === "Ativo");
  const activeServices = eventServices.filter((service) => service.status === "Ativo");
  const formRoom = conferenceRooms.find((room) => room.id === eventForm.roomId);
  const totals = formTotals(eventForm);
  const conflict = eventForm.roomId && eventForm.start && eventForm.end
    ? findRoomScheduleConflict(events, eventForm.roomId, eventForm.start, eventForm.end, modal === "event-edit" ? selectedId : undefined)
    : null;
  const eligibleStays = stays.filter((stay) => stay.status === "Ativa").map((stay) => ({
    stay,
    reservation: reservations.find((reservation) => reservation.id === stay.reservationId),
  })).filter((item) => item.reservation);

  useEffect(() => {
    const command = demo.activeCommand;
    if (!command || command.target !== "eventos") return;
    if (command.command === "prefill-event-form") {
      openNewEvent();
      const room = conferenceRooms.find((item) => item.name === "Sala A") ?? activeRooms[0];
      const coffee = eventServices.find((item) => item.name.toLowerCase().includes("coffee"));
      const projector = eventServices.find((item) => item.name.toLowerCase().includes("projetor"));
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
        services: [coffee, projector].filter((item): item is EventService => Boolean(item)).map((service) => serviceToLine(service, service.name.toLowerCase().includes("coffee") ? 30 : 1)),
      });
      demo.resolveCommand(command.id, { status: "running", message: "Formulario de evento preenchido para a jornada administrativa." });
    }
  }, [demo.activeCommand]);

  const actor = activeAccount ? { id: activeAccount.id, name: activeAccount.name } : undefined;
  const roomName = (id: number) => conferenceRooms.find((room) => room.id === id)?.name ?? "Sala historica";

  const filteredEvents = events.filter((event) => {
    const query = filters.search.trim().toLowerCase();
    return (!query || `${event.code} ${event.name} ${event.contractorName}`.toLowerCase().includes(query)) &&
      (!filters.status || event.status === filters.status) &&
      (!filters.type || event.type === filters.type) &&
      (!filters.roomId || event.roomId === Number(filters.roomId)) &&
      (!filters.from || event.start.slice(0, 10) >= filters.from) &&
      (!filters.to || event.start.slice(0, 10) <= filters.to);
  });

  const metrics = {
    future: events.filter((event) => event.status !== "Cancelado" && event.start >= new Date().toISOString().slice(0, 16)).length,
    confirmed: events.filter((event) => event.status === "Confirmado").length,
    availableRooms: activeRooms.filter((room) => !findRoomScheduleConflict(events, room.id, `${agendaDate}T08:00`, `${agendaDate}T18:00`)).length,
    contracted: filteredEvents.filter((event) => event.status !== "Cancelado").reduce((total, event) => total + event.totalContracted, 0),
  };

  const openNewEvent = () => {
    setSelectedId(null);
    setEventStep(1);
    setMessage("");
    setEventForm(emptyEvent(activeRooms[0], activeServices));
    setModal("event-new");
  };

  const openEditEvent = (event: EventRecord) => {
    setSelectedId(event.id);
    setEventForm(eventToForm(event));
    setEventStep(1);
    setMessage("");
    setModal("event-edit");
  };

  const saveEvent = () => {
    setMessage("");
    const timelineValidation = validateTimelineTimes(eventForm.timeline.map((item) => item.time), eventForm.start, eventForm.end);
    if (!timelineValidation.ok) {
      setMessage(timelineValidation.error ?? "Cronograma invalido.");
      return;
    }
    const result = modal === "event-edit" && selectedEvent ? updateEvent(selectedEvent.id, eventForm) : createEvent(eventForm);
    if (!result.ok) {
      setMessage(result.error ?? "Nao foi possivel salvar o evento.");
      return;
    }
    registerLog(modal === "event-edit" ? "Evento atualizado" : "Evento cadastrado", "Eventos", eventForm.name, "Sucesso", actor);
    setModal(null);
    setTab("eventos");
  };

  const saveRoom = () => {
    const result = modal === "room-edit" && selectedRoom ? updateConferenceRoom(selectedRoom.id, roomForm) : createConferenceRoom(roomForm);
    if (!result.ok) setMessage(result.error ?? "Nao foi possivel salvar a sala.");
    else {
      registerLog(modal === "room-edit" ? "Sala atualizada" : "Sala cadastrada", "Eventos", roomForm.name, "Sucesso", actor);
      setModal(null);
    }
  };

  const saveService = () => {
    const result = modal === "service-edit" && selectedService ? updateEventService(selectedService.id, serviceForm) : createEventService(serviceForm);
    if (!result.ok) setMessage(result.error ?? "Nao foi possivel salvar o servico.");
    else {
      registerLog(modal === "service-edit" ? "Servico atualizado" : "Servico cadastrado", "Eventos", serviceForm.name, "Sucesso", actor);
      setModal(null);
    }
  };

  const confirmCancel = () => {
    if (!selectedEvent) return;
    const result = cancelEvent(selectedEvent.id, cancelForm);
    if (!result.ok) setMessage(result.error ?? "Nao foi possivel cancelar.");
    else {
      registerLog("Evento cancelado", "Eventos", selectedEvent.code, "Sucesso", actor);
      setModal(null);
    }
  };

  const saveReceipt = () => {
    if (!selectedEvent) return;
    const result = registerEventReceipt({ eventId: selectedEvent.id, value: Number(receiptForm.value), method: receiptForm.method, responsible: receiptForm.responsible, notes: receiptForm.notes, date: receiptForm.date, operationKey: `event-receipt-${Date.now()}` });
    if (!result.ok) setMessage(result.error ?? "Nao foi possivel registrar o recebimento.");
    else setModal(null);
  };

  return <div className="ops-page">
    <PageHeader title="Eventos" actions={<Btn onClick={openNewEvent}>+ Novo Evento</Btn>} />
    {message && <Alert type={message.includes("Nao") || message.includes("Conflito") || message.includes("invalido") ? "error" : "success"}>{message}</Alert>}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Metric label="Eventos futuros" value={String(metrics.future)} />
      <Metric label="Confirmados" value={String(metrics.confirmed)} />
      <Metric label="Salas livres no dia" value={String(metrics.availableRooms)} />
      <Metric label="Valor contratado" value={formatMoney(metrics.contracted)} />
    </div>

    <Tabs tabs={[
      { id: "agenda", label: "Agenda" },
      { id: "eventos", label: "Eventos" },
      { id: "salas", label: "Salas" },
      { id: "servicos", label: "Servicos" },
    ]} active={tab} onChange={setTab} />

    {tab === "agenda" && <AgendaView
      events={events}
      rooms={conferenceRooms}
      date={agendaDate}
      setDate={setAgendaDate}
      view={agendaView}
      setView={setAgendaView}
      roomId={agendaRoomId}
      setRoomId={setAgendaRoomId}
      openEvent={(event) => { setSelectedId(event.id); setModal("event-view"); }}
      startEvent={(roomId, start, end) => { const room = conferenceRooms.find((item) => item.id === roomId); setEventForm({ ...emptyEvent(room), roomId, start, end, roomHourlyRateContracted: room?.hourlyRate ?? 0 }); setEventStep(1); setModal("event-new"); }}
    />}

    {tab === "eventos" && <Card>
      <FormGrid cols={3}>
        <Input label="Buscar" placeholder="Codigo, evento ou contratante" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <Select label="Sala" value={filters.roomId} onChange={(event) => setFilters({ ...filters, roomId: event.target.value })}><option value="">Todas</option>{conferenceRooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</Select>
        <Select label="Situacao" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todas</option>{eventStatuses.map((status) => <option key={status}>{status}</option>)}</Select>
        <Select label="Tipo" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Todos</option><option>Corporativo</option><option>Social</option></Select>
        <Input label="De" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        <Input label="Ate" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
      </FormGrid>
      <Table headers={["Codigo", "Nome", "Tipo", "Contratante", "Sala", "Data", "Horario", "Participantes", "Valor contratado", "Situacao", "Acoes"]} rows={filteredEvents.map((event) => [
        event.code,
        event.name,
        event.type,
        event.contractorName,
        event.roomName || roomName(event.roomId),
        event.start.slice(0, 10),
        `${event.start.slice(11, 16)}-${event.end.slice(11, 16)}`,
        String(event.guests),
        formatMoney(event.totalContracted),
        <Badge label={event.status} />,
        <div className="table-actions">
          <Btn small variant="ghost" onClick={() => { setSelectedId(event.id); setModal("event-view"); }}>Consultar</Btn>
          {!["Cancelado", "Concluido"].includes(event.status) && <Btn small variant="ghost" onClick={() => openEditEvent(event)}>Atualizar</Btn>}
          {event.billingType === "Separada" && (getEventFinancials(event.id)?.balance ?? 0) > 0 && <Btn small variant="secondary" onClick={() => { setSelectedId(event.id); setReceiptForm({ ...receiptForm, value: String(getEventFinancials(event.id)?.balance ?? 0) }); setModal("event-receipt"); }}>Receber</Btn>}
          {!["Cancelado", "Concluido"].includes(event.status) && <Btn small variant="danger" onClick={() => { setSelectedId(event.id); setCancelForm({ reason: "", treatment: "" }); setModal("event-cancel"); }}>Cancelar</Btn>}
        </div>,
      ])} />
    </Card>}

    {tab === "salas" && <Card>
      <div className="mb-4 flex justify-end"><Btn onClick={() => { setSelectedId(null); setRoomForm(emptyRoom()); setModal("room-new"); }}>+ Nova Sala</Btn></div>
      <Table headers={["Nome", "Localizacao", "Capacidade", "Area", "Recursos", "Preco por hora", "Situacao", "Acoes"]} rows={conferenceRooms.map((room) => [
        room.name,
        room.location,
        `${room.capacity} pessoas`,
        `${room.area} m2`,
        room.resources || "Nao informado",
        formatMoney(room.hourlyRate),
        <Badge label={room.status} />,
        <div className="table-actions"><Btn small variant="ghost" onClick={() => { setSelectedId(room.id); setModal("room-view"); }}>Consultar</Btn>{room.status === "Ativo" && <><Btn small variant="ghost" onClick={() => { setSelectedId(room.id); setRoomForm({ name: room.name, location: room.location, capacity: room.capacity, area: room.area, hourlyRate: room.hourlyRate, resources: room.resources }); setModal("room-edit"); }}>Atualizar</Btn><Btn small variant="danger" onClick={() => { const result = inactivateConferenceRoom(room.id); setMessage(result.ok ? `${room.name} inativada.` : result.error ?? "Nao foi possivel inativar."); }}>Inativar</Btn></>}</div>,
      ])} />
    </Card>}

    {tab === "servicos" && <Card>
      <div className="mb-4 flex justify-end"><Btn onClick={() => { setSelectedId(null); setServiceForm(emptyService()); setModal("service-new"); }}>+ Novo Servico</Btn></div>
      <Table headers={["Nome", "Categoria", "Descricao", "Unidade", "Preco", "Situacao", "Acoes"]} rows={eventServices.map((service) => [
        service.name,
        service.category,
        service.description,
        service.unit,
        formatMoney(service.price),
        <Badge label={service.status} />,
        <div className="table-actions"><Btn small variant="ghost" onClick={() => { setSelectedId(service.id); setModal("service-view"); }}>Consultar</Btn>{service.status === "Ativo" && <><Btn small variant="ghost" onClick={() => { setSelectedId(service.id); setServiceForm({ name: service.name, category: service.category, description: service.description, unit: service.unit, price: service.price }); setModal("service-edit"); }}>Atualizar</Btn><Btn small variant="danger" onClick={() => { const result = inactivateEventService(service.id); setMessage(result.ok ? `${service.name} inativado.` : result.error ?? "Nao foi possivel inativar."); }}>Inativar</Btn></>}</div>,
      ])} />
    </Card>}

    {(modal === "event-new" || modal === "event-edit") && <EventWizard
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
    />}

    {modal === "event-view" && selectedEvent && <EventDetails event={selectedEvent} receipts={eventReceipts.filter((receipt) => receipt.eventId === selectedEvent.id)} financials={getEventFinancials(selectedEvent.id)} onClose={() => setModal(null)} reservationLabel={reservationLabel(reservations, selectedEvent.linkedReservationId)} />}
    {modal === "event-cancel" && selectedEvent && <Modal title={`Cancelar ${selectedEvent.code}`} onClose={() => setModal(null)}>
      <Alert type="warning">O cancelamento libera a agenda, mas preserva o historico e os recebimentos. Se houver pagamento, registre o tratamento financeiro adotado.</Alert>
      <Textarea label="Motivo" value={cancelForm.reason} onChange={(event) => setCancelForm({ ...cancelForm, reason: event.target.value })} />
      {(getEventFinancials(selectedEvent.id)?.received ?? 0) > 0 && <Textarea label="Tratamento financeiro" value={cancelForm.treatment} onChange={(event) => setCancelForm({ ...cancelForm, treatment: event.target.value })} />}
      {message && <Alert type="error">{message}</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Voltar</Btn><Btn variant="danger" onClick={confirmCancel}>Confirmar cancelamento</Btn></FormActions>
    </Modal>}
    {modal === "event-receipt" && selectedEvent && <Modal title={`Receber ${selectedEvent.code}`} onClose={() => setModal(null)}>
      <FormGrid cols={2}>
        <Input label="Evento" value={selectedEvent.name} readOnly />
        <Input label="Saldo pendente" value={formatMoney(getEventFinancials(selectedEvent.id)?.balance ?? 0)} readOnly />
        <Input label="Valor" type="number" min="0.01" step="0.01" value={receiptForm.value} onChange={(event) => setReceiptForm({ ...receiptForm, value: event.target.value })} />
        <Select label="Forma" value={receiptForm.method} onChange={(event) => setReceiptForm({ ...receiptForm, method: event.target.value })}>{paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</Select>
        <Input label="Data" type="date" value={receiptForm.date} onChange={(event) => setReceiptForm({ ...receiptForm, date: event.target.value })} />
        <Input label="Responsavel" value={receiptForm.responsible} onChange={(event) => setReceiptForm({ ...receiptForm, responsible: event.target.value })} />
        <FullCol><Textarea label="Observacoes" value={receiptForm.notes} onChange={(event) => setReceiptForm({ ...receiptForm, notes: event.target.value })} /></FullCol>
      </FormGrid>
      {message && <Alert type="error">{message}</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={saveReceipt}>Confirmar recebimento</Btn></FormActions>
    </Modal>}

    {(modal === "room-new" || modal === "room-edit") && <Modal title={modal === "room-new" ? "Cadastrar sala de conferencia" : "Atualizar sala"} onClose={() => setModal(null)}>
      <RoomForm form={roomForm} setForm={setRoomForm} />
      {message && <Alert type="error">{message}</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={saveRoom}>Salvar</Btn></FormActions>
    </Modal>}
    {modal === "room-view" && selectedRoom && <Modal title="Consultar sala" onClose={() => setModal(null)}><FormGrid cols={2}><Info label="Nome" value={selectedRoom.name} /><Info label="Localizacao" value={selectedRoom.location} /><Info label="Capacidade" value={`${selectedRoom.capacity} pessoas`} /><Info label="Area" value={`${selectedRoom.area} m2`} /><Info label="Preco por hora" value={formatMoney(selectedRoom.hourlyRate)} /><Info label="Situacao" value={selectedRoom.status} /><FullCol><Info label="Recursos" value={selectedRoom.resources || "Nao informado"} /></FullCol></FormGrid><FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn></FormActions></Modal>}

    {(modal === "service-new" || modal === "service-edit") && <Modal title={modal === "service-new" ? "Cadastrar servico de evento" : "Atualizar servico"} onClose={() => setModal(null)}>
      <ServiceForm form={serviceForm} setForm={setServiceForm} />
      {message && <Alert type="error">{message}</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={saveService}>Salvar</Btn></FormActions>
    </Modal>}
    {modal === "service-view" && selectedService && <Modal title="Consultar servico" onClose={() => setModal(null)}><FormGrid cols={2}><Info label="Nome" value={selectedService.name} /><Info label="Categoria" value={selectedService.category} /><Info label="Unidade" value={selectedService.unit} /><Info label="Preco" value={formatMoney(selectedService.price)} /><Info label="Situacao" value={selectedService.status} /><FullCol><Info label="Descricao" value={selectedService.description} /></FullCol></FormGrid><FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn></FormActions></Modal>}
  </div>;
}

function EventWizard({ form, setForm, step, setStep, rooms, services, clients, eligibleStays, conflict, totals, onClose, onSave, message }: {
  form: EventInput;
  setForm: (form: EventInput) => void;
  step: EventStep;
  setStep: (step: EventStep) => void;
  rooms: ConferenceRoom[];
  services: EventService[];
  clients: { id: number; name: string; email: string; phone: string; status: string }[];
  eligibleStays: { stay: { code: string; reservationId: number }; reservation?: { id: number; code: string; guest: string; status: string } }[];
  conflict: EventRecord | null;
  totals: { roomValue: number; servicesValue: number; total: number; duration: number };
  onClose: () => void;
  onSave: () => void;
  message: string;
}) {
  const selectedClient = clients.find((client) => client.id === form.contractorClientId);
  const setRoom = (roomId: number) => {
    const room = rooms.find((item) => item.id === roomId);
    setForm({ ...form, roomId, roomHourlyRateContracted: room?.hourlyRate ?? 0 });
  };
  const addService = (serviceId: number) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    setForm({ ...form, services: [...form.services, serviceToLine(service, service.unit === "por pessoa" ? form.guests : 1)] });
  };
  return <Modal wide title="Cadastro de evento" onClose={onClose}>
    <div className="mb-4 flex flex-wrap gap-2">{[1, 2, 3, 4, 5, 6].map((item) => <button key={item} type="button" className={`rounded-md border px-3 py-2 text-sm font-bold ${step === item ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700"}`} onClick={() => setStep(item as EventStep)}>{item}</button>)}</div>
    {step === 1 && <FormGrid cols={2}>
      <FullCol><SectionTitle>Informacoes gerais</SectionTitle></FullCol>
      <Input label="Nome do evento" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <Select label="Tipo" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as EventType })}><option>Corporativo</option><option>Social</option></Select>
      <Select label="Cliente cadastrado" value={form.contractorClientId ?? ""} onChange={(event) => { const client = clients.find((item) => item.id === Number(event.target.value)); setForm({ ...form, contractorClientId: client?.id, contractorName: client?.name ?? "", contact: client?.name ?? form.contact, email: client?.email ?? "", phone: client?.phone ?? "" }); }}><option value="">Contratante externo</option>{clients.filter((client) => client.status === "Ativo").map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select>
      <Input label="Contratante" value={form.contractorName} readOnly={Boolean(selectedClient)} onChange={(event) => setForm({ ...form, contractorName: event.target.value })} />
      <Input label="Contato" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
      <Input label="Telefone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      <Input label="E-mail" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <Input label="Participantes" type="number" min="1" value={form.guests} onChange={(event) => setForm({ ...form, guests: Number(event.target.value) })} />
      <FullCol><Textarea label="Observacoes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FullCol>
    </FormGrid>}
    {step === 2 && <FormGrid cols={2}>
      <FullCol><SectionTitle>Espaco e agendamento</SectionTitle></FullCol>
      <Select label="Sala" value={form.roomId || ""} onChange={(event) => setRoom(Number(event.target.value))}><option value="">Selecione</option>{rooms.map((room) => <option key={room.id} value={room.id} disabled={room.status !== "Ativo"}>{room.name} - {room.capacity} pessoas - {room.status}</option>)}</Select>
      <Input label="Preco contratado por hora" type="number" min="0" step="0.01" value={form.roomHourlyRateContracted} onChange={(event) => setForm({ ...form, roomHourlyRateContracted: Number(event.target.value) })} />
      <Input label="Inicio" type="datetime-local" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
      <Input label="Fim" type="datetime-local" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
      <Info label="Duracao calculada" value={`${totals.duration.toFixed(1)} horas`} />
      <Info label="Valor do espaco" value={formatMoney(totals.roomValue)} />
      <FullCol>{conflict ? <Alert type="error">Conflito com {conflict.code} - {conflict.name}. O sistema nao permitira salvar.</Alert> : <Alert type="success">Sala disponivel no periodo informado.</Alert>}</FullCol>
    </FormGrid>}
    {step === 3 && <div className="space-y-4">
      <SectionTitle>Servicos contratados</SectionTitle>
      <FormGrid cols={2}><Select label="Adicionar servico" value="" onChange={(event) => event.target.value && addService(Number(event.target.value))}><option value="">Selecione</option>{services.filter((service) => service.status === "Ativo").map((service) => <option key={service.id} value={service.id}>{service.name} - {formatMoney(service.price)} {service.unit}</option>)}</Select><Info label="Total dos servicos" value={formatMoney(totals.servicesValue)} /></FormGrid>
      <Table headers={["Servico", "Unidade", "Quantidade", "Preco contratado", "Subtotal", "Acoes"]} rows={form.services.map((line, index) => [
        line.serviceName,
        line.unit,
        <Input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => updateServiceLine(form, setForm, index, { quantity: Number(event.target.value) })} />,
        <Input type="number" min="0" step="0.01" value={line.contractedUnitPrice} onChange={(event) => updateServiceLine(form, setForm, index, { contractedUnitPrice: Number(event.target.value) })} />,
        formatMoney(lineSubtotal(line)),
        <Btn small variant="danger" onClick={() => setForm({ ...form, services: form.services.filter((_, itemIndex) => itemIndex !== index) })}>Excluir</Btn>,
      ])} />
    </div>}
    {step === 4 && <div className="space-y-4">
      <SectionTitle>Cronograma</SectionTitle>
      <Table headers={["Horario", "Atividade", "Responsavel", "Observacoes", "Acoes"]} rows={form.timeline.map((item, index) => [
        <Input type="time" value={item.time} onChange={(event) => updateTimeline(form, setForm, index, { time: event.target.value })} />,
        <Input value={item.activity} onChange={(event) => updateTimeline(form, setForm, index, { activity: event.target.value })} />,
        <Input value={item.responsible} onChange={(event) => updateTimeline(form, setForm, index, { responsible: event.target.value })} />,
        <Input value={item.notes} onChange={(event) => updateTimeline(form, setForm, index, { notes: event.target.value })} />,
        <Btn small variant="danger" onClick={() => setForm({ ...form, timeline: form.timeline.filter((_, itemIndex) => itemIndex !== index) })}>Excluir</Btn>,
      ])} />
      <Btn variant="secondary" onClick={() => setForm({ ...form, timeline: [...form.timeline, emptyTimeline()] })}>+ Adicionar atividade</Btn>
    </div>}
    {step === 5 && <FormGrid cols={2}>
      <FullCol><SectionTitle>Cobranca</SectionTitle></FullCol>
      <Info label="Valor da sala" value={formatMoney(totals.roomValue)} />
      <Info label="Valor dos servicos" value={formatMoney(totals.servicesValue)} />
      <Input label="Desconto" type="number" min="0" step="0.01" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })} />
      <Info label="Total contratado" value={formatMoney(totals.total)} />
      <Select label="Forma de cobranca" value={form.billingType} onChange={(event) => setForm({ ...form, billingType: event.target.value as EventInput["billingType"], linkedReservationId: undefined })}><option>Separada</option><option>Vinculada a hospedagem</option></Select>
      {form.billingType === "Vinculada a hospedagem" && <Select label="Hospedagem ativa" value={form.linkedReservationId ?? ""} onChange={(event) => setForm({ ...form, linkedReservationId: Number(event.target.value) })}><option value="">Selecione</option>{eligibleStays.map(({ stay, reservation }) => <option key={stay.reservationId} value={stay.reservationId}>{reservation?.code} - {reservation?.guest} - {stay.code}</option>)}</Select>}
      <Info label="Valor recebido" value={formatMoney(0)} />
      <Info label="Saldo pendente" value={formatMoney(totals.total)} />
    </FormGrid>}
    {step === 6 && <div className="space-y-4">
      <SectionTitle>Revisao e confirmacao</SectionTitle>
      <FormGrid cols={2}>
        <Info label="Contratante" value={form.contractorName || "Nao informado"} />
        <Info label="Sala" value={rooms.find((room) => room.id === form.roomId)?.name ?? "Nao selecionada"} />
        <Info label="Periodo" value={`${formatDisplayDate(form.start)} ate ${formatDisplayDate(form.end)}`} />
        <Info label="Participantes" value={String(form.guests)} />
        <Info label="Servicos" value={form.services.map((line) => `${line.serviceName} (${line.quantity} x ${formatMoney(line.contractedUnitPrice)})`).join(", ") || "Nenhum"} />
        <Info label="Total" value={formatMoney(totals.total)} />
        <FullCol><Info label="Cobranca" value={form.billingType} /></FullCol>
      </FormGrid>
      <Timeline items={form.timeline} />
    </div>}
    {message && <Alert type="error">{message}</Alert>}
    <FormActions>
      <Btn variant="ghost" onClick={step === 1 ? onClose : () => setStep((step - 1) as EventStep)}>{step === 1 ? "Cancelar" : "Anterior"}</Btn>
      {step < 6 ? <Btn onClick={() => setStep((step + 1) as EventStep)} disabled={Boolean(conflict)}>Proximo</Btn> : <Btn onClick={onSave} disabled={Boolean(conflict)}>Confirmar evento</Btn>}
    </FormActions>
  </Modal>;
}

function AgendaView({ events, rooms, date, setDate, view, setView, roomId, setRoomId, openEvent, startEvent }: {
  events: EventRecord[];
  rooms: ConferenceRoom[];
  date: string;
  setDate: (date: string) => void;
  view: "dia" | "semana";
  setView: (view: "dia" | "semana") => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  openEvent: (event: EventRecord) => void;
  startEvent: (roomId: number, start: string, end: string) => void;
}) {
  const days = useMemo(() => view === "dia" ? [date] : Array.from({ length: 7 }, (_, index) => {
    const item = new Date(`${date}T12:00`);
    item.setDate(item.getDate() + index);
    return item.toISOString().slice(0, 10);
  }), [date, view]);
  const displayRooms = rooms.filter((room) => !roomId || room.id === Number(roomId));
  const hours = Array.from({ length: 13 }, (_, index) => index + 7);
  return <Card>
    <FormGrid cols={3}>
      <Input label="Data inicial" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <Select label="Visualizacao" value={view} onChange={(event) => setView(event.target.value as "dia" | "semana")}><option value="dia">Diaria</option><option value="semana">Semanal</option></Select>
      <Select label="Sala" value={roomId} onChange={(event) => setRoomId(event.target.value)}><option value="">Todas</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</Select>
    </FormGrid>
    <div className="mt-4 space-y-4">
      {displayRooms.map((room) => <div key={room.id} className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="mb-3 flex items-center justify-between"><strong>{room.name}</strong><Badge label={room.status} /></div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(180px, 1fr))` }}>
          {days.map((day) => <div key={day} className="space-y-2">
            <p className="text-xs font-bold uppercase text-primary">{formatDisplayDate(day)}</p>
            {hours.map((hour) => {
              const start = `${day}T${String(hour).padStart(2, "0")}:00`;
              const end = `${day}T${String(hour + 1).padStart(2, "0")}:00`;
              const event = events.find((item) => item.roomId === room.id && item.start < end && item.end > start);
              return <button key={start} type="button" className={`w-full rounded-md border px-3 py-2 text-left text-sm ${event ? event.status === "Cancelado" ? "border-gray-200 bg-gray-100 text-gray-500" : "border-primary/30 bg-primary/10 text-primary" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} onClick={() => event ? openEvent(event) : startEvent(room.id, start, end)}>
                <strong>{String(hour).padStart(2, "0")}:00</strong> {event ? `${event.code} - ${event.status}` : "Disponivel"}
              </button>;
            })}
          </div>)}
        </div>
      </div>)}
    </div>
  </Card>;
}

function RoomForm({ form, setForm }: { form: ConferenceRoomInput; setForm: (form: ConferenceRoomInput) => void }) {
  return <FormGrid cols={2}>
    <Input label="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
    <Input label="Localizacao" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
    <Input label="Capacidade" type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} />
    <Input label="Area" type="number" min="0" value={form.area} onChange={(event) => setForm({ ...form, area: Number(event.target.value) })} />
    <Input label="Preco por hora" type="number" min="0" step="0.01" value={form.hourlyRate} onChange={(event) => setForm({ ...form, hourlyRate: Number(event.target.value) })} />
    <FullCol><Textarea label="Recursos disponiveis" value={form.resources} onChange={(event) => setForm({ ...form, resources: event.target.value })} /></FullCol>
  </FormGrid>;
}

function ServiceForm({ form, setForm }: { form: EventServiceInput; setForm: (form: EventServiceInput) => void }) {
  return <FormGrid cols={2}>
    <Input label="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
    <Select label="Categoria" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Coffee break</option><option>Equipamentos</option><option>Decoracao</option><option>Equipe de apoio</option><option>Outros</option></Select>
    <Select label="Unidade de cobranca" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}><option>por evento</option><option>por pessoa</option><option>por hora</option><option>por diaria</option></Select>
    <Input label="Preco" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
    <FullCol><Textarea label="Descricao" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FullCol>
  </FormGrid>;
}

function EventDetails({ event, receipts, financials, reservationLabel, onClose }: { event: EventRecord; receipts: { code: string; date: string; value: number; method: string; status: string }[]; financials: { total: number; received: number; balance: number; status: string } | null; reservationLabel: string; onClose: () => void }) {
  return <Modal wide title={`${event.code} - ${event.name}`} onClose={onClose}>
    <div className="space-y-5">
      <FormGrid cols={2}>
        <Info label="Situacao" value={event.status} />
        <Info label="Tipo" value={event.type} />
        <Info label="Contratante" value={event.contractorName} />
        <Info label="Contato" value={`${event.contact} - ${event.phone || event.email || "sem contato"}`} />
        <Info label="Sala" value={event.roomName} />
        <Info label="Periodo" value={`${formatDisplayDate(event.start)} ate ${formatDisplayDate(event.end)}`} />
        <Info label="Participantes" value={String(event.guests)} />
        <Info label="Cobranca" value={event.billingType === "Vinculada a hospedagem" ? `${event.billingType}: ${reservationLabel}` : event.billingType} />
      </FormGrid>
      <SectionTitle>Servicos contratados</SectionTitle>
      <Table headers={["Servico", "Categoria", "Quantidade", "Unidade", "Preco contratado", "Subtotal"]} rows={event.services.map((line) => [line.serviceName, line.category, String(line.quantity), line.unit, formatMoney(line.contractedUnitPrice), formatMoney(line.subtotal)])} />
      <SectionTitle>Cronograma</SectionTitle>
      <Timeline items={event.timeline} />
      <SectionTitle>Resumo financeiro</SectionTitle>
      <FormGrid cols={3}><Info label="Valor da sala" value={formatMoney(event.roomValueContracted)} /><Info label="Valor dos servicos" value={formatMoney(event.servicesValueContracted)} /><Info label="Total contratado" value={formatMoney(event.totalContracted)} /><Info label="Recebido" value={formatMoney(financials?.received ?? 0)} /><Info label="Saldo pendente" value={formatMoney(financials?.balance ?? event.totalContracted)} /><Info label="Situacao financeira" value={financials?.status ?? "Pendente"} /></FormGrid>
      {receipts.length > 0 && <Table headers={["Codigo", "Data", "Valor", "Forma", "Status"]} rows={receipts.map((receipt) => [receipt.code, receipt.date, formatMoney(receipt.value), receipt.method, receipt.status])} />}
      {event.financialNotes && <Alert type="info">Historico: {event.financialNotes}</Alert>}
      <FormActions><Btn variant="ghost" onClick={onClose}>Fechar</Btn></FormActions>
    </div>
  </Modal>;
}

function Timeline({ items }: { items: EventTimelineItem[] }) {
  return <div className="relative ml-3 border-l-2 border-primary/20 pl-6">
    {[...items].sort((first, second) => first.time.localeCompare(second.time)).map((item) => <div key={item.id} className="relative pb-5 last:pb-0">
      <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
      <p className="text-xs font-bold uppercase text-primary">{item.time}</p>
      <p className="font-bold text-gray-800">{item.activity}</p>
      <p className="text-sm text-gray-500">{item.responsible}{item.notes ? ` - ${item.notes}` : ""}</p>
    </div>)}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="min-h-24"><p className="text-xs font-bold uppercase text-primary/70">{label}</p><p className="mt-2 text-2xl font-bold text-primary">{value}</p></Card>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-surface p-3"><p className="text-xs font-bold uppercase text-primary/70">{label}</p><p className="mt-1 text-sm text-gray-700">{value}</p></div>;
}

function updateServiceLine(form: EventInput, setForm: (form: EventInput) => void, index: number, patch: Partial<ContractedEventService>) {
  setForm({ ...form, services: form.services.map((line, itemIndex) => itemIndex === index ? { ...line, ...patch } : line) });
}

function updateTimeline(form: EventInput, setForm: (form: EventInput) => void, index: number, patch: Partial<EventTimelineItem>) {
  setForm({ ...form, timeline: form.timeline.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
}

function reservationLabel(reservations: { id: number; code: string; guest: string }[], reservationId?: number) {
  const reservation = reservations.find((item) => item.id === reservationId);
  return reservation ? `${reservation.code} - ${reservation.guest}` : "Nao vinculada";
}
