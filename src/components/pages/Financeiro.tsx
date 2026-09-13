import { useState } from "react";
import { PageHeader, Card, Btn, Input, Select, Table, Modal, Badge, StatCard, SectionTitle, Tabs, FormGrid, FullCol, FormActions } from "../ui";

type Tab = "pagar" | "receber" | "caixa" | "centrocusto" | "conciliacao";

const contasPagar = [
  { id: 1, descricao: "Fornecedor lavanderia",   valor: "R$ 1.200,00", vencimento: "2026-09-15", centro: "Hospedagem", situacao: "Pendente" },
  { id: 2, descricao: "Energia elétrica",        valor: "R$ 3.400,00", vencimento: "2026-09-20", centro: "Geral",      situacao: "Pendente" },
  { id: 3, descricao: "Internet",                valor: "R$ 580,00",   vencimento: "2026-09-10", centro: "Geral",      situacao: "Pago"     },
];

const contasReceber = [
  { id: 1, descricao: "Reserva #1001 — Ana Souza", valor: "R$ 1.200,00", vencimento: "2026-09-16", centro: "Hospedagem", situacao: "Pendente" },
  { id: 2, descricao: "Evento corporativo",         valor: "R$ 8.500,00", vencimento: "2026-09-20", centro: "Eventos",    situacao: "Parcial"  },
];

const situacaoColor: Record<string, "green" | "yellow" | "red" | "blue"> = {
  Pago: "green", Pendente: "yellow", Parcial: "blue", Vencido: "red",
};

const centros = [
  { nome: "Hospedagem", receitas: "R$ 32.400", despesas: "R$ 8.200",  saldo: "R$ 24.200" },
  { nome: "Restaurante", receitas: "R$ 12.600", despesas: "R$ 5.400", saldo: "R$ 7.200"  },
  { nome: "Eventos",     receitas: "R$ 8.500",  despesas: "R$ 2.100", saldo: "R$ 6.400"  },
  { nome: "Spa",         receitas: "R$ 4.800",  despesas: "R$ 1.200", saldo: "R$ 3.600"  },
];

export default function Financeiro() {
  const [tab, setTab] = useState<Tab>("pagar");
  const [modal, setModal] = useState<"pagar" | "receber" | "caixa" | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader title="Financeiro — RF43 a RF59" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <StatCard label="Contas a Pagar"    value="R$ 4.600" sub="2 pendentes"       icon="📤" color="#dc2626" />
        <StatCard label="Contas a Receber"  value="R$ 9.700" sub="2 em aberto"       icon="📥" color="#16a34a" />
        <StatCard label="Saldo em Caixa"    value="R$ 12.340" sub="abertura hoje"    icon="🏦" color="#3e5525" />
        <StatCard label="Resultado do Dia"  value="R$ 5.100" sub="receitas − despesas" icon="📊" color="#2563eb" />
      </div>

      <Tabs
        tabs={[
          { id: "pagar",       label: "Contas a Pagar"   },
          { id: "receber",     label: "Contas a Receber"  },
          { id: "caixa",       label: "Caixa"             },
          { id: "centrocusto", label: "Centro de Custo"   },
          { id: "conciliacao", label: "Conciliação"       },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "pagar" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <SectionTitle>Contas a Pagar — RF43 a RF46</SectionTitle>
            <Btn small onClick={() => setModal("pagar")}>+ Nova Conta</Btn>
          </div>
          <Table
            headers={["Descrição", "Valor", "Vencimento", "Centro de Custo", "Situação", "Ações"]}
            rows={contasPagar.map((c) => [
              c.descricao, c.valor, c.vencimento, c.centro,
              <Badge label={c.situacao} color={situacaoColor[c.situacao] ?? "gray"} />,
              <div style={{ display: "flex", gap: "6px" }}>
                <Btn small variant="ghost">Editar</Btn>
                <Btn small variant="secondary">Inativar</Btn>
              </div>,
            ])}
          />
        </Card>
      )}

      {tab === "receber" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <SectionTitle>Contas a Receber — RF47 a RF50</SectionTitle>
            <Btn small onClick={() => setModal("receber")}>+ Nova Conta</Btn>
          </div>
          <Table
            headers={["Descrição", "Valor", "Vencimento", "Centro de Custo", "Situação", "Ações"]}
            rows={contasReceber.map((c) => [
              c.descricao, c.valor, c.vencimento, c.centro,
              <Badge label={c.situacao} color={situacaoColor[c.situacao] ?? "gray"} />,
              <Btn small variant="ghost">Editar</Btn>,
            ])}
          />
        </Card>
      )}

      {tab === "caixa" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <SectionTitle>Controle de Caixa — RF51 a RF53</SectionTitle>
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn small onClick={() => setModal("caixa")}>Abrir Caixa</Btn>
              <Btn small variant="secondary">Fechar Caixa</Btn>
            </div>
          </div>
          <Table
            headers={["Data", "Abertura", "Fechamento", "Saldo", "Operador"]}
            rows={[
              ["13/09/2026", "R$ 5.000,00", "—",            "R$ 12.340,00", "João Carlos"],
              ["12/09/2026", "R$ 5.000,00", "R$ 18.200,00", "R$ 13.200,00", "Maria Costa"],
            ]}
          />
        </Card>
      )}

      {tab === "centrocusto" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <SectionTitle>Centro de Custo — RF54 a RF57</SectionTitle>
            <Btn small>+ Novo Centro</Btn>
          </div>
          <Table
            headers={["Centro de Custo", "Receitas", "Despesas", "Saldo"]}
            rows={centros.map((c) => [c.nome, c.receitas, c.despesas, c.saldo])}
          />
        </Card>
      )}

      {tab === "conciliacao" && (
        <Card>
          <SectionTitle>Conciliação Bancária — RF58 a RF59</SectionTitle>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <Input label="Período inicial" type="date" defaultValue="2026-09-01" />
            <Input label="Período final"   type="date" defaultValue="2026-09-13" />
            <Btn>Consultar</Btn>
          </div>
          <Table
            headers={["Data", "Descrição", "Valor Banco", "Valor Sistema", "Status"]}
            rows={[
              ["12/09/2026", "PIX recebido — Pedro Lima", "R$ 450,00",   "R$ 450,00",   <Badge label="Conciliado" color="green" />],
              ["11/09/2026", "TED fornecedor lavanderia",  "R$ 1.200,00", "R$ 1.200,00", <Badge label="Conciliado" color="green" />],
            ]}
          />
        </Card>
      )}

      {(modal === "pagar" || modal === "receber") && (
        <Modal title={modal === "pagar" ? "Nova Conta a Pagar" : "Nova Conta a Receber"} onClose={() => setModal(null)}>
          <FormGrid cols={2}>
            <FullCol><Input label="Descrição *" /></FullCol>
            <Input label="Valor *" placeholder="R$ 0,00" />
            <Input label="Vencimento *" type="date" />
            <FullCol>
              <Select label="Centro de Custo">
                <option>Hospedagem</option>
                <option>Restaurante</option>
                <option>Eventos</option>
                <option>Geral</option>
              </Select>
            </FullCol>
            <FormActions>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={() => setModal(null)}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {modal === "caixa" && (
        <Modal title="Abrir Caixa" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Input label="Valor de abertura *" placeholder="R$ 0,00" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={() => setModal(null)}>Confirmar Abertura</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
