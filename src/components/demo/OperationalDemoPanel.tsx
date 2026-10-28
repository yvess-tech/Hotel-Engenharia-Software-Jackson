import { useEffect, useMemo, useState } from "react";
import type { Page } from "../AppShell";
import { useHotelOperations } from "../HotelOperationsContext";
import { Alert, Badge, Btn, ConfirmDialog, Modal } from "../ui";
import { demoRoutes } from "./demo-routes";
import { useDemoEngine } from "./DemoEngineContext";
import type { DemoStepStatus } from "./demo-types";

type Props = {
  currentPage: Page;
  allowedPages: string[];
  onNavigate: (page: Page) => void;
};

const statusLabel: Record<DemoStepStatus, string> = {
  pending: "Pendente",
  running: "Aguardando confirmacao",
  completed: "Concluida",
  blocked: "Pendente",
  error: "Erro",
  simulated: "Simulada",
  skipped: "Nao executada",
};

export default function OperationalDemoPanel({ currentPage, allowedPages, onNavigate }: Props) {
  const operations = useHotelOperations();
  const engine = useDemoEngine();
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const route = engine.activeRouteId ? demoRoutes[engine.activeRouteId] : null;
  const step = route && engine.progress ? route.steps[engine.progress.currentStep] : null;
  const status = step && engine.progress ? engine.progress.statuses[step.id] ?? "pending" : "pending";
  const result = step && engine.progress ? engine.progress.results[step.id] : "";
  const pageAllowed = step ? allowedPages.includes(step.page) : true;
  const canAdvance = ["completed", "simulated", "skipped"].includes(status);
  const isLastStep = Boolean(route && engine.progress && engine.progress.currentStep === route.steps.length - 1);
  const panelOnTop = Boolean(targetRect && targetRect.bottom > window.innerHeight - 240);

  useEffect(() => {
    if (!route || engine.scenario) return;
    engine.prepareScenario();
  }, [route, engine.scenario]);

  useEffect(() => {
    if (!step || engine.progress?.paused || !pageAllowed) return;
    if (currentPage !== step.page) onNavigate(step.page);
  }, [step, engine.progress?.paused, pageAllowed, currentPage, onNavigate]);

  useEffect(() => {
    if (!step || engine.progress?.paused || !pageAllowed || currentPage !== step.page) {
      setTargetRect(null);
      return;
    }
    const locate = () => {
      const target = document.querySelector(step.selector) ?? document.querySelector(".modal-panel") ?? document.querySelector(`[data-tour-page="${step.page}"]`);
      if (!target) {
        setTargetRect(null);
        return;
      }
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      window.setTimeout(() => setTargetRect(target.getBoundingClientRect()), 120);
    };
    const timer = window.setTimeout(locate, 80);
    window.addEventListener("resize", locate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", locate);
    };
  }, [step, engine.progress?.paused, pageAllowed, currentPage, status]);

  useEffect(() => {
    if (!step || status !== "running" || engine.activeCommand || !engine.scenario) return;
    const key = engine.scenario.scenarioKey;
    const reservation = operations.reservations.find((item) => item.scenarioKey === key);
    const stay = operations.stays.find((item) => item.scenarioKey === key);
    const invoice = operations.invoices.find((item) => item.scenarioKey === key);
    const scenarioReceipts = operations.receipts.filter((item) => item.scenarioKey === key && item.status === "Confirmado");
    const scenarioConsumptions = operations.consumptions.filter((item) => item.scenarioKey === key && !item.includedInPackage);
    const task = operations.housekeepingTasks.find((item) => item.scenarioKey === key);
    const room = operations.rooms.find((item) => item.id === (engine.scenario?.ids.roomId ?? reservation?.roomId));
    if (step.id === "journey-client-save") {
      const client = operations.clients.find((item) => item.email === String(step.inputData.email) && item.scenarioKey === key);
      if (client) engine.reportValidation({ status: "completed", message: `Hospede salvo e exibido na tabela.`, ids: { clientId: client.id } });
    } else if (step.id === "journey-rooms" && room?.status === "Livre" && room.cleaningStatus === "Limpo" && room.maintenanceStatus === "Disponível") {
      engine.reportValidation({ status: "completed", message: `Quarto ${room.number} livre, limpo e disponivel.`, ids: { roomId: room.id } });
    } else if (step.id === "journey-rate") {
      const commercialPackage = operations.packages.find((item) => item.scenarioKey === key);
      if (commercialPackage?.price === 900) engine.reportValidation({ status: "completed", message: `Pacote ${commercialPackage.code} salvo.`, ids: { packageId: commercialPackage.id } });
    } else if (step.id === "journey-reservation" && reservation?.contractedValue === 900) {
      engine.reportValidation({ status: "completed", message: `Reserva ${reservation.code} confirmada.`, ids: { reservationId: reservation.id } });
    } else if (step.id === "journey-deposit" && scenarioReceipts.reduce((sum, item) => sum + item.value, 0) >= 450) {
      engine.reportValidation({ status: "completed", message: "Pagamento antecipado confirmado.", ids: { paymentIds: scenarioReceipts.map((item) => item.id) } });
    } else if (step.id === "journey-checkin" && stay && invoice) {
      engine.reportValidation({ status: "completed", message: `Check-in concluido; hospedagem e fatura criadas.`, ids: { stayId: stay.id, invoiceId: invoice.id } });
    } else if (step.id === "journey-consumption" && scenarioConsumptions.reduce((sum, item) => sum + item.value, 0) === 120) {
      engine.reportValidation({ status: "completed", message: "Consumo registrado na fatura." });
    } else if (step.id === "journey-invoice" && invoice?.total === 1020 && operations.activeReceiptsTotal(reservation?.id ?? 0) === 450) {
      engine.reportValidation({ status: "completed", message: "Fatura exibida com saldo em aberto." });
    } else if (step.id === "journey-payment" && invoice?.total === 1020 && operations.activeReceiptsTotal(reservation?.id ?? 0) === 1020) {
      engine.reportValidation({ status: "completed", message: "Saldo quitado.", ids: { paymentIds: scenarioReceipts.map((item) => item.id) } });
    } else if (step.id === "journey-checkout" && stay?.status === "Encerrada" && task) {
      engine.reportValidation({ status: "completed", message: "Check-out concluido e limpeza gerada.", ids: { housekeepingTaskId: task.id } });
    } else if (step.id === "journey-history" && stay?.status === "Encerrada") {
      engine.reportValidation({ status: "completed", message: "Historico do hospede atualizado." });
    } else if (step.id === "journey-cleaning" && task?.status === "Concluída" && room?.cleaningStatus === "Limpo") {
      engine.reportValidation({ status: "completed", message: "Limpeza concluida e quarto liberado." });
    } else if (step.id === "journey-results" && stay?.status === "Encerrada" && task?.status === "Concluída" && operations.activeReceiptsTotal(reservation?.id ?? 0) === 1020) {
      engine.reportValidation({ status: "completed", message: "Jornada completa refletida nos indicadores." });
    }
  }, [operations, step, status, engine.activeCommand, engine.scenario]);

  const completion = useMemo(() => {
    if (!route || !engine.progress) return 0;
    return route.steps.filter((item) => ["completed", "simulated", "skipped"].includes(engine.progress?.statuses[item.id] ?? "pending")).length;
  }, [route, engine.progress]);

  useEffect(() => {
    if (!route || !step || !engine.progress) return;
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape") engine.closeRoute();
      if (event.key === "ArrowLeft") engine.previousStep();
      if (event.key === "ArrowRight") engine.advanceOrExecute();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [engine, route, step]);

  if (!route || !step || !engine.progress) return null;

  const progressText = `Passo ${engine.progress.currentStep + 1} de ${route.steps.length}`;
  const primaryLabel = canAdvance ? (isLastStep ? "Concluir" : "Proximo") : step.cta ?? "Proximo";

  return <>
    {targetRect && <DemoSpotlight rect={targetRect} />}
    <aside className={`demo-panel ${panelOnTop ? "demo-panel--top" : ""}`} role="dialog" aria-label={`Demonstracao operacional: ${step.title}`}>
      <div className="demo-panel__heading">
        <Badge label={route.name} />
        <strong>{progressText}</strong>
      </div>
      <div className="tour-progress"><span style={{ width: `${completion / route.steps.length * 100}%` }} /></div>
      <div className="demo-step-status"><Badge label={statusLabel[status]} /><span>{step.module}</span></div>
      <h2 className="demo-title">{step.title}</h2>
      <p className="tour-description">{step.description}</p>
      <div className="demo-rf"><strong>{step.rfs}</strong><span>{step.process}</span></div>
      {!pageAllowed && <Alert type="error">O perfil atual nao possui acesso a este modulo.</Alert>}
      {status === "blocked" && <Alert type="warning">{result}</Alert>}
      {status === "error" && <Alert type="error">{result || "Nao foi possivel concluir esta operacao."}</Alert>}
      {status === "running" && result && <Alert type="info">{result}</Alert>}
      <div className="demo-actions">
        <Btn variant="ghost" disabled={engine.progress.currentStep === 0} onClick={engine.previousStep}>Anterior</Btn>
        <Btn disabled={!pageAllowed || status === "running" || Boolean(engine.activeCommand)} onClick={isLastStep && canAdvance ? engine.closeRoute : engine.advanceOrExecute}>{primaryLabel}</Btn>
        <Btn variant="ghost" onClick={engine.closeRoute}>Encerrar</Btn>
      </div>
      <details className="demo-more">
        <summary>Opcoes</summary>
        <button type="button" onClick={() => setRequirementOpen(true)}>Ver requisito</button>
        <button type="button" onClick={() => setConfirmRestart(true)}>Reiniciar roteiro</button>
      </details>
    </aside>
    {requirementOpen && <Modal title={`Rastreabilidade - ${step.rfs}`} onClose={() => setRequirementOpen(false)}><Alert type="info">Resumo interno de rastreabilidade. A matriz completa permanece fora da apresentacao principal.</Alert><div className="detail-list"><Info label="Codigo" value={step.rfs} /><Info label="Processo" value={step.process} /><Info label="Operacao" value={step.title} /><Info label="Situacao" value={statusLabel[status]} /></div></Modal>}
    {confirmRestart && <ConfirmDialog title="Reiniciar roteiro operacional" description="O progresso e os registros deste cenario serao removidos. Dados normais permanecem preservados." onCancel={() => setConfirmRestart(false)} onConfirm={() => { engine.restartRoute(); setConfirmRestart(false); }} />}
  </>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="summary-item"><span>{label}</span><strong>{value}</strong></div>;
}

function DemoSpotlight({ rect }: { rect: DOMRect }) {
  const gap = 8;
  return <div className="tour-spotlight" aria-hidden="true">
    <span className="tour-shade" style={{ inset: "0 0 auto 0", height: Math.max(0, rect.top - gap) }} />
    <span className="tour-shade" style={{ top: rect.bottom + gap, right: 0, bottom: 0, left: 0 }} />
    <span className="tour-shade" style={{ top: Math.max(0, rect.top - gap), left: 0, width: Math.max(0, rect.left - gap), height: rect.height + gap * 2 }} />
    <span className="tour-shade" style={{ top: Math.max(0, rect.top - gap), right: 0, width: Math.max(0, window.innerWidth - rect.right - gap), height: rect.height + gap * 2 }} />
    <span className="tour-highlight" style={{ top: rect.top - gap, left: rect.left - gap, width: rect.width + gap * 2, height: rect.height + gap * 2 }} />
  </div>;
}
