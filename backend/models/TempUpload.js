const mongoose = require('mongoose');

/**
 * Temporary storage for parsed upload rows.
 * Auto-expires after 1 hour via MongoDB TTL index.
 * This avoids re-sending large payloads from the browser on evaluate.
 */
const TempUploadSchema = new mongoose.Schema({
  rows: {
    type: mongoose.Schema.Types.Mixed, // Array of row objects
    required: true,
  },
  headers: [String],
  totalRows: Number,
  fileName: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // TTL: auto-delete after 1 hour
  },
});

module.exports = mongoose.model('TempUpload', TempUploadSchema);
