import { useState } from "react";
import {
  PageHeader, Card, Btn, Input, Select, Textarea, Table, Modal,
  Badge, SectionTitle, Tabs, FormGrid, FullCol, FormActions, KpiCard, formatDisplayDate,
} from "../ui";

const SERIF = "'Inria Serif', Georgia, serif";

/* ── tipos ───────────────────────────────────────────────────────────── */
type Regime = "Apenas hospedagem" | "Café da manhã" | "Meia pensão" | "Pensão completa";
type Temporada = "Ano inteiro" | "Baixa temporada" | "Alta temporada" | "Feriados" | "Fim de ano";
type Status = "Ativo" | "Inativo";
type Tab = "lista" | "cards" | "promocoes";

interface Servico {
  id: string;
  nome: string;
  incluso: boolean;
}

interface Pacote {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  regime: Regime;
  temporada: Temporada;
  categoriaQuarto: string;
  minimoNoites: number;
  valorBase: string;
  desconto: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  servicos: Servico[];
  observacoes: string;
  status: Status;
  dataCadastro: string;
}

/* ── serviços adicionais padrão ─────────────────────────────────────── */
const servicosPadrao = [
  "City tour",
  "Transfer aeroporto",
  "Passeio de barco",
  "Trilha guiada",
  "Massagem / Spa",
  "Jantar romântico",
  "Decoração especial",
  "Champagne de boas-vindas",
  "Ingresso parque nacional",
  "Aluguel de bicicleta",
];

const initialPacotes: Pacote[] = [
  {
    id: 1,
    codigo: "PAC-001",
    nome: "Pacote Romântico",
    descricao: "Experiência exclusiva para casais com noites no quarto suíte, jantar à luz de velas e spa incluso.",
    regime: "Café da manhã",
    temporada: "Ano inteiro",
    categoriaQuarto: "Suíte",
    minimoNoites: 2,
    valorBase: "R$ 1.800,00",
    desconto: "0%",
    vigenciaInicio: "2026-01-01",
    vigenciaFim: "2026-12-31",
    servicos: [
      { id: "s1", nome: "Jantar romântico",       incluso: true  },
      { id: "s2", nome: "Massagem / Spa",          incluso: true  },
      { id: "s3", nome: "Champagne de boas-vindas",incluso: true  },
      { id: "s4", nome: "Decoração especial",      incluso: true  },
    ],
    observacoes: "Válido para casal. Café da manhã servido no quarto.",
    status: "Ativo",
    dataCadastro: "2026-01-10",
  },
  {
    id: 2,
    codigo: "PAC-002",
    nome: "Pacote Família Aventura",
    descricao: "Ideal para famílias que querem explorar o Parque Nacional Pacaás Novos com conforto e segurança.",
    regime: "Meia pensão",
    temporada: "Baixa temporada",
    categoriaQuarto: "Luxo",
    minimoNoites: 3,
    valorBase: "R$ 2.400,00",
    desconto: "10%",
    vigenciaInicio: "2026-04-01",
    vigenciaFim: "2026-11-30",
    servicos: [
      { id: "s5", nome: "Trilha guiada",           incluso: true  },
      { id: "s6", nome: "City tour",               incluso: true  },
      { id: "s7", nome: "Aluguel de bicicleta",    incluso: true  },
      { id: "s8", nome: "Ingresso parque nacional", incluso: true  },
    ],
    observacoes: "Inclui crianças até 6 anos sem custo adicional.",
    status: "Ativo",
    dataCadastro: "2026-01-15",
  },
  {
    id: 3,
    codigo: "PAC-003",
    nome: "Réveillon Pacaás",
    descricao: "Celebre o Ano Novo em meio à natureza com ceia especial, show ao vivo e queima de fogos.",
    regime: "Pensão completa",
    temporada: "Fim de ano",
    categoriaQuarto: "Standard",
    minimoNoites: 3,
    valorBase: "R$ 3.200,00",
    desconto: "0%",
    vigenciaInicio: "2026-12-28",
    vigenciaFim: "2027-01-02",
    servicos: [
      { id: "s9",  nome: "Transfer aeroporto",     incluso: true  },
      { id: "s10", nome: "Jantar romântico",        incluso: true  },
    ],
    observacoes: "Ceia de Natal e Réveillon inclusas. Não reembolsável.",
    status: "Ativo",
    dataCadastro: "2026-03-01",
  },
  {
    id: 4,
    codigo: "PAC-004",
    nome: "Semana do Trabalhador",
    descricao: "Promoção especial para o feriado com diárias reduzidas.",
    regime: "Café da manhã",
    temporada: "Feriados",
    categoriaQuarto: "Standard",
    minimoNoites: 2,
    valorBase: "R$ 980,00",
    desconto: "15%",
    vigenciaInicio: "2026-04-30",
    vigenciaFim: "2026-05-03",
    servicos: [],
    observacoes: "Sujeito à disponibilidade.",
    status: "Inativo",
    dataCadastro: "2026-02-20",
  },
];

const regimes: Regime[] = ["Apenas hospedagem", "Café da manhã", "Meia pensão", "Pensão completa"];
const temporadas: Temporada[] = ["Ano inteiro", "Baixa temporada", "Alta temporada", "Feriados", "Fim de ano"];

const regimeBadge: Record<Regime, "gray" | "yellow" | "blue" | "green"> = {
  "Apenas hospedagem": "gray",
  "Café da manhã":     "yellow",
  "Meia pensão":       "blue",
  "Pensão completa":   "green",
};

const temporadaBadge: Record<Temporada, "gray" | "yellow" | "blue" | "green" | "purple"> = {
  "Ano inteiro":    "gray",
  "Baixa temporada":"blue",
  "Alta temporada": "yellow",
  "Feriados":       "purple",
  "Fim de ano":     "green",
};

function isVigente(p: Pacote) {
  const hoje = new Date().toISOString().slice(0, 10);
  return p.status === "Ativo" && p.vigenciaInicio <= hoje && p.vigenciaFim >= hoje;
}

/* ── formulário vazio ───────────────────────────────────────────────── */
function emptyForm() {
  return {
    codigo: "", nome: "", descricao: "",
    regime: "Café da manhã" as Regime,
    temporada: "Ano inteiro" as Temporada,
    categoriaQuarto: "Standard",
    minimoNoites: "2",
    valorBase: "", desconto: "0%",
    vigenciaInicio: "", vigenciaFim: "",
    servicosChecked: [] as string[],
    servicoExtra: "",
    observacoes: "",
  };
}

/* ── componente ──────────────────────────────────────────────────────── */
export default function Pacotes() {
  const [pacotes, setPacotes] = useState<Pacote[]>(initialPacotes);
  const [tab, setTab]         = useState<Tab>("lista");
  const [modal, setModal]     = useState<"new" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Pacote | null>(null);

  /* filtros */
  const [filtroStatus,    setFiltroStatus]    = useState("Ativo");
  const [filtroTemporada, setFiltroTemporada] = useState("");
  const [filtroRegime,    setFiltroRegime]    = useState("");
  const [busca,           setBusca]           = useState("");

  const [form, setForm] = useState(emptyForm());
  const f_ = (k: keyof ReturnType<typeof emptyForm>, v: string) => setForm((p) => ({ ...p, [k]: v }));

  /* toggle serviço */
  const toggleServico = (nome: string) =>
    setForm((p) => ({
      ...p,
      servicosChecked: p.servicosChecked.includes(nome)
        ? p.servicosChecked.filter((s) => s !== nome)
        : [...p.servicosChecked, nome],
    }));

  /* filtro */
  const filtrados = pacotes.filter((p) =>
    (!filtroStatus    || p.status === filtroStatus) &&
    (!filtroTemporada || p.temporada === filtroTemporada) &&
    (!filtroRegime    || p.regime === filtroRegime) &&
    (!busca           || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo.toLowerCase().includes(busca.toLowerCase()))
  );

  /* ── save ── */
  const save = () => {
    const extras = form.servicoExtra
      ? [...form.servicosChecked, form.servicoExtra]
      : form.servicosChecked;

    const servicos: Servico[] = extras.map((nome, i) => ({
      id: `s-${Date.now()}-${i}`,
      nome,
      incluso: true,
    }));

    const base: Omit<Pacote, "id" | "dataCadastro" | "status"> = {
      codigo: form.codigo,
      nome: form.nome,
      descricao: form.descricao,
      regime: form.regime,
      temporada: form.temporada,
      categoriaQuarto: form.categoriaQuarto,
      minimoNoites: Number(form.minimoNoites),
      valorBase: form.valorBase,
      desconto: form.desconto,
      vigenciaInicio: form.vigenciaInicio,
      vigenciaFim: form.vigenciaFim,
      servicos,
      observacoes: form.observacoes,
    };

    if (modal === "new") {
      setPacotes([...pacotes, { id: Date.now(), ...base, status: "Ativo", dataCadastro: new Date().toISOString().slice(0, 10) }]);
    } else if (modal === "edit" && selected) {
      setPacotes(pacotes.map((p) => p.id === selected.id ? { ...p, ...base } : p));
    }
    setModal(null);
  };

  const inativar = (id: number) =>
    setPacotes(pacotes.map((p) => p.id === id ? { ...p, status: p.status === "Ativo" ? "Inativo" : "Ativo" } : p));

  const openEdit = (p: Pacote) => {
    setSelected(p);
    setForm({
      codigo: p.codigo, nome: p.nome, descricao: p.descricao,
      regime: p.regime, temporada: p.temporada,
      categoriaQuarto: p.categoriaQuarto,
      minimoNoites: String(p.minimoNoites),
      valorBase: p.valorBase, desconto: p.desconto,
      vigenciaInicio: p.vigenciaInicio, vigenciaFim: p.vigenciaFim,
      servicosChecked: p.servicos.map((s) => s.nome),
      servicoExtra: "",
      observacoes: p.observacoes,
    });
    setModal("edit");
  };

  /* KPIs */
  const ativos    = pacotes.filter((p) => p.status === "Ativo").length;
  const vigentes  = pacotes.filter(isVigente).length;
  const inativos  = pacotes.filter((p) => p.status === "Inativo").length;
  const comDesconto = pacotes.filter((p) => p.desconto && p.desconto !== "0%").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Pacotes"
        actions={
          <Btn onClick={() => { setForm(emptyForm()); setModal("new"); }}>
            + Novo Pacote
          </Btn>
        }
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <KpiCard label="Pacotes ativos" value={String(ativos)} icon="gift" />
        <KpiCard label="Vigentes hoje" value={String(vigentes)} icon="badge-check" />
        <KpiCard label="Com desconto" value={String(comDesconto)} icon="percent" />
        <KpiCard label="Inativos" value={String(inativos)} icon="circle-pause" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "lista",     label: "Lista de pacotes" },
          { id: "cards",     label: "Visualização em cards" },
          { id: "promocoes", label: "Promoções ativas" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── filtros ── */}
      {tab === "lista" && (
        <Card>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "16px" }}>
        <div style={{ flex: "1 1 180px" }}>
          <Input label="Buscar" placeholder="Nome ou código…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div style={{ width: "170px" }}>
          <Select label="Regime" value={filtroRegime} onChange={(e) => setFiltroRegime(e.target.value)}>
            <option value="">Todos</option>
            {regimes.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </div>
        <div style={{ width: "170px" }}>
          <Select label="Temporada" value={filtroTemporada} onChange={(e) => setFiltroTemporada(e.target.value)}>
            <option value="">Todas</option>
            {temporadas.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>
        <div style={{ width: "130px" }}>
          <Select label="Status" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            <option>Ativo</option>
            <option>Inativo</option>
          </Select>
        </div>
      </div>

      {/* ══ ABA: LISTA ═════════════════════════════════════════════════ */}
          <Table
            headers={["Código", "Pacote", "Regime", "Temporada", "Valor base", "Vigência", "Status", "Ações"]}
            rows={filtrados.map((p) => [
              p.codigo,
              <div>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-strong)" }}>{p.nome}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.categoriaQuarto} · mín. {p.minimoNoites} noites</p>
              </div>,
              <Badge label={p.regime}    color={regimeBadge[p.regime]} />,
              <Badge label={p.temporada} color={temporadaBadge[p.temporada]} />,
              <div>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.88rem", color: "var(--text-strong)" }}>{p.valorBase}</p>
                {p.desconto !== "0%" && (
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--warn-fg)" }}>↓ {p.desconto} desconto</p>
                )}
              </div>,
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {formatDisplayDate(p.vigenciaInicio)} a {formatDisplayDate(p.vigenciaFim)}
              </span>,
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <Badge label={isVigente(p) ? "Vigente" : p.status} />
              </div>,
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                <Btn small variant="ghost"     onClick={() => { setSelected(p); setModal("view"); }}>Ver</Btn>
                <Btn small variant="secondary" onClick={() => openEdit(p)}>Editar</Btn>
                <Btn small variant={p.status === "Ativo" ? "danger" : "ghost"} onClick={() => inativar(p.id)}>
                  {p.status === "Ativo" ? "Inativar" : "Ativar"}
                </Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {/* ══ ABA: CARDS ═════════════════════════════════════════════════ */}
      {tab === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filtrados.map((p) => {
            const vigente = isVigente(p);
            return (
              <div
                key={p.id}
                style={{
                  background: "var(--bg-card)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-card)",
                  opacity: p.status === "Inativo" ? 0.6 : 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* cabeçalho colorido */}
                <div
                  style={{
                    background: vigente
                      ? "linear-gradient(135deg, var(--brand-900), var(--brand-700))"
                      : "linear-gradient(135deg, var(--neutral-fg), var(--text-muted))",
                    padding: "20px",
                    color: "var(--bg-card)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-on-brand-muted)", letterSpacing: "0.08em" }}>{p.codigo}</span>
                    {p.desconto !== "0%" && (
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", background: "var(--warn-fg)", color: "var(--bg-card)", padding: "2px 8px", borderRadius: "99px" }}>
                        {p.desconto} OFF
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2, marginBottom: "6px" }}>{p.nome}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text-on-brand-muted)", lineHeight: 1.4 }}>{p.descricao}</p>
                </div>

                <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <Badge label={p.regime}    color={regimeBadge[p.regime]} />
                    <Badge label={p.temporada} color={temporadaBadge[p.temporada]} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-muted)" }}>A partir de</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1.2rem", color: "var(--brand-900)" }}>{p.valorBase}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)" }}>mín. {p.minimoNoites} noites · {p.categoriaQuarto}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-muted)" }}>Vigência</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text-body)" }}>{formatDisplayDate(p.vigenciaInicio)}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)" }}>até {formatDisplayDate(p.vigenciaFim)}</p>
                    </div>
                  </div>

                  {p.servicos.length > 0 && (
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Incluso</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {p.servicos.map((s) => (
                          <span key={s.id} style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", background: "var(--brand-100)", color: "var(--ok-fg)", padding: "2px 8px", borderRadius: "99px" }}>
                            {s.nome}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "6px", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid var(--bg-page)" }}>
                    <Btn small variant="ghost"     onClick={() => { setSelected(p); setModal("view"); }}>Ver</Btn>
                    <Btn small variant="secondary" onClick={() => openEdit(p)}>Editar</Btn>
                    <Btn small variant={p.status === "Ativo" ? "danger" : "ghost"} onClick={() => inativar(p.id)}>
                      {p.status === "Ativo" ? "Inativar" : "Ativar"}
                    </Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ ABA: PROMOÇÕES ═════════════════════════════════════════════ */}
      {tab === "promocoes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {pacotes.filter((p) => p.desconto !== "0%" && p.status === "Ativo").length === 0 ? (
            <Card>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center", padding: "32px 0" }}>
                Nenhuma promoção ativa no momento.
              </p>
            </Card>
          ) : (
            pacotes
              .filter((p) => p.desconto !== "0%" && p.status === "Ativo")
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "var(--warn-bg)",
                    borderLeft: "4px solid var(--warn-fg)",
                    borderRadius: "0 14px 14px 0",
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "1.3rem", fontWeight: 700, color: "var(--warn-fg)" }}>{p.desconto} OFF</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-strong)" }}>{p.nome}</span>
                      <Badge label={p.temporada} color={temporadaBadge[p.temporada]} />
                    </div>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--warn-fg)" }}>
                      De <strong>{p.valorBase}</strong> · Vigência: {formatDisplayDate(p.vigenciaInicio)} a {formatDisplayDate(p.vigenciaFim)}
                    </p>
                    {p.observacoes && (
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{p.observacoes}</p>
                    )}
                  </div>
                  <Btn small onClick={() => { setSelected(p); setModal("view"); }}>Ver detalhes</Btn>
                </div>
              ))
          )}
        </div>
      )}

      {/* ══ MODAL: Novo / Editar ════════════════════════════════════════ */}
      {(modal === "new" || modal === "edit") && (
        <Modal
          title={modal === "new" ? "Cadastrar Pacote" : `Editar Pacote — ${selected?.nome}`}
          onClose={() => setModal(null)}
          wide
        >
          <FormGrid cols={2}>
            <Input label="Código *" placeholder="PAC-001" value={form.codigo} onChange={(e) => f_("codigo", e.target.value)} />
            <Select label="Temporada *" value={form.temporada} onChange={(e) => f_("temporada", e.target.value as Temporada)}>
              {temporadas.map((t) => <option key={t}>{t}</option>)}
            </Select>
            <FullCol>
              <Input label="Nome do pacote *" value={form.nome} onChange={(e) => f_("nome", e.target.value)} />
            </FullCol>
            <FullCol>
              <Input label="Descrição" placeholder="Descreva o pacote para o hóspede" value={form.descricao} onChange={(e) => f_("descricao", e.target.value)} />
            </FullCol>

            <Select label="Regime alimentar *" value={form.regime} onChange={(e) => f_("regime", e.target.value as Regime)}>
              {regimes.map((r) => <option key={r}>{r}</option>)}
            </Select>
            <Select label="Categoria do quarto" value={form.categoriaQuarto} onChange={(e) => f_("categoriaQuarto", e.target.value)}>
              <option>Standard</option>
              <option>Luxo</option>
              <option>Suíte</option>
            </Select>

            <Input label="Mínimo de noites" type="number" min="1" value={form.minimoNoites} onChange={(e) => f_("minimoNoites", e.target.value)} />
            <Input label="Valor base *" placeholder="R$ 0,00" value={form.valorBase} onChange={(e) => f_("valorBase", e.target.value)} />
            <Input label="Desconto (%)" placeholder="Ex: 10%" value={form.desconto} onChange={(e) => f_("desconto", e.target.value)} />
            <div />

            <Input label="Vigência início *" type="date" value={form.vigenciaInicio} onChange={(e) => f_("vigenciaInicio", e.target.value)} />
            <Input label="Vigência fim *"   type="date" value={form.vigenciaFim}    onChange={(e) => f_("vigenciaFim",    e.target.value)} />

            {/* Serviços adicionais */}
            <FullCol>
              <SectionTitle>Serviços adicionais inclusos</SectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {servicosPadrao.map((nome) => {
                  const checked = form.servicosChecked.includes(nome);
                  return (
                    <button
                      key={nome}
                      type="button"
                      onClick={() => toggleServico(nome)}
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.78rem",
                        padding: "5px 12px",
                        borderRadius: "99px",
                        cursor: "pointer",
                        background: checked ? "var(--brand-700)" : "var(--bg-page)",
                        color: checked ? "var(--bg-card)" : "var(--text-body)",
                        borderWidth: "1.5px",
                        borderStyle: "solid",
                        borderColor: checked ? "var(--brand-700)" : "var(--border)",
                        transition: "all 0.15s",
                      }}
                    >
                      {nome}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: "10px" }}>
                <Input
                  label="Outro serviço (personalizado)"
                  placeholder="Ex: Aula de surf, Passeio de helicóptero…"
                  value={form.servicoExtra}
                  onChange={(e) => f_("servicoExtra", e.target.value)}
                />
              </div>
            </FullCol>

            <FullCol>
              <Input label="Observações / restrições" placeholder="Condições, restrições, política de cancelamento…" value={form.observacoes} onChange={(e) => f_("observacoes", e.target.value)} />
            </FullCol>

            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar pacote</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {/* ══ MODAL: Visualizar ═══════════════════════════════════════════ */}
      {modal === "view" && selected && (
        <Modal title={`${selected.codigo} — ${selected.nome}`} onClose={() => setModal(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
            {[
              ["Código",         selected.codigo],
              ["Temporada",      selected.temporada],
              ["Regime",         selected.regime],
              ["Categoria quarto",selected.categoriaQuarto],
              ["Mín. noites",    `${selected.minimoNoites} noites`],
              ["Valor base",     selected.valorBase],
              ["Desconto",       selected.desconto],
              ["Vigência",       `${selected.vigenciaInicio} a ${selected.vigenciaFim}`],
              ["Status",         selected.status],
              ["Cadastrado em",  selected.dataCadastro],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.87rem", color: "var(--text-strong)" }}>{v}</span>
              </div>
            ))}
          </div>

          {selected.descricao && (
            <div style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Descrição</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.87rem", color: "var(--text-body)", lineHeight: 1.5 }}>{selected.descricao}</p>
            </div>
          )}

          {selected.servicos.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <SectionTitle>Serviços inclusos</SectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {selected.servicos.map((s) => (
                  <span key={s.id} style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", background: "var(--brand-100)", color: "var(--ok-fg)", padding: "4px 12px", borderRadius: "99px", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--ok-bg)" }}>
                    {s.nome}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selected.observacoes && (
            <div style={{ background: "var(--warn-bg)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 700, color: "var(--warn-fg)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Observações</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.84rem", color: "var(--warn-fg)" }}>{selected.observacoes}</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
            <Btn variant="secondary" onClick={() => openEdit(selected)}>Editar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
