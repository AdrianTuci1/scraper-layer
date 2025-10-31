import { type Node } from "@xyflow/react";
import { type LucideProps } from "lucide-react";
import React from "react";

export const WorkflowStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
} as const;

export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

export const TaskType = {
  LAUNCH_BROWSER: "LAUNCH_BROWSER",
  PAGE_TO_HTML: "PAGE_TO_HTML",
  EXTRACT_TEXT_FROM_ELEMENT: "EXTRACT_TEXT_FROM_ELEMENT",
  FILL_INPUT: "FILL_INPUT",
  CLICK_ELEMENT: "CLICK_ELEMENT",
  WAIT_FOR_ELEMENT: "WAIT_FOR_ELEMENT",
  DELIVER_VIA_WEBHOOK: "DELIVER_VIA_WEBHOOK",
  EXTRACT_DATA_WITH_AI: "EXTRACT_DATA_WITH_AI",
  READ_PROPERTY_FROM_JSON: "READ_PROPERTY_FROM_JSON",
  ADD_PROPERTY_TO_JSON: "ADD_PROPERTY_TO_JSON",
  NAVIGATE_URL: "NAVIGATE_URL",
  SCROLL_TO_ELEMENT: "SCROLL_TO_ELEMENT",
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const TaskParamType = {
  STRING: "STRING",
  BROWSE_INSTANCE: "BROWSE_INSTANCE",
  SELECT: "SELECT",
  CREDENTIAL: "CREDENTIAL",
} as const;

export type TaskParamType = (typeof TaskParamType)[keyof typeof TaskParamType];

export const FlowToExecutionPlanValidationError = {
  NO_ENTRY: "NO_ENTRY",
  INVALID_INPUTS: "INVALID_INPUTS",
} as const;

export type FlowToExecutionPlanValidationError = (typeof FlowToExecutionPlanValidationError)[keyof typeof FlowToExecutionPlanValidationError];

export const WorkflowExecutionStatus = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type WorkflowExecutionStatus = (typeof WorkflowExecutionStatus)[keyof typeof WorkflowExecutionStatus];

export const ExecutionPhaseStatus = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CREATED: "CREATED",
} as const;

export type ExecutionPhaseStatus = (typeof ExecutionPhaseStatus)[keyof typeof ExecutionPhaseStatus];

export const WorkflowExecutionTrigger = {
  MANUAL: "MANUAL",
  CRON: "CRON",
} as const;

export type WorkflowExecutionTrigger = (typeof WorkflowExecutionTrigger)[keyof typeof WorkflowExecutionTrigger];

export interface AppNodeData {
  [key: string]: any;
  type: TaskType;
  inputs: Record<string, string>;
}

export interface AppNode extends Node {
  data: AppNodeData;
}

export interface TaskParam {
  name: string;
  type: TaskParamType;
  helperText?: string;
  required?: boolean;
  hideHandle?: boolean;
  [key: string]: any;
}

export interface ParamProps {
  param: TaskParam;
  value: string;
  updateNodeParamValue: (newValue: string) => void;
  disabled?: boolean;
}

export type WorkflowTask = {
  label: string;
  icon: React.FC<LucideProps>;
  type: TaskType;
  isEntryPoint?: boolean;
  inputs: TaskParam[];
  outputs: TaskParam[];
  credits: number;
};

export type WorkflowExecutionPlanPhase = {
  phase: number;
  nodes: AppNode[];
};
export type WorkflowExecutionPlan = WorkflowExecutionPlanPhase[];

export type AppNodeMissingInputs = {
  nodeId: string;
  inputs: string[];
};

export type Enviornment = {
  browser?: unknown;
  page?: unknown;
  phases: {
    [key: string]: {
      inputs: Record<string, string>;
      outputs: Record<string, string>;
    };
  };
};

export const LogLevels = ["info", "error"] as const;
export type LogLevel = (typeof LogLevels)[number];

export type Log = { message: string; level: LogLevel; timeStamp: Date };

export type LogFunction = (message: string) => void;

export type LogCollector = {
  getAll(): Log[];
} & {
  [key in LogLevel]: LogFunction;
};

export type ExecutionEnviornment<T extends WorkflowTask> = {
  getInput(name: T["inputs"][number]["name"]): string;
  setOutput(name: T["outputs"][number]["name"], value: string): void;
  getBrowser(): unknown | undefined;
  setBrowser(browser: unknown): void;
  setPage(page: unknown): void;
  getPage(): unknown | undefined;
  log: LogCollector;
};

export type Period = {
  year: number;
  month: number;
};

export type WorkflowExecutionType = Record<
  string,
  {
    success: number;
    failed: number;
  }
>;
