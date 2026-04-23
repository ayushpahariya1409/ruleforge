const mongoose = require('mongoose');

const explanationSchema = new mongoose.Schema(
  {
    field: String,
    operator: String,
    expected: mongoose.Schema.Types.Mixed,
    actual: mongoose.Schema.Types.Mixed,
    result: { type: String, enum: ['PASS', 'FAIL'] },
  },
  { _id: false }
);

const matchedRuleSchema = new mongoose.Schema(
  {
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rule' },
    ruleName: String,
    matched: Boolean,
    explanation: [explanationSchema],
    reason: String,
    logicSummary: String,
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluation',
      required: true,
      index: true,
    },
    orderIndex: {
      type: Number,
      required: true,
    },
    orderData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    matchedRules: [matchedRuleSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient paginated retrieval
resultSchema.index({ evaluationId: 1, orderIndex: 1 });

module.exports = mongoose.model('EvaluationResult', resultSchema);
