const { TaskType, TaskParamType } = require('../constants');

// Task Registry - Simplified version for backend (no React icons)
const TaskRegistry = {
  [TaskType.LAUNCH_BROWSER]: {
    type: TaskType.LAUNCH_BROWSER,
    label: 'Launch Browser',
    isEntryPoint: true,
    inputs: [
      {
        name: 'Website Url',
        type: TaskParamType.STRING,
        helperText: 'eg: https://www.google.com',
        required: true,
        hideHandle: true,
      },
    ],
    outputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
      },
    ],
    credits: 5,
  },
  [TaskType.PAGE_TO_HTML]: {
    type: TaskType.PAGE_TO_HTML,
    label: 'Get HTML from the page',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
        required: true,
      },
    ],
    outputs: [
      {
        name: 'HTML',
        type: TaskParamType.STRING,
      },
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
      },
    ],
    credits: 2,
  },
  [TaskType.EXTRACT_TEXT_FROM_ELEMENT]: {
    type: TaskType.EXTRACT_TEXT_FROM_ELEMENT,
    label: 'Extract text from element',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Html',
        type: TaskParamType.STRING,
        required: true,
        variant: 'textarea',
      },
      {
        name: 'Selector',
        type: TaskParamType.STRING,
        required: true,
      },
    ],
    outputs: [
      {
        name: 'Extracted Text',
        type: TaskParamType.STRING,
      },
    ],
    credits: 2,
  },
  [TaskType.FILL_INPUT]: {
    type: TaskType.FILL_INPUT,
    label: 'Fill input',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
        required: true,
      },
      {
        name: 'Selector',
        type: TaskParamType.STRING,
        required: true,
      },
      {
        name: 'Value',
        type: TaskParamType.STRING,
        required: true,
      },
    ],
    outputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
      },
    ],
    credits: 2,
  },
  [TaskType.CLICK_ELEMENT]: {
    type: TaskType.CLICK_ELEMENT,
    label: 'Click element',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
        required: true,
      },
      {
        name: 'Selector',
        type: TaskParamType.STRING,
        required: true,
      },
    ],
    outputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
      },
    ],
    credits: 2,
  },
  [TaskType.WAIT_FOR_ELEMENT]: {
    type: TaskType.WAIT_FOR_ELEMENT,
    label: 'Wait for element',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
        required: true,
      },
      {
        name: 'Selector',
        type: TaskParamType.STRING,
        required: true,
      },
      {
        name: 'Timeout (ms)',
        type: TaskParamType.STRING,
        required: false,
      },
    ],
    outputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
      },
    ],
    credits: 2,
  },
  [TaskType.DELIVER_VIA_WEBHOOK]: {
    type: TaskType.DELIVER_VIA_WEBHOOK,
    label: 'Deliver via webhook',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Webhook URL',
        type: TaskParamType.STRING,
        required: true,
      },
      {
        name: 'Data',
        type: TaskParamType.STRING,
        required: true,
        variant: 'textarea',
      },
    ],
    outputs: [],
    credits: 5,
  },
  [TaskType.EXTRACT_DATA_WITH_AI]: {
    type: TaskType.EXTRACT_DATA_WITH_AI,
    label: 'Extract data with AI',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Html',
        type: TaskParamType.STRING,
        required: true,
        variant: 'textarea',
      },
      {
        name: 'Prompt',
        type: TaskParamType.STRING,
        required: true,
        variant: 'textarea',
      },
    ],
    outputs: [
      {
        name: 'Extracted Data',
        type: TaskParamType.STRING,
      },
    ],
    credits: 10,
  },
  [TaskType.READ_PROPERTY_FROM_JSON]: {
    type: TaskType.READ_PROPERTY_FROM_JSON,
    label: 'Read property from JSON',
    isEntryPoint: false,
    inputs: [
      {
        name: 'JSON',
        type: TaskParamType.STRING,
        required: true,
        variant: 'textarea',
      },
      {
        name: 'Property Path',
        type: TaskParamType.STRING,
        required: true,
      },
    ],
    outputs: [
      {
        name: 'Property Value',
        type: TaskParamType.STRING,
      },
    ],
    credits: 1,
  },
  [TaskType.ADD_PROPERTY_TO_JSON]: {
    type: TaskType.ADD_PROPERTY_TO_JSON,
    label: 'Add property to JSON',
    isEntryPoint: false,
    inputs: [
      {
        name: 'JSON',
        type: TaskParamType.STRING,
        required: true,
        variant: 'textarea',
      },
      {
        name: 'Property Path',
        type: TaskParamType.STRING,
        required: true,
      },
      {
        name: 'Value',
        type: TaskParamType.STRING,
        required: true,
      },
    ],
    outputs: [
      {
        name: 'JSON',
        type: TaskParamType.STRING,
      },
    ],
    credits: 1,
  },
  [TaskType.NAVIGATE_URL]: {
    type: TaskType.NAVIGATE_URL,
    label: 'Navigate URL',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
        required: true,
      },
      {
        name: 'URL',
        type: TaskParamType.STRING,
        required: true,
      },
    ],
    outputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
      },
    ],
    credits: 2,
  },
  [TaskType.SCROLL_TO_ELEMENT]: {
    type: TaskType.SCROLL_TO_ELEMENT,
    label: 'Scroll to element',
    isEntryPoint: false,
    inputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
        required: true,
      },
      {
        name: 'Selector',
        type: TaskParamType.STRING,
        required: true,
      },
    ],
    outputs: [
      {
        name: 'Web page',
        type: TaskParamType.BROWSE_INSTANCE,
      },
    ],
    credits: 2,
  },
};

module.exports = {
  TaskRegistry,
};

