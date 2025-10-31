const prisma = require('../prisma');
const {
  ExecutionPhaseStatus,
  WorkflowExecutionStatus,
  TaskParamType,
} = require('./constants');
const { TaskRegistry } = require('./task/Registry');
const { ExecutorRegistry } = require('./executor/Registry');
const { createLogCollector } = require('./log');
const { ExecutionEnvironment } = require('./types');

async function executeWorkflow(executionId, nextRunAt) {
  const execution = await prisma.workflowExecution.findUnique({
    where: {
      id: executionId,
    },
    include: { workflow: true, phases: { orderBy: { number: 'asc' } } },
  });

  if (!execution) {
    throw new Error('Execution not found');
  }

  const edges = JSON.parse(execution.definition).edges || [];

  const environment = { phases: {} };
  await initializeWorkflowExecution(
    executionId,
    execution.workflowId,
    nextRunAt
  );
  await initializePhaseStatuses(execution);

  let executionFailed = false;
  let creditsConsumed = 0;

  for (const phase of execution.phases) {
    const phaseExecution = await executeWorkflowPhase(
      phase,
      environment,
      edges,
      execution.userId
    );
    creditsConsumed += phaseExecution.creditsConsumed;
    if (!phaseExecution.success) {
      executionFailed = true;
      break;
    }
  }

  await finalizeWorkflowExecution(
    executionId,
    execution.workflowId,
    executionFailed,
    creditsConsumed
  );
  await cleanupEnvironment(environment);
}

async function initializeWorkflowExecution(
  executionId,
  workflowId,
  nextRunAt
) {
  await prisma.workflowExecution.update({
    where: {
      id: executionId,
    },
    data: {
      startedAt: new Date(),
      status: WorkflowExecutionStatus.RUNNING,
    },
  });
  await prisma.workflow.update({
    where: {
      id: workflowId,
    },
    data: {
      lastRunAt: new Date(),
      lastRunStatus: WorkflowExecutionStatus.RUNNING,
      lastRunId: executionId,
      ...(nextRunAt && { nextRunAt }),
    },
  });
}

async function initializePhaseStatuses(execution) {
  await prisma.executionPhase.updateMany({
    where: {
      id: {
        in: execution.phases.map((phase) => phase.id),
      },
    },
    data: {
      status: ExecutionPhaseStatus.PENDING,
    },
  });
}

async function finalizeWorkflowExecution(
  executionId,
  workflowId,
  executionFailed,
  creditsConsumed
) {
  const finalStatus = executionFailed
    ? WorkflowExecutionStatus.FAILED
    : WorkflowExecutionStatus.COMPLETED;

  await prisma.workflowExecution.update({
    where: {
      id: executionId,
    },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      creditsConsumed,
    },
  });

  await prisma.workflow
    .update({
      where: {
        id: workflowId,
        lastRunId: executionId,
      },
      data: {
        lastRunStatus: finalStatus,
      },
    })
    .catch((err) => {
      // Ignoring the error
      // This means that we have triggered other runs for this workflow, while an execution was running
      console.log('Error updating workflow lastRunStatus:', err.message);
    });
}

async function executeWorkflowPhase(phase, environment, edges, userId) {
  const startedAt = new Date();
  const logCollector = createLogCollector();

  const node = JSON.parse(phase.node);
  setupEnvironmentForPhase(node, environment, edges);

  await prisma.executionPhase.update({
    where: {
      id: phase.id,
    },
    data: {
      status: ExecutionPhaseStatus.RUNNING,
      startedAt,
      inputs: JSON.stringify(environment.phases[node.id].inputs),
    },
  });

  const creditsRequired = TaskRegistry[node.data.type].credits;

  let success = await decrementCredits(userId, creditsRequired, logCollector);

  const creditsConsumed = success ? creditsRequired : 0;
  if (success) {
    // executing phase only when credits are available and deducted
    success = await executePhase(phase, node, environment, logCollector);
  }
  const outputs = environment.phases[node.id].outputs;
  await finalizePhase(
    phase.id,
    success,
    outputs,
    creditsConsumed,
    logCollector
  );
  return { success, creditsConsumed };
}

async function finalizePhase(
  phaseId,
  success,
  outputs,
  creditsConsumed,
  logCollector
) {
  const finalStatus = success
    ? ExecutionPhaseStatus.COMPLETED
    : ExecutionPhaseStatus.FAILED;

  await prisma.executionPhase.update({
    where: {
      id: phaseId,
    },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      outputs: JSON.stringify(outputs),
      creditsConsumed,
      logs: {
        createMany: {
          data: logCollector.getAll().map((log) => ({
            message: log.message,
            timestamp: log.timeStamp,
            logLevel: log.level,
          })),
        },
      },
    },
  });
}

async function executePhase(phase, node, environment, logCollector) {
  const runFc = ExecutorRegistry[node.data.type];
  if (!runFc) {
    logCollector.error(`Executor not found for ${node.data.type}`);
    return false;
  }

  const executionEnvironment = createExecutionEnvironment(
    node,
    environment,
    logCollector
  );

  return await runFc(executionEnvironment);
}

function setupEnvironmentForPhase(node, environment, edges) {
  environment.phases[node.id] = {
    inputs: {},
    outputs: {},
  };
  const inputs = TaskRegistry[node.data.type].inputs;

  for (const input of inputs) {
    if (input.type === TaskParamType.BROWSE_INSTANCE) continue;
    const inputValue = node.data.inputs[input.name];
    if (inputValue) {
      // Input value is defined by user
      environment.phases[node.id].inputs[input.name] = inputValue;
      continue;
    }
    // The input value is coming from output of previous node

    const connectedEdge = edges.find(
      (edge) => edge.target === node.id && edge.targetHandle === input.name
    );

    if (!connectedEdge) {
      console.error(
        'Missing edge for input ',
        input.name,
        ' node.id: ',
        node.id
      );
      continue;
    }

    const outputValue =
      environment.phases[connectedEdge.source]?.outputs[
        connectedEdge.sourceHandle
      ];

    if (outputValue !== undefined) {
      environment.phases[node.id].inputs[input.name] = outputValue;
    }
  }
}

function createExecutionEnvironment(node, environment, logCollector) {
  return ExecutionEnvironment(node, environment, logCollector);
}

async function cleanupEnvironment(environment) {
  if (environment.browser) {
    await environment.browser.close().catch((err) => {
      console.log('Cannot close browser, reason:', err);
    });
  }
}

async function decrementCredits(userId, amount, logCollector) {
  try {
    await prisma.userBalance.update({
      where: {
        userId,
        credits: {
          gte: amount,
        },
      },
      data: {
        credits: { decrement: amount },
      },
    });
    return true;
  } catch (error) {
    logCollector.error('Insufficient balance');
    // user does not have sufficient balance
    return false;
  }
}

module.exports = {
  executeWorkflow,
};

