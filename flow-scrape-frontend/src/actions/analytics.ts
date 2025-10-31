import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import type { Period } from "@/lib/types";

// Placeholder functions - backend endpoints need to be implemented
export async function getCreditsUsageInPeriod(period: Period) {
  // TODO: Implement backend endpoint
  return [];
}

export async function getWorkflowExecutionsStats(period: Period) {
  // TODO: Implement backend endpoint
  return [];
}

export async function getStatsCardsValue(period: Period) {
  // TODO: Implement backend endpoint
  return {
    WorkflowExecutions: 0,
    creditsConsumed: 0,
    phaseExecutions: 0,
  };
}

export async function getPeriods() {
  // TODO: Implement backend endpoint
  return [];
}

