import { useState } from "react";
import {
  PageHeader, Card, Btn, Input, Select, Table, Modal,
  Badge, SectionTitle, Tabs, FormGrid, FullCol, FormActions, KpiCard, StatusBadge, formatDisplayDate,
} from "../ui";

const SERIF = "'Inria Serif', Georgia, serif";

/* ── tipos ───────────────────────────────────────────────────────────── */
type SituacaoPagar    = "Pendente" | "Pago" | "Vencido" | "Cancelado";
type SituacaoReceber  = "Pendente" | "Recebido" | "Parcial" | "Vencido" | "Cancelado";
type SituacaoCaixa    = "Aberto" | "Fechado";
type SituacaoConcilia = "Conciliado" | "Divergente" | "Pendente";
type Tab = "pagar" | "receber" | "caixa" | "centrocusto" | "conciliacao";

interface ContaPagar {
  id: number;
  descricao: string;
  fornecedor: string;
  valor: number;
  vencimento: string;
  pagamento: string;
  formaPagamento: string;
  centroCusto: string;
  situacao: SituacaoPagar;
  observacoes: string;
  dataCadastro: string;
}

interface ContaReceber {
  id: number;
  descricao: string;
  cliente: string;
  valor: number;
  valorRecebido: number;
  vencimento: string;
  recebimento: string;
  formaPagamento: string;
  centroCusto: string;
  situacao: SituacaoReceber;
  observacoes: string;
  dataCadastro: string;
}

interface Caixa {
  id: number;
  data: string;
  operador: string;
  valorAbertura: number;
  valorFechamento: number | null;
  entradas: number;
  saidas: number;
  situacao: SituacaoCaixa;
  observacoes: string;
}

interface CentroCusto {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  receitas: number;
  despesas: number;
}

interface ConciliacaoBancaria {
  id: number;
  data: string;
  descricao: string;
  valorBanco: number;
  valorSistema: number;
  tipo: "Crédito" | "Débito";
  situacao: SituacaoConcilia;
  observacoes: string;
}

/* ── helpers ─────────────────────────────────────────────────────────── */
const fmt = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const situacaoPagarColor: Record<SituacaoPagar, "yellow" | "green" | "red" | "gray"> = {
  Pendente:  "yellow",
  Pago:      "green",
  Vencido:   "red",
  Cancelado: "gray",
};
const situacaoReceberColor: Record<SituacaoReceber, "yellow" | "green" | "blue" | "red" | "gray"> = {
  Pendente:  "yellow",
  Recebido:  "green",
  Parcial:   "blue",
  Vencido:   "red",
  Cancelado: "gray",
};
const conciliaColor: Record<SituacaoConcilia, "green" | "red" | "yellow"> = {
  Conciliado: "green",
  Divergente: "red",
  Pendente:   "yellow",
};

const centrosNomes = ["Hospedagem", "Restaurante", "Eventos", "Spa", "Manutenção", "Geral"];
const formasPagamento = ["Dinheiro", "PIX", "Cartão de débito", "Cartão de crédito", "TED/DOC", "Boleto", "Cheque"];

/* ── dados iniciais ──────────────────────────────────────────────────── */
const initialPagar: ContaPagar[] = [
  { id: 1, descricao: "Fornecedor lavanderia – setembro",  fornecedor: "Lavanderia Brilho",   valor: 1200, vencimento: "2026-09-25", pagamento: "",           formaPagamento: "TED/DOC",            centroCusto: "Hospedagem",  situacao: "Pendente",  observacoes: "",                    dataCadastro: "2026-09-01" },
  { id: 2, descricao: "Energia elétrica – setembro",       fornecedor: "ENERGISA",            valor: 3400, vencimento: "2026-09-20", pagamento: "",           formaPagamento: "Boleto",             centroCusto: "Geral",       situacao: "Pendente",  observacoes: "",                    dataCadastro: "2026-09-05" },
  { id: 3, descricao: "Internet fibra – setembro",         fornecedor: "Claro Empresas",      valor: 580,  vencimento: "2026-09-10", pagamento: "2026-09-10", formaPagamento: "Débito automático", centroCusto: "Geral",       situacao: "Pago",      observacoes: "",                    dataCadastro: "2026-09-01" },
  { id: 4, descricao: "Insumos de limpeza",                fornecedor: "Distribuidora Clean", valor: 890,  vencimento: "2026-09-18", pagamento: "",           formaPagamento: "PIX",               centroCusto: "Hospedagem",  situacao: "Pendente",  observacoes: "3 parcelas restantes",dataCadastro: "2026-09-10" },
  { id: 5, descricao: "Aluguel de equipamentos – eventos", fornecedor: "Som & Luz RO",        valor: 2500, vencimento: "2026-09-05", pagamento: "",           formaPagamento: "TED/DOC",            centroCusto: "Eventos",     situacao: "Vencido",   observacoes: "",                    dataCadastro: "2026-08-28" },
];

const initialReceber: ContaReceber[] = [
  { id: 1, descricao: "Reserva #1001 – Ana Lima",       cliente: "Ana Lima",          valor: 1500,  valorRecebido: 1500,  vencimento: "2026-09-13", recebimento: "2026-09-13", formaPagamento: "PIX",              centroCusto: "Hospedagem",  situacao: "Recebido", observacoes: "",                  dataCadastro: "2026-09-01" },
  { id: 2, descricao: "Evento corporativo – TechNorte", cliente: "TechNorte LTDA",    valor: 8500,  valorRecebido: 4250,  vencimento: "2026-09-20", recebimento: "",           formaPagamento: "TED/DOC",           centroCusto: "Eventos",     situacao: "Parcial",  observacoes: "50% antecipado",    dataCadastro: "2026-09-05" },
  { id: 3, descricao: "Reserva #1005 – Carlos Mota",   cliente: "Carlos Mota",       valor: 2400,  valorRecebido: 0,     vencimento: "2026-09-25", recebimento: "",           formaPagamento: "Cartão de crédito", centroCusto: "Hospedagem",  situacao: "Pendente", observacoes: "",                  dataCadastro: "2026-09-10" },
  { id: 4, descricao: "Pacote spa – Fernanda Reis",     cliente: "Fernanda Reis",     valor: 600,   valorRecebido: 0,     vencimento: "2026-09-01", recebimento: "",           formaPagamento: "Dinheiro",          centroCusto: "Spa",         situacao: "Vencido",  observacoes: "Hóspede saiu sem pagar",dataCadastro: "2026-08-30" },
];

const initialCaixas: Caixa[] = [
  { id: 1, data: "2026-09-17", operador: "João Carlos",  valorAbertura: 5000, valorFechamento: null,   entradas: 3200, saidas: 1100, situacao: "Aberto",  observacoes: "" },
  { id: 2, data: "2026-09-16", operador: "Maria Costa",  valorAbertura: 5000, valorFechamento: 18200,  entradas: 8450, saidas: 2050, situacao: "Fechado", observacoes: "" },
  { id: 3, data: "2026-09-15", operador: "João Carlos",  valorAbertura: 5000, valorFechamento: 16700,  entradas: 6900, saidas: 1800, situacao: "Fechado", observacoes: "" },
];

const initialCentros: CentroCusto[] = [
  { id: 1, codigo: "CC-001", nome: "Hospedagem",  descricao: "Receitas e despesas de diárias e serviços de quarto", ativo: true,  receitas: 32400, despesas: 8200  },
  { id: 2, codigo: "CC-002", nome: "Restaurante", descricao: "Alimentação: café da manhã, almoço, jantar",          ativo: true,  receitas: 12600, despesas: 5400  },
  { id: 3, codigo: "CC-003", nome: "Eventos",     descricao: "Eventos corporativos e sociais",                      ativo: true,  receitas: 8500,  despesas: 2100  },
  { id: 4, codigo: "CC-004", nome: "Spa",         descricao: "Massagens e tratamentos estéticos",                   ativo: true,  receitas: 4800,  despesas: 1200  },
  { id: 5, codigo: "CC-005", nome: "Manutenção",  descricao: "Reparos, reformas e infraestrutura",                  ativo: true,  receitas: 0,     despesas: 3800  },
  { id: 6, codigo: "CC-006", nome: "Geral",       descricao: "Despesas administrativas e gerais",                   ativo: true,  receitas: 0,     despesas: 7200  },
];

const initialConciliacao: ConciliacaoBancaria[] = [
  { id: 1, data: "2026-09-16", descricao: "PIX recebido – Ana Lima",          valorBanco: 1500, valorSistema: 1500, tipo: "Crédito", situacao: "Conciliado", observacoes: "" },
  { id: 2, data: "2026-09-16", descricao: "TED – Fornecedor lavanderia",       valorBanco: 1200, valorSistema: 1200, tipo: "Débito",  situacao: "Conciliado", observacoes: "" },
  { id: 3, data: "2026-09-15", descricao: "TED – TechNorte LTDA",              valorBanco: 4250, valorSistema: 4250, tipo: "Crédito", situacao: "Conciliado", observacoes: "" },
  { id: 4, data: "2026-09-14", descricao: "Débito automático – Internet",      valorBanco: 580,  valorSistema: 580,  tipo: "Débito",  situacao: "Conciliado", observacoes: "" },
  { id: 5, data: "2026-09-13", descricao: "Crédito não identificado",          valorBanco: 320,  valorSistema: 0,    tipo: "Crédito", situacao: "Divergente", observacoes: "Origem desconhecida" },
  { id: 6, data: "2026-09-12", descricao: "Débito fornecedor som & luz",       valorBanco: 2500, valorSistema: 0,    tipo: "Débito",  situacao: "Pendente",   observacoes: "Aguardando baixa manual" },
];

/* ── componente ──────────────────────────────────────────────────────── */
export default function Financeiro() {
  const [tab, setTab] = useState<Tab>("pagar");

  const [contasPagar,    setContasPagar]    = useState<ContaPagar[]>(initialPagar);
  const [contasReceber,  setContasReceber]  = useState<ContaReceber[]>(initialReceber);
  const [caixas,         setCaixas]         = useState<Caixa[]>(initialCaixas);
  const [centros,        setCentros]        = useState<CentroCusto[]>(initialCentros);
  const [conciliacao,    setConciliacao]    = useState<ConciliacaoBancaria[]>(initialConciliacao);

  /* modais */
  type ModalType = "newPagar" | "editPagar" | "newReceber" | "editReceber" |
                   "abrirCaixa" | "fecharCaixa" | "viewCaixa" |
                   "newCentro" | "editCentro" | "newConcilia" | null;
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedPagar,   setSelectedPagar]   = useState<ContaPagar | null>(null);
  const [selectedReceber, setSelectedReceber] = useState<ContaReceber | null>(null);
  const [selectedCaixa,   setSelectedCaixa]   = useState<Caixa | null>(null);
  const [selectedCentro,  setSelectedCentro]  = useState<CentroCusto | null>(null);

  /* filtros */
  const [filtroPagarSit,    setFiltroPagarSit]    = useState("");
  const [filtroPagarCC,     setFiltroPagarCC]      = useState("");
  const [filtroReceberSit,  setFiltroReceberSit]   = useState("");
  const [filtroReceberCC,   setFiltroReceberCC]    = useState("");
  const [conciliaInicio,    setConciliaInicio]     = useState("2026-09-01");
  const [conciliaFim,       setConciliaFim]        = useState("2026-09-17");

  /* formulários */
  const emptyPagar = () => ({
    descricao: "", fornecedor: "", valor: "", vencimento: "", pagamento: "",
    formaPagamento: "PIX", centroCusto: "Hospedagem", situacao: "Pendente" as SituacaoPagar,
    observacoes: "",
  });
  const emptyReceber = () => ({
    descricao: "", cliente: "", valor: "", valorRecebido: "0", vencimento: "", recebimento: "",
    formaPagamento: "PIX", centroCusto: "Hospedagem", situacao: "Pendente" as SituacaoReceber,
    observacoes: "",
  });
  const emptyCaixa = () => ({ operador: "", valorAbertura: "", observacoes: "" });
  const emptyFechar = () => ({ valorFechamento: "", observacoes: "" });
  const emptyCentro = () => ({ codigo: "", nome: "", descricao: "" });
  const emptyConcilia = () => ({ data: "", descricao: "", valorBanco: "", valorSistema: "", tipo: "Crédito" as "Crédito" | "Débito", observacoes: "" });

  const [fp,   setFp]   = useState(emptyPagar());
  const [fr,   setFr]   = useState(emptyReceber());
  const [fc,   setFc]   = useState(emptyCaixa());
  const [ff,   setFf]   = useState(emptyFechar());
  const [fcc,  setFcc]  = useState(emptyCentro());
  const [fcon, setFcon] = useState(emptyConcilia());

  /* KPIs dinâmicos */
  const totalPagarPendente  = contasPagar.filter((c) => c.situacao === "Pendente" || c.situacao === "Vencido").reduce((s, c) => s + c.valor, 0);
  const totalReceberPendente = contasReceber.filter((c) => c.situacao !== "Recebido" && c.situacao !== "Cancelado").reduce((s, c) => s + (c.valor - c.valorRecebido), 0);
  const caixaAberto         = caixas.find((c) => c.situacao === "Aberto");
  const saldoCaixa          = caixaAberto ? caixaAberto.valorAbertura + caixaAberto.entradas - caixaAberto.saidas : 0;
  const resultado           = totalReceberPendente - totalPagarPendente;

  /* saves */
  const savePagar = () => {
    const base = { ...fp, valor: Number(fp.valor), dataCadastro: new Date().toISOString().slice(0, 10) };
    if (modal === "newPagar") {
      setContasPagar([...contasPagar, { id: Date.now(), ...base }]);
    } else if (modal === "editPagar" && selectedPagar) {
      setContasPagar(contasPagar.map((c) => c.id === selectedPagar.id ? { ...c, ...base } : c));
    }
    setModal(null);
  };

  const saveReceber = () => {
    const base = { ...fr, valor: Number(fr.valor), valorRecebido: Number(fr.valorRecebido), dataCadastro: new Date().toISOString().slice(0, 10) };
    if (modal === "newReceber") {
      setContasReceber([...contasReceber, { id: Date.now(), ...base }]);
    } else if (modal === "editReceber" && selectedReceber) {
      setContasReceber(contasReceber.map((c) => c.id === selectedReceber.id ? { ...c, ...base } : c));
    }
    setModal(null);
  };

  const abrirCaixa = () => {
    if (caixaAberto) return;
    setCaixas([{ id: Date.now(), data: new Date().toISOString().slice(0, 10), operador: fc.operador, valorAbertura: Number(fc.valorAbertura), valorFechamento: null, entradas: 0, saidas: 0, situacao: "Aberto", observacoes: fc.observacoes }, ...caixas]);
    setModal(null);
  };

  const fecharCaixa = () => {
    if (!caixaAberto) return;
    setCaixas(caixas.map((c) => c.id === caixaAberto.id ? { ...c, situacao: "Fechado", valorFechamento: Number(ff.valorFechamento), observacoes: ff.observacoes } : c));
    setModal(null);
  };

  const saveCentro = () => {
    if (modal === "newCentro") {
      setCentros([...centros, { id: Date.now(), codigo: fcc.codigo, nome: fcc.nome, descricao: fcc.descricao, ativo: true, receitas: 0, despesas: 0 }]);
    } else if (modal === "editCentro" && selectedCentro) {
      setCentros(centros.map((c) => c.id === selectedCentro.id ? { ...c, ...fcc } : c));
    }
    setModal(null);
  };

  const saveConcilia = () => {
    setConciliacao([{ id: Date.now(), data: fcon.data, descricao: fcon.descricao, valorBanco: Number(fcon.valorBanco), valorSistema: Number(fcon.valorSistema), tipo: fcon.tipo, situacao: Math.abs(Number(fcon.valorBanco) - Number(fcon.valorSistema)) < 0.01 ? "Conciliado" : "Divergente", observacoes: fcon.observacoes }, ...conciliacao]);
    setModal(null);
  };

  const conciliadosFiltrados = conciliacao.filter((c) => c.data >= conciliaInicio && c.data <= conciliaFim);

  const openEditPagar = (c: ContaPagar) => {
    setSelectedPagar(c);
    setFp({ descricao: c.descricao, fornecedor: c.fornecedor, valor: String(c.valor), vencimento: c.vencimento, pagamento: c.pagamento, formaPagamento: c.formaPagamento, centroCusto: c.centroCusto, situacao: c.situacao, observacoes: c.observacoes });
    setModal("editPagar");
  };

  const openEditReceber = (c: ContaReceber) => {
    setSelectedReceber(c);
    setFr({ descricao: c.descricao, cliente: c.cliente, valor: String(c.valor), valorRecebido: String(c.valorRecebido), vencimento: c.vencimento, recebimento: c.recebimento, formaPagamento: c.formaPagamento, centroCusto: c.centroCusto, situacao: c.situacao, observacoes: c.observacoes });
    setModal("editReceber");
  };

  /* ── render ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader title="Financeiro" />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <KpiCard label="A pagar (pendente)" value={fmt(totalPagarPendente)} icon="banknote" tone={totalPagarPendente > 0 ? "warn" : "default"} />
        <KpiCard label="A receber (pendente)" value={fmt(totalReceberPendente)} icon="trending-up" />
        <KpiCard label="Saldo em caixa" value={fmt(saldoCaixa)} icon="banknote" />
        <KpiCard label="Resultado líquido" value={fmt(resultado)} icon="trending-up" tone={resultado < 0 ? "danger" : "default"} />
      </div>

      <Tabs
        tabs={[
          { id: "pagar",       label: "Contas a Pagar"  },
          { id: "receber",     label: "Contas a Receber" },
          { id: "caixa",       label: "Caixa"            },
          { id: "centrocusto", label: "Centro de Custo"  },
          { id: "conciliacao", label: "Conciliação Bancária" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ══ CONTAS A PAGAR ════════════════════════════════════════════ */}
      {tab === "pagar" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <SectionTitle>Contas a Pagar</SectionTitle>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ width: "160px" }}>
                <Select label="Situação" value={filtroPagarSit} onChange={(e) => setFiltroPagarSit(e.target.value)}>
                  <option value="">Todas</option>
                  <option>Pendente</option><option>Pago</option><option>Vencido</option><option>Cancelado</option>
                </Select>
              </div>
              <div style={{ width: "160px" }}>
                <Select label="Centro de custo" value={filtroPagarCC} onChange={(e) => setFiltroPagarCC(e.target.value)}>
                  <option value="">Todos</option>
                  {centrosNomes.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
              <Btn small onClick={() => { setFp(emptyPagar()); setModal("newPagar"); }}>+ Nova conta</Btn>
            </div>
          </div>

          <Table
            headers={["Descrição / Fornecedor", "Valor", "Vencimento", "Centro de Custo", "Forma Pagto.", "Situação", "Ações"]}
            rows={contasPagar
              .filter((c) => (!filtroPagarSit || c.situacao === filtroPagarSit) && (!filtroPagarCC || c.centroCusto === filtroPagarCC))
              .map((c) => [
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.84rem", color: "var(--text-strong)" }}>{c.descricao}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.fornecedor}</p>
                </div>,
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.88rem", color: c.situacao === "Vencido" ? "var(--danger-fg)" : "var(--text-strong)" }}>{fmt(c.valor)}</span>,
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--text-body)" }}>{formatDisplayDate(c.vencimento)}</p>
                  {c.pagamento && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-muted)" }}>Pago: {c.pagamento}</p>}
                </div>,
                c.centroCusto,
                c.formaPagamento,
                <Badge label={c.situacao} color={situacaoPagarColor[c.situacao]} />,
                <div style={{ display: "flex", gap: "5px" }}>
                  <Btn small variant="secondary" onClick={() => openEditPagar(c)}>Editar</Btn>
                  {c.situacao === "Pendente" && (
                    <Btn small onClick={() => setContasPagar(contasPagar.map((x) => x.id === c.id ? { ...x, situacao: "Pago", pagamento: new Date().toISOString().slice(0, 10) } : x))}>
                      Pagar
                    </Btn>
                  )}
                </div>,
              ])}
          />

          {/* resumo por centro */}
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {centrosNomes.map((cc) => {
              const total = contasPagar.filter((c) => c.centroCusto === cc && c.situacao !== "Cancelado").reduce((s, c) => s + c.valor, 0);
              if (total === 0) return null;
              return (
                <div key={cc} style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "10px 14px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{cc}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.88rem", color: "var(--danger-fg)" }}>{fmt(total)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ══ CONTAS A RECEBER ══════════════════════════════════════════ */}
      {tab === "receber" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <SectionTitle>Contas a Receber</SectionTitle>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ width: "160px" }}>
                <Select label="Situação" value={filtroReceberSit} onChange={(e) => setFiltroReceberSit(e.target.value)}>
                  <option value="">Todas</option>
                  <option>Pendente</option><option>Recebido</option><option>Parcial</option><option>Vencido</option><option>Cancelado</option>
                </Select>
              </div>
              <div style={{ width: "160px" }}>
                <Select label="Centro de custo" value={filtroReceberCC} onChange={(e) => setFiltroReceberCC(e.target.value)}>
                  <option value="">Todos</option>
                  {centrosNomes.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
              <Btn small onClick={() => { setFr(emptyReceber()); setModal("newReceber"); }}>+ Nova conta</Btn>
            </div>
          </div>

          <Table
            headers={["Descrição / Cliente", "Valor total", "Recebido", "Vencimento", "Centro", "Situação", "Ações"]}
            rows={contasReceber
              .filter((c) => (!filtroReceberSit || c.situacao === filtroReceberSit) && (!filtroReceberCC || c.centroCusto === filtroReceberCC))
              .map((c) => {
                const pct = c.valor > 0 ? Math.round((c.valorRecebido / c.valor) * 100) : 0;
                return [
                  <div>
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.84rem", color: "var(--text-strong)" }}>{c.descricao}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.cliente}</p>
                  </div>,
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.88rem" }}>{fmt(c.valor)}</span>,
                  <div>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--ok-fg)", fontWeight: 700 }}>{fmt(c.valorRecebido)}</span>
                    <div style={{ width: "70px", height: "5px", background: "var(--bg-page)", borderRadius: "3px", marginTop: "3px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: "3px", background: "var(--brand-700)" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{pct}%</span>
                  </div>,
                  c.vencimento,
                  c.centroCusto,
                  <Badge label={c.situacao} color={situacaoReceberColor[c.situacao]} />,
                  <div style={{ display: "flex", gap: "5px" }}>
                    <Btn small variant="secondary" onClick={() => openEditReceber(c)}>Editar</Btn>
                    {(c.situacao === "Pendente" || c.situacao === "Parcial") && (
                      <Btn small onClick={() => setContasReceber(contasReceber.map((x) => x.id === c.id ? { ...x, situacao: "Recebido", valorRecebido: x.valor, recebimento: new Date().toISOString().slice(0, 10) } : x))}>
                        Receber
                      </Btn>
                    )}
                  </div>,
                ];
              })}
          />
        </Card>
      )}

      {/* ══ CAIXA ════════════════════════════════════════════════════ */}
      {tab === "caixa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* status do caixa atual */}
          <div
            style={{
              background: caixaAberto ? "var(--ok-bg)" : "var(--danger-bg)",
              borderLeft: `4px solid ${caixaAberto ? "var(--ok-fg)" : "var(--danger-fg)"}`,
              borderRadius: "0 14px 14px 0",
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1rem", color: caixaAberto ? "var(--ok-fg)" : "var(--danger-fg)", marginBottom: "4px" }}>
                <StatusBadge status={caixaAberto ? "Caixa aberto" : "Caixa fechado"} tone={caixaAberto ? "ok" : "neutral"} />
              </p>
              {caixaAberto && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--text-body)" }}>
                  Operador: <strong>{caixaAberto.operador}</strong> · Data: {formatDisplayDate(caixaAberto.data)} ·
                  Saldo atual: <strong>{fmt(saldoCaixa)}</strong>
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {!caixaAberto && (
                <Btn onClick={() => { setFc(emptyCaixa()); setModal("abrirCaixa"); }}>Abrir Caixa</Btn>
              )}
              {caixaAberto && (
                <Btn variant="danger" onClick={() => { setFf(emptyFechar()); setModal("fecharCaixa"); }}>Fechar Caixa</Btn>
              )}
            </div>
          </div>

          {/* histórico de caixas */}
          <Card>
            <SectionTitle>Histórico de Caixas</SectionTitle>
            <Table
              headers={["Data", "Operador", "Abertura", "Entradas", "Saídas", "Saldo final", "Fechamento", "Status"]}
              rows={caixas.map((c) => [
                c.data,
                c.operador,
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem" }}>{fmt(c.valorAbertura)}</span>,
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--ok-fg)", fontWeight: 700 }}>+{fmt(c.entradas)}</span>,
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--danger-fg)", fontWeight: 700 }}>−{fmt(c.saidas)}</span>,
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.88rem", color: "var(--brand-900)" }}>
                  {fmt(c.valorAbertura + c.entradas - c.saidas)}
                </span>,
                c.valorFechamento ? fmt(c.valorFechamento) : "—",
                <Badge label={c.situacao} color={c.situacao === "Aberto" ? "green" : "gray"} />,
              ])}
            />
          </Card>
        </div>
      )}

      {/* ══ CENTRO DE CUSTO ══════════════════════════════════════════ */}
      {tab === "centrocusto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* gráfico de barras horizontal */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <SectionTitle>Resultado por Centro de Custo</SectionTitle>
              <Btn small onClick={() => { setFcc(emptyCentro()); setModal("newCentro"); }}>+ Novo Centro</Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {centros.filter((c) => c.ativo).map((c) => {
                const saldo  = c.receitas - c.despesas;
                const maxVal = Math.max(...centros.map((x) => x.receitas));
                const pctR   = maxVal > 0 ? Math.round((c.receitas  / maxVal) * 100) : 0;
                const pctD   = maxVal > 0 ? Math.round((c.despesas  / maxVal) * 100) : 0;
                return (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px", alignItems: "center" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.82rem", color: "var(--text-strong)" }}>{c.nome}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: saldo >= 0 ? "var(--ok-fg)" : "var(--danger-fg)", fontWeight: 700 }}>
                        {saldo >= 0 ? "+" : ""}{fmt(saldo)}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "var(--ok-fg)", width: "60px", textAlign: "right" }}>{fmt(c.receitas)}</span>
                        <div style={{ flex: 1, height: "8px", background: "var(--bg-page)", borderRadius: "4px" }}>
                          <div style={{ height: "100%", width: `${pctR}%`, background: "var(--brand-700)", borderRadius: "4px" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "var(--danger-fg)", width: "60px", textAlign: "right" }}>{fmt(c.despesas)}</span>
                        <div style={{ flex: 1, height: "8px", background: "var(--bg-page)", borderRadius: "4px" }}>
                          <div style={{ height: "100%", width: `${pctD}%`, background: "var(--danger-fg)", borderRadius: "4px" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <Table
              headers={["Código", "Centro de Custo", "Descrição", "Receitas", "Despesas", "Saldo", "Status", "Ações"]}
              rows={centros.map((c) => {
                const saldo = c.receitas - c.despesas;
                return [
                  c.codigo,
                  c.nome,
                  c.descricao,
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--ok-fg)" }}>{fmt(c.receitas)}</span>,
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--danger-fg)" }}>{fmt(c.despesas)}</span>,
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: saldo >= 0 ? "var(--brand-900)" : "var(--danger-fg)" }}>{fmt(saldo)}</span>,
                  <Badge label={c.ativo ? "Ativo" : "Inativo"} color={c.ativo ? "green" : "gray"} />,
                  <div style={{ display: "flex", gap: "5px" }}>
                    <Btn small variant="secondary" onClick={() => { setSelectedCentro(c); setFcc({ codigo: c.codigo, nome: c.nome, descricao: c.descricao }); setModal("editCentro"); }}>Editar</Btn>
                    <Btn small variant={c.ativo ? "danger" : "ghost"} onClick={() => setCentros(centros.map((x) => x.id === c.id ? { ...x, ativo: !x.ativo } : x))}>
                      {c.ativo ? "Inativar" : "Ativar"}
                    </Btn>
                  </div>,
                ];
              })}
            />
          </Card>
        </div>
      )}

      {/* ══ CONCILIAÇÃO BANCÁRIA ══════════════════════════════════════ */}
      {tab === "conciliacao" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <SectionTitle>Conciliação Bancária</SectionTitle>
            <Btn small onClick={() => { setFcon(emptyConcilia()); setModal("newConcilia"); }}>+ Lançamento manual</Btn>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ width: "160px" }}>
              <Input label="Data início" type="date" value={conciliaInicio} onChange={(e) => setConciliaInicio(e.target.value)} />
            </div>
            <div style={{ width: "160px" }}>
              <Input label="Data fim" type="date" value={conciliaFim} onChange={(e) => setConciliaFim(e.target.value)} />
            </div>
          </div>

          {/* resumo do período */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Conciliados",  value: conciliadosFiltrados.filter((c) => c.situacao === "Conciliado").length,  color: "var(--ok-fg)" },
              { label: "Divergentes",  value: conciliadosFiltrados.filter((c) => c.situacao === "Divergente").length,  color: "var(--danger-fg)" },
              { label: "Pendentes",    value: conciliadosFiltrados.filter((c) => c.situacao === "Pendente").length,    color: "var(--warn-fg)" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.label}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1.3rem", color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          <Table
            headers={["Data", "Descrição", "Tipo", "Valor banco", "Valor sistema", "Diferença", "Status"]}
            rows={conciliadosFiltrados.map((c) => {
              const dif = c.valorBanco - c.valorSistema;
              return [
                c.data,
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.84rem", color: "var(--text-strong)" }}>{c.descricao}</p>
                  {c.observacoes && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.observacoes}</p>}
                </div>,
                <Badge label={c.tipo} color={c.tipo === "Crédito" ? "green" : "red"} />,
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.88rem", color: c.tipo === "Crédito" ? "var(--ok-fg)" : "var(--danger-fg)" }}>
                  {c.tipo === "Crédito" ? "+" : "−"}{fmt(c.valorBanco)}
                </span>,
                fmt(c.valorSistema),
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: Math.abs(dif) < 0.01 ? "var(--text-muted)" : "var(--danger-fg)" }}>
                  {Math.abs(dif) < 0.01 ? "—" : (dif > 0 ? "+" : "") + fmt(Math.abs(dif))}
                </span>,
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <Badge label={c.situacao} color={conciliaColor[c.situacao]} />
                  {c.situacao !== "Conciliado" && (
                    <Btn small variant="ghost" onClick={() => setConciliacao(conciliacao.map((x) => x.id === c.id ? { ...x, situacao: "Conciliado", valorSistema: x.valorBanco } : x))}>
                      Conciliar
                    </Btn>
                  )}
                </div>,
              ];
            })}
          />
        </Card>
      )}

      {/* ══ MODAIS ═══════════════════════════════════════════════════ */}

      {/* Nova / Editar Conta a Pagar */}
      {(modal === "newPagar" || modal === "editPagar") && (
        <Modal title={modal === "newPagar" ? "Nova Conta a Pagar" : "Editar Conta a Pagar"} onClose={() => setModal(null)} wide>
          <FormGrid cols={2}>
            <FullCol><Input label="Descrição *" value={fp.descricao} onChange={(e) => setFp({ ...fp, descricao: e.target.value })} /></FullCol>
            <Input label="Fornecedor / Credor" value={fp.fornecedor} onChange={(e) => setFp({ ...fp, fornecedor: e.target.value })} />
            <Input label="Valor *" placeholder="0.00" type="number" min="0" value={fp.valor} onChange={(e) => setFp({ ...fp, valor: e.target.value })} />
            <Input label="Vencimento *" type="date" value={fp.vencimento} onChange={(e) => setFp({ ...fp, vencimento: e.target.value })} />
            <Input label="Data de pagamento" type="date" value={fp.pagamento} onChange={(e) => setFp({ ...fp, pagamento: e.target.value })} />
            <Select label="Forma de pagamento" value={fp.formaPagamento} onChange={(e) => setFp({ ...fp, formaPagamento: e.target.value })}>
              {formasPagamento.map((f) => <option key={f}>{f}</option>)}
            </Select>
            <Select label="Centro de Custo *" value={fp.centroCusto} onChange={(e) => setFp({ ...fp, centroCusto: e.target.value })}>
              {centrosNomes.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select label="Situação" value={fp.situacao} onChange={(e) => setFp({ ...fp, situacao: e.target.value as SituacaoPagar })}>
              <option>Pendente</option><option>Pago</option><option>Vencido</option><option>Cancelado</option>
            </Select>
            <FullCol><Input label="Observações" value={fp.observacoes} onChange={(e) => setFp({ ...fp, observacoes: e.target.value })} /></FullCol>
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={savePagar}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {/* Nova / Editar Conta a Receber */}
      {(modal === "newReceber" || modal === "editReceber") && (
        <Modal title={modal === "newReceber" ? "Nova Conta a Receber" : "Editar Conta a Receber"} onClose={() => setModal(null)} wide>
          <FormGrid cols={2}>
            <FullCol><Input label="Descrição *" value={fr.descricao} onChange={(e) => setFr({ ...fr, descricao: e.target.value })} /></FullCol>
            <Input label="Cliente / Devedor" value={fr.cliente} onChange={(e) => setFr({ ...fr, cliente: e.target.value })} />
            <Input label="Valor total *" placeholder="0.00" type="number" min="0" value={fr.valor} onChange={(e) => setFr({ ...fr, valor: e.target.value })} />
            <Input label="Valor recebido" placeholder="0.00" type="number" min="0" value={fr.valorRecebido} onChange={(e) => setFr({ ...fr, valorRecebido: e.target.value })} />
            <Input label="Vencimento *" type="date" value={fr.vencimento} onChange={(e) => setFr({ ...fr, vencimento: e.target.value })} />
            <Input label="Data de recebimento" type="date" value={fr.recebimento} onChange={(e) => setFr({ ...fr, recebimento: e.target.value })} />
            <Select label="Forma de pagamento" value={fr.formaPagamento} onChange={(e) => setFr({ ...fr, formaPagamento: e.target.value })}>
              {formasPagamento.map((f) => <option key={f}>{f}</option>)}
            </Select>
            <Select label="Centro de Custo *" value={fr.centroCusto} onChange={(e) => setFr({ ...fr, centroCusto: e.target.value })}>
              {centrosNomes.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select label="Situação" value={fr.situacao} onChange={(e) => setFr({ ...fr, situacao: e.target.value as SituacaoReceber })}>
              <option>Pendente</option><option>Recebido</option><option>Parcial</option><option>Vencido</option><option>Cancelado</option>
            </Select>
            <FullCol><Input label="Observações" value={fr.observacoes} onChange={(e) => setFr({ ...fr, observacoes: e.target.value })} /></FullCol>
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={saveReceber}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {/* Abrir Caixa */}
      {modal === "abrirCaixa" && (
        <Modal title="Abrir Caixa" onClose={() => setModal(null)}>
          <FormGrid cols={1}>
            <Input label="Operador responsável *" placeholder="Nome do operador" value={fc.operador} onChange={(e) => setFc({ ...fc, operador: e.target.value })} />
            <Input label="Valor de abertura (fundo de caixa) *" type="number" min="0" placeholder="0.00" value={fc.valorAbertura} onChange={(e) => setFc({ ...fc, valorAbertura: e.target.value })} />
            <Input label="Observações" value={fc.observacoes} onChange={(e) => setFc({ ...fc, observacoes: e.target.value })} />
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={abrirCaixa}>Confirmar abertura</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {/* Fechar Caixa */}
      {modal === "fecharCaixa" && (
        <Modal title="Fechar Caixa" onClose={() => setModal(null)}>
          {caixaAberto && (
            <div style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "14px 16px", marginBottom: "18px" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px" }}>Resumo do caixa atual</p>
              {[
                ["Valor de abertura", fmt(caixaAberto.valorAbertura)],
                ["Entradas do dia",   "+" + fmt(caixaAberto.entradas)],
                ["Saídas do dia",     "−" + fmt(caixaAberto.saidas)],
                ["Saldo calculado",   fmt(saldoCaixa)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--text-body)" }}>{k}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.82rem", color: "var(--text-strong)" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          <FormGrid cols={1}>
            <Input label="Valor físico em caixa *" type="number" min="0" placeholder="0.00" value={ff.valorFechamento} onChange={(e) => setFf({ ...ff, valorFechamento: e.target.value })} />
            <Input label="Observações" value={ff.observacoes} onChange={(e) => setFf({ ...ff, observacoes: e.target.value })} />
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn variant="danger" onClick={fecharCaixa}>Fechar caixa</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {/* Novo / Editar Centro de Custo */}
      {(modal === "newCentro" || modal === "editCentro") && (
        <Modal title={modal === "newCentro" ? "Novo Centro de Custo" : "Editar Centro de Custo"} onClose={() => setModal(null)}>
          <FormGrid cols={2}>
            <Input label="Código *" placeholder="CC-007" value={fcc.codigo} onChange={(e) => setFcc({ ...fcc, codigo: e.target.value })} />
            <Input label="Nome *" value={fcc.nome} onChange={(e) => setFcc({ ...fcc, nome: e.target.value })} />
            <FullCol><Input label="Descrição" value={fcc.descricao} onChange={(e) => setFcc({ ...fcc, descricao: e.target.value })} /></FullCol>
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={saveCentro}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {/* Lançamento conciliação manual */}
      {modal === "newConcilia" && (
        <Modal title="Lançamento de Conciliação" onClose={() => setModal(null)}>
          <FormGrid cols={2}>
            <Input label="Data *" type="date" value={fcon.data} onChange={(e) => setFcon({ ...fcon, data: e.target.value })} />
            <Select label="Tipo" value={fcon.tipo} onChange={(e) => setFcon({ ...fcon, tipo: e.target.value as "Crédito" | "Débito" })}>
              <option>Crédito</option><option>Débito</option>
            </Select>
            <FullCol><Input label="Descrição *" value={fcon.descricao} onChange={(e) => setFcon({ ...fcon, descricao: e.target.value })} /></FullCol>
            <Input label="Valor banco *" type="number" min="0" value={fcon.valorBanco} onChange={(e) => setFcon({ ...fcon, valorBanco: e.target.value })} />
            <Input label="Valor sistema *" type="number" min="0" value={fcon.valorSistema} onChange={(e) => setFcon({ ...fcon, valorSistema: e.target.value })} />
            <FullCol><Input label="Observações" value={fcon.observacoes} onChange={(e) => setFcon({ ...fcon, observacoes: e.target.value })} /></FullCol>
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={saveConcilia}>Salvar lançamento</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}
    </div>
  );
}
