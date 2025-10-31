const crypto = require('crypto');
const { TaskType } = require('./constants');

function createFlowNode(nodeType, position = { x: 0, y: 0 }) {
  return {
    id: crypto.randomUUID(),
    data: {
      type: nodeType,
      inputs: {},
    },
    position,
    type: 'FlowScrapeNode',
    dragHandle: '.drag-handle',
  };
}

module.exports = {
  createFlowNode,
};

