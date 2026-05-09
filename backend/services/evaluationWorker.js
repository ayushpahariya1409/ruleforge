const { parentPort, workerData } = require('worker_threads');
const { evaluateAllOrdersFast } = require('./ruleEngine');

if (workerData && workerData.orders && workerData.rules) {
  try {
    const { matchedResults, totalMatches, totalProcessed } = evaluateAllOrdersFast(
      workerData.orders,
      workerData.rules
    );
    // Only send matched results back — not all 50k orders
    parentPort.postMessage({ matchedResults, totalMatches, totalProcessed });
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
}
