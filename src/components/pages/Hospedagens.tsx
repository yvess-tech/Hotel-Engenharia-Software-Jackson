import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Btn, Card, FormActions, FormGrid, FullCol, Input, Modal, PageHeader, SectionTitle, Select, Table, Textarea } from "../ui";
import { countNights, formatMoney, useHotelOperations } from "../HotelOperationsContext";

export default function Hospedagens() {
  const { stays, reservations, rooms, clients, consumptions, receipts, invoices, products, transferStayRoom, recordConsumption, reverseConsumption } = useHotelOperations();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"manage" | "transfer" | "consumption" | "reverse" | null>(null);
  const [transfer, setTransfer] = useState({ roomId: "", reason: "", responsible: "Recepção" });
  const [consumption, setConsumption] = useState({ service: "Room Service", category: "Serviço" as "Produto" | "Serviço", productId: "", quantity: "1", unitPrice: "0", description: "", responsible: "Recepção" });
  const [reverse, setReverse] = useState({ id: 0, reason: "", responsible: "Recepção" });
  const [message, setMessage] = useState("");
  useEffect(() => {
    const stayId = Number(window.sessionStorage.getItem("hotel-open-stay"));
    if (!stayId) return;
    window.sessionStorage.removeItem("hotel-open-stay");
    setSelectedId(stayId);
    setModal("manage");
    setMessage("Check-in concluído. A hospedagem está pronta para gerenciamento.");
  }, []);
  const selected = stays.find((item) => item.id === selectedId);
  const reservation = selected ? reservations.find((item) => item.id === selected.reservationId) : undefined;
  const invoice = selected ? invoices.find((item) => item.stayId === selected.id) : undefined;
  const room = selected ? rooms.find((item) => item.id === selected.roomId) : undefined;
  const filtered = useMemo(() => stays.filter((stay) => {
    const targetReservation = reservations.find((item) => item.id === stay.reservationId);
    const targetClient = clients.find((item) => item.id === stay.clientId);
    const targetRoom = rooms.find((item) => item.id === stay.roomId);
    const term = query.trim().toLowerCase();
    return !term || `${stay.code} ${stay.guest} ${targetClient?.cpf ?? ""} ${targetRoom?.number ?? ""} ${stay.status}`.toLowerCase().includes(term);
  }), [stays, reservations, clients, rooms, query]);
  const selectedConsumptions = selected ? consumptions.filter((item) => item.stayId === selected.id) : [];
  const packageBenefits = reservation?.packageSnapshot?.structuredBenefits ?? [];
  const received = reservation ? receipts.filter((item) => item.reservationId === reservation.id && item.status === "Confirmado").reduce((total, item) => total + item.value, 0) : 0;
  const availableRooms = selected && reservation ? rooms.filter((item) => item.id !== selected.roomId && item.capacity >= reservation.guests && item.occupancyStatus === "Livre" && item.cleaningStatus === "Limpo" && item.maintenanceStatus === "Disponível") : [];
  const selectedProduct = products.find((item) => item.id === Number(consumption.productId));

  const manage = (id: number) => { setSelectedId(id); setModal("manage"); setMessage(""); };
  const saveTransfer = () => {
    if (!selected) return;
    const result = transferStayRoom(selected.id, Number(transfer.roomId), transfer.reason, transfer.responsible);
    if (!result.ok) return setMessage(result.error ?? "Não foi possível transferir.");
    setModal("manage"); setMessage("Quarto transferido. O quarto anterior foi encaminhado para limpeza.");
  };
  const saveConsumption = () => {
    if (!selected || !reservation) return;
    const result = recordConsumption({ stayId: selected.id, reservationId: reservation.id, productId: consumption.category === "Produto" ? Number(consumption.productId) : undefined, service: selectedProduct?.name ?? consumption.service, serviceCode: consumption.category === "Serviço" ? consumption.service : undefined, category: consumption.category, description: consumption.description, quantity: Number(consumption.quantity), unitPrice: Number(consumption.unitPrice), value: Number(consumption.quantity) * Number(consumption.unitPrice), responsible: consumption.responsible, includedInPackage: false });
    if (!result.ok) return setMessage(result.error ?? "Não foi possível lançar.");
    setModal("manage"); setMessage("Consumo lançado e fatura atualizada.");
  };
  const saveReverse = () => {
    const result = reverseConsumption(reverse.id, reverse.reason, reverse.responsible);
    if (!result.ok) return setMessage(result.error ?? "Não foi possível estornar.");
    setModal("manage"); setMessage("Estorno registrado e fatura recalculada.");
  };

  return <div className="ops-page">
    <PageHeader title="Hospedagens" />
    <Alert type="info">Gerencie a estadia ativa: quarto, consumos, valores e histórico operacional.</Alert>
    <Card>
      <div className="ops-filters"><div className="ops-filter-search"><Input label="Buscar por hóspede, CPF, quarto, código ou situação" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
      <Table headers={["Hospedagem", "Hóspede", "Quarto", "Check-in", "Saída prevista", "Hóspedes", "Situação", "Acumulado", "Recebido", "Saldo", "Ação"]} rows={filtered.map((stay) => {
        const itemReservation = reservations.find((item) => item.id === stay.reservationId);
        const itemRoom = rooms.find((item) => item.id === stay.roomId);
        const itemInvoice = invoices.find((item) => item.stayId === stay.id);
        const itemReceived = receipts.filter((item) => item.reservationId === stay.reservationId && item.status === "Confirmado").reduce((total, item) => total + item.value, 0);
        return [stay.code, stay.guest, `${itemRoom?.number ?? "—"} · ${itemRoom?.category ?? "—"}`, new Date(stay.checkedInAt).toLocaleString("pt-BR"), stay.expectedExit, String(itemReservation?.guests ?? 0), <Badge label={stay.status} />, formatMoney(itemInvoice?.total ?? 0), formatMoney(itemReceived), formatMoney(Math.max(0, (itemInvoice?.total ?? 0) - itemReceived)), <Btn small onClick={() => manage(stay.id)}>Gerenciar hospedagem</Btn>];
      })} />
    </Card>
    {modal === "manage" && selected && reservation && <Modal wide title={`Hospedagem ${selected.code}`} onClose={() => setModal(null)}>
      {message && <Alert type={message.includes("Não") ? "error" : "success"}>{message}</Alert>}
      <SectionTitle>Visão geral</SectionTitle><div className="summary-grid"><Info label="Responsável" value={selected.guest} /><Info label="Acompanhantes" value={selected.companions.filter(Boolean).join(", ") || "Nenhum"} /><Info label="Origem" value={selected.origin ?? "Reserva"} /><Info label="Quarto" value={`${room?.number ?? "—"} · ${room?.category ?? "—"}`} /><Info label="Entrada" value={new Date(selected.checkedInAt).toLocaleString("pt-BR")} /><Info label="Saída prevista" value={selected.expectedExit} /><Info label="Pacote" value={reservation.packageSnapshot?.name ?? "Tarifa convencional"} /></div>
      <SectionTitle>Financeiro</SectionTitle><div className="summary-grid"><Info label="Base" value={formatMoney(invoice?.baseValue ?? 0)} /><Info label="Extras" value={formatMoney(invoice?.extrasValue ?? 0)} /><Info label="Recebido" value={formatMoney(received)} /><Info label="Saldo" value={formatMoney(Math.max(0, (invoice?.total ?? 0) - received))} /></div>
      {packageBenefits.length > 0 && <><SectionTitle>Benefícios do pacote</SectionTitle><Table headers={["Benefício", "Cota", "Utilizado", "Saldo", "Excedente", "Cobrado"]} rows={packageBenefits.map((benefit) => { const related = selectedConsumptions.filter((item) => item.benefitId === benefit.id && item.status !== "Estornado"); const used = related.reduce((total, item) => total + (item.benefitCoveredQuantity ?? 0), 0); const excess = related.reduce((total, item) => total + (item.excessQuantity ?? 0), 0); const charged = related.reduce((total, item) => total + item.value, 0); const contractedLimit = benefit.quantityIncluded * (benefit.limitType === "Por diária" ? countNights(reservation.entry, reservation.exit) : 1); return [benefit.label, `${benefit.quantityIncluded} ${benefit.unit} · ${benefit.limitType}`, String(used), String(Math.max(0, contractedLimit - used)), String(excess), formatMoney(charged)]; })} /></>}
      <Table headers={["Recebimento", "Data", "Forma", "Valor", "Responsável"]} rows={receipts.filter((item) => item.reservationId === reservation.id).map((item) => [item.code, item.date, item.method, formatMoney(item.value), item.responsible ?? "—"])} />
      <SectionTitle>Consumos</SectionTitle><Btn small onClick={() => { setConsumption({ service: "Room Service", category: "Serviço", productId: "", quantity: "1", unitPrice: "0", description: "", responsible: "Recepção" }); setModal("consumption"); }}>+ Lançar consumo</Btn><Table headers={["Item", "Categoria", "Qtd.", "Unitário", "Total", "Situação", "Ação"]} rows={selectedConsumptions.map((item) => [item.service, item.category ?? "Serviço", String(item.quantity ?? 1), formatMoney(item.unitPrice ?? item.value), formatMoney(item.value), <Badge label={item.status ?? "Lançado"} />, item.status !== "Estornado" ? <Btn small variant="danger" onClick={() => { setReverse({ id: item.id, reason: "", responsible: "Recepção" }); setModal("reverse"); }}>Estornar</Btn> : "—"])} />
      <SectionTitle>Quarto e histórico</SectionTitle><div className="summary-grid"><Info label="Quarto atual" value={room?.number ?? "—"} /><Info label="Capacidade" value={`${room?.capacity ?? 0} hóspedes`} /><Info label="Histórico" value={`${selected.history?.length ?? 1} movimentação(ões)`} /></div><Btn small variant="secondary" onClick={() => { setTransfer({ roomId: "", reason: "", responsible: "Recepção" }); setModal("transfer"); }}>Trocar quarto</Btn>
      <div className="detail-list">{selected.history?.map((entry) => <p key={`${entry.at}-${entry.type}`}><strong>{entry.type}</strong> · {new Date(entry.at).toLocaleString("pt-BR")} · {entry.description}</p>)}</div><FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn><Btn onClick={() => window.dispatchEvent(new CustomEvent("hotel:open-checkout", { detail: reservation.id }))}>Realizar check-out</Btn></FormActions>
    </Modal>}
    {modal === "transfer" && selected && <Modal title="Trocar quarto" onClose={() => setModal("manage")}><Alert type="info">Fatura, pagamentos, consumos e pacote serão preservados. O quarto anterior ficará sujo para limpeza.</Alert><FormGrid cols={1}><Input label="Quarto atual" value={room?.number ?? ""} readOnly /><Select label="Novo quarto disponível" value={transfer.roomId} onChange={(event) => setTransfer({ ...transfer, roomId: event.target.value })}><option value="">Selecione</option>{availableRooms.map((item) => <option key={item.id} value={item.id}>{item.number} · {item.category} · capacidade {item.capacity}</option>)}</Select><Input label="Responsável" value={transfer.responsible} onChange={(event) => setTransfer({ ...transfer, responsible: event.target.value })} /><Textarea label="Motivo da transferência *" value={transfer.reason} onChange={(event) => setTransfer({ ...transfer, reason: event.target.value })} /></FormGrid><FormActions><Btn variant="ghost" onClick={() => setModal("manage")}>Cancelar</Btn><Btn disabled={!transfer.roomId || !transfer.reason.trim()} onClick={saveTransfer}>Confirmar transferência</Btn></FormActions></Modal>}
    {modal === "consumption" && <Modal title="Lançar consumo" onClose={() => setModal("manage")}><FormGrid cols={2}><Select label="Tipo" value={consumption.category} onChange={(event) => setConsumption({ ...consumption, category: event.target.value as "Produto" | "Serviço", productId: "", service: event.target.value === "Serviço" ? "Room Service" : "", unitPrice: "0" })}><option>Serviço</option><option>Produto</option></Select>{consumption.category === "Produto" ? <Select label="Produto ativo" value={consumption.productId} onChange={(event) => { const product = products.find((item) => item.id === Number(event.target.value)); setConsumption({ ...consumption, productId: event.target.value, service: product?.name ?? "", unitPrice: String(product?.unitPrice ?? 0) }); }}><option value="">Selecione</option>{products.filter((item) => item.status === "Ativo").map((item) => <option key={item.id} value={item.id}>{item.name} · disponível {item.quantity} {item.unit}</option>)}</Select> : <Input label="Serviço" value={consumption.service} onChange={(event) => setConsumption({ ...consumption, service: event.target.value })} />}<Input label="Quantidade" type="number" min="1" value={consumption.quantity} onChange={(event) => setConsumption({ ...consumption, quantity: event.target.value })} /><Input label="Valor unitário" type="number" min="0" step="0.01" value={consumption.unitPrice} onChange={(event) => setConsumption({ ...consumption, unitPrice: event.target.value })} /><Input label="Responsável" value={consumption.responsible} onChange={(event) => setConsumption({ ...consumption, responsible: event.target.value })} /><FullCol><Textarea label="Descrição" value={consumption.description} onChange={(event) => setConsumption({ ...consumption, description: event.target.value })} /></FullCol></FormGrid>{selectedProduct && <Alert type="info">Disponível: {selectedProduct.quantity} {selectedProduct.unit}.</Alert>}<FormActions><Btn variant="ghost" onClick={() => setModal("manage")}>Cancelar</Btn><Btn disabled={consumption.category === "Produto" && !selectedProduct} onClick={saveConsumption}>Lançar {formatMoney(Number(consumption.quantity) * Number(consumption.unitPrice))}</Btn></FormActions></Modal>}
    {modal === "reverse" && <Modal title="Estornar consumo" onClose={() => setModal("manage")}><Textarea label="Motivo *" value={reverse.reason} onChange={(event) => setReverse({ ...reverse, reason: event.target.value })} /><Input label="Responsável" value={reverse.responsible} onChange={(event) => setReverse({ ...reverse, responsible: event.target.value })} /><FormActions><Btn variant="ghost" onClick={() => setModal("manage")}>Cancelar</Btn><Btn variant="danger" disabled={!reverse.reason.trim()} onClick={saveReverse}>Confirmar estorno</Btn></FormActions></Modal>}
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="summary-item"><span>{label}</span><strong>{value}</strong></div>; }
