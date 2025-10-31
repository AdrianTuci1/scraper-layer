const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const logger = require('../config/logger');
const cronParser = require('cron-parser');
const { timingSafeEqual } = require('crypto');
const { executeWorkflow } = require('../lib/workflow/executeWorkflow');
const { flowToExecutionPlan } = require('../lib/workflow/executionPlan');
const { TaskRegistry } = require('../lib/workflow/task/Registry');
const {
  WorkflowStatus,
  WorkflowExecutionStatus,
  ExecutionPhaseStatus,
  WorkflowExecutionTrigger,
} = require('../lib/workflow/constants');

// GET /api/v1/workflows/cron - Trigger workflows scheduled for execution
// This endpoint should be called by a cron job runner (e.g., node-cron, AWS EventBridge, etc.)
router.get('/cron', async (req, res) => {
  try {
    // Verify API secret for security
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized',
          statusCode: 401,
        },
      });
    }

    const secret = authHeader.split(' ')[1];
    if (!validSecret(secret)) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized',
          statusCode: 401,
        },
      });
    }

    const now = new Date();

    const workflows = await prisma.workflow.findMany({
      select: {
        id: true,
        userId: true,
        definition: true,
        executionPlan: true,
        cron: true,
      },
      where: {
        status: WorkflowStatus.PUBLISHED,
        cron: { not: null },
        nextRunAt: {
          lte: now,
        },
      },
    });

    const executionPromises = workflows.map(async (workflow) => {
      try {
        const executionPlan = JSON.parse(workflow.executionPlan);
        const cron = cronParser.parseExpression(workflow.cron, { utc: true });
        const nextRun = cron.next().toDate();

        const execution = await prisma.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            userId: workflow.userId,
            definition: workflow.definition,
            status: WorkflowExecutionStatus.PENDING,
            trigger: WorkflowExecutionTrigger.CRON,
            phases: {
              create: executionPlan.flatMap((phase) =>
                phase.nodes.map((node) => ({
                  userId: workflow.userId,
                  status: ExecutionPhaseStatus.CREATED,
                  number: phase.phase,
                  node: JSON.stringify(node),
                  name: TaskRegistry[node.data.type].label,
                }))
              ),
            },
          },
        });

        // Update next run time
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: { nextRunAt: nextRun },
        });

        // Execute workflow asynchronously
        executeWorkflow(execution.id, nextRun).catch((error) => {
          logger.error('Error executing scheduled workflow', {
            error: error.message,
            executionId: execution.id,
            workflowId: workflow.id,
          });
        });

        return { workflowId: workflow.id, executionId: execution.id };
      } catch (error) {
        logger.error('Error processing scheduled workflow', {
          error: error.message,
          workflowId: workflow.id,
        });
        return null;
      }
    });

    const results = await Promise.all(executionPromises);
    const successful = results.filter((r) => r !== null);

    res.json({
      success: true,
      data: {
        workflowsToRun: workflows.length,
        executed: successful.length,
        executions: successful,
      },
    });
  } catch (error) {
    logger.error('Error in cron endpoint', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        statusCode: 500,
      },
    });
  }
});

function validSecret(secret) {
  if (!process.env.API_SECRET) return false;

  try {
    return timingSafeEqual(
      Buffer.from(secret),
      Buffer.from(process.env.API_SECRET)
    );
  } catch (error) {
    logger.error('Invalid secret', { error: error.message });
    return false;
  }
}

module.exports = router;

