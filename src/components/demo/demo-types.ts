import type { Page } from "../AppShell";

export type DemoRouteId = "guest-journey" | "hotel-administration";
export type DemoSpeed = "slow" | "normal" | "fast";
export type DemoStepStatus = "pending" | "running" | "completed" | "blocked" | "error" | "simulated" | "skipped";

export type DemoAction =
  | { kind: "form-command"; target: string; command: string }
  | { kind: "manual"; validation: string }
  | { kind: "unavailable"; reason: string };

export type DemoStep = {
  id: string;
  routeId: DemoRouteId;
  module: string;
  page: Page;
  selector: string;
  title: string;
  description: string;
  process: string;
  rfs: string;
  entities: string[];
  inputData: Record<string, string | number | boolean>;
  expectedResult: string;
  action: DemoAction;
  cta?: string;
  optional?: boolean;
};

export type DemoRoute = {
  id: DemoRouteId;
  name: string;
  description: string;
  delivery: "A" | "B" | "C";
  steps: DemoStep[];
};

export type DemoScenarioIds = {
  clientId?: number;
  reservationId?: number;
  stayId?: number;
  roomId?: number;
  packageId?: number;
  invoiceId?: number;
  paymentIds: number[];
  employeeId?: number;
  productIds: number[];
  housekeepingTaskId?: number;
};

export type DemoScenario = {
  routeId: DemoRouteId;
  version: 1;
  scenarioKey: string;
  referenceDate: string;
  preparedAt: string;
  ids: DemoScenarioIds;
};

export type DemoProgress = {
  routeId: DemoRouteId;
  scenarioKey: string;
  currentStep: number;
  statuses: Record<string, DemoStepStatus>;
  results: Record<string, string>;
  completedAt: Record<string, string>;
  speed: DemoSpeed;
  autoUntilConfirmation: boolean;
  paused: boolean;
  updatedAt: string;
};

export type DemoCommand = {
  id: string;
  routeId: DemoRouteId;
  stepId: string;
  target: string;
  command: string;
  payload: Record<string, string | number | boolean>;
  speed: DemoSpeed;
};
