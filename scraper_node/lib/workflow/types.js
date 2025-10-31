// Workflow Types - Adapted for Node.js (no React dependencies)

const { TaskType, TaskParamType, WorkflowExecutionStatus, ExecutionPhaseStatus, WorkflowExecutionTrigger } = require('./constants');

// Node types (simplified - no React Node from @xyflow/react)
class AppNode {
  constructor(data) {
    this.id = data.id;
    this.data = data.data;
    this.position = data.position || { x: 0, y: 0 };
    this.type = data.type || 'FlowScrapeNode';
    this.dragHandle = data.dragHandle || '.drag-handle';
  }
}

// Edge type (simplified)
class Edge {
  constructor(data) {
    this.id = data.id;
    this.source = data.source;
    this.target = data.target;
    this.sourceHandle = data.sourceHandle;
    this.targetHandle = data.targetHandle;
  }
}

// Task Param
class TaskParam {
  constructor(data) {
    this.name = data.name;
    this.type = data.type;
    this.helperText = data.helperText;
    this.required = data.required !== undefined ? data.required : false;
    this.hideHandle = data.hideHandle;
  }
}

// Workflow Task (simplified - no React icon)
class WorkflowTask {
  constructor(data) {
    this.label = data.label;
    this.type = data.type;
    this.isEntryPoint = data.isEntryPoint || false;
    this.inputs = data.inputs || [];
    this.outputs = data.outputs || [];
    this.credits = data.credits || 0;
  }
}

// Execution Plan Types
class WorkflowExecutionPlanPhase {
  constructor(phase, nodes) {
    this.phase = phase;
    this.nodes = nodes;
  }
}

class AppNodeMissingInputs {
  constructor(nodeId, inputs) {
    this.nodeId = nodeId;
    this.inputs = inputs;
  }
}

// Environment type
class Environment {
  constructor() {
    this.browser = undefined;
    this.page = undefined;
    this.phases = {};
  }
}

// Log types
const LogLevels = ['info', 'error'];

class Log {
  constructor(message, level, timeStamp) {
    this.message = message;
    this.level = level;
    this.timeStamp = timeStamp;
  }
}

class LogCollector {
  constructor() {
    this.logs = [];
  }

  getAll() {
    return this.logs;
  }

  info(message) {
    this.logs.push(new Log(message, 'info', new Date()));
  }

  error(message) {
    this.logs.push(new Log(message, 'error', new Date()));
  }
}

// Execution Environment
function createExecutionEnvironment(node, environment, logCollector) {
  return {
    getInput(name) {
      return environment.phases[node.id]?.inputs[name];
    },
    setOutput(name, value) {
      if (!environment.phases[node.id]) {
        environment.phases[node.id] = { inputs: {}, outputs: {} };
      }
      environment.phases[node.id].outputs[name] = value;
    },
    getBrowser() {
      return environment.browser;
    },
    setBrowser(browser) {
      environment.browser = browser;
    },
    setPage(page) {
      environment.page = page;
    },
    getPage() {
      return environment.page;
    },
    log: logCollector,
  };
}

module.exports = {
  AppNode,
  Edge,
  TaskParam,
  WorkflowTask,
  WorkflowExecutionPlanPhase,
  AppNodeMissingInputs,
  Environment,
  Log,
  LogCollector,
  ExecutionEnvironment: createExecutionEnvironment,
  LogLevels,
};

