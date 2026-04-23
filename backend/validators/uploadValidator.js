const Joi = require('joi');

const evaluateSchema = Joi.object({
  orders: Joi.array().items(Joi.object()).min(1).required().messages({
    'array.min': 'At least one order is required',
    'any.required': 'Orders data is required',
  }),
  ruleIds: Joi.array().items(Joi.string()).allow(null).default(null),
  fileName: Joi.string().trim().default('Untitled'),
});

module.exports = { evaluateSchema };
