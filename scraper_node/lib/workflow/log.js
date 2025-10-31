const { LogCollector, LogLevels } = require('./types');

function createLogCollector() {
  const logs = [];

  const getAll = () => logs;

  const logFunctions = {};

  LogLevels.forEach((level) => {
    logFunctions[level] = (message) => {
      logs.push({ level, message, timeStamp: new Date() });
    };
  });

  return {
    getAll,
    ...logFunctions,
  };
}

module.exports = {
  createLogCollector,
};

