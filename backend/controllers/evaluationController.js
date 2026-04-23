const asyncHandler = require('../utils/asyncHandler');
const evaluationService = require('../services/evaluationService');
const mongoose = require('mongoose');

exports.evaluate = asyncHandler(async (req, res) => {
  const { orders, ruleIds, fileName } = req.body;

  const result = await evaluationService.evaluate({
    orders,
    ruleIds,
    fileName,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: `Evaluation complete. ${result.totalMatches} of ${result.totalOrders} orders matched rules.`,
    data: result,
  });
});

exports.getEvaluationResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const ruleIdsStr = req.query.ruleIds;
  const search = req.query.search;
  // Ultra-resilient evaluationId matching (handles both string and ObjectId)
  const evalIdCondition = { 
    $or: [
      { evaluationId: id },
      { evaluationId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id }
    ]
  };
  
  const filters = [evalIdCondition];

  if (ruleIdsStr) {
    const rawIds = ruleIdsStr.split(',').filter(Boolean);
    const objectIds = rawIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (rawIds.length > 0) {
      // 1. Fetch current rule names for a "bulletproof" name-based fallback
      const Rule = mongoose.model('Rule');
      const rules = await Rule.find({ _id: { $in: objectIds } }).select('ruleName').lean();
      const ruleNames = rules.map(r => r.ruleName).filter(Boolean);

      // 2. Powerful $elemMatch that catches any possible match (by ID or Name)
      filters.push({
        matchedRules: {
          $elemMatch: {
            matched: true,
            $or: [
              { ruleId: { $in: [...rawIds, ...objectIds] } },
              { ruleName: { $in: ruleNames } }
            ]
          },
        },
      });
    }
  }

  if (search) {
    filters.push({
      $or: [
        { 'orderData.userName': { $regex: search, $options: 'i' } },
        { 'orderData.userEmail': { $regex: search, $options: 'i' } },
        { 'orderData.productName': { $regex: search, $options: 'i' } },
        { 'orderData.Name': { $regex: search, $options: 'i' } },
        { 'orderData.Email': { $regex: search, $options: 'i' } },
      ],
    });
  }

  const query = filters.length > 1 ? { $and: filters } : filters[0];
  const result = await evaluationService.getEvaluationResults(id, page, limit, query);

  res.status(200).json({
    success: true,
    data: result,
  });
});
