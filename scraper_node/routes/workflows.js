const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/clerk');
const { z } = require('zod');
const logger = require('../config/logger');
const cronParser = require('cron-parser');
const { flowToExecutionPlan } = require('../lib/workflow/executionPlan');
const { calculateWorkflowCost } = require('../lib/workflow/helper');
const { TaskRegistry } = require('../lib/workflow/task/Registry');
const { createFlowNode } = require('../lib/workflow/CreateFlowNode');
const { executeWorkflow } = require('../lib/workflow/executeWorkflow');
const {
  WorkflowStatus,
  TaskType,
  WorkflowExecutionStatus,
  ExecutionPhaseStatus,
  WorkflowExecutionTrigger,
} = require('../lib/workflow/constants');

// Schemas
const createWorkflowSchema = z.object({
  name: z.string().max(50),
  description: z.string().max(80).optional(),
});

// Helper function to create initial workflow node (using imported function)
// createFlowNode is already imported above

// GET /api/v1/workflows - Get all workflows for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;

    const workflows = await prisma.workflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: workflows,
    });
  } catch (error) {
    logger.error('Error fetching workflows', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch workflows',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/workflows/:id - Get single workflow
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;

    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        executions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Workflow not found',
          statusCode: 404,
        },
      });
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    logger.error('Error fetching workflow', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch workflow',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/workflows - Create new workflow
router.post('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const validation = createWorkflowSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid form data',
          statusCode: 400,
          details: validation.error.errors,
        },
      });
    }

    const { name, description } = validation.data;

    const initWorkflow = {
      nodes: [createFlowNode(TaskType.LAUNCH_BROWSER)],
      edges: [],
    };

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        status: WorkflowStatus.DRAFT,
        definition: JSON.stringify(initWorkflow),
        name,
        description: description || null,
      },
    });

    res.status(201).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    logger.error('Error creating workflow', { error: error.message });
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Workflow with this name already exists',
          statusCode: 409,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create workflow',
        statusCode: 500,
      },
    });
  }
});

// PUT /api/v1/workflows/:id - Update workflow definition
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;
    const { definition } = req.body;

    if (!definition) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Definition is required',
          statusCode: 400,
        },
      });
    }

    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Workflow not found',
          statusCode: 404,
        },
      });
    }

    if (workflow.status !== WorkflowStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Workflow is not draft',
          statusCode: 400,
        },
      });
    }

    const updated = await prisma.workflow.update({
      where: {
        id,
        userId,
      },
      data: {
        definition: typeof definition === 'string' ? definition : JSON.stringify(definition),
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Error updating workflow', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update workflow',
        statusCode: 500,
      },
    });
  }
});

// DELETE /api/v1/workflows/:id - Delete workflow
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;

    await prisma.workflow.delete({
      where: {
        id,
        userId,
      },
    });

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting workflow', { error: error.message });
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Workflow not found',
          statusCode: 404,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete workflow',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/workflows/:id/publish - Publish workflow
router.post('/:id/publish', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;
    const { flowDefinition } = req.body;

    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Workflow not found',
          statusCode: 404,
        },
      });
    }

    if (workflow.status !== WorkflowStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Workflow is not draft',
          statusCode: 400,
        },
      });
    }

    // Parse flow definition and create execution plan
    const flow = JSON.parse(flowDefinition || workflow.definition);
    
    const result = flowToExecutionPlan(flow.nodes, flow.edges || []);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Flow definition not valid',
          statusCode: 400,
          details: result.error,
        },
      });
    }

    if (!result.executionPlan) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'No execution plan generated, Something went wrong',
          statusCode: 500,
        },
      });
    }

    const creditsCost = calculateWorkflowCost(flow.nodes);

    const updated = await prisma.workflow.update({
      where: {
        id,
        userId,
      },
      data: {
        definition: typeof flowDefinition === 'string' ? flowDefinition : JSON.stringify(flowDefinition),
        executionPlan: JSON.stringify(result.executionPlan),
        creditsCost,
        status: WorkflowStatus.PUBLISHED,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Error publishing workflow', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to publish workflow',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/workflows/:id/unpublish - Unpublish workflow
router.post('/:id/unpublish', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;

    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Workflow not found',
          statusCode: 404,
        },
      });
    }

    if (workflow.status !== WorkflowStatus.PUBLISHED) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Workflow is not published',
          statusCode: 400,
        },
      });
    }

    const updated = await prisma.workflow.update({
      where: {
        id,
        userId,
      },
      data: {
        status: WorkflowStatus.DRAFT,
        executionPlan: null,
        creditsCost: 0,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Error unpublishing workflow', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to unpublish workflow',
        statusCode: 500,
      },
    });
  }
});

// PUT /api/v1/workflows/:id/cron - Update workflow cron schedule
router.put('/:id/cron', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;
    const { cron } = req.body;

    if (!cron) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cron expression is required',
          statusCode: 400,
        },
      });
    }

    // Validate cron expression
    try {
      const interval = cronParser.parseExpression(cron, { utc: true });
      const nextRunAt = interval.next().toDate();

      const updated = await prisma.workflow.update({
        where: {
          id,
          userId,
        },
        data: {
          cron,
          nextRunAt,
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (cronError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid cron expression',
          statusCode: 400,
        },
      });
    }
  } catch (error) {
    logger.error('Error updating workflow cron', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update workflow cron',
        statusCode: 500,
      },
    });
  }
});

// DELETE /api/v1/workflows/:id/cron - Remove workflow schedule
router.delete('/:id/cron', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;

    const updated = await prisma.workflow.update({
      where: {
        id,
        userId,
      },
      data: {
        cron: null,
        nextRunAt: null,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Error removing workflow schedule', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to remove workflow schedule',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/workflows/:id/duplicate - Duplicate workflow
router.post('/:id/duplicate', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;
    const validation = createWorkflowSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid form data',
          statusCode: 400,
          details: validation.error.errors,
        },
      });
    }

    const { name, description } = validation.data;

    const sourceWorkflow = await prisma.workflow.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!sourceWorkflow) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Workflow not found',
          statusCode: 404,
        },
      });
    }

    const duplicated = await prisma.workflow.create({
      data: {
        userId,
        status: WorkflowStatus.DRAFT,
        name,
        description: description || null,
        definition: sourceWorkflow.definition,
      },
    });

    res.status(201).json({
      success: true,
      data: duplicated,
    });
  } catch (error) {
    logger.error('Error duplicating workflow', { error: error.message });
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Workflow with this name already exists',
          statusCode: 409,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to duplicate workflow',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/workflows/:id/executions - Get workflow executions
router.get('/:id/executions', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;

    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflowId: id,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        phases: {
          orderBy: {
            number: 'asc',
          },
        },
      },
    });

    res.json({
      success: true,
      data: executions,
    });
  } catch (error) {
    logger.error('Error fetching workflow executions', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch workflow executions',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/workflows/:id/execute - Execute workflow manually
router.post('/:id/execute', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;
    const { flowDefinition } = req.body;

    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Workflow not found',
          statusCode: 404,
        },
      });
    }

    let executionPlan;
    let workflowDefinition = flowDefinition;

    // If workflow is published, use execution plan from workflow
    if (workflow.status === WorkflowStatus.PUBLISHED) {
      if (!workflow.executionPlan) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No execution plan found in published workflow',
            statusCode: 400,
          },
        });
      }
      executionPlan = JSON.parse(workflow.executionPlan);
      workflowDefinition = workflow.definition;
    } else {
      // Otherwise generate execution plan from flow definition
      if (!flowDefinition) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Flow definition is not defined',
            statusCode: 400,
          },
        });
      }

      const flow = JSON.parse(flowDefinition);
      const result = flowToExecutionPlan(flow.nodes, flow.edges);
      
      if (result.error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Flow definition not valid',
            statusCode: 400,
            details: result.error,
          },
        });
      }
      
      if (!result.executionPlan) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'No execution plan generated, Something went wrong',
            statusCode: 500,
          },
        });
      }
      
      executionPlan = result.executionPlan;
    }

    // Create execution
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: id,
        userId,
        definition: workflowDefinition,
        status: WorkflowExecutionStatus.PENDING,
        trigger: WorkflowExecutionTrigger.MANUAL,
        phases: {
          create: executionPlan.flatMap((phase) =>
            phase.nodes.map((node) => ({
              userId,
              status: ExecutionPhaseStatus.CREATED,
              number: phase.phase,
              node: JSON.stringify(node),
              name: TaskRegistry[node.data.type].label,
            }))
          ),
        },
      },
    });

    // Execute workflow asynchronously
    executeWorkflow(execution.id).catch((error) => {
      logger.error('Error executing workflow', { error: error.message, executionId: execution.id });
    });

    res.json({
      success: true,
      data: {
        executionId: execution.id,
        message: 'Workflow execution started',
      },
    });
  } catch (error) {
    logger.error('Error executing workflow', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to execute workflow',
        statusCode: 500,
      },
    });
  }
});

module.exports = router;

