import { useState } from "react";
import {
  PageHeader, Card, Btn, Input, Select, Table, Modal,
  Badge, SectionTitle, Tabs, FormGrid, FullCol, FormActions,
} from "../ui";

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

const initialData: Hospede[] = [
  {
    id: 1,
    nome: "Ana Souza", cpf: "123.456.789-00", tipoDoc: "RG", numDoc: "1234567",
    dataNasc: "1990-04-15", nacionalidade: "Brasileira", genero: "Feminino",
    cep: "76801-000", logradouro: "Av. das Palmeiras", numero: "100",
    complemento: "", bairro: "Centro", cidade: "Porto Velho", estado: "RO",
    email: "ana@email.com", tel: "(69) 99999-0001", telEmergencia: "(69) 98888-9999", nomeEmergencia: "Carlos Souza",
    tipoQuartoPref: "Suíte", andarPref: "Alto", fumante: "Não", observacoesPref: "Prefere cama queen",
    status: "Ativo", documentos: [{ nome: "RG digitalizado", tipo: "PDF", data: "10/01/2026" }],
  },
  {
    id: 2,
    nome: "Pedro Lima", cpf: "987.654.321-00", tipoDoc: "Passaporte", numDoc: "AB123456",
    dataNasc: "1985-08-22", nacionalidade: "Brasileira", genero: "Masculino",
    cep: "76820-000", logradouro: "Rua do Comércio", numero: "200",
    complemento: "Apto 4", bairro: "Olaria", cidade: "Porto Velho", estado: "RO",
    email: "pedro@email.com", tel: "(69) 98888-0002", telEmergencia: "", nomeEmergencia: "",
    tipoQuartoPref: "Luxo", andarPref: "Qualquer", fumante: "Não", observacoesPref: "",
    status: "Ativo", documentos: [],
  },
  {
    id: 3,
    nome: "Maria Costa", cpf: "456.789.123-00", tipoDoc: "Passaporte", numDoc: "PT789012",
    dataNasc: "1978-12-03", nacionalidade: "Portuguesa", genero: "Feminino",
    cep: "", logradouro: "", numero: "", complemento: "",
    bairro: "", cidade: "Lisboa", estado: "",
    email: "maria@email.com", tel: "(69) 97777-0003", telEmergencia: "", nomeEmergencia: "",
    tipoQuartoPref: "Standard", andarPref: "Baixo", fumante: "Não", observacoesPref: "Alergica a plumas",
    status: "Ativo", documentos: [{ nome: "Passaporte", tipo: "JPG", data: "05/09/2026" }],
  },
];

type ModalType = "new" | "edit" | "view" | "hist" | null;
type FormTab = "pessoal" | "endereco" | "contato" | "preferencias" | "documentos";

/* ── utilitários de exibição ─────────────────────────────────────────── */
function Field({ label, value }: { label: string; value: string }) {
  return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.72rem", color: "#7a8a6a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
        <span style={{ fontFamily: SERIF, fontSize: "0.87rem", color: value ? "#1a1a1a" : "#c8d8b8" }}>
        {value || "—"}
      </span>
      </div>
  );
}

/* ── componente principal ────────────────────────────────────────────── */
export default function Hospedes() {
  const [data, setData] = useState<Hospede[]>(initialData);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Hospede | null>(null);
  const [formTab, setFormTab] = useState<FormTab>("pessoal");
  const [form, setForm] = useState(emptyForm());

  const filtered = data.filter((h) =>
      h.nome.toLowerCase().includes(search.toLowerCase()) ||
      h.cpf.includes(search) ||
      h.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm(emptyForm());
    setFormTab("pessoal");
    setModal("new");
  };

  const openEdit = (h: Hospede) => {
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
      setForm((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    if (modal === "new") {
      setData([...data, { id: Date.now(), ...form, status: "Ativo", documentos: [] }]);
    } else if (modal === "edit" && selected) {
      setData(data.map((h) => h.id === selected.id ? { ...h, ...form } : h));
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
            title="Hóspedes — RF01 a RF07"
            actions={<Btn onClick={openNew}>+ Cadastrar Hóspede</Btn>}
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
                  <FormGrid cols={2}>
                    <FullCol>
                      <Input label="Nome completo *" value={form.nome} onChange={(e) => f("nome", e.target.value)} />
                    </FullCol>
                    <Input label="CPF *" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => f("cpf", e.target.value)} />
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
                  </FormGrid>
              )}

              {/* ── Endereço ── */}
              {formTab === "endereco" && (
                  <FormGrid cols={2}>
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
                  </FormGrid>
              )}

              {/* ── Contatos ── */}
              {formTab === "contato" && (
                  <FormGrid cols={2}>
                    <Input label="E-mail *" type="email" value={form.email} onChange={(e) => f("email", e.target.value)} />
                    <Input label="Telefone / WhatsApp *" placeholder="(00) 00000-0000" value={form.tel} onChange={(e) => f("tel", e.target.value)} />
                    <Input label="Nome do contato de emergência" value={form.nomeEmergencia} onChange={(e) => f("nomeEmergencia", e.target.value)} />
                    <Input label="Telefone de emergência" placeholder="(00) 00000-0000" value={form.telEmergencia} onChange={(e) => f("telEmergencia", e.target.value)} />
                    <FormActions>
                      <Btn variant="ghost" onClick={() => setFormTab("endereco")}>← Anterior</Btn>
                      <Btn variant="secondary" onClick={() => setFormTab("preferencias")}>Próximo →</Btn>
                    </FormActions>
                  </FormGrid>
              )}

              {/* ── Preferências ── */}
              {formTab === "preferencias" && (
                  <FormGrid cols={2}>
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
                  </FormGrid>
              )}

              {/* ── Documentos ── */}
              {formTab === "documentos" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div
                        style={{
                          border: "2px dashed #c8d8b8",
                          borderRadius: "12px",
                          padding: "28px",
                          textAlign: "center",
                          background: "#f8faf6",
                          cursor: "pointer",
                        }}
                    >
                      <p style={{ fontFamily: SERIF, fontSize: "1.5rem", marginBottom: "6px" }}>📎</p>
                      <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.9rem", color: "#3e5525", marginBottom: "4px" }}>
                        Arraste ou clique para anexar documento
                      </p>
                      <p style={{ fontFamily: SERIF, fontSize: "0.75rem", color: "#9aaa8a" }}>
                        Formatos aceitos: PDF, JPG, PNG · Máx. 5 MB por arquivo (RF03-RNF3)
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
                                      background: "#f8faf6",
                                      borderRadius: "10px",
                                      border: "1px solid #e2ecd8",
                                    }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "1.1rem" }}>📄</span>
                                    <div>
                                      <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.85rem", color: "#1a1a1a" }}>{doc.nome}</p>
                                      <p style={{ fontFamily: SERIF, fontSize: "0.72rem", color: "#9aaa8a" }}>{doc.tipo} · Enviado em {doc.data}</p>
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: "6px" }}>
                                    <Btn small variant="ghost">Ver</Btn>
                                    <Btn small variant="danger">Excluir</Btn>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <Btn variant="ghost" onClick={() => setFormTab("preferencias")}>← Anterior</Btn>
                      <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
                      <Btn onClick={save}>Salvar Hóspede</Btn>
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
                      <Field label="Data de nascimento" value={selected.dataNasc} />
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
                          <p style={{ fontFamily: SERIF, fontSize: "0.85rem", color: "#9aaa8a", textAlign: "center", padding: "24px 0" }}>
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
                                    background: "#f8faf6",
                                    borderRadius: "10px",
                                    border: "1px solid #e2ecd8",
                                  }}
                              >
                                <span style={{ fontSize: "1.1rem" }}>📄</span>
                                <div>
                                  <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.85rem", color: "#1a1a1a" }}>{doc.nome}</p>
                                  <p style={{ fontFamily: SERIF, fontSize: "0.72rem", color: "#9aaa8a" }}>{doc.tipo} · {doc.data}</p>
                                </div>
                                <Btn small variant="ghost" onClick={() => {}}>Ver</Btn>
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
                  headers={["Período", "Quarto", "Categoria", "Valor pago", "Status"]}
                  rows={[
                    ["01/06 – 05/06/2026", "205", "Luxo",     "R$ 1.200,00", <Badge label="Finalizado" color="green" />],
                    ["15/03 – 17/03/2026", "101", "Standard", "R$ 580,00",   <Badge label="Finalizado" color="green" />],
                  ]}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
              </div>
            </Modal>
        )}
      </div>
  );
}
