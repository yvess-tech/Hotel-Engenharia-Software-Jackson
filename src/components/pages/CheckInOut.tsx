import { useMemo, useState } from "react";
import { Alert, Badge, Btn, Card, ConfirmDialog, FormActions, FormGrid, FullCol, Input, Modal, PageHeader, SectionTitle, Select, Table, Tabs, Textarea, formatDisplayDate } from "../ui";
import { countNights, formatMoney, useHotelOperations, type Reservation } from "../HotelOperationsContext";

type Tab = "checkin" | "checkout" | "fatura" | "historico";
type ModalType = "checkin" | "checkout" | "fatura" | null;

const consumptions = [
  { description: "Frigobar", quantity: 2, unit: 25, discount: 0 },
  { description: "Room Service", quantity: 1, unit: 85, discount: 0 },
  { description: "Lavanderia", quantity: 1, unit: 65, discount: 0 },
];

export default function CheckInOut() {
  const { rooms, reservations, receipts, setReceipts, activeReceiptsTotal, checkIn, checkOut } = useHotelOperations();
  const [tab, setTab] = useState<Tab>("checkin");
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [documents, setDocuments] = useState({ main: false, companions: false });
  const [signature, setSignature] = useState(false);
  const [keyData, setKeyData] = useState({ identifier: "", deliveredAt: "2026-09-30T14:00", notes: "" });
  const [checkoutChecks, setCheckoutChecks] = useState({ key: false, invoice: false, pending: false });
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);

  const pendingCheckins = reservations.filter((item) => item.status === "Confirmada" && item.entry <= "2026-09-30");
  const activeStays = reservations.filter((item) => item.status === "Hospedado");
  const history = reservations.filter((item) => item.status === "Concluída");

  const roomFor = (reservation: Reservation) => rooms.find((room) => room.id === reservation.roomId);
  const invoiceFor = (reservation: Reservation) => {
    const nights = countNights(reservation.entry, reservation.exit);
    const dailyTotal = nights * reservation.dailyRate;
    const consumptionTotal = consumptions.reduce((total, item) => total + item.quantity * item.unit - item.discount, 0);
    const subtotal = dailyTotal + consumptionTotal;
    const discounts = 0;
    const received = activeReceiptsTotal(reservation.id);
    return { nights, dailyTotal, consumptionTotal, subtotal, discounts, received, total: subtotal - discounts, balance: Math.max(0, subtotal - discounts - received) };
  };

  const selectedInvoice = useMemo(() => selected ? invoiceFor(selected) : null, [selected, receipts]);
  const canFinishCheckout = Boolean(selectedInvoice && selectedInvoice.balance === 0 && checkoutChecks.key && checkoutChecks.invoice && checkoutChecks.pending);

  const openCheckin = (reservation: Reservation) => {
    setSelected(reservation);
    setDocuments({ main: false, companions: false });
    setSignature(false);
    setKeyData({ identifier: "", deliveredAt: "2026-09-30T14:00", notes: "" });
    setModal("checkin");
  };

  const openCheckout = (reservation: Reservation) => {
    setSelected(reservation);
    setCheckoutChecks({ key: false, invoice: false, pending: false });
    setModal("checkout");
  };

  const registerBalancePayment = () => {
    if (!selected || !selectedInvoice || selectedInvoice.balance <= 0) return;
    const nextId = Math.max(...receipts.map((item) => item.id)) + 1;
    setReceipts((current) => [...current, { id: nextId, code: `REC-${String(200 + nextId).padStart(4, "0")}`, reservationId: selected.id, date: "2026-09-30", value: selectedInvoice.balance, method: "Cartão de crédito", status: "Confirmado", notes: "Regularização no check-out." }]);
  };

  const issueInvoice = () => {
    setIssuing(true);
    setIssueSuccess(false);
    window.setTimeout(() => { setIssuing(false); setIssueSuccess(true); }, 700);
  };

  return <div className="ops-page">
    <PageHeader title="Check-in / Check-out" />
    <Tabs tabs={[{ id: "checkin", label: "Check-in" }, { id: "checkout", label: "Check-out" }, { id: "fatura", label: "Faturas" }, { id: "historico", label: "Histórico" }]} active={tab} onChange={setTab} />

    {tab === "checkin" && <Card>
      <SectionTitle>Reservas disponíveis para check-in</SectionTitle>
      {pendingCheckins.length === 0 ? <Alert type="info">Nenhuma reserva válida aguardando check-in.</Alert> : <Table headers={["Reserva", "Hóspede responsável", "Entrada", "Saída", "Quarto", "Categoria", "Hóspedes", "Ação"]} rows={pendingCheckins.map((reservation) => [reservation.code, reservation.guest, reservation.entry, reservation.exit, roomFor(reservation)?.number ?? "—", reservation.category, String(reservation.guests), <Btn small onClick={() => openCheckin(reservation)}>Iniciar Check-in</Btn>])} />}
    </Card>}

    {tab === "checkout" && <Card>
      <SectionTitle>Hospedagens ativas</SectionTitle>
      {activeStays.length === 0 ? <Alert type="info">Nenhuma hospedagem ativa para check-out.</Alert> : <Table headers={["Hospedagem", "Hóspede", "Quarto", "Categoria", "Entrada", "Saída", "Diárias", "Saldo pendente", "Ações"]} rows={activeStays.map((reservation) => {
        const invoice = invoiceFor(reservation);
        return [reservation.code.replace("RES", "HOS"), reservation.guest, roomFor(reservation)?.number ?? "—", reservation.category, reservation.entry, reservation.exit, String(invoice.nights), <strong style={{ color: invoice.balance > 0 ? "var(--danger-fg)" : "var(--ok-fg)" }}>{formatMoney(invoice.balance)}</strong>, <div className="table-actions"><Btn small variant="ghost" onClick={() => { setSelected(reservation); setModal("fatura"); }}>Visualizar Fatura</Btn><Btn small onClick={() => openCheckout(reservation)}>Realizar Check-out</Btn></div>];
      })} />}
    </Card>}

    {tab === "fatura" && <Card>
      <SectionTitle>Faturas de hospedagem</SectionTitle>
      <Table headers={["Hospedagem", "Hóspede", "Quarto", "Período", "Total", "Recebimentos", "Saldo", "Ações"]} rows={reservations.filter((item) => item.status === "Hospedado" || item.status === "Concluída").map((reservation) => {
        const invoice = invoiceFor(reservation);
        return [reservation.code.replace("RES", "HOS"), reservation.guest, roomFor(reservation)?.number ?? "—", `${formatDisplayDate(reservation.entry)} a ${formatDisplayDate(reservation.exit)}`, formatMoney(invoice.total), formatMoney(invoice.received), formatMoney(invoice.balance), <div className="table-actions"><Btn small variant="ghost" onClick={() => { setSelected(reservation); setIssueSuccess(false); setModal("fatura"); }}>Visualizar Fatura</Btn><Btn small variant="secondary" onClick={() => { setSelected(reservation); setModal("fatura"); window.setTimeout(issueInvoice, 0); }}>Emitir Fatura</Btn></div>];
      })} />
    </Card>}

    {tab === "historico" && <Card><SectionTitle>Histórico de hospedagens</SectionTitle><Table headers={["Hospedagem", "Hóspede", "Quarto", "Entrada", "Saída", "Status", "Auditoria"]} rows={history.map((reservation) => [reservation.code.replace("RES", "HOS"), reservation.guest, roomFor(reservation)?.number ?? "—", reservation.entry, reservation.exit, <Badge label={reservation.status} />, reservation.audit ?? "Registro concluído"])} /></Card>}

    {modal === "checkin" && selected && <Modal wide title={`Check-in — ${selected.code}`} onClose={() => setModal(null)}>
      <p className="autosave-state">Alterações salvas automaticamente às 14:02</p>
      <SectionTitle>Dados da reserva</SectionTitle>
      <div className="summary-grid"><Detail label="Código" value={selected.code} /><Detail label="Hóspede responsável" value={selected.guest} /><Detail label="Entrada" value={formatDisplayDate(selected.entry)} /><Detail label="Saída" value={formatDisplayDate(selected.exit)} /><Detail label="Quarto" value={roomFor(selected)?.number ?? "—"} /><Detail label="Categoria" value={selected.category} /><Detail label="Hóspedes" value={String(selected.guests)} /></div>
      <SectionTitle>Hóspedes</SectionTitle>
      <Table headers={["Nome", "Tipo", "Documento", "Situação"]} rows={[[selected.guest, "Responsável", "CPF 456.***.***-00", <Badge label={documents.main ? "Documento conferido" : "Documento pendente"} />], ...(selected.guests > 1 ? [["Acompanhante informado", "Acompanhante", "A apresentar", <Badge label={documents.companions ? "Documento conferido" : "Documento pendente"} />]] : [])]} />
      <div className="check-row"><Check label="Documento do responsável conferido" checked={documents.main} onChange={(checked) => setDocuments({ ...documents, main: checked })} />{selected.guests > 1 && <Check label="Documentos dos acompanhantes conferidos" checked={documents.companions} onChange={(checked) => setDocuments({ ...documents, companions: checked })} />}</div>
      <SectionTitle>Ficha de Hospedagem</SectionTitle>
      <div className="a4-preview"><strong>Ficha Nacional de Registro de Hóspede</strong><span>{selected.guest} · {selected.code} · Quarto {roomFor(selected)?.number}</span><span>Período: {formatDisplayDate(selected.entry)} a {formatDisplayDate(selected.exit)}</span></div>
      <Btn variant="secondary" onClick={() => window.print()}>Visualizar/Imprimir Ficha</Btn>
      <SectionTitle>Assinatura Digital</SectionTitle>
      <button className={`signature-pad${signature ? " signed" : ""}`} onClick={() => setSignature(true)}>{signature ? "Assinatura registrada com segurança" : "Assinatura pendente — toque para capturar"}</button>
      <SectionTitle>Chave/Cartão</SectionTitle>
      <FormGrid cols={2}><Input label="Identificação da chave/cartão *" value={keyData.identifier} onChange={(event) => setKeyData({ ...keyData, identifier: event.target.value })} /><Input label="Data/hora da entrega *" type="datetime-local" value={keyData.deliveredAt} onChange={(event) => setKeyData({ ...keyData, deliveredAt: event.target.value })} /><FullCol><Textarea label="Observação" value={keyData.notes} onChange={(event) => setKeyData({ ...keyData, notes: event.target.value })} /></FullCol></FormGrid>
      <Alert type={documents.main && (selected.guests === 1 || documents.companions) && signature && keyData.identifier ? "success" : "warning"}>Resumo: documentação {documents.main ? "iniciada" : "pendente"}, assinatura {signature ? "registrada" : "pendente"} e chave/cartão {keyData.identifier ? "identificado" : "pendente"}.</Alert>
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn disabled={!documents.main || (selected.guests > 1 && !documents.companions) || !signature || !keyData.identifier} onClick={() => { checkIn(selected.id); setModal(null); setTab("checkout"); }}>Confirmar Check-in</Btn></FormActions>
    </Modal>}

    {modal === "checkout" && selected && selectedInvoice && <Modal wide title={`Check-out — ${selected.code.replace("RES", "HOS")}`} onClose={() => setModal(null)}>
      <SectionTitle>Hospedagem ativa</SectionTitle>
      <div className="summary-grid"><Detail label="Hóspede" value={selected.guest} /><Detail label="Quarto" value={roomFor(selected)?.number ?? "—"} /><Detail label="Categoria" value={selected.category} /><Detail label="Entrada" value={formatDisplayDate(selected.entry)} /><Detail label="Saída" value={formatDisplayDate(selected.exit)} /><Detail label="Diárias" value={String(selectedInvoice.nights)} /></div>
      <SectionTitle>Resumo financeiro</SectionTitle>
      <div className="summary-grid"><Detail label="Diárias" value={formatMoney(selectedInvoice.dailyTotal)} /><Detail label="Consumos" value={formatMoney(selectedInvoice.consumptionTotal)} /><Detail label="Descontos" value={formatMoney(selectedInvoice.discounts)} /><Detail label="Recebimentos" value={formatMoney(selectedInvoice.received)} /><Detail label="Valor total" value={formatMoney(selectedInvoice.total)} /><Detail label="Saldo pendente" value={formatMoney(selectedInvoice.balance)} strong={selectedInvoice.balance > 0} /></div>
      <Invoice reservation={selected} roomNumber={roomFor(selected)?.number ?? "—"} invoice={selectedInvoice} />
      {selectedInvoice.balance > 0 ? <Alert type="error">Regularize as pendências financeiras antes de finalizar o check-out.</Alert> : <Alert type="success">Situação financeira regularizada.</Alert>}
      {selectedInvoice.balance > 0 && <Btn variant="secondary" onClick={registerBalancePayment}>Registrar recebimento de {formatMoney(selectedInvoice.balance)}</Btn>}
      <SectionTitle>Checklist de finalização</SectionTitle>
      <div className="checklist"><Check label="Situação financeira regularizada" checked={selectedInvoice.balance === 0} disabled /><Check label="Chave/cartão devolvido" checked={checkoutChecks.key} onChange={(checked) => setCheckoutChecks({ ...checkoutChecks, key: checked })} /><Check label="Fatura conferida" checked={checkoutChecks.invoice} onChange={(checked) => setCheckoutChecks({ ...checkoutChecks, invoice: checked })} /><Check label="Pendências verificadas" checked={checkoutChecks.pending} onChange={(checked) => setCheckoutChecks({ ...checkoutChecks, pending: checked })} /></div>
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn disabled={!canFinishCheckout} onClick={() => setConfirmCheckout(true)}>Finalizar Check-out</Btn></FormActions>
    </Modal>}

    {modal === "fatura" && selected && selectedInvoice && <Modal wide title="Fatura da Hospedagem" onClose={() => setModal(null)}><Invoice reservation={selected} roomNumber={roomFor(selected)?.number ?? "—"} invoice={selectedInvoice} />{issuing && <p className="inline-state">Emitindo fatura...</p>}{issueSuccess && <Alert type="success">Fatura emitida com sucesso e vinculada à hospedagem.</Alert>}<FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn><Btn variant="secondary" onClick={() => window.print()}>Visualizar Fatura</Btn><Btn disabled={issuing} onClick={issueInvoice}>{issuing ? "Emitindo..." : "Emitir Fatura"}</Btn></FormActions></Modal>}

    {confirmCheckout && selected && <ConfirmDialog title="Confirmar finalização do check-out" description="A hospedagem será encerrada, a fatura emitida, o registro enviado ao histórico do hóspede e o quarto liberado." onCancel={() => setConfirmCheckout(false)} onConfirm={() => { checkOut(selected.id); setConfirmCheckout(false); setModal(null); setTab("historico"); }} />}
  </div>;
}

function Invoice({ reservation, roomNumber, invoice }: { reservation: Reservation; roomNumber: string; invoice: ReturnType<typeof invoiceValues> }) {
  const rows = [["Diária", String(invoice.nights), formatMoney(reservation.dailyRate), formatMoney(0), formatMoney(invoice.dailyTotal)], ...consumptions.map((item) => [item.description, String(item.quantity), formatMoney(item.unit), formatMoney(item.discount), formatMoney(item.quantity * item.unit - item.discount)])];
  return <div className="invoice-sheet"><div className="invoice-header"><div><strong>Hotel Pacaas Novos</strong><span>Fatura · {reservation.code.replace("RES", "HOS")}</span></div><div><span>{reservation.guest}</span><span>Quarto {roomNumber} · {formatDisplayDate(reservation.entry)} a {formatDisplayDate(reservation.exit)}</span></div></div><Table headers={["Descrição", "Quantidade", "Valor unitário", "Desconto", "Valor total"]} rows={rows} /><div className="invoice-totals"><Detail label="Subtotal" value={formatMoney(invoice.subtotal)} /><Detail label="Descontos" value={formatMoney(invoice.discounts)} /><Detail label="Recebimentos realizados" value={formatMoney(invoice.received)} /><Detail label="Total" value={formatMoney(invoice.total)} /><Detail label="Saldo pendente" value={formatMoney(invoice.balance)} strong={invoice.balance > 0} /></div></div>;
}

function invoiceValues() { return { nights: 0, dailyTotal: 0, consumptionTotal: 0, subtotal: 0, discounts: 0, received: 0, total: 0, balance: 0 }; }
function Detail({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="summary-item"><span>{label}</span><strong className={strong ? "financial-alert" : ""}>{value}</strong></div>; }
function Check({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange?: (checked: boolean) => void; disabled?: boolean }) { return <label className="check-field"><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />{label}</label>; }
