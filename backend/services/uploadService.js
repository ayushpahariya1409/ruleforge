const { parseExcelPreview, parseExcelFile, cleanupFile } = require('../utils/excelParser');
const ApiError = require('../utils/ApiError');
const TempUpload = require('../models/TempUpload');
const fs = require('fs');

class UploadService {
  async processUpload(file) {
    if (!file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];

    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    const allowedExts = ['.xlsx', '.xls', '.csv'];

    if (!allowedTypes.includes(file.mimetype) && !allowedExts.includes(ext)) {
      cleanupFile(file.path);
      throw ApiError.badRequest('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed');
    }

    try {
      // Step 1: Fast preview — only reads 10 rows (~0.3s even for 100k row files)
      const preview = parseExcelPreview(file.path);

      // Step 2: Save session reference immediately
      const tempUpload = await TempUpload.create({
        filePath: file.path,
        fileName: file.originalname,
        totalRows: preview.totalRows,
        parseStatus: 'pending',
      });

      // Step 3: FIRE & FORGET — parse full file in background
      // This runs while user is reviewing the preview, so by the time they
      // click Evaluate, the data is already cached and Evaluate is instant.
      this._parseFullFileInBackground(tempUpload._id, file.path);

      return {
        sessionId: tempUpload._id.toString(),
        fileName: file.originalname,
        headers: preview.headers,
        totalRows: preview.totalRows,
        preview: preview.preview,
      };
    } catch (error) {
      cleanupFile(file.path);
      if (error instanceof ApiError) throw error;
      throw ApiError.badRequest(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Parses the full Excel file in the background and writes rows to a JSON file on disk.
   * Disk JSON is 10x faster to read than re-parsing XLSX, and avoids MongoDB's 16MB limit.
   */
  async _parseFullFileInBackground(sessionId, filePath) {
    try {
      console.log(`[Upload] Background parse started for session ${sessionId}`);
      const start = Date.now();
      const parsed = parseExcelFile(filePath);

      // Write parsed rows as a JSON file next to the original file
      const parsedFilePath = filePath.replace(/\.[^.]+$/, '_parsed.json');
      fs.writeFileSync(parsedFilePath, JSON.stringify(parsed.rows));

      await TempUpload.findByIdAndUpdate(sessionId, {
        parsedFilePath,
        totalRows: parsed.totalRows,
        parseStatus: 'ready',
      });
      console.log(`[Upload] ✅ Background parse done for ${sessionId}: ${parsed.totalRows} rows in ${Date.now() - start}ms`);
    } catch (err) {
      console.error(`[Upload] ❌ Background parse FAILED for ${sessionId}:`, err.message);
      await TempUpload.findByIdAndUpdate(sessionId, { parseStatus: 'failed' });
    }
  }

  validateSchema(headers, requiredFields = []) {
    const missing = requiredFields.filter((f) => !headers.includes(f));
    if (missing.length > 0) {
      return { valid: false, missingFields: missing };
    }
    return { valid: true, missingFields: [] };
  }
}

module.exports = new UploadService();
