import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Btn, Card, FormActions, FormGrid, FullCol, Input, Modal, PageHeader, SectionTitle, Select, Table, Tabs, Textarea, formatDisplayDate } from "../ui";
import { countNights, formatMoney, useHotelOperations, type ReceiptStatus, type Reservation, type ReservationStatus } from "../HotelOperationsContext";

type Tab = "reservas" | "recebimentos";
type ReservationModal = "new" | "edit" | "view" | "cancel" | null;
type ReceiptModal = "new" | "view" | null;

const validStatuses: ReservationStatus[] = ["Pendente", "Confirmada", "Hospedado", "Concluída", "Cancelada"];
const emptyReservation = { guest: "", entry: "", exit: "", category: "Standard", roomId: "", guests: "1", status: "Pendente" as ReservationStatus, notes: "" };
const emptyReceipt = { reservationId: "", date: "2026-09-30", value: "", method: "PIX", notes: "" };

export default function Reservas() {
  const { rooms, setRooms, categories, reservations, receipts, setReservations, setReceipts, cancelReservation, activeReceiptsTotal } = useHotelOperations();
  const [tab, setTab] = useState<Tab>("reservas");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reservationModal, setReservationModal] = useState<ReservationModal>(null);
  const [receiptModal, setReceiptModal] = useState<ReceiptModal>(null);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [form, setForm] = useState(emptyReservation);
  const [receiptForm, setReceiptForm] = useState(emptyReceipt);

  useEffect(() => {
    if (!form.entry || !form.exit || !form.category) return;
    setCheckingAvailability(true);
    const timer = window.setTimeout(() => setCheckingAvailability(false), 450);
    return () => window.clearTimeout(timer);
  }, [form.entry, form.exit, form.category]);

  const availableRooms = useMemo(() => {
    if (!form.entry || !form.exit) return [];
    return rooms.filter((room) => {
      if (room.category !== form.category || room.status === "Em manutenção") return false;
      const conflict = reservations.some((reservation) =>
        reservation.id !== selected?.id &&
        reservation.roomId === room.id &&
        reservation.status !== "Cancelada" &&
        reservation.status !== "Concluída" &&
        form.entry < reservation.exit && form.exit > reservation.entry
      );
      return !conflict;
    });
  }, [form.entry, form.exit, form.category, rooms, reservations, selected]);

  const filteredReservations = reservations.filter((reservation) => {
    const query = search.toLowerCase();
    return (!query || reservation.code.toLowerCase().includes(query) || reservation.guest.toLowerCase().includes(query) || rooms.find((room) => room.id === reservation.roomId)?.number.includes(query)) &&
      (!statusFilter || reservation.status === statusFilter);
  });

  const selectedRoom = rooms.find((room) => room.id === Number(form.roomId));
  const nights = countNights(form.entry, form.exit);
  const dailyRate = selectedRoom?.rate ?? categories.find((category) => category.name === form.category)?.rate ?? 0;
  const subtotal = nights * dailyRate;
  const received = selected ? activeReceiptsTotal(selected.id) : 0;
  const selectedReceipt = receipts.find((receipt) => receipt.id === selectedReceiptId);
  const receiptReservation = reservations.find((reservation) => reservation.id === Number(receiptForm.reservationId));

  const openNew = () => {
    setSelected(null);
    setForm(emptyReservation);
    setReservationModal("new");
  };

  const openEdit = (reservation: Reservation) => {
    setSelected(reservation);
    setForm({ guest: reservation.guest, entry: reservation.entry, exit: reservation.exit, category: reservation.category, roomId: String(reservation.roomId), guests: String(reservation.guests), status: reservation.status, notes: reservation.notes });
    setReservationModal("edit");
  };

  const saveReservation = () => {
    const room = rooms.find((item) => item.id === Number(form.roomId));
    if (!form.guest || !form.entry || !form.exit || !room || nights < 1) return;
    if (reservationModal === "new") {
      const nextId = Math.max(...reservations.map((item) => item.id)) + 1;
      setReservations((current) => [...current, { id: nextId, code: `RES-${1000 + nextId}`, guest: form.guest, entry: form.entry, exit: form.exit, category: form.category, roomId: room.id, guests: Number(form.guests), status: form.status, dailyRate: room.rate, notes: form.notes }]);
    } else if (selected) {
      if (form.status === "Cancelada") {
        cancelReservation(selected.id, "Cancelamento registrado durante a atualização.");
        setReservationModal(null);
        return;
      }
      setReservations((current) => current.map((item) => item.id === selected.id ? { ...item, guest: form.guest, entry: form.entry, exit: form.exit, category: form.category, roomId: room.id, guests: Number(form.guests), status: form.status, dailyRate: room.rate, notes: form.notes, audit: "Atualizada por João Carlos em 30/09/2026 às 10:35." } : item));
      if (selected.roomId !== room.id) setRooms((current) => current.map((item) => item.id === selected.roomId && item.status === "Reservado" ? { ...item, status: "Livre" } : item));
    }
    if (form.status === "Confirmada" && form.entry <= "2026-09-30" && form.exit > "2026-09-30") setRooms((current) => current.map((item) => item.id === room.id ? { ...item, status: "Reservado" } : item));
    setReservationModal(null);
  };

  const saveReceipt = () => {
    const reservationId = Number(receiptForm.reservationId);
    if (!reservationId || !receiptForm.value) return;
    const nextId = Math.max(...receipts.map((item) => item.id)) + 1;
    setReceipts((current) => [...current, { id: nextId, code: `REC-${String(200 + nextId).padStart(4, "0")}`, reservationId, date: receiptForm.date, value: Number(receiptForm.value.replace(",", ".")), method: receiptForm.method, status: "Confirmado", notes: receiptForm.notes }]);
    setReceiptModal(null);
  };

  const updateReceiptStatus = (id: number, status: ReceiptStatus) => setReceipts((current) => current.map((item) => item.id === id ? { ...item, status, notes: `${item.notes}${item.notes ? " · " : ""}${status} por João Carlos em 30/09/2026 às 10:50.` } : item));

  return (
    <div className="ops-page">
      <PageHeader title="Reservas" actions={tab === "reservas" ? <Btn onClick={openNew}>+ Nova Reserva</Btn> : <Btn onClick={() => { setReceiptForm(emptyReceipt); setReceiptModal("new"); }}>+ Cadastrar Recebimento</Btn>} />
      <Tabs tabs={[{ id: "reservas", label: "Reservas" }, { id: "recebimentos", label: "Recebimentos" }]} active={tab} onChange={setTab} />

      {tab === "reservas" && <Card>
        <div className="ops-filters">
          <div className="ops-filter-search"><Input label="Pesquisar" placeholder="Código, hóspede ou quarto" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="ops-filter"><Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todos</option>{validStatuses.map((status) => <option key={status}>{status}</option>)}</Select></div>
        </div>
        <Table headers={["Código", "Hóspede responsável", "Entrada", "Saída", "Quarto", "Categoria", "Hóspedes", "Valor", "Status", "Ações"]} rows={filteredReservations.map((reservation) => {
          const room = rooms.find((item) => item.id === reservation.roomId);
          const total = countNights(reservation.entry, reservation.exit) * reservation.dailyRate;
          return [reservation.code, reservation.guest, reservation.entry, reservation.exit, room?.number ?? "—", reservation.category, String(reservation.guests), formatMoney(total), <Badge label={reservation.status} />, <div className="table-actions"><Btn small variant="ghost" onClick={() => { setSelected(reservation); setReservationModal("view"); }}>Consultar</Btn><Btn small variant="secondary" onClick={() => openEdit(reservation)}>Atualizar</Btn>{!(["Cancelada", "Concluída"] as ReservationStatus[]).includes(reservation.status) && <Btn small variant="ghost" onClick={() => { setSelected(reservation); setCancelReason(""); setReservationModal("cancel"); }}>Cancelar Reserva</Btn>}</div>];
        })} />
        {filteredReservations.length === 0 && <Alert type="info">Nenhuma reserva encontrada para os filtros informados.</Alert>}
      </Card>}

      {tab === "recebimentos" && <Card>
        <Table headers={["Código", "Reserva", "Hóspede", "Data", "Valor", "Forma de pagamento", "Status", "Ações"]} rows={receipts.map((receipt) => {
          const reservation = reservations.find((item) => item.id === receipt.reservationId);
          return [receipt.code, reservation?.code ?? "—", reservation?.guest ?? "—", receipt.date, formatMoney(receipt.value), receipt.method, <Badge label={receipt.status} />, <div className="table-actions"><Btn small variant="ghost" onClick={() => { setSelectedReceiptId(receipt.id); setReceiptModal("view"); }}>Consultar</Btn>{receipt.status === "Confirmado" && <><Btn small variant="danger" onClick={() => updateReceiptStatus(receipt.id, "Cancelado")}>Cancelar</Btn><Btn small variant="danger" onClick={() => updateReceiptStatus(receipt.id, "Estornado")}>Estornar</Btn></>}</div>];
        })} />
      </Card>}

      {(reservationModal === "new" || reservationModal === "edit") && <Modal wide title={reservationModal === "new" ? "Cadastrar Reserva" : `Atualizar ${selected?.code}`} onClose={() => setReservationModal(null)}>
        <SectionTitle>Dados da reserva</SectionTitle>
        <FormGrid cols={2}>
          <FullCol><Input label="Hóspede responsável *" value={form.guest} onChange={(event) => setForm({ ...form, guest: event.target.value })} placeholder="Nome do hóspede" /></FullCol>
          <Input label="Data prevista de entrada *" type="date" value={form.entry} onChange={(event) => setForm({ ...form, entry: event.target.value, roomId: "" })} />
          <Input label="Data prevista de saída *" type="date" value={form.exit} onChange={(event) => setForm({ ...form, exit: event.target.value, roomId: "" })} />
          <Input label="Quantidade de hóspedes *" type="number" min="1" value={form.guests} onChange={(event) => setForm({ ...form, guests: event.target.value })} />
          <Select label="Categoria do quarto *" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value, roomId: "" })}>{categories.map((category) => <option key={category.id}>{category.name}</option>)}</Select>
          <Select label="Quarto *" disabled={checkingAvailability || !form.entry || !form.exit || availableRooms.length === 0} value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })}><option value="">{checkingAvailability ? "Consultando disponibilidade..." : "Selecione"}</option>{availableRooms.map((room) => <option key={room.id} value={room.id}>{room.number} — {room.category}</option>)}</Select>
          <Select label="Status *" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ReservationStatus })}>{validStatuses.filter((status) => status !== "Cancelada").map((status) => <option key={status}>{status}</option>)}</Select>
          <FullCol><Textarea label="Observações" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FullCol>
        </FormGrid>
        {checkingAvailability && <p className="inline-state">Consultando quartos disponíveis para o período...</p>}
        {!checkingAvailability && form.entry && form.exit && availableRooms.length === 0 && <Alert type="warning">Nenhum quarto desta categoria está disponível no período selecionado.</Alert>}
        <div className="reservation-summary">
          <SectionTitle>Resumo da reserva</SectionTitle>
          <div className="summary-grid"><Summary label="Período" value={form.entry && form.exit ? `${formatDisplayDate(form.entry)} a ${formatDisplayDate(form.exit)}` : "—"} /><Summary label="Diárias" value={String(nights)} /><Summary label="Categoria" value={form.category} /><Summary label="Quarto" value={selectedRoom?.number ?? "—"} /><Summary label="Valor da diária" value={formatMoney(dailyRate)} /><Summary label="Subtotal" value={formatMoney(subtotal)} /><Summary label="Recebimentos" value={formatMoney(received)} /><Summary label="Saldo restante" value={formatMoney(Math.max(0, subtotal - received))} strong /><Summary label="Valor total" value={formatMoney(subtotal)} strong /></div>
        </div>
        <FormActions><Btn variant="ghost" onClick={() => setReservationModal(null)}>Cancelar</Btn><Btn disabled={!form.guest || !form.roomId || nights < 1 || checkingAvailability} onClick={saveReservation}>{reservationModal === "new" ? "Salvar Reserva" : "Atualizar Reserva"}</Btn></FormActions>
      </Modal>}

      {reservationModal === "view" && selected && <Modal title={`Reserva ${selected.code}`} onClose={() => setReservationModal(null)}><ReservationDetails reservation={selected} rooms={rooms} received={activeReceiptsTotal(selected.id)} />{selected.audit && <Alert type="info">Auditoria: {selected.audit}</Alert>}<FormActions><Btn variant="ghost" onClick={() => setReservationModal(null)}>Fechar</Btn></FormActions></Modal>}

      {reservationModal === "cancel" && selected && <Modal title="Cancelar Reserva" onClose={() => setReservationModal(null)}><ReservationDetails reservation={selected} rooms={rooms} received={activeReceiptsTotal(selected.id)} /><Alert type="warning">Política: cancelamentos no dia da entrada podem reter o valor de uma diária. A reserva não será excluída e a operação ficará registrada.</Alert><Textarea label="Motivo do cancelamento *" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /><FormActions><Btn variant="ghost" onClick={() => setReservationModal(null)}>Voltar</Btn><Btn disabled={!cancelReason.trim()} onClick={() => { cancelReservation(selected.id, cancelReason); setReservationModal(null); }}>Confirmar Cancelamento</Btn></FormActions></Modal>}

      {receiptModal === "new" && <Modal title="Cadastrar Recebimento" onClose={() => setReceiptModal(null)}><FormGrid cols={2}><FullCol><Select label="Reserva *" value={receiptForm.reservationId} onChange={(event) => setReceiptForm({ ...receiptForm, reservationId: event.target.value })}><option value="">Selecione</option>{reservations.filter((item) => item.status !== "Cancelada").map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.code} — {reservation.guest}</option>)}</Select></FullCol><FullCol><Input label="Hóspede" value={receiptReservation?.guest ?? ""} readOnly placeholder="Preenchido após selecionar a reserva" /></FullCol><Input label="Data *" type="date" value={receiptForm.date} onChange={(event) => setReceiptForm({ ...receiptForm, date: event.target.value })} /><Input label="Valor *" type="number" min="0.01" step="0.01" value={receiptForm.value} onChange={(event) => setReceiptForm({ ...receiptForm, value: event.target.value })} /><Select label="Forma de pagamento *" value={receiptForm.method} onChange={(event) => setReceiptForm({ ...receiptForm, method: event.target.value })}><option>PIX</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Dinheiro</option><option>Transferência</option></Select><FullCol><Textarea label="Observação" value={receiptForm.notes} onChange={(event) => setReceiptForm({ ...receiptForm, notes: event.target.value })} /></FullCol></FormGrid><FormActions><Btn variant="ghost" onClick={() => setReceiptModal(null)}>Cancelar</Btn><Btn disabled={!receiptForm.reservationId || !receiptForm.value} onClick={saveReceipt}>Confirmar Recebimento</Btn></FormActions></Modal>}

      {receiptModal === "view" && selectedReceipt && <Modal title={`Recebimento ${selectedReceipt.code}`} onClose={() => setReceiptModal(null)}><div className="detail-list"><Summary label="Reserva" value={reservations.find((item) => item.id === selectedReceipt.reservationId)?.code ?? "—"} /><Summary label="Hóspede" value={reservations.find((item) => item.id === selectedReceipt.reservationId)?.guest ?? "—"} /><Summary label="Data" value={formatDisplayDate(selectedReceipt.date)} /><Summary label="Valor" value={formatMoney(selectedReceipt.value)} strong /><Summary label="Forma de pagamento" value={selectedReceipt.method} /><Summary label="Status" value={selectedReceipt.status} /><Summary label="Observação" value={selectedReceipt.notes || "—"} /></div><FormActions><Btn variant="ghost" onClick={() => setReceiptModal(null)}>Fechar</Btn></FormActions></Modal>}
    </div>
  );
}

function Summary({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="summary-item"><span>{label}</span><strong className={strong ? "summary-strong" : ""}>{value}</strong></div>;
}

function ReservationDetails({ reservation, rooms, received }: { reservation: Reservation; rooms: { id: number; number: string }[]; received: number }) {
  const total = countNights(reservation.entry, reservation.exit) * reservation.dailyRate;
  return <div className="detail-list"><Summary label="Código" value={reservation.code} /><Summary label="Hóspede" value={reservation.guest} /><Summary label="Período" value={`${formatDisplayDate(reservation.entry)} a ${formatDisplayDate(reservation.exit)}`} /><Summary label="Quarto" value={rooms.find((room) => room.id === reservation.roomId)?.number ?? "—"} /><Summary label="Categoria" value={reservation.category} /><Summary label="Valor" value={formatMoney(total)} strong /><Summary label="Recebimentos" value={formatMoney(received)} /><Summary label="Status" value={reservation.status} /></div>;
}
