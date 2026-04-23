const Evaluation = require('../models/Evaluation');

class EvaluationRepository {
  async create(evaluationData) {
    return Evaluation.create(evaluationData);
  }

  async findById(id) {
    return Evaluation.findById(id);
  }

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      Evaluation.find({ uploadedBy: userId })
        .select('-results')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Evaluation.countDocuments({ uploadedBy: userId }),
    ]);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findAll({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      Evaluation.find()
        .select('-results')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Evaluation.countDocuments(),
    ]);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(userId = null) {
    const match = userId ? { uploadedBy: userId } : {};
    const stats = await Evaluation.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalEvaluations: { $sum: 1 },
          totalOrders: { $sum: '$totalOrders' },
          totalMatches: { $sum: '$totalMatches' },
        },
      },
    ]);

    return stats[0] || { totalEvaluations: 0, totalOrders: 0, totalMatches: 0 };
  }

  async update(id, updateData) {
    return Evaluation.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new EvaluationRepository();
