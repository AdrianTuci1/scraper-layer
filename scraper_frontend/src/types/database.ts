// Type definitions pentru Workflow (în loc de @prisma/client)
export type Workflow = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  definition: string;
  executionPlan?: string | null;
  creditsCost: number;
  status: string;
  createdAt: Date;
  lastRunAt?: Date | null;
  lastRunId?: string | null;
  lastRunStatus?: string | null;
  updatedAt: Date;
  cron?: string | null;
  nextRunAt?: Date | null;
};

export type WorkflowExecution = {
  id: string;
  workflowId: string;
  userId: string;
  definition: string;
  status: string;
  startedAt?: Date | null;
  completedAt?: Date | null;
  creditsConsumed?: number | null;
  trigger: string;
  createdAt: Date;
};

export type ExecutionPhase = {
  id: string;
  executionId: string;
  userId: string;
  status: string;
  number: number;
  node: string;
  name: string;
  inputs?: string | null;
  outputs?: string | null;
  creditsConsumed?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  logs?: ExecutionLog[];
};

export type ExecutionLog = {
  id: string;
  phaseId: string;
  message: string;
  timestamp: Date;
  logLevel: string;
};

export type Credential = {
  id: string;
  userId: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserBalance = {
  id: string;
  userId: string;
  credits: number;
  updatedAt: Date;
};

export type UserPurchase = {
  id: string;
  userId: string;
  stripeId: string;
  description: string;
  amount: number;
  currency: string;
  createdAt: Date;
};

