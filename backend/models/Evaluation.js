const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    totalOrders: {
      type: Number,
      required: true,
    },
    totalMatches: {
      type: Number,
      default: 0,
    },
    rulesApplied: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rule',
      },
    ],
    uploadedBy: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user's evaluations
evaluationSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);
