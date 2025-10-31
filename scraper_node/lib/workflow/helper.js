const { TaskRegistry } = require('./task/Registry');

function calculateWorkflowCost(nodes) {
  return nodes.reduce((acc, node) => {
    return acc + (TaskRegistry[node.data.type]?.credits || 0);
  }, 0);
}

module.exports = {
  calculateWorkflowCost,
};

