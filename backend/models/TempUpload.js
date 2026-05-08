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
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // TTL: auto-delete record after 1 hour
  },
});

module.exports = mongoose.model('TempUpload', TempUploadSchema);
