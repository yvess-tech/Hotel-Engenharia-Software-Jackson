import { useState } from "react";
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
} from "../ui";

type Tab = "funcionarios" | "cargos" | "turnos" | "ponto" | "atribuicoes";
type Status = "Ativo" | "Inativo";
type ModalMode = "new" | "edit" | "view" | "history" | null;
type Prioridade = "Baixa" | "Média" | "Alta";

interface Funcionario {
  id: number;
  matricula: string;
  nome: string;
  cpf: string;
  nascimento: string;
  email: string;
  telefone: string;
  endereco: string;
  admissao: string;
  cargoId: number;
  turnoId: number;
  perfilAcesso: string;
  observacoes: string;
  status: Status;
}

interface Cargo {
  id: number;
  nome: string;
  descricao: string;
  salarioBase: number;
  permissoes: string;
  status: Status;
}

interface Turno {
  id: number;
  nome: string;
  inicio: string;
  fim: string;
  intervalo: number;
  dias: string;
  cargaSemanal: number;
  status: Status;
}

interface Ponto {
  id: number;
  funcionarioId: number;
  dataHora: string;
  tipo: "Entrada" | "Início de intervalo" | "Fim de intervalo" | "Saída";
  origem: "Recepção" | "Aplicativo" | "Ajuste autorizado";
  observacao: string;
}

interface Historico {
  id: number;
  funcionarioId: number;
  dataHora: string;
  evento: string;
  detalhes: string;
  responsavel: string;
}

interface Atribuicao {
  id: number;
  funcionarioId: number;
  titulo: string;
  descricao: string;
  inicio: string;
  fim: string;
  prioridade: Prioridade;
  status: Status;
}

const initialCargos: Cargo[] = [
  {
    id: 1,
    nome: "Recepcionista",
    descricao: "Atendimento, reservas e suporte aos hóspedes.",
    salarioBase: 2650,
    permissoes: "Reservas, Hóspedes, Check-in/Out",
    status: "Ativo",
  },
  {
    id: 2,
    nome: "Camareira",
    descricao: "Governança, limpeza e organização dos apartamentos.",
    salarioBase: 2200,
    permissoes: "Limpeza & Manutenção, Quartos",
    status: "Ativo",
  },
  {
    id: 3,
    nome: "Garçom",
    descricao: "Restaurante, eventos e room service.",
    salarioBase: 2400,
    permissoes: "Consumos, Eventos",
    status: "Ativo",
  },
  {
    id: 4,
    nome: "Analista financeiro",
    descricao: "Rotinas financeiras e conciliação.",
    salarioBase: 4200,
    permissoes: "Financeiro, Fiscal, Relatórios",
    status: "Ativo",
  },
];

const initialTurnos: Turno[] = [
  {
    id: 1,
    nome: "Manhã",
    inicio: "06:00",
    fim: "14:00",
    intervalo: 60,
    dias: "Segunda a sábado",
    cargaSemanal: 44,
    status: "Ativo",
  },
  {
    id: 2,
    nome: "Tarde",
    inicio: "14:00",
    fim: "22:00",
    intervalo: 60,
    dias: "Segunda a sábado",
    cargaSemanal: 44,
    status: "Ativo",
  },
  {
    id: 3,
    nome: "Noite",
    inicio: "22:00",
    fim: "06:00",
    intervalo: 60,
    dias: "Escala 6x1",
    cargaSemanal: 44,
    status: "Ativo",
  },
  {
    id: 4,
    nome: "Comercial",
    inicio: "08:00",
    fim: "17:00",
    intervalo: 60,
    dias: "Segunda a sexta",
    cargaSemanal: 40,
    status: "Ativo",
  },
];

const initialFuncionarios: Funcionario[] = [
  {
    id: 1,
    matricula: "FUN-0018",
    nome: "Carlos Mendes",
    cpf: "281.654.730-20",
    nascimento: "1991-04-18",
    email: "carlos.mendes@pacaasnovos.com.br",
    telefone: "(69) 99234-1102",
    endereco: "Rua das Palmeiras, 128",
    admissao: "2024-02-12",
    cargoId: 1,
    turnoId: 1,
    perfilAcesso: "Operacional",
    observacoes: "",
    status: "Ativo",
  },
  {
    id: 2,
    matricula: "FUN-0021",
    nome: "Lúcia Santos",
    cpf: "504.813.620-15",
    nascimento: "1988-11-03",
    email: "lucia.santos@pacaasnovos.com.br",
    telefone: "(69) 99820-4401",
    endereco: "Av. Rio Madeira, 475",
    admissao: "2024-06-03",
    cargoId: 2,
    turnoId: 1,
    perfilAcesso: "Operacional",
    observacoes: "Responsável pelo segundo andar.",
    status: "Ativo",
  },
  {
    id: 3,
    matricula: "FUN-0027",
    nome: "Roberto Alves",
    cpf: "016.724.980-42",
    nascimento: "1996-07-22",
    email: "roberto.alves@pacaasnovos.com.br",
    telefone: "(69) 99117-2870",
    endereco: "Rua José de Alencar, 91",
    admissao: "2025-01-20",
    cargoId: 3,
    turnoId: 2,
    perfilAcesso: "Operacional",
    observacoes: "",
    status: "Ativo",
  },
  {
    id: 4,
    matricula: "FUN-0011",
    nome: "Fernanda Lima",
    cpf: "317.960.240-08",
    nascimento: "1987-02-14",
    email: "fernanda.lima@pacaasnovos.com.br",
    telefone: "(69) 99210-6134",
    endereco: "Rua Dom Pedro II, 320",
    admissao: "2022-08-15",
    cargoId: 4,
    turnoId: 4,
    perfilAcesso: "Gestão",
    observacoes: "",
    status: "Inativo",
  },
];

const initialPontos: Ponto[] = [
  {
    id: 1,
    funcionarioId: 1,
    dataHora: "2026-09-13T08:05",
    tipo: "Entrada",
    origem: "Recepção",
    observacao: "",
  },
  {
    id: 2,
    funcionarioId: 2,
    dataHora: "2026-09-13T07:58",
    tipo: "Entrada",
    origem: "Aplicativo",
    observacao: "",
  },
  {
    id: 3,
    funcionarioId: 2,
    dataHora: "2026-09-13T12:00",
    tipo: "Início de intervalo",
    origem: "Aplicativo",
    observacao: "",
  },
  {
    id: 4,
    funcionarioId: 2,
    dataHora: "2026-09-13T13:00",
    tipo: "Fim de intervalo",
    origem: "Aplicativo",
    observacao: "",
  },
  {
    id: 5,
    funcionarioId: 2,
    dataHora: "2026-09-13T14:02",
    tipo: "Saída",
    origem: "Aplicativo",
    observacao: "",
  },
  {
    id: 6,
    funcionarioId: 3,
    dataHora: "2026-09-13T13:02",
    tipo: "Entrada",
    origem: "Recepção",
    observacao: "",
  },
];

const initialHistorico: Historico[] = [
  {
    id: 1,
    funcionarioId: 1,
    dataHora: "2026-08-01T09:30",
    evento: "Turno atualizado",
    detalhes: "Turno alterado de Comercial para Manhã.",
    responsavel: "João Carlos",
  },
  {
    id: 2,
    funcionarioId: 2,
    dataHora: "2026-07-15T10:00",
    evento: "Atribuição cadastrada",
    detalhes: "Responsável pelo inventário de enxoval.",
    responsavel: "João Carlos",
  },
  {
    id: 3,
    funcionarioId: 4,
    dataHora: "2026-06-30T17:20",
    evento: "Funcionário inativado",
    detalhes: "Desligamento registrado.",
    responsavel: "João Carlos",
  },
];

const initialAtribuicoes: Atribuicao[] = [
  {
    id: 1,
    funcionarioId: 2,
    titulo: "Inventário de enxoval",
    descricao: "Conferir estoque físico e registrar divergências.",
    inicio: "2026-09-10",
    fim: "2026-09-15",
    prioridade: "Alta",
    status: "Ativo",
  },
  {
    id: 2,
    funcionarioId: 1,
    titulo: "Apoio ao treinamento",
    descricao: "Acompanhar a integração da nova equipe de recepção.",
    inicio: "2026-09-12",
    fim: "2026-09-20",
    prioridade: "Média",
    status: "Ativo",
  },
];

const emptyFuncionario = () => ({
  nome: "",
  cpf: "",
  nascimento: "",
  email: "",
  telefone: "",
  endereco: "",
  admissao: "",
  cargoId: "",
  turnoId: "",
  perfilAcesso: "Operacional",
  observacoes: "",
});

const emptyCargo = () => ({
  nome: "",
  descricao: "",
  salarioBase: "",
  permissoes: "",
});

const emptyTurno = () => ({
  nome: "",
  inicio: "",
  fim: "",
  intervalo: "60",
  dias: "",
  cargaSemanal: "44",
});

const emptyAtribuicao = () => ({
  funcionarioId: "",
  titulo: "",
  descricao: "",
  inicio: "",
  fim: "",
  prioridade: "Média" as Prioridade,
});

function formatDate(value: string, dateOnly = false) {
  if (!value) return "—";
  const date = dateOnly ? new Date(`${value}T12:00:00`) : new Date(value);
  return date.toLocaleString(
    "pt-BR",
    dateOnly
      ? { day: "2-digit", month: "2-digit", year: "numeric" }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
  );
}

export default function Funcionarios() {
  const [tab, setTab] = useState<Tab>("funcionarios");
  const [funcionarios, setFuncionarios] = useState(initialFuncionarios);
  const [cargos, setCargos] = useState(initialCargos);
  const [turnos, setTurnos] = useState(initialTurnos);
  const [pontos, setPontos] = useState(initialPontos);
  const [historico, setHistorico] = useState(initialHistorico);
  const [atribuicoes, setAtribuicoes] = useState(initialAtribuicoes);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [formFuncionario, setFormFuncionario] = useState(emptyFuncionario());
  const [formCargo, setFormCargo] = useState(emptyCargo());
  const [formTurno, setFormTurno] = useState(emptyTurno());
  const [formAtribuicao, setFormAtribuicao] = useState(emptyAtribuicao());
  const [formPonto, setFormPonto] = useState({
    funcionarioId: "",
    dataHora: "",
    tipo: "Entrada" as Ponto["tipo"],
    origem: "Recepção" as Ponto["origem"],
    observacao: "",
  });
  const [filtroPonto, setFiltroPonto] = useState({ funcionarioId: "", data: "2026-09-13" });

  const cargoNome = (id: number) => cargos.find((cargo) => cargo.id === id)?.nome ?? "—";
  const turnoNome = (id: number) => turnos.find((turno) => turno.id === id)?.nome ?? "—";
  const funcionarioNome = (id: number) =>
    funcionarios.find((funcionario) => funcionario.id === id)?.nome ?? "—";

  const addHistory = (funcionarioId: number, evento: string, detalhes: string) => {
    setHistorico((current) => [
      {
        id: Date.now(),
        funcionarioId,
        dataHora: new Date().toISOString(),
        evento,
        detalhes,
        responsavel: "João Carlos",
      },
      ...current,
    ]);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedId(null);
    setError("");
  };

  const switchTab = (nextTab: Tab) => {
    setTab(nextTab);
    setBusca("");
    setFiltroStatus("");
    setNotice("");
    closeModal();
  };

  const openNew = () => {
    setSelectedId(null);
    setError("");
    if (tab === "funcionarios") setFormFuncionario(emptyFuncionario());
    if (tab === "cargos") setFormCargo(emptyCargo());
    if (tab === "turnos") setFormTurno(emptyTurno());
    if (tab === "atribuicoes") setFormAtribuicao(emptyAtribuicao());
    if (tab === "ponto") {
      setFormPonto({
        funcionarioId: "",
        dataHora: new Date().toISOString().slice(0, 16),
        tipo: "Entrada",
        origem: "Recepção",
        observacao: "",
      });
    }
    setModalMode("new");
  };

  const openFuncionario = (id: number, mode: Exclude<ModalMode, "new" | null>) => {
    const funcionario = funcionarios.find((item) => item.id === id);
    if (!funcionario) return;
    setSelectedId(id);
    if (mode === "edit") {
      setFormFuncionario({
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        nascimento: funcionario.nascimento,
        email: funcionario.email,
        telefone: funcionario.telefone,
        endereco: funcionario.endereco,
        admissao: funcionario.admissao,
        cargoId: String(funcionario.cargoId),
        turnoId: String(funcionario.turnoId),
        perfilAcesso: funcionario.perfilAcesso,
        observacoes: funcionario.observacoes,
      });
    }
    setModalMode(mode);
  };

  const openEdit = (id: number) => {
    setSelectedId(id);
    setError("");
    if (tab === "funcionarios") {
      openFuncionario(id, "edit");
    } else if (tab === "cargos") {
      const item = cargos.find((cargo) => cargo.id === id);
      if (!item) return;
      setFormCargo({
        nome: item.nome,
        descricao: item.descricao,
        salarioBase: String(item.salarioBase),
        permissoes: item.permissoes,
      });
      setModalMode("edit");
    } else if (tab === "turnos") {
      const item = turnos.find((turno) => turno.id === id);
      if (!item) return;
      setFormTurno({
        nome: item.nome,
        inicio: item.inicio,
        fim: item.fim,
        intervalo: String(item.intervalo),
        dias: item.dias,
        cargaSemanal: String(item.cargaSemanal),
      });
      setModalMode("edit");
    } else if (tab === "atribuicoes") {
      const item = atribuicoes.find((atribuicao) => atribuicao.id === id);
      if (!item) return;
      setFormAtribuicao({
        funcionarioId: String(item.funcionarioId),
        titulo: item.titulo,
        descricao: item.descricao,
        inicio: item.inicio,
        fim: item.fim,
        prioridade: item.prioridade,
      });
      setModalMode("edit");
    }
  };

  const saveFuncionario = () => {
    if (
      !formFuncionario.nome ||
      !formFuncionario.cpf ||
      !formFuncionario.admissao ||
      !formFuncionario.cargoId ||
      !formFuncionario.turnoId
    ) {
      setError("Preencha nome, CPF, admissão, cargo e turno.");
      return;
    }
    const cpfEmUso = funcionarios.some(
      (item) => item.cpf === formFuncionario.cpf && item.id !== selectedId,
    );
    if (cpfEmUso) {
      setError("Já existe um funcionário cadastrado com este CPF.");
      return;
    }
    const data = {
      ...formFuncionario,
      cargoId: Number(formFuncionario.cargoId),
      turnoId: Number(formFuncionario.turnoId),
    };
    if (modalMode === "new") {
      const id = Date.now();
      const matricula = `FUN-${String(funcionarios.length + 28).padStart(4, "0")}`;
      setFuncionarios((current) => [
        { id, matricula, ...data, status: "Ativo" },
        ...current,
      ]);
      addHistory(id, "Funcionário cadastrado", `Matrícula ${matricula} criada.`);
    } else if (selectedId) {
      const previous = funcionarios.find((item) => item.id === selectedId);
      setFuncionarios((current) =>
        current.map((item) => (item.id === selectedId ? { ...item, ...data } : item)),
      );
      addHistory(
        selectedId,
        "Cadastro atualizado",
        previous?.cargoId !== data.cargoId || previous?.turnoId !== data.turnoId
          ? `Cargo/turno atualizado para ${cargoNome(data.cargoId)} / ${turnoNome(data.turnoId)}.`
          : "Dados cadastrais atualizados.",
      );
    }
    closeModal();
  };

  const saveCargo = () => {
    if (!formCargo.nome || !formCargo.descricao || !formCargo.salarioBase) {
      setError("Preencha nome, descrição e salário base.");
      return;
    }
    const data = { ...formCargo, salarioBase: Number(formCargo.salarioBase) };
    if (modalMode === "new") {
      setCargos((current) => [
        { id: Date.now(), ...data, status: "Ativo" },
        ...current,
      ]);
    } else {
      setCargos((current) =>
        current.map((item) => (item.id === selectedId ? { ...item, ...data } : item)),
      );
    }
    closeModal();
  };

  const saveTurno = () => {
    if (!formTurno.nome || !formTurno.inicio || !formTurno.fim || !formTurno.dias) {
      setError("Preencha nome, horários e dias de trabalho.");
      return;
    }
    const data = {
      ...formTurno,
      intervalo: Number(formTurno.intervalo),
      cargaSemanal: Number(formTurno.cargaSemanal),
    };
    if (modalMode === "new") {
      setTurnos((current) => [
        { id: Date.now(), ...data, status: "Ativo" },
        ...current,
      ]);
    } else {
      setTurnos((current) =>
        current.map((item) => (item.id === selectedId ? { ...item, ...data } : item)),
      );
    }
    closeModal();
  };

  const saveAtribuicao = () => {
    if (
      !formAtribuicao.funcionarioId ||
      !formAtribuicao.titulo ||
      !formAtribuicao.descricao ||
      !formAtribuicao.inicio
    ) {
      setError("Preencha funcionário, título, descrição e data inicial.");
      return;
    }
    if (formAtribuicao.fim && formAtribuicao.fim < formAtribuicao.inicio) {
      setError("A data final não pode ser anterior à data inicial.");
      return;
    }
    const data = {
      ...formAtribuicao,
      funcionarioId: Number(formAtribuicao.funcionarioId),
    };
    if (modalMode === "new") {
      setAtribuicoes((current) => [
        { id: Date.now(), ...data, status: "Ativo" },
        ...current,
      ]);
      addHistory(data.funcionarioId, "Atribuição cadastrada", data.titulo);
    } else if (selectedId) {
      setAtribuicoes((current) =>
        current.map((item) => (item.id === selectedId ? { ...item, ...data } : item)),
      );
      addHistory(data.funcionarioId, "Atribuição atualizada", data.titulo);
    }
    closeModal();
  };

  const savePonto = () => {
    if (!formPonto.funcionarioId || !formPonto.dataHora) {
      setError("Selecione o funcionário e informe a data e hora.");
      return;
    }
    const funcionario = funcionarios.find(
      (item) => item.id === Number(formPonto.funcionarioId),
    );
    if (!funcionario || funcionario.status !== "Ativo") {
      setError("O registro de ponto é permitido apenas para funcionários ativos.");
      return;
    }
    const ultimoPonto = pontos
      .filter((item) => item.funcionarioId === funcionario.id)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora))[0];
    if (ultimoPonto?.tipo === formPonto.tipo) {
      setError(`O último registro deste funcionário já é “${formPonto.tipo}”.`);
      return;
    }
    setPontos((current) => [
      {
        id: Date.now(),
        funcionarioId: funcionario.id,
        dataHora: formPonto.dataHora,
        tipo: formPonto.tipo,
        origem: formPonto.origem,
        observacao: formPonto.observacao,
      },
      ...current,
    ]);
    closeModal();
  };

  const inactivate = (id: number) => {
    setNotice("");
    if (tab === "funcionarios") {
      const item = funcionarios.find((funcionario) => funcionario.id === id);
      if (!item || item.status === "Inativo") return;
      setFuncionarios((current) =>
        current.map((funcionario) =>
          funcionario.id === id ? { ...funcionario, status: "Inativo" } : funcionario,
        ),
      );
      addHistory(id, "Funcionário inativado", "Vínculo inativado no cadastro.");
      setNotice(`${item.nome} foi inativado e permanece disponível no histórico.`);
    } else if (tab === "cargos") {
      if (funcionarios.some((item) => item.cargoId === id && item.status === "Ativo")) {
        setNotice("Não é possível inativar um cargo associado a funcionários ativos.");
        return;
      }
      setCargos((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "Inativo" } : item)),
      );
    } else if (tab === "turnos") {
      if (funcionarios.some((item) => item.turnoId === id && item.status === "Ativo")) {
        setNotice("Não é possível inativar um turno associado a funcionários ativos.");
        return;
      }
      setTurnos((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "Inativo" } : item)),
      );
    } else {
      const item = atribuicoes.find((atribuicao) => atribuicao.id === id);
      if (!item || item.status === "Inativo") return;
      setAtribuicoes((current) =>
        current.map((atribuicao) =>
          atribuicao.id === id ? { ...atribuicao, status: "Inativo" } : atribuicao,
        ),
      );
      addHistory(item.funcionarioId, "Atribuição inativada", item.titulo);
    }
  };

  const termo = busca.toLowerCase();
  const funcionariosFiltrados = funcionarios.filter(
    (item) =>
      (!termo ||
        item.nome.toLowerCase().includes(termo) ||
        item.cpf.includes(termo) ||
        item.matricula.toLowerCase().includes(termo)) &&
      (!filtroStatus || item.status === filtroStatus),
  );
  const cargosFiltrados = cargos.filter(
    (item) =>
      (!termo || item.nome.toLowerCase().includes(termo)) &&
      (!filtroStatus || item.status === filtroStatus),
  );
  const turnosFiltrados = turnos.filter(
    (item) =>
      (!termo || item.nome.toLowerCase().includes(termo)) &&
      (!filtroStatus || item.status === filtroStatus),
  );
  const atribuicoesFiltradas = atribuicoes.filter(
    (item) =>
      (!termo ||
        item.titulo.toLowerCase().includes(termo) ||
        funcionarioNome(item.funcionarioId).toLowerCase().includes(termo)) &&
      (!filtroStatus || item.status === filtroStatus),
  );
  const pontosFiltrados = pontos
    .filter(
      (item) =>
        (!filtroPonto.funcionarioId ||
          item.funcionarioId === Number(filtroPonto.funcionarioId)) &&
        (!filtroPonto.data || item.dataHora.slice(0, 10) === filtroPonto.data),
    )
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  const selectedFuncionario = funcionarios.find((item) => item.id === selectedId);
  const selectedCargo = cargos.find((item) => item.id === selectedId);
  const selectedTurno = turnos.find((item) => item.id === selectedId);
  const selectedAtribuicao = atribuicoes.find((item) => item.id === selectedId);

  const openView = (id: number) => {
    setSelectedId(id);
    setModalMode("view");
  };

  const activeCount = funcionarios.filter((item) => item.status === "Ativo").length;
  const latestPunches = pontos
    .filter((item) => item.dataHora.slice(0, 10) === filtroPonto.data)
    .reduce<Record<number, Ponto>>((latest, item) => {
      const previous = latest[item.funcionarioId];
      if (!previous || item.dataHora > previous.dataHora) latest[item.funcionarioId] = item;
      return latest;
    }, {});
  const onDutyCount = Object.values(latestPunches).filter(
    (item) => item.tipo === "Entrada" || item.tipo === "Fim de intervalo",
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Funcionários"
        actions={
          <Btn onClick={openNew}>
            {tab === "funcionarios"
              ? "Novo funcionário"
              : tab === "cargos"
                ? "Novo cargo"
                : tab === "turnos"
                  ? "Novo turno"
                  : tab === "ponto"
                    ? "Registrar ponto"
                    : "Nova atribuição"}
          </Btn>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Funcionários ativos" value={String(activeCount)} />
        <Metric label="Cargos ativos" value={String(cargos.filter((item) => item.status === "Ativo").length)} />
        <Metric label="Turnos ativos" value={String(turnos.filter((item) => item.status === "Ativo").length)} />
        <Metric label="Com ponto hoje" value={String(onDutyCount)} />
      </div>

      <Tabs
        tabs={[
          { id: "funcionarios", label: "Funcionários" },
          { id: "cargos", label: "Cargos" },
          { id: "turnos", label: "Turnos" },
          { id: "ponto", label: "Ponto" },
          { id: "atribuicoes", label: "Atribuições" },
        ]}
        active={tab}
        onChange={switchTab}
      />

      {notice && <Alert type={notice.startsWith("Não") ? "warning" : "success"}>{notice}</Alert>}

      {tab !== "ponto" && (
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px]">
            <Input
              label="Buscar"
              placeholder={
                tab === "funcionarios"
                  ? "Nome, matrícula ou CPF"
                  : tab === "atribuicoes"
                    ? "Atribuição ou funcionário"
                    : "Nome"
              }
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
            <Select
              label="Status"
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value)}
            >
              <option value="">Todos</option>
              <option>Ativo</option>
              <option>Inativo</option>
            </Select>
          </div>

          {tab === "funcionarios" && (
            <Table
              headers={["Matrícula", "Funcionário", "Cargo", "Turno", "Admissão", "Perfil", "Status", "Ações"]}
              rows={funcionariosFiltrados.map((item) => [
                item.matricula,
                <div>
                  <p className="font-bold text-primary">{item.nome}</p>
                  <p className="text-xs text-muted">{item.email}</p>
                </div>,
                cargoNome(item.cargoId),
                turnoNome(item.turnoId),
                formatDate(item.admissao, true),
                item.perfilAcesso,
                <Badge label={item.status} color={item.status === "Ativo" ? "green" : "gray"} />,
                <div className="flex flex-wrap gap-1">
                  <Btn small variant="ghost" onClick={() => openView(item.id)}>Consultar</Btn>
                  <Btn small variant="secondary" onClick={() => openFuncionario(item.id, "history")}>Histórico</Btn>
                  {item.status === "Ativo" && (
                    <>
                      <Btn small variant="ghost" onClick={() => openEdit(item.id)}>Atualizar</Btn>
                      <Btn small variant="danger" onClick={() => inactivate(item.id)}>Inativar</Btn>
                    </>
                  )}
                </div>,
              ])}
            />
          )}

          {tab === "cargos" && (
            <Table
              headers={["Cargo", "Descrição", "Salário base", "Permissões", "Status", "Ações"]}
              rows={cargosFiltrados.map((item) => [
                item.nome,
                item.descricao,
                item.salarioBase.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                item.permissoes,
                <Badge label={item.status} color={item.status === "Ativo" ? "green" : "gray"} />,
                <div className="flex flex-wrap gap-1">
                  <Btn small variant="ghost" onClick={() => openView(item.id)}>Consultar</Btn>
                  {item.status === "Ativo" && (
                    <>
                      <Btn small variant="ghost" onClick={() => openEdit(item.id)}>Atualizar</Btn>
                      <Btn small variant="danger" onClick={() => inactivate(item.id)}>Inativar</Btn>
                    </>
                  )}
                </div>,
              ])}
            />
          )}

          {tab === "turnos" && (
            <Table
              headers={["Turno", "Horário", "Intervalo", "Dias", "Carga semanal", "Status", "Ações"]}
              rows={turnosFiltrados.map((item) => [
                item.nome,
                `${item.inicio}–${item.fim}`,
                `${item.intervalo} min`,
                item.dias,
                `${item.cargaSemanal}h`,
                <Badge label={item.status} color={item.status === "Ativo" ? "green" : "gray"} />,
                <div className="flex flex-wrap gap-1">
                  <Btn small variant="ghost" onClick={() => openView(item.id)}>Consultar</Btn>
                  {item.status === "Ativo" && (
                    <>
                      <Btn small variant="ghost" onClick={() => openEdit(item.id)}>Atualizar</Btn>
                      <Btn small variant="danger" onClick={() => inactivate(item.id)}>Inativar</Btn>
                    </>
                  )}
                </div>,
              ])}
            />
          )}

          {tab === "atribuicoes" && (
            <Table
              headers={["Funcionário", "Atribuição", "Período", "Prioridade", "Status", "Ações"]}
              rows={atribuicoesFiltradas.map((item) => [
                funcionarioNome(item.funcionarioId),
                <div>
                  <p className="font-bold text-primary">{item.titulo}</p>
                  <p className="max-w-72 text-xs text-muted">{item.descricao}</p>
                </div>,
                `${formatDate(item.inicio, true)} — ${item.fim ? formatDate(item.fim, true) : "sem prazo"}`,
                <Badge
                  label={item.prioridade}
                  color={item.prioridade === "Alta" ? "red" : item.prioridade === "Média" ? "blue" : "gray"}
                />,
                <Badge label={item.status} color={item.status === "Ativo" ? "green" : "gray"} />,
                <div className="flex flex-wrap gap-1">
                  <Btn small variant="ghost" onClick={() => openView(item.id)}>Consultar</Btn>
                  {item.status === "Ativo" && (
                    <>
                      <Btn small variant="ghost" onClick={() => openEdit(item.id)}>Atualizar</Btn>
                      <Btn small variant="danger" onClick={() => inactivate(item.id)}>Inativar</Btn>
                    </>
                  )}
                </div>,
              ])}
            />
          )}
        </Card>
      )}

      {tab === "ponto" && (
        <Card>
          <SectionTitle>Consulta dos registros de ponto</SectionTitle>
          <div className="mb-4 grid gap-3 md:grid-cols-[220px_1fr]">
            <Input
              label="Data"
              type="date"
              value={filtroPonto.data}
              onChange={(event) =>
                setFiltroPonto((current) => ({ ...current, data: event.target.value }))
              }
            />
            <Select
              label="Funcionário"
              value={filtroPonto.funcionarioId}
              onChange={(event) =>
                setFiltroPonto((current) => ({
                  ...current,
                  funcionarioId: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              {funcionarios.map((item) => (
                <option key={item.id} value={item.id}>{item.nome}</option>
              ))}
            </Select>
          </div>
          <Table
            headers={["Funcionário", "Data e hora", "Registro", "Origem", "Observação"]}
            rows={pontosFiltrados.map((item) => [
              funcionarioNome(item.funcionarioId),
              formatDate(item.dataHora),
              <Badge
                label={item.tipo}
                color={item.tipo === "Entrada" || item.tipo === "Fim de intervalo" ? "green" : "blue"}
              />,
              item.origem,
              item.observacao || "—",
            ])}
          />
          <div className="mt-4">
            <Alert type="info">
              Registros de ponto são insert-only: uma batida registrada não pode ser alterada ou excluída.
            </Alert>
          </div>
        </Card>
      )}

      {(modalMode === "new" || modalMode === "edit") && tab === "funcionarios" && (
        <Modal wide title={modalMode === "new" ? "Cadastrar funcionário" : "Atualizar funcionário"} onClose={closeModal}>
          <FormGrid cols={2}>
            <FullCol><SectionTitle>Dados pessoais e contato</SectionTitle></FullCol>
            <Input label="Nome completo *" value={formFuncionario.nome} onChange={(event) => setFormFuncionario((current) => ({ ...current, nome: event.target.value }))} />
            <Input label="CPF *" placeholder="000.000.000-00" value={formFuncionario.cpf} onChange={(event) => setFormFuncionario((current) => ({ ...current, cpf: event.target.value }))} />
            <Input label="Data de nascimento" type="date" value={formFuncionario.nascimento} onChange={(event) => setFormFuncionario((current) => ({ ...current, nascimento: event.target.value }))} />
            <Input label="Telefone" value={formFuncionario.telefone} onChange={(event) => setFormFuncionario((current) => ({ ...current, telefone: event.target.value }))} />
            <Input label="E-mail" type="email" value={formFuncionario.email} onChange={(event) => setFormFuncionario((current) => ({ ...current, email: event.target.value }))} />
            <Input label="Endereço" value={formFuncionario.endereco} onChange={(event) => setFormFuncionario((current) => ({ ...current, endereco: event.target.value }))} />
            <FullCol><SectionTitle>Vínculo e permissões</SectionTitle></FullCol>
            <Input label="Data de admissão *" type="date" value={formFuncionario.admissao} onChange={(event) => setFormFuncionario((current) => ({ ...current, admissao: event.target.value }))} />
            <Select label="Cargo *" value={formFuncionario.cargoId} onChange={(event) => setFormFuncionario((current) => ({ ...current, cargoId: event.target.value }))}>
              <option value="">Selecione</option>
              {cargos.filter((item) => item.status === "Ativo").map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </Select>
            <Select label="Turno *" value={formFuncionario.turnoId} onChange={(event) => setFormFuncionario((current) => ({ ...current, turnoId: event.target.value }))}>
              <option value="">Selecione</option>
              {turnos.filter((item) => item.status === "Ativo").map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </Select>
            <Select label="Perfil de acesso" value={formFuncionario.perfilAcesso} onChange={(event) => setFormFuncionario((current) => ({ ...current, perfilAcesso: event.target.value }))}>
              <option>Consulta</option>
              <option>Operacional</option>
              <option>Gestão</option>
              <option>Administrador</option>
            </Select>
            <FullCol><Textarea label="Observações" value={formFuncionario.observacoes} onChange={(event) => setFormFuncionario((current) => ({ ...current, observacoes: event.target.value }))} /></FullCol>
            {error && <FullCol><Alert type="error">{error}</Alert></FullCol>}
            <FormActions><Btn variant="ghost" onClick={closeModal}>Voltar</Btn><Btn onClick={saveFuncionario}>Salvar</Btn></FormActions>
          </FormGrid>
        </Modal>
      )}

      {(modalMode === "new" || modalMode === "edit") && tab === "cargos" && (
        <Modal title={modalMode === "new" ? "Cadastrar cargo" : "Atualizar cargo"} onClose={closeModal}>
          <FormGrid cols={2}>
            <Input label="Nome do cargo *" value={formCargo.nome} onChange={(event) => setFormCargo((current) => ({ ...current, nome: event.target.value }))} />
            <Input label="Salário base *" type="number" min="0" step="0.01" value={formCargo.salarioBase} onChange={(event) => setFormCargo((current) => ({ ...current, salarioBase: event.target.value }))} />
            <FullCol><Textarea label="Descrição *" value={formCargo.descricao} onChange={(event) => setFormCargo((current) => ({ ...current, descricao: event.target.value }))} /></FullCol>
            <FullCol><Textarea label="Permissões e módulos do cargo" placeholder="Ex.: Reservas, Hóspedes, Relatórios" value={formCargo.permissoes} onChange={(event) => setFormCargo((current) => ({ ...current, permissoes: event.target.value }))} /></FullCol>
            {error && <FullCol><Alert type="error">{error}</Alert></FullCol>}
            <FormActions><Btn variant="ghost" onClick={closeModal}>Voltar</Btn><Btn onClick={saveCargo}>Salvar</Btn></FormActions>
          </FormGrid>
        </Modal>
      )}

      {(modalMode === "new" || modalMode === "edit") && tab === "turnos" && (
        <Modal title={modalMode === "new" ? "Cadastrar turno" : "Atualizar turno"} onClose={closeModal}>
          <FormGrid cols={2}>
            <Input label="Nome do turno *" value={formTurno.nome} onChange={(event) => setFormTurno((current) => ({ ...current, nome: event.target.value }))} />
            <Input label="Dias ou escala *" placeholder="Ex.: Segunda a sexta" value={formTurno.dias} onChange={(event) => setFormTurno((current) => ({ ...current, dias: event.target.value }))} />
            <Input label="Horário inicial *" type="time" value={formTurno.inicio} onChange={(event) => setFormTurno((current) => ({ ...current, inicio: event.target.value }))} />
            <Input label="Horário final *" type="time" value={formTurno.fim} onChange={(event) => setFormTurno((current) => ({ ...current, fim: event.target.value }))} />
            <Input label="Intervalo em minutos" type="number" min="0" value={formTurno.intervalo} onChange={(event) => setFormTurno((current) => ({ ...current, intervalo: event.target.value }))} />
            <Input label="Carga semanal" type="number" min="1" value={formTurno.cargaSemanal} onChange={(event) => setFormTurno((current) => ({ ...current, cargaSemanal: event.target.value }))} />
            {error && <FullCol><Alert type="error">{error}</Alert></FullCol>}
            <FormActions><Btn variant="ghost" onClick={closeModal}>Voltar</Btn><Btn onClick={saveTurno}>Salvar</Btn></FormActions>
          </FormGrid>
        </Modal>
      )}

      {(modalMode === "new" || modalMode === "edit") && tab === "atribuicoes" && (
        <Modal wide title={modalMode === "new" ? "Cadastrar atribuição" : "Atualizar atribuição"} onClose={closeModal}>
          <FormGrid cols={2}>
            <Select label="Funcionário *" value={formAtribuicao.funcionarioId} onChange={(event) => setFormAtribuicao((current) => ({ ...current, funcionarioId: event.target.value }))}>
              <option value="">Selecione</option>
              {funcionarios.filter((item) => item.status === "Ativo").map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </Select>
            <Input label="Título *" value={formAtribuicao.titulo} onChange={(event) => setFormAtribuicao((current) => ({ ...current, titulo: event.target.value }))} />
            <Input label="Data inicial *" type="date" value={formAtribuicao.inicio} onChange={(event) => setFormAtribuicao((current) => ({ ...current, inicio: event.target.value }))} />
            <Input label="Data final" type="date" value={formAtribuicao.fim} onChange={(event) => setFormAtribuicao((current) => ({ ...current, fim: event.target.value }))} />
            <Select label="Prioridade" value={formAtribuicao.prioridade} onChange={(event) => setFormAtribuicao((current) => ({ ...current, prioridade: event.target.value as Prioridade }))}>
              <option>Baixa</option><option>Média</option><option>Alta</option>
            </Select>
            <FullCol><Textarea label="Descrição *" value={formAtribuicao.descricao} onChange={(event) => setFormAtribuicao((current) => ({ ...current, descricao: event.target.value }))} /></FullCol>
            {error && <FullCol><Alert type="error">{error}</Alert></FullCol>}
            <FormActions><Btn variant="ghost" onClick={closeModal}>Voltar</Btn><Btn onClick={saveAtribuicao}>Salvar</Btn></FormActions>
          </FormGrid>
        </Modal>
      )}

      {modalMode === "new" && tab === "ponto" && (
        <Modal title="Registrar ponto" onClose={closeModal}>
          <FormGrid cols={2}>
            <FullCol>
              <Select label="Funcionário *" value={formPonto.funcionarioId} onChange={(event) => setFormPonto((current) => ({ ...current, funcionarioId: event.target.value }))}>
                <option value="">Selecione</option>
                {funcionarios.filter((item) => item.status === "Ativo").map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </Select>
            </FullCol>
            <Input label="Data e hora *" type="datetime-local" value={formPonto.dataHora} onChange={(event) => setFormPonto((current) => ({ ...current, dataHora: event.target.value }))} />
            <Select label="Tipo de registro *" value={formPonto.tipo} onChange={(event) => setFormPonto((current) => ({ ...current, tipo: event.target.value as Ponto["tipo"] }))}>
              <option>Entrada</option><option>Início de intervalo</option><option>Fim de intervalo</option><option>Saída</option>
            </Select>
            <Select label="Origem" value={formPonto.origem} onChange={(event) => setFormPonto((current) => ({ ...current, origem: event.target.value as Ponto["origem"] }))}>
              <option>Recepção</option><option>Aplicativo</option><option>Ajuste autorizado</option>
            </Select>
            <FullCol><Textarea label="Observação" value={formPonto.observacao} onChange={(event) => setFormPonto((current) => ({ ...current, observacao: event.target.value }))} /></FullCol>
            {error && <FullCol><Alert type="error">{error}</Alert></FullCol>}
            <FullCol><Alert type="info">Após salvo, o registro não poderá ser alterado ou excluído.</Alert></FullCol>
            <FormActions><Btn variant="ghost" onClick={closeModal}>Voltar</Btn><Btn onClick={savePonto}>Registrar</Btn></FormActions>
          </FormGrid>
        </Modal>
      )}

      {modalMode === "history" && selectedFuncionario && (
        <Modal wide title={`Histórico — ${selectedFuncionario.nome}`} onClose={closeModal}>
          <div className="space-y-4">
            <Alert type="info">Histórico insert-only: eventos são gerados automaticamente e não podem ser alterados.</Alert>
            <Table
              headers={["Data e hora", "Evento", "Detalhes", "Responsável"]}
              rows={historico
                .filter((item) => item.funcionarioId === selectedFuncionario.id)
                .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
                .map((item) => [formatDate(item.dataHora), item.evento, item.detalhes, item.responsavel])}
            />
            <FormActions><Btn variant="ghost" onClick={closeModal}>Fechar</Btn></FormActions>
          </div>
        </Modal>
      )}

      {modalMode === "view" && (
        <Modal wide title="Consultar registro" onClose={closeModal}>
          <div className="space-y-4">
            {tab === "funcionarios" && selectedFuncionario && (
              <FormGrid cols={2}>
                <Info label="Matrícula" value={selectedFuncionario.matricula} />
                <Info label="Status" value={selectedFuncionario.status} />
                <Info label="Nome" value={selectedFuncionario.nome} />
                <Info label="CPF" value={selectedFuncionario.cpf} />
                <Info label="Nascimento" value={formatDate(selectedFuncionario.nascimento, true)} />
                <Info label="Admissão" value={formatDate(selectedFuncionario.admissao, true)} />
                <Info label="Cargo" value={cargoNome(selectedFuncionario.cargoId)} />
                <Info label="Turno" value={turnoNome(selectedFuncionario.turnoId)} />
                <Info label="Perfil de acesso" value={selectedFuncionario.perfilAcesso} />
                <Info label="Telefone" value={selectedFuncionario.telefone || "—"} />
                <FullCol><Info label="E-mail e endereço" value={`${selectedFuncionario.email || "—"} · ${selectedFuncionario.endereco || "—"}`} /></FullCol>
                <FullCol><Info label="Observações" value={selectedFuncionario.observacoes || "Sem observações."} /></FullCol>
              </FormGrid>
            )}
            {tab === "cargos" && selectedCargo && (
              <FormGrid cols={2}>
                <Info label="Cargo" value={selectedCargo.nome} />
                <Info label="Status" value={selectedCargo.status} />
                <Info label="Salário base" value={selectedCargo.salarioBase.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                <FullCol><Info label="Descrição" value={selectedCargo.descricao} /></FullCol>
                <FullCol><Info label="Permissões" value={selectedCargo.permissoes || "Nenhuma permissão definida."} /></FullCol>
              </FormGrid>
            )}
            {tab === "turnos" && selectedTurno && (
              <FormGrid cols={2}>
                <Info label="Turno" value={selectedTurno.nome} />
                <Info label="Status" value={selectedTurno.status} />
                <Info label="Horário" value={`${selectedTurno.inicio}–${selectedTurno.fim}`} />
                <Info label="Intervalo" value={`${selectedTurno.intervalo} minutos`} />
                <Info label="Dias ou escala" value={selectedTurno.dias} />
                <Info label="Carga semanal" value={`${selectedTurno.cargaSemanal} horas`} />
              </FormGrid>
            )}
            {tab === "atribuicoes" && selectedAtribuicao && (
              <FormGrid cols={2}>
                <Info label="Funcionário" value={funcionarioNome(selectedAtribuicao.funcionarioId)} />
                <Info label="Status" value={selectedAtribuicao.status} />
                <Info label="Atribuição" value={selectedAtribuicao.titulo} />
                <Info label="Prioridade" value={selectedAtribuicao.prioridade} />
                <Info label="Início" value={formatDate(selectedAtribuicao.inicio, true)} />
                <Info label="Fim" value={selectedAtribuicao.fim ? formatDate(selectedAtribuicao.fim, true) : "Sem prazo"} />
                <FullCol><Info label="Descrição" value={selectedAtribuicao.descricao} /></FullCol>
              </FormGrid>
            )}
            <FormActions><Btn variant="ghost" onClick={closeModal}>Fechar</Btn></FormActions>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-h-24">
      <p className="text-xs font-bold uppercase tracking-wider text-primary/70">{label}</p>
      <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-primary/70">{label}</p>
      <p className="mt-1 text-sm text-body">{value}</p>
    </div>
  );
}
