const asyncHandler = require('../utils/asyncHandler');
const resultService = require('../services/resultService');

exports.getEvaluations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const data = await resultService.getEvaluations(
    req.user.id,
    req.user.role,
    { page, limit }
  );

  res.status(200).json({
    success: true,
    data: data.results,
    pagination: data.pagination,
  });
});

exports.getEvaluationById = asyncHandler(async (req, res) => {
  const evaluation = await resultService.getEvaluationById(
    req.params.id,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    data: { evaluation },
  });
});



exports.getStats = asyncHandler(async (req, res) => {
  const stats = await resultService.getStats(
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    data: { stats },
  });
});
