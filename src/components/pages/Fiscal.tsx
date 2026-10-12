import { useMemo, useState } from "react";
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
import {
  formatMoney,
  reservationBaseValue,
  today,
  useHotelOperations,
  type FiscalDocument,
  type FiscalDocumentInput,
  type FiscalDocumentType,
  type HotelFiscalProfile,
} from "../HotelOperationsContext";

type Tab = "dados" | "documentos";
type ModalMode = "emitir" | "consultar" | "cancelar" | null;

const emptyDocument = (): FiscalDocumentInput => ({
  type: "NFS-e",
  recipient: "",
  recipientDocument: "",
  description: "",
  value: 0,
  issueDate: today(),
  origin: "Manual",
});

export default function Fiscal() {
  const {
    fiscalProfile,
    fiscalDocuments,
    reservations,
    clients,
    events,
    getReservationFinancials,
    getEventFinancials,
    updateFiscalProfile,
    issueFiscalDocument,
    cancelFiscalDocument,
    reissueFiscalDocument,
  } = useHotelOperations();
  const [tab, setTab] = useState<Tab>("dados");
  const [modal, setModal] = useState<ModalMode>(null);
  const [profileForm, setProfileForm] = useState<HotelFiscalProfile>(fiscalProfile);
  const [docForm, setDocForm] = useState<FiscalDocumentInput>(emptyDocument);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ type: "", status: "", origin: "", search: "" });

  const selectedDocument = fiscalDocuments.find((document) => document.id === selectedId) ?? null;
  const emittedTotal = fiscalDocuments.filter((document) => document.status === "Emitida").reduce((total, document) => total + document.value, 0);
  const canceledCount = fiscalDocuments.filter((document) => document.status === "Cancelada").length;

  const origins = useMemo(() => [
    ...reservations.map((reservation) => {
      const client = clients.find((item) => item.id === reservation.clientId);
      const total = getReservationFinancials(reservation.id)?.total ?? reservationBaseValue(reservation);
      return {
        key: `res-${reservation.id}`,
        label: `${reservation.code} - ${reservation.guest} - ${formatMoney(total)}`,
        origin: "Hospedagem" as const,
        reservationId: reservation.id,
        recipient: reservation.guest,
        recipientDocument: client?.cpf ?? "",
        description: `Hospedagem ${reservation.code}`,
        value: total,
      };
    }),
    ...events.map((event) => {
      const total = getEventFinancials(event.id)?.total ?? event.totalContracted;
      return {
        key: `evt-${event.id}`,
        label: `${event.code} - ${event.name} - ${formatMoney(total)}`,
        origin: "Evento" as const,
        eventId: event.id,
        recipient: event.contractorName,
        recipientDocument: "",
        description: `Evento ${event.code} - ${event.name}`,
        value: total,
      };
    }),
  ], [reservations, clients, events]);

  const filteredDocuments = fiscalDocuments.filter((document) => {
    const term = filters.search.trim().toLowerCase();
    return (!term || `${document.number} ${document.recipient} ${document.description}`.toLowerCase().includes(term)) &&
      (!filters.type || document.type === filters.type) &&
      (!filters.status || document.status === filters.status) &&
      (!filters.origin || document.origin === filters.origin);
  });

  const saveProfile = () => {
    const result = updateFiscalProfile(profileForm);
    setMessage(result.ok ? "Dados fiscais atualizados." : result.error ?? "Nao foi possivel salvar.");
  };

  const openIssue = () => {
    setDocForm(emptyDocument());
    setMessage("");
    setModal("emitir");
  };

  const applyOrigin = (key: string) => {
    const origin = origins.find((item) => item.key === key);
    if (!origin) {
      setDocForm({ ...docForm, origin: "Manual", reservationId: undefined, eventId: undefined });
      return;
    }
    setDocForm({
      ...docForm,
      origin: origin.origin,
      reservationId: origin.reservationId,
      eventId: origin.eventId,
      recipient: origin.recipient,
      recipientDocument: origin.recipientDocument,
      description: origin.description,
      value: origin.value,
    });
  };

  const saveDocument = () => {
    const result = issueFiscalDocument(docForm);
    if (!result.ok) {
      setMessage(result.error ?? "Nao foi possivel emitir.");
      return;
    }
    setModal(null);
    setTab("documentos");
    setMessage("Documento fiscal emitido e preservado no historico.");
  };

  const cancelDocument = () => {
    if (!selectedDocument) return;
    const result = cancelFiscalDocument(selectedDocument.id, cancelReason);
    if (!result.ok) setMessage(result.error ?? "Nao foi possivel cancelar.");
    else {
      setModal(null);
      setMessage("Documento cancelado com historico preservado.");
    }
  };

  const reissue = (document: FiscalDocument) => {
    const result = reissueFiscalDocument(document.id);
    setMessage(result.ok ? "Documento reemitido com nova numeracao." : result.error ?? "Nao foi possivel reemitir.");
  };

  return <div className="ops-page">
    <PageHeader title="Fiscal" actions={tab === "documentos" ? <Btn onClick={openIssue}>+ Emitir Documento</Btn> : undefined} />
    {message && <Alert type={message.includes("Nao") ? "error" : "success"}>{message}</Alert>}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Metric label="Documentos emitidos" value={String(fiscalDocuments.filter((document) => document.status === "Emitida").length)} />
      <Metric label="Documentos cancelados" value={String(canceledCount)} />
      <Metric label="Valor documentado" value={formatMoney(emittedTotal)} />
      <Metric label="Regime tributario" value={fiscalProfile.taxRegime} />
    </div>

    <Tabs tabs={[{ id: "dados", label: "Dados fiscais" }, { id: "documentos", label: "Notas e recibos" }]} active={tab} onChange={setTab} />

    {tab === "dados" && <Card>
      <SectionTitle>Dados fiscais do hotel</SectionTitle>
      <FormGrid cols={2}>
        <Input label="Razao social" value={profileForm.legalName} onChange={(event) => setProfileForm({ ...profileForm, legalName: event.target.value })} />
        <Input label="Nome fantasia" value={profileForm.tradeName} onChange={(event) => setProfileForm({ ...profileForm, tradeName: event.target.value })} />
        <Input label="CNPJ" value={profileForm.document} onChange={(event) => setProfileForm({ ...profileForm, document: event.target.value })} />
        <Input label="Inscricao municipal" value={profileForm.municipalRegistration} onChange={(event) => setProfileForm({ ...profileForm, municipalRegistration: event.target.value })} />
        <Input label="Regime tributario" value={profileForm.taxRegime} onChange={(event) => setProfileForm({ ...profileForm, taxRegime: event.target.value })} />
        <FullCol><Input label="Endereco fiscal" value={profileForm.address} onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })} /></FullCol>
      </FormGrid>
      <FormActions><Btn onClick={saveProfile}>Salvar dados fiscais</Btn></FormActions>
    </Card>}

    {tab === "documentos" && <Card>
      <FormGrid cols={3}>
        <Input label="Buscar" placeholder="Numero, destinatario ou descricao" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <Select label="Tipo" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Todos</option><option>NFS-e</option><option>Recibo</option></Select>
        <Select label="Status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos</option><option>Emitida</option><option>Cancelada</option></Select>
        <Select label="Origem" value={filters.origin} onChange={(event) => setFilters({ ...filters, origin: event.target.value })}><option value="">Todas</option><option>Hospedagem</option><option>Evento</option><option>Manual</option></Select>
      </FormGrid>
      <Table headers={["Numero", "Tipo", "Destinatario", "Origem", "Valor", "Data", "Status", "Acoes"]} rows={filteredDocuments.map((document) => [
        document.number,
        document.type,
        document.recipient,
        document.origin,
        formatMoney(document.value),
        document.issueDate,
        <Badge label={document.status} />,
        <div className="table-actions">
          <Btn small variant="ghost" onClick={() => { setSelectedId(document.id); setModal("consultar"); }}>Consultar</Btn>
          <Btn small variant="secondary" onClick={() => reissue(document)}>Reemitir</Btn>
          {document.status !== "Cancelada" && <Btn small variant="danger" onClick={() => { setSelectedId(document.id); setCancelReason(""); setModal("cancelar"); }}>Cancelar</Btn>}
        </div>,
      ])} />
    </Card>}

    {modal === "emitir" && <Modal wide title="Emitir documento fiscal" onClose={() => setModal(null)}>
      <FormGrid cols={2}>
        <Select label="Tipo" value={docForm.type} onChange={(event) => setDocForm({ ...docForm, type: event.target.value as FiscalDocumentType })}><option>NFS-e</option><option>Recibo</option></Select>
        <Input label="Data de emissao" type="date" value={docForm.issueDate} onChange={(event) => setDocForm({ ...docForm, issueDate: event.target.value })} />
        <FullCol><Select label="Origem operacional" value={docForm.reservationId ? `res-${docForm.reservationId}` : docForm.eventId ? `evt-${docForm.eventId}` : ""} onChange={(event) => applyOrigin(event.target.value)}><option value="">Manual</option>{origins.map((origin) => <option key={origin.key} value={origin.key}>{origin.label}</option>)}</Select></FullCol>
        <Input label="Destinatario" value={docForm.recipient} onChange={(event) => setDocForm({ ...docForm, recipient: event.target.value })} />
        <Input label="Documento do destinatario" value={docForm.recipientDocument} onChange={(event) => setDocForm({ ...docForm, recipientDocument: event.target.value })} />
        <Input label="Valor" type="number" min="0.01" step="0.01" value={docForm.value} onChange={(event) => setDocForm({ ...docForm, value: Number(event.target.value) })} />
        <FullCol><Textarea label="Descricao" value={docForm.description} onChange={(event) => setDocForm({ ...docForm, description: event.target.value })} /></FullCol>
      </FormGrid>
      {message && <Alert type="error">{message}</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={saveDocument}>Emitir</Btn></FormActions>
    </Modal>}

    {modal === "consultar" && selectedDocument && <Modal wide title={selectedDocument.number} onClose={() => setModal(null)}>
      <FormGrid cols={2}>
        <Info label="Tipo" value={selectedDocument.type} />
        <Info label="Status" value={selectedDocument.status} />
        <Info label="Destinatario" value={selectedDocument.recipient} />
        <Info label="Documento" value={selectedDocument.recipientDocument || "Nao informado"} />
        <Info label="Origem" value={selectedDocument.origin} />
        <Info label="Valor" value={formatMoney(selectedDocument.value)} />
        <Info label="Emissao" value={formatDisplayDate(selectedDocument.issueDate)} />
        <Info label="Criado em" value={new Date(selectedDocument.createdAt).toLocaleString("pt-BR")} />
        <FullCol><Info label="Descricao" value={selectedDocument.description} /></FullCol>
      </FormGrid>
      {selectedDocument.cancelReason && <Alert type="warning">Cancelamento: {selectedDocument.cancelReason}</Alert>}
      {selectedDocument.reissuedFromId && <Alert type="info">Documento reemitido a partir do registro #{selectedDocument.reissuedFromId}.</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn></FormActions>
    </Modal>}

    {modal === "cancelar" && selectedDocument && <Modal title={`Cancelar ${selectedDocument.number}`} onClose={() => setModal(null)}>
      <Alert type="warning">O documento sera mantido no historico com status cancelado.</Alert>
      <Textarea label="Motivo" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
      {message && <Alert type="error">{message}</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Voltar</Btn><Btn variant="danger" onClick={cancelDocument}>Confirmar cancelamento</Btn></FormActions>
    </Modal>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="min-h-24"><p className="text-xs font-bold uppercase text-primary/70">{label}</p><p className="mt-2 text-2xl font-bold text-primary">{value}</p></Card>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-surface p-3"><p className="text-xs font-bold uppercase text-primary/70">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">{value}</p></div>;
}
