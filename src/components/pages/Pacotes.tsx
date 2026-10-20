import { useEffect, useState } from "react";
import { Alert, Badge, Btn, Card, FormActions, FormGrid, FullCol, Input, KpiCard, Modal, PageHeader, SectionTitle, Select, Table, Tabs, Textarea, formatDisplayDate } from "../ui";
import { formatMoney, OPERATIONAL_SERVICES, today, useHotelOperations, type CommercialPackage, type PackageBenefit, type PackagePriceRule } from "../HotelOperationsContext";
import { useDemoEngine } from "../demo/DemoEngineContext";

type Tab = "lista" | "cards" | "promocoes";
type PackageModal = "new" | "edit" | "view" | null;

const seasons = ["Ano inteiro", "Baixa temporada", "Alta temporada", "Feriados", "Fim de ano"];
const mealPlans = ["Apenas hospedagem", "Café da manhã", "Meia pensão", "Pensão completa"];
const emptyForm = {
  code: "", name: "", description: "", season: "Ano inteiro", mealPlan: "Café da manhã",
  roomCategories: "Standard", minNights: "1", maxNights: "7", includedGuests: "2",
  price: "", priceRule: "Preço fechado" as PackagePriceRule, discountPercent: "0",
  validFrom: "", validTo: "", benefits: "", structuredBenefits: [] as PackageBenefit[], conditions: "", active: true,
};

const mockForm = () => {
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  return {
    ...emptyForm,
    code: "DEMO-FDS-RO",
    name: "Fim de Semana Pacaas",
    description: "Pacote demonstrativo com hospedagem, café da manhã e trilha guiada.",
    roomCategories: "Standard, Luxo",
    minNights: "2",
    maxNights: "3",
    includedGuests: "2",
    price: "780",
    discountPercent: "10",
    validFrom: today(),
    validTo: end.toISOString().slice(0, 10),
    benefits: "Café da manhã, Trilha guiada, Late checkout",
    conditions: "Exemplo preenchido automaticamente para apresentação do módulo.",
  };
};

function isCurrent(commercialPackage: CommercialPackage) {
  return commercialPackage.active && commercialPackage.validFrom <= today() && commercialPackage.validTo >= today();
}

export default function Pacotes() {
  const { packages, setPackages, reservations, products } = useHotelOperations();
  const [tab, setTab] = useState<Tab>("lista");
  const [modal, setModal] = useState<PackageModal>(null);
  const [selected, setSelected] = useState<CommercialPackage | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Ativo");
  const [validation, setValidation] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [benefitDraft, setBenefitDraft] = useState({ kind: "Serviço" as "Produto" | "Serviço", reference: "Café da manhã", quantity: "1", limitType: "Por hospedagem" as "Por hospedagem" | "Por diária" });
  const [demoScenarioKey, setDemoScenarioKey] = useState("");
  const demo = useDemoEngine();

  useEffect(() => {
    const command = demo.activeCommand;
    if (!command || command.target !== "pacotes" || command.command !== "prefill-package-form") return;
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    setSelected(null);
    setDemoScenarioKey(demo.scenario?.scenarioKey ?? "");
    setForm({
      ...emptyForm,
      code: String(command.payload.code),
      name: String(command.payload.name),
      description: "Pacote fictício e isolado para a demonstração da jornada completa.",
      roomCategories: "Standard",
      minNights: "3",
      maxNights: "3",
      includedGuests: "1",
      price: String(command.payload.price),
      priceRule: "Preço fechado",
      validFrom: today(),
      validTo: end.toISOString().slice(0, 10),
      benefits: "Café da manhã",
      conditions: "Uso exclusivo no cenário demonstrativo João Silva.",
    });
    setValidation("");
    setModal("new");
    demo.resolveCommand(command.id, { status: "running", message: "Pacote preenchido. Revise e use Salvar pacote." });
  }, [demo.activeCommand]);

  const filtered = packages.filter((commercialPackage) =>
    (!search || commercialPackage.name.toLowerCase().includes(search.toLowerCase()) || commercialPackage.code.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || (statusFilter === "Ativo" ? commercialPackage.active : !commercialPackage.active))
  );
  const linkedPackageIds = new Set(reservations.flatMap((reservation) => reservation.packageId ? [reservation.packageId] : []));

  const openNew = () => {
    setSelected(null);
    setDemoScenarioKey("");
    setForm(mockForm());
    setValidation("");
    setModal("new");
  };

  const openEdit = (commercialPackage: CommercialPackage) => {
    setSelected(commercialPackage);
    setForm({
      code: commercialPackage.code, name: commercialPackage.name, description: commercialPackage.description,
      season: commercialPackage.season, mealPlan: commercialPackage.mealPlan,
      roomCategories: commercialPackage.roomCategories.join(", "),
      minNights: String(commercialPackage.minNights), maxNights: String(commercialPackage.maxNights),
      includedGuests: String(commercialPackage.includedGuests), price: String(commercialPackage.price),
      priceRule: commercialPackage.priceRule, discountPercent: String(commercialPackage.discountPercent),
      validFrom: commercialPackage.validFrom, validTo: commercialPackage.validTo,
      benefits: commercialPackage.benefits.join(", "), conditions: commercialPackage.conditions,
      structuredBenefits: structuredClone(commercialPackage.structuredBenefits ?? []),
      active: commercialPackage.active,
    });
    setValidation("");
    setModal("edit");
  };

  const save = () => {
    const price = Number(form.price);
    const minNights = Number(form.minNights);
    const maxNights = Number(form.maxNights);
    const includedGuests = Number(form.includedGuests);
    const discountPercent = Number(form.discountPercent);
    if (!form.code.trim() || !form.name.trim() || !form.validFrom || !form.validTo) {
      setValidation("Código, nome e vigência são obrigatórios.");
      return;
    }
    if (form.validTo < form.validFrom) {
      setValidation("A data final da vigência deve ser posterior à data inicial.");
      return;
    }
    if (price <= 0 || minNights < 1 || maxNights < minNights || includedGuests < 1 || discountPercent < 0 || discountPercent > 100) {
      setValidation("Revise preço, desconto, hóspedes e limites de diárias.");
      return;
    }
    const duplicate = packages.some((item) => item.id !== selected?.id && item.code.toLowerCase() === form.code.trim().toLowerCase());
    if (duplicate) {
      setValidation("Já existe um pacote com este código.");
      return;
    }
    const packageData = {
      code: form.code.trim(), name: form.name.trim(), description: form.description.trim(),
      season: form.season, mealPlan: form.mealPlan,
      roomCategories: form.roomCategories.split(",").map((value) => value.trim()).filter(Boolean),
      minNights, maxNights, includedGuests, price, priceRule: form.priceRule, discountPercent,
      validFrom: form.validFrom, validTo: form.validTo,
      benefits: form.benefits.split(",").map((value) => value.trim()).filter(Boolean), structuredBenefits: form.structuredBenefits,
      conditions: form.conditions.trim(), active: form.active,
    };
    if (modal === "new") {
      const nextId = Math.max(0, ...packages.map((item) => item.id)) + 1;
      setPackages((current) => [...current, { id: nextId, scenarioKey: demoScenarioKey || undefined, ...packageData }]);
    } else if (selected) {
      setPackages((current) => current.map((item) => item.id === selected.id ? { ...item, ...packageData } : item));
    }
    setModal(null);
  };
  const addStructuredBenefit = () => {
    const quantity = Number(benefitDraft.quantity);
    const product = products.find((item) => item.id === Number(benefitDraft.reference));
    const label = benefitDraft.kind === "Produto" ? product?.name : benefitDraft.reference;
    if (!label || !Number.isFinite(quantity) || quantity <= 0) return setValidation("Selecione um item e uma quantidade válida para o benefício.");
    const benefit: PackageBenefit = { id: `BEN-${Date.now()}`, kind: benefitDraft.kind, productId: benefitDraft.kind === "Produto" ? product?.id : undefined, serviceCode: benefitDraft.kind === "Serviço" ? benefitDraft.reference : undefined, label, description: label, quantityIncluded: quantity, unit: benefitDraft.kind === "Produto" ? product?.unit ?? "un" : "un", limitType: benefitDraft.limitType, excessRule: "Cobrar preço unitário", active: true };
    setForm({ ...form, structuredBenefits: [...form.structuredBenefits, benefit] }); setValidation("");
  };

  const toggleActive = (commercialPackage: CommercialPackage) => {
    setPackages((current) => current.map((item) => item.id === commercialPackage.id ? { ...item, active: !item.active } : item));
  };

  return <div className="ops-page">
    <PageHeader title="Pacotes" actions={<Btn onClick={openNew}>+ Novo Pacote</Btn>} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Pacotes ativos" value={String(packages.filter((item) => item.active).length)} icon="gift" />
      <KpiCard label="Vigentes hoje" value={String(packages.filter(isCurrent).length)} icon="badge-check" />
      <KpiCard label="Com desconto" value={String(packages.filter((item) => item.discountPercent > 0).length)} icon="percent" />
      <KpiCard label="Vinculados a reservas" value={String(linkedPackageIds.size)} icon="link" />
    </div>
    <Tabs tabs={[{ id: "lista", label: "Lista de pacotes" }, { id: "cards", label: "Visualização comercial" }, { id: "promocoes", label: "Promoções ativas" }]} active={tab} onChange={setTab} />

    {tab === "lista" && <Card>
      <div className="ops-filters"><div className="ops-filter-search"><Input label="Buscar" placeholder="Nome ou código" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="ops-filter"><Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todos</option><option>Ativo</option><option>Inativo</option></Select></div></div>
      <Table headers={["Código", "Pacote", "Categorias", "Regra", "Valor", "Diárias", "Vigência", "Status", "Ações"]} rows={filtered.map((commercialPackage) => [
        commercialPackage.code, commercialPackage.name, commercialPackage.roomCategories.join(", "),
        commercialPackage.priceRule, formatMoney(commercialPackage.price),
        `${commercialPackage.minNights}–${commercialPackage.maxNights}`,
        `${formatDisplayDate(commercialPackage.validFrom)} a ${formatDisplayDate(commercialPackage.validTo)}`,
        <Badge label={isCurrent(commercialPackage) ? "Vigente" : commercialPackage.active ? "Fora da vigência" : "Inativo"} />,
        <div className="table-actions"><Btn small variant="ghost" onClick={() => { setSelected(commercialPackage); setModal("view"); }}>Consultar</Btn><Btn small variant="secondary" onClick={() => openEdit(commercialPackage)}>Atualizar</Btn><Btn small variant={commercialPackage.active ? "danger" : "ghost"} onClick={() => toggleActive(commercialPackage)}>{commercialPackage.active ? "Inativar" : "Ativar"}</Btn></div>,
      ])} />
      <Alert type="info">Pacotes vinculados a reservas são preservados por snapshot comercial; use inativação para impedir novas vendas.</Alert>
    </Card>}

    {tab === "cards" && <div className="package-grid">{filtered.map((commercialPackage) => <Card key={commercialPackage.id} className="package-card"><div className="package-card__header"><Badge label={commercialPackage.active ? "Ativo" : "Inativo"} /><span>{commercialPackage.code}</span></div><SectionTitle>{commercialPackage.name}</SectionTitle><p className="text-body">{commercialPackage.description}</p><div className="benefit-list">{commercialPackage.benefits.map((benefit) => <Badge key={benefit} label={benefit} />)}</div><div className="summary-grid"><Detail label="Preço" value={formatMoney(commercialPackage.price)} /><Detail label="Regra" value={commercialPackage.priceRule} /><Detail label="Hóspedes" value={`Até ${commercialPackage.includedGuests}`} /><Detail label="Diárias" value={`${commercialPackage.minNights}–${commercialPackage.maxNights}`} /></div><FormActions><Btn variant="ghost" onClick={() => { setSelected(commercialPackage); setModal("view"); }}>Ver detalhes</Btn><Btn variant="secondary" onClick={() => openEdit(commercialPackage)}>Editar</Btn></FormActions></Card>)}</div>}

    {tab === "promocoes" && <Card><SectionTitle>Pacotes ativos com desconto</SectionTitle><Table headers={["Pacote", "Desconto", "Preço de referência", "Regra", "Vigência"]} rows={packages.filter((item) => item.active && item.discountPercent > 0).map((item) => [item.name, `${item.discountPercent}%`, formatMoney(item.price), item.priceRule, `${formatDisplayDate(item.validFrom)} a ${formatDisplayDate(item.validTo)}`])} /></Card>}

    {(modal === "new" || modal === "edit") && <Modal wide title={modal === "new" ? "Cadastrar Pacote" : `Atualizar ${selected?.code}`} onClose={() => setModal(null)}>
      <SectionTitle>Identificação e elegibilidade</SectionTitle>
      <FormGrid cols={2}>
        <Input label="Código *" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
        <Input label="Nome *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <FullCol><Textarea label="Descrição" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FullCol>
        <Select label="Temporada" value={form.season} onChange={(event) => setForm({ ...form, season: event.target.value })}>{seasons.map((season) => <option key={season}>{season}</option>)}</Select>
        <Select label="Regime alimentar" value={form.mealPlan} onChange={(event) => setForm({ ...form, mealPlan: event.target.value })}>{mealPlans.map((mealPlan) => <option key={mealPlan}>{mealPlan}</option>)}</Select>
        <FullCol><Input label="Categorias elegíveis *" helpText="Separe por vírgula: Standard, Luxo, Suíte" value={form.roomCategories} onChange={(event) => setForm({ ...form, roomCategories: event.target.value })} /></FullCol>
        <Input label="Mínimo de diárias *" type="number" min="1" value={form.minNights} onChange={(event) => setForm({ ...form, minNights: event.target.value })} />
        <Input label="Máximo de diárias *" type="number" min="1" value={form.maxNights} onChange={(event) => setForm({ ...form, maxNights: event.target.value })} />
        <Input label="Hóspedes contemplados *" type="number" min="1" value={form.includedGuests} onChange={(event) => setForm({ ...form, includedGuests: event.target.value })} />
        <Select label="Regra de preço *" value={form.priceRule} onChange={(event) => setForm({ ...form, priceRule: event.target.value as PackagePriceRule })}><option>Preço fechado</option><option>Por diária</option></Select>
        <Input label="Preço *" type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        <Input label="Desconto (%)" type="number" min="0" max="100" value={form.discountPercent} onChange={(event) => setForm({ ...form, discountPercent: event.target.value })} />
        <Input label="Vigência inicial *" type="date" value={form.validFrom} onChange={(event) => setForm({ ...form, validFrom: event.target.value })} />
        <Input label="Vigência final *" type="date" min={form.validFrom} value={form.validTo} onChange={(event) => setForm({ ...form, validTo: event.target.value })} />
        <FullCol><Textarea label="Benefícios inclusos" placeholder="Café da manhã, Decoração especial" value={form.benefits} onChange={(event) => setForm({ ...form, benefits: event.target.value })} /></FullCol>
        <FullCol><SectionTitle>Benefícios com controle de cota</SectionTitle><Alert type="info">Os textos legados permanecem apenas como descrição comercial. Configure abaixo os itens que devem gerar gratuidade e cobrança de excedentes.</Alert></FullCol>
        <Select label="Tipo do benefício" value={benefitDraft.kind} onChange={(event) => setBenefitDraft({ ...benefitDraft, kind: event.target.value as "Produto" | "Serviço", reference: event.target.value === "Produto" ? "" : "Café da manhã" })}><option>Serviço</option><option>Produto</option></Select>
        {benefitDraft.kind === "Produto" ? <Select label="Produto do estoque" value={benefitDraft.reference} onChange={(event) => setBenefitDraft({ ...benefitDraft, reference: event.target.value })}><option value="">Selecione</option>{products.filter((item) => item.status === "Ativo").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select> : <Select label="Serviço" value={benefitDraft.reference} onChange={(event) => setBenefitDraft({ ...benefitDraft, reference: event.target.value })}>{OPERATIONAL_SERVICES.map((service) => <option key={service}>{service}</option>)}</Select>}
        <Input label="Quantidade incluída" type="number" min="1" value={benefitDraft.quantity} onChange={(event) => setBenefitDraft({ ...benefitDraft, quantity: event.target.value })} />
        <Select label="Limite" value={benefitDraft.limitType} onChange={(event) => setBenefitDraft({ ...benefitDraft, limitType: event.target.value as "Por hospedagem" | "Por diária" })}><option>Por hospedagem</option><option>Por diária</option></Select>
        <FullCol><Btn small variant="secondary" onClick={addStructuredBenefit}>Adicionar benefício estruturado</Btn><Table headers={["Item", "Tipo", "Cota", "Limite", "Excedente", "Ação"]} rows={form.structuredBenefits.map((benefit) => [benefit.label, benefit.kind, `${benefit.quantityIncluded} ${benefit.unit}`, benefit.limitType, benefit.excessRule, <Btn small variant="danger" onClick={() => setForm({ ...form, structuredBenefits: form.structuredBenefits.filter((item) => item.id !== benefit.id) })}>Remover</Btn>])} /></FullCol>
        <FullCol><Textarea label="Condições de contratação" value={form.conditions} onChange={(event) => setForm({ ...form, conditions: event.target.value })} /></FullCol>
        <Select label="Status" value={form.active ? "Ativo" : "Inativo"} onChange={(event) => setForm({ ...form, active: event.target.value === "Ativo" })}><option>Ativo</option><option>Inativo</option></Select>
      </FormGrid>
      {validation && <Alert type="error">{validation}</Alert>}
      {selected && linkedPackageIds.has(selected.id) && <Alert type="warning">Alterações afetam apenas novas contratações. Reservas existentes mantêm a cópia das condições originais.</Alert>}
      <FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={save}>Salvar pacote</Btn></FormActions>
    </Modal>}

    {modal === "view" && selected && <Modal wide title={`${selected.code} — ${selected.name}`} onClose={() => setModal(null)}><div className="summary-grid"><Detail label="Status" value={selected.active ? "Ativo" : "Inativo"} /><Detail label="Vigência" value={`${formatDisplayDate(selected.validFrom)} a ${formatDisplayDate(selected.validTo)}`} /><Detail label="Categorias" value={selected.roomCategories.join(", ")} /><Detail label="Duração" value={`${selected.minNights}–${selected.maxNights} diárias`} /><Detail label="Hóspedes" value={String(selected.includedGuests)} /><Detail label="Preço" value={formatMoney(selected.price)} /><Detail label="Regra" value={selected.priceRule} /><Detail label="Desconto" value={`${selected.discountPercent}%`} /><Detail label="Regime" value={selected.mealPlan} /></div><SectionTitle>Benefícios inclusos</SectionTitle><div className="benefit-list">{selected.benefits.map((benefit) => <Badge key={benefit} label={benefit} />)}</div><Alert type="info">{selected.conditions || "Sem condições adicionais."}</Alert><FormActions><Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn><Btn variant="secondary" onClick={() => openEdit(selected)}>Atualizar</Btn></FormActions></Modal>}
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="summary-item"><span>{label}</span><strong>{value || "—"}</strong></div>;
}
