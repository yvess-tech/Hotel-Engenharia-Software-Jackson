import { useState } from "react";
import {
  PageHeader, Card, Btn, Input, Select, Table, Modal,
  Badge, SectionTitle, Tabs, FormGrid, FullCol, FormActions, KpiCard, Icon,
} from "../ui";

const SERIF = "'Inria Serif', Georgia, serif";

/* ── tipos ───────────────────────────────────────────────────────────── */
type Categoria = "Limpeza" | "Roupas de cama" | "Bebidas" | "Alimentos" | "Amenities" | "Manutenção";
type Status = "Ativo" | "Inativo";
type TipoMov = "Entrada" | "Saída";

interface Produto {
  id: number;
  codigo: string;
  nome: string;
  categoria: Categoria;
  unidade: string;
  quantidade: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  localizacao: string;
  fornecedor: string;
  observacoes: string;
  status: Status;
  dataCadastro: string;
}

interface Movimentacao {
  id: number;
  idProduto: number;
  nomeProduto: string;
  tipo: TipoMov;
  quantidade: number;
  responsavel: string;
  observacoes: string;
  dataHora: string;
}

/* ── dados iniciais ──────────────────────────────────────────────────── */
const initialProdutos: Produto[] = [
  { id: 1, codigo: "LMP-001", nome: "Sabonete",           categoria: "Amenities",      unidade: "un",  quantidade: 12,  estoqueMinimo: 50,  estoqueMaximo: 300, localizacao: "Dep. A1", fornecedor: "Distribuidora X", observacoes: "",                      status: "Ativo", dataCadastro: "2026-01-10" },
  { id: 2, codigo: "LMP-002", nome: "Detergente 1L",      categoria: "Limpeza",        unidade: "L",   quantidade: 8,   estoqueMinimo: 15,  estoqueMaximo: 80,  localizacao: "Dep. A2", fornecedor: "Distribuidora X", observacoes: "",                      status: "Ativo", dataCadastro: "2026-01-10" },
  { id: 3, codigo: "RPC-001", nome: "Toalha de banho",    categoria: "Roupas de cama", unidade: "un",  quantidade: 80,  estoqueMinimo: 40,  estoqueMaximo: 200, localizacao: "Dep. B1", fornecedor: "Têxteis Sul",     observacoes: "",                      status: "Ativo", dataCadastro: "2026-01-15" },
  { id: 4, codigo: "RPC-002", nome: "Lençol solteiro",    categoria: "Roupas de cama", unidade: "un",  quantidade: 120, estoqueMinimo: 60,  estoqueMaximo: 300, localizacao: "Dep. B1", fornecedor: "Têxteis Sul",     observacoes: "",                      status: "Ativo", dataCadastro: "2026-01-15" },
  { id: 5, codigo: "BEB-001", nome: "Água mineral 500ml", categoria: "Bebidas",        unidade: "cx",  quantidade: 30,  estoqueMinimo: 20,  estoqueMaximo: 100, localizacao: "Dep. C1", fornecedor: "Bebidas RO",      observacoes: "Cx c/ 12 un.",          status: "Ativo", dataCadastro: "2026-02-01" },
  { id: 6, codigo: "ALI-001", nome: "Café em pó 500g",    categoria: "Alimentos",      unidade: "kg",  quantidade: 6,   estoqueMinimo: 10,  estoqueMaximo: 40,  localizacao: "Dep. C2", fornecedor: "Café Seleção",    observacoes: "",                      status: "Ativo", dataCadastro: "2026-02-01" },
  { id: 7, codigo: "MAN-001", nome: "Lâmpada LED 9W",     categoria: "Manutenção",     unidade: "un",  quantidade: 25,  estoqueMinimo: 20,  estoqueMaximo: 100, localizacao: "Dep. D1", fornecedor: "Elétrica Norte",  observacoes: "",                      status: "Ativo", dataCadastro: "2026-03-05" },
  { id: 8, codigo: "AME-001", nome: "Shampoo 30ml",       categoria: "Amenities",      unidade: "un",  quantidade: 45,  estoqueMinimo: 80,  estoqueMaximo: 400, localizacao: "Dep. A1", fornecedor: "Distribuidora X", observacoes: "Frasco individual",    status: "Ativo", dataCadastro: "2026-01-10" },
];

const initialMovimentacoes: Movimentacao[] = [
  { id: 1, idProduto: 3, nomeProduto: "Toalha de banho",    tipo: "Entrada", quantidade: 40,  responsavel: "João Carlos", observacoes: "Reposição mensal",    dataHora: "13/09/2026 09:00" },
  { id: 2, idProduto: 1, nomeProduto: "Sabonete",           tipo: "Saída",   quantidade: 30,  responsavel: "Maria Lima",  observacoes: "Abastecimento quartos", dataHora: "13/09/2026 08:30" },
  { id: 3, idProduto: 5, nomeProduto: "Água mineral 500ml", tipo: "Entrada", quantidade: 10,  responsavel: "João Carlos", observacoes: "Pedido emergencial",   dataHora: "12/09/2026 14:00" },
  { id: 4, idProduto: 6, nomeProduto: "Café em pó 500g",    tipo: "Saída",   quantidade: 2,   responsavel: "Ana Souza",   observacoes: "Café da manhã",        dataHora: "12/09/2026 07:00" },
];

type Tab = "produtos" | "movimentacoes" | "alertas";

const categorias: Categoria[] = ["Limpeza", "Roupas de cama", "Bebidas", "Alimentos", "Amenities", "Manutenção"];

const categoriaBadge: Record<Categoria, "blue" | "green" | "yellow" | "gray" | "purple" | "red"> = {
  Limpeza:        "blue",
  "Roupas de cama":"green",
  Bebidas:        "yellow",
  Alimentos:      "purple",
  Amenities:      "gray",
  Manutenção:     "red",
};

function nivelEstoque(p: Produto): "Crítico" | "Baixo" | "OK" | "Excesso" {
  if (p.quantidade <= 0)                   return "Crítico";
  if (p.quantidade < p.estoqueMinimo)      return p.quantidade < p.estoqueMinimo * 0.5 ? "Crítico" : "Baixo";
  if (p.quantidade > p.estoqueMaximo)      return "Excesso";
  return "OK";
}

function nivelColor(nivel: string): "red" | "yellow" | "green" | "blue" {
  if (nivel === "Crítico") return "red";
  if (nivel === "Baixo")   return "yellow";
  if (nivel === "Excesso") return "blue";
  return "green";
}

function pctEstoque(p: Produto) {
  if (p.estoqueMaximo === 0) return 0;
  return Math.min(100, Math.round((p.quantidade / p.estoqueMaximo) * 100));
}

/* ── componente ──────────────────────────────────────────────────────── */
export default function Estoque() {
  const [produtos, setProdutos]           = useState<Produto[]>(initialProdutos);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(initialMovimentacoes);
  const [tab, setTab]                     = useState<Tab>("produtos");

  /* modais */
  const [modalProduto, setModalProduto] = useState<"new" | "edit" | "view" | null>(null);
  const [modalMov, setModalMov]         = useState<TipoMov | null>(null);
  const [selected, setSelected]         = useState<Produto | null>(null);

  /* filtros */
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus]       = useState("Ativo");
  const [filtroNivel, setFiltroNivel]         = useState("");
  const [busca, setBusca]                     = useState("");

  /* formulário produto */
  const emptyProduto = () => ({
    codigo: "", nome: "", categoria: "Limpeza" as Categoria,
    unidade: "un", quantidade: "", estoqueMinimo: "", estoqueMaximo: "",
    localizacao: "", fornecedor: "", observacoes: "",
  });
  const [fp, setFp] = useState(emptyProduto());
  const fp_ = (k: keyof ReturnType<typeof emptyProduto>, v: string) =>
    setFp((prev) => ({ ...prev, [k]: v }));

  /* formulário movimentação */
  const [fm, setFm] = useState({ idProduto: "", quantidade: "", responsavel: "", observacoes: "" });

  /* ── produtos filtrados ── */
  const produtosFiltrados = produtos.filter((p) => {
    const nivel = nivelEstoque(p);
    return (
      (!filtroCategoria || p.categoria === filtroCategoria) &&
      (!filtroStatus    || p.status === filtroStatus) &&
      (!filtroNivel     || nivel === filtroNivel) &&
      (!busca           || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo.toLowerCase().includes(busca.toLowerCase()))
    );
  });

  const alertas = produtos.filter((p) => {
    const n = nivelEstoque(p);
    return p.status === "Ativo" && (n === "Crítico" || n === "Baixo");
  });

  /* ── ações ── */
  const saveProduto = () => {
    const base = {
      codigo: fp.codigo, nome: fp.nome, categoria: fp.categoria,
      unidade: fp.unidade, quantidade: Number(fp.quantidade),
      estoqueMinimo: Number(fp.estoqueMinimo), estoqueMaximo: Number(fp.estoqueMaximo),
      localizacao: fp.localizacao, fornecedor: fp.fornecedor, observacoes: fp.observacoes,
    };
    if (modalProduto === "new") {
      setProdutos([...produtos, { id: Date.now(), ...base, status: "Ativo", dataCadastro: new Date().toISOString().slice(0, 10) }]);
    } else if (modalProduto === "edit" && selected) {
      setProdutos(produtos.map((p) => p.id === selected.id ? { ...p, ...base } : p));
    }
    setModalProduto(null);
  };

  const inativar = (id: number) =>
    setProdutos(produtos.map((p) => p.id === id ? { ...p, status: p.status === "Ativo" ? "Inativo" : "Ativo" } : p));

  const saveMovimentacao = () => {
    if (!fm.idProduto || !fm.quantidade || !fm.responsavel) return;
    const produto = produtos.find((p) => p.id === Number(fm.idProduto));
    if (!produto) return;
    const qty = Number(fm.quantidade);
    const delta = modalMov === "Entrada" ? qty : -qty;
    setProdutos(produtos.map((p) => p.id === produto.id ? { ...p, quantidade: Math.max(0, p.quantidade + delta) } : p));
    setMovimentacoes([
      {
        id: Date.now(), idProduto: produto.id, nomeProduto: produto.nome,
        tipo: modalMov!, quantidade: qty, responsavel: fm.responsavel,
        observacoes: fm.observacoes, dataHora: new Date().toLocaleString("pt-BR"),
      },
      ...movimentacoes,
    ]);
    setFm({ idProduto: "", quantidade: "", responsavel: "", observacoes: "" });
    setModalMov(null);
  };

  const openEdit = (p: Produto) => {
    setSelected(p);
    setFp({
      codigo: p.codigo, nome: p.nome, categoria: p.categoria,
      unidade: p.unidade, quantidade: String(p.quantidade),
      estoqueMinimo: String(p.estoqueMinimo), estoqueMaximo: String(p.estoqueMaximo),
      localizacao: p.localizacao, fornecedor: p.fornecedor, observacoes: p.observacoes,
    });
    setModalProduto("edit");
  };

  /* ── KPIs ── */
  const totalAtivos    = produtos.filter((p) => p.status === "Ativo").length;
  const totalCriticos  = alertas.filter((p) => nivelEstoque(p) === "Crítico").length;
  const totalBaixo     = alertas.filter((p) => nivelEstoque(p) === "Baixo").length;
  const totalMov       = movimentacoes.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Estoque"
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn variant="secondary" onClick={() => { setFm({ idProduto: "", quantidade: "", responsavel: "", observacoes: "" }); setModalMov("Saída"); }}>
              − Registrar Saída
            </Btn>
            <Btn variant="secondary" onClick={() => { setFm({ idProduto: "", quantidade: "", responsavel: "", observacoes: "" }); setModalMov("Entrada"); }}>
              + Registrar Entrada
            </Btn>
            <Btn onClick={() => { setFp(emptyProduto()); setModalProduto("new"); }}>
              + Novo Produto
            </Btn>
          </div>
        }
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <KpiCard label="Produtos ativos" value={String(totalAtivos)} icon="package" />
        <KpiCard label="Em nível crítico" value={String(totalCriticos)} icon="octagon-alert" tone={totalCriticos > 0 ? "danger" : "default"} />
        <KpiCard label="Abaixo do mínimo" value={String(totalBaixo)} icon="triangle-alert" tone={totalBaixo > 0 ? "warn" : "default"} />
        <KpiCard label="Movimentações hoje" value={String(totalMov)} icon="arrow-left-right" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "produtos",      label: `Produtos (${totalAtivos})` },
          { id: "movimentacoes", label: "Movimentações" },
          { id: "alertas",       label: alertas.length > 0 ? `Alertas (${alertas.length})` : "Alertas" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ══ ABA: PRODUTOS ══════════════════════════════════════════════ */}
      {tab === "produtos" && (
        <Card>
          {/* filtros */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 180px" }}>
              <Input label="Buscar" placeholder="Nome ou código…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div style={{ width: "160px" }}>
              <Select label="Categoria" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div style={{ width: "140px" }}>
              <Select label="Nível" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
                <option value="">Todos</option>
                <option>Crítico</option>
                <option>Baixo</option>
                <option>OK</option>
                <option>Excesso</option>
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

          <Table
            headers={["Código", "Produto", "Categoria", "Quantidade", "Mín / Máx", "Localização", "Nível", "Ações"]}
            rows={produtosFiltrados.map((p) => {
              const nivel = nivelEstoque(p);
              const pct   = pctEstoque(p);
              return [
                p.codigo,
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-strong)" }}>{p.nome}</p>
                  {p.fornecedor && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.fornecedor}</p>}
                </div>,
                <Badge label={p.categoria} color={categoriaBadge[p.categoria]} />,
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.95rem", color: nivel === "Crítico" ? "var(--danger-fg)" : "var(--text-strong)" }}>
                    {p.quantidade} {p.unidade}
                  </p>
                  {/* barra de nível */}
                  <div style={{ width: "80px", height: "5px", background: "var(--bg-page)", borderRadius: "3px", marginTop: "4px" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: "3px",
                      background: nivel === "Crítico" ? "var(--danger-fg)" : nivel === "Baixo" ? "var(--warn-fg)" : nivel === "Excesso" ? "var(--info-fg)" : "var(--brand-700)",
                    }} />
                  </div>
                </div>,
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {p.estoqueMinimo} / {p.estoqueMaximo} {p.unidade}
                </span>,
                p.localizacao || "—",
                <Badge label={nivel} color={nivelColor(nivel)} />,
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  <Btn small variant="ghost"     onClick={() => { setSelected(p); setModalProduto("view"); }}>Ver</Btn>
                  <Btn small variant="secondary" onClick={() => openEdit(p)}>Editar</Btn>
                  <Btn small variant={p.status === "Ativo" ? "danger" : "ghost"} onClick={() => inativar(p.id)}>
                    {p.status === "Ativo" ? "Inativar" : "Ativar"}
                  </Btn>
                </div>,
              ];
            })}
          />
        </Card>
      )}

      {/* ══ ABA: MOVIMENTAÇÕES ═════════════════════════════════════════ */}
      {tab === "movimentacoes" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <SectionTitle>Histórico de Movimentações (insert only)</SectionTitle>
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn small variant="secondary" onClick={() => { setFm({ idProduto: "", quantidade: "", responsavel: "", observacoes: "" }); setModalMov("Saída"); }}>− Saída</Btn>
              <Btn small onClick={() => { setFm({ idProduto: "", quantidade: "", responsavel: "", observacoes: "" }); setModalMov("Entrada"); }}>+ Entrada</Btn>
            </div>
          </div>
          <Table
            headers={["Data / Hora", "Produto", "Tipo", "Quantidade", "Responsável", "Observações"]}
            rows={movimentacoes.map((m) => [
              m.dataHora,
              m.nomeProduto,
              <Badge label={m.tipo} color={m.tipo === "Entrada" ? "green" : "red"} />,
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.88rem", color: m.tipo === "Entrada" ? "var(--ok-fg)" : "var(--danger-fg)" }}>
                {m.tipo === "Entrada" ? "+" : "−"}{m.quantidade}
              </span>,
              m.responsavel,
              m.observacoes || "—",
            ])}
          />
        </Card>
      )}

      {/* ══ ABA: ALERTAS ═══════════════════════════════════════════════ */}
      {tab === "alertas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {alertas.length === 0 ? (
            <Card>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center", padding: "32px 0" }}>
                Nenhum produto abaixo do estoque mínimo.
              </p>
            </Card>
          ) : (
            alertas.map((p) => {
              const nivel   = nivelEstoque(p);
              const urgente = nivel === "Crítico";
              return (
                <div
                  key={p.id}
                  style={{
                    background: urgente ? "var(--danger-bg)" : "var(--warn-bg)",
                    borderLeft: `4px solid ${urgente ? "var(--danger-fg)" : "var(--warn-fg)"}`,
                    borderRadius: "0 14px 14px 0",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ display: "flex", color: urgente ? "var(--danger-fg)" : "var(--warn-fg)" }}><Icon name={urgente ? "octagon-alert" : "triangle-alert"} /></span>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-strong)", marginBottom: "2px" }}>
                        {p.nome}
                        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                          {p.codigo} · {p.categoria}
                        </span>
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: urgente ? "var(--danger-fg)" : "var(--warn-fg)" }}>
                        Estoque atual: <strong>{p.quantidade} {p.unidade}</strong> — mínimo: {p.estoqueMinimo} {p.unidade}
                        {p.quantidade === 0 && " — ZERADO"}
                      </p>
                      {p.fornecedor && (
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Fornecedor: {p.fornecedor} · Localização: {p.localizacao}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <Badge label={nivel} color={nivelColor(nivel)} />
                    <Btn small onClick={() => { setFm({ idProduto: String(p.id), quantidade: "", responsavel: "", observacoes: "Reposição por alerta automático" }); setModalMov("Entrada"); }}>
                      + Repor
                    </Btn>
                  </div>
                </div>
              );
            })
          )}

          {alertas.length > 0 && (
            <Card>
              <SectionTitle>Resumo de alertas</SectionTitle>
              <Table
                headers={["Código", "Produto", "Categoria", "Atual", "Mínimo", "Déficit", "Nível"]}
                rows={alertas.map((p) => {
                  const nivel = nivelEstoque(p);
                  return [
                    p.codigo,
                    p.nome,
                    <Badge label={p.categoria} color={categoriaBadge[p.categoria]} />,
                    `${p.quantidade} ${p.unidade}`,
                    `${p.estoqueMinimo} ${p.unidade}`,
                    `${p.estoqueMinimo - p.quantidade} ${p.unidade}`,
                    <Badge label={nivel} color={nivelColor(nivel)} />,
                  ];
                })}
              />
            </Card>
          )}
        </div>
      )}

      {/* ══ MODAL: Cadastrar / Editar Produto ══════════════════════════ */}
      {(modalProduto === "new" || modalProduto === "edit") && (
        <Modal
          title={modalProduto === "new" ? "Cadastrar Produto" : `Editar Produto — ${selected?.nome}`}
          onClose={() => setModalProduto(null)}
          wide
        >
          <FormGrid cols={2}>
            <Input label="Código *" placeholder="LMP-001" value={fp.codigo} onChange={(e) => fp_("codigo", e.target.value)} />
            <Select label="Categoria *" value={fp.categoria} onChange={(e) => fp_("categoria", e.target.value as Categoria)}>
              {categorias.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <FullCol>
              <Input label="Nome do produto *" value={fp.nome} onChange={(e) => fp_("nome", e.target.value)} />
            </FullCol>
            <Select label="Unidade de medida *" value={fp.unidade} onChange={(e) => fp_("unidade", e.target.value)}>
              <option value="un">un (unidade)</option>
              <option value="kg">kg (quilograma)</option>
              <option value="L">L (litro)</option>
              <option value="cx">cx (caixa)</option>
              <option value="pct">pct (pacote)</option>
              <option value="m">m (metro)</option>
              <option value="par">par</option>
            </Select>
            <Input label="Quantidade inicial *" type="number" min="0" value={fp.quantidade} onChange={(e) => fp_("quantidade", e.target.value)} />
            <Input label="Estoque mínimo *" type="number" min="0" value={fp.estoqueMinimo} onChange={(e) => fp_("estoqueMinimo", e.target.value)}
              helpText="Alerta de reposição ao atingir este valor" />
            <Input label="Estoque máximo" type="number" min="0" value={fp.estoqueMaximo} onChange={(e) => fp_("estoqueMaximo", e.target.value)} />
            <Input label="Localização (dep./prateleira)" placeholder="Dep. A1" value={fp.localizacao} onChange={(e) => fp_("localizacao", e.target.value)} />
            <FullCol>
              <Input label="Fornecedor" value={fp.fornecedor} onChange={(e) => fp_("fornecedor", e.target.value)} />
            </FullCol>
            <FullCol>
              <Input label="Observações" placeholder="Informações adicionais sobre o produto" value={fp.observacoes} onChange={(e) => fp_("observacoes", e.target.value)} />
            </FullCol>
            <FormActions>
              <Btn variant="ghost" onClick={() => setModalProduto(null)}>Cancelar</Btn>
              <Btn onClick={saveProduto}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {/* ══ MODAL: Visualizar Produto ═══════════════════════════════════ */}
      {modalProduto === "view" && selected && (() => {
        const nivel = nivelEstoque(selected);
        const pct   = pctEstoque(selected);
        return (
          <Modal title={`${selected.codigo} — ${selected.nome}`} onClose={() => setModalProduto(null)} wide>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              {[
                ["Código",       selected.codigo],
                ["Categoria",    selected.categoria],
                ["Unidade",      selected.unidade],
                ["Fornecedor",   selected.fornecedor || "—"],
                ["Localização",  selected.localizacao || "—"],
                ["Cadastrado em",selected.dataCadastro],
                ["Observações",  selected.observacoes || "—"],
                ["Status",       selected.status],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.87rem", color: "var(--text-strong)" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Nível de estoque visual */}
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <SectionTitle>Nível de estoque</SectionTitle>
                <Badge label={nivel} color={nivelColor(nivel)} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--text-muted)" }}>Atual: <strong>{selected.quantidade} {selected.unidade}</strong></span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--text-muted)" }}>Mín: {selected.estoqueMinimo} · Máx: {selected.estoqueMaximo}</span>
              </div>
              <div style={{ height: "12px", background: "var(--border)", borderRadius: "6px" }}>
                <div style={{
                  height: "100%", width: `${pct}%`, borderRadius: "6px",
                  background: nivel === "Crítico" ? "var(--danger-fg)" : nivel === "Baixo" ? "var(--warn-fg)" : nivel === "Excesso" ? "var(--info-fg)" : "var(--brand-700)",
                  transition: "width 0.3s",
                }} />
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>{pct}% da capacidade máxima</p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Btn variant="ghost" onClick={() => setModalProduto(null)}>Fechar</Btn>
              <Btn variant="secondary" onClick={() => openEdit(selected)}>Editar</Btn>
            </div>
          </Modal>
        );
      })()}

      {/* ══ MODAL: Entrada / Saída de Estoque ══════════════════════════ */}
      {modalMov && (
        <Modal
          title={modalMov === "Entrada" ? "Registrar Entrada" : "Registrar Saída"}
          onClose={() => setModalMov(null)}
        >
          <div
            style={{
              background: modalMov === "Entrada" ? "var(--ok-bg)" : "var(--danger-bg)",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "18px",
              fontFamily: "var(--font-sans)",
              fontSize: "0.82rem",
              color: modalMov === "Entrada" ? "var(--ok-fg)" : "var(--danger-fg)",
              borderLeft: `4px solid ${modalMov === "Entrada" ? "var(--ok-fg)" : "var(--danger-fg)"}`,
            }}
          >
            {modalMov === "Entrada"
              ? "A quantidade informada será somada ao estoque atual do produto."
              : "A quantidade informada será subtraída do estoque atual. (Registro imutável — insert only)"}
          </div>

          <FormGrid cols={1}>
            <Select
              label="Produto *"
              value={fm.idProduto}
              onChange={(e) => setFm({ ...fm, idProduto: e.target.value })}
            >
              <option value="">Selecione o produto…</option>
              {produtos.filter((p) => p.status === "Ativo").map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.codigo} — {p.nome} (atual: {p.quantidade} {p.unidade})
                </option>
              ))}
            </Select>

            <Input
              label={`Quantidade (${fm.idProduto ? produtos.find((p) => String(p.id) === fm.idProduto)?.unidade ?? "" : "un"}) *`}
              type="number"
              min="1"
              value={fm.quantidade}
              onChange={(e) => setFm({ ...fm, quantidade: e.target.value })}
            />
            <Input
              label="Responsável *"
              placeholder="Nome do responsável pela movimentação"
              value={fm.responsavel}
              onChange={(e) => setFm({ ...fm, responsavel: e.target.value })}
            />
            <Input
              label="Observações"
              placeholder="Motivo, nota fiscal, pedido, etc."
              value={fm.observacoes}
              onChange={(e) => setFm({ ...fm, observacoes: e.target.value })}
            />
            <FormActions>
              <Btn variant="ghost" onClick={() => setModalMov(null)}>Cancelar</Btn>
              <Btn
                variant={modalMov === "Entrada" ? "primary" : "danger"}
                onClick={saveMovimentacao}
              >
                {modalMov === "Entrada" ? "Confirmar Entrada" : "Confirmar Saída"}
              </Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}
    </div>
  );
}
