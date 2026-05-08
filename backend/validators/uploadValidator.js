const Joi = require('joi');

const evaluateSchema = Joi.object({
  // Session-based flow (preferred for large files): browser sends sessionId,
  // server fetches rows from TempUpload collection.
  sessionId: Joi.string().trim().optional(),

  // Legacy / direct flow: browser sends rows directly (small datasets only).
  orders: Joi.array().items(Joi.object()).min(1).optional(),

  ruleIds: Joi.array().items(Joi.string()).allow(null).default(null),
  fileName: Joi.string().trim().default('Untitled'),
}).or('sessionId', 'orders').messages({
  'object.missing': 'Either sessionId or orders must be provided',
});

module.exports = { evaluateSchema };

