const asyncHandler = require('../utils/asyncHandler');
const ruleService = require('../services/ruleService');

exports.createRule = asyncHandler(async (req, res) => {
  const rule = await ruleService.createRule(req.body, req.user.id);
  res.status(201).json({
    success: true,
    message: 'Rule created successfully',
    data: { rule },
  });
});

exports.getAllRules = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true' && req.user.role === 'admin';
  const rules = await ruleService.getAllRules(includeInactive);
  res.status(200).json({
    success: true,
    data: { rules, count: rules.length },
  });
});

exports.getRuleById = asyncHandler(async (req, res) => {
  const rule = await ruleService.getRuleById(req.params.id);
  res.status(200).json({
    success: true,
    data: { rule },
  });
});

exports.updateRule = asyncHandler(async (req, res) => {
  const rule = await ruleService.updateRule(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Rule updated successfully',
    data: { rule },
  });
});

exports.deleteRule = asyncHandler(async (req, res) => {
  await ruleService.deleteRule(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Rule deleted successfully',
  });
});

exports.testRule = asyncHandler(async (req, res) => {
  const { conditions, sampleData } = req.body;
  const result = await ruleService.testRule(conditions, sampleData);
  res.status(200).json({
    success: true,
    data: { result },
  });
});
