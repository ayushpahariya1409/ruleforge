const ruleRepository = require('../repositories/ruleRepository');
const evaluationRepository = require('../repositories/evaluationRepository');
const EvaluationResult = require('../models/EvaluationResult'); // New Model
const { Worker } = require('worker_threads');
const path = require('path');
const ApiError = require('../utils/ApiError');

const MAX_WORKERS = 4;
const CHUNK_SIZE = 5000; // Reduced for even better memory reliability with massive files

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
        console.log(`[Worker Thread ID: ${threadId}] Started evaluating chunk of ${chunks[index].length} orders...`);
        const start = Date.now();
        
        const chunkResult = await this.runWorker({
          orders: chunks[index],
          rules: plainRules,
        });

        console.log(`[Worker Thread ID: ${threadId}] Finished in ${Date.now() - start}ms`);

        if (onChunkResult) {
          await onChunkResult(chunkResult, index);
        }
      }
    };

    await Promise.all(Array.from({ length: MAX_WORKERS }, (_, i) => runLane(i + 1)));
  }

  async evaluate({ orders, ruleIds, fileName, userId }) {
    console.log("=== RUNNING MEMORY-OPTIMIZED EVALUATION SERVICE v2 ===");
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      throw ApiError.badRequest('No orders provided for evaluation');
    }

    let rules;
    if (ruleIds && ruleIds.length > 0) {
      rules = await ruleRepository.findByIds(ruleIds);
      if (rules.length === 0) {
        throw ApiError.badRequest('No valid active rules found for the given IDs');
      }
    } else {
      rules = await ruleRepository.findActive();
      if (rules.length === 0) {
        throw ApiError.badRequest('No active rules available. Create rules first.');
      }
    }

    const plainRules = JSON.parse(JSON.stringify(rules));

    const chunks = [];
    for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
      chunks.push(orders.slice(i, i + CHUNK_SIZE));
    }

    // 1. Save metadata first so evaluationId is available
    const evaluation = await evaluationRepository.create({
      fileName: fileName || 'Untitled',
      totalOrders: orders.length,
      totalMatches: 0, // Will update once workers finish
      rulesApplied: rules.map((r) => r._id),
      uploadedBy: userId,
    });

    console.log(`[EvaluationService] Processing ${orders.length} orders in ${chunks.length} chunks with ${MAX_WORKERS} workers`);
    const start = Date.now();
    let totalMatches = 0;

    // 2. Run workers with immediate flushing to DB
    await this.runWithWorkerPool(chunks, plainRules, async (chunkResult, chunkIndex) => {
      totalMatches += chunkResult.totalMatches;
      
      const resultsToInsert = chunkResult.results.map((r, idx) => ({
        evaluationId: evaluation._id,
        orderIndex: (chunkIndex * CHUNK_SIZE) + idx + 1,
        orderData: r.orderData,
        matchedRules: r.matchedRules,
      }));

      // Insert this chunk using native MongoDB driver for extreme memory efficiency (bypasses Mongoose model logic)
      await EvaluationResult.collection.insertMany(resultsToInsert, { ordered: false });
      console.log(`[EvaluationService] Chunk ${chunkIndex + 1}/${chunks.length} saved (Memory Clean).`);
    });

    console.log(`[EvaluationService] Total processing completed in ${Date.now() - start}ms`);

    // 3. Update totalMatches in metadata
    await evaluationRepository.update(evaluation._id, { totalMatches });

    return {
      evaluationId: evaluation._id,
      fileName: evaluation.fileName,
      totalOrders: orders.length,
      totalMatches,
      rulesApplied: rules.map((r) => ({
        _id: r._id,
        ruleName: r.ruleName,
      })),
      results: [], // Return empty array; frontend will fetch paginated results
    };
  }

  async getEvaluationResults(evaluationId, page = 1, limit = 50, query = { evaluationId }) {
    const skip = (page - 1) * limit;
    
    const [results, total] = await Promise.all([
      EvaluationResult.find(query)
        .sort({ orderIndex: 1 })
        .skip(skip)
        .limit(limit),
      EvaluationResult.countDocuments(query)
    ]);

    return {
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new EvaluationService();