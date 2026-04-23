const { parentPort, workerData, threadId } = require('worker_threads');
const { evaluateAllOrders } = require('./ruleEngine');

if (workerData && workerData.orders && workerData.rules) {
  try {
    const start = Date.now();
    const { results, totalMatches } = evaluateAllOrders(workerData.orders, workerData.rules);
    parentPort.postMessage({ results, totalMatches });
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
}
