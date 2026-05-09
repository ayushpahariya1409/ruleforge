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
  // Path to the pre-parsed JSON file on disk (populated in background after upload).
  // When present, evaluate reads JSON instead of re-parsing slow XLSX.
  parsedFilePath: {
    type: String,
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
