const ruleRepository = require('../repositories/ruleRepository');
const evaluationRepository = require('../repositories/evaluationRepository');
const EvaluationResult = require('../models/EvaluationResult');
const TempUpload = require('../models/TempUpload');
const { parseExcelFile, cleanupFile } = require('../utils/excelParser');
const { Worker } = require('worker_threads');
const path = require('path');
const ApiError = require('../utils/ApiError');

// t3.micro = 2 vCPUs, so 2 workers is optimal
const MAX_WORKERS = 2;
// Larger chunks = fewer worker spawns = less serialization overhead
const CHUNK_SIZE = 10000;
// MongoDB batch size for inserts
const DB_BATCH_SIZE = 5000;

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

  async runWithWorkerPool(chunks, plainRules, baseIndices, onChunkResult) {
    let nextIndex = 0;
    const runLane = async () => {
      while (nextIndex < chunks.length) {
        const index = nextIndex++;
        const chunkResult = await this.runWorker({
          orders: chunks[index],
          rules: plainRules,
        });
        if (onChunkResult) {
          await onChunkResult(chunkResult, index, baseIndices[index]);
        }
      }
    };
    await Promise.all(Array.from({ length: MAX_WORKERS }, () => runLane()));
  }

  /**
   * Main Trigger: Creates evaluation record and starts background task.
   * Returns immediately to the client to prevent timeouts.
   */
  async evaluate({ orders, sessionId, ruleIds, fileName, userId }) {
    console.log("=== TRIGGERING ASYNC EVALUATION v5 (OPTIMIZED) ===");

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
    this.processInBackgroundTask(evaluation._id, { orders, sessionId, filePath, ruleIds, userId })
      .catch(err => console.error(`[Eval] CRITICAL ${evaluation._id}:`, err));

    return {
      evaluationId: evaluation._id,
      status: 'processing',
      totalOrders: totalOrdersGuess,
    };
  }

  /**
   * Background Task: Handles parsing, rule fetching, worker execution, and DB storage.
   * OPTIMIZED: Only stores matched results, uses fast evaluation path.
   */
  async processInBackgroundTask(evaluationId, { orders, sessionId, filePath, ruleIds }) {
    const start = Date.now();
    try {
      console.log(`[Eval] Starting ${evaluationId}...`);

      // 1. Fetch rules
      let rules;
      if (ruleIds?.length > 0) {
        rules = await ruleRepository.findByIds(ruleIds);
      } else {
        rules = await ruleRepository.findActive();
      }
      
      const plainRules = JSON.parse(JSON.stringify(rules));
      await evaluationRepository.update(evaluationId, { rulesApplied: rules.map(r => r._id) });
      console.log(`[Eval] ${evaluationId} - ${plainRules.length} rules loaded in ${Date.now() - start}ms`);

      // 2. Parse file if needed
      const parseStart = Date.now();
      if (filePath) {
        const tempDoc = await TempUpload.findOne({ filePath }).lean();

        if (tempDoc?.parseStatus === 'ready' && tempDoc?.parsedRows?.length > 0) {
          // ✅ FAST PATH: Background parse already completed — use cached rows instantly
          orders = tempDoc.parsedRows;
          console.log(`[Eval] ${evaluationId} - Used cached parse (${orders.length} rows) in ${Date.now() - parseStart}ms`);
        } else {
          // ⏳ FALLBACK: Background parse not ready yet — parse now
          console.log(`[Eval] ${evaluationId} - Cache not ready (status: ${tempDoc?.parseStatus}), parsing from disk...`);
          const parsed = parseExcelFile(filePath);
          orders = parsed.rows;
          console.log(`[Eval] ${evaluationId} - Disk parse done: ${orders.length} rows in ${Date.now() - parseStart}ms`);
        }

        await evaluationRepository.update(evaluationId, { totalOrders: orders.length });

        // Cleanup temp file and DB record
        await TempUpload.findOneAndDelete({ filePath });
        cleanupFile(filePath);
      }

      if (!orders || orders.length === 0) {
        throw new Error('No orders found to evaluate');
      }

      // 3. Prepare Chunks with base index tracking
      const chunks = [];
      const baseIndices = [];
      for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
        chunks.push(orders.slice(i, i + CHUNK_SIZE));
        baseIndices.push(i);
      }
      console.log(`[Eval] ${evaluationId} - Split into ${chunks.length} chunks of ${CHUNK_SIZE}`);

      // Free memory — we don't need the full array anymore
      orders = null;

      let totalMatches = 0;
      const evalStart = Date.now();

      // 4. Execute workers — ONLY matched results come back
      await this.runWithWorkerPool(chunks, plainRules, baseIndices, async (chunkResult, chunkIndex, baseIndex) => {
        totalMatches += chunkResult.totalMatches;

        // Only insert results that actually matched a rule
        if (chunkResult.matchedResults.length > 0) {
          const resultsToInsert = chunkResult.matchedResults.map(r => ({
            evaluationId: evaluationId,
            orderIndex: baseIndex + r.orderIndex,
            orderData: r.orderData,
            matchedRules: r.matchedRuleIds.map(mr => ({
              ruleId: mr.ruleId,
              ruleName: mr.ruleName,
              matched: true,
            })),
          }));

          // Batch insert in groups to avoid overwhelming MongoDB
          for (let b = 0; b < resultsToInsert.length; b += DB_BATCH_SIZE) {
            const batch = resultsToInsert.slice(b, b + DB_BATCH_SIZE);
            await EvaluationResult.collection.insertMany(batch, { ordered: false });
          }
        }

        console.log(`[Eval] ${evaluationId} - Chunk ${chunkIndex + 1}/${chunks.length}: ${chunkResult.totalMatches} matches (${chunkResult.totalProcessed} processed) in ${Date.now() - evalStart}ms`);
      });

      // 5. Finalize
      await evaluationRepository.update(evaluationId, { 
        status: 'completed', 
        totalMatches,
        totalOrders: chunks.reduce((sum, c) => sum + c.length, 0),
      });
      
      console.log(`[Eval] ✅ ${evaluationId} DONE: ${totalMatches} matches in ${Date.now() - start}ms`);

    } catch (error) {
      console.error(`[Eval] ❌ ${evaluationId} FAILED:`, error);
      await evaluationRepository.update(evaluationId, { 
        status: 'failed', 
        error: error.message 
      });
    }
  }

  async getEvaluationResults(evaluationId, page = 1, limit = 50, query = { evaluationId }) {
    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      EvaluationResult.find(query).sort({ orderIndex: 1 }).skip(skip).limit(limit).lean(),
      EvaluationResult.countDocuments(query)
    ]);
    return { results, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getEvaluationStatus(id) {
    return evaluationRepository.findById(id);
  }
}

module.exports = new EvaluationService();