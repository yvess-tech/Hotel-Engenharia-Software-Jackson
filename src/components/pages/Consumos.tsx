import { useState } from "react";
import { PageHeader, Card, Btn, Input, Select, Table, Modal, KpiCard } from "../ui";

const initialConsumos = [
  { id: 1, hospede: "Pedro Lima", quarto: "205", servico: "Room Service", descricao: "Sanduíche + suco", valor: "R$ 45,00", data: "13/09/2026 19:30" },
  { id: 2, hospede: "Pedro Lima", quarto: "205", servico: "Frigobar", descricao: "Água mineral (6un)", valor: "R$ 30,00", data: "13/09/2026 22:00" },
  { id: 3, hospede: "Ana Souza", quarto: "101", servico: "Restaurante", descricao: "Jantar para 2", valor: "R$ 180,00", data: "13/09/2026 20:15" },
  { id: 4, hospede: "Ana Souza", quarto: "101", servico: "Spa", descricao: "Massagem relaxante", valor: "R$ 250,00", data: "13/09/2026 16:00" },
];

export default function Consumos() {
  const [data, setData] = useState(initialConsumos);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ hospede: "", quarto: "", servico: "Restaurante", descricao: "", valor: "" });

  const filtered = data.filter(
    (c) => !search || c.hospede.toLowerCase().includes(search.toLowerCase()) || c.quarto.includes(search)
  );

  const save = () => {
    setData([...data, {
      id: Date.now(),
      ...form,
      data: new Date().toLocaleString("pt-BR"),
    }]);
    setModal(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Consumos"
        actions={<Btn onClick={() => { setForm({ hospede: "", quarto: "", servico: "Restaurante", descricao: "", valor: "" }); setModal(true); }}>+ Lançar Consumo</Btn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Restaurante", valor: "R$ 180,00" },
          { label: "Frigobar", valor: "R$ 30,00" },
          { label: "Room Service", valor: "R$ 45,00" },
          { label: "Spa", valor: "R$ 250,00" },
        ].map((s) => (
          <KpiCard key={s.label} label={s.label} value={s.valor} sub="hoje" icon="banknote" />
        ))}
      </div>

      <Card>
        <div className="mb-4">
          <Input
            label="Buscar por hóspede ou quarto"
            placeholder="Nome ou número do quarto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          headers={["Hóspede", "Quarto", "Serviço", "Descrição", "Valor", "Data/Hora"]}
          rows={filtered.map((c) => [c.hospede, c.quarto, c.servico, c.descricao, c.valor, c.data])}
        />
      </Card>

      {modal && (
        <Modal title="Lançar Consumo" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Input label="Hóspede *" value={form.hospede} onChange={(e) => setForm({ ...form, hospede: e.target.value })} />
            <Input label="Quarto *" value={form.quarto} onChange={(e) => setForm({ ...form, quarto: e.target.value })} />
            <Select label="Serviço *" value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })}>
              <option>Restaurante</option>
              <option>Frigobar</option>
              <option>Room Service</option>
              <option>Lavanderia</option>
              <option>Spa</option>
              <option>Outros</option>
            </Select>
            <Input label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <Input label="Valor *" placeholder="R$ 0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn onClick={save}>Lançar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
