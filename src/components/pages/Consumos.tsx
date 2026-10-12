import { useEffect, useState } from "react";
import { Alert, Badge, Btn, Card, FormActions, FormGrid, FullCol, Input, KpiCard, Modal, PageHeader, Select, Table } from "../ui";
import { formatMoney, useHotelOperations } from "../HotelOperationsContext";
import { useDemoEngine } from "../demo/DemoEngineContext";

const services = ["Café da manhã", "Decoração especial", "Jantar romântico", "Trilha guiada", "Ingresso parque nacional", "Restaurante", "Frigobar", "Room Service", "Lavanderia", "Spa", "Outros"];

export default function Consumos() {
  const { reservations, rooms, stays, consumptions, recordConsumption } = useHotelOperations();
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({ reservationId: "", service: "Restaurante", description: "", value: "" });
  const demo = useDemoEngine();
  const activeStays = stays.filter((stay) => stay.status === "Ativa").map((stay) => reservations.find((reservation) => reservation.id === stay.reservationId)).filter((reservation) => Boolean(reservation)) as typeof reservations;
  const selectedStay = activeStays.find((reservation) => reservation.id === Number(form.reservationId));
  const selectedStayRecord = stays.find((stay) => stay.reservationId === selectedStay?.id && stay.status === "Ativa");
  const includedBenefits = selectedStay?.packageSnapshot?.benefits ?? [];
  const included = includedBenefits.some((benefit) => benefit.toLocaleLowerCase("pt-BR") === form.service.toLocaleLowerCase("pt-BR"));
  const filtered = consumptions.filter((consumption) => {
    const reservation = reservations.find((item) => item.id === consumption.reservationId);
    const room = rooms.find((item) => item.id === reservation?.roomId);
    return !search || reservation?.guest.toLowerCase().includes(search.toLowerCase()) || room?.number.includes(search);
  });

  useEffect(() => {
    const command = demo.activeCommand;
    if (!command || command.target !== "consumos" || command.command !== "prefill-consumption-form") return;
    const reservation = reservations.find((item) => item.id === demo.scenario?.ids.reservationId);
    if (!reservation) {
      demo.resolveCommand(command.id, { status: "error", message: "Hospedagem do cenário não encontrada." });
      return;
    }
    setForm({ reservationId: String(reservation.id), service: String(command.payload.service), description: "Consumo fictício da jornada demonstrativa.", value: String(command.payload.value) });
    setFeedback("");
    setModal(true);
    demo.resolveCommand(command.id, { status: "running", message: "Consumo preenchido. Use Lançar para confirmar." });
  }, [demo.activeCommand]);

  useEffect(() => {
    if (!modal || form.reservationId || form.description || form.value) return;
    const stay = activeStays[0];
    setForm({
      reservationId: stay ? String(stay.id) : "",
      service: "Room Service",
      description: "Jantar demonstrativo lançado na hospedagem.",
      value: "120",
    });
  }, [modal]);

  const save = () => {
    if (!selectedStay || (!included && Number(form.value) <= 0)) return;
    if (!selectedStayRecord) return;
    const result = recordConsumption({
      stayId: selectedStayRecord.id,
      reservationId: selectedStay.id,
      service: form.service,
      description: form.description,
      value: included ? 0 : Number(form.value),
      includedInPackage: included,
      scenarioKey: selectedStay.scenarioKey,
    });
    if (!result.ok) return;
    setModal(false);
    setFeedback(included ? "Benefício registrado sem cobrança adicional." : "Consumo extra lançado na hospedagem.");
  };

  const extrasTotal = consumptions.filter((item) => !item.includedInPackage).reduce((total, item) => total + item.value, 0);
  const benefitsUsed = consumptions.filter((item) => item.includedInPackage).length;

  return <div className="ops-page">
    <PageHeader title="Consumos" actions={<Btn onClick={() => { setForm({ reservationId: "", service: "Restaurante", description: "", value: "" }); setFeedback(""); setModal(true); }}>+ Lançar Consumo</Btn>} />
    {feedback && <Alert type="success">{feedback}</Alert>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Hospedagens ativas" value={String(activeStays.length)} icon="hotel" />
      <KpiCard label="Lançamentos" value={String(consumptions.length)} icon="file-text" />
      <KpiCard label="Benefícios utilizados" value={String(benefitsUsed)} icon="gift" />
      <KpiCard label="Extras acumulados" value={formatMoney(extrasTotal)} icon="banknote" />
    </div>
    <Card>
      <div className="ops-filters"><div className="ops-filter-search"><Input label="Buscar por hóspede ou quarto" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
      <Table headers={["Hospedagem", "Hóspede", "Quarto", "Serviço", "Descrição", "Classificação", "Valor", "Data/Hora"]} rows={filtered.map((consumption) => {
        const reservation = reservations.find((item) => item.id === consumption.reservationId);
        const room = rooms.find((item) => item.id === reservation?.roomId);
        return [reservation?.code.replace("RES", "HOS") ?? "—", reservation?.guest ?? "—", room?.number ?? "—", consumption.service, consumption.description || "—", <Badge label={consumption.includedInPackage ? "Incluso no pacote" : "Extra"} />, formatMoney(consumption.value), new Date(consumption.createdAt).toLocaleString("pt-BR")];
      })} />
    </Card>

    {modal && <Modal title="Lançar Consumo ou Benefício" onClose={() => setModal(false)}>
      <FormGrid cols={2}>
        <FullCol><Select label="Hospedagem ativa *" value={form.reservationId} onChange={(event) => setForm({ ...form, reservationId: event.target.value })}><option value="">Selecione</option>{activeStays.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.code.replace("RES", "HOS")} — {reservation.guest} · quarto {rooms.find((room) => room.id === reservation.roomId)?.number}</option>)}</Select></FullCol>
        <Input label="Hóspede" value={selectedStay?.guest ?? ""} readOnly />
        <Input label="Quarto" value={rooms.find((room) => room.id === selectedStay?.roomId)?.number ?? ""} readOnly />
        <FullCol><Select label="Serviço *" value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value, value: "" })}>{services.map((service) => <option key={service}>{service}</option>)}</Select></FullCol>
        <FullCol><Input label="Descrição" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FullCol>
        <Input label="Valor *" type="number" min="0" step="0.01" disabled={included} value={included ? "0" : form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
      </FormGrid>
      {selectedStay?.packageSnapshot && <Alert type="info">Benefícios disponíveis: {includedBenefits.join(" · ")}.</Alert>}
      {included && <Alert type="success">{form.service} está contemplado pelo pacote e será registrado sem nova cobrança.</Alert>}
      {!included && selectedStay && <Alert type="warning">Este serviço será lançado como extra no check-out.</Alert>}
      {activeStays.length === 0 && <Alert type="warning">Não há hospedagem ativa disponível para lançamentos.</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn disabled={!selectedStay || (!included && Number(form.value) <= 0)} onClick={save}>Lançar</Btn></FormActions>
    </Modal>}
  </div>;
}
