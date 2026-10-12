import { useEffect, useMemo, useState } from "react";
import type { Page } from "../AppShell";
import { useHotelOperations } from "../HotelOperationsContext";
import { Alert, Badge, Btn, FormActions, Modal, SectionTitle, Select } from "../ui";
import { academicScript, currentModuleScript, scriptById, type TourCondition, type TourScript } from "./tour-scripts";

const PROGRESS_KEY = "hotel-presentation-progress-v1";

type StoredProgress = {
  scriptId: TourScript["id"];
  stepIndex: number;
  savedAt: string;
};

type Props = {
  currentPage: Page;
  allowedPages: string[];
  launcherOpen: boolean;
  onCloseLauncher: () => void;
  onNavigate: (page: Page) => void;
};

function loadProgress(): StoredProgress | null {
  try {
    const value = window.localStorage.getItem(PROGRESS_KEY);
    if (!value) return null;
    const progress = JSON.parse(value) as StoredProgress;
    return typeof progress.scriptId === "string" && Number.isInteger(progress.stepIndex) ? progress : null;
  } catch {
    return null;
  }
}

export default function PresentationTour({ currentPage, allowedPages, launcherOpen, onCloseLauncher, onNavigate }: Props) {
  const operations = useHotelOperations();
  const [script, setScript] = useState<TourScript | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const [storedProgress, setStoredProgress] = useState<StoredProgress | null>(() => loadProgress());

  const step = script?.steps[stepIndex];
  const condition = step?.condition ? evaluateCondition(step.condition, operations) : { satisfied: true, message: "" };
  const pageAllowed = step ? allowedPages.includes(step.page) : true;

  useEffect(() => {
    if (!step || paused) return;
    if (pageAllowed && currentPage !== step.page) onNavigate(step.page);
  }, [step, paused, pageAllowed, currentPage, onNavigate]);

  useEffect(() => {
    if (!step || paused || !pageAllowed || currentPage !== step.page) {
      setTargetRect(null);
      return;
    }
    let cancelled = false;
    const locate = () => {
      const target = document.querySelector(".modal-panel") ?? document.querySelector(step.selector);
      if (!target) {
        if (!cancelled) {
          setTargetMissing(true);
          setTargetRect(null);
        }
        return;
      }
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      window.setTimeout(() => {
        if (!cancelled) {
          setTargetMissing(false);
          setTargetRect(target.getBoundingClientRect());
        }
      }, 220);
    };
    const timer = window.setTimeout(locate, 80);
    window.addEventListener("resize", locate);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("resize", locate);
    };
  }, [step, paused, pageAllowed, currentPage]);

  useEffect(() => {
    if (!script) return;
    const progress: StoredProgress = { scriptId: script.id, stepIndex, savedAt: new Date().toISOString() };
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    setStoredProgress(progress);
  }, [script, stepIndex]);

  useEffect(() => {
    if (!script) return;
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape") {
        setScript(null);
        setPaused(false);
      }
      if (!paused && event.key === "ArrowRight") goNext();
      if (!paused && event.key === "ArrowLeft") setStepIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const panelPosition = useMemo(() => {
    const width = Math.min(420, window.innerWidth - 32);
    if (!targetRect) {
      const top = Math.max(16, window.innerHeight / 2 - 220);
      return { left: Math.max(16, (window.innerWidth - width) / 2), top, width, maxHeight: Math.max(280, window.innerHeight - top - 16) };
    }
    const placeRight = window.innerWidth - targetRect.right > width + 24;
    const left = placeRight ? targetRect.right + 16 : Math.min(Math.max(16, targetRect.left), window.innerWidth - width - 16);
    const preferredTop = placeRight ? targetRect.top : targetRect.bottom + 14;
    const top = Math.max(16, Math.min(Math.max(16, preferredTop), Math.max(16, window.innerHeight - 500)));
    return { left, top, width, maxHeight: Math.max(280, window.innerHeight - top - 16) };
  }, [targetRect, stepIndex]);

  const start = (nextScript: TourScript, index = 0) => {
    setScript(nextScript);
    setStepIndex(Math.min(Math.max(0, index), nextScript.steps.length - 1));
    setPaused(false);
    onCloseLauncher();
  };

  const goNext = () => {
    if (!script) return;
    if (step?.condition && !condition.satisfied) return;
    if (stepIndex >= script.steps.length - 1) {
      window.localStorage.removeItem(PROGRESS_KEY);
      setStoredProgress(null);
      setScript(null);
      return;
    }
    setStepIndex((current) => current + 1);
  };

  const continueStored = () => {
    if (!storedProgress) return;
    const restored = scriptById(storedProgress.scriptId, currentPage);
    start(restored, storedProgress.stepIndex);
  };

  return <>
    {launcherOpen && <Modal title="Tour do Sistema de Hotel" onClose={onCloseLauncher} wide>
      {storedProgress && <Alert type="info">Existe um tour salvo em {new Date(storedProgress.savedAt).toLocaleString("pt-BR")}.</Alert>}
      {storedProgress && <FormActions><Btn onClick={continueStored}>Continuar tour</Btn><Btn variant="secondary" onClick={() => { window.localStorage.removeItem(PROGRESS_KEY); setStoredProgress(null); }}>Descartar progresso</Btn></FormActions>}
      <div className="presentation-options presentation-options--single">
        <PresentationOption
          title="Tour do Sistema de Hotel"
          description="Percorra os modulos do sistema em uma ordem simples: indicadores, recepcao, hospedagem, operacao, gestao e administracao."
          action="Iniciar tour"
          onClick={() => start(academicScript)}
        />
      </div>
    </Modal>}

    {script && step && <>
      {!paused && targetRect && <Spotlight rect={targetRect} />}
      {!paused && <aside className="tour-panel" style={panelPosition} role="dialog" aria-label={`Apresentacao: ${step.title}`}>
        <div className="tour-panel__heading">
          <div><Badge label={script.name} /><p>{step.process}</p></div>
          <strong>{stepIndex + 1}/{script.steps.length}</strong>
        </div>
        <div className="tour-progress"><span style={{ width: `${((stepIndex + 1) / script.steps.length) * 100}%` }} /></div>
        <SectionTitle>{step.title}</SectionTitle>
        <p className="tour-description">{step.description}</p>
        <div className="tour-metadata"><strong>RFs associados</strong><span>{step.rfs}</span><strong>O que usa</strong><span>{step.entities.join(" - ")}</span><strong>Conecta com</strong><span>{step.integrations.join(" - ")}</span></div>
        {!pageAllowed && <Alert type="warning">Seu perfil nao possui acesso a este modulo. Voce pode pular a etapa sem interromper o roteiro.</Alert>}
        {targetMissing && pageAllowed && <Alert type="warning">O ponto destacado nao esta disponivel neste estado da tela.</Alert>}
        {step.condition && !condition.satisfied && <Alert type="warning">{step.conditionHint} {condition.message}</Alert>}
        <Select label="Selecionar etapa" value={String(stepIndex)} onChange={(event) => setStepIndex(Number(event.target.value))}>{script.steps.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.module}</option>)}</Select>
        <div className="tour-actions">
          <Btn variant="ghost" onClick={() => setScript(null)}>Encerrar</Btn>
          <Btn variant="secondary" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>Anterior</Btn>
          <Btn disabled={Boolean(step.condition && !condition.satisfied)} onClick={goNext}>{stepIndex === script.steps.length - 1 ? "Concluir" : "Proximo"}</Btn>
        </div>
      </aside>}
      {paused && <div className="tour-paused"><strong>Tour pausado</strong><span>O progresso foi salvo localmente.</span><Btn onClick={() => setPaused(false)}>Retomar</Btn><Btn variant="ghost" onClick={() => setScript(null)}>Encerrar</Btn></div>}
    </>}
  </>;
}

function PresentationOption({ title, description, action, onClick }: { title: string; description: string; action: string; onClick: () => void }) {
  return <div className="presentation-option"><SectionTitle>{title}</SectionTitle><p>{description}</p><Btn onClick={onClick}>{action}</Btn></div>;
}

function Spotlight({ rect }: { rect: DOMRect }) {
  const gap = 8;
  return <div className="tour-spotlight" aria-hidden="true">
    <span className="tour-shade" style={{ inset: `0 0 auto 0`, height: Math.max(0, rect.top - gap) }} />
    <span className="tour-shade" style={{ top: rect.bottom + gap, right: 0, bottom: 0, left: 0 }} />
    <span className="tour-shade" style={{ top: Math.max(0, rect.top - gap), left: 0, width: Math.max(0, rect.left - gap), height: rect.height + gap * 2 }} />
    <span className="tour-shade" style={{ top: Math.max(0, rect.top - gap), right: 0, width: Math.max(0, window.innerWidth - rect.right - gap), height: rect.height + gap * 2 }} />
    <span className="tour-highlight" style={{ top: rect.top - gap, left: rect.left - gap, width: rect.width + gap * 2, height: rect.height + gap * 2 }} />
  </div>;
}

function evaluateCondition(condition: TourCondition, operations: ReturnType<typeof useHotelOperations>) {
  const reservation = operations.reservations.find((item) => item.code === "RES-1001");
  const stay = reservation ? operations.stays.find((item) => item.reservationId === reservation.id) : undefined;
  const room = operations.rooms.find((item) => item.number === "312");
  const invoice = reservation ? operations.invoices.find((item) => item.reservationId === reservation.id) : undefined;
  const received = reservation ? operations.activeReceiptsTotal(reservation.id) : 0;
  const conditions: Record<TourCondition, boolean> = {
    "demo-client": operations.clients.some((client) => client.name === "Maria Costa"),
    "demo-reservation": Boolean(reservation && ["Confirmada", "Hospedado", "Concluida"].includes(reservation.status)),
    "demo-room-ready": Boolean(room && room.cleaningStatus === "Limpo" && room.maintenanceStatus === "Disponivel"),
    "demo-active-stay": Boolean(stay?.status === "Ativa"),
    "demo-consumption": Boolean(stay && operations.consumptions.some((item) => item.stayId === stay.id)),
    "demo-invoice": Boolean(invoice),
    "demo-paid": Boolean(invoice && received + 0.009 >= invoice.total),
    "demo-checkout": Boolean(stay?.status === "Encerrada"),
    "demo-cleaning-created": Boolean(stay && operations.housekeepingTasks.some((item) => item.stayId === stay.id)),
    "demo-cleaning-complete": Boolean(stay && operations.housekeepingTasks.some((item) => item.stayId === stay.id && item.status === "Concluida")),
  };
  return { satisfied: conditions[condition], message: conditions[condition] ? "" : "Use os controles da tela antes de avancar." };
}
