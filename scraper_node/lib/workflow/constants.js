// Workflow Constants

const WorkflowStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
};

const TaskType = {
  LAUNCH_BROWSER: 'LAUNCH_BROWSER',
  PAGE_TO_HTML: 'PAGE_TO_HTML',
  EXTRACT_TEXT_FROM_ELEMENT: 'EXTRACT_TEXT_FROM_ELEMENT',
  FILL_INPUT: 'FILL_INPUT',
  CLICK_ELEMENT: 'CLICK_ELEMENT',
  WAIT_FOR_ELEMENT: 'WAIT_FOR_ELEMENT',
  DELIVER_VIA_WEBHOOK: 'DELIVER_VIA_WEBHOOK',
  EXTRACT_DATA_WITH_AI: 'EXTRACT_DATA_WITH_AI',
  READ_PROPERTY_FROM_JSON: 'READ_PROPERTY_FROM_JSON',
  ADD_PROPERTY_TO_JSON: 'ADD_PROPERTY_TO_JSON',
  NAVIGATE_URL: 'NAVIGATE_URL',
  SCROLL_TO_ELEMENT: 'SCROLL_TO_ELEMENT',
};

const TaskParamType = {
  STRING: 'STRING',
  BROWSE_INSTANCE: 'BROWSE_INSTANCE',
  SELECT: 'SELECT',
  CREDENTIAL: 'CREDENTIAL',
};

const FlowToExecutionPlanValidationError = {
  NO_ENTRY: 'NO_ENTRY',
  INVALID_INPUTS: 'INVALID_INPUTS',
};

const WorkflowExecutionStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

const ExecutionPhaseStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CREATED: 'CREATED',
};

const WorkflowExecutionTrigger = {
  MANUAL: 'MANUAL',
  CRON: 'CRON',
};

module.exports = {
  WorkflowStatus,
  TaskType,
  TaskParamType,
  FlowToExecutionPlanValidationError,
  WorkflowExecutionStatus,
  ExecutionPhaseStatus,
  WorkflowExecutionTrigger,
};

