import { useEffect, useRef, useState } from "react";
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
import { useHotelOperations } from "../HotelOperationsContext";
import { useDemoEngine } from "../demo/DemoEngineContext";

type Tab = "limpeza" | "manutencao";
type Status = "Pendente" | "Em andamento" | "Concluída" | "Cancelada";
type Prioridade = "Baixa" | "Média" | "Alta" | "Urgente";
type ModalMode = "new" | "edit" | "view" | "complete" | "cancel" | null;

interface TarefaLimpeza {
  id: number;
  codigo: string;
  quarto: string;
  tipo: "Saída" | "Estadia" | "Chegada" | "Extra";
  responsavel: string;
  agendamento: string;
  prioridade: Prioridade;
  observacoes: string;
  status: Status;
  inicio?: string;
  conclusao?: string;
  executadoPor?: string;
  condicaoQuarto?: string;
  registro?: string;
  motivoCancelamento?: string;
  sourceTaskId?: number;
}

interface Manutencao {
  id: number;
  codigo: string;
  quarto: string;
  tipo: "Preventiva" | "Corretiva";
  categoria: string;
  descricao: string;
  responsavel: string;
  abertura: string;
  agendamento: string;
  prioridade: Prioridade;
  status: Status;
  conclusao?: string;
  executadoPor?: string;
  servicoRealizado?: string;
  custo?: number;
  motivoCancelamento?: string;
}

interface OperationsSnapshot {
  tarefas: TarefaLimpeza[];
  manutencoes: Manutencao[];
  updatedAt: string;
}

const initialTarefas: TarefaLimpeza[] = [
  {
    id: 1,
    codigo: "LIM-1042",
    quarto: "101",
    tipo: "Saída",
    responsavel: "Lúcia Santos",
    agendamento: "2026-09-13T08:00",
    prioridade: "Alta",
    observacoes: "Preparar para nova entrada às 14h.",
    status: "Pendente",
  },
  {
    id: 2,
    codigo: "LIM-1041",
    quarto: "205",
    tipo: "Estadia",
    responsavel: "Lúcia Santos",
    agendamento: "2026-09-13T07:00",
    prioridade: "Média",
    observacoes: "",
    status: "Concluída",
    inicio: "2026-09-13T07:05",
    conclusao: "2026-09-13T07:45",
    executadoPor: "Lúcia Santos",
    condicaoQuarto: "Liberado",
    registro: "Limpeza e reposição de enxoval realizadas.",
  },
  {
    id: 3,
    codigo: "LIM-1043",
    quarto: "312",
    tipo: "Chegada",
    responsavel: "Ana Ribeiro",
    agendamento: "2026-09-13T09:00",
    prioridade: "Urgente",
    observacoes: "Hóspede solicitou berço.",
    status: "Em andamento",
    inicio: "2026-09-13T09:06",
  },
  {
    id: 4,
    codigo: "LIM-1038",
    quarto: "108",
    tipo: "Extra",
    responsavel: "Ana Ribeiro",
    agendamento: "2026-09-12T16:00",
    prioridade: "Baixa",
    observacoes: "",
    status: "Cancelada",
    motivoCancelamento: "Solicitação retirada pelo hóspede.",
  },
];

const initialManutencoes: Manutencao[] = [
  {
    id: 1,
    codigo: "MAN-0326",
    quarto: "204",
    tipo: "Preventiva",
    categoria: "Hidráulica",
    descricao: "Revisão preventiva da tubulação e registros.",
    responsavel: "Miguel Costa",
    abertura: "2026-09-11T10:20",
    agendamento: "2026-09-13T10:00",
    prioridade: "Média",
    status: "Em andamento",
  },
  {
    id: 2,
    codigo: "MAN-0327",
    quarto: "108",
    tipo: "Corretiva",
    categoria: "Climatização",
    descricao: "Ar-condicionado não está refrigerando.",
    responsavel: "Miguel Costa",
    abertura: "2026-09-13T07:40",
    agendamento: "2026-09-13T11:00",
    prioridade: "Alta",
    status: "Pendente",
  },
  {
    id: 3,
    codigo: "MAN-0324",
    quarto: "Salão Ipê",
    tipo: "Preventiva",
    categoria: "Elétrica",
    descricao: "Inspeção dos pontos de energia.",
    responsavel: "Carlos Nunes",
    abertura: "2026-09-10T09:00",
    agendamento: "2026-09-12T14:00",
    prioridade: "Baixa",
    status: "Concluída",
    conclusao: "2026-09-12T15:30",
    executadoPor: "Carlos Nunes",
    servicoRealizado: "Inspeção concluída e duas tomadas substituídas.",
    custo: 180,
  },
];

const OPERATIONS_STORAGE_KEY = "hotel-pacaas-limpeza-manutencao";
const OPERATIONS_CHANNEL = "hotel-pacaas-operacoes";

function loadOperations(): OperationsSnapshot {
  if (typeof window === "undefined") {
    return { tarefas: initialTarefas, manutencoes: initialManutencoes, updatedAt: "" };
  }
  try {
    const stored = window.localStorage.getItem(OPERATIONS_STORAGE_KEY);
    if (!stored) {
      return { tarefas: initialTarefas, manutencoes: initialManutencoes, updatedAt: "" };
    }
    const snapshot = JSON.parse(stored) as OperationsSnapshot;
    if (!Array.isArray(snapshot.tarefas) || !Array.isArray(snapshot.manutencoes)) {
      throw new Error("Invalid operations snapshot");
    }
    return snapshot;
  } catch {
    return { tarefas: initialTarefas, manutencoes: initialManutencoes, updatedAt: "" };
  }
}

const statusColor: Record<Status, "green" | "yellow" | "blue" | "gray"> = {
  Pendente: "yellow",
  "Em andamento": "blue",
  Concluída: "green",
  Cancelada: "gray",
};

const prioridadeColor: Record<Prioridade, "gray" | "blue" | "yellow" | "red"> = {
  Baixa: "gray",
  Média: "blue",
  Alta: "yellow",
  Urgente: "red",
};

const emptyTarefa = () => ({
  quarto: "",
  tipo: "Saída" as TarefaLimpeza["tipo"],
  responsavel: "",
  agendamento: "",
  prioridade: "Média" as Prioridade,
  observacoes: "",
  status: "Pendente" as Status,
});

const emptyManutencao = () => ({
  quarto: "",
  tipo: "Corretiva" as Manutencao["tipo"],
  categoria: "",
  descricao: "",
  responsavel: "",
  agendamento: "",
  prioridade: "Média" as Prioridade,
  status: "Pendente" as Status,
});

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LimpezaManutencao() {
  const { rooms, setRooms, housekeepingTasks, completeHousekeeping, setRoomMaintenance } = useHotelOperations();
  const demo = useDemoEngine();
  const storedOperations = useRef(loadOperations());
  const [tab, setTab] = useState<Tab>("limpeza");
  const [tarefas, setTarefas] = useState<TarefaLimpeza[]>(storedOperations.current.tarefas);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>(
    storedOperations.current.manutencoes,
  );
  const [lastSync, setLastSync] = useState(
    storedOperations.current.updatedAt || new Date().toISOString(),
  );
  const channelRef = useRef<BroadcastChannel | null>(null);
  const applyingRemoteUpdate = useRef(false);
  const lastSyncRef = useRef(lastSync);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [formTarefa, setFormTarefa] = useState(emptyTarefa());
  const [formManutencao, setFormManutencao] = useState(emptyManutencao());
  const [completion, setCompletion] = useState({
    executadoPor: "",
    dataHora: "",
    condicaoQuarto: "Liberado",
    descricao: "",
    custo: "",
  });
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTarefas((current) => {
      const knownSourceIds = new Set(current.map((item) => item.sourceTaskId).filter(Boolean));
      const generated = housekeepingTasks
        .filter((task) => !knownSourceIds.has(task.id))
        .map<TarefaLimpeza>((task) => ({
          id: 100000 + task.id,
          sourceTaskId: task.id,
          codigo: task.code,
          quarto: rooms.find((room) => room.id === task.roomId)?.number ?? "—",
          tipo: "Saída",
          responsavel: "A definir",
          agendamento: task.scheduledAt,
          prioridade: task.priority,
          observacoes: task.notes,
          status: task.status,
          conclusao: task.completedAt,
          executadoPor: task.completedBy,
          registro: task.status === "Concluída" ? task.notes : undefined,
          condicaoQuarto: task.status === "Concluída" ? "Liberado" : undefined,
        }));
      return generated.length ? [...generated, ...current] : current;
    });
  }, [housekeepingTasks, rooms]);

  useEffect(() => {
    const applySnapshot = (snapshot: OperationsSnapshot) => {
      if (!snapshot.updatedAt || snapshot.updatedAt <= lastSyncRef.current) return;
      applyingRemoteUpdate.current = true;
      lastSyncRef.current = snapshot.updatedAt;
      setLastSync(snapshot.updatedAt);
      setTarefas(snapshot.tarefas);
      setManutencoes(snapshot.manutencoes);
    };

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(OPERATIONS_CHANNEL);
      channel.onmessage = (event: MessageEvent<OperationsSnapshot>) =>
        applySnapshot(event.data);
      channelRef.current = channel;
    }

    const synchronizationTimer = window.setInterval(
      () => applySnapshot(loadOperations()),
      5000,
    );

    return () => {
      window.clearInterval(synchronizationTimer);
      channelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (applyingRemoteUpdate.current) {
      applyingRemoteUpdate.current = false;
      return;
    }
    const snapshot: OperationsSnapshot = {
      tarefas,
      manutencoes,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(OPERATIONS_STORAGE_KEY, JSON.stringify(snapshot));
    channelRef.current?.postMessage(snapshot);
    lastSyncRef.current = snapshot.updatedAt;
    setLastSync(snapshot.updatedAt);
  }, [tarefas, manutencoes]);

  const selectedTarefa = tarefas.find((item) => item.id === selectedId) ?? null;
  const selectedManutencao = manutencoes.find((item) => item.id === selectedId) ?? null;
  const roomByNumber = (number: string) => rooms.find((room) => room.number === number);
  const roomOptions = rooms
    .slice()
    .sort((first, second) => first.number.localeCompare(second.number, "pt-BR", { numeric: true }));
  const maintenanceLocations = [
    ...roomOptions.map((room) => room.number),
    "Recepção",
    "Restaurante",
    "Salão Ipê",
    "Área técnica",
  ];
  const roomSummary = (number: string) => {
    const room = roomByNumber(number);
    if (!room) return "Local não vinculado";
    return `${room.category} · ${room.occupancyStatus} · ${room.cleaningStatus} · ${room.maintenanceStatus}`;
  };

  const tarefasFiltradas = tarefas.filter((item) => {
    const termo = busca.toLowerCase();
    return (
      (!termo ||
        item.codigo.toLowerCase().includes(termo) ||
        item.quarto.toLowerCase().includes(termo) ||
        item.responsavel.toLowerCase().includes(termo)) &&
      (!filtroStatus || item.status === filtroStatus) &&
      (!filtroPrioridade || item.prioridade === filtroPrioridade)
    );
  });

  const manutencoesFiltradas = manutencoes.filter((item) => {
    const termo = busca.toLowerCase();
    return (
      (!termo ||
        item.codigo.toLowerCase().includes(termo) ||
        item.quarto.toLowerCase().includes(termo) ||
        item.descricao.toLowerCase().includes(termo)) &&
      (!filtroStatus || item.status === filtroStatus) &&
      (!filtroPrioridade || item.prioridade === filtroPrioridade)
    );
  });

  const closeModal = () => {
    setModalMode(null);
    setSelectedId(null);
    setError("");
  };

  const openNew = () => {
    setSelectedId(null);
    setError("");
    if (tab === "limpeza") setFormTarefa({
      ...emptyTarefa(),
      quarto: roomOptions.find((room) => room.cleaningStatus !== "Limpo" || room.status === "Livre")?.number ?? roomOptions[0]?.number ?? "",
      responsavel: "LÃºcia Santos",
      agendamento: new Date().toISOString().slice(0, 16),
      prioridade: "Alta",
      observacoes: "Preparar quarto para check-in demonstrativo.",
    });
    else setFormManutencao({
      ...emptyManutencao(),
      quarto: roomOptions.find((room) => room.maintenanceStatus === "Disponível" && room.occupancyStatus === "Livre")?.number ?? roomOptions[0]?.number ?? "Recepção",
      categoria: "ElÃ©trica",
      descricao: "Troca preventiva de lampada e teste de tomada para demonstracao.",
      responsavel: "Roberto Alves",
      agendamento: new Date().toISOString().slice(0, 16),
      prioridade: "Média",
    });
    setModalMode("new");
  };

  const openView = (id: number) => {
    setSelectedId(id);
    setModalMode("view");
  };

  const openEdit = (id: number) => {
    setSelectedId(id);
    setError("");
    if (tab === "limpeza") {
      const item = tarefas.find((tarefa) => tarefa.id === id);
      if (!item) return;
      setFormTarefa({
        quarto: item.quarto,
        tipo: item.tipo,
        responsavel: item.responsavel,
        agendamento: item.agendamento,
        prioridade: item.prioridade,
        observacoes: item.observacoes,
        status: item.status,
      });
    } else {
      const item = manutencoes.find((manutencao) => manutencao.id === id);
      if (!item) return;
      setFormManutencao({
        quarto: item.quarto,
        tipo: item.tipo,
        categoria: item.categoria,
        descricao: item.descricao,
        responsavel: item.responsavel,
        agendamento: item.agendamento,
        prioridade: item.prioridade,
        status: item.status,
      });
    }
    setModalMode("edit");
  };

  const openComplete = (id: number) => {
    const item =
      tab === "limpeza"
        ? tarefas.find((tarefa) => tarefa.id === id)
        : manutencoes.find((manutencao) => manutencao.id === id);
    if (!item || item.status === "Concluída" || item.status === "Cancelada") return;
    setSelectedId(id);
    setError("");
    setCompletion({
      executadoPor: item.responsavel,
      dataHora: new Date().toISOString().slice(0, 16),
      condicaoQuarto: "Liberado",
      descricao: "",
      custo: "",
    });
    setModalMode("complete");
  };

  useEffect(() => {
    const command = demo.activeCommand;
    if (!command || command.target !== "limpeza" || command.command !== "open-housekeeping") return;
    const source = housekeepingTasks.find((item) => item.id === demo.scenario?.ids.housekeepingTaskId);
    if (!source) {
      demo.resolveCommand(command.id, { status: "error", message: "Tarefa de limpeza do cenário não encontrada." });
      return;
    }
    const id = 100000 + source.id;
    setTab("limpeza");
    setTarefas((current) => current.some((item) => item.sourceTaskId === source.id) ? current : [{
      id, sourceTaskId: source.id, codigo: source.code,
      quarto: rooms.find((room) => room.id === source.roomId)?.number ?? "—",
      tipo: "Saída", responsavel: "Governança", agendamento: source.scheduledAt,
      prioridade: source.priority, observacoes: source.notes, status: source.status,
    }, ...current]);
    setSelectedId(id);
    setCompletion({
      executadoPor: "Governança",
      dataHora: new Date().toISOString().slice(0, 16),
      condicaoQuarto: "Liberado",
      descricao: "Limpeza de saída concluída e quarto vistoriado.",
      custo: "",
    });
    setError("");
    setModalMode("complete");
    demo.resolveCommand(command.id, { status: "running", message: "Tarefa de limpeza aberta. Revise e confirme a conclusão." });
  }, [demo.activeCommand]);

  const openCancel = (id: number) => {
    setSelectedId(id);
    setMotivoCancelamento("");
    setError("");
    setModalMode("cancel");
  };

  const saveItem = () => {
    setError("");
    if (tab === "limpeza") {
      if (!formTarefa.quarto || !formTarefa.responsavel || !formTarefa.agendamento) {
        setError("Informe quarto, responsável e agendamento.");
        return;
      }
      const room = roomByNumber(formTarefa.quarto);
      if (!room) {
        setError("Selecione um quarto cadastrado.");
        return;
      }
      if (formTarefa.tipo !== "Estadia" && room.occupancyStatus === "Ocupado") {
        setError(`O quarto ${room.number} está ocupado. Para hóspede em permanência, use limpeza de estadia.`);
        return;
      }
      if (modalMode === "new") {
        setTarefas((current) => [
          {
            id: Date.now(),
            codigo: `LIM-${1040 + current.length + 1}`,
            ...formTarefa,
          },
          ...current,
        ]);
        setRooms((current) => current.map((room) => room.number === formTarefa.quarto ? { ...room, cleaningStatus: formTarefa.status === "Em andamento" ? "Em limpeza" : room.cleaningStatus } : room));
      } else if (selectedId) {
        setTarefas((current) =>
          current.map((item) =>
            item.id === selectedId
              ? {
                  ...item,
                  ...formTarefa,
                  inicio:
                    formTarefa.status === "Em andamento" && !item.inicio
                      ? new Date().toISOString()
                      : item.inicio,
                }
              : item,
          ),
        );
      }
    } else {
      if (
        !formManutencao.quarto ||
        !formManutencao.categoria ||
        !formManutencao.descricao ||
        !formManutencao.responsavel ||
        !formManutencao.agendamento
      ) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }
      const selectedRoom = roomByNumber(formManutencao.quarto);
      if (selectedRoom?.occupancyStatus === "Ocupado") {
        setError(`O quarto ${selectedRoom.number} está ocupado. Não é possível bloqueá-lo para manutenção neste fluxo.`);
        return;
      }
      if (modalMode === "new") {
        setManutencoes((current) => [
          {
            id: Date.now(),
            codigo: `MAN-${325 + current.length + 1}`,
            abertura: new Date().toISOString(),
            ...formManutencao,
          },
          ...current,
        ]);
        if (selectedRoom) setRoomMaintenance(formManutencao.quarto, true);
      } else if (selectedId) {
        setManutencoes((current) =>
          current.map((item) =>
            item.id === selectedId ? { ...item, ...formManutencao } : item,
          ),
        );
      }
    }
    closeModal();
  };

  const completeItem = () => {
    setError("");
    if (!completion.executadoPor || !completion.dataHora || !completion.descricao) {
      setError("Informe responsável, data/hora e o registro da execução.");
      return;
    }
    if (tab === "limpeza") {
      const task = tarefas.find((item) => item.id === selectedId);
      const room = rooms.find((item) => item.number === task?.quarto);
      if (completion.condicaoQuarto === "Liberado" && room?.occupancyStatus === "Ocupado") {
        setError(`O quarto ${room.number} ainda está ocupado. Registre como limpeza de estadia ou finalize o check-out antes de liberar.`);
        return;
      }
      if (task?.sourceTaskId) {
        const result = completeHousekeeping(task.sourceTaskId, completion.executadoPor, completion.descricao);
        if (!result.ok) {
          setError(result.error ?? "Não foi possível liberar o quarto.");
          return;
        }
        if (completion.condicaoQuarto !== "Liberado") {
          setRooms((current) => current.map((room) => room.number === task.quarto ? {
            ...room,
            cleaningStatus: completion.condicaoQuarto === "Necessita inspeção" ? "Em limpeza" : "Sujo",
            maintenanceStatus: completion.condicaoQuarto === "Bloqueado para manutenção" ? "Bloqueado" : room.maintenanceStatus,
            status: completion.condicaoQuarto === "Bloqueado para manutenção" ? "Em manutenção" : room.status,
          } : room));
        }
      } else if (task) {
        setRooms((current) => current.map((room) => room.number === task.quarto ? {
          ...room,
          cleaningStatus: completion.condicaoQuarto === "Liberado" ? "Limpo" : completion.condicaoQuarto === "Necessita inspeção" ? "Em limpeza" : "Sujo",
          maintenanceStatus: completion.condicaoQuarto === "Bloqueado para manutenção" ? "Bloqueado" : room.maintenanceStatus,
          status: completion.condicaoQuarto === "Bloqueado para manutenção" ? "Em manutenção" : room.status,
        } : room));
      }
      setTarefas((current) =>
        current.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                status: "Concluída",
                inicio: item.inicio ?? completion.dataHora,
                conclusao: completion.dataHora,
                executadoPor: completion.executadoPor,
                condicaoQuarto: completion.condicaoQuarto,
                registro: completion.descricao,
              }
            : item,
        ),
      );
    } else {
      const maintenance = manutencoes.find((item) => item.id === selectedId);
      if (maintenance) setRoomMaintenance(maintenance.quarto, false);
      setManutencoes((current) =>
        current.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                status: "Concluída",
                conclusao: completion.dataHora,
                executadoPor: completion.executadoPor,
                servicoRealizado: completion.descricao,
                custo: Number(completion.custo || 0),
              }
            : item,
        ),
      );
    }
    closeModal();
  };

  const cancelItem = () => {
    if (!motivoCancelamento.trim()) {
      setError("Informe o motivo do cancelamento.");
      return;
    }
    if (tab === "limpeza") {
      setTarefas((current) =>
        current.map((item) =>
          item.id === selectedId
            ? { ...item, status: "Cancelada", motivoCancelamento }
            : item,
        ),
      );
    } else {
      const maintenance = manutencoes.find((item) => item.id === selectedId);
      if (maintenance) setRoomMaintenance(maintenance.quarto, false);
      setManutencoes((current) =>
        current.map((item) =>
          item.id === selectedId
            ? { ...item, status: "Cancelada", motivoCancelamento }
            : item,
        ),
      );
    }
    closeModal();
  };

  const activeItems = tab === "limpeza" ? tarefas : manutencoes;
  const statItems = [
    { label: "Pendentes", value: activeItems.filter((item) => item.status === "Pendente").length },
    {
      label: "Em andamento",
      value: activeItems.filter((item) => item.status === "Em andamento").length,
    },
    { label: "Concluídas", value: activeItems.filter((item) => item.status === "Concluída").length },
    { label: "Urgentes", value: activeItems.filter((item) => item.prioridade === "Urgente").length },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Limpeza & Manutenção"
        actions={
          <Btn onClick={openNew}>
            {tab === "limpeza" ? "+ Nova tarefa de limpeza" : "+ Nova manutenção"}
          </Btn>
        }
      />

      <Card className="border-l-4 border-l-primary">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge label="Ao vivo" color="green" />
            <p className="text-sm font-bold text-primary">
              Painel compartilhado entre recepção e governança
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Sincronização em até 5 segundos · última atualização {formatDate(lastSync)}
          </p>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.label} className="min-h-24">
            <p className="text-xs font-bold uppercase tracking-wider text-primary/70">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-primary">{item.value}</p>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: "limpeza", label: `Tarefas de limpeza (${tarefas.length})` },
          { id: "manutencao", label: `Manutenções (${manutencoes.length})` },
        ]}
        active={tab}
        onChange={(nextTab) => {
          setTab(nextTab);
          setBusca("");
          setFiltroStatus("");
          setFiltroPrioridade("");
        }}
      />

      <Card>
        <SectionTitle>
          {tab === "limpeza" ? "Controle de tarefas de limpeza" : "Controle de manutenções"}
        </SectionTitle>

        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_160px]">
          <Input
            label="Buscar"
            placeholder={
              tab === "limpeza"
                ? "Código, quarto ou responsável"
                : "Código, local ou descrição"
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
            <option>Pendente</option>
            <option>Em andamento</option>
            <option>Concluída</option>
            <option>Cancelada</option>
          </Select>
          <Select
            label="Prioridade"
            value={filtroPrioridade}
            onChange={(event) => setFiltroPrioridade(event.target.value)}
          >
            <option value="">Todas</option>
            <option>Baixa</option>
            <option>Média</option>
            <option>Alta</option>
            <option>Urgente</option>
          </Select>
        </div>

        {tab === "limpeza" ? (
          <Table
            headers={[
              "Código",
              "Quarto",
              "Tipo",
              "Responsável",
              "Agendamento",
              "Prioridade",
              "Status",
              "Ações",
            ]}
            rows={tarefasFiltradas.map((item) => [
              item.codigo,
              <div><strong>{item.quarto}</strong><p className="text-xs text-muted">{roomSummary(item.quarto)}</p></div>,
              item.tipo,
              item.responsavel,
              formatDate(item.agendamento),
              <Badge label={item.prioridade} color={prioridadeColor[item.prioridade]} />,
              <Badge label={item.status} color={statusColor[item.status]} />,
              <div className="flex flex-wrap gap-1">
                <Btn small variant="ghost" onClick={() => openView(item.id)}>
                  Consultar
                </Btn>
                {item.status !== "Concluída" && item.status !== "Cancelada" && (
                  <>
                    <Btn small variant="ghost" onClick={() => openEdit(item.id)}>
                      Atualizar
                    </Btn>
                    <Btn small variant="secondary" onClick={() => openComplete(item.id)}>
                      Registrar limpeza
                    </Btn>
                    <Btn small variant="danger" onClick={() => openCancel(item.id)}>
                      Cancelar
                    </Btn>
                  </>
                )}
              </div>,
            ])}
          />
        ) : (
          <Table
            headers={[
              "Código",
              "Local",
              "Tipo",
              "Categoria",
              "Responsável",
              "Agendamento",
              "Prioridade",
              "Status",
              "Ações",
            ]}
            rows={manutencoesFiltradas.map((item) => [
              item.codigo,
              <div><strong>{item.quarto}</strong><p className="text-xs text-muted">{roomSummary(item.quarto)}</p></div>,
              item.tipo,
              item.categoria,
              item.responsavel,
              formatDate(item.agendamento),
              <Badge label={item.prioridade} color={prioridadeColor[item.prioridade]} />,
              <Badge label={item.status} color={statusColor[item.status]} />,
              <div className="flex flex-wrap gap-1">
                <Btn small variant="ghost" onClick={() => openView(item.id)}>
                  Consultar
                </Btn>
                {item.status !== "Concluída" && item.status !== "Cancelada" && (
                  <>
                    <Btn small variant="ghost" onClick={() => openEdit(item.id)}>
                      Atualizar
                    </Btn>
                    <Btn small variant="secondary" onClick={() => openComplete(item.id)}>
                      Registrar execução
                    </Btn>
                    <Btn small variant="danger" onClick={() => openCancel(item.id)}>
                      Cancelar
                    </Btn>
                  </>
                )}
              </div>,
            ])}
          />
        )}
      </Card>

      {(modalMode === "new" || modalMode === "edit") && (
        <Modal
          wide
          title={
            tab === "limpeza"
              ? modalMode === "new"
                ? "Cadastrar tarefa de limpeza"
                : "Atualizar tarefa de limpeza"
              : modalMode === "new"
                ? "Cadastrar manutenção"
                : "Atualizar manutenção"
          }
          onClose={closeModal}
        >
          <FormGrid cols={2}>
            {tab === "limpeza" ? (
              <>
                <Select
                  label="Quarto *"
                  value={formTarefa.quarto}
                  onChange={(event) =>
                    setFormTarefa((current) => ({ ...current, quarto: event.target.value }))
                  }
                >
                  <option value="">Selecione um quarto cadastrado</option>
                  {roomOptions.map((room) => (
                    <option key={room.id} value={room.number}>
                      {room.number} — {room.category} · {room.occupancyStatus} · {room.cleaningStatus} · {room.maintenanceStatus}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Tipo de limpeza *"
                  value={formTarefa.tipo}
                  onChange={(event) =>
                    setFormTarefa((current) => ({
                      ...current,
                      tipo: event.target.value as TarefaLimpeza["tipo"],
                    }))
                  }
                >
                  <option>Saída</option>
                  <option>Estadia</option>
                  <option>Chegada</option>
                  <option>Extra</option>
                </Select>
                <Select
                  label="Camareira responsável *"
                  value={formTarefa.responsavel}
                  onChange={(event) =>
                    setFormTarefa((current) => ({
                      ...current,
                      responsavel: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  <option>Lúcia Santos</option>
                  <option>Ana Ribeiro</option>
                  <option>Mariana Lopes</option>
                </Select>
                <Input
                  label="Data e hora agendada *"
                  type="datetime-local"
                  value={formTarefa.agendamento}
                  onChange={(event) =>
                    setFormTarefa((current) => ({
                      ...current,
                      agendamento: event.target.value,
                    }))
                  }
                />
                <Select
                  label="Prioridade *"
                  value={formTarefa.prioridade}
                  onChange={(event) =>
                    setFormTarefa((current) => ({
                      ...current,
                      prioridade: event.target.value as Prioridade,
                    }))
                  }
                >
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                  <option>Urgente</option>
                </Select>
                {modalMode === "edit" && (
                  <Select
                    label="Status"
                    value={formTarefa.status}
                    onChange={(event) =>
                      setFormTarefa((current) => ({
                        ...current,
                        status: event.target.value as Status,
                      }))
                    }
                  >
                    <option>Pendente</option>
                    <option>Em andamento</option>
                  </Select>
                )}
                <FullCol>
                  <Textarea
                    label="Orientações e observações"
                    value={formTarefa.observacoes}
                    onChange={(event) =>
                      setFormTarefa((current) => ({
                        ...current,
                        observacoes: event.target.value,
                      }))
                    }
                  />
                </FullCol>
              </>
            ) : (
              <>
                <Select
                  label="Quarto ou local *"
                  value={formManutencao.quarto}
                  onChange={(event) =>
                    setFormManutencao((current) => ({
                      ...current,
                      quarto: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {maintenanceLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}{roomByNumber(location) ? ` — ${roomSummary(location)}` : " — área comum"}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Tipo *"
                  value={formManutencao.tipo}
                  onChange={(event) =>
                    setFormManutencao((current) => ({
                      ...current,
                      tipo: event.target.value as Manutencao["tipo"],
                    }))
                  }
                >
                  <option>Preventiva</option>
                  <option>Corretiva</option>
                </Select>
                <Select
                  label="Categoria *"
                  value={formManutencao.categoria}
                  onChange={(event) =>
                    setFormManutencao((current) => ({
                      ...current,
                      categoria: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  <option>Elétrica</option>
                  <option>Hidráulica</option>
                  <option>Climatização</option>
                  <option>Mobiliário</option>
                  <option>Estrutural</option>
                  <option>Equipamentos</option>
                </Select>
                <Select
                  label="Responsável *"
                  value={formManutencao.responsavel}
                  onChange={(event) =>
                    setFormManutencao((current) => ({
                      ...current,
                      responsavel: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  <option>Miguel Costa</option>
                  <option>Carlos Nunes</option>
                  <option>Equipe terceirizada</option>
                </Select>
                <Input
                  label="Data e hora agendada *"
                  type="datetime-local"
                  value={formManutencao.agendamento}
                  onChange={(event) =>
                    setFormManutencao((current) => ({
                      ...current,
                      agendamento: event.target.value,
                    }))
                  }
                />
                <Select
                  label="Prioridade *"
                  value={formManutencao.prioridade}
                  onChange={(event) =>
                    setFormManutencao((current) => ({
                      ...current,
                      prioridade: event.target.value as Prioridade,
                    }))
                  }
                >
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                  <option>Urgente</option>
                </Select>
                {modalMode === "edit" && (
                  <Select
                    label="Status"
                    value={formManutencao.status}
                    onChange={(event) =>
                      setFormManutencao((current) => ({
                        ...current,
                        status: event.target.value as Status,
                      }))
                    }
                  >
                    <option>Pendente</option>
                    <option>Em andamento</option>
                  </Select>
                )}
                <FullCol>
                  <Textarea
                    label="Descrição do serviço *"
                    value={formManutencao.descricao}
                    onChange={(event) =>
                      setFormManutencao((current) => ({
                        ...current,
                        descricao: event.target.value,
                      }))
                    }
                  />
                </FullCol>
              </>
            )}
            {error && (
              <FullCol>
                <Alert type="error">{error}</Alert>
              </FullCol>
            )}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>
                Voltar
              </Btn>
              <Btn onClick={saveItem}>Salvar</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {modalMode === "view" && (selectedTarefa || selectedManutencao) && (
        <Modal
          wide
          title={
            tab === "limpeza"
              ? `Tarefa ${selectedTarefa?.codigo}`
              : `Manutenção ${selectedManutencao?.codigo}`
          }
          onClose={closeModal}
        >
          {tab === "limpeza" && selectedTarefa ? (
            <div className="space-y-5">
              <FormGrid cols={2}>
                <Info label="Quarto" value={selectedTarefa.quarto} />
                <Info label="Tipo" value={selectedTarefa.tipo} />
                <Info label="Responsável" value={selectedTarefa.responsavel} />
                <Info label="Agendamento" value={formatDate(selectedTarefa.agendamento)} />
                <Info label="Prioridade" value={selectedTarefa.prioridade} />
                <Info label="Status" value={selectedTarefa.status} />
                <Info label="Início" value={formatDate(selectedTarefa.inicio)} />
                <Info label="Conclusão" value={formatDate(selectedTarefa.conclusao)} />
                <FullCol>
                  <Info label="Orientações" value={selectedTarefa.observacoes || "Sem observações."} />
                </FullCol>
                {selectedTarefa.registro && (
                  <>
                    <FullCol>
                      <Info
                        label={`Registro da limpeza — ${selectedTarefa.condicaoQuarto}`}
                        value={selectedTarefa.registro}
                      />
                    </FullCol>
                    <FullCol>
                      <Alert type="success">
                        Conclusão registrada por {selectedTarefa.executadoPor} em{" "}
                        {formatDate(selectedTarefa.conclusao)}. Este registro é imutável.
                      </Alert>
                    </FullCol>
                  </>
                )}
                {selectedTarefa.motivoCancelamento && (
                  <FullCol>
                    <Alert type="warning">
                      Cancelada: {selectedTarefa.motivoCancelamento}
                    </Alert>
                  </FullCol>
                )}
              </FormGrid>
              <FormActions>
                <Btn variant="ghost" onClick={closeModal}>
                  Fechar
                </Btn>
              </FormActions>
            </div>
          ) : (
            selectedManutencao && (
              <div className="space-y-5">
                <FormGrid cols={2}>
                  <Info label="Local" value={selectedManutencao.quarto} />
                  <Info label="Tipo" value={selectedManutencao.tipo} />
                  <Info label="Categoria" value={selectedManutencao.categoria} />
                  <Info label="Responsável" value={selectedManutencao.responsavel} />
                  <Info label="Abertura" value={formatDate(selectedManutencao.abertura)} />
                  <Info label="Agendamento" value={formatDate(selectedManutencao.agendamento)} />
                  <Info label="Prioridade" value={selectedManutencao.prioridade} />
                  <Info label="Status" value={selectedManutencao.status} />
                  <FullCol>
                    <Info label="Descrição" value={selectedManutencao.descricao} />
                  </FullCol>
                  {selectedManutencao.servicoRealizado && (
                    <>
                      <FullCol>
                        <Info
                          label={`Serviço realizado em ${formatDate(selectedManutencao.conclusao)}`}
                          value={`${selectedManutencao.servicoRealizado} Custo: ${(selectedManutencao.custo ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`}
                        />
                      </FullCol>
                      <FullCol>
                        <Alert type="success">
                          Conclusão registrada por {selectedManutencao.executadoPor} em{" "}
                          {formatDate(selectedManutencao.conclusao)}. Este registro é imutável.
                        </Alert>
                      </FullCol>
                    </>
                  )}
                  {selectedManutencao.motivoCancelamento && (
                    <FullCol>
                      <Alert type="warning">
                        Cancelada: {selectedManutencao.motivoCancelamento}
                      </Alert>
                    </FullCol>
                  )}
                </FormGrid>
                <FormActions>
                  <Btn variant="ghost" onClick={closeModal}>
                    Fechar
                  </Btn>
                </FormActions>
              </div>
            )
          )}
        </Modal>
      )}

      {modalMode === "complete" && (
        <Modal
          wide
          title={tab === "limpeza" ? "Registrar limpeza realizada" : "Registrar manutenção realizada"}
          onClose={closeModal}
        >
          <FormGrid cols={2}>
            <FullCol>
              <Alert type="warning">
                Após confirmar, data, hora, responsável e detalhes da conclusão não poderão
                ser editados.
              </Alert>
            </FullCol>
            <Input
              label="Executado por *"
              value={completion.executadoPor}
              onChange={(event) =>
                setCompletion((current) => ({
                  ...current,
                  executadoPor: event.target.value,
                }))
              }
            />
            <Input
              label="Data e hora da conclusão *"
              type="datetime-local"
              value={completion.dataHora}
              onChange={(event) =>
                setCompletion((current) => ({ ...current, dataHora: event.target.value }))
              }
            />
            {tab === "limpeza" ? (
              <Select
                label="Condição do quarto *"
                value={completion.condicaoQuarto}
                onChange={(event) =>
                  setCompletion((current) => ({
                    ...current,
                    condicaoQuarto: event.target.value,
                  }))
                }
              >
                <option>Liberado</option>
                <option>Necessita inspeção</option>
                <option>Bloqueado para manutenção</option>
              </Select>
            ) : (
              <Input
                label="Custo total"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={completion.custo}
                onChange={(event) =>
                  setCompletion((current) => ({ ...current, custo: event.target.value }))
                }
              />
            )}
            <FullCol>
              <Textarea
                label={
                  tab === "limpeza"
                    ? "Registro da limpeza *"
                    : "Serviço e materiais utilizados *"
                }
                placeholder="Descreva o que foi realizado."
                value={completion.descricao}
                onChange={(event) =>
                  setCompletion((current) => ({
                    ...current,
                    descricao: event.target.value,
                  }))
                }
              />
            </FullCol>
            {error && (
              <FullCol>
                <Alert type="error">{error}</Alert>
              </FullCol>
            )}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>
                Voltar
              </Btn>
              <Btn onClick={completeItem}>Confirmar conclusão</Btn>
            </FormActions>
          </FormGrid>
        </Modal>
      )}

      {modalMode === "cancel" && (
        <Modal
          title={tab === "limpeza" ? "Cancelar tarefa de limpeza" : "Cancelar manutenção"}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <Alert type="warning">
              O registro será preservado no histórico com o status “Cancelada”.
            </Alert>
            <Textarea
              label="Motivo do cancelamento *"
              value={motivoCancelamento}
              onChange={(event) => setMotivoCancelamento(event.target.value)}
            />
            {error && <Alert type="error">{error}</Alert>}
            <FormActions>
              <Btn variant="ghost" onClick={closeModal}>
                Voltar
              </Btn>
              <Btn variant="danger" onClick={cancelItem}>
                Confirmar cancelamento
              </Btn>
            </FormActions>
          </div>
        </Modal>
      )}
    </div>
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
