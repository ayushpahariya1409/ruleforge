const ruleRepository = require('../repositories/ruleRepository');
const evaluationRepository = require('../repositories/evaluationRepository');
const EvaluationResult = require('../models/EvaluationResult');
const TempUpload = require('../models/TempUpload');
const { parseExcelFile, cleanupFile } = require('../utils/excelParser');
const { Worker } = require('worker_threads');
const path = require('path');
const ApiError = require('../utils/ApiError');

const MAX_WORKERS = 4;
const CHUNK_SIZE = 5000;

class EvaluationService {
  runWorker(workerData) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'evaluationWorker.js'), {
        workerData,
      });
      worker.on('message', (message) => {
        if (message.error) reject(new Error(message.error));
        else resolve(message);
      });
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  }

  async runWithWorkerPool(chunks, plainRules, onChunkResult) {
    let nextIndex = 0;
    const runLane = async (threadId) => {
      while (nextIndex < chunks.length) {
        const index = nextIndex++;
        const chunkResult = await this.runWorker({
          orders: chunks[index],
          rules: plainRules,
        });
        if (onChunkResult) {
          await onChunkResult(chunkResult, index);
        }
      }
    };
    await Promise.all(Array.from({ length: MAX_WORKERS }, (_, i) => runLane(i + 1)));
  }

  /**
   * Main Trigger: Creates evaluation record and starts background task.
   * Returns immediately to the client to prevent timeouts.
   */
  async evaluate({ orders, sessionId, ruleIds, fileName, userId }) {
    console.log("=== TRIGGERING ASYNC EVALUATION v4 ===");

    // 1. Initial metadata setup
    let totalOrdersGuess = orders?.length || 0;
    let filePath = null;

    if (sessionId) {
      const tempUpload = await TempUpload.findById(sessionId).lean();
      if (!tempUpload) throw ApiError.badRequest('Upload session expired.');
      filePath = tempUpload.filePath;
      fileName = fileName || tempUpload.fileName;
      totalOrdersGuess = tempUpload.totalRows;
    }

    // 2. Create the Evaluation record in 'processing' status
    const evaluation = await evaluationRepository.create({
      fileName: fileName || 'Untitled',
      totalOrders: totalOrdersGuess,
      totalMatches: 0,
      rulesApplied: [],
      uploadedBy: userId,
      status: 'processing',
    });

    // 3. FIRE AND FORGET: Start background processing
    // This allows the API to return 200 OK immediately.
    this.processInBackgroundTask(evaluation._id, { orders, sessionId, filePath, ruleIds, userId })
      .catch(err => console.error(`[BackgroundEvaluation] Critical Error in ${evaluation._id}:`, err));

    return {
      evaluationId: evaluation._id,
      status: 'processing',
      totalOrders: totalOrdersGuess,
    };
  }

  /**
   * Background Task: Handles parsing, rule fetching, worker execution, and DB storage.
   */
  async processInBackgroundTask(evaluationId, { orders, sessionId, filePath, ruleIds }) {
    const start = Date.now();
    try {
      console.log(`[BackgroundEvaluation] Starting ${evaluationId}...`);

      // 1. Fetch rules
      let rules;
      if (ruleIds?.length > 0) {
        rules = await ruleRepository.findByIds(ruleIds);
      } else {
        rules = await ruleRepository.findActive();
      }
      
      const plainRules = JSON.parse(JSON.stringify(rules));
      await evaluationRepository.update(evaluationId, { rulesApplied: rules.map(r => r._id) });

      // 2. Parse file if needed
      if (filePath) {
        console.log(`[BackgroundEvaluation] Parsing ${filePath}`);
        const parsed = parseExcelFile(filePath);
        orders = parsed.rows;
        await evaluationRepository.update(evaluationId, { totalOrders: orders.length });
        
        // Cleanup temp file
        await TempUpload.findOneAndDelete({ filePath });
        cleanupFile(filePath);
      }

      if (!orders || orders.length === 0) {
        throw new Error('No orders found to evaluate');
      }

      // 3. Prepare Chunks
      const chunks = [];
      for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
        chunks.push(orders.slice(i, i + CHUNK_SIZE));
      }

      let totalMatches = 0;

      // 4. Execute workers and flush results
      await this.runWithWorkerPool(chunks, plainRules, async (chunkResult, chunkIndex) => {
        totalMatches += chunkResult.totalMatches;
        
        const resultsToInsert = chunkResult.results.map((r, idx) => ({
          evaluationId: evaluationId,
          orderIndex: (chunkIndex * CHUNK_SIZE) + idx + 1,
          orderData: r.orderData,
          matchedRules: r.matchedRules,
        }));

        await EvaluationResult.collection.insertMany(resultsToInsert, { ordered: false });
        console.log(`[BackgroundEvaluation] ${evaluationId} - Chunk ${chunkIndex + 1}/${chunks.length} saved.`);
      });

      // 5. Finalize
      await evaluationRepository.update(evaluationId, { 
        status: 'completed', 
        totalMatches,
        totalOrders: orders.length
      });
      
      console.log(`[BackgroundEvaluation] ${evaluationId} Finished in ${Date.now() - start}ms`);

    } catch (error) {
      console.error(`[BackgroundEvaluation] Failed ${evaluationId}:`, error);
      await evaluationRepository.update(evaluationId, { 
        status: 'failed', 
        error: error.message 
      });
    }
  }

  async getEvaluationResults(evaluationId, page = 1, limit = 50, query = { evaluationId }) {
    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      EvaluationResult.find(query).sort({ orderIndex: 1 }).skip(skip).limit(limit),
      EvaluationResult.countDocuments(query)
    ]);
    return { results, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getEvaluationStatus(id) {
    return evaluationRepository.findById(id);
  }
}

module.exports = new EvaluationService();