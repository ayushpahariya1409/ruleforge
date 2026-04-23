const Joi = require('joi');

// Recursive condition schema
const conditionLeaf = Joi.object({
  field: Joi.string().required(),
  operator: Joi.string().valid('>', '<', '=', '!=', '>=', '<=').required(),
  value: Joi.alternatives()
    .try(Joi.string(), Joi.number(), Joi.boolean())
    .required(),
});

// Level 5 (Deepest)
const level5 = Joi.object({
  logic: Joi.string().valid('AND', 'OR').required(),
  conditions: Joi.array().items(conditionLeaf).min(1).max(15).required(),
});

// Level 4
const level4 = Joi.object({
  logic: Joi.string().valid('AND', 'OR').required(),
  conditions: Joi.array()
    .items(Joi.alternatives().try(conditionLeaf, level5))
    .min(1)
    .max(15)
    .required(),
});

// Level 3
const level3 = Joi.object({
  logic: Joi.string().valid('AND', 'OR').required(),
  conditions: Joi.array()
    .items(Joi.alternatives().try(conditionLeaf, level4))
    .min(1)
    .max(15)
    .required(),
});

// Level 2
const level2 = Joi.object({
  logic: Joi.string().valid('AND', 'OR').required(),
  conditions: Joi.array()
    .items(Joi.alternatives().try(conditionLeaf, level3))
    .min(1)
    .max(15)
    .required(),
});

// Level 1 (Root)
const conditionGroup = Joi.object({
  logic: Joi.string().valid('AND', 'OR').required(),
  conditions: Joi.array()
    .items(Joi.alternatives().try(conditionLeaf, level2))
    .min(1)
    .max(15)
    .required(),
});

const createRuleSchema = Joi.object({
  ruleName: Joi.string().trim().max(100).required().messages({
    'string.max': 'Rule name must be at most 100 characters',
    'any.required': 'Rule name is required',
  }),
  description: Joi.string().trim().max(500).allow('').default(''),
  conditions: conditionGroup.required().messages({
    'any.required': 'Conditions are required',
  }),
  isActive: Joi.boolean().default(true),
});

const updateRuleSchema = Joi.object({
  ruleName: Joi.string().trim().max(100),
  description: Joi.string().trim().max(500).allow(''),
  conditions: conditionGroup,
  isActive: Joi.boolean(),
}).min(1);

const testRuleSchema = Joi.object({
  conditions: conditionGroup.required(),
  sampleData: Joi.object().required(),
});

module.exports = { createRuleSchema, updateRuleSchema, testRuleSchema };
