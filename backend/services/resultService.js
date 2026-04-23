const evaluationRepository = require('../repositories/evaluationRepository');
const ruleRepository = require('../repositories/ruleRepository');

const ApiError = require('../utils/ApiError');

class ResultService {
  async getEvaluations(userId, role, { page, limit }) {
    // Each user only sees their own uploads by default
    return evaluationRepository.findByUser(userId, { page, limit });
  }

  async getEvaluationById(id, userId, role) {
    const evaluation = await evaluationRepository.findById(id);
    if (!evaluation) {
      throw ApiError.notFound('Evaluation not found');
    }

    // Users can only see their own evaluations
    if (role !== 'admin' && evaluation.uploadedBy !== userId) {
      throw ApiError.forbidden('You do not have access to this evaluation');
    }

    return evaluation;
  }



  async getStats(userId, role) {
    const evalStats = await evaluationRepository.getStats(userId);
    const activeRules = await ruleRepository.countActive();

    return {
      totalEvaluations: evalStats.totalEvaluations,
      totalOrders: evalStats.totalOrders,
      totalMatches: evalStats.totalMatches,
      matchRate:
        evalStats.totalOrders > 0
          ? ((evalStats.totalMatches / evalStats.totalOrders) * 100).toFixed(1)
          : 0,
      activeRules,
    };
  }
}

module.exports = new ResultService();
