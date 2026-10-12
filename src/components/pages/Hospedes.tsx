import { useEffect, useState } from "react";
import {
  PageHeader, Card, Btn, Input, Select, Table, Modal,
  Alert, Badge, SectionTitle, Tabs, FormGrid, FullCol, FormActions, Icon, formatDisplayDate,
} from "../ui";
import { countNights, formatMoney, reservationBaseValue, useHotelOperations, type Client } from "../HotelOperationsContext";
import { useDemoEngine } from "../demo/DemoEngineContext";

const SERIF = "'Inria Serif', Georgia, serif";

/* ── tipos ───────────────────────────────────────────────────────────── */
type Documento = { nome: string; tipo: string; data: string };

type Hospede = {
  id: number;
  /* dados pessoais */
  nome: string;
  cpf: string;
  tipoDoc: string;       // RG | Passaporte
  numDoc: string;
  dataNasc: string;
  nacionalidade: string;
  genero: string;
  /* endereço */
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  /* contatos */
  email: string;
  tel: string;
  telEmergencia: string;
  nomeEmergencia: string;
  /* preferências */
  tipoQuartoPref: string;
  andarPref: string;
  fumante: string;
  observacoesPref: string;
  /* controle */
  status: string;
  documentos: Documento[];
};

const emptyForm = (): Omit<Hospede, "id" | "status" | "documentos"> => ({
  nome: "", cpf: "", tipoDoc: "RG", numDoc: "", dataNasc: "",
  nacionalidade: "Brasileira", genero: "",
  cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", estado: "",
  email: "", tel: "", telEmergencia: "", nomeEmergencia: "",
  tipoQuartoPref: "", andarPref: "", fumante: "Não", observacoesPref: "",
});

const mockForm = (): ReturnType<typeof emptyForm> => ({
  nome: "Mariana Alves Ferreira", cpf: "529.982.247-25", tipoDoc: "RG", numDoc: "1458296 SSP/RO", dataNasc: "1990-05-18",
  nacionalidade: "Brasileira", genero: "Feminino",
  cep: "76820-408", logradouro: "Rua das Seringueiras", numero: "245", complemento: "Apto 302",
  bairro: "Centro", cidade: "Porto Velho", estado: "RO",
  email: "mariana.ferreira.demo@pacaasnovos.com.br", tel: "(69) 99234-1188", telEmergencia: "(69) 99988-4411", nomeEmergencia: "Paulo Ferreira",
  tipoQuartoPref: "Luxo", andarPref: "Médio (3º-5º)", fumante: "Não", observacoesPref: "Prefere quarto silencioso e travesseiro extra.",
});

type ModalType = "new" | "edit" | "view" | "hist" | null;
type FormTab = "pessoal" | "endereco" | "contato" | "preferencias" | "documentos";

function clientToGuest(client: Client): Hospede {
  return {
    id: client.id, nome: client.name, cpf: client.cpf, tipoDoc: client.documentType,
    numDoc: client.documentNumber, dataNasc: client.birthDate, nacionalidade: client.nationality,
    genero: client.gender, cep: client.postalCode, logradouro: client.street,
    numero: client.addressNumber, complemento: client.complement, bairro: client.district,
    cidade: client.city, estado: client.state, email: client.email, tel: client.phone,
    telEmergencia: client.emergencyPhone, nomeEmergencia: client.emergencyContact,
    tipoQuartoPref: client.preferredRoomType, andarPref: client.preferredFloor,
    fumante: client.smoker, observacoesPref: client.preferences, status: client.status,
    documentos: client.documents.map((document) => ({ nome: document.name, tipo: document.type, data: document.date })),
  };
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function formatCpf(value: string) {
  const digits = onlyDigits(value, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatCep(value: string) {
  return onlyDigits(value, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value, 11);
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_match, ddd, first, second) => `${ddd ? `(${ddd}) ` : ""}${first}${second ? `-${second}` : ""}`.trim());
  return digits.replace(/^(\d{2})(\d{0,5})(\d{0,4}).*/, (_match, ddd, first, second) => `${ddd ? `(${ddd}) ` : ""}${first}${second ? `-${second}` : ""}`.trim());
}

/* ── utilitários de exibição ─────────────────────────────────────────── */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.87rem", color: value ? "var(--text-strong)" : "var(--border)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

/* ── componente principal ────────────────────────────────────────────── */
export default function Hospedes() {
  const { clients, setClients, reservations, rooms, stays, createClient, updateClient } = useHotelOperations();
  const data = clients.map(clientToGuest);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Hospede | null>(null);
  const [formTab, setFormTab] = useState<FormTab>("pessoal");
  const [form, setForm] = useState(emptyForm());
  const [validation, setValidation] = useState("");
  const [demoScenarioKey, setDemoScenarioKey] = useState("");
  const demo = useDemoEngine();

  const filtered = data.filter((h) =>
    h.nome.toLowerCase().includes(search.toLowerCase()) ||
    h.cpf.includes(search) ||
    h.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setDemoScenarioKey("");
    setForm(mockForm());
    setFormTab("pessoal");
    setValidation("");
    setModal("new");
  };

  const openEdit = (h: Hospede) => {
    setDemoScenarioKey("");
    setSelected(h);
    setForm({
      nome: h.nome, cpf: h.cpf, tipoDoc: h.tipoDoc, numDoc: h.numDoc,
      dataNasc: h.dataNasc, nacionalidade: h.nacionalidade, genero: h.genero,
      cep: h.cep, logradouro: h.logradouro, numero: h.numero,
      complemento: h.complemento, bairro: h.bairro, cidade: h.cidade, estado: h.estado,
      email: h.email, tel: h.tel, telEmergencia: h.telEmergencia, nomeEmergencia: h.nomeEmergencia,
      tipoQuartoPref: h.tipoQuartoPref, andarPref: h.andarPref,
      fumante: h.fumante, observacoesPref: h.observacoesPref,
    });
    setFormTab("pessoal");
    setModal("edit");
  };

  const f = (k: keyof ReturnType<typeof emptyForm>, v: string) =>
    setForm((prev) => ({
      ...prev,
      [k]: k === "cpf" ? formatCpf(v) : k === "cep" ? formatCep(v) : k === "tel" || k === "telEmergencia" ? formatPhone(v) : v,
    }));

  useEffect(() => {
    const command = demo.activeCommand;
    if (!command || command.target !== "hospedes") return;
    const payload = command.payload;
    const scenarioKey = demo.scenario?.scenarioKey ?? "";
    const existing = clients.find((client) => client.email === String(payload.email ?? "") && client.scenarioKey === scenarioKey);
    const fillPersonal = () => setForm((current) => ({
      ...current,
      nome: String(payload.name ?? ""),
      cpf: String(payload.cpf ?? ""),
      numDoc: String(payload.documentNumber ?? ""),
      dataNasc: String(payload.birthDate ?? ""),
      genero: String(payload.gender ?? ""),
    }));
    const fillContact = () => setForm((current) => ({
      ...current,
      tel: String(payload.phone ?? ""),
      email: String(payload.email ?? ""),
      nomeEmergencia: String(payload.emergencyContact ?? ""),
      telEmergencia: String(payload.emergencyPhone ?? ""),
    }));
    const fillAddress = () => setForm((current) => ({
      ...current,
      cep: String(payload.postalCode ?? ""),
      logradouro: String(payload.street ?? ""),
      numero: String(payload.addressNumber ?? ""),
      bairro: String(payload.district ?? ""),
      cidade: String(payload.city ?? ""),
      estado: String(payload.state ?? ""),
    }));
    const fillPreferences = () => setForm((current) => ({
      ...current,
      tipoQuartoPref: String(payload.preferredRoomType ?? ""),
      andarPref: String(payload.preferredFloor ?? ""),
      observacoesPref: String(payload.preferences ?? ""),
    }));

    if (command.command === "open-client-form") {
      setSelected(null);
      setDemoScenarioKey(scenarioKey);
      setValidation("");
      setForm(emptyForm());
      setFormTab("pessoal");
      setModal("new");
      demo.resolveCommand(command.id, { status: "completed", message: "Formulario de cadastro aberto." });
    } else if (command.command === "fill-client-personal") {
      setDemoScenarioKey(scenarioKey);
      setModal("new");
      setFormTab("pessoal");
      fillPersonal();
      demo.resolveCommand(command.id, { status: "completed", message: "Dados pessoais preenchidos." });
    } else if (command.command === "fill-client-contact") {
      setDemoScenarioKey(scenarioKey);
      setModal("new");
      setFormTab("contato");
      fillContact();
      demo.resolveCommand(command.id, { status: "completed", message: "Contatos preenchidos." });
    } else if (command.command === "fill-client-address") {
      setDemoScenarioKey(scenarioKey);
      setModal("new");
      setFormTab("endereco");
      fillAddress();
      demo.resolveCommand(command.id, { status: "completed", message: "Endereco preenchido." });
    } else if (command.command === "fill-client-preferences") {
      setDemoScenarioKey(scenarioKey);
      setModal("new");
      setFormTab("preferencias");
      fillPreferences();
      demo.resolveCommand(command.id, { status: "completed", message: "Preferencias prontas para revisao." });
    } else if (command.command === "save-client") {
      if (existing) {
        setSearch(existing.name);
        setModal(null);
        demo.resolveCommand(command.id, { status: "completed", message: "Hospede ja existia neste cenario e foi localizado.", ids: { clientId: existing.id } });
        return;
      }
      const input = {
        name: String(payload.name ?? ""), cpf: String(payload.cpf ?? ""), documentType: "RG", documentNumber: String(payload.documentNumber ?? ""),
        birthDate: String(payload.birthDate ?? ""), nationality: "Brasileira", gender: String(payload.gender ?? ""),
        postalCode: String(payload.postalCode ?? ""), street: String(payload.street ?? ""), addressNumber: String(payload.addressNumber ?? ""),
        complement: "", district: String(payload.district ?? ""), city: String(payload.city ?? ""), state: String(payload.state ?? ""),
        email: String(payload.email ?? ""), phone: String(payload.phone ?? ""), emergencyPhone: String(payload.emergencyPhone ?? ""),
        emergencyContact: String(payload.emergencyContact ?? ""), preferredRoomType: String(payload.preferredRoomType ?? ""),
        preferredFloor: String(payload.preferredFloor ?? ""), smoker: "NÃ£o", preferences: String(payload.preferences ?? ""),
        scenarioKey: scenarioKey || undefined,
        documents: [],
      };
      const result = createClient(input);
      if (!result.ok || !result.client) {
        setValidation(result.error ?? "Nao foi possivel salvar o hospede.");
        setFormTab("pessoal");
        setModal("new");
        demo.resolveCommand(command.id, { status: "error", message: result.error ?? "Nao foi possivel salvar o hospede." });
        return;
      }
      setSearch(result.client.name);
      setModal(null);
      demo.resolveCommand(command.id, { status: "completed", message: "Hospede salvo e exibido na tabela.", ids: { clientId: result.client.id } });
    }
  }, [demo.activeCommand]);

  useEffect(() => {
    const command = demo.activeCommand;
    if (!command || command.target !== "hospedes" || command.command !== "prefill-client-form-disabled") return;
    const delay = command.speed === "slow" ? 520 : command.speed === "fast" ? 70 : 220;
    const payload = command.payload;
    const timers: number[] = [];
    setSelected(null);
    setDemoScenarioKey(demo.scenario?.scenarioKey ?? "");
    setValidation("");
    setForm(emptyForm());
    setFormTab("pessoal");
    setModal("new");
    const schedule = (position: number, action: () => void) => timers.push(window.setTimeout(action, delay * position));
    schedule(1, () => setForm((current) => ({ ...current, nome: String(payload.name ?? "") })));
    schedule(2, () => setForm((current) => ({ ...current, cpf: String(payload.cpf ?? "") })));
    schedule(3, () => {
      setFormTab("contato");
      setForm((current) => ({ ...current, tel: String(payload.phone ?? ""), email: String(payload.email ?? "") }));
    });
    schedule(4, () => {
      setFormTab("endereco");
      setForm((current) => ({
        ...current,
        cep: String(payload.postalCode ?? ""), logradouro: String(payload.street ?? ""),
        numero: String(payload.addressNumber ?? ""), bairro: String(payload.district ?? ""),
        cidade: String(payload.city ?? ""), estado: String(payload.state ?? ""),
      }));
    });
    schedule(5, () => {
      setFormTab("preferencias");
      setForm((current) => ({ ...current, observacoesPref: String(payload.preferences ?? "") }));
    });
    schedule(6, () => {
      setFormTab("pessoal");
      demo.resolveCommand(command.id, {
        status: "running",
        message: "Formulário real preenchido. Revise as abas e use Salvar Hóspede; nenhum registro foi gravado automaticamente.",
      });
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [demo.activeCommand]);

  useEffect(() => {
    const command = demo.activeCommand;
    if (!command || command.target !== "hospedes" || command.command !== "open-client-history") return;
    const guest = data.find((item) => item.id === demo.scenario?.ids.clientId);
    if (!guest) {
      demo.resolveCommand(command.id, { status: "error", message: "Cliente do cenário não encontrado." });
      return;
    }
    setSelected(guest);
    setModal("hist");
    demo.resolveCommand(command.id, { status: "running", message: "Histórico do cliente aberto e vinculado à hospedagem real." });
  }, [demo.activeCommand]);

  const save = () => {
    const cepDigits = onlyDigits(form.cep, 8);
    const phoneDigits = onlyDigits(form.tel, 11);
    const emergencyDigits = onlyDigits(form.telEmergencia, 11);
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setValidation("Informe um e-mail válido.");
      setFormTab("contato");
      return;
    }
    if (phoneDigits.length < 10) {
      setValidation("Informe um telefone com DDD.");
      setFormTab("contato");
      return;
    }
    if (form.telEmergencia && emergencyDigits.length < 10) {
      setValidation("Informe um telefone de emergência com DDD ou deixe o campo vazio.");
      setFormTab("contato");
      return;
    }
    if (form.cep && cepDigits.length !== 8) {
      setValidation("Informe o CEP no formato 00000-000 ou deixe o campo vazio.");
      setFormTab("endereco");
      return;
    }
    const input = {
      name: form.nome, cpf: form.cpf, documentType: form.tipoDoc, documentNumber: form.numDoc,
      birthDate: form.dataNasc, nationality: form.nacionalidade, gender: form.genero,
      postalCode: form.cep, street: form.logradouro, addressNumber: form.numero, complement: form.complemento,
      district: form.bairro, city: form.cidade, state: form.estado, email: form.email, phone: form.tel,
      emergencyPhone: form.telEmergencia, emergencyContact: form.nomeEmergencia,
      preferredRoomType: form.tipoQuartoPref, preferredFloor: form.andarPref, smoker: form.fumante,
      preferences: form.observacoesPref,
      scenarioKey: demoScenarioKey || undefined,
      documents: selected?.documentos.map((document) => ({ name: document.nome, type: document.tipo, date: document.data })) ?? [],
    };
    const result = modal === "new" ? createClient(input) : selected ? updateClient(selected.id, input) : { ok: false, error: "Cliente não selecionado." };
    if (!result.ok) {
      setValidation(result.error ?? "Não foi possível salvar o cliente.");
      setFormTab("pessoal");
      return;
    }
    setModal(null);
  };

  const formTabs: { id: FormTab; label: string }[] = [
    { id: "pessoal",     label: "Dados Pessoais"  },
    { id: "endereco",    label: "Endereço"         },
    { id: "contato",     label: "Contatos"         },
    { id: "preferencias",label: "Preferências"     },
    { id: "documentos",  label: "Documentos"       },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Hóspedes"
        actions={<span data-demo-target="new-client-button"><Btn onClick={openNew}>+ Cadastrar Hóspede</Btn></span>}
      />

      <Card>
        <div style={{ marginBottom: "16px", maxWidth: "340px" }}>
          <Input
            label="Buscar"
            placeholder="Nome, CPF ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table
          headers={["Nome", "CPF", "Documento", "Contato", "Cidade", "Status", "Ações"]}
          rows={filtered.map((h) => [
            h.nome,
            h.cpf,
            `${h.tipoDoc}: ${h.numDoc}`,
            h.tel,
            h.cidade || "—",
            <Badge label={h.status} color="green" />,
            <div style={{ display: "flex", gap: "6px" }}>
              <Btn small variant="ghost"     onClick={() => { setSelected(h); setModal("view"); }}>Ver</Btn>
              <Btn small variant="secondary" onClick={() => openEdit(h)}>Editar</Btn>
              <Btn small variant="ghost"     onClick={() => { setSelected(h); setModal("hist"); }}>Histórico</Btn>
            </div>,
          ])}
        />
      </Card>

      {/* ── Modal Cadastro / Edição ───────────────────────────────── */}
      {(modal === "new" || modal === "edit") && (
        <Modal
          title={modal === "new" ? "Cadastrar Hóspede" : `Editar — ${selected?.nome}`}
          onClose={() => setModal(null)}
          wide
        >
          {/* tabs do formulário */}
          <div style={{ marginBottom: "20px" }}>
            <Tabs tabs={formTabs} active={formTab} onChange={setFormTab} />
          </div>

          {/* ── Dados Pessoais ── */}
          {formTab === "pessoal" && (
            <div data-demo-target="client-personal-section"><FormGrid cols={2}>
              {validation && <FullCol><Alert type="error">{validation}</Alert></FullCol>}
              <FullCol>
                <Input data-demo-field="client-name" label="Nome completo *" value={form.nome} onChange={(e) => f("nome", e.target.value)} />
              </FullCol>
              <Input data-demo-field="client-cpf" label="CPF *" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => f("cpf", e.target.value)} />
              <Input label="Data de nascimento" type="date" value={form.dataNasc} onChange={(e) => f("dataNasc", e.target.value)} />
              <Select label="Tipo de documento *" value={form.tipoDoc} onChange={(e) => f("tipoDoc", e.target.value)}>
                <option>RG</option>
                <option>Passaporte</option>
                <option>CNH</option>
                <option>RNE</option>
              </Select>
              <Input label="Número do documento *" value={form.numDoc} onChange={(e) => f("numDoc", e.target.value)} />
              <Select label="Nacionalidade" value={form.nacionalidade} onChange={(e) => f("nacionalidade", e.target.value)}>
                <option>Brasileira</option>
                <option>Portuguesa</option>
                <option>Argentina</option>
                <option>Boliviana</option>
                <option>Colombiana</option>
                <option>Outra</option>
              </Select>
              <Select label="Gênero" value={form.genero} onChange={(e) => f("genero", e.target.value)}>
                <option value="">Não informado</option>
                <option>Masculino</option>
                <option>Feminino</option>
                <option>Outro</option>
              </Select>
              <FormActions>
                <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
                <Btn variant="secondary" onClick={() => setFormTab("endereco")}>Próximo →</Btn>
              </FormActions>
            </FormGrid></div>
          )}

          {/* ── Endereço ── */}
          {formTab === "endereco" && (
            <div data-demo-target="client-address-section"><FormGrid cols={2}>
              <Input label="CEP" placeholder="00000-000" value={form.cep} onChange={(e) => f("cep", e.target.value)} />
              <Select label="Estado (UF)" value={form.estado} onChange={(e) => f("estado", e.target.value)}>
                <option value="">Selecione</option>
                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
                <option value="EX">Exterior</option>
              </Select>
              <FullCol>
                <Input label="Logradouro (Rua / Av.)" value={form.logradouro} onChange={(e) => f("logradouro", e.target.value)} />
              </FullCol>
              <Input label="Número" value={form.numero} onChange={(e) => f("numero", e.target.value)} />
              <Input label="Complemento" placeholder="Apto, bloco…" value={form.complemento} onChange={(e) => f("complemento", e.target.value)} />
              <Input label="Bairro" value={form.bairro} onChange={(e) => f("bairro", e.target.value)} />
              <Input label="Cidade" value={form.cidade} onChange={(e) => f("cidade", e.target.value)} />
              <FormActions>
                <Btn variant="ghost" onClick={() => setFormTab("pessoal")}>← Anterior</Btn>
                <Btn variant="secondary" onClick={() => setFormTab("contato")}>Próximo →</Btn>
              </FormActions>
            </FormGrid></div>
          )}

          {/* ── Contatos ── */}
          {formTab === "contato" && (
            <div data-demo-target="client-contact-section"><FormGrid cols={2}>
              <Input label="E-mail *" type="email" value={form.email} onChange={(e) => f("email", e.target.value)} />
              <Input label="Telefone / WhatsApp *" placeholder="(00) 00000-0000" value={form.tel} onChange={(e) => f("tel", e.target.value)} />
              <Input label="Nome do contato de emergência" value={form.nomeEmergencia} onChange={(e) => f("nomeEmergencia", e.target.value)} />
              <Input label="Telefone de emergência" placeholder="(00) 00000-0000" value={form.telEmergencia} onChange={(e) => f("telEmergencia", e.target.value)} />
              <FormActions>
                <Btn variant="ghost" onClick={() => setFormTab("endereco")}>← Anterior</Btn>
                <Btn variant="secondary" onClick={() => setFormTab("preferencias")}>Próximo →</Btn>
              </FormActions>
            </FormGrid></div>
          )}

          {/* ── Preferências ── */}
          {formTab === "preferencias" && (
            <div data-demo-target="client-preferences-section"><FormGrid cols={2}>
              <Select label="Tipo de quarto preferido" value={form.tipoQuartoPref} onChange={(e) => f("tipoQuartoPref", e.target.value)}>
                <option value="">Sem preferência</option>
                <option>Standard</option>
                <option>Luxo</option>
                <option>Suíte</option>
              </Select>
              <Select label="Preferência de andar" value={form.andarPref} onChange={(e) => f("andarPref", e.target.value)}>
                <option value="">Sem preferência</option>
                <option>Baixo (1º–2º)</option>
                <option>Médio (3º–5º)</option>
                <option>Alto (6º+)</option>
                <option>Qualquer</option>
              </Select>
              <Select label="Fumante" value={form.fumante} onChange={(e) => f("fumante", e.target.value)}>
                <option>Não</option>
                <option>Sim</option>
              </Select>
              <FullCol>
                <Input label="Observações / preferências adicionais" placeholder="Alergias, acessibilidade, berço, etc." value={form.observacoesPref} onChange={(e) => f("observacoesPref", e.target.value)} />
              </FullCol>
              <FormActions>
                <Btn variant="ghost" onClick={() => setFormTab("contato")}>← Anterior</Btn>
                <Btn variant="secondary" onClick={() => setFormTab("documentos")}>Próximo →</Btn>
              </FormActions>
            </FormGrid></div>
          )}

          {/* ── Documentos ── */}
          {formTab === "documentos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  border: "2px dashed var(--border)",
                  borderRadius: "12px",
                  padding: "28px",
                  textAlign: "center",
                  background: "var(--bg-card)",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", justifyContent: "center", marginBottom: "6px", color: "var(--brand-700)" }}><Icon name="paperclip" /></span>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem", color: "var(--brand-700)", marginBottom: "4px" }}>
                  Arraste ou clique para anexar documento
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Formatos aceitos: PDF, JPG, PNG · Máx. 5 MB por arquivo
                </p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} />
              </div>

              {selected && selected.documentos.length > 0 && (
                <div>
                  <SectionTitle>Documentos anexados</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selected.documentos.map((doc, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          background: "var(--bg-card)",
                          borderRadius: "10px",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ display: "flex", color: "var(--text-muted)" }}><Icon name="file-text" /></span>
                          <div>
                            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-strong)" }}>{doc.nome}</p>
                            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{doc.tipo} · Enviado em {doc.data}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Btn small variant="ghost" onClick={() => window.alert(`Documento simulado: ${doc.nome} (${doc.tipo}). O protótipo preserva apenas os metadados locais.`)}>Ver</Btn>
                          <Btn small variant="danger" onClick={() => {
                            if (!selected) return;
                            setClients((current) => current.map((client) => client.id === selected.id ? { ...client, documents: client.documents.filter((_, index) => index !== i) } : client));
                            setSelected({ ...selected, documentos: selected.documentos.filter((_, index) => index !== i) });
                          }}>Excluir</Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <Btn variant="ghost" onClick={() => setFormTab("preferencias")}>← Anterior</Btn>
                <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
                <span data-demo-target="client-save-action"><Btn onClick={save}>Salvar Hóspede</Btn></span>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal Visualização completa ───────────────────────────── */}
      {modal === "view" && selected && (
        <Modal title={`Ficha — ${selected.nome}`} onClose={() => setModal(null)} wide>
          <Tabs
            tabs={formTabs}
            active={formTab}
            onChange={setFormTab}
          />

          <div style={{ marginTop: "20px" }}>
            {formTab === "pessoal" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="Nome completo"   value={selected.nome} />
                <Field label="CPF"             value={selected.cpf} />
                <Field label="Data de nascimento" value={formatDisplayDate(selected.dataNasc)} />
                <Field label="Gênero"          value={selected.genero} />
                <Field label="Tipo de documento" value={selected.tipoDoc} />
                <Field label="Nº documento"    value={selected.numDoc} />
                <Field label="Nacionalidade"   value={selected.nacionalidade} />
                <Field label="Status"          value={selected.status} />
              </div>
            )}

            {formTab === "endereco" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="CEP"         value={selected.cep} />
                <Field label="Estado"      value={selected.estado} />
                <Field label="Logradouro"  value={selected.logradouro} />
                <Field label="Número"      value={selected.numero} />
                <Field label="Complemento" value={selected.complemento} />
                <Field label="Bairro"      value={selected.bairro} />
                <Field label="Cidade"      value={selected.cidade} />
              </div>
            )}

            {formTab === "contato" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="E-mail"              value={selected.email} />
                <Field label="Telefone"            value={selected.tel} />
                <Field label="Contato emergência"  value={selected.nomeEmergencia} />
                <Field label="Tel. emergência"     value={selected.telEmergencia} />
              </div>
            )}

            {formTab === "preferencias" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="Tipo de quarto pref." value={selected.tipoQuartoPref} />
                <Field label="Andar preferido"      value={selected.andarPref} />
                <Field label="Fumante"              value={selected.fumante} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Observações"        value={selected.observacoesPref} />
                </div>
              </div>
            )}

            {formTab === "documentos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selected.documentos.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
                    Nenhum documento anexado.
                  </p>
                ) : (
                  selected.documentos.map((doc, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        background: "var(--bg-card)",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ display: "flex", color: "var(--text-muted)" }}><Icon name="file-text" /></span>
                      <div>
                        <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-strong)" }}>{doc.nome}</p>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{doc.tipo} · {doc.data}</p>
                      </div>
                      <Btn small variant="ghost" onClick={() => window.alert(`Documento simulado: ${doc.nome} (${doc.tipo}). O protótipo preserva apenas os metadados locais.`)}>Ver</Btn>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
            <Btn variant="secondary" onClick={() => openEdit(selected)}>Editar</Btn>
          </div>
        </Modal>
      )}

      {/* ── Modal Histórico ───────────────────────────────────────── */}
      {modal === "hist" && selected && (
        <Modal title={`Histórico de Hospedagens — ${selected.nome}`} onClose={() => setModal(null)} wide>
          <SectionTitle>Estadias registradas</SectionTitle>
          <Table
            headers={["Reserva", "Quarto", "Entrada efetiva", "Saída efetiva", "Diárias", "Valor contratado", "Status"]}
            rows={stays.filter((stay) => stay.clientId === selected.id && stay.status === "Encerrada").map((stay) => {
              const reservation = reservations.find((item) => item.id === stay.reservationId);
              return [
                reservation?.code ?? "—",
                rooms.find((room) => room.id === stay.roomId)?.number ?? "—",
                new Date(stay.checkedInAt).toLocaleString("pt-BR"),
                stay.checkedOutAt ? new Date(stay.checkedOutAt).toLocaleString("pt-BR") : "—",
                reservation ? String(countNights(reservation.entry, reservation.exit)) : "—",
                reservation ? formatMoney(reservationBaseValue(reservation)) : "—",
                <Badge label="Finalizado" color="green" />,
              ];
            })}
          />
          <Alert type="info">O histórico é gerado automaticamente a partir das hospedagens concluídas e permanece somente para consulta.</Alert>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
