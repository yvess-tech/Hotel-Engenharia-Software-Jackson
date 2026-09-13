import { useState } from "react";
import { PageHeader, Card, Btn, Input, Table, Modal, Badge } from "../ui";

const initialPacotes = [
  { id: 1, nome: "Pacote Romântico", descricao: "2 noites + café + spa", valor: "R$ 1.800,00", vigencia: "2026-12-31", status: "Ativo" },
  { id: 2, nome: "Pacote Família", descricao: "3 noites + café da manhã", valor: "R$ 2.400,00", vigencia: "2026-11-30", status: "Ativo" },
  { id: 3, nome: "Alta Temporada", descricao: "Meia pensão + passeio", valor: "R$ 3.200,00", vigencia: "2026-02-28", status: "Inativo" },
];

export default function Pacotes() {
  const [pacotes, setPacotes] = useState(initialPacotes);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", valor: "", vigencia: "" });

  const save = () => {
    setPacotes([...pacotes, { id: Date.now(), ...form, status: "Ativo" }]);
    setModal(false);
  };

  const inativar = (id: number) => {
    setPacotes(pacotes.map((p) => p.id === id ? { ...p, status: p.status === "Ativo" ? "Inativo" : "Ativo" } : p));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pacotes & Promoções (RF39–RF42)"
        actions={<Btn onClick={() => { setForm({ nome: "", descricao: "", valor: "", vigencia: "" }); setModal(true); }}>+ Novo Pacote</Btn>}
      />

      <Card>
        <Table
          headers={["Nome", "Descrição", "Valor", "Vigência", "Status", "Ações"]}
          rows={pacotes.map((p) => [
            p.nome,
            p.descricao,
            p.valor,
            p.vigencia,
            <Badge label={p.status} color={p.status === "Ativo" ? "green" : "gray"} />,
            <div className="flex gap-1">
              <Btn small variant="ghost">Editar</Btn>
              <Btn small variant="secondary" onClick={() => inativar(p.id)}>
                {p.status === "Ativo" ? "Inativar" : "Ativar"}
              </Btn>
            </div>,
          ])}
        />
      </Card>

      {modal && (
        <Modal title="Novo Pacote" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Input label="Nome do pacote *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <Input label="Valor *" placeholder="R$ 0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            <Input label="Vigência até *" type="date" value={form.vigencia} onChange={(e) => setForm({ ...form, vigencia: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
