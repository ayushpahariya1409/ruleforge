const mongoose = require('mongoose');

// Recursive condition schema: supports leaves and nested groups
const conditionLeafSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    operator: {
      type: String,
      required: true,
      enum: ['>', '<', '=', '!=', '>=', '<='],
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

// We use Mixed for the conditions tree since mongoose doesn't natively
// support recursive schemas well. Validation is handled by Joi.
const ruleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: [true, 'Rule name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Rule name must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Conditions are required'],
    },

    ruleHash: {
      type: String,
      required: [true, 'Rule hash is required'],
      unique: [true, 'A rule with identical logic already exists'],
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and uniqueness
ruleSchema.index({ isActive: 1, isDeleted: 1 });
ruleSchema.index({ isDeleted: 1 });
ruleSchema.index({ ruleName: 1, isDeleted: 1 }, { unique: true });


module.exports = mongoose.model('Rule', ruleSchema);
