const mongoose = require('mongoose');

/**
 * Temporary reference to an uploaded file on disk.
 * Stores the file path so evaluate can parse the full file server-side.
 * Auto-expires after 1 hour via MongoDB TTL index.
 */
const TempUploadSchema = new mongoose.Schema({
  filePath: {
    type: String,
    required: true,
  },
  fileName: String,
  totalRows: Number,
  // Cached full parse result — populated in background after upload.
  // When present, evaluate skips the 20s re-parse step.
  parsedRows: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  parseStatus: {
    type: String,
    enum: ['pending', 'ready', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // TTL: auto-delete record after 1 hour
  },
});

module.exports = mongoose.model('TempUpload', TempUploadSchema);
