import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoRoutes } from "./demo-routes";
import { useHotelOperations } from "../HotelOperationsContext";
import type {
  DemoCommand,
  DemoProgress,
  DemoRouteId,
  DemoScenario,
  DemoSpeed,
  DemoStepStatus,
} from "./demo-types";

const PROGRESS_PREFIX = "hotel-operational-demo-progress-v1:";
const SCENARIO_PREFIX = "hotel-operational-demo-scenario-v1:";

type CommandResult = {
  status: DemoStepStatus;
  message: string;
  ids?: Partial<DemoScenario["ids"]>;
};

type DemoEngineValue = {
  activeRouteId: DemoRouteId | null;
  progress: DemoProgress | null;
  scenario: DemoScenario | null;
  activeCommand: DemoCommand | null;
  startRoute: (routeId: DemoRouteId) => void;
  closeRoute: () => void;
  prepareScenario: () => void;
  executeCurrentStep: () => void;
  advanceOrExecute: () => void;
  resolveCommand: (commandId: string, result: CommandResult) => void;
  reportValidation: (result: CommandResult) => void;
  setCurrentStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipCurrentStep: () => void;
  setPaused: (paused: boolean) => void;
  setSpeed: (speed: DemoSpeed) => void;
  setAutoUntilConfirmation: (enabled: boolean) => void;
  restartRoute: () => void;
  hasSavedRoute: (routeId: DemoRouteId) => boolean;
};

const DemoEngineContext = createContext<DemoEngineValue | null>(null);

function newProgress(routeId: DemoRouteId, scenarioKey = ""): DemoProgress {
  const statuses = Object.fromEntries(demoRoutes[routeId].steps.map((step) => [step.id, "pending"])) as Record<string, DemoStepStatus>;
  return {
    routeId, scenarioKey, currentStep: 0, statuses, results: {}, completedAt: {},
    speed: "normal", autoUntilConfirmation: false, paused: false, updatedAt: new Date().toISOString(),
  };
}

function loadJson<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

export function DemoEngineProvider({ children }: { children: ReactNode }) {
  const { rooms, setRooms, cleanupDemoScenario } = useHotelOperations();
  const [activeRouteId, setActiveRouteId] = useState<DemoRouteId | null>(null);
  const [progress, setProgress] = useState<DemoProgress | null>(null);
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [activeCommand, setActiveCommand] = useState<DemoCommand | null>(null);

  useEffect(() => {
    if (!progress) return;
    window.localStorage.setItem(`${PROGRESS_PREFIX}${progress.routeId}`, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    if (!scenario) return;
    window.localStorage.setItem(`${SCENARIO_PREFIX}${scenario.routeId}`, JSON.stringify(scenario));
  }, [scenario]);

  const startRoute = (routeId: DemoRouteId) => {
    const savedScenario = loadJson<DemoScenario>(`${SCENARIO_PREFIX}${routeId}`);
    const savedProgress = loadJson<DemoProgress>(`${PROGRESS_PREFIX}${routeId}`);
    const route = demoRoutes[routeId];
    const compatible = savedScenario && savedProgress &&
      savedScenario.scenarioKey === savedProgress.scenarioKey &&
      route.steps.every((step) => step.id in savedProgress.statuses);
    setActiveRouteId(routeId);
    setScenario(savedScenario);
    setProgress(compatible ? savedProgress : newProgress(routeId, savedScenario?.scenarioKey));
    setActiveCommand(null);
  };

  const prepareScenario = () => {
    if (!activeRouteId) return;
    const existing = loadJson<DemoScenario>(`${SCENARIO_PREFIX}${activeRouteId}`);
    if (existing?.version === 1) {
      let hydrated = existing;
      if (activeRouteId === "guest-journey") {
        let room = rooms.find((item) => item.scenarioKey === existing.scenarioKey);
        if (!room) {
          room = buildScenarioRoom(existing.scenarioKey, Math.max(0, ...rooms.map((item) => item.id)) + 1);
          setRooms((current) => [...current, room!]);
        }
        hydrated = { ...existing, ids: { ...existing.ids, roomId: room.id } };
      }
      setScenario(hydrated);
      setProgress((current) => current ? { ...current, scenarioKey: existing.scenarioKey, updatedAt: new Date().toISOString() } : newProgress(activeRouteId, existing.scenarioKey));
      return;
    }
    const scenarioKey = `${activeRouteId}-${Date.now()}`;
    const scenarioRoom = activeRouteId === "guest-journey"
      ? buildScenarioRoom(scenarioKey, Math.max(0, ...rooms.map((item) => item.id)) + 1)
      : undefined;
    if (scenarioRoom) setRooms((current) => [...current, scenarioRoom]);
    const next: DemoScenario = {
      routeId: activeRouteId,
      version: 1,
      scenarioKey,
      referenceDate: new Date().toISOString().slice(0, 10),
      preparedAt: new Date().toISOString(),
      ids: {
        paymentIds: [],
        productIds: [],
        roomId: scenarioRoom?.id,
      },
    };
    setScenario(next);
    setProgress(newProgress(activeRouteId, next.scenarioKey));
  };

  const updateCurrent = (status: DemoStepStatus, message: string, ids?: Partial<DemoScenario["ids"]>) => {
    if (!activeRouteId || !progress) return;
    const step = demoRoutes[activeRouteId].steps[progress.currentStep];
    setProgress((current) => current ? {
      ...current,
      statuses: { ...current.statuses, [step.id]: status },
      results: { ...current.results, [step.id]: message },
      completedAt: status === "completed" ? { ...current.completedAt, [step.id]: new Date().toISOString() } : current.completedAt,
      updatedAt: new Date().toISOString(),
    } : current);
    if (ids) setScenario((current) => current ? { ...current, ids: { ...current.ids, ...ids } } : current);
  };

  const executeCurrentStep = () => {
    if (!activeRouteId || !progress || !scenario) return;
    const step = demoRoutes[activeRouteId].steps[progress.currentStep];
    if (progress.statuses[step.id] === "completed") return;
    if (step.action.kind === "unavailable") {
      updateCurrent("blocked", step.action.reason);
      return;
    }
    if (step.action.kind === "manual") {
      updateCurrent("running", "Aguardando a operação real e a validação do resultado.");
      return;
    }
    updateCurrent("running", "Preenchendo o formulário real com os dados do cenário.");
    setActiveCommand({
      id: `${step.id}-${Date.now()}`,
      routeId: activeRouteId,
      stepId: step.id,
      target: step.action.target,
      command: step.action.command,
      payload: step.inputData,
      speed: progress.speed,
    });
  };

  const advanceOrExecute = () => {
    if (!activeRouteId || !progress) return;
    if (!scenario) {
      prepareScenario();
      return;
    }
    const route = demoRoutes[activeRouteId];
    const step = route.steps[progress.currentStep];
    const status = progress.statuses[step.id];
    if (["completed", "simulated", "skipped"].includes(status)) {
      nextStep();
      return;
    }
    if (status === "pending" || status === "error" || status === "blocked") executeCurrentStep();
  };

  const resolveCommand = (commandId: string, result: CommandResult) => {
    if (!activeCommand || activeCommand.id !== commandId) return;
    const currentStatus = progress?.statuses[activeCommand.stepId];
    if (currentStatus === "completed") {
      setActiveCommand(null);
      return;
    }
    updateCurrent(result.status, result.message, result.ids);
    setActiveCommand(null);
  };

  const nextStep = () => {
    if (!activeRouteId || !progress) return;
    const route = demoRoutes[activeRouteId];
    const step = route.steps[progress.currentStep];
    if (!["completed", "simulated", "skipped"].includes(progress.statuses[step.id])) return;
    setProgress((current) => current ? { ...current, currentStep: Math.min(route.steps.length - 1, current.currentStep + 1), updatedAt: new Date().toISOString() } : current);
  };

  const previousStep = () => setProgress((current) => current ? { ...current, currentStep: Math.max(0, current.currentStep - 1), updatedAt: new Date().toISOString() } : current);
  const setCurrentStep = (index: number) => setProgress((current) => activeRouteId && current ? { ...current, currentStep: Math.min(Math.max(0, index), demoRoutes[activeRouteId].steps.length - 1), updatedAt: new Date().toISOString() } : current);
  const skipCurrentStep = () => {
    if (!activeRouteId || !progress) return;
    const step = demoRoutes[activeRouteId].steps[progress.currentStep];
    if (!step.optional && progress.statuses[step.id] !== "blocked") return;
    updateCurrent("skipped", "Etapa não executada; nenhum RF foi marcado como demonstrado.");
  };
  const setPaused = (paused: boolean) => setProgress((current) => current ? { ...current, paused, updatedAt: new Date().toISOString() } : current);
  const setSpeed = (speed: DemoSpeed) => setProgress((current) => current ? { ...current, speed, updatedAt: new Date().toISOString() } : current);
  const setAutoUntilConfirmation = (enabled: boolean) => setProgress((current) => current ? { ...current, autoUntilConfirmation: enabled, updatedAt: new Date().toISOString() } : current);
  const restartRoute = () => {
    if (!activeRouteId) return;
    const scenarioKey = scenario?.scenarioKey;
    if (scenarioKey) cleanupDemoScenario(scenarioKey);
    window.localStorage.removeItem(`${PROGRESS_PREFIX}${activeRouteId}`);
    window.localStorage.removeItem(`${SCENARIO_PREFIX}${activeRouteId}`);
    setScenario(null);
    setProgress(newProgress(activeRouteId));
    setActiveCommand(null);
  };
  const closeRoute = () => {
    setActiveRouteId(null);
    setActiveCommand(null);
  };
  const hasSavedRoute = (routeId: DemoRouteId) => Boolean(loadJson(`${PROGRESS_PREFIX}${routeId}`));

  const value = useMemo(() => ({
    activeRouteId, progress, scenario, activeCommand, startRoute, closeRoute, prepareScenario,
    executeCurrentStep, advanceOrExecute, resolveCommand, reportValidation: (result: CommandResult) => updateCurrent(result.status, result.message, result.ids), setCurrentStep, nextStep,
    previousStep, skipCurrentStep, setPaused, setSpeed, setAutoUntilConfirmation, restartRoute, hasSavedRoute,
  }), [activeRouteId, progress, scenario, activeCommand]);

  return <DemoEngineContext.Provider value={value}>{children}</DemoEngineContext.Provider>;
}

function buildScenarioRoom(scenarioKey: string, id: number) {
  return {
    id,
    scenarioKey,
    number: String(900 + id),
    floor: "9",
    category: "Standard",
    capacity: 2,
    status: "Livre" as const,
    occupancyStatus: "Livre" as const,
    cleaningStatus: "Limpo" as const,
    maintenanceStatus: "Disponível" as const,
    rate: 300,
    notes: "Quarto fictício isolado para a jornada demonstrativa.",
    accessibility: false,
    view: "Demonstração",
    bedType: "Casal",
    balcony: false,
    minibar: true,
    airConditioning: true,
  };
}

export function useDemoEngine() {
  const context = useContext(DemoEngineContext);
  if (!context) throw new Error("useDemoEngine must be used inside DemoEngineProvider");
  return context;
}
